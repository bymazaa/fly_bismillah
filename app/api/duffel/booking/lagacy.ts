// app/api/duffel/booking/route.ts

import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import { encrypt, generateBookingReference, getShortDateTime } from './utils';
import Booking from '@/models/Booking.model';
import { format, parseISO } from 'date-fns';
import { sendBookingProcessingEmail, sendNewBookingAdminNotification } from '@/app/emails/email';

// ================================================================
// CONSTANTS & CONFIG
// ================================================================

const ACTOR_BOOKING_API = 'booking-api';
const ACTOR_SYNC = 'sync-engine';

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

/**
 * Create an admin note matching the schema structure:
 * { note: String, addedBy: String, createdAt: Date }
 */
function createAdminNote(message: string, actor: string = ACTOR_BOOKING_API) {
    return {
        note: message,
        addedBy: actor,
        createdAt: new Date(),
    };
}

/**
 * Map Duffel documents to DB schema format.
 * Duffel returns 'type', but schema uses 'docType' to avoid
 * Mongoose reserved keyword conflict.
 */
function mapDocsForDb(duffelDocs: any[]) {
    return (duffelDocs || [])
        .filter((doc: any) => doc.url)
        .map((doc: any) => ({
            unique_identifier: doc.unique_identifier || '',
            docType: doc.type || 'electronic_ticket',
            url: doc.url || '',
        }));
}

/**
 * Extract flight segments from Duffel offer/order slices.
 * Maps to schema: flightDetails.segments[]
 */
function extractSegments(slices: any[]): any[] {
    if (!Array.isArray(slices)) return [];

    return slices.flatMap((slice: any) =>
        (slice.segments || []).map((seg: any) => ({
            segmentId: seg.id || null,
            carrier: seg.operating_carrier?.name || seg.marketing_carrier?.name || null,
            flightNumber: `${
                seg.operating_carrier?.iata_code || seg.marketing_carrier?.iata_code || ''
            }${seg.operating_carrier_flight_number || seg.marketing_carrier_flight_number || ''}`,
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
// RATE LIMITER (In-memory, per-instance)
// In production, use Redis-based rate limiting for multi-instance.
// ================================================================

const rateLimitMap = new Map<string, { count: number; startTime: number }>();

export function isRateLimited(ip: string): boolean {
    const windowMs = 60 * 1000;
    const maxRequests = 20;
    const now = Date.now();
    const clientData = rateLimitMap.get(ip) || {
        count: 0,
        startTime: now,
    };

    if (now - clientData.startTime > windowMs) {
        clientData.count = 1;
        clientData.startTime = now;
    } else {
        clientData.count++;
    }

    rateLimitMap.set(ip, clientData);
    return clientData.count > maxRequests;
}

// ================================================================
// PHONE VALIDATOR (Basic E.164-like validation)
// ================================================================

function validatePhoneNumber(phone: string | undefined): string | undefined {
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
// 5. Send confirmation emails
// ================================================================

export async function POST(request: Request) {
    let newBookingId: string | null = null;
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';

    if (isRateLimited(ip)) {
        return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
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

        const { offer_id, contact, passengers, payment, flight_details, pricing } = body || {};

        // ── Required Fields Check ──
        if (!offer_id || !passengers || !payment || !flight_details || !pricing) {
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
        // Verify the offer is still available and price hasn't changed
        // ==========================================================

        let validatedOffer: any;
        try {
            const offerCheck = await duffel.offers.get(offer_id);
            validatedOffer = offerCheck.data;
        } catch (error: any) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Offer expired or no longer available. Please search again.',
                    errorType: 'OFFER_EXPIRED',
                },
                { status: 400 },
            );
        }

        // Reject offers that require instant payment (can't hold)
        if (validatedOffer.payment_requirements?.requires_instant_payment) {
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

        // Validate client-sent total amount
        const customerTotalAmount = Number(pricing.total_amount);
        if (!Number.isFinite(customerTotalAmount) || customerTotalAmount <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid total amount on client side',
                    errorType: 'PRICE_INVALID',
                },
                { status: 400 },
            );
        }

        // Validate client-sent base fare (airline price before markup)
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

        // Validate Duffel offer price
        const offerAmount = Number(validatedOffer.total_amount);
        if (!Number.isFinite(offerAmount) || offerAmount <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid price information from airline. Please search again.',
                    errorType: 'OFFER_INVALID',
                },
                { status: 400 },
            );
        }

        // Price mismatch guard (tolerance: $0.01)
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

        // Route formatting for round trips
        let finalRoute = flight_details.route;
        if (
            flight_details.flightType === 'round_trip' &&
            typeof finalRoute === 'string' &&
            !finalRoute.includes('|')
        ) {
            const parts = finalRoute.split('➝').map((s: string) => s.trim());
            if (parts.length === 2) {
                finalRoute = `${parts[0]} ➝ ${parts[1]} | ${parts[1]} ➝ ${parts[0]}`;
            }
        }

        // Extract segments from validated offer for the schema
        const offerSegments = extractSegments(validatedOffer.slices || []);

        // ==========================================================
        // STEP 2: CREATE INITIAL BOOKING RECORD
        // Status: 'processing' — will be updated after Duffel response
        // ==========================================================

        const bookingRef = generateBookingReference();
        const encryptedCardNumber = encrypt(payment.cardNumber);

        const newBooking = await Booking.create({
            bookingReference: bookingRef,
            offerId: offer_id,

            contact,

            // Map passengers with proper Date types for dob/passportExpiry
            passengers: (passengers as PassengerInput[]).map((p) => ({
                id: p.id,
                type: p.type,
                title: p.title,
                firstName: p.firstName,
                lastName: p.lastName,
                gender: p.gender,
                dob: p.dob ? new Date(p.dob) : undefined,
                passportNumber: p.passportNumber || null,
                passportExpiry: p.passportExpiry ? new Date(p.passportExpiry) : null,
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
                logoUrl: validatedOffer.owner?.logo_symbol_url || null,
                segments: offerSegments,
            },

            pricing: {
                currency: pricing.currency || validatedOffer.total_currency || 'USD',
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
        // Auto-calculates title from gender/age, validates phone
        // ==========================================================

        const duffelPassengers = (passengers as PassengerInput[]).map((p) => {
            // DOB validation
            const birthDate = new Date(p.dob);
            if (Number.isNaN(birthDate.getTime())) {
                throw new Error(`Invalid date of birth for passenger ${p.firstName} ${p.lastName}`);
            }

            // Age calculation for auto-title
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // Auto title based on gender and age
            let autoTitle = 'mr';
            if (p.gender === 'male') {
                autoTitle = 'mr';
            } else {
                autoTitle = age < 12 ? 'miss' : 'ms';
            }

            // Phone validation
            const validPhone = validatePhoneNumber(p.phone || contact?.phone);

            const passengerData: any = {
                id: p.id,
                type: p.type,
                given_name: p.firstName,
                family_name: p.lastName,
                gender: p.gender === 'male' ? 'm' : 'f',
                title: autoTitle,
                born_on: p.dob,
                email: p.email || contact?.email,
                ...(validPhone && { phone_number: validPhone }),
            };

            // Passport / identity documents (required for international)
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
                        issuing_country_code: p.passportCountry || 'US',
                    },
                ];
            }

            return passengerData;
        });

        // ==========================================================
        // STEP 4: PASSENGER VALIDATION (Business Rules)
        // - At least one adult required
        // - Infants cannot exceed adults (1 infant per adult)
        // ==========================================================

        const adults = duffelPassengers.filter((p: any) => p.type === 'adult');
        const infants = duffelPassengers.filter((p: any) => p.type === 'infant_without_seat');

        if (adults.length === 0) {
            await Booking.findByIdAndUpdate(newBookingId, {
                $set: { status: 'failed' },
                $push: {
                    adminNotes: createAdminNote('Validation failed: No adult passenger provided'),
                },
            });
            return NextResponse.json(
                {
                    success: false,
                    message: 'Bookings cannot be made for children or infants without an adult.',
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

        // Link infants to their accompanying adults
        infants.forEach((infant: any, index: number) => {
            if (adults[index]) {
                adults[index].infant_passenger_id = infant.id;
            }
        });

        // Remove 'type' from Duffel payload (Duffel infers from offer)
        const finalDuffelPayload = duffelPassengers.map(({ type, ...rest }: any) => rest);

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
            console.error('Duffel Booking Error:', JSON.stringify(duffelError, null, 2));

            const raw = duffelError?.response?.data || duffelError?.meta || duffelError || {};
            const errorBody = raw.errors?.[0] || raw.error || raw.meta?.error || null;

            let errorMessage = 'Flight booking failed with airline.';
            const errCode = errorBody?.code || errorBody?.type || raw.code || undefined;

            if (errCode === 'offer_no_longer_available') {
                errorMessage =
                    'This flight is no longer available at this price. Please search again.';
            } else if (
                errCode === 'instant_payment_required' ||
                errCode === 'offer_requires_instant_payment'
            ) {
                errorMessage = 'This flight requires instant payment. Hold is not available.';
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
                        errCode === 'offer_no_longer_available' ? 'OFFER_EXPIRED' : 'API_ERROR',
                },
                { status: 400 },
            );
        }

        // ==========================================================
        // STEP 6: UPDATE BOOKING WITH DUFFEL RESPONSE
        // Confirmed hold: save PNR, pricing, deadlines, segments
        // ==========================================================

        const duffelActualCost = Number(order.data.total_amount);
        const calculatedMarkup = customerTotalAmount - duffelActualCost;

        // Extract segments from the confirmed order (may differ from offer)
        const orderSegments = extractSegments(order.data.slices || []);

        await Booking.findByIdAndUpdate(newBookingId, {
            $set: {
                duffelOrderId: order.data.id,
                pnr: order.data.booking_reference,
                paymentDeadline: order.data.payment_status.payment_required_by,
                priceExpiry: order.data.payment_status.price_guarantee_expires_at,
                pricing: {
                    currency: order.data.total_currency,
                    total_amount: customerTotalAmount,
                    markup: Number(calculatedMarkup.toFixed(2)),
                    base_amount: duffelActualCost,
                },
                isLiveMode: order.data.live_mode,
                documents: mapDocsForDb(order.data.documents || []),
                airlineInitiatedChanges: order.data.airline_initiated_changes || null,
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
        // STEP 7: SEND NOTIFICATION EMAILS
        // Non-blocking: email failure does not fail the booking
        // ==========================================================

        try {
            // Safe date parsing for email template
            let depDate: Date;
            if (typeof flight_details.departureDate === 'string') {
                depDate = parseISO(flight_details.departureDate);
            } else {
                depDate = new Date(flight_details.departureDate);
            }
            const emailDate = format(depDate, 'dd MMM, yyyy');

            const firstLeg = (finalRoute || '').split('|')[0] || finalRoute;
            const routeParts = (firstLeg || '').split('➝');
            const emailOrigin = routeParts[0]?.trim() || 'Origin';
            const emailDest = routeParts[routeParts.length - 1]?.trim() || 'Destination';

            const primaryPassenger = (passengers as PassengerInput[])[0] || ({} as PassengerInput);
            const primaryPassengerName =
                `${primaryPassenger.title || ''} ${primaryPassenger.firstName || ''} ${primaryPassenger.lastName || ''}`.trim() ||
                'Traveler';

            // Customer confirmation email
            if (contact?.email) {
                await sendBookingProcessingEmail({
                    to: contact.email,
                    customerName: primaryPassengerName,
                    bookingReference: order.data.booking_reference,
                    route: finalRoute,
                    flightDate: emailDate,
                });
            } else {
                console.warn('No contact email found, skipping customer email');
            }

            // Admin notification email
            await sendNewBookingAdminNotification({
                pnr: order.data.booking_reference,
                customerName: contact?.name || primaryPassengerName || 'Traveler',
                customerPhone: contact?.phone || primaryPassenger.phone || 'N/A',
                route: finalRoute,
                airline: flight_details.airline,
                flightDate: emailDate,
                totalAmount: customerTotalAmount,
                bookingId: newBookingId!,
            });
        } catch (emailError) {
            // Email failure is non-fatal — log and continue
            console.error('Failed to send booking emails:', emailError);
        }

        // ==========================================================
        // SUCCESS RESPONSE
        // ==========================================================

        return NextResponse.json({
            success: true,
            bookingId: newBookingId,
            reference: bookingRef,
            pnr: order.data.booking_reference,
            expiry: order.data.payment_status.payment_required_by,
        });
    } catch (error: any) {
        console.error('Global Booking Error:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            return NextResponse.json(
                {
                    success: false,
                    message: `Duplicate entry found for ${field}. Please try again.`,
                    errorType: 'DUPLICATE_ERROR',
                },
                { status: 409 },
            );
        }

        // Handle Mongoose validation error
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val: any) => val.message);
            return NextResponse.json(
                {
                    success: false,
                    message: messages[0],
                    errorType: 'VALIDATION_ERROR',
                },
                { status: 400 },
            );
        }

        // Mark booking as failed if it was already created
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
                console.error('Failed to mark booking as failed:', updateErr);
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

// ================================================================
// SYNC ENGINE
//
// Fetches latest order state from Duffel API and reconciles
// local booking record. Handles:
// - Cancellation detection (with refund details)
// - Payment deadline expiry
// - Payment status sync
// - Ticket issuance detection (documents)
// - Schedule change detection
// - Segment data sync
//
// Uses $push for adminNotes (never overwrites history)
// ================================================================

export async function syncSingleBooking(booking: any) {
    if (!booking.duffelOrderId) return booking;

    try {
        const response = await duffel.orders.get(booking.duffelOrderId);
        const orderData: any = response.data;

        const updates: any = {};
        const notesToAdd: any[] = []; // Accumulate notes, $push at the end
        let needsUpdate = false;
        const now = new Date();
        const nowIso = now.toISOString();

        const hasRemoteDocs = Array.isArray(orderData.documents) && orderData.documents.length > 0;

        const isCancelledRemote = !!orderData.cancellation || !!orderData.cancelled_at;
        const cancellation = orderData.cancellation || null;

        // ─────────────────────────────────────────────────
        // CASE A: CANCELLATION DETECTED
        // ─────────────────────────────────────────────────

        if (isCancelledRemote) {
            if (booking.status !== 'cancelled') {
                updates.status = 'cancelled';

                const cancelledAt = orderData.cancelled_at || cancellation?.cancelled_at || nowIso;

                notesToAdd.push(
                    createAdminNote(
                        `Auto-sync: Order cancelled on Duffel at ${cancelledAt}`,
                        ACTOR_SYNC,
                    ),
                );
            }

            // Store cancellation details in airlineInitiatedChanges
            updates.airlineInitiatedChanges = {
                ...(booking.airlineInitiatedChanges || {}),
                cancellation: {
                    id: cancellation?.id || null,
                    cancelled_at: orderData.cancelled_at || cancellation?.cancelled_at || null,
                    refund_amount: cancellation?.refund_amount || null,
                    refund_currency: cancellation?.refund_currency || null,
                    penalty_amount: cancellation?.penalty_amount || null,
                    penalty_currency: cancellation?.penalty_currency || null,
                    refunded_at: cancellation?.refunded_at || null,
                    raw: cancellation || null,
                },
            };

            // Payment status: refunded if refund exists, otherwise failed
            if (
                (cancellation?.refund_amount && Number(cancellation.refund_amount) > 0) ||
                cancellation?.refunded_at
            ) {
                if (booking.paymentStatus !== 'refunded') {
                    updates.paymentStatus = 'refunded';
                }
            } else if (
                booking.paymentStatus === 'pending' ||
                booking.paymentStatus === 'authorized'
            ) {
                updates.paymentStatus = 'failed';
            }

            needsUpdate = true;

            // Skip remaining checks for cancelled orders
        } else {
            // ─────────────────────────────────────────────
            // NON-CANCELLED ORDER: Check expiry, payment, docs, schedule
            // ─────────────────────────────────────────────

            const paymentStatusObj = orderData.payment_status || {};
            const paidAt = (paymentStatusObj.paid_at as string | null) || null;
            const paymentRequiredBy =
                (paymentStatusObj.payment_required_by as string | null) || null;
            const priceGuaranteeExpiresAt =
                (paymentStatusObj.price_guarantee_expires_at as string | null) || null;
            const awaitingPayment = paymentStatusObj.awaiting_payment === true;
            const remoteDeadline = paymentRequiredBy || priceGuaranteeExpiresAt;

            // ── CASE B: Payment Deadline Sync + Expiry Check ──

            if (remoteDeadline) {
                const localDeadlineIso = booking.paymentDeadline
                    ? new Date(booking.paymentDeadline).toISOString()
                    : null;

                // Sync deadline if changed on Duffel side
                if (localDeadlineIso !== remoteDeadline) {
                    updates.paymentDeadline = remoteDeadline;
                    needsUpdate = true;
                }

                // Deadline passed + not paid = expired
                if (!paidAt && remoteDeadline < nowIso && booking.status !== 'expired') {
                    updates.status = 'expired';
                    notesToAdd.push(
                        createAdminNote(
                            `Auto-sync: Booking expired. Deadline was ${remoteDeadline}`,
                            ACTOR_SYNC,
                        ),
                    );

                    if (booking.paymentStatus === 'pending') {
                        updates.paymentStatus = 'failed';
                    }
                    needsUpdate = true;
                }
            } else {
                // No payment window from Duffel
                const noPaymentWindow =
                    !paidAt &&
                    !paymentRequiredBy &&
                    !priceGuaranteeExpiresAt &&
                    awaitingPayment === false;

                if (
                    noPaymentWindow &&
                    !hasRemoteDocs &&
                    !['expired', 'cancelled', 'failed', 'issued'].includes(booking.status)
                ) {
                    updates.status = 'expired';
                    notesToAdd.push(
                        createAdminNote(
                            'Auto-sync: Hold expired (no payment window, unpaid, no documents)',
                            ACTOR_SYNC,
                        ),
                    );

                    if (booking.paymentStatus === 'pending') {
                        updates.paymentStatus = 'failed';
                    }
                    needsUpdate = true;
                }

                // Local deadline check
                if (
                    booking.paymentDeadline &&
                    new Date(booking.paymentDeadline) < now &&
                    booking.status !== 'expired'
                ) {
                    updates.status = 'expired';
                    notesToAdd.push(
                        createAdminNote(
                            `Auto-sync: Local payment deadline expired at ${new Date(booking.paymentDeadline).toISOString()}`,
                            ACTOR_SYNC,
                        ),
                    );

                    if (booking.paymentStatus === 'pending') {
                        updates.paymentStatus = 'failed';
                    }
                    needsUpdate = true;
                }
            }

            // ── CASE C: Payment Status Sync ──

            if (paidAt) {
                if (booking.paymentStatus !== 'captured') {
                    updates.paymentStatus = 'captured';
                    needsUpdate = true;
                }
            } else if (awaitingPayment) {
                if (booking.status !== 'held') {
                    updates.status = 'held';
                    needsUpdate = true;
                }
                if (booking.paymentStatus !== 'pending') {
                    updates.paymentStatus = 'pending';
                    needsUpdate = true;
                }
            }

            // ── CASE D: Ticket Issuance Check (Documents) ──

            if (hasRemoteDocs) {
                const formattedDocs = mapDocsForDb(orderData.documents);

                const hasLocalDocs =
                    Array.isArray(booking.documents) && booking.documents.length > 0;

                if (booking.status !== 'issued' || !hasLocalDocs) {
                    updates.status = 'issued';
                    updates.documents = formattedDocs;
                    updates.pnr = orderData.booking_reference || booking.pnr;

                    if (booking.paymentStatus !== 'captured') {
                        updates.paymentStatus = 'captured';
                    }

                    notesToAdd.push(
                        createAdminNote(
                            `Auto-sync: Ticket issued. PNR: ${orderData.booking_reference}. Documents: ${formattedDocs.length}`,
                            ACTOR_SYNC,
                        ),
                    );

                    needsUpdate = true;
                }
            }

            // ── CASE E: Schedule / Date Change Detection ──

            if (orderData.slices && orderData.slices.length > 0 && booking.flightDetails) {
                const firstSlice = orderData.slices[0];
                const firstSegment = firstSlice.segments[0];
                const lastSlice = orderData.slices[orderData.slices.length - 1];
                const lastSegment = lastSlice.segments[lastSlice.segments.length - 1];

                const newDepartureTime = new Date(firstSegment.departing_at).getTime();
                const newArrivalTime = new Date(lastSegment.arriving_at).getTime();

                const localDepartureTime = booking.flightDetails.departureDate
                    ? new Date(booking.flightDetails.departureDate).getTime()
                    : null;
                const localArrivalTime = booking.flightDetails.arrivalDate
                    ? new Date(booking.flightDetails.arrivalDate).getTime()
                    : null;

                // Threshold: 1 minute difference triggers update
                const depDiff =
                    localDepartureTime !== null
                        ? Math.abs(newDepartureTime - localDepartureTime)
                        : Infinity;
                const arrDiff =
                    localArrivalTime !== null ? Math.abs(newArrivalTime - localArrivalTime) : 0;

                if (depDiff > 60000 || arrDiff > 60000) {
                    console.log(`⚠️ Schedule change detected for PNR ${booking.pnr}`);

                    // Update flight details
                    updates['flightDetails.departureDate'] = firstSegment.departing_at;
                    updates['flightDetails.arrivalDate'] = lastSegment.arriving_at;

                    const carrierCode =
                        firstSegment.operating_carrier?.iata_code ||
                        firstSegment.marketing_carrier?.iata_code ||
                        '';
                    const flightNum =
                        firstSegment.operating_carrier_flight_number ||
                        firstSegment.marketing_carrier_flight_number ||
                        '';

                    updates['flightDetails.flightNumber'] = `${carrierCode}${flightNum}`;
                    updates['flightDetails.duration'] = firstSlice.duration;

                    // Sync segments from the latest order data
                    updates['flightDetails.segments'] = extractSegments(orderData.slices);

                    // Log change details
                    updates.airlineInitiatedChanges = {
                        ...(booking.airlineInitiatedChanges || {}),
                        lastSyncAt: new Date(),
                        previousDepartureDate: booking.flightDetails.departureDate,
                        previousArrivalDate: booking.flightDetails.arrivalDate,
                        newDepartureDate: firstSegment.departing_at,
                        newArrivalDate: lastSegment.arriving_at,
                    };

                    notesToAdd.push(
                        createAdminNote(
                            `Schedule change detected. Old departure: ${booking.flightDetails.departureDate}. New: ${firstSegment.departing_at}`,
                            ACTOR_SYNC,
                        ),
                    );

                    needsUpdate = true;
                }
            }
        }

        // ─────────────────────────────────────────────────
        // DATABASE WRITE (Single atomic update)
        // Uses $set for field updates + $push for admin notes
        // timestamps: true handles updatedAt automatically
        // ─────────────────────────────────────────────────

        if (needsUpdate) {
            console.log(`🔄 Syncing ${booking.pnr || booking._id}: Applying updates`);

            const updateOps: any = { $set: updates };

            if (notesToAdd.length > 0) {
                updateOps.$push = {
                    adminNotes: { $each: notesToAdd },
                };
            }

            const updatedBooking = await Booking.findByIdAndUpdate(booking._id, updateOps, {
                new: true,
            }).lean();

            return updatedBooking;
        }

        return booking;
    } catch (error) {
        console.error(`❌ Sync failed for ${booking.pnr || booking._id}:`, error);
        return booking;
    }
}
