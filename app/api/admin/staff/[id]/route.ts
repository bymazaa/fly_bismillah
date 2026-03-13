// app/api/admin/staff/[id]/route.ts

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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1️⃣ Auth Check
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    if (!isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - Only admin can view staff details',
        403
      );
    }

    await dbConnect();

    const { id } = await params;

    // 2️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid staff ID format', 400);
    }

    // 3️⃣ Find Staff
    const selectFields =
      '-password -resetPasswordToken -resetPasswordExpire -twoFactorSecret';

    const staff = await Admin.findById(id)
      .select(selectFields)
      .populate('createdBy', 'name email adminId')
      .populate('blockedBy', 'name email')
      .lean();

    if (!staff) {
      return errorResponse('Staff not found', 404);
    }

    // 4️⃣ Recent activity of this staff
    const recentActivity = await ActivityLog.find({
      $or: [{ admin: id }, { target: id }],
    })
      .populate('admin', 'name email adminId')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // 5️⃣ Response
    return successResponse('Staff details fetched successfully', {
      staff,
      recentActivity,
      activeSessions: staff.activeSessions || [],
      loginHistory: (staff.loginHistory || []).slice(0, 10),
    });
  } catch (error: unknown) {
    console.error('Single Staff Error:', error);
    return errorResponse('Internal server error', 500);
  }
}