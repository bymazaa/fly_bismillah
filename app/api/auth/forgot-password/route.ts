// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { APP_URL } from '../../controller/constant';
import { sendForgotPasswordEmail } from '@/app/emails/email';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: normalizedEmail });

    // Security: Always return success (যাতে email enumeration না হয়)
    if (!admin) {
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, you will receive a reset link shortly.',
      });
    }

    // 1. Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash token before saving to DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 3. Save hashed token + expiry
    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await admin.save({ validateBeforeSave: false });

    // 4. Create reset URL with PLAIN token (not hashed!)
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    // 5. Send email (exactly same format as login/email components)
    try {
      await sendForgotPasswordEmail(admin.email, {
        name: admin.name,
        link: resetUrl,
      });

    } catch (emailError: any) {
      console.error('Email sending failed:', emailError);

      // Optional: rollback token if email fails
      admin.resetPasswordToken = null;
      admin.resetPasswordExpire = null;
      await admin.save({ validateBeforeSave: false });

      return NextResponse.json(
        { success: false, message: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If this email is registered, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}