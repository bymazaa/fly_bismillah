// app/api/admin/staff/[id]/block/route.ts
import { NextRequest } from 'next/server';
import ActivityLog from '@/models/ActivityLog';
import { getCurrentAdmin, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { IBlockStaffBody } from '@/types/admin';
import mongoose from 'mongoose';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 1️⃣ Auth Check
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    if (!isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - Only admin can block staff',
        403
      );
    }

    await dbConnect();

    const { id } = await params;

    // 2️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid staff ID format', 400);
    }

    // 3️⃣ নিজেকে block করা যাবে না
    if (id === currentAdmin._id.toString()) {
      return errorResponse('You cannot block yourself', 400);
    }

    // 4️⃣ Find staff
    const staff = await Admin.findById(id);
    if (!staff) {
      return errorResponse('Staff not found', 404);
    }

    // 5️⃣ Already blocked?
    if (staff.status === 'blocked') {
      return errorResponse('This staff is already blocked', 400);
    }

    // 6️⃣ Primary admin block করা যাবে না
    if (staff.role === 'admin' && !staff.createdBy) {
      return errorResponse(
        'Cannot block the primary admin account',
        400
      );
    }

    // 7️⃣ Get block reason
    let reason = 'No reason provided';
    try {
      const body: IBlockStaffBody = await request.json();
      if (body.reason?.trim()) {
        reason = body.reason.trim();
      }
    } catch {
      // No body provided - use default reason
    }

    // 8️⃣ Block staff + Clear all sessions (Force Logout)
    await Admin.findByIdAndUpdate(id, {
      $set: {
        status: 'blocked',
        blockedAt: new Date(),
        blockedBy: currentAdmin._id,
        blockReason: reason,
        isOnline: false,
        activeSessions: [], // সব session clear = force logout
      },
    });

    // 9️⃣ সব current login history "completed" করো
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

    // 🔟 Final fetch
    const blockedStaff = await Admin.findById(id)
      .select(
        '-password -resetPasswordToken -resetPasswordExpire -twoFactorSecret'
      )
      .populate('blockedBy', 'name email adminId')
      .lean();

    // 1️⃣1️⃣ Activity Log
    await ActivityLog.create({
      admin: currentAdmin._id,
      action: 'blocked_staff',
      target: id,
      details: `Blocked staff "${staff.name}" (${staff.email}) - Reason: ${reason}`,
    });

    return successResponse('Staff blocked successfully', {
      staff: blockedStaff,
      message: `${staff.name} has been blocked and all sessions terminated`,
    });
  } catch (error: unknown) {
    console.error('Block Staff Error:', error);
    return errorResponse('Internal server error', 500);
  }
}