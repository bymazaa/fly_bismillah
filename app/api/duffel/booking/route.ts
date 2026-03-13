// app/api/duffel/booking/route.ts

import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import { encrypt, generateBookingReference, getShortDateTime } from './utils';
import Booking from '@/models/Booking.model';

// ================================================================
// CONSTANTS & CONFIG
// ================================================================

const ACTOR_BOOKING_API = 'booking-api';

const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

// ================================================================
// TYPE DEFINITIONS
// ================================================================

interface PassengerInput {
    id: string;
    type: 'adult' | 'child' | 'infant_without_seat';
    title?: string;
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    dob: string;
    email?: string;
    phone?: string;
    passportNumber?: string;
    passportExpiry?: string;
    passportCountry?: string;
}

// ================================================================
// HELPERS: Schema-compliant data transformers
// ================================================================

function createAdminNote(message: string, actor: string = ACTOR_BOOKING_API) {
    return {
        note: message,
        addedBy: actor,
        createdAt: new Date(),
    };
}

function mapDocsForDb(duffelDocs: any[]) {
    return (duffelDocs || [])
        .filter((doc: any) => doc.url)
        .map((doc: any) => ({
            unique_identifier: doc.unique_identifier || '',
            docType: doc.type || 'electronic_ticket',
            url: doc.url || '',
        }));
}

function extractSegments(slices: any[]): any[] {
    if (!Array.isArray(slices)) return [];

    return slices.flatMap((slice: any) =>
        (slice.segments || []).map((seg: any) => ({
            segmentId: seg.id || null,
            carrier:
                seg.operating_carrier?.name ||
                seg.marketing_carrier?.name ||
                null,
            flightNumber: `${
                seg.operating_carrier?.iata_code ||
                seg.marketing_carrier?.iata_code ||
                ''
            }${
                seg.operating_carrier_flight_number ||
                seg.marketing_carrier_flight_number ||
                ''
            }`,
            origin: seg.origin?.iata_code || null,
            destination: seg.destination?.iata_code || null,
            departureAt: seg.departing_at || null,
            arrivingAt: seg.arriving_at || null,
            duration: seg.duration || null,
            cabin: seg.passengers?.[0]?.cabin_class || 'economy',
        })),
    );
}

// ================================================================
// RATE LIMITER — Sliding Window Log + Burst Protection
//
// Features:
//  • Sliding window (per-minute) — accurate across boundaries
//  • Burst guard (per-10s) — prevents rapid-fire abuse
//  • Auto-cleanup of stale entries every 5 minutes
//  • Memory cap — max 10 000 tracked IPs
//  • IP normalization — handles X-Forwarded-For chains
//  • Returns retryAfterMs for Retry-After header
//
// ⚠️ In-memory: resets on cold start / redeploy.
//    For multi-instance production, swap to Redis (ioredis).
// ================================================================

interface RateLimitEntry {
    timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_CONFIG = {
    windowMs: 60 * 1000, // 1 minute
    maxPerWindow: 10, // 10 booking attempts / min
    burstWindowMs: 10 * 1000, // 10 seconds
    maxBurst: 3, // 3 booking attempts / 10 s
    maxMapSize: 10_000, // memory guard
    cleanupIntervalMs: 5 * 60 * 1000, // purge stale every 5 min
};

let lastCleanupAt = Date.now();

/** Remove IPs with no recent activity */
function cleanupStaleEntries() {
    const now = Date.now();
    if (now - lastCleanupAt < RATE_CONFIG.cleanupIntervalMs) return;
    lastCleanupAt = now;

    for (const [ip, entry] of rateLimitMap.entries()) {
        const fresh = entry.timestamps.filter(
            (t) => now - t < RATE_CONFIG.windowMs,
        );
        if (fresh.length === 0) {
            rateLimitMap.delete(ip);
        } else {
            entry.timestamps = fresh;
        }
    }
}

/** Normalize proxy-chained IPs → take first real client IP */
function normalizeIp(raw: string): string {
    return (raw.split(',')[0] || 'unknown').trim();
}

export function checkRateLimit(rawIp: string): {
    limited: boolean;
    retryAfterMs?: number;
} {
    cleanupStaleEntries();

    const ip = normalizeIp(rawIp);
    const now = Date.now();

    // Memory guard: if map is full and this is a new IP, reject
    if (!rateLimitMap.has(ip) && rateLimitMap.size >= RATE_CONFIG.maxMapSize) {
        return { limited: true, retryAfterMs: RATE_CONFIG.windowMs };
    }

    const entry = rateLimitMap.get(ip) || { timestamps: [] };

    // Prune timestamps outside the main window
    entry.timestamps = entry.timestamps.filter(
        (t) => now - t < RATE_CONFIG.windowMs,
    );

    // ── Burst check (short window) ──
    const burstHits = entry.timestamps.filter(
        (t) => now - t < RATE_CONFIG.burstWindowMs,
    );
    if (burstHits.length >= RATE_CONFIG.maxBurst) {
        rateLimitMap.set(ip, entry);
        const oldest = burstHits[0];
        return {
            limited: true,
            retryAfterMs: RATE_CONFIG.burstWindowMs - (now - oldest),
        };
    }

    // ── Window check (main window) ──
    if (entry.timestamps.length >= RATE_CONFIG.maxPerWindow) {
        rateLimitMap.set(ip, entry);
        const oldest = entry.timestamps[0];
        return {
            limited: true,
            retryAfterMs: RATE_CONFIG.windowMs - (now - oldest),
        };
    }

    // ── Allow ──
    entry.timestamps.push(now);
    rateLimitMap.set(ip, entry);
    return { limited: false };
}

// ================================================================
// PHONE VALIDATOR (Basic E.164-like)
// ================================================================

function validatePhoneNumber(
    phone: string | undefined,
): string | undefined {
    if (!phone) return undefined;
    const cleaned = phone.trim().replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{10,17}$/.test(cleaned)) return undefined;
    return cleaned;
}

// ================================================================
// POST /api/duffel/booking
//
// Creates a new flight booking via Duffel "pay_later" flow:
// 1. Validate offer & price
// 2. Create local booking record (status: processing)
// 3. Call Duffel API to create hold order
// 4. Update booking with Duffel response (status: held)
//
// NOTE: Confirmation emails are NOT sent here.
//       They are dispatched from the webhook handler on
//       the `order.created` event — ensuring we only email
//       after Duffel has fully acknowledged the order.
// ================================================================

export async function POST(request: Request) {
    let newBookingId: string | null = null;
    const ip =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown-ip';

    // ── Rate Limit ──
    const rl = checkRateLimit(ip);
    if (rl.limited) {
        const retryAfter = Math.ceil((rl.retryAfterMs || 60_000) / 1000);
        return NextResponse.json(
            {
                success: false,
                message: `Too many requests. Please wait ${retryAfter} seconds.`,
                errorType: 'RATE_LIMITED',
            },
            {
                status: 429,
                headers: { 'Retry-After': String(retryAfter) },
            },
        );
    }

    try {
        await dbConnect();

        // ── Parse Request Body ──
        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, message: 'Invalid JSON body' },
                { status: 400 },
            );
        }

        const {
            offer_id,
            contact,
            passengers,
            payment,
            flight_details,
            pricing,
        } = body || {};

        // ── Required Fields Check ──
        if (
            !offer_id ||
            !passengers ||
            !payment ||
            !flight_details ||
            !pricing
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Missing required booking fields',
                },
                { status: 400 },
            );
        }

        if (!Array.isArray(passengers) || passengers.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'At least one passenger is required',
                    errorType: 'VALIDATION_ERROR',
                },
                { status: 400 },
            );
        }

        // ==========================================================
        // STEP 0: OFFER VALIDATION & PRICE CHECK
        // ==========================================================

        let validatedOffer: any;
        try {
            const offerCheck = await duffel.offers.get(offer_id);
            validatedOffer = offerCheck.data;
        } catch (error: any) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Offer expired or no longer available. Please search again.',
                    errorType: 'OFFER_EXPIRED',
                },
                { status: 400 },
            );
        }

        if (
            validatedOffer.payment_requirements?.requires_instant_payment
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'This flight requires instant payment and cannot be held. Please use instant booking.',
                    errorType: 'INSTANT_PAYMENT_REQUIRED',
                },
                { status: 400 },
            );
        }

        const customerTotalAmount = Number(pricing.total_amount);
        if (
            !Number.isFinite(customerTotalAmount) ||
            customerTotalAmount <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid total amount on client side',
                    errorType: 'PRICE_INVALID',
                },
                { status: 400 },
            );
        }

        const clientBaseFare = Number(pricing.base_fare);
        if (!Number.isFinite(clientBaseFare) || clientBaseFare <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid base fare on client side',
                    errorType: 'PRICE_INVALID',
                },
                { status: 400 },
            );
        }

        const offerAmount = Number(validatedOffer.total_amount);
        if (!Number.isFinite(offerAmount) || offerAmount <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Invalid price information from airline. Please search again.',
                    errorType: 'OFFER_INVALID',
                },
                { status: 400 },
            );
        }

        if (Math.abs(clientBaseFare - offerAmount) > 0.01) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Price has changed or is inconsistent. Please refresh and search again.',
                    errorType: 'PRICE_MISMATCH',
                },
                { status: 400 },
            );
        }

        // ==========================================================
        // STEP 1: PREPARE FLIGHT DETAILS
        // ==========================================================

        let finalRoute = flight_details.route;
        if (
            flight_details.flightType === 'round_trip' &&
            typeof finalRoute === 'string' &&
            !finalRoute.includes('|')
        ) {
            const parts = finalRoute
                .split('➝')
                .map((s: string) => s.trim());
            if (parts.length === 2) {
                finalRoute = `${parts[0]} ➝ ${parts[1]} | ${parts[1]} ➝ ${parts[0]}`;
            }
        }

        const offerSegments = extractSegments(
            validatedOffer.slices || [],
        );

        // ==========================================================
        // STEP 2: CREATE INITIAL BOOKING RECORD (processing)
        // ==========================================================

        const bookingRef = generateBookingReference();
        const encryptedCardNumber = encrypt(payment.cardNumber);

        const newBooking = await Booking.create({
            bookingReference: bookingRef,
            offerId: offer_id,

            contact,

            passengers: (passengers as PassengerInput[]).map((p) => ({
                id: p.id,
                type: p.type,
                title: p.title,
                firstName: p.firstName,
                lastName: p.lastName,
                gender: p.gender,
                dob: p.dob ? new Date(p.dob) : undefined,
                passportNumber: p.passportNumber || null,
                passportExpiry: p.passportExpiry
                    ? new Date(p.passportExpiry)
                    : null,
                passportCountry: p.passportCountry || undefined,
            })),

            flightDetails: {
                airline: flight_details.airline,
                flightNumber: flight_details.flightNumber,
                route: finalRoute,
                departureDate: flight_details.departureDate,
                arrivalDate: flight_details.arrivalDate,
                duration: flight_details.duration,
                flightType: flight_details.flightType,
                logoUrl:
                    validatedOffer.owner?.logo_symbol_url || null,
                segments: offerSegments,
            },

            pricing: {
                currency:
                    pricing.currency ||
                    validatedOffer.total_currency ||
                    'USD',
                total_amount: customerTotalAmount,
                markup: 0,
                base_amount: offerAmount,
            },

            paymentInfo: {
                cardName: payment.cardName,
                cardNumber: encryptedCardNumber,
                expiryDate: payment.expiryDate,
                billingAddress: payment.billingAddress,
            },

            documents: [],
            airlineInitiatedChanges: null,
            adminNotes: [],
            status: 'processing',
            isLiveMode: false,
        });

        newBookingId = newBooking._id.toString();

        // ==========================================================
        // STEP 3: BUILD DUFFEL PASSENGER PAYLOAD
        // ==========================================================

        const duffelPassengers = (passengers as PassengerInput[]).map(
            (p) => {
                const birthDate = new Date(p.dob);
                if (Number.isNaN(birthDate.getTime())) {
                    throw new Error(
                        `Invalid date of birth for passenger ${p.firstName} ${p.lastName}`,
                    );
                }

                const today = new Date();
                let age =
                    today.getFullYear() - birthDate.getFullYear();
                const m =
                    today.getMonth() - birthDate.getMonth();
                if (
                    m < 0 ||
                    (m === 0 &&
                        today.getDate() < birthDate.getDate())
                ) {
                    age--;
                }

                let autoTitle = 'mr';
                if (p.gender === 'male') {
                    autoTitle = 'mr';
                } else {
                    autoTitle = age < 12 ? 'miss' : 'ms';
                }

                const validPhone = validatePhoneNumber(
                    p.phone || contact?.phone,
                );

                const passengerData: any = {
                    id: p.id,
                    type: p.type,
                    given_name: p.firstName,
                    family_name: p.lastName,
                    gender: p.gender === 'male' ? 'm' : 'f',
                    title: autoTitle,
                    born_on: p.dob,
                    email: p.email || contact?.email,
                    ...(validPhone && {
                        phone_number: validPhone,
                    }),
                };

                if (p.passportNumber) {
                    if (p.passportExpiry) {
                        const expDate = new Date(p.passportExpiry);
                        if (Number.isNaN(expDate.getTime())) {
                            throw new Error(
                                `Invalid passport expiry date for ${p.firstName} ${p.lastName}`,
                            );
                        }
                    }

                    passengerData.identity_documents = [
                        {
                            unique_identifier: `ID-${Math.random().toString(36).substr(2, 9)}`,
                            type: 'passport',
                            number: p.passportNumber,
                            expires_on: p.passportExpiry,
                            issuing_country_code:
                                p.passportCountry || 'US',
                        },
                    ];
                }

                return passengerData;
            },
        );

        // ==========================================================
        // STEP 4: PASSENGER VALIDATION (Business Rules)
        // ==========================================================

        const adults = duffelPassengers.filter(
            (p: any) => p.type === 'adult',
        );
        const infants = duffelPassengers.filter(
            (p: any) => p.type === 'infant_without_seat',
        );

        if (adults.length === 0) {
            await Booking.findByIdAndUpdate(newBookingId, {
                $set: { status: 'failed' },
                $push: {
                    adminNotes: createAdminNote(
                        'Validation failed: No adult passenger provided',
                    ),
                },
            });
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Bookings cannot be made for children or infants without an adult.',
                    errorType: 'VALIDATION_ERROR',
                },
                { status: 400 },
            );
        }

        if (infants.length > adults.length) {
            await Booking.findByIdAndUpdate(newBookingId, {
                $set: { status: 'failed' },
                $push: {
                    adminNotes: createAdminNote(
                        `Validation failed: ${infants.length} infants but only ${adults.length} adults`,
                    ),
                },
            });
            return NextResponse.json(
                {
                    success: false,
                    message: `Not enough adults. You have ${infants.length} infants but only ${adults.length} adults.`,
                    errorType: 'VALIDATION_ERROR',
                },
                { status: 400 },
            );
        }

        infants.forEach((infant: any, index: number) => {
            if (adults[index]) {
                adults[index].infant_passenger_id = infant.id;
            }
        });

        const finalDuffelPayload = duffelPassengers.map(
            ({ type, ...rest }: any) => rest,
        );

        // ==========================================================
        // STEP 5: CREATE DUFFEL ORDER (pay_later / hold)
        // ==========================================================

        let order;
        try {
            order = await duffel.orders.create({
                type: 'pay_later',
                selected_offers: [offer_id],
                passengers: finalDuffelPayload,
            });
        } catch (duffelError: any) {
            console.error(
                'Duffel Booking Error:',
                JSON.stringify(duffelError, null, 2),
            );

            const raw =
                duffelError?.response?.data ||
                duffelError?.meta ||
                duffelError ||
                {};
            const errorBody =
                raw.errors?.[0] ||
                raw.error ||
                raw.meta?.error ||
                null;

            let errorMessage =
                'Flight booking failed with airline.';
            const errCode =
                errorBody?.code ||
                errorBody?.type ||
                raw.code ||
                undefined;

            if (errCode === 'offer_no_longer_available') {
                errorMessage =
                    'This flight is no longer available at this price. Please search again.';
            } else if (
                errCode === 'instant_payment_required' ||
                errCode === 'offer_requires_instant_payment'
            ) {
                errorMessage =
                    'This flight requires instant payment. Hold is not available.';
            } else if (errorBody?.message) {
                errorMessage = errorBody.message;
            }

            if (newBookingId) {
                await Booking.findByIdAndUpdate(newBookingId, {
                    $set: { status: 'failed' },
                    $push: {
                        adminNotes: createAdminNote(
                            `Duffel API error. Code: ${errCode || 'unknown'}. Message: ${errorMessage}`,
                        ),
                    },
                });
            }

            return NextResponse.json(
                {
                    success: false,
                    message: errorMessage,
                    code: errCode,
                    errorType:
                        errCode === 'offer_no_longer_available'
                            ? 'OFFER_EXPIRED'
                            : 'API_ERROR',
                },
                { status: 400 },
            );
        }

        // ==========================================================
        // STEP 6: UPDATE BOOKING WITH DUFFEL RESPONSE
        // ==========================================================

        const duffelActualCost = Number(order.data.total_amount);
        const calculatedMarkup =
            customerTotalAmount - duffelActualCost;

        const orderSegments = extractSegments(
            order.data.slices || [],
        );

        await Booking.findByIdAndUpdate(newBookingId, {
            $set: {
                duffelOrderId: order.data.id,
                pnr: order.data.booking_reference,
                paymentDeadline:
                    order.data.payment_status.payment_required_by,
                priceExpiry:
                    order.data.payment_status
                        .price_guarantee_expires_at,
                pricing: {
                    currency: order.data.total_currency,
                    total_amount: customerTotalAmount,
                    markup: Number(calculatedMarkup.toFixed(2)),
                    base_amount: duffelActualCost,
                },
                isLiveMode: order.data.live_mode,
                documents: mapDocsForDb(
                    order.data.documents || [],
                ),
                airlineInitiatedChanges:
                    order.data.airline_initiated_changes || null,
                status: 'held',
                'flightDetails.segments': orderSegments,
            },
            $push: {
                adminNotes: createAdminNote(
                    `Order created successfully. Duffel Order: ${order.data.id}. PNR: ${order.data.booking_reference}. Payment deadline: ${getShortDateTime(order.data.payment_status.payment_required_by as any) || 'N/A'}`,
                ),
            },
        });

        // ==========================================================
        // SUCCESS RESPONSE
        //
        // Confirmation emails are sent by the webhook handler
        // when Duffel fires the `order.created` event.
        // ==========================================================

        return NextResponse.json({
            success: true,
            bookingId: newBookingId,
            reference: bookingRef,
            pnr: order.data.booking_reference,
            expiry:
                order.data.payment_status.payment_required_by,
        });
    } catch (error: any) {
        console.error('Global Booking Error:', error);

        if (error.code === 11000) {
            const field =
                Object.keys(error.keyPattern || {})[0] || 'field';
            return NextResponse.json(
                {
                    success: false,
                    message: `Duplicate entry found for ${field}. Please try again.`,
                    errorType: 'DUPLICATE_ERROR',
                },
                { status: 409 },
            );
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(
                (val: any) => val.message,
            );
            return NextResponse.json(
                {
                    success: false,
                    message: messages[0],
                    errorType: 'VALIDATION_ERROR',
                },
                { status: 400 },
            );
        }

        if (newBookingId) {
            try {
                await Booking.findByIdAndUpdate(newBookingId, {
                    $set: { status: 'failed' },
                    $push: {
                        adminNotes: createAdminNote(
                            `Unexpected error: ${error.message || 'Unknown error'}`,
                        ),
                    },
                });
            } catch (updateErr) {
                console.error(
                    'Failed to mark booking as failed:',
                    updateErr,
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Internal Server Error',
                errorType: 'SERVER_ERROR',
            },
            { status: 500 },
        );
    }
}

