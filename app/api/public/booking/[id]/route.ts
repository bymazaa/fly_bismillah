// app/api/public/booking/[id]/route.ts

import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { Duffel } from '@duffel/api';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    const booking = await Booking.findById(id).select(
      '-paymentInfo -stripePaymentIntentId -payment_id -__v'
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // ─── No Duffel Order Yet → DB data only ───
    if (!booking.duffelOrderId) {
      return NextResponse.json({
        success: true,
        data: {
          bookingReference: booking.bookingReference || '',
          pnr: 'Pending',
          status: 'processing',
          contact: {
            email: booking.contact?.email || '',
            phone: booking.contact?.phone || '',
          },
          tripType: booking.flightDetails?.flightType || 'one_way',
          slices: [],
          passengers: [],
          paymentDeadline: null,
          bookedAt: booking.createdAt,
        },
      });
    }

    // ─── Fetch Duffel Order ───
    const { data: order } = await duffel.orders.get(booking.duffelOrderId);

    // ─── Status ───
    let status = booking.status || 'processing';
    if (booking.status === 'cancelled') {
      status = 'cancelled';
    } else if (order.documents?.length) {
      status = 'issued';
    } else if (
      order.payment_status?.awaiting_payment ||
      order.payment_status?.payment_required_by
    ) {
      status = 'held';
    }

    // ─── Trip Type Detection ───
    const slices = order.slices || [];
    let tripType = 'one_way';

    if (slices.length === 2) {
      const s1 = slices[0];
      const s2 = slices[1];
      tripType =
        s1.origin?.iata_code === s2.destination?.iata_code &&
        s1.destination?.iata_code === s2.origin?.iata_code
          ? 'round_trip'
          : 'multi_city';
    } else if (slices.length > 2) {
      tripType = 'multi_city';
    }

    // ─── Build Slices ───
    const sliceLabels: Record<string, (i: number, t: number) => string> = {
      one_way: () => 'Departure',
      round_trip: (i) => (i === 0 ? 'Outbound' : 'Return'),
      multi_city: (i, t) => `Flight ${i + 1} of ${t}`,
    };

    const builtSlices = slices.map((slice: any, i: number) => {
      const segs = slice.segments || [];
      const first = segs[0];
      const last = segs[segs.length - 1];

      return {
        label: sliceLabels[tripType](i, slices.length),

        origin: {
          code: first?.origin?.iata_code || '',
          city: first?.origin?.city_name || first?.origin?.name || '',
        },
        destination: {
          code: last?.destination?.iata_code || '',
          city:
            last?.destination?.city_name || last?.destination?.name || '',
        },

        departure: first?.departing_at || '',
        arrival: last?.arriving_at || '',

        stops: segs.length - 1,

        segments: segs.map((seg: any) => ({
          airline:
            seg.operating_carrier?.name ||
            seg.marketing_carrier?.name ||
            '',
          airlineLogo:
            seg.operating_carrier?.logo_symbol_url ||
            seg.marketing_carrier?.logo_symbol_url ||
            '',
          flightNumber: `${seg.marketing_carrier?.iata_code || ''}${
            seg.marketing_carrier_flight_number || ''
          }`,
          origin: seg.origin?.iata_code || '',
          destination: seg.destination?.iata_code || '',
          departingAt: seg.departing_at || '',
          arrivingAt: seg.arriving_at || '',
          duration: seg.duration || '',
          cabin:
            seg.passengers?.[0]?.cabin_class_marketing_name ||
            seg.passengers?.[0]?.cabin_class ||
            '',
        })),
      };
    });

    // ─── Passengers ───
    const passengers = (order.passengers || []).map((p: any) => ({
      name: [ p.given_name, p.family_name]
        .filter(Boolean)
        .join(' '),
      type: p.type || 'adult',
    }));

    // ─── Payment Deadline ───
    const paymentDeadline =
      status === 'held'
        ? order.payment_status?.payment_required_by || null
        : null;

    // ─── Sync Status if Changed ───
    if (booking.status !== status) {
      await Booking.findByIdAndUpdate(id, {
        $set: {
          status,
          pnr: order.booking_reference || booking.pnr,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingReference: booking.bookingReference || '',
        pnr: order.booking_reference || booking.pnr || 'Pending',
        status,
        contact: {
          email: booking.contact?.email || '',
          phone: booking.contact?.phone || '',
        },
        tripType,
        slices: builtSlices,
        passengers,
        paymentDeadline,
        bookedAt: booking.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Booking API Error:', error.message);

    if (error.meta?.status === 404) {
      return NextResponse.json(
        { success: false, message: 'Order not found in airline system' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}