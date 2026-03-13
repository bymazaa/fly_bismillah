// app/api/admin/activity-log/route.ts

import { NextRequest } from 'next/server';

import ActivityLog from '@/models/ActivityLog';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { COOKIE_NAME } from '@/app/api/controller/constant';
import mongoose from 'mongoose';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

// ✅ Action categories for filtering
const ACTION_CATEGORIES: Record<string, string[]> = {
  staff: [
    'created_staff',
    'updated_staff',
    'deleted_staff',
    'blocked_staff',
    'unblocked_staff',
  ],
  session: [
    'self_logout',
    'self_logout_all',
    'self_logout_session',
    'force_logout_session',
    'force_logout_all_sessions',
  ],
  auth: [
    'login',
    'failed_login',
    'changed_password',
    'failed_password_change',
  ],
  profile: [
    'updated_own_profile',
  ],
};

// ✅ All valid actions flat list
const ALL_VALID_ACTIONS: string[] = Object.values(
  ACTION_CATEGORIES
).flat();

export async function GET(request: NextRequest) {
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

    // 2️⃣ Check admin role
    const currentAdmin = await Admin.findById(decoded.id).select(
      'role status'
    );

    if (!currentAdmin) {
      return errorResponse('Account not found', 404);
    }

    if (currentAdmin.status === 'blocked') {
      return errorResponse('Your account is blocked', 403);
    }

    // Non-admin can only see their own activity
    const isAdminRole = currentAdmin.role === 'admin';

    // 3️⃣ Query Parameters
    const { searchParams } = new URL(request.url);

    const page: number = Math.max(
      1,
      parseInt(searchParams.get('page') || '1')
    );
    const limit: number = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20'))
    );
    const search: string = searchParams.get('search') || '';
    const action: string = searchParams.get('action') || '';
    const category: string = searchParams.get('category') || '';
    const staffId: string = searchParams.get('staffId') || '';
    const dateFrom: string = searchParams.get('dateFrom') || '';
    const dateTo: string = searchParams.get('dateTo') || '';
    const sortOrder: string =
      searchParams.get('sortOrder') || 'desc';

    // 4️⃣ Build Filter
    const filter:any = {};

    // ── Non-admin: শুধু নিজের activity ──
    if (!isAdminRole) {
      filter.$or = [
        { admin: decoded.id },
        { target: decoded.id },
      ];
    }

    // ── Specific staff filter (admin only) ──
    if (staffId && isAdminRole) {
      if (!mongoose.Types.ObjectId.isValid(staffId)) {
        return errorResponse('Invalid staff ID format', 400);
      }

      filter.$or = [
        { admin: staffId },
        { target: staffId },
      ];
    }

    // ── Action filter ──
    if (action) {
      if (ALL_VALID_ACTIONS.includes(action)) {
        filter.action = action;
      } else {
        return errorResponse(
          `Invalid action filter. Valid actions: ${ALL_VALID_ACTIONS.join(', ')}`,
          400
        );
      }
    }

    // ── Category filter ──
    if (category && ACTION_CATEGORIES[category]) {
      filter.action = { $in: ACTION_CATEGORIES[category] };
    }

    // ── Search filter ──
    if (search.trim()) {
      filter.details = { $regex: search.trim(), $options: 'i' };
    }

    // ── Date range filter ──
    if (dateFrom || dateTo) {
      filter.createdAt = {};

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
          return errorResponse(
            'Invalid dateFrom format. Use YYYY-MM-DD',
            400
          );
        }
        fromDate.setHours(0, 0, 0, 0);
        (filter.createdAt as Record<string, Date>).$gte = fromDate;
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
          return errorResponse(
            'Invalid dateTo format. Use YYYY-MM-DD',
            400
          );
        }
        toDate.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, Date>).$lte = toDate;
      }
    }

    // 5️⃣ Sort
    const sort: Record<string, 1 | -1> = {
      createdAt: sortOrder === 'asc' ? 1 : -1,
    };

    // 6️⃣ Pagination
    const skip: number = (page - 1) * limit;

    // 7️⃣ Query (parallel)
    const [logs, totalCount] = await Promise.all([
      ActivityLog.find(filter)
        .populate('admin', 'name email adminId role avatar')
        .populate('target', 'name email adminId role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      ActivityLog.countDocuments(filter),
    ]);

    // 8️⃣ Action stats (admin only)
    let actionStats: Record<string, number> = {};

    if (isAdminRole) {
      // Count per action type
      const statsAggregation = await ActivityLog.aggregate([
        ...(Object.keys(filter).length > 0
          ? [{ $match: filter }]
          : []),
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      actionStats = statsAggregation.reduce(
        (acc: Record<string, number>, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {}
      );
    }

    // 9️⃣ Today's activity count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayFilter:any = {
      ...filter,
      createdAt: { $gte: todayStart },
    };

    const todayCount = await ActivityLog.countDocuments(todayFilter);

    // 🔟 Response
    const totalPages = Math.ceil(totalCount / limit);

    return successResponse(
      'Activity log fetched successfully',
      {
        logs: logs.map((log) => ({
          _id: log._id,
          action: log.action,
          actionLabel: formatActionLabel(log.action),
          actionCategory: getActionCategory(log.action),
          details: log.details,
          admin: log.admin,
          target: log.target,
          ip: log.ip,
          device: log.device,
          createdAt: log.createdAt,
          timeAgo: getTimeAgo(log.createdAt),
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats: {
          totalLogs: totalCount,
          todayActivity: todayCount,
          ...(isAdminRole && { actionBreakdown: actionStats }),
        },
        filters: {
          availableActions: ALL_VALID_ACTIONS,
          availableCategories: Object.keys(ACTION_CATEGORIES),
        },
      }
    );
  } catch (error: unknown) {
    console.error('Activity Log Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

/**
 * Action কে readable label এ convert করে
 */
function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    created_staff: '👤 Staff Created',
    updated_staff: '✏️ Staff Updated',
    deleted_staff: '🗑️ Staff Deleted',
    blocked_staff: '🚫 Staff Blocked',
    unblocked_staff: '✅ Staff Unblocked',
    self_logout: '🚪 Logged Out',
    self_logout_all: '🚪 Logged Out All Sessions',
    self_logout_session: '🚪 Session Ended',
    force_logout_session: '⚡ Force Logout Session',
    force_logout_all_sessions: '⚡ Force Logout All Sessions',
    login: '🔑 Logged In',
    failed_login: '❌ Failed Login',
    changed_password: '🔒 Password Changed',
    failed_password_change: '❌ Failed Password Change',
    updated_own_profile: '👤 Profile Updated',
  };

  return labels[action] || action;
}

/**
 * Action কোন category তে পড়ে
 */
function getActionCategory(action: string): string {
  for (const [category, actions] of Object.entries(
    ACTION_CATEGORIES
  )) {
    if (actions.includes(action)) return category;
  }
  return 'other';
}

/**
 * Time ago format
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}