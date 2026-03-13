// app/api/booking/[ref]/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

// ================================================================
// GET /api/booking/[ref]
// Fetches booking by bookingReference — strips sensitive data
// ================================================================

const readLimitMap = new Map<string, number[]>();

function checkReadLimit(ip: string): boolean {
    const now = Date.now();
    const ts = (readLimitMap.get(ip) ?? []).filter(t => now - t < 60_000);
    if (ts.length >= 30) return false;
    ts.push(now);
    readLimitMap.set(ip, ts);
    return true;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ref: string }> },
) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!checkReadLimit(ip)) {
        return NextResponse.json(
            { success: false, error: 'Too many requests. Please wait a moment.' },
            { status: 429 },
        );
    }

    try {
        // ✅ Next.js 15: params is a Promise — must await
        const { ref } = await params;
        console.log(ref)

        if (!ref || typeof ref !== 'string' || ref.trim().length < 5) {
            return NextResponse.json(
                { success: false, error: 'Invalid booking reference.' },
                { status: 400 },
            );
        }

        await dbConnect();

        const booking = await Booking.findOne({
            bookingReference: ref.trim().toUpperCase(),
        }).lean();

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found. Please check your reference number.' },
                { status: 404 },
            );
        }

        const b = booking as any;

        const sanitized = {
            id:               b._id?.toString(),
            bookingReference: b.bookingReference,
            duffelOrderId:    b.duffelOrderId ?? null,
            pnr:              b.pnr ?? null,
            status:           b.status,
            paymentStatus:    b.paymentStatus,
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
        console.error('[Booking API] Error fetching booking:', error?.message);
        return NextResponse.json(
            { success: false, error: 'An error occurred while fetching booking details.' },
            { status: 500 },
        );
    }
}