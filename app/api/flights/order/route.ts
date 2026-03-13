// app/api/duffel/booking/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import { encrypt, generateBookingReference, getShortDateTime } from '../utils/orders';
import { calculatePriceWithMarkup } from '@/app/api/flights/utils/search';
import Booking from '@/models/Booking.model';

// ================================================================
// FAIL-FAST: env validation at module load time
// ================================================================

if (!process.env.DUFFEL_ACCESS_TOKEN) {
    throw new Error(
        '[Booking] FATAL: DUFFEL_ACCESS_TOKEN is not set. ' +
        'Add it to your .env file and restart the server.',
    );
}

if (!process.env.ENCRYPTION_KEY || Buffer.from(process.env.ENCRYPTION_KEY, 'utf8').length !== 32) {
    throw new Error(
        '[Booking] FATAL: ENCRYPTION_KEY must be exactly 32 UTF-8 characters. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'hex\'))"',
    );
}

const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN });

// ================================================================
// CONSTANTS
// ================================================================

const ACTOR           = 'booking-api';
const MAX_PASSENGERS  = 9;
const MAX_PRICE_DRIFT = 1.00;
const MAX_BODY_BYTES  = 50_000;

const IP_BLACKLIST = new Set<string>(
    (process.env.BOOKING_IP_BLACKLIST ?? '').split(',').map(s => s.trim()).filter(Boolean),
);

// ================================================================
// RATE LIMITER — Sliding Window (in-memory)
// ================================================================

const rateLimitMap = new Map<string, number[]>();
let lastCleanup = Date.now();

function checkRateLimit(rawIp: string): { limited: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const ip  = (rawIp.split(',')[0] ?? 'unknown').trim();

    if (now - lastCleanup > 5 * 60_000) {
        lastCleanup = now;
        for (const [k, v] of rateLimitMap) {
            const fresh = v.filter(t => now - t < 60_000);
            if (fresh.length === 0) rateLimitMap.delete(k);
            else rateLimitMap.set(k, fresh);
        }
    }

    if (!rateLimitMap.has(ip) && rateLimitMap.size >= 10_000)
        return { limited: true, retryAfterMs: 60_000 };

    const ts    = (rateLimitMap.get(ip) ?? []).filter(t => now - t < 60_000);
    const burst = ts.filter(t => now - t < 10_000);

    if (burst.length >= 3)
        return { limited: true, retryAfterMs: 10_000 - (now - (burst[0] ?? now)) };

    if (ts.length >= 10)
        return { limited: true, retryAfterMs: 60_000 - (now - (ts[0] ?? now)) };

    ts.push(now);
    rateLimitMap.set(ip, ts);
    return { limited: false };
}

// ================================================================
// UTILITIES
// ================================================================

const isStr = (v: unknown): v is string =>
    typeof v === 'string' && v.trim().length > 0;

const upper = (v: unknown): string =>
    typeof v === 'string' ? v.trim().toUpperCase().replace(/\s+/g, ' ') : '';

function cleanPhone(v: unknown): string | undefined {
    if (typeof v !== 'string') return undefined;
    let c = v.trim().replace(/[\s\-().]/g, '');
    if (/^[1-9]\d{9,14}$/.test(c)) c = `+${c}`;
    return /^\+[1-9]\d{9,14}$/.test(c) ? c : undefined;
}

function parseDuration(d?: string | null): string {
    if (!d) return '--';
    const days = d.match(/(\d+)D/)?.[1];
    const hrs  = d.match(/(\d+)H/)?.[1];
    const mins = d.match(/(\d+)M/)?.[1];
    return [days && `${days}d`, hrs && `${hrs}h`, mins && `${mins}m`]
        .filter(Boolean).join(' ') || '0m';
}

function parseYMD(val: unknown): Date | null {
    if (!isStr(val)) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return null;
    const d = new Date(`${val}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
}

function calcAge(born: Date): number {
    const today = new Date();
    let age = today.getUTCFullYear() - born.getUTCFullYear();
    const m = today.getUTCMonth() - born.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < born.getUTCDate())) age--;
    return age;
}

function luhnCheck(num: string): boolean {
    const digits = num.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], 10);
        if (alt) { n *= 2; if (n > 9) n -= 9; }
        sum += n;
        alt = !alt;
    }
    return sum % 10 === 0;
}

function validateCardExpiry(expiry: string): { valid: boolean; error?: string } {
    const cleaned = expiry.trim().replace(/\s/g, '');
    const match   = cleaned.match(/^(\d{2})\/(\d{2}|\d{4})$/);
    if (!match) return { valid: false, error: 'Expiry date must be in MM/YY format.' };

    const month = parseInt(match[1], 10);
    if (month < 1 || month > 12)
        return { valid: false, error: 'Expiry month must be between 01 and 12.' };

    const yearStr = match[2].length === 2 ? `20${match[2]}` : match[2];
    const year    = parseInt(yearStr, 10);
    const now     = new Date();
    const expDate = new Date(year, month - 1, 1);
    expDate.setMonth(expDate.getMonth() + 1);

    if (expDate <= now)
        return { valid: false, error: 'This card has already expired.' };

    return { valid: true };
}

const adminNote = (msg: string) => ({ note: msg, addedBy: ACTOR, createdAt: new Date() });

// ================================================================
// PASSENGER VALIDATOR
// ================================================================

const VALID_TYPES    = ['adult', 'child', 'infant_without_seat'] as const;
const NAME_REGEX     = /^[A-Za-z\s\-']+$/;
const PASSPORT_REGEX = /^[A-Z0-9]{6,9}$/;
const ISO2_REGEX     = /^[A-Z]{2}$/;

type PassengerType = typeof VALID_TYPES[number];

interface RawPassenger {
    type?:            unknown;
    firstName?:       unknown;
    lastName?:        unknown;
    gender?:          unknown;
    dob?:             unknown;
    email?:           unknown;
    phone?:           unknown;
    passportNumber?:  unknown;
    passportExpiry?:  unknown;
    passportCountry?: unknown;
}

interface CleanPassenger {
    type:            PassengerType;
    firstName:       string;
    lastName:        string;
    gender:          'm' | 'f';
    title:           string;
    dob:             string;
    dobDate:         Date;
    age:             number;
    email?:          string;
    phone?:          string;
    passportNumber?: string;
    passportExpiry?: string;
    passportCountry: string;
    originalIndex:   number;
}

function validatePassenger(raw: RawPassenger, idx: number): CleanPassenger {
    const n = `Passenger ${idx + 1}`;

    if (!VALID_TYPES.includes(raw.type as PassengerType))
        throw new Error(`${n}: Invalid type "${raw.type}". Must be adult, child, or infant_without_seat.`);
    const type = raw.type as PassengerType;

    if (!isStr(raw.firstName)) throw new Error(`${n}: First name is required.`);
    if (!isStr(raw.lastName))  throw new Error(`${n}: Last name is required.`);

    if (!NAME_REGEX.test(String(raw.firstName).trim()))
        throw new Error(`${n}: First name "${raw.firstName}" contains invalid characters. Letters, spaces, hyphens, apostrophes only.`);
    if (!NAME_REGEX.test(String(raw.lastName).trim()))
        throw new Error(`${n}: Last name "${raw.lastName}" contains invalid characters. Letters, spaces, hyphens, apostrophes only.`);

    const firstName = upper(raw.firstName);
    const lastName  = upper(raw.lastName);

    if (firstName.length < 2)  throw new Error(`${n}: First name must be at least 2 characters.`);
    if (lastName.length  < 2)  throw new Error(`${n}: Last name must be at least 2 characters.`);
    if (firstName.length > 50) throw new Error(`${n}: First name is too long (max 50 characters).`);
    if (lastName.length  > 50) throw new Error(`${n}: Last name is too long (max 50 characters).`);

    const rawGender = typeof raw.gender === 'string' ? raw.gender.toLowerCase().trim() : '';
    const gender: 'm' | 'f' =
        rawGender === 'm' || rawGender === 'male'   ? 'm' :
        rawGender === 'f' || rawGender === 'female' ? 'f' :
        (() => { throw new Error(`${n}: Gender must be "male" or "female". Got "${raw.gender}".`); })();

    if (!isStr(raw.dob)) throw new Error(`${n}: Date of birth is required.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(raw.dob).trim()))
        throw new Error(`${n}: Date of birth must be YYYY-MM-DD (e.g. 1990-06-15).`);

    const dobDate = parseYMD(raw.dob);
    if (!dobDate) throw new Error(`${n}: Date of birth "${raw.dob}" is not a valid date.`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dobDate >= today)
        throw new Error(`${n}: Date of birth cannot be today or in the future.`);

    const age = calcAge(dobDate);
    if (age > 120)
        throw new Error(`${n}: Date of birth "${raw.dob}" seems incorrect (${age} years old).`);

    if (type === 'adult' && age < 12)
        throw new Error(`${n}: "${firstName} ${lastName}" is ${age} years old — too young for adult. Use "child" (ages 2–11).`);

    if (type === 'child') {
        if (age < 2)   throw new Error(`${n}: "${firstName} ${lastName}" is ${age} year(s) old. Children must be 2+. Use "infant_without_seat" for under 2.`);
        if (age >= 12) throw new Error(`${n}: "${firstName} ${lastName}" is ${age} years old — must be adult, not child.`);
    }

    if (type === 'infant_without_seat' && age >= 2)
        throw new Error(`${n}: "${firstName} ${lastName}" is ${age} years old. Infants must be under 2. Use "child".`);

    const title = gender === 'm' ? 'mr' : age < 12 ? 'miss' : 'ms';

    const email = isStr(raw.email) ? String(raw.email).trim().toLowerCase() : undefined;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error(`${n}: Email address "${email}" is not valid.`);

    const phone = cleanPhone(raw.phone);
    if (raw.phone && !phone)
        throw new Error(`${n}: Phone "${raw.phone}" is not valid. Use international format e.g. +8801XXXXXXXXX.`);

    let passportNumber:  string | undefined;
    let passportExpiry:  string | undefined;
    let passportCountry: string = 'BD';

    if (isStr(raw.passportNumber)) {
        const pp = String(raw.passportNumber).trim().toUpperCase();
        if (!PASSPORT_REGEX.test(pp))
            throw new Error(`${n}: Passport number "${pp}" invalid. Must be 6–9 alphanumeric chars (e.g. AB123456).`);

        passportNumber = pp;

        if (!isStr(raw.passportExpiry))
            throw new Error(`${n}: Passport expiry is required for "${firstName} ${lastName}".`);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(raw.passportExpiry).trim()))
            throw new Error(`${n}: Passport expiry must be YYYY-MM-DD format.`);

        const expDate = parseYMD(raw.passportExpiry);
        if (!expDate)
            throw new Error(`${n}: Passport expiry "${raw.passportExpiry}" is not a valid date.`);

        if (expDate <= today)
            throw new Error(`${n}: Passport for "${firstName} ${lastName}" has already expired (${raw.passportExpiry}).`);

        const minExpiry = new Date(today);
        minExpiry.setMonth(minExpiry.getMonth() + 6);
        if (expDate < minExpiry)
            throw new Error(`${n}: Passport for "${firstName} ${lastName}" expires ${raw.passportExpiry} — must be valid for at least 6 months from today.`);

        passportExpiry = String(raw.passportExpiry).trim();

        if (isStr(raw.passportCountry)) {
            const cc = String(raw.passportCountry).trim().toUpperCase();
            if (!ISO2_REGEX.test(cc))
                throw new Error(`${n}: Passport country "${raw.passportCountry}" must be a 2-letter ISO code (e.g. BD, US, GB).`);
            passportCountry = cc;
        }
    }

    return {
        type, firstName, lastName, gender, title,
        dob: String(raw.dob).trim(), dobDate, age,
        email, phone, passportNumber, passportExpiry, passportCountry,
        originalIndex: idx,
    };
}

// ================================================================
// OFFER PASSENGER POOL MATCHER
// ================================================================

interface OfferPassenger {
    id:    string;
    type?: string | null;
    age?:  number | null;
}

function resolveOfferPaxType(p: OfferPassenger): PassengerType {
    if (p.type === 'adult')               return 'adult';
    if (p.type === 'child')               return 'child';
    if (p.type === 'infant_without_seat') return 'infant_without_seat';
    if (p.age != null && p.age < 2)                return 'infant_without_seat';
    if (p.age != null && p.age >= 2 && p.age < 12) return 'child';
    return 'adult';
}

function matchPassengersToOffer(
    passengers: CleanPassenger[],
    offerPassengers: OfferPassenger[],
): { passenger: CleanPassenger; offerId: string }[] {
    const pool: Record<PassengerType, OfferPassenger[]> = {
        adult:               offerPassengers.filter(p => resolveOfferPaxType(p) === 'adult'),
        child:               offerPassengers.filter(p => resolveOfferPaxType(p) === 'child'),
        infant_without_seat: offerPassengers.filter(p => resolveOfferPaxType(p) === 'infant_without_seat'),
    };

    console.log('[Booking] Offer passenger pools:', {
        adults:   pool.adult.map(p => ({ id: p.id, type: p.type, age: p.age })),
        children: pool.child.map(p => ({ id: p.id, type: p.type, age: p.age })),
        infants:  pool.infant_without_seat.map(p => ({ id: p.id, type: p.type, age: p.age })),
    });

    const used: Record<PassengerType, number> = { adult: 0, child: 0, infant_without_seat: 0 };

    return passengers.map((p, idx) => {
        const available = pool[p.type];
        const useIdx    = used[p.type];

        if (useIdx >= available.length)
            throw new Error(
                `Passenger ${idx + 1}: No available offer slot for type "${p.type}". ` +
                `Offer has ${available.length} ${p.type}(s) but you submitted ${useIdx + 1}.`,
            );

        const offerPax = available[useIdx];
        used[p.type]++;

        if (!offerPax?.id)
            throw new Error(`Offer passenger ID missing at pool position ${useIdx} for type "${p.type}". Please try again.`);

        return { passenger: p, offerId: offerPax.id };
    });
}

// ================================================================
// FLIGHT DETAILS BUILDER
// ================================================================

function buildFlightDetails(offer: any) {
    const slices     = Array.isArray(offer?.slices) ? offer.slices : [];
    const firstSlice = slices[0];
    const firstSeg   = firstSlice?.segments?.[0];
    const lastSlice  = slices[slices.length - 1];
    const lastSeg    = lastSlice?.segments?.[lastSlice?.segments?.length - 1];

    const routeCodes: string[] = [];
    slices.forEach((slice: any, i: number) => {
        const segs = Array.isArray(slice?.segments) ? slice.segments : [];
        if (i === 0) { const c = segs[0]?.origin?.iata_code; if (c) routeCodes.push(c); }
        const last = segs[segs.length - 1];
        const c    = last?.destination?.iata_code;
        if (c) routeCodes.push(c);
    });

    const tripType =
        slices.length === 1 ? 'one_way' :
        slices.length === 2 ? 'round_trip' : 'multi_city';

    const segments = slices.flatMap((slice: any) =>
        (Array.isArray(slice?.segments) ? slice.segments : []).map((seg: any) => ({
            segmentId:    seg?.id ?? null,
            carrier:      seg?.operating_carrier?.name ?? seg?.marketing_carrier?.name ?? null,
            flightNumber: [seg?.operating_carrier?.iata_code ?? '', seg?.operating_carrier_flight_number ?? ''].join('').trim() || null,
            origin:       seg?.origin?.iata_code ?? null,
            destination:  seg?.destination?.iata_code ?? null,
            departureAt:  seg?.departing_at ?? null,
            arrivingAt:   seg?.arriving_at ?? null,
            duration:     parseDuration(seg?.duration),
            cabin:        seg?.passengers?.[0]?.cabin_class ?? 'economy',
        })),
    );

    return {
        airline:       offer?.owner?.name ?? firstSeg?.operating_carrier?.name ?? null,
        flightNumber:  firstSeg ? [firstSeg?.operating_carrier?.iata_code ?? '', firstSeg?.operating_carrier_flight_number ?? ''].join('').trim() || null : null,
        route:         routeCodes.join(' → ') || 'N/A',
        departureDate: firstSeg?.departing_at ?? null,
        arrivalDate:   lastSeg?.arriving_at ?? null,
        duration:      parseDuration(firstSlice?.duration),
        logoUrl:       offer?.owner?.logo_symbol_url ?? null,
        flightType:    tripType,
        segments,
    };
}

// ================================================================
// INFANT ↔ ADULT LINKER
// ================================================================

function linkInfantsToAdults(
    passengers: CleanPassenger[],
    matchedPassengers: { passenger: CleanPassenger; offerId: string }[],
    duffelPassengers: Record<string, any>[],
): void {
    const adultOriginalIndices  = passengers.filter(p => p.type === 'adult').map(p => p.originalIndex);
    const infantOriginalIndices = passengers.filter(p => p.type === 'infant_without_seat').map(p => p.originalIndex);

    const indexToOfferId = new Map<number, string>();
    matchedPassengers.forEach(({ passenger: p, offerId }) => indexToOfferId.set(p.originalIndex, offerId));

    const offerIdToPayload = new Map<string, Record<string, any>>();
    duffelPassengers.forEach(p => { if (p.id) offerIdToPayload.set(p.id, p); });

    infantOriginalIndices.forEach((infantOrigIdx, i) => {
        const adultOrigIdx  = adultOriginalIndices[i];
        if (adultOrigIdx === undefined) return;

        const adultOfferId  = indexToOfferId.get(adultOrigIdx);
        const infantOfferId = indexToOfferId.get(infantOrigIdx);
        if (!adultOfferId || !infantOfferId) return;

        const adultPayload = offerIdToPayload.get(adultOfferId);
        if (adultPayload) adultPayload.infant_passenger_id = infantOfferId;
    });
}

// ================================================================
// POST /api/duffel/booking
// ================================================================

export async function POST(request: NextRequest) {
    let newBookingId: string | null = null;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    if (IP_BLACKLIST.has(ip))
        return NextResponse.json(
            { success: false, error: 'Access denied.', errorType: 'BLOCKED' },
            { status: 403 },
        );

    const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
    if (contentLength > MAX_BODY_BYTES)
        return NextResponse.json(
            { success: false, error: 'Request too large.', errorType: 'PAYLOAD_TOO_LARGE' },
            { status: 413 },
        );

    const rl = checkRateLimit(ip);
    if (rl.limited) {
        const retry = Math.ceil((rl.retryAfterMs ?? 60_000) / 1000);
        return NextResponse.json(
            { success: false, error: `Too many booking attempts. Please wait ${retry}s before trying again.`, errorType: 'RATE_LIMITED' },
            { status: 429, headers: { 'Retry-After': String(retry) } },
        );
    }

    try {
        await dbConnect();

        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid request format. Please try again.' },
                { status: 400 },
            );
        }

        const { offer_id, contact, passengers: rawPassengers, payment } = body ?? {};

        // ================================================================
        // SECTION 1 — TOP-LEVEL FIELD VALIDATION
        // ================================================================

        if (!isStr(offer_id))
            return NextResponse.json({ success: false, error: 'Offer ID is missing. Please go back and select a flight again.' }, { status: 400 });

        if (!contact || typeof contact !== 'object' || Array.isArray(contact))
            return NextResponse.json({ success: false, error: 'Contact information is required.' }, { status: 400 });

        if (!isStr(contact.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contact.email).trim()))
            return NextResponse.json({ success: false, error: 'A valid contact email address is required (e.g. john@example.com).' }, { status: 400 });

        const contactPhone = cleanPhone(contact.phone);
        if (!contactPhone)
            return NextResponse.json({ success: false, error: 'A valid contact phone number with country code is required (e.g. +8801XXXXXXXXX).' }, { status: 400 });

        if (!Array.isArray(rawPassengers) || rawPassengers.length === 0)
            return NextResponse.json({ success: false, error: 'At least one passenger is required.' }, { status: 400 });

        if (rawPassengers.length > MAX_PASSENGERS)
            return NextResponse.json({ success: false, error: `Maximum ${MAX_PASSENGERS} passengers allowed per booking.` }, { status: 400 });

        if (!payment || typeof payment !== 'object' || Array.isArray(payment))
            return NextResponse.json({ success: false, error: 'Payment information is required.' }, { status: 400 });

        if (!isStr(payment.cardNumber))
            return NextResponse.json({ success: false, error: 'Card number is required.' }, { status: 400 });

        if (!isStr(payment.cardName))
            return NextResponse.json({ success: false, error: 'Cardholder name is required.' }, { status: 400 });

        if (!isStr(payment.expiryDate))
            return NextResponse.json({ success: false, error: 'Card expiry date is required.' }, { status: 400 });

        const rawCard = String(payment.cardNumber).replace(/\s/g, '');
        if (!luhnCheck(rawCard))
            return NextResponse.json({ success: false, error: 'Card number is not valid. Please check and try again.', errorType: 'INVALID_CARD' }, { status: 400 });

        const expiryCheck = validateCardExpiry(String(payment.expiryDate));
        if (!expiryCheck.valid)
            return NextResponse.json({ success: false, error: expiryCheck.error ?? 'Card expiry date is invalid.', errorType: 'INVALID_CARD' }, { status: 400 });

        const addr = payment.billingAddress;
        if (!addr || typeof addr !== 'object')
            return NextResponse.json({ success: false, error: 'Billing address is required.' }, { status: 400 });

        if (!isStr(addr.street))
            return NextResponse.json({ success: false, error: 'Billing street address is required.' }, { status: 400 });

        if (!isStr(addr.city))
            return NextResponse.json({ success: false, error: 'Billing city is required.' }, { status: 400 });

        // ================================================================
        // SECTION 2 — PASSENGER VALIDATION
        // ================================================================

        let passengers: CleanPassenger[];
        try {
            passengers = rawPassengers.map((p: unknown, i: number) =>
                validatePassenger(p as RawPassenger, i),
            );
        } catch (err: any) {
            return NextResponse.json(
                { success: false, error: err?.message ?? 'Invalid passenger data.', errorType: 'VALIDATION_ERROR' },
                { status: 400 },
            );
        }

        const adults   = passengers.filter(p => p.type === 'adult');
        const children = passengers.filter(p => p.type === 'child');
        const infants  = passengers.filter(p => p.type === 'infant_without_seat');

        if (adults.length === 0)
            return NextResponse.json(
                { success: false, error: 'At least one adult passenger is required. Children and infants cannot travel alone.', errorType: 'VALIDATION_ERROR' },
                { status: 400 },
            );

        if (infants.length > adults.length)
            return NextResponse.json(
                { success: false, error: `You have ${infants.length} infant(s) but only ${adults.length} adult(s). Each infant must travel with one adult.`, errorType: 'VALIDATION_ERROR' },
                { status: 400 },
            );

        const paxKeys = passengers.map(p => `${p.firstName}|${p.lastName}|${p.dob}`);
        if (new Set(paxKeys).size !== paxKeys.length)
            return NextResponse.json(
                { success: false, error: 'Duplicate passenger detected. Each passenger must be unique.', errorType: 'VALIDATION_ERROR' },
                { status: 400 },
            );

        const passports = passengers.map(p => p.passportNumber).filter(Boolean) as string[];
        if (new Set(passports).size !== passports.length)
            return NextResponse.json(
                { success: false, error: 'Duplicate passport number found. Each passenger must have a unique passport.', errorType: 'VALIDATION_ERROR' },
                { status: 400 },
            );

        // ================================================================
        // SECTION 3 — FETCH FRESH OFFER FROM DUFFEL
        // ================================================================

        let offer: any;
        try {
            const res = await duffel.offers.get(String(offer_id).trim());
            offer = res?.data;
        } catch (err: any) {
            const code      = err?.errors?.[0]?.code ?? '';
            const status    = err?.meta?.status ?? err?.response?.status ?? 0;
            const isExpired =
                code === 'offer_no_longer_available' || status === 404 ||
                String(err?.message ?? '').toLowerCase().includes('expired');

            return NextResponse.json(
                {
                    success:   false,
                    error:     isExpired
                        ? 'This flight offer has expired. Please search again for the latest prices.'
                        : 'Could not retrieve flight details from the airline. Please try again.',
                    errorType: 'OFFER_EXPIRED',
                    expired:   true,
                },
                { status: 410 },
            );
        }

        if (!offer)
            return NextResponse.json(
                { success: false, error: 'No flight data received. Please search again.', expired: true },
                { status: 410 },
            );

        // ── Hold / pay_later support check ──
        // Reject immediately if offer requires instant payment or has no hold deadline.
        // This avoids the invalid_order_create_type error from Duffel.
        const payReq = offer?.payment_requirements;
        if (payReq?.requires_instant_payment || !payReq?.payment_required_by) {
            return NextResponse.json(
                {
                    success:   false,
                    error:     'This flight requires instant payment and cannot be held. Please contact us at +1-213-985-8499 to complete this booking.',
                    errorType: 'INSTANT_PAYMENT_REQUIRED',
                },
                { status: 400 },
            );
        }

        // ── Explicit expiry check ──
        if (offer?.expires_at) {
            const expiresAt = new Date(offer.expires_at);
            if (!isNaN(expiresAt.getTime()) && expiresAt <= new Date())
                return NextResponse.json(
                    { success: false, error: 'This flight offer has just expired. Please search again.', errorType: 'OFFER_EXPIRED', expired: true },
                    { status: 410 },
                );
        }

        // ── offer.passengers must not be empty ──
        const offerPassengers: OfferPassenger[] = Array.isArray(offer?.passengers) ? offer.passengers : [];
        if (offerPassengers.length === 0)
            return NextResponse.json(
                { success: false, error: 'Invalid offer: no passenger data found. Please search again.', errorType: 'OFFER_INVALID' },
                { status: 400 },
            );

        // ── Passenger count must match ──
        if (offerPassengers.length !== passengers.length)
            return NextResponse.json(
                {
                    success:   false,
                    error:     `This offer is for ${offerPassengers.length} passenger(s) but you submitted ${passengers.length}. Please go back and search again.`,
                    errorType: 'VALIDATION_ERROR',
                },
                { status: 400 },
            );

        // ── Type-based pool matching ──
        let matchedPassengers: { passenger: CleanPassenger; offerId: string }[];
        try {
            matchedPassengers = matchPassengersToOffer(passengers, offerPassengers);
        } catch (err: any) {
            return NextResponse.json(
                { success: false, error: err?.message ?? 'Passenger matching failed. Please try again.', errorType: 'VALIDATION_ERROR' },
                { status: 400 },
            );
        }

        // ── Pricing ──
        const duffelBaseRaw = Number(offer?.total_amount ?? 0);
        if (!Number.isFinite(duffelBaseRaw) || duffelBaseRaw <= 0)
            return NextResponse.json(
                { success: false, error: 'Could not determine a valid price for this flight. Please search again.', errorType: 'OFFER_INVALID' },
                { status: 400 },
            );

        const pricing       = calculatePriceWithMarkup(offer.total_amount, offer.total_currency);
        const flightDetails = buildFlightDetails(offer);
        const isLiveMode    = offer?.live_mode ?? process.env.NODE_ENV === 'production';

        if (!isLiveMode)
            console.warn(`[Booking] ⚠ TEST MODE: offer ${offer_id} is not live. No real booking will be made.`);

        // ================================================================
        // SECTION 4 — BUILD DUFFEL PASSENGER PAYLOAD
        // ================================================================

        const duffelPassengers = matchedPassengers.map(({ passenger: p, offerId: paxOfferId }) => {
            const pax: Record<string, any> = {
                id:           paxOfferId,
                given_name:   p.firstName,
                family_name:  p.lastName,
                gender:       p.gender,
                title:        p.title,
                born_on:      p.dob,
                email:        p.email ?? String(contact.email).trim().toLowerCase(),
                phone_number: p.phone ?? contactPhone,
            };

            if (p.passportNumber) {
                pax.identity_documents = [{
                    unique_identifier:    p.passportNumber,
                    type:                 'passport',
                    expires_on:           p.passportExpiry,
                    issuing_country_code: p.passportCountry,
                }];
            }

            return pax;
        });

        // ── Link each infant to an adult ──
        linkInfantsToAdults(passengers, matchedPassengers, duffelPassengers);

        // ================================================================
        // SECTION 5 — CREATE INITIAL BOOKING RECORD (status: processing)
        // ================================================================

        const bookingRef          = generateBookingReference();
        const encryptedCardNumber = encrypt(rawCard);

        let newBooking: any;
        try {
            newBooking = await Booking.create({
                bookingReference: bookingRef,
                offerId:          String(offer_id).trim(),

                contact: {
                    email: String(contact.email).trim().toLowerCase(),
                    phone: contactPhone,
                },

                passengers: matchedPassengers.map(({ passenger: p, offerId: paxOfferId }) => ({
                    id:              paxOfferId,
                    type:            p.type,
                    title:           p.title.toUpperCase(),
                    firstName:       p.firstName,
                    lastName:        p.lastName,
                    gender:          p.gender === 'm' ? 'male' : 'female',
                    dob:             p.dobDate,
                    passportNumber:  p.passportNumber  ?? null,
                    passportExpiry:  p.passportExpiry  ? new Date(`${p.passportExpiry}T00:00:00Z`) : null,
                    passportCountry: p.passportCountry,
                })),

                flightDetails,

                pricing: {
                    currency:     pricing.currency,
                    total_amount: pricing.finalPrice,
                    markup:       pricing.markup,
                    base_amount:  duffelBaseRaw,
                },

                paymentInfo: {
                    cardName:       String(payment.cardName).trim(),
                    cardNumber:     encryptedCardNumber,
                    expiryDate:     String(payment.expiryDate).trim(),
                    billingAddress: {
                        street:  String(addr.street  ?? '').trim(),
                        city:    String(addr.city    ?? '').trim(),
                        state:   String(addr.state   ?? '').trim(),
                        zipCode: String(addr.zipCode ?? '').trim(),
                        country: String(addr.country ?? 'US').trim().toUpperCase(),
                    },
                },

                documents:               [],
                airlineInitiatedChanges: null,
                status:                  'processing',
                paymentStatus:           'pending',
                isLiveMode,

                adminNotes: [
                    adminNote(
                        `Booking initiated | Offer: ${offer_id} | Pax: ${passengers.length} ` +
                        `(${adults.length}A ${children.length}C ${infants.length}I) | IP: ${ip} | Live: ${isLiveMode}`,
                    ),
                    ...(!isLiveMode ? [adminNote('⚠ TEST MODE — this is not a live booking.')] : []),
                ],
            });
        } catch (createErr: any) {
            if (createErr?.code === 11000 && createErr?.keyPattern?.offerId) {
                console.warn(`[Booking] Duplicate booking blocked for offer ${offer_id}`);
                return NextResponse.json(
                    {
                        success:   false,
                        error:     'This flight has already been booked or is currently being processed. Please check your bookings or contact support.',
                        errorType: 'DUPLICATE_BOOKING',
                    },
                    { status: 409 },
                );
            }
            throw createErr;
        }

        newBookingId = newBooking._id.toString();

        // ================================================================
        // SECTION 6 — CREATE DUFFEL HOLD ORDER (pay_later)
        // ================================================================

        let order: any;
        try {
            order = await duffel.orders.create({
                type:            'pay_later',
                selected_offers: [String(offer_id).trim()],
                passengers:      duffelPassengers as any,
            });
        } catch (duffelErr: any) {
            const errList   = duffelErr?.errors ?? duffelErr?.response?.data?.errors ?? [];
            const firstErr  = errList[0] ?? {};
            const errCode   = firstErr?.code ?? duffelErr?.meta?.error?.code ?? '';
            const errDetail = firstErr?.message ?? firstErr?.detail ?? firstErr?.title ?? '';

            const friendlyMsg =
                errCode === 'offer_no_longer_available'
                    ? 'This flight is no longer available at this price. Please search again for updated fares.'
                : errCode === 'invalid_order_create_type'
                    ? 'This flight requires instant payment and cannot be held. Please contact us at +1-213-985-8499.'
                : errCode === 'instant_payment_required' || errCode === 'offer_requires_instant_payment'
                    ? 'This flight requires instant payment. Please call us at +1-213-985-8499.'
                : errCode === 'invalid_passenger_identity_document_expiry_date'
                    ? 'One or more passport expiry dates were rejected by the airline. Please check your passport details.'
                : errCode === 'invalid_passenger_date_of_birth'
                    ? 'One or more date of birth values were rejected. Please verify passenger details.'
                : errCode === 'passenger_name_invalid' || errCode === 'invalid_passenger_name'
                    ? 'A passenger name was rejected. Please ensure names match your travel documents exactly.'
                : errDetail
                    ? `Booking failed: ${errDetail}`
                    : 'Flight booking failed with the airline. Please try again or contact support.';

            console.error('[Booking] Duffel order error:', { errCode, errDetail, offer_id, bookingRef });

            await Booking.findByIdAndUpdate(newBookingId, {
                $set:  { status: 'failed',paymentStatus:'failed' },
                
                $push: { adminNotes: adminNote(`Duffel error [${errCode || 'unknown'}]: ${errDetail || friendlyMsg}`) },
            }).catch(e => console.error('[Booking] Failed to update status to failed:', e));

            return NextResponse.json(
                {
                    success:   false,
                    error:     friendlyMsg,
                    errorType: errCode === 'offer_no_longer_available' ? 'OFFER_EXPIRED'
                             : errCode === 'invalid_order_create_type' ? 'INSTANT_PAYMENT_REQUIRED'
                             : 'API_ERROR',
                    expired:   errCode === 'offer_no_longer_available',
                },
                { status: 400 },
            );
        }

        if (!order?.data?.id) {
            console.error('[Booking] Duffel returned empty order. offer_id:', offer_id);
            await Booking.findByIdAndUpdate(newBookingId, {
                $set:  { status: 'failed',paymentStatus:'failed' },
                $push: { adminNotes: adminNote('Duffel returned an empty order response.') },
            }).catch(() => {});
            return NextResponse.json(
                { success: false, error: 'No confirmation received from the airline. Please contact us at murad.usa09@gmail.com.', errorType: 'API_ERROR' },
                { status: 502 },
            );
        }

        // ── Price drift check ──
        const confirmedBase = Number(order.data?.total_amount ?? 0);
        if (Number.isFinite(confirmedBase) && confirmedBase > 0) {
            const drift = Math.abs(confirmedBase - duffelBaseRaw);
            if (drift > MAX_PRICE_DRIFT) {
                console.warn('[Booking] Price drift:', { offer: duffelBaseRaw, confirmed: confirmedBase, drift: drift.toFixed(2) });
                await Booking.findByIdAndUpdate(newBookingId, {
                    $push: { adminNotes: adminNote(`⚠ Price drift: offer=${duffelBaseRaw}, confirmed=${confirmedBase}, diff=${drift.toFixed(2)} ${order.data?.total_currency ?? ''}`) },
                }).catch(() => {});
            }
        }

        // ================================================================
        // SECTION 7 — UPDATE BOOKING WITH CONFIRMED DUFFEL RESPONSE
        // ================================================================

        const confirmedSegments = (order.data?.slices ?? []).flatMap((slice: any) =>
            (Array.isArray(slice?.segments) ? slice.segments : []).map((seg: any) => ({
                segmentId:    seg?.id ?? null,
                carrier:      seg?.operating_carrier?.name ?? null,
                flightNumber: [seg?.operating_carrier?.iata_code ?? '', seg?.operating_carrier_flight_number ?? ''].join('').trim() || null,
                origin:       seg?.origin?.iata_code ?? null,
                destination:  seg?.destination?.iata_code ?? null,
                departureAt:  seg?.departing_at ?? null,
                arrivingAt:   seg?.arriving_at ?? null,
                duration:     parseDuration(seg?.duration),
                cabin:        seg?.passengers?.[0]?.cabin_class ?? 'economy',
            })),
        );

        const finalBase       = confirmedBase > 0 ? confirmedBase : duffelBaseRaw;
        const confirmedMarkup = pricing.finalPrice - finalBase;
        const paymentDeadline = order.data?.payment_status?.payment_required_by ?? null;
        const priceExpiry     = order.data?.payment_status?.price_guarantee_expires_at ?? null;
        const pnr             = order.data?.booking_reference ?? null;
        const duffelOrderId   = order.data.id;

        // ── BUG FIX: removed .filter(d => d?.url) ──
        // Test mode documents don't always have URLs.
        // Filtering them out hides dummy tickets in test mode entirely.
        const orderDocuments = (Array.isArray(order.data?.documents) ? order.data.documents : [])
            .map((d: any) => ({
                unique_identifier: d?.unique_identifier ?? '',
                docType:           d?.type ?? 'electronic_ticket',
                url:               d?.url  ?? '',
            }));

        let updateSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await Booking.findByIdAndUpdate(newBookingId, {
                    $set: {
                        duffelOrderId,
                        pnr,
                        paymentDeadline,
                        priceExpiry,
                        isLiveMode:               order.data?.live_mode ?? false,
                        status:                   'held',
                        // paymentStatus stays 'pending' — admin will capture manually
                        documents:                orderDocuments,
                        airlineInitiatedChanges:  order.data?.airline_initiated_changes ?? null,
                        'flightDetails.segments': confirmedSegments,
                        'pricing.base_amount':    finalBase,
                        'pricing.markup':         Number(confirmedMarkup.toFixed(2)),
                    },
                    $push: {
                        adminNotes: adminNote(
                            `Hold confirmed | Order: ${duffelOrderId} | PNR: ${pnr ?? 'N/A'} | ` +
                            `Deadline: ${getShortDateTime(paymentDeadline) ?? 'N/A'} | Live: ${order.data?.live_mode ?? false}`,
                        ),
                    },
                });
                updateSuccess = true;
                break;
            } catch (updateErr: any) {
                console.error(`[Booking] MongoDB update attempt ${attempt} failed:`, updateErr?.message);
                if (attempt < 3) await new Promise(r => setTimeout(r, 300 * attempt));
            }
        }

        if (!updateSuccess) {
            console.error(
                `[CRITICAL] Booking DB update failed after 3 attempts. ` +
                `Duffel order ${duffelOrderId} is HELD but DB record ${newBookingId} is still 'processing'. ` +
                `PNR: ${pnr ?? 'N/A'} | Ref: ${bookingRef} | Manual fix required.`,
            );
        }

        return NextResponse.json({
            success:   true,
            bookingId: newBookingId,
            reference: bookingRef,
            pnr,
            expiry:    paymentDeadline,
        });

    } catch (error: any) {
        console.error('[Booking] Unexpected error:', error?.message ?? error);

        if (newBookingId) {
            await Booking.findByIdAndUpdate(newBookingId, {
               $set:  { status: 'failed',paymentStatus:'failed' },
                $push: { adminNotes: adminNote(`Unexpected error: ${error?.message ?? 'Unknown'}`) },
            }).catch(e => console.error('[Booking] Could not mark booking failed:', e));
        }

        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern ?? {})[0] ?? 'field';
            return NextResponse.json(
                { success: false, error: `A duplicate entry was found for ${field}. Please try again.`, errorType: 'DUPLICATE_ERROR' },
                { status: 409 },
            );
        }

        if (error?.name === 'ValidationError') {
            const msg = Object.values(error.errors ?? {}).map((v: any) => v?.message).filter(Boolean)[0] ?? 'Validation failed.';
            return NextResponse.json(
                { success: false, error: msg, errorType: 'VALIDATION_ERROR' },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { success: false, error: 'An unexpected error occurred. Please try again or contact support at murad.usa09@gmail.com.', errorType: 'SERVER_ERROR' },
            { status: 500 },
        );
    }
}