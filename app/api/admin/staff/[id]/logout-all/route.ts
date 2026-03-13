// app/api/admin/staff/[id]/logout-all/route.ts

import { NextRequest } from 'next/server';
import ActivityLog from '@/models/ActivityLog';
import { getCurrentAdmin, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

interface RouteParams {
  params: Promise<{ id: string }>;
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

    const { id } = await params;

    // 2️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid staff ID format', 400);
    }

    // 3️⃣ Permission check
    const isSelf = id === currentAdmin._id.toString();

    if (!isSelf && !isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - Only admin can logout all sessions of other staff',
        403
      );
    }

    // 4️⃣ Find staff
    const staff = await Admin.findById(id).select(
      'name email adminId role activeSessions loginHistory status'
    );

    if (!staff) {
      return errorResponse('Staff not found', 404);
    }

    // 5️⃣ Check if any active sessions exist
    const activeSessionCount = staff.activeSessions?.length || 0;

    if (activeSessionCount === 0) {
      return errorResponse(
        'No active sessions found for this staff',
        400
      );
    }

    // 6️⃣ Store session info before clearing (for log)
    const sessionsInfo = (staff.activeSessions || []).map(
      (session) => ({
        sessionId: session.sessionId,
        device: session.device || 'Unknown',
        browser: session.browser || 'Unknown',
        ip: session.ip || 'Unknown',
        location: session.location || 'Unknown',
        loginTime: session.loginTime,
      })
    );

    // 7️⃣ Move all active sessions to login history as "completed"
    const historyEntries = (staff.activeSessions || []).map(
      (session) => ({
        device: session.device || 'Unknown',
        browser: session.browser || 'Unknown',
        ip: session.ip || 'Unknown',
        location: session.location || 'Unknown',
        time: session.loginTime || new Date(),
        status: 'completed' as const,
      })
    );

    // 8️⃣ Clear all sessions + set offline + add to history
    await Admin.findByIdAndUpdate(id, {
      $set: {
        activeSessions: [],
        isOnline: false,
        lastActive: new Date(),
      },
      $push: {
        loginHistory: {
          $each: historyEntries,
          $slice: -50, // Last 50 entries রাখো
        },
      },
    });

    // 9️⃣ Also mark any "current" login history as "completed"
    await Admin.updateOne(
      { _id: id },
      {
        $set: {
          'loginHistory.$[elem].status': 'completed',
        },
      },
      {
        arrayFilters: [{ 'elem.status': 'current' }],
      }
    );

    // 🔟 Activity Log
    const deviceList = sessionsInfo
      .map((s) => `${s.device} (${s.ip})`)
      .join(', ');

    await ActivityLog.create({
      admin: currentAdmin._id,
      action: isSelf
        ? 'self_logout_all_sessions'
        : 'force_logout_all_sessions',
      target: id,
      details: `${isSelf ? 'Self' : 'Force'} logged out ALL ${activeSessionCount} sessions of "${staff.name}" (${staff.email}) - Devices: ${deviceList}`,
    });

    // 1️⃣1️⃣ Response
    return successResponse(
      'All sessions logged out successfully',
      {
        staffName: staff.name,
        staffEmail: staff.email,
        staffAdminId: staff.adminId,
        totalSessionsTerminated: activeSessionCount,
        terminatedSessions: sessionsInfo,
        message: `All ${activeSessionCount} session(s) of ${staff.name} have been terminated`,
      }
    );
  } catch (error: unknown) {
    console.error('Logout All Sessions Error:', error);
    return errorResponse('Internal server error', 500);
  }
}