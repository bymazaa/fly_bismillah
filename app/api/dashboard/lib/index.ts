import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

/**
 * 🚀 Main Smart Sync Function
 */
export async function smartSyncBooking(bookingIdOrObj: any) {
  await dbConnect();

  let dbBooking;

  // ১. ইনপুট চেক করা
  if (typeof bookingIdOrObj === 'string') {
    dbBooking = await Booking.findById(bookingIdOrObj);
  } else {
    dbBooking = bookingIdOrObj;
  }

  // বেসিক ভ্যালিডেশন
  if (!dbBooking || !dbBooking.duffelOrderId) {
    return dbBooking;
  }

  // অপটিমাইজেশন: অলরেডি ফাইনাল স্টেজে থাকলে চেক করার দরকার নেই
  // নোট: 'issued' হলেও চেক করা ভালো, কারণ এয়ারলাইন পরে ক্যান্সেল করতে পারে
  if (dbBooking.status === 'failed' || dbBooking.status === 'cancelled') {
    return dbBooking;
  }

  try {
    // 🟢 ২. ডাফেল এপিআই কল
    // .data ব্যবহার করে মেইন অবজেক্ট নেওয়া হচ্ছে
    const response = await duffel.orders.get(dbBooking.duffelOrderId);
    const duffelOrder = response.data;

    // 🟢 ৩. স্মার্ট স্ট্যাটাস ডিটেকশন (লজিক ফিক্স করা হয়েছে)
    let finalStatus = 'failed'; // ডিফল্ট

    if (duffelOrder.cancelled_at) {
        finalStatus = 'cancelled';
    } 
    // যদি টিকেট জেনারেট হয়ে থাকে (সবচেয়ে নিরাপদ চেক)
    else if (duffelOrder.documents && duffelOrder.documents.length > 0) {
        finalStatus = 'issued';
    }
    // অথবা যদি পেমেন্ট হয়ে থাকে
    else if (duffelOrder.payment_status?.paid_at) {
        finalStatus = 'issued';
    }
    // যদি পেমেন্ট বাকি থাকে এবং ডেডলাইন থাকে
    else if (duffelOrder.payment_status?.payment_required_by) {
        finalStatus = 'held';
    }

    // ৪. ডাটাবেসের সাথে তুলনা (Change Detection)
    const isStatusChanged = dbBooking.status !== finalStatus;
    // PNR চেক: অনেক সময় বুকিংয়ের শুরুতে PNR থাকে না, পরে আসে
    const isPnrChanged = duffelOrder.booking_reference && (dbBooking.pnr !== duffelOrder.booking_reference);
    
    // ৫. যদি পরিবর্তন থাকে, তবেই আপডেট
    if (isStatusChanged || isPnrChanged) {
      console.log(`🔄 Syncing Booking ${dbBooking.bookingReference}: ${dbBooking.status} ➝ ${finalStatus}`);

      const updatedBooking = await Booking.findByIdAndUpdate(
        dbBooking._id,
        {
          status: finalStatus,
          pnr: duffelOrder.booking_reference, 
          paymentDeadline: duffelOrder.payment_status?.payment_required_by || dbBooking.paymentDeadline,
          // লাস্ট সিঙ্ক টাইম আপডেট করা
          $set: { 
             'meta.lastSyncedAt': new Date() 
          }
        },
        { new: true }
      );

      return updatedBooking;
    }

    return dbBooking;

  } catch (error) {
    console.error(`⚠️ Sync Failed for ${dbBooking.bookingReference}:`, error);
    return dbBooking;
  }
}