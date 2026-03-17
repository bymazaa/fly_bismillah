export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { hasPermission } from '@/app/api/lib/auth';

// ─── Duffel Client ────────────────────────────────────────────────────────────
if (!process.env.DUFFEL_ACCESS_TOKEN) {
    throw new Error('[Refund API] DUFFEL_ACCESS_TOKEN is not set.');
}

const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsePenalty(condition: any): {
    allowed: boolean;
    penaltyAmount: number | null;
    penaltyCurrency: string | null;
    penaltyText: string;
} {
    if (!condition) {
        return { allowed: false, penaltyAmount: null, penaltyCurrency: null, penaltyText: 'Not available' };
    }

    const allowed        = condition.allowed ?? false;
    const penaltyAmount  = condition.penalty_amount  ? Number(condition.penalty_amount)  : null;
    const penaltyCurrency = condition.penalty_currency ?? null;

    let penaltyText = 'Not allowed';
    if (allowed) {
        if (penaltyAmount !== null && penaltyAmount > 0) {
            penaltyText = `${penaltyCurrency ?? ''} ${penaltyAmount.toFixed(2)} penalty`;
        } else if (penaltyAmount === 0) {
            penaltyText = 'Free — no penalty';
        } else {
            penaltyText = 'Allowed — contact airline for penalty details';
        }
    }

    return { allowed, penaltyAmount, penaltyCurrency, penaltyText };
}

function formatAmount(amount: number | string | null | undefined, currency?: string | null): string {
    if (amount === null || amount === undefined) return '—';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '—';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency ?? 'USD',
            minimumFractionDigits: 2,
        }).format(num);
    } catch {
        return `${currency ?? ''} ${num.toFixed(2)}`;
    }
}

// ─── GET /api/dashboard/bookings/[id]/refund ──────────────────────────────────
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    const auth = await hasPermission('booking', 'view');
    if (!auth.success) return auth.response;
    try {
        const { id } = await params;

        if (!id || id.length < 10) {
            return NextResponse.json(
                { success: false, message: 'Invalid booking ID.' },
                { status: 400 },
            );
        }

        await dbConnect();

        // ── 1. Find booking in DB ────────────────────────────────────────────
        const booking = await Booking.findById(id)
            .select('duffelOrderId bookingReference status paymentStatus pricing flightDetails pnr')
            .lean();

        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Booking not found.' },
                { status: 404 },
            );
        }

        const duffelOrderId = (booking as any).duffelOrderId;

        if (!duffelOrderId) {
            return NextResponse.json(
                { success: false, message: 'No airline order linked to this booking. Cannot fetch refund details.' },
                { status: 400 },
            );
        }

        // ── 2. Fetch order from Duffel ───────────────────────────────────────
        let order: any;
        try {
            const res = await duffel.orders.get(duffelOrderId);
            order = res?.data;
        } catch (err: any) {
            const duffelMsg = err?.errors?.[0]?.message ?? err?.message ?? 'Failed to fetch order from airline';
            const status    = err?.meta?.status ?? err?.response?.status ?? 0;

            if (status === 404) {
                return NextResponse.json(
                    { success: false, message: 'Order not found on airline system. It may have been cancelled already.' },
                    { status: 404 },
                );
            }

            console.error('[Refund API] Duffel error:', duffelMsg);
            return NextResponse.json(
                { success: false, message: duffelMsg },
                { status: 502 },
            );
        }

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Empty response from airline.' },
                { status: 502 },
            );
        }

        // ── 3. Extract refund / change conditions ────────────────────────────
        const conditions    = order.conditions ?? {};
        const refundBefore  = parsePenalty(conditions.refund_before_departure);
        const changeBefore  = parsePenalty(conditions.change_before_departure);

        // ── 4. Order financial details ───────────────────────────────────────
        const totalAmount   = Number(order.total_amount ?? 0);
        const totalCurrency = order.total_currency ?? 'USD';
        const taxAmount     = Number(order.tax_amount ?? 0);
        const baseAmount    = totalAmount - taxAmount;

        // ── 5. Estimate refund amount ────────────────────────────────────────
        let estimatedRefund: number | null = null;
        let refundBreakdown: string        = '';

        if (refundBefore.allowed) {
            if (refundBefore.penaltyAmount !== null) {
                estimatedRefund = Math.max(0, totalAmount - refundBefore.penaltyAmount);
                refundBreakdown = `Total ${formatAmount(totalAmount, totalCurrency)} - Penalty ${formatAmount(refundBefore.penaltyAmount, refundBefore.penaltyCurrency ?? totalCurrency)} = Refund ${formatAmount(estimatedRefund, totalCurrency)}`;
            } else {
                estimatedRefund = null;
                refundBreakdown = 'Refund allowed — exact amount to be confirmed by airline';
            }
        } else {
            estimatedRefund = 0;
            refundBreakdown = 'Non-refundable ticket';
        }

        // ── 6. Payment status from Duffel ────────────────────────────────────
        const paymentStatus = order.payment_status ?? {};
        const paymentRequired    = paymentStatus.payment_required_by ?? null;
        const priceGuarantee     = paymentStatus.price_guarantee_expires_at ?? null;
        const awaitingPayment    = paymentStatus.awaiting_payment ?? false;

        // ── 7. Cancellation info (if already cancelled) ──────────────────────
        let cancellationInfo: any = null;
        const orderCancellations = order.cancellation ?? null;

        if (orderCancellations) {
            cancellationInfo = {
                cancelledAt:    orderCancellations.created_at    ?? null,
                refundAmount:   orderCancellations.refund_amount ? Number(orderCancellations.refund_amount) : null,
                refundCurrency: orderCancellations.refund_currency ?? totalCurrency,
                refundTo:       orderCancellations.refund_to      ?? null,
                status:         orderCancellations.status          ?? null,
            };
        }

        // ── 8. Passengers summary ────────────────────────────────────────────
        const passengers = (order.passengers ?? []).map((p: any) => ({
            id:        p.id,
            name:      `${p.title ? p?.title?.toUpperCase() + '. ' : ''}${p.given_name ?? ''} ${p.family_name ?? ''}`.trim(),
            type:      p.type ?? 'child',
            gender:    p.gender ?? null,
        }));

        // ── 9. Slices summary for context ────────────────────────────────────
        const slices = (order.slices ?? []).map((slice: any) => {
            const firstSeg = slice.segments?.[0];
            const lastSeg  = slice.segments?.[slice.segments.length - 1];
            return {
                origin:      firstSeg?.origin?.iata_code      ?? null,
                destination: lastSeg?.destination?.iata_code   ?? null,
                departureAt: firstSeg?.departing_at            ?? null,
                arrivingAt:  lastSeg?.arriving_at              ?? null,
                airline:     firstSeg?.operating_carrier?.name ?? firstSeg?.marketing_carrier?.name ?? null,
                segments:    slice.segments?.length ?? 0,
            };
        });

        // ── 10. Build response ───────────────────────────────────────────────
        const refundData = {
            // Order identifiers
            orderId:        duffelOrderId,
            bookingRef:     (booking as any).bookingReference,
            pnr:            (booking as any).pnr ?? order.booking_reference ?? null,
            orderStatus:    order.status ?? null,
            isLiveMode:     order.live_mode ?? false,

            // Financial
            financial: {
                totalAmount,
                baseAmount:   Number(baseAmount.toFixed(2)),
                taxAmount:    Number(taxAmount.toFixed(2)),
                currency:     totalCurrency,
                totalDisplay: formatAmount(totalAmount, totalCurrency),
                baseDisplay:  formatAmount(baseAmount, totalCurrency),
                taxDisplay:   formatAmount(taxAmount, totalCurrency),
                markup:     booking.pricing?.markup ? Number(booking.pricing.markup.toFixed(2)) : null,
            },

            // Refund conditions
            refund: {
                isRefundable:     refundBefore.allowed,
                penaltyAmount:    refundBefore.penaltyAmount,
                penaltyCurrency:  refundBefore.penaltyCurrency ?? totalCurrency,
                penaltyText:      refundBefore.penaltyText,
                penaltyDisplay:   refundBefore.penaltyAmount !== null
                    ? formatAmount(refundBefore.penaltyAmount, refundBefore.penaltyCurrency ?? totalCurrency)
                    : '—',
                estimatedRefund,
                estimatedRefundDisplay: estimatedRefund !== null
                    ? formatAmount(estimatedRefund, totalCurrency)
                    : 'Contact airline',
                breakdown:        refundBreakdown,
            },

            // Change conditions
            change: {
                isChangeable:    changeBefore.allowed,
                penaltyAmount:   changeBefore.penaltyAmount,
                penaltyCurrency: changeBefore.penaltyCurrency ?? totalCurrency,
                penaltyText:     changeBefore.penaltyText,
                penaltyDisplay:  changeBefore.penaltyAmount !== null
                    ? formatAmount(changeBefore.penaltyAmount, changeBefore.penaltyCurrency ?? totalCurrency)
                    : '—',
            },

            // Payment status
            payment: {
                awaitingPayment,
                paymentRequiredBy:         paymentRequired,
                priceGuaranteeExpiresAt:   priceGuarantee,
            },

            // Cancellation (if already cancelled)
            cancellation: cancellationInfo,

            // Context
            passengers,
            slices,

            // Timestamps
            fetchedAt: new Date().toISOString(),
        };

        return NextResponse.json({
            success: true,
            data:    refundData,
        });

    } catch (error: any) {
        console.error('[Refund API] Unexpected error:', error?.message ?? error);
        return NextResponse.json(
            { success: false, message: 'An unexpected error occurred. Please try again.' },
            { status: 500 },
        );
    }
}