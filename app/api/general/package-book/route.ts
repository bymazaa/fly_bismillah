import { sendPackageBookingEmail } from "@/app/emails/email";
import { PackageBookingEmailProps } from "@/app/emails/PackageBookingEmail";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PackageBookingEmailProps;

    const {
      packageTitle = "",
      packagePrice = 0, // 0 allowed
      customerName,
      customerEmail,
      customerPhone,
      travelDate,
      returnDate = "",
      guests,
      notes = "",
    } = body;

    // ✅ Validation (0 price allowed, packageTitle optional)
    if (
      !customerName?.trim() ||
      !customerEmail?.trim() ||
      !customerPhone?.trim() ||
      !travelDate ||
      !guests ||
      typeof guests.adults !== "number" ||
      typeof guests.children !== "number"
    ) {
      return NextResponse.json(
        { success: false, message: "Required booking details are missing." },
        { status: 400 },
      );
    }

    // ✅ Mail পাঠানো (Resend + React Email)
    await sendPackageBookingEmail({
      packageTitle,
      packagePrice,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      travelDate,
      returnDate,
      guests,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: "Booking request received successfully!",
      bookingId: "", // চাইলে crypto.randomUUID() ব্যবহার করতে পারো
    });
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}