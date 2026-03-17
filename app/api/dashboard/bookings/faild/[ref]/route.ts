import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { NextRequest, NextResponse } from 'next/server';

// ─── GET: Fetch single failed booking by bookingReference ───────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
    try {
        await dbConnect();

        const { ref } = await params;

        // ✅ FIX 1: Use .select() for field projection (Much safer in Mongoose)
        const booking = await Booking.findOne({
            bookingReference: ref,
            status: 'failed', // ✅ শুধু failed booking return হবে
        })
        .select(`
            _id 
            bookingReference 
            status 
            paymentStatus 
            retryCount 
            lastRetryAt 
            adminNotes 
            passengers 
            contact 
            flightDetails 
            createdAt 
            updatedAt
        `)
        .lean();

        if (!booking) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed booking not found. It may not exist or may not be in a failed state.',
                },
                { status: 404 },
            );
        }

        return NextResponse.json({ success: true, booking });
    } catch (error: any) {
        console.error('[GET /admin/bookings/failed/:ref]', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 },
        );
    }
}

// ─── POST: Add an admin note ──────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
    try {
        await dbConnect();

        const { ref } = await params;
        const body = await req.json();
        const { note, addedBy = 'admin' } = body;

        if (!note || typeof note !== 'string' || !note.trim()) {
            return NextResponse.json(
                { success: false, message: 'Note text is required' },
                { status: 400 },
            );
        }

        const booking = await Booking.findOneAndUpdate(
            { bookingReference: ref },
            {
                $push: {
                    adminNotes: {
                        note: note.trim(),
                        addedBy,
                        createdAt: new Date(),
                    },
                },
            },
            { new: true, select: 'adminNotes bookingReference' },
        );

        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Booking not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            adminNotes: booking.adminNotes,
        });
    } catch (error: any) {
        console.error('[POST /admin/bookings/failed/:ref]', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 },
        );
    }
}

// ─── DELETE: Delete entire failed booking ───────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
    try {
        await dbConnect();
        const { ref } = await params;

        // findOneAndDelete পুরো বুকিং রিমুভ করবে
        const deletedBooking = await Booking.findOneAndDelete({
            bookingReference: ref,
            status: 'failed',
        });

        if (!deletedBooking) {
            return NextResponse.json(
                { success: false, message: 'Failed booking not found or already deleted.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Successfully deleted failed booking' });
    } catch (error: any) {
        console.error('[DELETE /admin/bookings/failed/:ref]', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}