import { NextResponse } from 'next/server';
import { generateSecret, generateURI } from 'otplib';
import qrcode from 'qrcode';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { COOKIE_NAME, JWT_SECRET } from '@/app/api/controller/constant';

export async function GET(req: Request) {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized access." }, { status: 401 });
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    let payload;
    try {
      const verified = await jwtVerify(token, secretKey);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid Token" }, { status: 401 });
    }
    
    const admin = await Admin.findById(payload.id);
    if (!admin) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const secret = generateSecret();

    const otpauth = generateURI({
      issuer: 'Fly Bismillah',
      label: admin.email,
      secret: secret,
    });
    
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    return NextResponse.json({ 
      success: true, 
      qrCodeUrl, 
      secret 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}