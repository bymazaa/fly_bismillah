// app/api/admin/staff/list/route.ts
import { NextRequest } from 'next/server';

import { successResponse, errorResponse } from '@/lib/apiResponse';
import { IStaffListResponse } from '@/types/admin';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { getCurrentAdmin, isAdmin } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    // 1️⃣ Auth Check
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    if (!isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - Only admin can view staff list',
        403
      );
    }

    await dbConnect();

    // 2️⃣ Query Parameters
    const { searchParams } = new URL(request.url);
    const page: number = parseInt(searchParams.get('page') || '1');
    const limit: number = parseInt(searchParams.get('limit') || '10');
    const search: string = searchParams.get('search') || '';
    const role: string = searchParams.get('role') || '';
    const status: string = searchParams.get('status') || '';
    const sortBy: string = searchParams.get('sortBy') || 'createdAt';
    const sortOrder: string =
      searchParams.get('sortOrder') || 'desc';

    // 3️⃣ Validate pagination
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100

    // 4️⃣ Build Filter
    const filter:any = {
      _id: { $ne: currentAdmin._id }, // নিজেকে বাদ
    };

    // Search
    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { adminId: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Role filter
    const validRoles = ['admin', 'editor', 'viewer'];
    if (role && validRoles.includes(role)) {
      filter.role = role;
    }

    // Status filter
    const validStatuses = ['active', 'blocked', 'suspended'];
    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    // 5️⃣ Sort
    const allowedSortFields = [
      'createdAt',
      'name',
      'email',
      'role',
      'status',
      'lastLogin',
      'lastActive',
    ];

    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const sort: Record<string, 1 | -1> = {
      [validSortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // 6️⃣ Skip
    const skip: number = (validPage - 1) * validLimit;

    // 7️⃣ Query execution (parallel)
    const selectFields =
      '-password -resetPasswordToken -resetPasswordExpire -twoFactorSecret';

    const [staffList, totalCount, totalActive, totalBlocked, totalOnline] =
      await Promise.all([
        Admin.find(filter)
          .select(selectFields)
          .populate('createdBy', 'name email adminId')
          .populate('blockedBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(validLimit)
          .lean(),

        Admin.countDocuments(filter),
        Admin.countDocuments({ ...filter, status: 'active' }),
        Admin.countDocuments({ ...filter, status: 'blocked' }),
        Admin.countDocuments({ ...filter, isOnline: true }),
      ]);

    // 8️⃣ Response
    const totalPages = Math.ceil(totalCount / validLimit);

    const responseData: IStaffListResponse = {
      staff: staffList,
      pagination: {
        currentPage: validPage,
        totalPages,
        totalItems: totalCount,
        limit: validLimit,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1,
      },
      stats: {
        total: totalCount,
        active: totalActive,
        blocked: totalBlocked,
        online: totalOnline,
      },
    };

    return successResponse(
      'Staff list fetched successfully',
      responseData
    );
  } catch (error: unknown) {
    console.error('Staff List Error:', error);
    return errorResponse('Internal server error', 500);
  }
}