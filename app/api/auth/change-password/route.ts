// app/api/auth/change-password/route.ts

import { NextRequest } from 'next/server';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

import ActivityLog from '@/models/ActivityLog';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { COOKIE_NAME } from '@/app/api/controller/constant';
import bcrypt from 'bcryptjs';

interface IChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  logoutAllSessions?: boolean; // password change এর পর সব session logout?
}

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

    // 2️⃣ Admin/Staff fetch (password সহ)
    const admin = await Admin.findById(decoded.id).select('+password');

    if (!admin) {
      return errorResponse('Account not found', 404);
    }

    if (admin.status === 'blocked') {
      return errorResponse('Your account is blocked', 403);
    }

    // 3️⃣ Parse body
    const body: IChangePasswordBody = await request.json();
    const {
      currentPassword,
      newPassword,
      confirmPassword,
      logoutAllSessions = false,
    } = body;

    // 4️⃣ Validation
    if (!currentPassword) {
      return errorResponse('Current password is required', 400);
    }

    if (!newPassword) {
      return errorResponse('New password is required', 400);
    }

    if (!confirmPassword) {
      return errorResponse('Confirm password is required', 400);
    }

    // Password match check
    if (newPassword !== confirmPassword) {
      return errorResponse(
        'New password and confirm password do not match',
        400
      );
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return errorResponse(
        'Password must be at least 6 characters',
        400
      );
    }

    if (newPassword.length > 128) {
      return errorResponse(
        'Password cannot exceed 128 characters',
        400
      );
    }

    // Same password check
    if (currentPassword === newPassword) {
      return errorResponse(
        'New password must be different from current password',
        400
      );
    }

    // 5️⃣ Current password verify
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!isCurrentPasswordValid) {
      // Failed attempt track
      await Admin.findByIdAndUpdate(decoded.id, {
        $inc: { failedLoginAttempts: 1 },
      });

      // Activity log for failed attempt
      await ActivityLog.create({
        admin: decoded.id,
        action: 'failed_password_change',
        target: decoded.id,
        targetModel: 'Admin',
        details: 'Failed password change attempt - wrong current password',
        ip:
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          '',
        device: request.headers.get('user-agent') || '',
      });

      return errorResponse('Current password is incorrect', 401);
    }

    // 6️⃣ Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 7️⃣ Build update data
    const updateData: Record<string, unknown> = {
      password: hashedNewPassword,
      failedLoginAttempts: 0, // Reset failed attempts
      lockUntil: null,
    };

    // 8️⃣ Logout all other sessions (optional)
    let sessionsTerminated = 0;
    const currentSessionId = decoded.sessionId || null;

    if (logoutAllSessions) {
      // সব session logout (current session বাদে)
      if (currentSessionId) {
        // শুধু current session রাখো, বাকি সব remove
        const currentSessionData = admin.activeSessions?.find(
          (s) => s.sessionId === currentSessionId
        );

        sessionsTerminated =
          (admin.activeSessions?.length || 0) - (currentSessionData ? 1 : 0);

        updateData.activeSessions = currentSessionData
          ? [currentSessionData]
          : [];
      } else {
        sessionsTerminated = admin.activeSessions?.length || 0;
        updateData.activeSessions = [];
        updateData.isOnline = false;
      }

      // সব loginHistory "completed" করো
      // (এটা separate update এ করতে হবে)
    }

    // 9️⃣ Update password
    await Admin.findByIdAndUpdate(decoded.id, {
      $set: updateData,
    });

    // Login history update (if logging out all)
    if (logoutAllSessions) {
      await Admin.updateOne(
        { _id: decoded.id },
        {
          $set: {
            'loginHistory.$[elem].status': 'completed',
          },
        },
        {
          arrayFilters: [
            {
              'elem.status': 'current',
              ...(currentSessionId
                ? { 'elem.sessionId': { $ne: currentSessionId } }
                : {}),
            },
          ],
        }
      );
    }

    // 🔟 Activity Log
    await ActivityLog.create({
      admin: decoded.id,
      action: 'changed_password',
      target: decoded.id,
      targetModel: 'Admin',
      details: `Password changed successfully${logoutAllSessions ? ` - ${sessionsTerminated} other session(s) terminated` : ''}`,
      ip:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        '',
      device: request.headers.get('user-agent') || '',
    });

    // 1️⃣1️⃣ Response
    return successResponse('Password changed successfully', {
      message: 'Your password has been updated',
      logoutAllSessions,
      sessionsTerminated,
    });
  } catch (error: unknown) {
    console.error('Change Password Error:', error);
    return errorResponse('Internal server error', 500);
  }
}