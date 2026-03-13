// app/api/stripe/create-intent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

export const dynamic = 'force-dynamic';

// ================================================================
// ENV VALIDATION
// ================================================================

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const DUFFEL_TOKEN = process.env.DUFFEL_ACCESS_TOKEN;

if (!STRIPE_SECRET) {
    throw new Error(
        'STRIPE_SECRET_KEY is not set in environment variables',
    );
}

// ================================================================
// CLIENT INITIALIZATION
// ================================================================

const stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    maxNetworkRetries: 2,
});

const duffel = DUFFEL_TOKEN
    ? new Duffel({ token: DUFFEL_TOKEN })
    : null;

// ================================================================
// ZERO-DECIMAL CURRENCIES
// ================================================================

const ZERO_DECIMAL_CURRENCIES = new Set([
    'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf',
    'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd',
    'vuv', 'xaf', 'xof', 'xpf',
]);

function toStripeAmount(
    amount: number,
    currency: string,
): number {
    if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
        return Math.round(amount);
    }
    return Math.round(amount * 100);
}

function getMinAmount(currency: string): number {
    const minimums: Record<string, number> = {
        usd: 0.50,
        gbp: 0.30,
        eur: 0.50,
        jpy: 50,
        krw: 1000,
        bdt: 50,
        inr: 50,
        aed: 2,
        sar: 2,
        myr: 2,
        sgd: 0.50,
    };
    return minimums[currency] || 0.50;
}

// ================================================================
// HELPERS
// ================================================================

function errorResponse(
    message: string,
    status: number,
    code?: string,
) {
    return NextResponse.json(
        {
            success: false,
            error: message,
            ...(code && { code }),
        },
        { status },
    );
}

function isReusableIntent(
    intent: Stripe.PaymentIntent,
): boolean {
    return !['succeeded', 'canceled'].includes(
        intent.status,
    );
}

// ================================================================
// RATE LIMITER (per-IP, 10 requests/min)
// ================================================================

const rateLimitMap = new Map<
    string,
    { count: number; resetAt: number }
>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60_000;
const MAX_MAP_SIZE = 5_000;

function isRateLimited(ip: string): boolean {
    const WINDOW_MS = 60_000;
    const MAX_REQUESTS = 10;
    const now = Date.now();

    if (now - lastCleanup > CLEANUP_INTERVAL) {
        lastCleanup = now;
        for (const [key, entry] of rateLimitMap) {
            if (now > entry.resetAt) rateLimitMap.delete(key);
        }
    }

    if (!rateLimitMap.has(ip) && rateLimitMap.size >= MAX_MAP_SIZE) {
        return true;
    }

    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, {
            count: 1,
            resetAt: now + WINDOW_MS,
        });
        return false;
    }

    entry.count++;
    return entry.count > MAX_REQUESTS;
}

// ================================================================
// HELPER: Save booking with Stripe PI details
//
// Centralizes the repetitive booking save logic.
// Every time we create/replace a PaymentIntent, we:
//   1. Store the PI ID
//   2. Set paymentStatus to 'pending'
//   3. Mark clientPayWith as 'stripe'
//   4. Add admin note for audit trail
//
// This prevents forgetting clientPayWith in any branch.
// ================================================================

async function saveBookingWithPI(
    booking: any,
    paymentIntent: Stripe.PaymentIntent,
    note: string,
) {
    booking.stripePaymentIntentId = paymentIntent.id;
    booking.paymentStatus = 'pending';
    booking.clientPayWith = 'stripe'; // ✅ Track payment method

    booking.adminNotes = booking.adminNotes || [];
    booking.adminNotes.push({
        note,
        addedBy: 'stripe-create-intent',
        createdAt: new Date(),
    });

    await booking.save();
}

// ================================================================
// POST /api/stripe/create-intent
// ================================================================

export async function POST(req: NextRequest) {
    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';

    if (isRateLimited(ip)) {
        return errorResponse(
            'Too many requests. Please wait a moment.',
            429,
            'RATE_LIMITED',
        );
    }

    try {
        // ════════════════════════════════════════════
        // 1. PARSE & VALIDATE REQUEST
        // ════════════════════════════════════════════

        let body: any;
        try {
            body = await req.json();
        } catch {
            return errorResponse('Invalid JSON body', 400, 'INVALID_JSON');
        }

        const { bookingId } = body || {};

        if (!bookingId || typeof bookingId !== 'string') {
            return errorResponse(
                'bookingId is required and must be a string',
                400,
                'MISSING_BOOKING_ID',
            );
        }

        // ════════════════════════════════════════════
        // 2. FETCH BOOKING FROM DATABASE
        // ════════════════════════════════════════════

        await dbConnect();

        const booking: any = await Booking.findById(bookingId);

        if (!booking) {
            return errorResponse(
                'Booking not found',
                404,
                'BOOKING_NOT_FOUND',
            );
        }

        // ════════════════════════════════════════════
        // 3. GUARD: Status & Payment Checks
        // ════════════════════════════════════════════

        const terminalStatuses = ['issued', 'cancelled', 'expired', 'failed'];
        if (terminalStatuses.includes(booking.status)) {
            return errorResponse(
                `This booking is "${booking.status}" and cannot accept payment.`,
                400,
                'BOOKING_TERMINAL',
            );
        }

        const paidStatuses = ['authorized', 'captured', 'refunded'];
        if (paidStatuses.includes(booking.paymentStatus)) {
            return errorResponse(
                'Payment has already been processed for this booking.',
                400,
                'ALREADY_PAID',
            );
        }

        const now = new Date();

        if (booking.paymentDeadline && new Date(booking.paymentDeadline) < now) {
            booking.status = 'expired';
            booking.adminNotes = booking.adminNotes || [];
            booking.adminNotes.push({
                note: 'Auto-expired: Payment deadline passed before PaymentIntent creation.',
                addedBy: 'stripe-create-intent',
                createdAt: now,
            });
            await booking.save();

            return errorResponse(
                'The payment deadline has passed. Please create a new booking.',
                400,
                'DEADLINE_EXPIRED',
            );
        }

        // ════════════════════════════════════════════
        // 4. DUFFEL ORDER VALIDATION
        // ════════════════════════════════════════════

        if (booking.duffelOrderId && duffel) {
            try {
                const res = await duffel.orders.get(booking.duffelOrderId);
                const order: any = res.data;

                if (order.cancellation || order.cancelled_at) {
                    booking.status = 'cancelled';
                    booking.adminNotes = booking.adminNotes || [];
                    booking.adminNotes.push({
                        note: `Auto-cancelled: Airline cancelled the order (detected at payment time). cancelled_at: ${order.cancelled_at || 'N/A'}`,
                        addedBy: 'stripe-create-intent',
                        createdAt: now,
                    });
                    await booking.save();

                    return errorResponse(
                        'This booking has been cancelled by the airline. Please create a new booking.',
                        400,
                        'AIRLINE_CANCELLED',
                    );
                }

                const paymentStatus = order.payment_status || {};
                const duffelDeadline =
                    paymentStatus.payment_required_by ||
                    paymentStatus.price_guarantee_expires_at ||
                    null;

                if (duffelDeadline && new Date(duffelDeadline) < now) {
                    booking.status = 'expired';
                    booking.adminNotes = booking.adminNotes || [];
                    booking.adminNotes.push({
                        note: `Auto-expired: Duffel payment deadline passed (${duffelDeadline}).`,
                        addedBy: 'stripe-create-intent',
                        createdAt: now,
                    });
                    await booking.save();

                    return errorResponse(
                        'This airline reservation has expired. Please search again and create a new booking.',
                        400,
                        'DUFFEL_EXPIRED',
                    );
                }
            } catch (duffelError: any) {
                console.error(
                    'Duffel validation failed before PaymentIntent creation:',
                    duffelError.message,
                );

                return errorResponse(
                    'Unable to verify your airline reservation. Please try again in a moment.',
                    502,
                    'DUFFEL_VALIDATION_FAILED',
                );
            }
        }

        // ════════════════════════════════════════════
        // 5. AMOUNT & CURRENCY PREPARATION
        // ════════════════════════════════════════════

        const rawAmount = booking.pricing?.total_amount;
        const currency = (
            booking.pricing?.currency || 'USD'
        ).toLowerCase();

        if (
            typeof rawAmount !== 'number' ||
            !Number.isFinite(rawAmount) ||
            rawAmount <= 0
        ) {
            console.error('Invalid booking amount:', {
                bookingId: String(booking._id),
                bookingRef: booking.bookingReference,
                rawAmount,
            });

            return errorResponse(
                'Invalid booking amount. Please contact support.',
                500,
                'INVALID_AMOUNT',
            );
        }

        const minAmount = getMinAmount(currency);
        if (rawAmount < minAmount) {
            return errorResponse(
                `Amount too small. Minimum is ${minAmount} ${currency.toUpperCase()}.`,
                400,
                'AMOUNT_TOO_SMALL',
            );
        }

        const stripeAmount = toStripeAmount(rawAmount, currency);

        // ════════════════════════════════════════════
        // 6. STRIPE METADATA
        // ════════════════════════════════════════════

        const customerEmail = booking.contact?.email || '';
        const customerPhone = booking.contact?.phone || '';
        const route = booking.flightDetails?.route || 'N/A';
        const airline = booking.flightDetails?.airline || 'N/A';

        const metadata: Record<string, string> = {
            bookingId: String(booking._id),
            bookingRef: booking.bookingReference || '',
            customerEmail,
            customerPhone,
            route,
            airline,
            flightType: booking.flightDetails?.flightType || 'one_way',
            passengerCount: String(booking.passengers?.length || 1),
            isLiveMode: String(booking.isLiveMode === true),
            pnr: booking.pnr || '',
            duffelOrderId: booking.duffelOrderId || '',
            markup: String(booking.pricing?.markup || 0),
            paymentMethod: 'stripe', // ✅ Also in Stripe metadata for dashboard
        };

        const description = `Flight: ${route} | ${airline} | Ref: ${booking.bookingReference}`;

        // ════════════════════════════════════════════
        // 7. PAYMENT INTENT CREATION CONFIG
        //
        // Reusable config — prevents copy-paste errors
        // across the 4 different creation branches.
        // ════════════════════════════════════════════

        const piCreateParams: Stripe.PaymentIntentCreateParams = {
            amount: stripeAmount,
            currency,
            metadata,
            description,
            receipt_email: customerEmail || undefined,
            automatic_payment_methods: { enabled: true },
        };

        // ════════════════════════════════════════════
        // 8. CREATE OR REUSE PAYMENT INTENT
        // ════════════════════════════════════════════

        let paymentIntent: Stripe.PaymentIntent;

        const idempotencyKey = `pi_${booking._id}_${stripeAmount}_${currency}`;

        if (booking.stripePaymentIntentId) {
            // ── TRY EXISTING PAYMENT INTENT ──
            try {
                const existing = await stripe.paymentIntents.retrieve(
                    booking.stripePaymentIntentId,
                );

                if (isReusableIntent(existing)) {
                    if (
                        existing.amount !== stripeAmount ||
                        existing.currency !== currency
                    ) {
                        // ── Amount mismatch: cancel old, create new ──
                        console.warn('Amount mismatch on existing PI, creating new one', {
                            existingAmount: existing.amount,
                            expectedAmount: stripeAmount,
                            bookingRef: booking.bookingReference,
                        });

                        try {
                            await stripe.paymentIntents.cancel(
                                existing.id,
                                { cancellation_reason: 'abandoned' },
                            );
                        } catch {
                            // Old PI may not be cancellable
                        }

                        paymentIntent = await stripe.paymentIntents.create(
                            piCreateParams,
                            { idempotencyKey: `${idempotencyKey}_v2_${Date.now()}` },
                        );

                        // ✅ Save with clientPayWith: 'stripe'
                        await saveBookingWithPI(
                            booking,
                            paymentIntent,
                            `💳 New Stripe PI created (amount changed). PI: ${paymentIntent.id}. Old: ${existing.id}. Amount: ${rawAmount} ${currency.toUpperCase()}`,
                        );
                    } else {
                        // ── Amount matches: reuse existing PI ──
                        paymentIntent = await stripe.paymentIntents.update(
                            existing.id,
                            {
                                metadata,
                                description,
                                receipt_email: customerEmail || undefined,
                            },
                        );

                        // ✅ Ensure clientPayWith is set even on reuse
                        // (covers bookings created before this field existed)
                        if (booking.clientPayWith !== 'stripe') {
                            booking.clientPayWith = 'stripe';
                            await booking.save();
                        }
                    }
                } else {
                    // ── Terminal PI: create new ──
                    console.info(
                        `Existing PI ${existing.id} is ${existing.status}, creating new one`,
                    );

                    paymentIntent = await stripe.paymentIntents.create(
                        piCreateParams,
                        { idempotencyKey: `${idempotencyKey}_new_${Date.now()}` },
                    );

                    // ✅ Save with clientPayWith: 'stripe'
                    await saveBookingWithPI(
                        booking,
                        paymentIntent,
                        `💳 New Stripe PI created (old was ${existing.status}). PI: ${paymentIntent.id}. Amount: ${rawAmount} ${currency.toUpperCase()}`,
                    );
                }
            } catch (retrieveError: any) {
                // ── Can't retrieve old PI: create fresh ──
                console.warn(
                    'Failed to retrieve existing PaymentIntent, creating new:',
                    retrieveError.message,
                );

                paymentIntent = await stripe.paymentIntents.create(
                    piCreateParams,
                    { idempotencyKey },
                );

                // ✅ Save with clientPayWith: 'stripe'
                await saveBookingWithPI(
                    booking,
                    paymentIntent,
                    `💳 Stripe PI created (old PI unretrievable). PI: ${paymentIntent.id}. Amount: ${rawAmount} ${currency.toUpperCase()}`,
                );
            }
        } else {
            // ── NO EXISTING PI: Create fresh ──
            paymentIntent = await stripe.paymentIntents.create(
                piCreateParams,
                { idempotencyKey },
            );

            // ✅ Save with clientPayWith: 'stripe'
            await saveBookingWithPI(
                booking,
                paymentIntent,
                `💳 Stripe PI created. PI: ${paymentIntent.id}. Amount: ${rawAmount} ${currency.toUpperCase()}. Customer: ${customerEmail || 'N/A'}`,
            );
        }

        // ════════════════════════════════════════════
        // 9. RESPONSE
        // ════════════════════════════════════════════

        return NextResponse.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: rawAmount,
            currency: currency.toUpperCase(),
            paymentMethod: 'stripe', // ✅ Frontend knows which method
        });
    } catch (err: any) {
        console.error('❌ Stripe PaymentIntent creation failed:', err);

        if (err instanceof Stripe.errors.StripeError) {
            const stripeCode = err.code || 'stripe_error';
            const statusCode =
                err.statusCode && err.statusCode >= 400 && err.statusCode < 600
                    ? err.statusCode
                    : 400;

            return NextResponse.json(
                {
                    success: false,
                    error: err.message,
                    code: stripeCode,
                },
                { status: statusCode },
            );
        }

        if (err.name === 'MongoError' || err.name === 'MongoServerError') {
            return errorResponse(
                'Database error. Please try again.',
                500,
                'DATABASE_ERROR',
            );
        }

        return errorResponse(
            'Something went wrong while creating payment. Please try again.',
            500,
            'INTERNAL_ERROR',
        );
    }
}