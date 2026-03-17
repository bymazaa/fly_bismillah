import { NextRequest, NextResponse } from "next/server";
import { Duffel } from "@duffel/api";

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || "",
});

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const {  amount, currency } = body;

    // ── Validate ──
    if (!amount || !currency) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Missing required fields: amount, currency",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const numericAmount = parseFloat(String(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: `Invalid amount: ${amount}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const formattedAmount = numericAmount.toFixed(2);
    const upperCurrency = String(currency).toUpperCase().trim();



    // ── Create Payment Intent ──
    const paymentIntent = await duffel.paymentIntents.create({
      amount: formattedAmount,
      currency: upperCurrency,
    });

    const clientToken = paymentIntent.data.client_token;
    const intentId = paymentIntent.data.id;

    console.log("✅ Created:", { id: intentId, hasToken: !!clientToken });

    if (!clientToken) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "No client token from Duffel",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }



    return new NextResponse(
      JSON.stringify({
        success: true,
        clientToken: String(clientToken),
        paymentIntentId: String(intentId),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Payment Intent Error:", error?.message || error);

    const errorMessage =
      error?.errors?.[0]?.message ||
      error?.response?.data?.errors?.[0]?.message ||
      error?.message ||
      "Failed to create payment intent";

    return new NextResponse(
      JSON.stringify({ success: false, message: errorMessage }),
      {
        status: error?.meta?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}