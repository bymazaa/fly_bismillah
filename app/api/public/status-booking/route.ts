// app/api/public/booking/search/route.ts

import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || '' });

// ─── Helpers ───
function formatDuration(iso: string): string {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : '';
  const m = match[2] ? `${match[2]}m` : '';
  return `${h} ${m}`.trim();
}

function detectTripType(slices: any[]): string {
  if (!slices || slices.length <= 1) return 'one_way';
  if (slices.length === 2) {
    const s1Origin = slices[0]?.origin?.iata_code;
    const s1Dest = slices[0]?.destination?.iata_code;
    const s2Origin = slices[1]?.origin?.iata_code;
    const s2Dest = slices[1]?.destination?.iata_code;
    if (s1Origin === s2Dest && s1Dest === s2Origin) return 'round_trip';
    return 'multi_city';
  }
  return 'multi_city';
}

function getSliceLabel(tripType: string, index: number, total: number): string {
  if (tripType === 'round_trip') return index === 0 ? 'Outbound' : 'Return';
  if (tripType === 'multi_city') return `Flight ${index + 1} of ${total}`;
  return 'Departure';
}

function resolveStatus(dbStatus: string, order: any): string {
  if (dbStatus === 'cancelled') return 'cancelled';
  if (order.documents?.length > 0) return 'issued';
  if (order.payment_status?.awaiting_payment || order.payment_status?.payment_required_by) {
    return 'held';
  }
  return dbStatus || 'processing';
}

function calculateLayover(arrTime: string, depTime: string): string {
  if (!arrTime || !depTime) return '';
  const diff = new Date(depTime).getTime() - new Date(arrTime).getTime();
  if (diff <= 0) return '';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pnr, email } = body;

    // ─── Validation ───
    if (!pnr || !email) {
      return NextResponse.json(
        { success: false, message: 'PNR and Email are required.' },
        { status: 400 }
      );
    }

    const trimmedPnr = pnr.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedPnr.length < 5 || trimmedPnr.length > 8) {
      return NextResponse.json(
        { success: false, message: 'Invalid PNR format.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // ─── Find Booking ───
    const booking = await Booking.findOne({
      pnr: trimmedPnr,
      'contact.email': { $regex: new RegExp(`^${trimmedEmail}$`, 'i') },
    }).lean() as any;

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'No booking found with this PNR and Email.' },
        { status: 404 }
      );
    }

    // ─── No Duffel Order ───
    if (!booking.duffelOrderId) {
      return NextResponse.json({
        success: true,
        data: {
          pnr: booking.pnr,
          bookingReference: booking.bookingReference || '',
          status: booking.status || 'processing',
          tripType: 'one_way',
          contact: {
            email: booking.contact?.email || '',
            phone: booking.contact?.phone || '',
          },
          slices: [],
          passengers: [],
          documents: [],
          conditions: { isRefundable: false, isChangeable: false },
          paymentDeadline: null,
          bookedAt: booking.createdAt,
        },
      });
    }

    // ─── Fetch Duffel Order ───
    let order: any;
    try {
      const res = await duffel.orders.get(booking.duffelOrderId);
      order = res.data;
    } catch (err: any) {
      console.error('Duffel fetch error:', err.message);
      return NextResponse.json(
        { success: false, message: 'Unable to retrieve flight details from airline.' },
        { status: 502 }
      );
    }

    // ─── Status ───
    const status = resolveStatus(booking.status, order);

    // ─── Trip Type ───
    const tripType = detectTripType(order.slices || []);

    // ─── Build Slices ───
    const slices = (order.slices || []).map((slice: any, sliceIdx: number) => {
      const segments = (slice.segments || []).map((seg: any, segIdx: number) => {
        const baggage = seg.passengers?.[0]?.baggages;
        let baggageText = 'Check airline policy';

        if (baggage && baggage.length > 0) {
          baggageText = baggage
            .map((b: any) => {
              if (b.quantity && b.type === 'checked') {
                return `${b.quantity} PC (${b.quantity * 23} KG)`;
              }
              return `${b.quantity}x ${b.type}`;
            })
            .join(', ');
        }

        return {
          airline: seg.operating_carrier?.name || seg.marketing_carrier?.name || '',
          airlineLogo: seg.operating_carrier?.logo_symbol_url || seg.marketing_carrier?.logo_symbol_url || '',
          flightNumber: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
          aircraft: seg.aircraft?.name || '',
          origin: {
            code: seg.origin?.iata_code || '',
            city: seg.origin?.city_name || seg.origin?.name || '',
            terminal: seg.origin?.terminal || null,
          },
          destination: {
            code: seg.destination?.iata_code || '',
            city: seg.destination?.city_name || seg.destination?.name || '',
            terminal: seg.destination?.terminal || null,
          },
          departingAt: seg.departing_at || '',
          arrivingAt: seg.arriving_at || '',
          duration: seg.duration || '',
          durationFormatted: formatDuration(seg.duration || ''),
          cabin: seg.passengers?.[0]?.cabin_class_marketing_name || seg.passengers?.[0]?.cabin_class || '',
          baggage: baggageText,
        };
      });

      // Layovers
      const layovers: any[] = [];
      for (let i = 0; i < segments.length - 1; i++) {
        layovers.push({
          airport: segments[i].destination.code,
          city: segments[i].destination.city,
          duration: calculateLayover(segments[i].arrivingAt, segments[i + 1].departingAt),
        });
      }

      const first = segments[0];
      const last = segments[segments.length - 1];

      // Total duration
      let totalDuration = '';
      if (first && last) {
        const diff = new Date(last.arrivingAt).getTime() - new Date(first.departingAt).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        totalDuration = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }

      return {
        label: getSliceLabel(tripType, sliceIdx, (order.slices || []).length),
        origin: first?.origin || { code: '', city: '' },
        destination: last?.destination || { code: '', city: '' },
        departingAt: first?.departingAt || '',
        arrivingAt: last?.arrivingAt || '',
        totalDuration,
        stops: segments.length - 1,
        stopsLabel: segments.length === 1 ? 'Direct' : `${segments.length - 1} Stop${segments.length > 2 ? 's' : ''}`,
        segments,
        layovers,
      };
    });

    // ─── Passengers ───
    const passengers = (order.passengers || []).map((p: any) => {
      const ticket = order.documents?.find((d: any) => d.passenger_ids?.includes(p.id));
      return {
        fullName: [p.given_name, p.family_name].filter(Boolean).join(' '),
        type: p.type || 'adult',
        ticketNumber: ticket?.unique_identifier || null,
        isTicketed: !!ticket,
      };
    });

    // ─── Documents ───
    const documents = (order.documents || []).map((doc: any) => ({
      type: doc.type || 'electronic_ticket',
      url: doc.url || null,
      identifier: doc.unique_identifier || '',
    }));

    // ─── Conditions ───
    const conditions = {
      isRefundable: order.conditions?.refund_before_departure?.allowed || false,
      isChangeable: order.conditions?.change_before_departure?.allowed || false,
      refundPenalty: order.conditions?.refund_before_departure?.penalty_amount || null,
      refundCurrency: order.conditions?.refund_before_departure?.penalty_currency || null,
      changePenalty: order.conditions?.change_before_departure?.penalty_amount || null,
      changeCurrency: order.conditions?.change_before_departure?.penalty_currency || null,
    };

    // ─── Payment Deadline ───
    const paymentDeadline =
      status === 'held' ? order.payment_status?.payment_required_by || null : null;

    // ─── Sync if changed ───
    if (booking.status !== status) {
      await Booking.findByIdAndUpdate(booking._id, {
        $set: { status, pnr: order.booking_reference || booking.pnr, updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        pnr: order.booking_reference || booking.pnr,
        bookingReference: booking.bookingReference || '',
        status,
        tripType,
        contact: {
          email: booking.contact?.email || '',
          phone: booking.contact?.phone || '',
        },
        slices,
        passengers,
        documents,
        conditions,
        paymentDeadline,
        bookedAt: booking.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Search API Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}