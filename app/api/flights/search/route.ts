export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';

import {
  calculatePriceWithMarkup,
  checkRateLimit,
  buildDuffelPassengers,
  sortOffers,
  MAX_RESULT_LIMIT,
} from '../utils/search';
import { searchSchema } from '../schema/search';

// ------------------------------------------------------------------
// Duffel Client — singleton, initialized once at module level
// ------------------------------------------------------------------

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

// ------------------------------------------------------------------
// Duration Parser
// Converts ISO 8601 duration string (e.g. "P1DT10H30M") to "1d 10h 30m"
// ------------------------------------------------------------------

const parseDuration = (duration: string | null | undefined): string => {
  if (!duration) return '--';

  const iso = duration.toUpperCase();
  const days    = iso.match(/(\d+)D/)?.[1];
  const hours   = iso.match(/(\d+)H/)?.[1];
  const minutes = iso.match(/(\d+)M/)?.[1];

  const d = days    ? parseInt(days)    : 0;
  const h = hours   ? parseInt(hours)   : 0;
  const m = minutes ? parseInt(minutes) : 0;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || (d === 0 && h === 0)) parts.push(`${m}m`);

  return parts.join(' ');
};

// ------------------------------------------------------------------
// Baggage Info Builder
// Parses all baggage types per passenger from the first segment.
// Falls back to a safe "no info" object on any parse failure.
// ------------------------------------------------------------------

const getBaggageInfo = (slices: any[]) => {
  const EMPTY = {
    summary: 'No Baggage Info',
    details: [],
    hasChecked: false,
    hasCarryOn: false,
    hasPersonalItem: false,
    totalWeight: 0,
    totalWeightDisplay: 'N/A',
    includedCount: 0,
  };

  try {
    // Use the first passenger of the first segment as the reference
    const bags = slices[0]?.segments[0]?.passengers?.[0]?.baggages;
    if (!Array.isArray(bags) || bags.length === 0) return EMPTY;

    const BAGGAGE_CONFIG: Record<string, { label: string; icon: string; defaultWeight: number }> = {
      checked:       { label: 'Checked Bag',    icon: '🧳', defaultWeight: 23 },
      carry_on:      { label: 'Carry-On',        icon: '👜', defaultWeight: 7 },
      personal_item: { label: 'Personal Item',   icon: '🎒', defaultWeight: 5 },
    };

    const details = bags.map((bag: any) => {
      const config = BAGGAGE_CONFIG[bag.type] ?? {
        label: bag.type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Other Bag',
        icon: '📦',
        defaultWeight: 0,
      };

      const qty             = bag.quantity || 0;
      const hasExplicit     = bag.weight !== undefined && bag.weight !== null;
      const weightPerBag    = hasExplicit ? Number(bag.weight) : config.defaultWeight;
      const totalWeight     = qty * weightPerBag;
      const isApprox        = !hasExplicit && config.defaultWeight > 0;
      const weightUnit      = bag.weightUnit ?? bag.weight_unit ?? 'kg';

      let displayText = '';
      if (qty > 0) {
        displayText = totalWeight > 0
          ? `${qty} × ${config.label} (${totalWeight}${weightUnit}${isApprox ? ' approx' : ''})`
          : `${qty} × ${config.label}`;
      } else {
        displayText = `No ${config.label}`;
      }

      return {
        type:             bag.type,
        label:            config.label,
        icon:             config.icon,
        quantity:         qty,
        weightPerBag,
        totalWeight,
        weightUnit,
        isApprox,
        hasExplicitWeight: hasExplicit,
        isIncluded:       qty > 0,
        displayText,
      };
    });

    const included        = details.filter((d: any) => d.isIncluded);
    const totalWeight     = included.reduce((sum: number, d: any) => sum + d.totalWeight, 0);
    const hasAnyApprox    = included.some((d: any) => d.isApprox);

    return {
      summary:            included.length > 0 ? included.map((d: any) => d.displayText).join(' + ') : 'No Baggage Included',
      details,
      hasChecked:         details.some((d: any) => d.type === 'checked'       && d.quantity > 0),
      hasCarryOn:         details.some((d: any) => d.type === 'carry_on'      && d.quantity > 0),
      hasPersonalItem:    details.some((d: any) => d.type === 'personal_item' && d.quantity > 0),
      totalWeight,
      totalWeightDisplay: totalWeight > 0 ? `${totalWeight}kg${hasAnyApprox ? ' approx' : ''} total` : 'N/A',
      includedCount:      included.length,
    };
  } catch {
    return { ...EMPTY, summary: 'Check Baggage Rules' };
  }
};

// ------------------------------------------------------------------
// Offer Mapper
// Maps a raw Duffel offer into a clean, frontend-ready shape.
// ------------------------------------------------------------------

const mapOffer = (offer: any, cabinClass: string, tripType: string) => {
  const priceDetails  = calculatePriceWithMarkup(offer.total_amount, offer.total_currency);
  const baggageInfo   = getBaggageInfo(offer.slices);

  const itinerary = offer.slices.map((slice: any, index: number) => {
    const segments = slice.segments.map((seg: any, i: number, arr: any[]) => {
      // Layover to next segment
      let layoverToNext: string | null = null;
      if (i < arr.length - 1) {
        const diffMs   = new Date(arr[i + 1].departing_at).getTime() - new Date(seg.arriving_at).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins > 0) {
          layoverToNext = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
        }
      }

      // Only include amenities that are confirmed from the API — no hardcoding
      const amenities: string[] = [];
      if (seg.aircraft?.name) amenities.push(`Aircraft: ${seg.aircraft.name}`);

      return {
        id:           seg.id,
        airline:      seg.marketing_carrier?.name      ?? null,
        logo:         seg.marketing_carrier?.logo_symbol_url ?? null,
        flightNumber: seg.marketing_carrier?.iata_code && seg.marketing_carrier_flight_number
          ? `${seg.marketing_carrier.iata_code} ${seg.marketing_carrier_flight_number}`
          : null,
        aircraft:     seg.aircraft?.name               ?? null,
        classType:    seg.passengers?.[0]?.cabin_class_marketing_name ?? cabinClass,
        departure: {
          airport:    seg.origin?.name                 ?? null,
          code:       seg.origin?.iata_code            ?? null,
          city:       seg.origin?.city_name            ?? null,
          terminal:   seg.origin_terminal              ?? null,
          time:       seg.departing_at,
        },
        arrival: {
          airport:    seg.destination?.name            ?? null,
          code:       seg.destination?.iata_code       ?? null,
          city:       seg.destination?.city_name       ?? null,
          terminal:   seg.destination_terminal         ?? null,
          time:       seg.arriving_at,
        },
        duration:     parseDuration(seg.duration),
        layoverToNext,
        amenities,
      };
    });

    // Determine slice direction label
    const direction =
      tripType === 'round_trip'
        ? index === 0 ? 'Outbound' : 'Inbound'
        : tripType === 'multi_city'
        ? `Leg ${index + 1}`
        : 'Flight';

    return {
      id:            slice.id,
      direction,
      totalDuration: parseDuration(slice.duration),
      stops:         slice.segments.length - 1,
      segments,
      mainDeparture: segments[0]?.departure   ?? null,
      mainArrival:   segments[segments.length - 1]?.arrival ?? null,
      mainAirline:   segments[0]?.airline     ?? null,
      mainLogo:      segments[0]?.logo        ?? null,
    };
  });

  return {
    id:        offer.id,
    carrier: {
      name:    offer.owner?.name              ?? null,
      logo:    offer.owner?.logo_symbol_url   ?? null,
      code:    offer.owner?.iata_code         ?? null,
    },
    itinerary,
    price:     priceDetails,
    baggage:   baggageInfo,
    cabinClass,
    conditions: {
      refundable:  offer.conditions?.refund_before_departure?.allowed  ?? false,
      changeable:  offer.conditions?.change_before_departure?.allowed  ?? false,
    },
    expiresAt: offer.expires_at ?? null,
    // Passenger IDs — required when creating an order
    passengerIds: offer.passengers?.map((p: any) => ({ id: p.id, type: p.type, age: p.age ?? null })) ?? [],
  };
};

// ------------------------------------------------------------------
// POST /api/duffel/search
// ------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Rate limit check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please slow down.' },
      { status: 429 },
    );
  }

  // 2. Parse & validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const validation = searchSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed.',
        issues: validation.error.flatten().fieldErrors,
      },
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
    sort,
    maxConnections,
    flights,
  } = validation.data;

  // 3. Build Duffel passengers using validated data
  const passengers = buildDuffelPassengers({
    adults:    pax.adults,
    children:  pax.children,
    childAges: pax.childAges,
    infants:   pax.infants,
  });

  // 4. Build slices from validated data only (no raw body access)
  const slices: { origin: string; destination: string; departure_date: string }[] = [];

  if (type === 'multi_city' && flights && flights.length >= 2) {
    flights.forEach((f) =>
      slices.push({ origin: f.origin, destination: f.destination, departure_date: f.date }),
    );
  } else {
    slices.push({ origin: origin!, destination: destination!, departure_date: departureDate! });
    if (type === 'round_trip' && returnDate) {
      slices.push({ origin: destination!, destination: origin!, departure_date: returnDate });
    }
  }

  // 5. Call Duffel API
  let offerRequest: Awaited<ReturnType<typeof duffel.offerRequests.create>>;
  try {
    offerRequest = await duffel.offerRequests.create({
      slices,
      passengers,
      cabin_class: cabinClass,
      return_offers: true,
      ...(maxConnections !== undefined && { max_connections: maxConnections }),
    } as any);
  } catch (err: any) {
    // Duffel API errors have a structured shape
    const duffelMessage = err?.errors?.[0]?.message ?? err?.message ?? 'Duffel API error';
    console.error('[Search] Duffel API error:', duffelMessage);
    return NextResponse.json(
      { success: false, error: duffelMessage },
      { status: 502 },
    );
  }

  const rawOffers = offerRequest.data.offers ?? [];

  // 6. Map offers to clean frontend shape — apply result limit
  const mappedOffers = rawOffers
    .slice(0, MAX_RESULT_LIMIT)
    .map((offer:any) => mapOffer(offer, cabinClass, type));

  // 7. Sort offers if requested
  const finalOffers = sortOffers(mappedOffers, sort);

  // 8. Return response
  return NextResponse.json({
    success: true,
    meta: {
      total:          rawOffers.length,        // total from Duffel (before limit)
      returned:       finalOffers.length,       // after limit
      offerRequestId: offerRequest.data.id,     // store this — needed for order creation
      sort:           sort ?? 'none',
    },
    data: finalOffers,
  });
}