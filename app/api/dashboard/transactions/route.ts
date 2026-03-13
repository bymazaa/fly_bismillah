import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN as string,
});

export interface TransactionData {
  id: string;
  bookingRef: string;
  amount: number;
  currency: string;
  date: string;
  status: string; // Dynamic Status
  description: string;
  customerName: string;
  airline: string;
  type: 'Flight';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination Params
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 50;
    const afterParam = searchParams.get('after');

    const options: any = { limit: limit };
    if (afterParam && afterParam !== 'null' && afterParam !== 'undefined') {
      options.after = afterParam;
    }

    // Duffel API Call
    const response = await duffel.orders.list(options);
   

    const transactions: TransactionData[] = response.data.map((order: any) => {
      // 1. নাম বের করা
      const firstName = order.passengers?.[0]?.given_name || 'Unknown';
      const lastName = order.passengers?.[0]?.family_name || '';
      const fullName = `${firstName} ${lastName}`.trim();

      // 2. রুট এবং এয়ারলাইন বের করা
      const firstSlice = order.slices?.[0];
      const origin = firstSlice?.origin?.iata_code || firstSlice?.origin?.name || '---';
      const destination = firstSlice?.destination?.iata_code || firstSlice?.destination?.name || '---';
      const airlineName = firstSlice?.segments?.[0]?.operating_carrier?.name || 'Airline';


    const payStatus = order.payment_status || {};
      let currentStatus = 'Hold'; // ডিফল্ট

      // Priority 1: যদি ক্যানসেল হয়ে থাকে
      if (order.cancelled_at) {
        currentStatus = 'Cancelled';
      } 
      // Priority 2: যদি 'paid_at' এ তারিখ থাকে (মানে পেমেন্ট সাকসেস)
      else if (payStatus.paid_at) {
        currentStatus = 'Paid';
      } 
      // Priority 3: যদি টিকেট ইস্যু হয়ে থাকে (ডকুমেন্ট চেক - ডাবল কনফার্মেশন)
      else if (order.documents && order.documents.length > 0) {
        currentStatus = 'Paid'; 
      }
      // Priority 4: যদি পেমেন্টের অপেক্ষায় থাকে
      else if (payStatus.awaiting_payment === true) {
        currentStatus = 'Hold';
      }

      return {
        id: order.id,
        bookingRef: order.booking_reference,
        amount: parseFloat(order.total_amount),
        currency: order.total_currency,
        date: order.created_at,
        status: currentStatus, // ✅ এখন আর হার্ডকোড করা নেই
        description: `Flight Booking: ${origin} to ${destination}`,
        customerName: fullName,
        airline: airlineName,
        type: 'Flight',
      };
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      meta: {
        total_count: transactions.length,
        after: response.meta?.after || null,
        before: response.meta?.before || null,
      },
    });

  } catch (error: any) {
    console.error('Transaction API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}