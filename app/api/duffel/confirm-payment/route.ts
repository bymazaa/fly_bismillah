import { NextRequest, NextResponse } from "next/server";
import { Duffel } from "@duffel/api";
import dbConnect from "@/connection/db";
import Booking from "@/models/Booking.model";

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || "",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, paymentIntentId } = body;

    if (!bookingId || !paymentIntentId) {
      return NextResponse.json(
        {
          success: false,
          message: "bookingId and paymentIntentId are required",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.duffelOrderId) {
      return NextResponse.json(
        { success: false, message: "No Duffel order linked" },
        { status: 400 }
      );
    }

    // ── Confirm Payment Intent → Link to Order ──
    console.log("🔗 Confirming payment intent:", {
      paymentIntentId,
      orderId: booking.duffelOrderId,
    });

    try {
      await duffel.paymentIntents.confirm(paymentIntentId);

      console.log("✅ Payment intent confirmed:", paymentIntentId);
    } catch (confirmErr: any) {
      const errMsg =
        confirmErr?.errors?.[0]?.message ||
        confirmErr?.message ||
        "Unknown";

      // Already confirmed is OK
      if (
        /already.*confirmed/i.test(errMsg) ||
        /already.*succeeded/i.test(errMsg)
      ) {
        console.log("ℹ️ Payment intent already confirmed");
      } else {
        console.error("❌ Confirm failed:", errMsg);
        throw confirmErr;
      }
    }

    // ── Update Booking ──
    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        paymentStatus: "captured",
        duffelPaymentIntentId: paymentIntentId,
        clientPayWith: "card",
      },
      $push: {
        adminNotes: {
          note: `💳 Card payment confirmed. Intent: ${paymentIntentId}`,
          addedBy: "confirm-payment-api",
          createdAt: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment confirmed successfully",
      paymentIntentId,
    });
  } catch (error: any) {
    console.error("❌ Confirm payment error:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.errors?.[0]?.message ||
          error?.message ||
          "Failed to confirm payment",
      },
      { status: 500 }
    );
  }
}