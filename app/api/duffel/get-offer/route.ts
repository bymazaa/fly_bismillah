export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import { calculatePriceWithMarkup, checkRateLimit } from '../search/utils';

// ------------------------------------------------------------------
// ⚙️ CONFIGURATION
// ------------------------------------------------------------------

const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN as string,
});

// ------------------------------------------------------------------
// 🟢 HELPER FUNCTIONS
// ------------------------------------------------------------------

// 1. Robust Duration Parser
const parseDuration = (duration: string | null | undefined) => {
    if (!duration) return '--';

    const upper = duration.toUpperCase();
    const daysMatch = upper.match(/(\d+)D/);
    const hoursMatch = upper.match(/(\d+)H/);
    const minutesMatch = upper.match(/(\d+)M/);

    const d = daysMatch ? daysMatch[1] : null;
    const h = hoursMatch ? hoursMatch[1] : null;
    const m = minutesMatch ? minutesMatch[1] : null;

    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);

    if (parts.length === 0) return duration.replace('PT', '').toLowerCase();
    return parts.join(' ');
};

// 2. Cabin Class Formatter
const getCabinClass = (slices: any[]) => {
    try {
        const segment = slices[0]?.segments[0];
        const passenger = segment?.passengers?.[0];
        const rawClass =
            passenger?.cabin_class_marketing_name || passenger?.cabin_class || 'Economy';
        return rawClass.charAt(0).toUpperCase() + rawClass.slice(1).toLowerCase();
    } catch {
        return 'Economy';
    }
};

// 3. Smart Baggage Info
const getBaggageInfo = (slices: any[]) => {
    try {
        const bags = slices[0]?.segments[0]?.passengers?.[0]?.baggages;

        if (!Array.isArray(bags) || bags.length === 0) {
            return {
                summary: 'No Baggage Info',
                details: [],
                hasChecked: false,
                hasCarryOn: false,
                hasPersonalItem: false,
                totalWeight: 0,
                totalWeightDisplay: 'N/A',
                includedCount: 0,
            };
        }

        const baggageConfig: Record<string, { label: string; icon: string; defaultWeight: number }> = {
            checked:       { label: 'Checked Bag',   icon: '🧳', defaultWeight: 23 },
            carry_on:      { label: 'Carry-On',       icon: '👜', defaultWeight: 7  },
            personal_item: { label: 'Personal Item',  icon: '🎒', defaultWeight: 5  },
        };

        const details = bags.map((bag: any) => {
            const config = baggageConfig[bag.type] || {
                label: bag.type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Other Bag',
                icon: '📦',
                defaultWeight: 0,
            };

            const qty                = bag.quantity || 0;
            const hasExplicitWeight  = bag.weight !== undefined && bag.weight !== null;
            const weightPerBag       = hasExplicitWeight ? Number(bag.weight) : config.defaultWeight;
            const totalWeight        = qty * weightPerBag;
            const isApprox           = !hasExplicitWeight && config.defaultWeight > 0;
            const weightUnit         = bag.weightUnit || bag.weight_unit || 'kg';

            let displayText = '';
            if (qty > 0) {
                displayText = totalWeight > 0
                    ? `${qty} × ${config.label} (${totalWeight}${weightUnit}${isApprox ? ' approx' : ''})`
                    : `${qty} × ${config.label}`;
            } else {
                displayText = `No ${config.label}`;
            }

            return {
                type: bag.type,
                label: config.label,
                icon: config.icon,
                quantity: qty,
                weightPerBag,
                totalWeight,
                weightUnit,
                isApprox,
                hasExplicitWeight,
                isIncluded: qty > 0,
                displayText,
            };
        });

        const hasChecked      = details.some((d: any) => d.type === 'checked'       && d.quantity > 0);
        const hasCarryOn      = details.some((d: any) => d.type === 'carry_on'      && d.quantity > 0);
        const hasPersonalItem = details.some((d: any) => d.type === 'personal_item' && d.quantity > 0);

        const includedBags  = details.filter((d: any) => d.isIncluded);
        const summary       = includedBags.length > 0
            ? includedBags.map((d: any) => d.displayText).join(' + ')
            : 'No Baggage Included';

        const totalWeight   = includedBags.reduce((sum: number, d: any) => sum + d.totalWeight, 0);
        const hasAnyApprox  = includedBags.some((d: any) => d.isApprox);

        return {
            summary,
            details,
            hasChecked,
            hasCarryOn,
            hasPersonalItem,
            totalWeight,
            totalWeightDisplay: totalWeight > 0
                ? `${totalWeight}kg${hasAnyApprox ? ' approx' : ''} total`
                : 'N/A',
            includedCount: includedBags.length,
        };
    } catch {
        return {
            summary: 'Check Baggage Rules',
            details: [],
            hasChecked: false,
            hasCarryOn: false,
            hasPersonalItem: false,
            totalWeight: 0,
            totalWeightDisplay: 'N/A',
            includedCount: 0,
        };
    }
};

// 4. Fare Rules
const getFareRules = (conditions: any) => {
    if (!conditions) return { change: 'Unknown', refund: 'Unknown', isRefundable: false };

    const formatRule = (rule: any, type: string) => {
        if (!rule)                return 'Check Rules';
        if (rule.allowed === false) return 'Not Allowed';
        if (rule.allowed === true) {
            return rule.penalty_amount
                ? `${type} Fee: ${rule.penalty_currency} ${rule.penalty_amount}`
                : `Free ${type}`;
        }
        return 'Check Rules';
    };

    return {
        change:       formatRule(conditions.change_before_departure, 'Change'),
        refund:       formatRule(conditions.refund_before_departure, 'Refund'),
        isRefundable: conditions.refund_before_departure?.allowed ?? false,
    };
};

// ------------------------------------------------------------------
// ✅ OFFER ID VALIDATOR
// ------------------------------------------------------------------
const OFFER_ID_REGEX = /^off_[a-zA-Z0-9]+$/;

// ------------------------------------------------------------------
// 🚀 MAIN API HANDLER
// Path: app/api/flights/offer/route.ts
// Usage: GET /api/flights/offer?offer_id=off_xxxx
// ------------------------------------------------------------------
export async function GET(request: NextRequest) {
    // ── Rate limit ──
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { success: false, error: 'Too many requests. Please slow down.' },
            { status: 429 },
        );
    }

    // ── ✅ Next.js 15: use request.nextUrl instead of new URL(request.url) ──
    const rawOfferId = request.nextUrl.searchParams.get('offer_id');

    if (!rawOfferId) {
        return NextResponse.json(
            { success: false, error: 'Offer ID is required.' },
            { status: 400 },
        );
    }

    const offerId = rawOfferId.trim();

    if (!OFFER_ID_REGEX.test(offerId)) {
        return NextResponse.json(
            { success: false, error: 'Invalid Offer ID format.' },
            { status: 422 },
        );
    }

    try {
        // ── Live fetch from Duffel ──
        const result = await duffel.offers.get(offerId, {
            return_available_services: true,
        });

        if (!result?.data) {
            return NextResponse.json(
                { success: false, error: 'No data received from airline.' },
                { status: 404 },
            );
        }

        const data = result.data;

        // ── Process ──
        const pricing     = calculatePriceWithMarkup(data.total_amount, data.total_currency);
        const cabinClass  = getCabinClass(data.slices);
        const baggageInfo = getBaggageInfo(data.slices);
        const fareRules   = getFareRules(data.conditions);
        const expiresAt   = data.expires_at
            ? new Date(data.expires_at).toISOString()
            : new Date(Date.now() + 15 * 60 * 1000).toISOString();

        // ── Itinerary ──
        const itinerary = data.slices.map((slice: any, index: number) => {
            const segments    = slice.segments || [];
            const totalSlices = data.slices.length;

            const directionLabel =
                totalSlices === 1 ? 'One Way' :
                totalSlices === 2 ? (index === 0 ? 'Outbound' : 'Inbound') :
                `Flight ${index + 1}`;

            return {
                id:        slice.id,
                direction: directionLabel,

                mainAirline: segments[0]?.operating_carrier?.name || 'Airline',
                mainLogo:    segments[0]?.operating_carrier?.logo_symbol_url || null,

                mainDeparture: {
                    code:     segments[0]?.origin?.iata_code,
                    city:     segments[0]?.origin?.city_name || segments[0]?.origin?.name,
                    time:     segments[0]?.departing_at,
                    terminal: segments[0]?.origin_terminal || null,
                },
                mainArrival: {
                    code:     segments.at(-1)?.destination?.iata_code,
                    city:     segments.at(-1)?.destination?.city_name || segments.at(-1)?.destination?.name,
                    time:     segments.at(-1)?.arriving_at,
                    terminal: segments.at(-1)?.destination_terminal || null,
                },

                totalDuration: parseDuration(slice.duration),
                stops:         segments.length - 1,

                segments: segments.map((seg: any, i: number) => {
                    // Layover = time between previous segment's arrival and this one's departure
                    let layoverTime: string | null = null;
                    if (i > 0) {
                        const diffMins = (
                            new Date(seg.departing_at).getTime() -
                            new Date(segments[i - 1].arriving_at).getTime()
                        ) / 60_000;
                        const h = Math.floor(diffMins / 60);
                        const m = Math.floor(diffMins % 60);
                        layoverTime = `${h}h ${m}m`;
                    }

                    const isCodeshare =
                        seg.marketing_carrier?.name !== seg.operating_carrier?.name;

                    return {
                        id:          seg.id,
                        layover:     layoverTime,
                        flightNumber:`${seg.operating_carrier?.iata_code ?? ''} ${seg.operating_carrier_flight_number ?? ''}`.trim(),
                        aircraft:    seg.aircraft?.name || 'Aircraft',
                        airline:     seg.operating_carrier?.name,
                        logo:        seg.operating_carrier?.logo_symbol_url,
                        isCodeshare,
                        operatedBy:  isCodeshare ? `Operated by ${seg.operating_carrier?.name}` : null,
                        duration:    parseDuration(seg.duration),

                        departure: {
                            code:     seg.origin?.iata_code,
                            city:     seg.origin?.city_name,
                            airport:  seg.origin?.name,
                            time:     seg.departing_at,
                            terminal: seg.origin_terminal || null,
                        },
                        arrival: {
                            code:     seg.destination?.iata_code,
                            city:     seg.destination?.city_name,
                            airport:  seg.destination?.name,
                            time:     seg.arriving_at,
                            terminal: seg.destination_terminal || null,
                        },
                    };
                }),
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                id:                  data.id,
                expires_at:          expiresAt,
                payment_requirements: data.payment_requirements,
                price:               pricing,
                itinerary,
                baggage:             baggageInfo,
                cabinClass,
                fareRules,
                refundPolicy:        fareRules.isRefundable ? 'Refundable' : 'Non-refundable',
                passengers:          data.passengers,
                owner:               data.owner,
                availableServices:   data.available_services ?? [],
            },
        });

    } catch (error: any) {
        console.error('❌ Offer API Error:', error.meta ?? error);

        // Duffel offer expired / no longer bookable
        if (
            error.errors?.[0]?.code === 'offer_no_longer_available' ||
            error.errors?.[0]?.code === 'airline_error' ||
            error.meta?.status === 422
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:   'This flight is no longer available. Please search again.',
                    expired: true,
                },
                { status: 410 },
            );
        }

        if (error.meta?.status === 404) {
            return NextResponse.json(
                { success: false, error: 'Offer not found.' },
                { status: 404 },
            );
        }

        return NextResponse.json(
            { success: false, error: 'Internal server error. Please try again.' },
            { status: 500 },
        );
    }
}