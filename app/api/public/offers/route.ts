export const dynamic = 'force-dynamic';
import dbConnect from "@/connection/db";
import Offer from "@/models/Offer.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    const offers = await Offer.find({
      isActive: true,
    }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: offers.length, data: offers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}