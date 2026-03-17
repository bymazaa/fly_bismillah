// app/api/booking/status/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

// ================================================================
// POST /api/booking/status
// Lookup booking by email + PNR (or bookingReference)
// Returns sanitized booking data — no sensitive info
// ================================================================

const rateLimitMap = new Map<string, number[]>();
let lastCleanup = Date.now();

function checkRateLimit(ip: string): { limited: boolean; retryAfterMs?: number } {
    const now = Date.now();

    // Periodic cleanup
    if (now - lastCleanup > 5 * 60_000) {
        lastCleanup = now;
        for (const [k, v] of rateLimitMap) {
            const fresh = v.filter(t => now - t < 60_000);
            if (fresh.length === 0) rateLimitMap.delete(k);
            else rateLimitMap.set(k, fresh);
        }
    }

    const ts    = (rateLimitMap.get(ip) ?? []).filter(t => now - t < 60_000);
    const burst = ts.filter(t => now - t < 10_000);

    // Max 5 attempts per 10 seconds (prevents brute-force PNR guessing)
    if (burst.length >= 5)
        return { limited: true, retryAfterMs: 10_000 - (now - (burst[0] ?? now)) };

    // Max 15 attempts per minute
    if (ts.length >= 15)
        return { limited: true, retryAfterMs: 60_000 - (now - (ts[0] ?? now)) };

    ts.push(now);
    rateLimitMap.set(ip, ts);
    return { limited: false };
}

// Failed attempt tracker — lock out after too many misses (anti-enumeration)
const failedAttempts = new Map<string, { count: number; lastAt: number }>();

function checkFailedAttempts(ip: string): boolean {
    const now = Date.now();
    const record = failedAttempts.get(ip);
    if (!record) return true;
    // Reset after 15 minutes
    if (now - record.lastAt > 15 * 60_000) {
        failedAttempts.delete(ip);
        return true;
    }
    // Block after 10 consecutive failures
    return record.count < 10;
}

function recordFailedAttempt(ip: string): void {
    const now = Date.now();
    const record = failedAttempts.get(ip);
    if (!record || now - record.lastAt > 15 * 60_000) {
        failedAttempts.set(ip, { count: 1, lastAt: now });
    } else {
        record.count++;
        record.lastAt = now;
    }
}

function resetFailedAttempts(ip: string): void {
    failedAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    // ── Rate limit ──
    const rl = checkRateLimit(ip);
    if (rl.limited) {
        const retry = Math.ceil((rl.retryAfterMs ?? 60_000) / 1000);
        return NextResponse.json(
            { success: false, error: `Too many attempts. Please wait ${retry} seconds.` },
            { status: 429, headers: { 'Retry-After': String(retry) } },
        );
    }

    // ── Failed attempts lockout ──
    if (!checkFailedAttempts(ip)) {
        return NextResponse.json(
            { success: false, error: 'Too many failed attempts. Please try again in 15 minutes.' },
            { status: 429 },
        );
    }

    try {
        // ── Parse body ──
        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid request format.' },
                { status: 400 },
            );
        }

        const { email, identifier } = body ?? {};

        // ── Validate email ──
        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Email address is required.' },
                { status: 400 },
            );
        }

        const cleanEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return NextResponse.json(
                { success: false, error: 'Please enter a valid email address.' },
                { status: 400 },
            );
        }

        // ── Validate identifier (PNR or Booking Reference) ──
        if (!identifier || typeof identifier !== 'string' || identifier.trim().length < 4) {
            return NextResponse.json(
                { success: false, error: 'PNR or Booking Reference is required (at least 4 characters).' },
                { status: 400 },
            );
        }

        const cleanId = identifier.trim().toUpperCase();

        if (cleanId.length > 20) {
            return NextResponse.json(
                { success: false, error: 'PNR or Booking Reference is too long.' },
                { status: 400 },
            );
        }

        await dbConnect();

        // ── Search: email must match AND (PNR or bookingReference) ──
        // This ensures you can't guess a PNR without knowing the email
        const booking = await Booking.findOne({
            'contact.email': cleanEmail,
            $or: [
                { pnr: cleanId },
                { bookingReference: cleanId },
            ],
        }).lean();

        if (!booking) {
            recordFailedAttempt(ip);

            // Intentionally vague message — don't reveal if email exists
            return NextResponse.json(
                {
                    success: false,
                    error: 'No booking found matching this email and reference. Please double-check your details.',
                },
                { status: 404 },
            );
        }

        // ── Found — reset failed attempts ──
        resetFailedAttempts(ip);

        const b = booking as any;

        // ── Sanitized response — same as /api/booking/[ref] ──
        const sanitized = {
            id:               b._id?.toString(),
            bookingReference: b.bookingReference,
            pnr:              b.pnr ?? null,
            status:           b.status,
            paymentStatus:    b.paymentStatus,
            clientPayWith:    b.clientPayWith ?? 'balance',
            isLiveMode:       b.isLiveMode ?? false,

            paymentDeadline: b.paymentDeadline ?? null,
            priceExpiry:     b.priceExpiry ?? null,
            createdAt:       b.createdAt ?? null,
            updatedAt:       b.updatedAt ?? null,

            contact: {
                email: b.contact?.email ?? null,
                phone: b.contact?.phone ?? null,
            },

            passengers: (b.passengers ?? []).map((p: any) => ({
                id:              p.id ?? null,
                type:            p.type,
                title:           p.title,
                firstName:       p.firstName,
                lastName:        p.lastName,
                gender:          p.gender,
                dob:             p.dob,
                passportNumber:  p.passportNumber
                    ? `****${p.passportNumber.slice(-4)}`
                    : null,
                passportExpiry:  p.passportExpiry ?? null,
                passportCountry: p.passportCountry ?? null,
            })),

            flightDetails: b.flightDetails ?? null,

            pricing: {
                currency:     b.pricing?.currency ?? 'USD',
                total_amount: b.pricing?.total_amount ?? 0,
                markup:       b.pricing?.markup ?? 0,
                base_amount:  b.pricing?.base_amount ?? 0,
            },

            paymentInfo: {
                cardName:       b.paymentInfo?.cardName ?? null,
                expiryDate:     b.paymentInfo?.expiryDate ?? null,
                billingAddress: b.paymentInfo?.billingAddress ?? null,
            },

            documents: (b.documents ?? []).map((d: any) => ({
                unique_identifier: d.unique_identifier ?? null,
                docType:           d.docType ?? null,
                url:               d.url ?? null,
            })),

            airlineInitiatedChanges: b.airlineInitiatedChanges ?? null,
        };

        return NextResponse.json({ success: true, booking: sanitized });

    } catch (error: any) {
        console.error('[Status API] Error:', error?.message);
        return NextResponse.json(
            { success: false, error: 'An error occurred. Please try again later.' },
            { status: 500 },
        );
    }
}