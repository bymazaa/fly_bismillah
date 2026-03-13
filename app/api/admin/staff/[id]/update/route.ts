// app/api/admin/staff/[id]/update/route.ts

import { NextRequest } from 'next/server';
import ActivityLog from '@/models/ActivityLog';
import { getCurrentAdmin, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '@/models/Admin.model';
import dbConnect from '@/connection/db';
import { IUpdateStaffBody, IPermissions } from '@/types/admin';

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
        'Forbidden - Only admin can update staff',
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
    const staff = await Admin.findById(id).select('+password');
    if (!staff) {
      return errorResponse('Staff not found', 404);
    }

    // 4️⃣ Self-edit restrictions
    const isSelf =
      staff._id.toString() === currentAdmin._id.toString();

    // 5️⃣ Parse body
    const body: IUpdateStaffBody = await request.json();
    const {
      name,
      email,
      password,
      phone,
      role,
      permissions,
      isVerified,
      isTwoFactorEnabled,
    } = body;

    // 6️⃣ নিজের role নিজে change করা যাবে না
    if (isSelf && role && role !== currentAdmin.role) {
      return errorResponse('You cannot change your own role', 400);
    }

    // 7️⃣ Build update object
    const updateData: Record<string, unknown> = {};
    const changes: string[] = [];

    // Name update
    if (name !== undefined && name.trim() && name.trim() !== staff.name) {
      updateData.name = name.trim();
      changes.push(`name: "${staff.name}" → "${name.trim()}"`);
    }

    // Email update
    if (email !== undefined && email.toLowerCase().trim() !== staff.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse('Invalid email format', 400);
      }

      const emailExists = await Admin.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
      });

      if (emailExists) {
        return errorResponse('This email is already in use', 400);
      }

      updateData.email = email.toLowerCase().trim();
      changes.push(`email changed`);
    }

    // Password update
    if (password !== undefined) {
      if (password.length < 6) {
        return errorResponse(
          'Password must be at least 6 characters',
          400
        );
      }
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(password, salt);
      changes.push('password changed');
    }

    // Phone update
    if (phone !== undefined) {
      updateData.phone = phone || null;
      changes.push('phone updated');
    }

    // Role update
    if (role !== undefined) {
      const validRoles = ['admin', 'editor', 'viewer'];
      if (!validRoles.includes(role)) {
        return errorResponse('Invalid role', 400);
      }
      if (role !== staff.role) {
        changes.push(`role: "${staff.role}" → "${role}"`);
      }
      updateData.role = role;
    }

    // Permissions update
    if (permissions !== undefined) {
      const validPermissionKeys: (keyof IPermissions)[] = [
     "booking",
     "staff",
     "customers",
     "dashboard",
     "packages",
     "support",
     "transactions",
     "offers",
     "reports",
    "destinations",
    "settings"
      ];

      const currentPermissions = staff.permissions || {};
      const mergedPermissions: Record<string, string> = {
        ...currentPermissions,
      };

      for (const key of validPermissionKeys) {
        if (permissions[key] !== undefined) {
          mergedPermissions[key] = permissions[key]!;
        }
      }

      updateData.permissions = mergedPermissions;
      changes.push('permissions updated');
    }

    // Verified status
    if (isVerified !== undefined) {
      updateData.isVerified = isVerified;
      changes.push(`verified: ${isVerified}`);
    }

    // 2FA
    if (isTwoFactorEnabled !== undefined) {
      updateData.isTwoFactorEnabled = isTwoFactorEnabled;
      if (!isTwoFactorEnabled) {
        updateData.twoFactorSecret = null;
      }
      changes.push(`2FA: ${isTwoFactorEnabled}`);
    }

    // 8️⃣ Nothing to update check
    if (Object.keys(updateData).length === 0) {
      return errorResponse('No changes provided', 400);
    }

    // 9️⃣ Update
    const selectFields =
      '-password -resetPasswordToken -resetPasswordExpire -twoFactorSecret';

    const updatedStaff = await Admin.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select(selectFields)
      .populate('createdBy', 'name email adminId')
      .lean();

    // 🔟 Activity Log
    await ActivityLog.create({
      admin: currentAdmin._id,
      action: 'updated_staff',
      target: id,
      details: `Updated staff "${staff.name}": ${changes.join(', ')}`,
    });

    return successResponse('Staff updated successfully', {
      staff: updatedStaff,
      changes,
    });
  } catch (error: unknown) {
    console.error('Update Staff Error:', error);

    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      return errorResponse('This email is already in use');
    }

    return errorResponse('Internal server error', 500);
  }
}