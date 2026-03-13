// app/api/auth/profile/update/route.ts

import { NextRequest } from 'next/server';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

import ActivityLog from '@/models/ActivityLog';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { COOKIE_NAME } from '@/app/api/controller/constant';

// ✅ Allowed fields - staff নিজে যা update করতে পারবে
interface IProfileUpdateBody {
  name?: string;
  phone?: string;
  avatar?: string;
}

// ❌ Staff নিজে যা update করতে পারবে না
// role, permissions, email, status, isVerified - এগুলো শুধু admin পারবে

export async function PUT(request: NextRequest) {
  try {
    // 1️⃣ Token verify
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return errorResponse('Invalid or expired token', 401);
    }

    await dbConnect();

    // 2️⃣ Current profile fetch
    const currentProfile = await Admin.findById(decoded.id);

    if (!currentProfile) {
      return errorResponse('Profile not found', 404);
    }

    if (currentProfile.status === 'blocked') {
      return errorResponse('Your account is blocked', 403);
    }

    // 3️⃣ Parse body
    const body: IProfileUpdateBody = await request.json();
    const { name, phone, avatar } = body;

    // 4️⃣ Build update object & track changes
    const updateData: Record<string, unknown> = {};
    const changes: string[] = [];

    // Name validation & update
    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return errorResponse('Name cannot be empty', 400);
      }

      if (trimmedName.length < 2) {
        return errorResponse(
          'Name must be at least 2 characters',
          400
        );
      }

      if (trimmedName.length > 50) {
        return errorResponse(
          'Name cannot exceed 50 characters',
          400
        );
      }

      if (trimmedName !== currentProfile.name) {
        updateData.name = trimmedName;
        changes.push(`name: "${currentProfile.name}" → "${trimmedName}"`);
      }
    }

    // Phone validation & update
    if (phone !== undefined) {
      if (phone && phone.trim()) {
        // Basic phone validation
        const phoneRegex = /^[+]?[\d\s-()]{7,20}$/;
        if (!phoneRegex.test(phone.trim())) {
          return errorResponse('Invalid phone number format', 400);
        }
        updateData.phone = phone.trim();
      } else {
        updateData.phone = null; // Clear phone
      }

      if (phone !== currentProfile.phone) {
        changes.push('phone updated');
      }
    }

    // Avatar validation & update
    if (avatar !== undefined) {
      if (avatar && avatar.trim()) {
        // Basic URL validation
        try {
          new URL(avatar.trim());
          updateData.avatar = avatar.trim();
        } catch {
          return errorResponse('Invalid avatar URL format', 400);
        }
      } else {
        updateData.avatar = null; // Clear avatar
      }

      if (avatar !== currentProfile.avatar) {
        changes.push('avatar updated');
      }
    }

    // 5️⃣ Nothing to update check
    if (Object.keys(updateData).length === 0) {
      return errorResponse('No changes provided', 400);
    }

    // 6️⃣ Update profile
    const updatedProfile = await Admin.findByIdAndUpdate(
      decoded.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select(
        '-password -resetPasswordToken -resetPasswordExpire -twoFactorSecret'
      )
      .lean();

    // 7️⃣ Activity Log
    await ActivityLog.create({
      admin: decoded.id,
      action: 'updated_own_profile',
      target: decoded.id,
      targetModel: 'Admin',
      details: `Updated own profile: ${changes.join(', ')}`,
      ip:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '',
      device: request.headers.get('user-agent') || '',
    });

    // 8️⃣ Response
    return successResponse('Profile updated successfully', {
      profile: updatedProfile,
      changes,
    });
  } catch (error: unknown) {
    console.error('Profile Update Error:', error);
    return errorResponse('Internal server error', 500);
  }
}