// app/api/dashboard/bookings/[id]/route.ts
//
// ════════════════════════════════════════════════════════════════
// PRODUCTION-READY — All known bugs fixed (2025)
//
// FIXES APPLIED:
//   ✅ FIX 1 — normalizeDocsForResponse removed.
//              Response uses 'docType' everywhere (matches DB model).
//              No field rename confusion between routes.
//
//   ✅ FIX 2 — Expiry check uses ONLY payment_required_by.
//              price_guarantee_expires_at is synced to priceExpiry
//              field only — it no longer triggers booking expiry.
//
//   ✅ FIX 3 — docsForMatching is empty [] when sync failed.
//              Prevents single-doc fallback from assigning one
//              ticket number to ALL passengers incorrectly.
//
//   ✅ FIX 4 — adminNotes.createdAt always .toISOString() string.
//              Prevents React parseISO() crash on Date objects.
//
//   ✅ FIX 5 — timings.priceExpiry added to response.
//
//   ✅ FIX 6 — retryCount + canRetry added to response so admin
//              UI can correctly disable "Issue Ticket" button.
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import mongoose from 'mongoose';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { decrypt, getShortDateTime } from '../../../duffel/booking/utils';
import { hasPermission } from '@/app/api/lib/auth';
import { title } from 'process';

const duffelToken = process.env.DUFFEL_ACCESS_TOKEN;
const duffel = new Duffel({ token: duffelToken || '' });

export const dynamic = 'force-dynamic';

const ACTOR = 'details-sync';

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function createAdminNote(message: string) {
    return {
        note:      message,
        addedBy:   ACTOR,
        createdAt: new Date(),
    };
}

// ✅ FIX 1: Removed normalizeDocsForResponse().
//    All documents in DB are stored with 'docType' (matches Booking.model).
//    Duffel live docs are mapped here to also use 'docType'.
//    Admin page should check doc.docType, NOT doc.type.
function mapDuffelDocsToDb(duffelDocs: any[]) {
    return (duffelDocs || []).map((doc: any) => ({
        unique_identifier: doc.unique_identifier || '',
        docType:           doc.type              || 'electronic_ticket',
        url:               doc.url               || '',
        // passenger linking fields — kept for ticket matching
        ...(doc.passenger_ids && { passenger_ids: doc.passenger_ids }),
        ...(doc.passenger     && { passenger: doc.passenger }),
    }));
}

// ════════════════════════════════════════════════════════════════
// BAGGAGE HELPERS
// ════════════════════════════════════════════════════════════════

interface BaggageDetail {
    type:              string;
    label:             string;
    icon:              string;
    quantity:          number;
    weightPerBag:      number;
    totalWeight:       number;
    weightUnit:        string;
    isApprox:          boolean;
    hasExplicitWeight: boolean;
    isIncluded:        boolean;
    displayText:       string;
}

interface BaggageInfo {
    summary:            string;
    details:            BaggageDetail[];
    hasChecked:         boolean;
    hasCarryOn:         boolean;
    hasPersonalItem:    boolean;
    totalWeight:        number;
    totalWeightDisplay: string;
    includedCount:      number;
}

const BAGGAGE_CONFIG: Record<string, { label: string; icon: string; defaultWeight: number }> = {
    checked:       { label: 'Checked Bag',  icon: '🧳', defaultWeight: 23 },
    carry_on:      { label: 'Carry-On',      icon: '👜', defaultWeight: 7  },
    personal_item: { label: 'Personal Item', icon: '🎒', defaultWeight: 5  },
};

function getSegmentBaggageInfo(segment: any): BaggageInfo {
    const emptyResult: BaggageInfo = {
        summary: 'No Baggage Info', details: [], hasChecked: false,
        hasCarryOn: false, hasPersonalItem: false, totalWeight: 0,
        totalWeightDisplay: 'N/A', includedCount: 0,
    };

    try {
        const bags = segment?.passengers?.[0]?.baggages;
        if (!Array.isArray(bags) || bags.length === 0) return emptyResult;

        const details: BaggageDetail[] = bags.map((bag: any) => {
            const config = BAGGAGE_CONFIG[bag.type] || {
                label:         bag.type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Other Bag',
                icon:          '📦',
                defaultWeight: 0,
            };

            const qty               = bag.quantity || 0;
            const hasExplicitWeight = bag.weight !== undefined && bag.weight !== null;
            const weightPerBag      = hasExplicitWeight ? Number(bag.weight) : config.defaultWeight;
            const totalWeight       = qty * weightPerBag;
            const isApprox          = !hasExplicitWeight && config.defaultWeight > 0;
            const weightUnit        = bag.weightUnit || bag.weight_unit || 'kg';

            const displayText = qty > 0
                ? (totalWeight > 0
                    ? `${qty} × ${config.label} (${totalWeight}${weightUnit}${isApprox ? ' approx' : ''})`
                    : `${qty} × ${config.label}`)
                : `No ${config.label}`;

            return { type: bag.type, label: config.label, icon: config.icon, quantity: qty,
                     weightPerBag, totalWeight, weightUnit, isApprox, hasExplicitWeight,
                     isIncluded: qty > 0, displayText };
        });

        const hasChecked      = details.some((d) => d.type === 'checked'       && d.quantity > 0);
        const hasCarryOn      = details.some((d) => d.type === 'carry_on'      && d.quantity > 0);
        const hasPersonalItem = details.some((d) => d.type === 'personal_item' && d.quantity > 0);
        const includedBags    = details.filter((d) => d.isIncluded);
        const summary         = includedBags.length > 0
            ? includedBags.map((d) => d.displayText).join(' + ')
            : 'No Baggage Included';
        const totalWeight     = includedBags.reduce((sum, d) => sum + d.totalWeight, 0);
        const hasAnyApprox    = includedBags.some((d) => d.isApprox);

        return {
            summary, details, hasChecked, hasCarryOn, hasPersonalItem,
            totalWeight,
            totalWeightDisplay: totalWeight > 0
                ? `${totalWeight}kg${hasAnyApprox ? ' approx' : ''} total`
                : 'N/A',
            includedCount: includedBags.length,
        };
    } catch {
        return { summary: 'Check Baggage Rules', details: [], hasChecked: false,
                 hasCarryOn: false, hasPersonalItem: false, totalWeight: 0,
                 totalWeightDisplay: 'N/A', includedCount: 0 };
    }
}

function getTripBaggageInfo(slices: any[]): BaggageInfo {
    try {
        const firstSegment = slices?.[0]?.segments?.[0];
        if (!firstSegment) {
            return { summary: 'No Baggage Info', details: [], hasChecked: false,
                     hasCarryOn: false, hasPersonalItem: false, totalWeight: 0,
                     totalWeightDisplay: 'N/A', includedCount: 0 };
        }
        return getSegmentBaggageInfo(firstSegment);
    } catch {
        return { summary: 'Check Baggage Rules', details: [], hasChecked: false,
                 hasCarryOn: false, hasPersonalItem: false, totalWeight: 0,
                 totalWeightDisplay: 'N/A', includedCount: 0 };
    }
}

// ════════════════════════════════════════════════════════════════
// Terminal states — never overridden by auto-sync logic
// ════════════════════════════════════════════════════════════════
const TERMINAL_STATES = ['expired', 'cancelled', 'failed', 'issued'];

// ════════════════════════════════════════════════════════════════
// GET /api/dashboard/bookings/[id]
// ════════════════════════════════════════════════════════════════

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await hasPermission('booking', 'view');
    if (!auth.success) return auth.response;

    try {
        const { id } = await params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid Booking ID format' },
                { status: 400 },
            );
        }

        await dbConnect();
        const booking: any = await Booking.findById(id).lean();

        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Booking not found' },
                { status: 404 },
            );
        }

        if (!booking.duffelOrderId) {
            return NextResponse.json(
                { success: false, message: 'No Duffel Order ID found' },
                { status: 400 },
            );
        }

        // ════════════════════════════════════════════════════════
        // DUFFEL SYNC — SAFE VERSION
        //
        //   ✅ Documents        → always sync (harmless)
        //   ✅ PNR              → always sync (harmless)
        //   ✅ Cancellation     → always sync (important)
        //   ✅ paymentDeadline  → payment_required_by only
        //   ✅ priceExpiry      → price_guarantee_expires_at only
        //
        //   ✅ FIX 2: Expiry check uses ONLY payment_required_by.
        //             price_guarantee_expires_at NEVER triggers expiry.
        //
        //   ⚠️ status='issued'  → ONLY if paymentStatus === 'captured'
        //   ⚠️ status='expired' → ONLY via payment_required_by
        //   ❌ paymentStatus    → NEVER override (except pending→failed on expiry)
        //   ❌ emailSent        → NEVER touch here
        //
        //   On sync failure: duffelOrder stays null → DB fallbacks used.
        // ════════════════════════════════════════════════════════

        let duffelOrder: any        = null;
        let duffelSyncFailed        = false;

        // ✅ FIX 1: finalDocuments keeps docType as-is from DB (no renaming)
        let finalDocuments: any[]   = booking.documents || [];
        let finalPNR: string | null = booking.pnr       || null;
        let finalBooking: any       = booking;

        try {
            const res   = await duffel.orders.get(booking.duffelOrderId);
            duffelOrder = res.data;

            const rawDuffelDocs     = duffelOrder.documents || [];
            const newPNR            = duffelOrder.booking_reference || booking.pnr;
            const cancellation      = duffelOrder.cancellation      || null;
            const isCancelledRemote = !!cancellation || !!duffelOrder.cancelled_at;

            const updates: any      = {};
            const notesToAdd: any[] = [];
            let needsUpdate         = false;

            // ────────────────────────────────────────────────────
            // CASE 1: CANCELLED on Duffel
            // ────────────────────────────────────────────────────
            if (isCancelledRemote) {
                const cancelledAt =
                    duffelOrder.cancelled_at    ||
                    cancellation?.cancelled_at  ||
                    new Date().toISOString();

                if (booking.status !== 'cancelled') {
                    updates.status = 'cancelled';
                    notesToAdd.push(createAdminNote(
                        `🔄 Auto-sync: Cancelled on Duffel at ${getShortDateTime(cancelledAt)}`,
                    ));
                }

                if (
                    (cancellation?.refund_amount && Number(cancellation.refund_amount) > 0) ||
                    cancellation?.refunded_at
                ) {
                    if (booking.paymentStatus !== 'refunded') {
                        updates.paymentStatus = 'refunded';
                    }
                }

                updates.airlineInitiatedChanges = {
                    ...(booking.airlineInitiatedChanges || {}),
                    cancellation: {
                        id:               cancellation?.id               || null,
                        cancelled_at:     cancelledAt,
                        refund_amount:    cancellation?.refund_amount    || null,
                        refund_currency:  cancellation?.refund_currency  || null,
                        penalty_amount:   cancellation?.penalty_amount   || null,
                        penalty_currency: cancellation?.penalty_currency || null,
                        refunded_at:      cancellation?.refunded_at      || null,
                        raw:              cancellation                   || null,
                    },
                };

                if (rawDuffelDocs.length > 0) {
                    updates.documents = mapDuffelDocsToDb(rawDuffelDocs);
                    updates.pnr       = newPNR;
                }

                needsUpdate = true;
            }

            // ────────────────────────────────────────────────────
            // CASE 2: NOT CANCELLED — Normal sync
            // ────────────────────────────────────────────────────
            else {
                // Documents & status sync
                if (rawDuffelDocs.length > 0) {
                    updates.documents = mapDuffelDocsToDb(rawDuffelDocs);
                    updates.pnr       = newPNR;
                    needsUpdate       = true;

                    const hasLocalDocs =
                        Array.isArray(booking.documents) &&
                        booking.documents.length > 0;

                    if (!hasLocalDocs) {
                        notesToAdd.push(createAdminNote(
                            `📄 Documents synced from Duffel (${rawDuffelDocs.length} docs). PNR: ${newPNR}`,
                        ));
                    }

                    // Status → issued ONLY if payment confirmed
                    if (booking.status !== 'issued' && booking.paymentStatus === 'captured') {
                        updates.status = 'issued';
                        notesToAdd.push(createAdminNote(
                            `🔄 Auto-sync: Status → issued. PNR: ${newPNR}. Docs: ${rawDuffelDocs.length}. Payment was already captured.`,
                        ));
                    }
                    // ❌ paymentStatus — NEVER override here
                    // ❌ emailSent     — NEVER touch here
                }

                // ✅ FIX 2: Separate payment deadline from price expiry
                const paymentStatusObj = duffelOrder.payment_status || {};

                // payment_required_by → paymentDeadline (used for expiry check)
                const remotePaymentDeadline =
                    paymentStatusObj.payment_required_by || null;

                // price_guarantee_expires_at → priceExpiry ONLY (NEVER used for expiry check)
                const remotePriceExpiry =
                    paymentStatusObj.price_guarantee_expires_at || null;

                // Sync paymentDeadline if changed
                if (remotePaymentDeadline) {
                    const remoteDate = new Date(remotePaymentDeadline);
                    const localDate  = booking.paymentDeadline
                        ? new Date(booking.paymentDeadline)
                        : null;

                    const isDifferent =
                        !localDate ||
                        Math.abs(remoteDate.getTime() - localDate.getTime()) > 1000;

                    if (isDifferent) {
                        updates.paymentDeadline = remoteDate;
                        needsUpdate             = true;
                        notesToAdd.push(createAdminNote(
                            `🕐 Payment deadline synced: ${remotePaymentDeadline}${localDate ? ` (was: ${localDate.toISOString()})` : ' (new)'}`,
                        ));
                    }
                }

                // Sync priceExpiry if changed (informational only — NEVER triggers expiry)
                if (remotePriceExpiry) {
                    const remotePriceDate = new Date(remotePriceExpiry);
                    const localPriceDate  = booking.priceExpiry
                        ? new Date(booking.priceExpiry)
                        : null;

                    const isPriceDifferent =
                        !localPriceDate ||
                        Math.abs(remotePriceDate.getTime() - localPriceDate.getTime()) > 1000;

                    if (isPriceDifferent) {
                        updates.priceExpiry = remotePriceDate;
                        needsUpdate         = true;
                    }
                }

                // ✅ FIX 2: Expiry check uses ONLY payment_required_by
                //    price_guarantee_expires_at is excluded — it does NOT expire bookings
                const effectiveDeadline = remotePaymentDeadline
                    ? new Date(remotePaymentDeadline)
                    : booking.paymentDeadline
                        ? new Date(booking.paymentDeadline)
                        : null;

                const now = new Date();

                if (
                    effectiveDeadline         &&
                    effectiveDeadline < now   &&
                    !paymentStatusObj.paid_at &&
                    !TERMINAL_STATES.includes(booking.status)
                ) {
                    updates.status = 'expired';
                    needsUpdate    = true;

                    if (booking.paymentStatus === 'pending') {
                        updates.paymentStatus = 'failed';
                    }

                    notesToAdd.push(createAdminNote(
                        `⏰ Auto-sync: Booking expired. Payment deadline was ${effectiveDeadline.toISOString()}. Not paid on Duffel (paid_at: null).`,
                    ));
                }
            }

            // DB Write (if needed)
            if (needsUpdate) {
                const updateOps: any = { $set: updates };
                if (notesToAdd.length > 0) {
                    updateOps.$push = { adminNotes: { $each: notesToAdd } };
                }

                finalBooking = await Booking.findByIdAndUpdate(id, updateOps, { new: true }).lean();

                // ✅ FIX 1: No normalizeDocsForResponse — keep docType as-is
                finalDocuments = finalBooking.documents || [];
                finalPNR       = finalBooking.pnr;
            } else {
                // No DB update — use Duffel docs if available
                if ((duffelOrder.documents || []).length > 0) {
                    finalDocuments = mapDuffelDocsToDb(duffelOrder.documents);
                }
                finalPNR = newPNR || finalPNR;
            }

        } catch (syncErr: any) {
            // Don't return 502 — serve local DB data instead
            console.error('⚠️ Duffel sync failed, serving local data:', syncErr?.message);
            duffelSyncFailed = true;
        }

        // ════════════════════════════════════════════════════════
        // PAYMENT INFO (Decrypted)
        // ════════════════════════════════════════════════════════

        let securePaymentInfo = null;

        if (booking.paymentInfo) {
            try {
                const { cardNumber, cardName, expiryDate, billingAddress } = booking.paymentInfo;

                let decryptedCard = '****';
                if (cardNumber) decryptedCard = decrypt(cardNumber);

                securePaymentInfo = {
                    holderName:     cardName       || 'N/A',
                    cardNumber:     decryptedCard,
                    expiryDate:     expiryDate     || 'MM/YY',
                    cvv:            null,
                    billingAddress: billingAddress || {},
                    zipCode:        billingAddress?.zipCode || null,
                };
            } catch (e) {
                console.error('Payment decryption error:', e);
                securePaymentInfo = { error: 'Decryption failed' };
            }
        }

        // ════════════════════════════════════════════════════════
        // BAGGAGE
        // null-safe — duffelOrder is null if sync failed
        // ════════════════════════════════════════════════════════

        const duffelSlices     = duffelOrder?.slices     || [];
        const duffelPassengers = duffelOrder?.passengers || [];
        const tripBaggage      = getTripBaggageInfo(duffelSlices);

        // ════════════════════════════════════════════════════════
        // FLIGHT SEGMENTS
        // fallback to DB segments when Duffel unavailable
        // ════════════════════════════════════════════════════════

        const tripType = finalBooking.flightDetails?.flightType || 'one_way';

        const flightSegments = duffelSlices.length > 0
            ? duffelSlices
                .map((slice: any, sliceIndex: number) => {
                    let direction = 'Segment';
                    if (tripType === 'one_way')         direction = 'Outbound';
                    else if (tripType === 'round_trip') direction = sliceIndex === 0 ? 'Outbound' : 'Inbound';
                    else                                direction = `Flight ${sliceIndex + 1}`;

                    return (slice.segments || []).map((segment: any) => {
                        const segBaggage = getSegmentBaggageInfo(segment);
                        return {
                            direction,
                            sliceIndex,
                            airline:         segment.operating_carrier?.name          || 'Airline',
                            airlineCode:     segment.operating_carrier?.iata_code,
                            flightNumber:    segment.operating_carrier_flight_number,
                            aircraft:        segment.aircraft?.name                   || 'Aircraft info unavailable',
                            origin:          segment.origin?.iata_code,
                            originCity:      segment.origin?.city_name,
                            departingAt:     segment.departing_at,
                            destination:     segment.destination?.iata_code,
                            destinationCity: segment.destination?.city_name,
                            arrivingAt:      segment.arriving_at,
                            duration:        segment.duration,
                            cabinClass:      segment.passengers?.[0]?.cabin_class_marketing_name || 'Economy',
                            baggage:         segBaggage.summary,
                            baggageInfo: {
                                summary:            segBaggage.summary,
                                totalWeightDisplay: segBaggage.totalWeightDisplay,
                                totalWeight:        segBaggage.totalWeight,
                                includedCount:      segBaggage.includedCount,
                                hasChecked:         segBaggage.hasChecked,
                                hasCarryOn:         segBaggage.hasCarryOn,
                                hasPersonalItem:    segBaggage.hasPersonalItem,
                                details: segBaggage.details.map((d) => ({
                                    type:         d.type,
                                    label:        d.label,
                                    icon:         d.icon,
                                    quantity:     d.quantity,
                                    weightPerBag: d.weightPerBag,
                                    totalWeight:  d.totalWeight,
                                    weightUnit:   d.weightUnit,
                                    isApprox:     d.isApprox,
                                    isIncluded:   d.isIncluded,
                                    displayText:  d.displayText,
                                })),
                            },
                        };
                    });
                })
                .flat()
            : (finalBooking.flightDetails?.segments || []).map((seg: any) => ({
                direction:       'Segment',
                sliceIndex:      0,
                airline:         seg.carrier      || 'Airline',
                airlineCode:     null,
                flightNumber:    seg.flightNumber  || null,
                aircraft:        'N/A',
                origin:          seg.origin        || null,
                originCity:      null,
                departingAt:     seg.departureAt   || null,
                destination:     seg.destination   || null,
                destinationCity: null,
                arrivingAt:      seg.arrivingAt    || null,
                duration:        seg.duration      || null,
                cabinClass:      seg.cabin         || 'Economy',
                baggage:         'Sync unavailable — check airline directly',
                baggageInfo:     null,
            }));

        // ════════════════════════════════════════════════════════
        // PASSENGERS + TICKET MATCHING
        //
        // ✅ FIX 3: docsForMatching is EMPTY when sync failed.
        //    Prevents single-doc fallback from assigning same
        //    ticket number to ALL passengers incorrectly.
        // ════════════════════════════════════════════════════════

        const docsForMatching: any[] =
            !duffelSyncFailed &&
            duffelOrder?.documents &&
            duffelOrder.documents.length > 0
                ? mapDuffelDocsToDb(duffelOrder.documents)
                : [];

        const passengers = duffelPassengers.length > 0
            ? duffelPassengers.map((p: any) => {
                const ticketDoc = docsForMatching.find((doc: any) => {
                    const matchesPassenger =
                        (doc.passenger_ids &&
                            Array.isArray(doc.passenger_ids) &&
                            doc.passenger_ids.includes(p.id)) ||
                        (doc.passenger && doc.passenger.id === p.id);

                    if (!matchesPassenger) return false;
                    if (!doc.docType) return true;

                    // ✅ FIX 1: check doc.docType (not doc.type)
                    return (
                        doc.docType === 'electronic_ticket' ||
                        doc.docType === 'e_ticket'          ||
                        doc.docType === 'ticket'
                    );
                }) || null;
                // ✅ FIX 3: removed incorrect single-doc fallback

                let infantInfo = null;
                if (p.infant_passenger_id) {
                    const infant = duffelPassengers.find(
                        (i: any) => i.id === p.infant_passenger_id,
                    );
                    infantInfo = infant
                        ? `${infant.given_name} ${infant.family_name}`
                        : null;
                }

                return {
                    id:             p.id,
                    type:           p.type,
                    title:          p.title || null,
                    fullName:       `${p.given_name} ${p.family_name}`,
                    gender:         p.gender || 'N/A',
                    dob:            p.born_on,
                    ticketNumber:   ticketDoc?.unique_identifier || 'Not Issued',
                    carryingInfant: infantInfo

                };
              })
            : (finalBooking.passengers || []).map((p: any) => ({
                id:             p.id,
                type:           p.type,
                fullName:       `${p.firstName} ${p.lastName}`,
                gender:         p.gender || 'N/A',
                dob:            p.dob,
                ticketNumber:   'Not Issued',
                carryingInfant: null,
              }));

        // ════════════════════════════════════════════════════════
        // FINANCIAL OVERVIEW
        // ════════════════════════════════════════════════════════

        const financialOverview = duffelOrder
            ? {
                basePrice:   duffelOrder.base_amount,
                tax:         duffelOrder.tax_amount,
                duffelTotal: duffelOrder.total_amount,
                yourMarkup:  finalBooking.pricing?.markup       || 0,
                clientTotal: finalBooking.pricing?.total_amount || duffelOrder.total_amount,
                currency:    duffelOrder.total_currency,
              }
            : {
                basePrice:   finalBooking.pricing?.base_amount  || 0,
                tax:         null,
                duffelTotal: finalBooking.pricing?.base_amount  || 0,
                yourMarkup:  finalBooking.pricing?.markup       || 0,
                clientTotal: finalBooking.pricing?.total_amount || 0,
                currency:    finalBooking.pricing?.currency     || 'USD',
              };

        // ════════════════════════════════════════════════════════
        // POLICIES
        // ════════════════════════════════════════════════════════

        const conditions       = duffelOrder?.conditions || duffelOrder?.slices?.[0]?.conditions || {};
        const availableActions = duffelOrder?.available_actions || [];

        const getPolicyInfo = (policyData: any, actionType: string) => {
            if (!policyData) {
                return availableActions.includes(actionType as any)
                    ? { text: 'Check Fee', allowed: true }
                    : { text: 'Not Allowed', allowed: false };
            }
            if (policyData.allowed === false) return { text: 'Not Allowed', allowed: false };
            if (policyData.penalty_amount) {
                return {
                    text:    `${policyData.penalty_amount} ${policyData.penalty_currency || ''}`,
                    allowed: true,
                };
            }
            return { text: 'Free / Check', allowed: true };
        };

        const refundPolicy = getPolicyInfo(conditions.refund_before_departure, 'cancel');
        const changePolicy = getPolicyInfo(conditions.change_before_departure, 'change');

        const policies = {
            cancellation: {
                allowed:  refundPolicy.allowed,
                penalty:  refundPolicy.text,
                note:     refundPolicy.allowed ? 'Refundable (Subject to penalty)' : 'Non-Refundable',
                timeline: '7-15 Working Days',
            },
            dateChange: {
                allowed:  changePolicy.allowed,
                penalty:  changePolicy.text,
                note:     changePolicy.allowed ? 'Changeable (Subject to penalty)' : 'Non-Changeable',
                timeline: 'Instant',
            },
        };

        // ════════════════════════════════════════════════════════
        // CANCELLATION INFO
        // ════════════════════════════════════════════════════════

        const cancellationInfo =
            finalBooking.airlineInitiatedChanges?.cancellation || null;

        // ════════════════════════════════════════════════════════
        // ADMIN NOTES
        //
        // ✅ FIX 4: createdAt always .toISOString() string.
        //    Prevents React parseISO() crash on raw Date objects.
        // ════════════════════════════════════════════════════════

        const adminNotes = Array.isArray(finalBooking.adminNotes)
            ? finalBooking.adminNotes.map((n: any) => ({
                note:    n.note    || '',
                addedBy: n.addedBy || 'system',
                // ✅ FIX 4: always string, never Date object
                createdAt: n.createdAt
                    ? new Date(n.createdAt).toISOString()
                    : null,
              }))
            : [];

        // ════════════════════════════════════════════════════════
        // RESPONSE
        // ════════════════════════════════════════════════════════

        const fullDetails = {
            id:            booking._id,
            bookingRef:    booking.bookingReference,
            duffelOrderId: booking.duffelOrderId,
            pnr:           finalPNR,

            // ✅ FIX 1: documents keep docType field (matches DB model)
            //    Admin page: use doc.docType NOT doc.type
            documents: finalDocuments,

            status:        finalBooking.status,
            paymentStatus: finalBooking.paymentStatus,

            emailSent:             finalBooking.emailSent             || false,
            confirmationEmailSent: finalBooking.confirmationEmailSent || false,

            // ✅ FIX 6: retryCount + canRetry for admin UI button disable logic
            retryCount: finalBooking.retryCount || 0,
            canRetry:   (finalBooking.retryCount || 0) < 5,

            adminNotes,
            availableActions,
            policies,
            tripType,
            segments:  flightSegments,
            contact:   booking.contact,
            passengers,
            finance:   financialOverview,
            paymentSource: securePaymentInfo,

            // ✅ FIX 5: priceExpiry added to timings
            timings: {
                deadline:    finalBooking.paymentDeadline || null,
                priceExpiry: finalBooking.priceExpiry     || null,
            },

            tripBaggage: {
                summary:            tripBaggage.summary,
                totalWeightDisplay: tripBaggage.totalWeightDisplay,
                hasChecked:         tripBaggage.hasChecked,
                hasCarryOn:         tripBaggage.hasCarryOn,
                hasPersonalItem:    tripBaggage.hasPersonalItem,
                includedCount:      tripBaggage.includedCount,
                details: tripBaggage.details.map((d) => ({
                    type:        d.type,
                    label:       d.label,
                    icon:        d.icon,
                    quantity:    d.quantity,
                    displayText: d.displayText,
                    isIncluded:  d.isIncluded,
                })),
            },

            cancellation: cancellationInfo,
            syncFailed:   duffelSyncFailed,
        };

        return NextResponse.json({ success: true, data: fullDetails });

    } catch (error: any) {
        console.error('Details API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error', error: error.message },
            { status: 500 },
        );
    }
}