export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import { searchSchema } from './validation';
import { calculatePriceWithMarkup, checkRateLimit } from './utils';

// ------------------------------------------------------------------
// 🛡️ SECURITY: RATE LIMITER
// ------------------------------------------------------------------

// ✅ 1. Advanced Duration Parser (Fixes P1DT10H -> 1d 10h)
const parseDuration = (duration: string | null) => {
    if (!duration) return '--';

    const isoString = duration.toUpperCase();

    const daysMatch = isoString.match(/(\d+)D/);
    const hoursMatch = isoString.match(/(\d+)H/);
    const minutesMatch = isoString.match(/(\d+)M/);

    const days = daysMatch ? parseInt(daysMatch[1]) : 0;
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes}m`);

    return parts.join(' ');
};

// ✅ 2. 🟢 SMART BAGGAGE INFO — All Types (checked, carry_on, personal_item, etc.)
const getBaggageInfo = (slices: any[]) => {
    try {
        const bags = slices[0]?.segments[0]?.passengers?.[0]?.baggages;

        // ─── No Baggage Data ───
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

        // ─── Baggage Type Config ───
        const baggageConfig: Record<
            string,
            { label: string; icon: string; defaultWeight: number }
        > = {
            checked: { label: 'Checked Bag', icon: '🧳', defaultWeight: 23 },
            carry_on: { label: 'Carry-On', icon: '👜', defaultWeight: 7 },
            personal_item: { label: 'Personal Item', icon: '🎒', defaultWeight: 5 },
        };

        // ─── Parse Each Bag ───
        const details = bags.map((bag: any) => {
            // Get config or generate fallback for unknown types
            const config = baggageConfig[bag.type] || {
                label:
                    bag.type
                        ?.replace(/_/g, ' ')
                        .replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Other Bag',
                icon: '📦',
                defaultWeight: 0,
            };

            const qty = bag.quantity || 0;

            // Weight resolution: API explicit > Estimate > 0
            const hasExplicitWeight = bag.weight !== undefined && bag.weight !== null;
            const weightPerBag = hasExplicitWeight ? Number(bag.weight) : config.defaultWeight;
            const totalWeight = qty * weightPerBag;
            const isApprox = !hasExplicitWeight && config.defaultWeight > 0;
            const weightUnit = bag.weightUnit || bag.weight_unit || 'kg';

            // Display text
            let displayText = '';
            if (qty > 0) {
                if (totalWeight > 0) {
                    displayText = `${qty} × ${config.label} (${totalWeight}${weightUnit}${isApprox ? ' approx' : ''})`;
                } else {
                    displayText = `${qty} × ${config.label}`;
                }
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

        // ─── Flags ───
        const hasChecked = details.some((d: any) => d.type === 'checked' && d.quantity > 0);
        const hasCarryOn = details.some((d: any) => d.type === 'carry_on' && d.quantity > 0);
        const hasPersonalItem = details.some(
            (d: any) => d.type === 'personal_item' && d.quantity > 0,
        );

        // ─── Included Bags Only ───
        const includedBags = details.filter((d: any) => d.isIncluded);

        // ─── Summary String ───
        const summary =
            includedBags.length > 0
                ? includedBags.map((d: any) => d.displayText).join(' + ')
                : 'No Baggage Included';

        // ─── Total Weight ───
        const totalWeight = includedBags.reduce(
            (sum: number, d: any) => sum + d.totalWeight,
            0,
        );
        const hasAnyApprox = includedBags.some((d: any) => d.isApprox);

        return {
            summary,
            details,
            hasChecked,
            hasCarryOn,
            hasPersonalItem,
            totalWeight,
            totalWeightDisplay:
                totalWeight > 0
                    ? `${totalWeight}kg${hasAnyApprox ? ' approx' : ''} total`
                    : 'N/A',
            includedCount: includedBags.length,
        };
    } catch (e) {
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

// ------------------------------------------------------------------
// ⚙️ CONFIG
// ------------------------------------------------------------------
const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

export async function POST(req: NextRequest) {
    try {
        // 1. Security Check
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { success: false, error: 'Too many requests. Slow down.' },
                { status: 429 },
            );
        }

        // 2. Validation
        const body = await req.json();
        const validation = searchSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid Data' },
                { status: 400 },
            );
        }
        const {
            origin,
            destination,
            departureDate,
            returnDate,
            passengers: pax,
            cabinClass,
            type,
        } = validation.data;

        // 3. Prepare Duffel Params
        const passengers: any[] = [];
        Array.from({ length: pax?.adults || 1 }).forEach(() =>
            passengers.push({ type: 'adult' }),
        );
        if (pax?.children)
            Array.from({ length: pax.children }).forEach(() =>
                passengers.push({ type: 'child' }),
            );
        if (pax?.infants)
            Array.from({ length: pax.infants }).forEach(() =>
                passengers.push({ type: 'infant_without_seat' }),
            );

        const slices: any[] = [];
        if (type === 'multi_city' && body.flights) {
            body.flights.forEach((f: any) =>
                slices.push({
                    origin: f.origin,
                    destination: f.destination,
                    departure_date: f.date,
                }),
            );
        } else {
            slices.push({ origin, destination, departure_date: departureDate });
            if (type === 'round_trip' && returnDate) {
                slices.push({
                    origin: destination,
                    destination: origin,
                    departure_date: returnDate,
                });
            }
        }

        // 4. API Call
        const offerRequest = await duffel.offerRequests.create({
            slices,
            passengers,
            cabin_class: cabinClass as any,
            return_offers: true,
            
        });

        const rawOffers = offerRequest.data.offers || [];

        // 5. 🟢 ENTERPRISE DATA MAPPING
        const cleanOffers = rawOffers.map((offer: any) => {
            // A. Price Calculation
            const priceDetails = calculatePriceWithMarkup(
                offer.total_amount,
                offer.total_currency,
            );

            // B. 🟢 Baggage Logic — Full Object (All Types)
            const baggageInfo = getBaggageInfo(offer.slices);

            // C. Itinerary Mapping
            const itinerary = offer.slices.map((slice: any, index: number) => {
                const segments = slice.segments.map((seg: any, i: number, arr: any[]) => {
                    // Layover Calculation
                    let layover = null;
                    if (i < arr.length - 1) {
                        const arrTime = new Date(seg.arriving_at).getTime();
                        const depTime = new Date(arr[i + 1].departing_at).getTime();
                        const diffMins = (depTime - arrTime) / 60000;
                        const h = Math.floor(diffMins / 60);
                        const m = Math.floor(diffMins % 60);
                        layover = `${h}h ${m}m`;
                    }

                    // 🟢 Amenities Extraction
                    const amenities = [
                        seg.aircraft?.name ? `Aircraft: ${seg.aircraft.name}` : null,
                        'In-flight Meal',
                        'USB Power',
                    ].filter(Boolean);

                    return {
                        id: seg.id,
                        airline: seg.marketing_carrier?.name,
                        logo: seg.marketing_carrier?.logo_symbol_url,
                        flightNumber: `${seg.marketing_carrier?.iata_code} ${seg.marketing_carrier_flight_number}`,
                        aircraft: seg.aircraft?.name || 'Aircraft',
                        classType:
                            seg.passengers?.[0]?.cabin_class_marketing_name || cabinClass,

                        departure: {
                            airport: seg.origin?.name,
                            code: seg.origin?.iata_code,
                            time: seg.departing_at,
                        },
                        arrival: {
                            airport: seg.destination?.name,
                            code: seg.destination?.iata_code,
                            time: seg.arriving_at,
                        },

                        duration: parseDuration(seg.duration),
                        layoverToNext: layover,
                        amenities: amenities,
                    };
                });

                return {
                    id: slice.id,
                    direction:
                        type === 'round_trip'
                            ? index === 0
                                ? 'Outbound'
                                : 'Inbound'
                            : `Flight ${index + 1}`,
                    totalDuration: parseDuration(slice.duration),
                    stops: slice.segments.length - 1,
                    segments,
                    mainDeparture: segments[0].departure,
                    mainArrival: segments[segments.length - 1].arrival,
                    mainAirline: segments[0].airline,
                    mainLogo: segments[0].logo,
                };
            });

            return {
                id: offer.id,
                token: offer.id,
                carrier: {
                    name: offer.owner?.name,
                    logo: offer.owner?.logo_symbol_url,
                    code: offer.owner?.iata_code,
                },
                itinerary,
                price: priceDetails,
                baggage: baggageInfo,
                cabinClass: cabinClass,
                conditions: {
                    refundable: offer.conditions?.refund_before_departure?.allowed ?? false,
                    changeable: offer.conditions?.change_before_departure?.allowed ?? false,
                },
                expires_at: offer.expires_at,
            };
        });

        return NextResponse.json({
            success: true,
            meta: { count: cleanOffers.length },
            data: cleanOffers,
        });
    } catch (error: any) {
        console.error('Search Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch flights.' },
            { status: 500 },
        );
    }
}