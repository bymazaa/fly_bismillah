// app/api/auth/2fa/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'otplib'; // <-- এটাই সঠিক import
import { jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import ActivityLog from '@/models/ActivityLog';
import { createToken } from '@/lib/auth';
import { COOKIE_NAME } from '@/app/api/controller/constant';
import { extractDeviceInfo } from '../../login/route';
import { getIPLocation } from '@/app/api/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { tempToken, code } = await req.json();

    if (!tempToken || !code) {
      return NextResponse.json(
        { success: false, message: 'Token and code required' },
        { status: 400 }
      );
    }

    const token = String(code).trim();
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { success: false, message: 'Invalid code format' },
        { status: 400 }
      );
    }

    // ── Verify temp token ──
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    let payload;
    try {
      const { payload: p } = await jwtVerify(tempToken, secret);
      payload = p;
    } catch {
      return NextResponse.json(
        { success: false, message: 'Session expired. Login again.' },
        { status: 401 }
      );
    }

    if (payload.purpose !== '2fa-verify') {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });
    }

    const admin = await Admin.findById(payload.id).select('+twoFactorSecret');
    if (!admin || !admin.twoFactorSecret) {
      return NextResponse.json({ success: false, message: '2FA not enabled' }, { status: 400 });
    }

    // ── otplib v13+ এর একমাত্র সঠিক উপায় (2025) ──
    const isValid = await verify({
      token,
      secret: admin.twoFactorSecret, // এটা Base32 string হতে হবে
      // window: 2, // optional: ±60 seconds allow (default 1 = ±30s)
    });


    if (!isValid.valid) {
      await ActivityLog.create({
        admin: admin._id,
        action: 'failed_2fa',
        target: admin._id,
        details: `Wrong code: ${token.substring(0, 2)}****`,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown',
        device: req.headers.get('user-agent') || '',
      });

      return NextResponse.json(
        { success: false, message: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // ── 2FA সফল! লগইন দাও ──
    const sessionId = uuidv4();
    const { browser, device, ip } = extractDeviceInfo(req);
    const location = await getIPLocation(ip) || 'Unknown';

    const jwtToken = await createToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      sessionId,
    });

    await Admin.findByIdAndUpdate(admin._id, {
      $set: {
        isOnline: true,
        lastLogin: new Date(),
        lastActive: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null,
      },
      $push: {
        activeSessions: {
          sessionId,
          device,
          browser,
          ip,
          location,
          loginTime: new Date(),
          lastActive: new Date(),
        },
        loginHistory: {
          $each: [{
            device,
            browser,
            ip,
            location,
            time: new Date(),
            status: 'current',
          }],
          $slice: -50,
        },
      },
    });

    await ActivityLog.create({
      admin: admin._id,
      action: 'login_2fa_success',
      target: admin._id,
      details: `2FA Login - ${device} - ${browser}`,
      ip,
      device: req.headers.get('user-agent') || '',
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful!',
        data: {
          admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            adminId: admin.adminId,
            avatar: admin.avatar,
            status: admin.status,
            permissions: admin.permissions,
          },
          sessionId,
          redirectUrl: '/admin',
        },
      },
      { status: 200 }
    );

    response.cookies.set(COOKIE_NAME, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('2FA Verify Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}