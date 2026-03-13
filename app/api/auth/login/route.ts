// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import ActivityLog from '@/models/ActivityLog';
import { createToken } from '@/lib/auth';
import { COOKIE_NAME } from '@/app/api/controller/constant';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Admin from '@/models/Admin.model';
import { SignJWT } from 'jose';
import { cleanupActivityLogForAdmin, getIPLocation } from '../../lib/auth';

// ─── Device Info Extractor ────────────────────────────
export function extractDeviceInfo(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'Unknown';

    let browser = 'Unknown';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        const match = userAgent.match(/Chrome\/([\d.]+)/);
        browser = `Chrome ${match?.[1] || ''}`.trim();
    } else if (userAgent.includes('Firefox')) {
        const match = userAgent.match(/Firefox\/([\d.]+)/);
        browser = `Firefox ${match?.[1] || ''}`.trim();
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        const match = userAgent.match(/Version\/([\d.]+)/);
        browser = `Safari ${match?.[1] || ''}`.trim();
    } else if (userAgent.includes('Edg')) {
        const match = userAgent.match(/Edg\/([\d.]+)/);
        browser = `Edge ${match?.[1] || ''}`.trim();
    }

    let device = 'Unknown Device';
    if (userAgent.includes('iPhone')) device = 'iPhone';
    else if (userAgent.includes('iPad')) device = 'iPad';
    else if (userAgent.includes('Android')) {
        device = userAgent.includes('Mobile') ? 'Android Phone' : 'Android Tablet';
    } else if (userAgent.includes('Macintosh')) device = 'Mac';
    else if (userAgent.includes('Windows')) device = 'Windows PC';
    else if (userAgent.includes('Linux')) device = 'Linux PC';

    return { browser, device, ip, userAgent };
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { email, password } = body;

        // 1️⃣ Validation
        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 },
            );
        }

        // 2️⃣ Find admin
        const admin = await Admin.findOne({
            email: email.toLowerCase().trim(),
        }).select('+password');

        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 },
            );
        }

        // 3️⃣ Status check
        if (admin.status === 'blocked') {
            return NextResponse.json(
                {
                    success: false,
                    message: `Account blocked: ${admin.blockReason || 'Contact administrator'}`,
                },
                { status: 403 },
            );
        }

        if (admin.status === 'suspended') {
            return NextResponse.json(
                { success: false, message: 'Account suspended. Contact administrator' },
                { status: 403 },
            );
        }

        // 4️⃣ Lock check
        if (admin.lockUntil && admin.lockUntil > new Date()) {
            const remainingMin = Math.ceil((admin.lockUntil.getTime() - Date.now()) / 60000);
            return NextResponse.json(
                {
                    success: false,
                    message: `Account locked. Try again in ${remainingMin} minutes`,
                },
                { status: 423 },
            );
        }

        // 5️⃣ Password verify
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            const failedAttempts = admin.failedLoginAttempts + 1;
            const updateData: Record<string, unknown> = {
                failedLoginAttempts: failedAttempts,
            };

            if (failedAttempts >= 5) {
                updateData.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
                updateData.failedLoginAttempts = 0;
            }

            await Admin.findByIdAndUpdate(admin._id, { $set: updateData });

            await ActivityLog.create({
                admin: admin._id,
                action: 'failed_login',
                target: admin._id,
                details: `Failed login attempt (${failedAttempts}/5)`,
                ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
                device: request.headers.get('user-agent') || '',
            });

            return NextResponse.json(
                {
                    success: false,
                    message: `Invalid password. ${5 - failedAttempts} attempts remaining`,
                },
                { status: 401 },
            );
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  🔐 6️⃣ 2FA CHECK — Password সঠিক, এখন 2FA চেক করো    ║
        // ╚══════════════════════════════════════════════════════════╝
        if (admin.isTwoFactorEnabled && admin.twoFactorSecret) {
            // ✅ Temporary token বানাও (5 মিনিট valid) — শুধু 2FA verify এর জন্য
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

            const tempToken = await new SignJWT({
                id: admin._id.toString(),
                purpose: '2fa-verify', // এটা দিয়ে বুঝবো এটা temp token
            })
                .setProtectedHeader({ alg: 'HS256' })
                .setExpirationTime('5m') // 5 মিনিট পরে expire
                .sign(secret);

            // ❌ কোনো cookie সেট করবো না
            // ❌ কোনো session তৈরি করবো না
            // ✅ শুধু frontend কে বলবো 2FA code চাই
            return NextResponse.json(
                {
                    success: true,
                    requiresTwoFactor: true,
                    message: 'Two-factor authentication required',
                    data: {
                        tempToken,
                        userId: admin._id.toString(),
                    },
                },
                { status: 200 },
            );
        }

        // ═══════════════════════════════════════════════════════════
        // 7️⃣ 2FA OFF থাকলে — সরাসরি login (আগের মতোই)
        // ═══════════════════════════════════════════════════════════

        const sessionId: string = uuidv4();
        const { browser, device, ip } = extractDeviceInfo(request);
        const location = (await getIPLocation(ip)) || 'Unknown';

        const token = await createToken({
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
                    location: location,
                    loginTime: new Date(),
                    lastActive: new Date(),
                },
                loginHistory: {
                    $each: [
                        {
                            device,
                            browser,
                            ip,
                            location: location,
                            time: new Date(),
                            status: 'current',
                        },
                    ],
                    $slice: -10, // slice to keep only last 10 entries
                },
            },
        });

        await ActivityLog.create({
            admin: admin._id,
            action: 'login',
            target: admin._id,
            details: `Login from ${device} - ${browser} - ${ip}`,
            ip,
            device: request.headers.get('user-agent') || '',
        });

        try {
            await cleanupActivityLogForAdmin(admin._id.toString(), {
                maxKeep: 300,
                keepRecent: 10,
            });
        } catch (cleanupErr) {
            console.error('ActivityLog cleanup failed (non-blocking):', cleanupErr);
            // send it to monitoring/logging service if desired
        }

        const adminData = {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            adminId: admin.adminId,
            avatar: admin.avatar,
            status: admin.status,
            permissions: admin.permissions,
        };

        const response = NextResponse.json(
            {
                success: true,
                requiresTwoFactor: false,
                message: 'Login successful',
                data: {
                    admin: adminData,
                    sessionId,
                    redirectUrl: '/admin',
                },
            },
            { status: 200 },
        );

        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
        });

        return response;
    } catch (error: unknown) {
        console.error('Login Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 },
        );
    }
}
