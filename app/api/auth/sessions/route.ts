// app/api/admin/sessions/route.ts

import { NextRequest } from 'next/server';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { getCurrentAdmin, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

interface FlattenedSession {
  sessionId: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: Date;
  lastActive: Date;
  staff: {
    _id: string;
    name: string;
    email: string;
    adminId: string;
    role: string;
    avatar: string | null;
    isOnline: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    // 1️⃣ Auth Check
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    if (!isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - Only admin can view all sessions',
        403
      );
    }

    await dbConnect();

    // 2️⃣ Query Parameters
    const { searchParams } = new URL(request.url);
    const page: number = parseInt(searchParams.get('page') || '1');
    const limit: number = parseInt(searchParams.get('limit') || '20');
    const search: string = searchParams.get('search') || '';
    const role: string = searchParams.get('role') || '';
    const onlineOnly: boolean = searchParams.get('onlineOnly') === 'true';

    // 3️⃣ Build filter - শুধু যাদের active session আছে
    const filter: Record<string, unknown> = {
      'activeSessions.0': { $exists: true }, // কমপক্ষে ১টা session আছে
    };

    // Online only filter
    if (onlineOnly) {
      filter.isOnline = true;
    }

    // Role filter
    const validRoles = ['admin', 'editor', 'viewer'];
    if (role && validRoles.includes(role)) {
      filter.role = role;
    }

    // Search filter
    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { adminId: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // 4️⃣ Find all admins/staff with active sessions
    const staffWithSessions = await Admin.find(filter)
      .select(
        'name email adminId role avatar isOnline lastActive activeSessions'
      )
      .sort({ lastActive: -1 })
      .lean();

    // 5️⃣ Flatten sessions - প্রতিটা session আলাদা item হিসেবে
    const allSessions: FlattenedSession[] = [];

    for (const staff of staffWithSessions) {
      for (const session of staff.activeSessions || []) {
        allSessions.push({
          sessionId: session.sessionId,
          device: session.device || 'Unknown',
          browser: session.browser || 'Unknown',
          ip: session.ip || 'Unknown',
          location: session.location || 'Unknown',
          loginTime: session.loginTime,
          lastActive: session.lastActive,
          staff: {
            _id: staff._id.toString(),
            name: staff.name,
            email: staff.email,
            adminId: staff.adminId,
            role: staff.role,
            avatar: staff.avatar || null,
            isOnline: staff.isOnline,
          },
        });
      }
    }

    // 6️⃣ Sort by lastActive (most recent first)
    allSessions.sort(
      (a, b) =>
        new Date(b.lastActive).getTime() -
        new Date(a.lastActive).getTime()
    );

    // 7️⃣ Pagination on flattened sessions
    const totalSessions: number = allSessions.length;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);
    const skip: number = (validPage - 1) * validLimit;
    const paginatedSessions = allSessions.slice(
      skip,
      skip + validLimit
    );

    // 8️⃣ Stats
    const totalStaffWithSessions: number = staffWithSessions.length;
    const totalOnlineStaff: number = staffWithSessions.filter(
      (s) => s.isOnline
    ).length;

    // Unique devices count
    const uniqueDevices = new Set(
      allSessions.map((s) => s.device)
    ).size;

    // Unique IPs count
    const uniqueIPs = new Set(allSessions.map((s) => s.ip)).size;

    // 9️⃣ Response
    const totalPages = Math.ceil(totalSessions / validLimit);

    return successResponse('All active sessions fetched successfully', {
      sessions: paginatedSessions,
      pagination: {
        currentPage: validPage,
        totalPages,
        totalItems: totalSessions,
        limit: validLimit,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1,
      },
      stats: {
        totalSessions,
        totalStaffWithSessions,
        totalOnlineStaff,
        uniqueDevices,
        uniqueIPs,
      },
    });
  } catch (error: unknown) {
    console.error('All Sessions Error:', error);
    return errorResponse('Internal server error', 500);
  }
}