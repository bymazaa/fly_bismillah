// app/api/admin/sessions/[sessionId]/logout/route.ts

import { NextRequest } from 'next/server';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

import ActivityLog from '@/models/ActivityLog';
import { getCurrentAdmin, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 1️⃣ Auth Check
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    await dbConnect();

    const { sessionId } = await params;

    // 2️⃣ Validate sessionId
    if (!sessionId || !sessionId.trim()) {
      return errorResponse('Session ID is required', 400);
    }

    // 3️⃣ Find which staff has this session
    const staff = await Admin.findOne({
      'activeSessions.sessionId': sessionId,
    }).select(
      'name email adminId role activeSessions loginHistory'
    );

    if (!staff) {
      return errorResponse(
        'Session not found or already expired',
        404
      );
    }

    // 4️⃣ Permission check
    // Admin সব session logout করতে পারবে
    // Staff শুধু নিজের session logout করতে পারবে
    const isSelf =
      staff._id.toString() === currentAdmin._id.toString();

    if (!isSelf && !isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - You can only logout your own sessions',
        403
      );
    }

    // 5️⃣ Find session details before removing (for log)
    const sessionToRemove = staff.activeSessions.find(
      (s) => s.sessionId === sessionId
    );

    const sessionInfo = {
      device: sessionToRemove?.device || 'Unknown',
      browser: sessionToRemove?.browser || 'Unknown',
      ip: sessionToRemove?.ip || 'Unknown',
      location: sessionToRemove?.location || 'Unknown',
      loginTime: sessionToRemove?.loginTime || new Date(),
    };

    // 6️⃣ Remove session from activeSessions
    await Admin.findByIdAndUpdate(staff._id, {
      $pull: {
        activeSessions: { sessionId },
      },
    });

    // 7️⃣ Add to loginHistory as "completed"
    await Admin.findByIdAndUpdate(staff._id, {
      $push: {
        loginHistory: {
          $each: [
            {
              device: sessionInfo.device,
              browser: sessionInfo.browser,
              ip: sessionInfo.ip,
              location: sessionInfo.location,
              time: sessionInfo.loginTime,
              status: 'completed',
            },
          ],
          $slice: -50, // Last 50 entries রাখো
        },
      },
    });

    // 8️⃣ Check remaining sessions
    const updatedStaff = await Admin.findById(staff._id).select(
      'activeSessions'
    );

    const remainingSessions =
      updatedStaff?.activeSessions?.length || 0;

    // যদি কোনো session না থাকে তাহলে offline
    if (remainingSessions === 0) {
      await Admin.findByIdAndUpdate(staff._id, {
        $set: {
          isOnline: false,
          lastActive: new Date(),
        },
      });
    }

    // 9️⃣ Activity Log
    await ActivityLog.create({
      admin: currentAdmin._id,
      action: isSelf ? 'self_logout_session' : 'force_logout_session',
      target: staff._id,
      details: `${isSelf ? 'Self' : 'Force'} logout session of "${staff.name}" - Device: ${sessionInfo.device} - Browser: ${sessionInfo.browser} - IP: ${sessionInfo.ip} - Location: ${sessionInfo.location}`,
    });

    return successResponse('Session logged out successfully', {
      loggedOutSession: {
        sessionId,
        ...sessionInfo,
        staffName: staff.name,
        staffEmail: staff.email,
      },
      remainingSessions,
      staffIsOnline: remainingSessions > 0,
    });
  } catch (error: unknown) {
    console.error('Force Logout Error:', error);
    return errorResponse('Internal server error', 500);
  }
}