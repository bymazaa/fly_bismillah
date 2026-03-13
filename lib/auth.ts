// lib/auth.ts

import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

import { IJwtPayload } from '@/types/admin';
import dbConnect from '@/connection/db';
import Admin, { AdminDocument } from '@/models/Admin.model';
import { COOKIE_NAME } from '@/app/api/controller/constant';

// ✅ Secret key for jose (must be Uint8Array)
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return new TextEncoder().encode(secret);
}

// ✅ Create JWT Token using jose
export async function createToken(payload: {
  id: string;
  email: string;
  role: string;
  sessionId?: string;
}): Promise<string> {
  const secret = getJwtSecret();

  const token = await new SignJWT({
    id: payload.id,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId || '',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

// ✅ Verify JWT Token using jose
export async function verifyToken(
  token: string
): Promise<IJwtPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as IJwtPayload;
  } catch {
    return null;
  }
}

// ✅ Get current admin from cookie
export async function getCurrentAdmin(): Promise<AdminDocument | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) return null;

    await dbConnect();

    const admin = await Admin.findById(decoded.id).select('+password');

    if (!admin) return null;
    if (admin.status === 'blocked') return null;
    if (admin.status === 'suspended') return null;

    return admin;
  } catch {
    return null;
  }
}

// ✅ Check if admin role
export function isAdmin(admin: AdminDocument): boolean {
  return admin.role === 'admin';
}



// ✅ Generate unique Admin ID
export function generateAdminId(): string {
  const prefix = 'ADM';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}