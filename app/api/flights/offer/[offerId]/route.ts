export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import { calculatePriceWithMarkup } from '@/app/api/flights/utils/search';

// ------------------------------------------------------------------
// Duffel client
// ------------------------------------------------------------------
const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN ?? '',
});

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface BaggageDetail {
    type: string;
    label: string;
    icon: string;
    quantity: number;
    weightPerBag: number;
    totalWeight: number;
    weightUnit: string;
    isApprox: boolean;
    hasExplicitWeight: boolean;
    isIncluded: boolean;
    displayText: string;
}

interface BaggageInfo {
    summary: string;
    details: BaggageDetail[];
    hasChecked: boolean;
    hasCarryOn: boolean;
    hasPersonalItem: boolean;
    totalWeight: number;
    totalWeightDisplay: string;
    includedCount: number;
}

interface DuffelBag {
    type?: string;
    quantity?: number;
    weight?: number | string | null;
    weightUnit?: string;
    weight_unit?: string;
}

interface DuffelPassenger {
    id: string;
    type?: string | null;
    age?: number | null;
}

interface DuffelSegmentPassenger {
    cabin_class?: string | null;
    cabin_class_marketing_name?: string | null;
    baggages?: DuffelBag[];
}

interface DuffelAirport {
    name?: string | null;
    iata_code?: string | null;
    city_name?: string | null;
}

interface DuffelCarrier {
    name?: string | null;
    logo_symbol_url?: string | null;
    iata_code?: string | null;
}

interface DuffelAircraft {
    name?: string | null;
}

interface DuffelSegment {
    id: string;
    marketing_carrier?: DuffelCarrier | null;
    marketing_carrier_flight_number?: string | null;
    aircraft?: DuffelAircraft | null;
    passengers?: DuffelSegmentPassenger[];
    origin?: DuffelAirport | null;
    origin_terminal?: string | null;
    destination?: DuffelAirport | null;
    destination_terminal?: string | null;
    departing_at?: string | null;
    arriving_at?: string | null;
    duration?: string | null;
}

interface DuffelSlice {
    id: string;
    duration?: string | null;
    segments?: DuffelSegment[];
}

interface DuffelOffer {
    id: string;
    expires_at?: string | null;
    total_amount: string;
    total_currency: string;
    owner?: DuffelCarrier | null;
    slices?: DuffelSlice[];
    passengers?: DuffelPassenger[];
    conditions?: {
        refund_before_departure?: { allowed?: boolean } | null;
        change_before_departure?: { allowed?: boolean } | null;
    } | null;
    payment_requirements?: {
        requires_instant_payment?: boolean | null;
        payment_required_by?: string | null;
        price_guarantee_expires_at?: string | null;
    } | null;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const BAGGAGE_CONFIG: Record<string, { label: string; icon: string; defaultWeight: number }> = {
    checked:       { label: 'Checked Bag',   icon: '🧳', defaultWeight: 23 },
    carry_on:      { label: 'Carry-On',      icon: '👜', defaultWeight: 7 },
    personal_item: { label: 'Personal Item', icon: '🎒', defaultWeight: 5 },
};

const EMPTY_BAGGAGE: BaggageInfo = {
    summary:             'No Baggage Info',
    details:             [],
    hasChecked:          false,
    hasCarryOn:          false,
    hasPersonalItem:     false,
    totalWeight:         0,
    totalWeightDisplay:  'N/A',
    includedCount:       0,
};

/**
 * Parse an ISO 8601 duration string (e.g. "PT2H30M", "P1DT2H") into a
 * human-readable string like "1d 2h 30m".
 */
const parseDuration = (duration: string | null | undefined): string => {
    if (!duration) return '--';
    const iso = duration.toUpperCase();
    const d = parseInt(iso.match(/(\d+)D/)?.[1] ?? '0', 10);
    const h = parseInt(iso.match(/(\d+)H/)?.[1] ?? '0', 10);
    const m = parseInt(iso.match(/(\d+)M/)?.[1] ?? '0', 10);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || parts.length === 0) parts.push(`${m}m`);
    return parts.join(' ');
};

/**
 * Build rich baggage info from the first segment of the first slice.
 * Approximate weights are clearly flagged; they are never silently baked
 * into the totalWeight that could appear on a payment summary.
 */
const getBaggageInfo = (slices: DuffelSlice[] | undefined): BaggageInfo => {
    try {
        const bags = slices?.[0]?.segments?.[0]?.passengers?.[0]?.baggages;
        if (!Array.isArray(bags) || bags.length === 0) return EMPTY_BAGGAGE;

        const details: BaggageDetail[] = bags.map((bag) => {
            const type   = bag.type ?? 'unknown';
            const config = BAGGAGE_CONFIG[type] ?? {
                label:         type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                icon:          '📦',
                defaultWeight: 0,
            };

            const qty             = bag.quantity ?? 0;
            const hasExplicit     = bag.weight !== undefined && bag.weight !== null;
            const weightPerBag    = hasExplicit ? Number(bag.weight) : 0; // ← never fabricate weight
            const totalWeight     = qty * weightPerBag;
            const isApprox        = !hasExplicit && config.defaultWeight > 0;
            const weightUnit      = bag.weightUnit ?? bag.weight_unit ?? 'kg';

            let displayText: string;
            if (qty > 0) {
                displayText = weightPerBag > 0
                    ? `${qty} × ${config.label} (${totalWeight}${weightUnit})`
                    : isApprox
                    ? `${qty} × ${config.label} (~${config.defaultWeight}${weightUnit} each, unconfirmed)`
                    : `${qty} × ${config.label}`;
            } else {
                displayText = `No ${config.label}`;
            }

            return {
                type,
                label:            config.label,
                icon:             config.icon,
                quantity:         qty,
                weightPerBag,
                totalWeight,
                weightUnit,
                isApprox,
                hasExplicitWeight: hasExplicit,
                isIncluded:        qty > 0,
                displayText,
            };
        });

        const included        = details.filter((d) => d.isIncluded);
        // Only sum confirmed explicit weights — never approximations
        const confirmedWeight = included
            .filter((d) => d.hasExplicitWeight)
            .reduce((sum, d) => sum + d.totalWeight, 0);
        const hasApprox       = included.some((d) => d.isApprox);

        return {
            summary: included.length > 0
                ? included.map((d) => d.displayText).join(' + ')
                : 'No Baggage Included',
            details,
            hasChecked:          details.some((d) => d.type === 'checked'       && d.quantity > 0),
            hasCarryOn:          details.some((d) => d.type === 'carry_on'      && d.quantity > 0),
            hasPersonalItem:     details.some((d) => d.type === 'personal_item' && d.quantity > 0),
            totalWeight:         confirmedWeight,
            totalWeightDisplay:  confirmedWeight > 0
                ? `${confirmedWeight}kg confirmed${hasApprox ? ' (+ unconfirmed items)' : ''}`
                : hasApprox ? 'Weight unconfirmed' : 'N/A',
            includedCount:       included.length,
        };
    } catch {
        return { ...EMPTY_BAGGAGE, summary: 'Check Baggage Rules' };
    }
};

/**
 * Safely compute layover duration in minutes between two ISO datetime strings.
 * Returns null if either value is missing or the result is not a positive finite number.
 */
const getLayoverString = (
    arrivingAt: string | null | undefined,
    nextDepartingAt: string | null | undefined,
): string | null => {
    if (!arrivingAt || !nextDepartingAt) return null;
    const diffMs   = new Date(nextDepartingAt).getTime() - new Date(arrivingAt).getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (!isFinite(diffMins) || diffMins <= 0) return null;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
};

// ------------------------------------------------------------------
// Route handler
// ------------------------------------------------------------------
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ offerId: string }> },
) {
    const { offerId } = await params;

    if (!offerId || typeof offerId !== 'string' || offerId.trim() === '') {
        return NextResponse.json(
            { success: false, error: 'Invalid offer ID.' },
            { status: 400 },
        );
    }

    // ── Fetch offer from Duffel ─────────────────────────────────────
    let offer: DuffelOffer;
    try {
        const result = await duffel.offers.get(offerId);
        offer = result.data as unknown as DuffelOffer;
    } catch (err: unknown) {
        const raw = err as { errors?: { message?: string }[]; message?: string };
        const msg = raw?.errors?.[0]?.message ?? raw?.message ?? 'Offer not found.';
        const lower = msg.toLowerCase();

        if (lower.includes('expired') || lower.includes('not found')) {
            return NextResponse.json(
                { success: false, error: 'This offer has expired. Please search again.', expired: true },
                { status: 410 },
            );
        }
        if (lower.includes('rate limit') || lower.includes('429')) {
            return NextResponse.json(
                { success: false, error: 'Too many requests. Please try again shortly.' },
                { status: 429 },
            );
        }

        console.error('[Offer Fetch] Duffel error:', msg);
        return NextResponse.json(
            { success: false, error: msg },
            { status: 502 },
        );
    }

    // ── Payment requirement validations ────────────────────────────
    const payReq = offer.payment_requirements;

    if (payReq?.requires_instant_payment) {
        return NextResponse.json(
            {
                success:   false,
                error:     'This flight requires instant payment and cannot be held. Please contact us at +1-213-985-8499 to complete this booking.',
                errorType: 'INSTANT_PAYMENT_REQUIRED',
            },
            { status: 400 },
        );
    }

    if (!payReq?.payment_required_by) {
        return NextResponse.json(
            {
                success:   false,
                error:     'This flight requires instant payment and cannot be held. Please contact us at +1-213-985-8499 to complete this booking.',
                errorType: 'INSTANT_PAYMENT_REQUIRED',
            },
            { status: 400 },
        );
    }

    // ── Build itinerary ────────────────────────────────────────────
    const slices       = offer.slices ?? [];
    const sliceCount   = slices.length;
    const tripType     = sliceCount === 1 ? 'one_way'
                       : sliceCount === 2 ? 'round_trip'
                       : 'multi_city';

    const itinerary = slices.map((slice, index) => {
        const direction =
            tripType === 'round_trip'  ? (index === 0 ? 'Outbound' : 'Inbound')
          : tripType === 'multi_city'  ? `Leg ${index + 1}`
          : 'Flight';

        const segments = (slice.segments ?? []).map((seg, i, arr) => ({
            id:           seg.id,
            airline:      seg.marketing_carrier?.name ?? null,
            logo:         seg.marketing_carrier?.logo_symbol_url ?? null,
            flightNumber: seg.marketing_carrier?.iata_code && seg.marketing_carrier_flight_number
                ? `${seg.marketing_carrier.iata_code} ${seg.marketing_carrier_flight_number}`
                : null,
            aircraft:     seg.aircraft?.name ?? null,
            classType:    seg.passengers?.[0]?.cabin_class_marketing_name ?? null,
            departure: {
                airport:  seg.origin?.name ?? null,
                code:     seg.origin?.iata_code ?? null,
                city:     seg.origin?.city_name ?? null,
                terminal: seg.origin_terminal ?? null,
                time:     seg.departing_at ?? null,
            },
            arrival: {
                airport:  seg.destination?.name ?? null,
                code:     seg.destination?.iata_code ?? null,
                city:     seg.destination?.city_name ?? null,
                terminal: seg.destination_terminal ?? null,
                time:     seg.arriving_at ?? null,
            },
            duration:      parseDuration(seg.duration),
            layoverToNext: getLayoverString(seg.arriving_at, arr[i + 1]?.departing_at),
            amenities:     seg.aircraft?.name ? [`Aircraft: ${seg.aircraft.name}`] : [],
        }));

        return {
            id:            slice.id,
            direction,
            totalDuration: parseDuration(slice.duration),
            stops:         Math.max(0, segments.length - 1),
            segments,
            mainDeparture: segments[0]?.departure ?? null,
            mainArrival:   segments[segments.length - 1]?.arrival ?? null,
            mainAirline:   segments[0]?.airline ?? null,
            mainLogo:      segments[0]?.logo ?? null,
        };
    });

    // ── Build response ─────────────────────────────────────────────
    const priceDetails = calculatePriceWithMarkup(offer.total_amount, offer.total_currency);
    const baggageInfo  = getBaggageInfo(slices);

    return NextResponse.json({
        success: true,
        data: {
            id:        offer.id,
            expiresAt: offer.expires_at ?? null,

            carrier: {
                name: offer.owner?.name ?? null,
                logo: offer.owner?.logo_symbol_url ?? null,
                code: offer.owner?.iata_code ?? null,
            },

            itinerary,
            price:      priceDetails,
            baggage:    baggageInfo,
            cabinClass: offer.slices?.[0]?.segments?.[0]?.passengers?.[0]?.cabin_class ?? 'economy',

            conditions: {
                refundable: offer.conditions?.refund_before_departure?.allowed  ?? false,
                changeable: offer.conditions?.change_before_departure?.allowed  ?? false,
            },

            passengers: (offer.passengers ?? []).map((p) => ({
                id:   p.id,
                type: p.type  ?? null,
                age:  p.age   ?? null
            })),

            // camelCase — consistent with all other response fields
            paymentRequirements: {
                requiresInstantPayment: payReq.requires_instant_payment      ?? false,
                paymentRequiredBy:      payReq.payment_required_by           ?? null,
                priceGuaranteeExpiresAt: payReq.price_guarantee_expires_at   ?? null,
            },
        },
    });
}