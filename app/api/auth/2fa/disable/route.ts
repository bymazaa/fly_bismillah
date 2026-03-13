import { NextResponse } from 'next/server';
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

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized access.' },
                { status: 401 },
            );
        }

        const secretKey = new TextEncoder().encode(JWT_SECRET);
        let payload;
        try {
            const verified = await jwtVerify(token, secretKey);
            payload = verified.payload;
        } catch (err) {
            return NextResponse.json(
                { success: false, message: 'Invalid session.' },
                { status: 401 },
            );
        }

        const updatedUser = await Admin.findByIdAndUpdate(payload.id, {
            isTwoFactorEnabled: false,
            twoFactorSecret: null,
        });

        if (!updatedUser) {
            return NextResponse.json(
                { success: false, message: 'User not found.' },
                { status: 404 },
            );
        }

        await send2FAStatusEmail(updatedUser.email, {
            userName: updatedUser.name,
            status: 'disabled',
            ip: updatedUser.loginHistory[0].ip,
            deviceInfo: updatedUser.loginHistory[0].device,
            location: updatedUser.loginHistory[0].location,
        })

        return NextResponse.json({
            success: true,
            message: 'Two-Factor Authentication disabled successfully.',
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 },
        );
    }
}
