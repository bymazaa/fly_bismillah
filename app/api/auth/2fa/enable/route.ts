import { NextResponse } from 'next/server';
import { verify } from 'otplib';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { COOKIE_NAME, JWT_SECRET } from '@/app/api/controller/constant';
import { send2FAStatusEmail } from '@/app/emails/email';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    let payload;
    try {
      const verified = await jwtVerify(token, secretKey);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid Token" }, { status: 401 });
    }

    const body = await req.json();
    const { code, secret } = body;

    if (!code || !secret) {
      return NextResponse.json({ success: false, message: "Code and Secret are required" }, { status: 400 });
    }

    const admin = await Admin.findById(payload.id);
    if (!admin) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const isValid = await verify({ 
        token: code, 
        secret: secret 
    });

    if (!isValid.valid) {
        return NextResponse.json({ success: false, message: "Invalid or expired code" }, { status: 400 });
    }

    await Admin.findByIdAndUpdate(admin._id, { 
        twoFactorSecret: secret,
        isTwoFactorEnabled: true 
    });

     await send2FAStatusEmail(admin.email, {
    userName: admin.name,
    status: "enabled",
    ip: admin.loginHistory[0].ip,
    deviceInfo: admin.loginHistory[0].device,
    location: admin.loginHistory[0].location,
})

    return NextResponse.json({ 
      success: true, 
      message: "Two-Factor Authentication enabled successfully!" 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}