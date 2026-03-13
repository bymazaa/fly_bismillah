import { sendEmailViaResend } from '@/app/emails/email';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, message } = body;

    // ১. ভ্যালিডেশন
    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "Email, Subject, and Message are required." },
        { status: 400 }
      );
    }

    const result = await sendEmailViaResend({
      to: to,
      subject: subject,
      message: message,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to send email via Resend", error: result.error },
        { status: 500 }
      );
    }

    // ৩. সফল রেসপন্স
    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      id: result.data?.id
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}