// app/api/admin/staff/[id]/unblock/route.ts

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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 1️⃣ Auth Check
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    if (!isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - Only admin can unblock staff',
        403
      );
    }

    await dbConnect();

    const { id } = await params;

    // 2️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid staff ID format', 400);
    }

    // 3️⃣ Find staff
    const staff = await Admin.findById(id);
    if (!staff) {
      return errorResponse('Staff not found', 404);
    }

    // 4️⃣ Already active?
    if (staff.status === 'active') {
      return errorResponse('This staff is already active', 400);
    }

    // 5️⃣ Store old block info for log
    const oldBlockReason = staff.blockReason || 'N/A';
    const oldBlockedAt = staff.blockedAt;

    // 6️⃣ Unblock staff
    const unblockedStaff = await Admin.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'active',
          blockedAt: null,
          blockedBy: null,
          blockReason: null,
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      },
      { new: true }
    )
      .select(
        '-password -resetPasswordToken -resetPasswordExpire -twoFactorSecret'
      )
      .populate('createdBy', 'name email adminId')
      .lean();

    // 7️⃣ Activity Log
    await ActivityLog.create({
      admin: currentAdmin._id,
      action: 'unblocked_staff',
      target: id,
      details: `Unblocked staff "${staff.name}" (${staff.email}) - Was blocked for: "${oldBlockReason}" since ${oldBlockedAt?.toISOString() || 'N/A'}`,
    });

    return successResponse('Staff unblocked successfully', {
      staff: unblockedStaff,
      message: `${staff.name} has been unblocked and can now login`,
    });
  } catch (error: unknown) {
    console.error('Unblock Staff Error:', error);
    return errorResponse('Internal server error', 500);
  }
}