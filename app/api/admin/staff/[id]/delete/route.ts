// app/api/admin/staff/[id]/delete/route.ts
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

    if (!isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - Only admin can delete staff',
        403
      );
    }

    await dbConnect();

    const { id } = await params;

    // 2️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid staff ID format', 400);
    }

    // 3️⃣ নিজেকে নিজে delete করা যাবে না
    if (id === currentAdmin._id.toString()) {
      return errorResponse('You cannot delete yourself', 400);
    }

    // 4️⃣ Find staff
    const staff = await Admin.findById(id);
    if (!staff) {
      return errorResponse('Staff not found', 404);
    }

    // 5️⃣ Primary admin delete করা যাবে না
    if (staff.role === 'admin' && !staff.createdBy) {
      return errorResponse(
        'Cannot delete the primary admin account',
        400
      );
    }

    // 6️⃣ Store info for log
    const deletedInfo = {
      name: staff.name,
      email: staff.email,
      role: staff.role,
      adminId: staff.adminId,
    };

    // 7️⃣ Delete
    await Admin.findByIdAndDelete(id);

    // 8️⃣ Activity Log
    await ActivityLog.create({
      admin: currentAdmin._id,
      action: 'deleted_staff',
      target: null,
      details: `Deleted staff "${deletedInfo.name}" (${deletedInfo.email}) - Role: ${deletedInfo.role} - ID: ${deletedInfo.adminId}`,
    });

    return successResponse('Staff deleted successfully', {
      deletedStaff: deletedInfo,
    });
  } catch (error: unknown) {
    console.error('Delete Staff Error:', error);
    return errorResponse('Internal server error', 500);
  }
}