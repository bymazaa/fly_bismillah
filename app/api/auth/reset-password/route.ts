// app/api/auth/reset-password/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import {
  MIN_PASSWORD,
  MAX_PASSWORD,
  COOKIE_NAME,
} from '../../controller/constant';
import { sendPasswordChangedEmail } from '@/app/emails/email';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is missing'),
  password: z
    .string()
    .min(MIN_PASSWORD, `Password must be at least ${MIN_PASSWORD} characters`)
    .max(MAX_PASSWORD, `Password must be at most ${MAX_PASSWORD} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

export async function PUT(req: Request) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => null);

    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Weak password or invalid input',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // ✅ password explicitly select করতে হবে
    const admin = await Admin.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: new Date() },
    }).select('+password');

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // ✅ extra guard
    if (!admin.password) {
      console.error('Admin password hash missing for:', admin._id);
      return NextResponse.json(
        { success: false, message: 'Account password data is missing' },
        { status: 500 }
      );
    }

    const isSameAsOld = await bcrypt.compare(password, admin.password);

    if (isSameAsOld) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be different from the old one',
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    admin.password = hashedPassword;
    admin.resetPasswordToken = null;
    admin.resetPasswordExpire = null;
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    admin.activeSessions = [];
    admin.isOnline = false;
    admin.lastActive = new Date();

    // ✅ password reset হলে 2FA disable
    if (admin.isTwoFactorEnabled) {
      admin.isTwoFactorEnabled = false;
      admin.twoFactorSecret = null;
    }

    await admin.save();

    try {
      await sendPasswordChangedEmail(admin.email, admin.name);
    } catch (e) {
      console.error('Password changed email failed:', e);
    }

    const response = NextResponse.json(
      {
        success: true,
        message:
          'Password reset successful. You can now login. Two-factor authentication has been disabled for security.',
      },
      { status: 200 }
    );

    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}