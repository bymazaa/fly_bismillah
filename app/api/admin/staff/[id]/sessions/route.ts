// app/api/admin/staff/[id]/sessions/route.ts

import { NextRequest } from 'next/server';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

import { getCurrentAdmin, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SessionWithMeta {
  sessionId: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: Date;
  lastActive: Date;
  duration: string;
  isCurrentSession: boolean;
}

// ✅ Duration calculator helper
function calculateDuration(loginTime: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(loginTime).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 1️⃣ Auth Check
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    // Admin অথবা নিজের sessions দেখতে পারবে
    const { id } = await params;
    const isSelf = id === currentAdmin._id.toString();

    if (!isSelf && !isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - Only admin can view other staff sessions',
        403
      );
    }

    await dbConnect();

    // 2️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid staff ID format', 400);
    }

    // 3️⃣ Find staff
    const staff = await Admin.findById(id)
      .select(
        'name email adminId role avatar status isOnline lastActive lastLogin activeSessions loginHistory'
      )
      .lean();

    if (!staff) {
      return errorResponse('Staff not found', 404);
    }

    // 4️⃣ Process active sessions with extra info
    const activeSessions: SessionWithMeta[] = (
      staff.activeSessions || []
    ).map((session) => ({
      sessionId: session.sessionId,
      device: session.device || 'Unknown',
      browser: session.browser || 'Unknown',
      ip: session.ip || 'Unknown',
      location: session.location || 'Unknown',
      loginTime: session.loginTime,
      lastActive: session.lastActive,
      duration: calculateDuration(session.loginTime),
      isCurrentSession: false, // Frontend এ current user এর session identify করবে
    }));

    // Sort by loginTime (newest first)
    activeSessions.sort(
      (a, b) =>
        new Date(b.loginTime).getTime() -
        new Date(a.loginTime).getTime()
    );

    // 5️⃣ Recent login history (last 20)
    const recentLoginHistory = (staff.loginHistory || [])
      .sort(
        (a, b) =>
          new Date(b.time).getTime() - new Date(a.time).getTime()
      )
      .slice(0, 20)
      .map((entry) => ({
        device: entry.device || 'Unknown',
        browser: entry.browser || 'Unknown',
        ip: entry.ip || 'Unknown',
        location: entry.location || 'Unknown',
        time: entry.time,
        status: entry.status,
      }));

    // 6️⃣ Session stats
    const uniqueDevices = new Set(
      activeSessions.map((s) => s.device)
    ).size;
    const uniqueLocations = new Set(
      activeSessions.map((s) => s.location)
    ).size;
    const uniqueIPs = new Set(
      activeSessions.map((s) => s.ip)
    ).size;

    // 7️⃣ Response
    return successResponse(
      'Staff sessions fetched successfully',
      {
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          adminId: staff.adminId,
          role: staff.role,
          avatar: staff.avatar,
          status: staff.status,
          isOnline: staff.isOnline,
          lastActive: staff.lastActive,
          lastLogin: staff.lastLogin,
        },
        activeSessions,
        recentLoginHistory,
        stats: {
          totalActiveSessions: activeSessions.length,
          uniqueDevices,
          uniqueLocations,
          uniqueIPs,
          totalLoginHistory: (staff.loginHistory || []).length,
        },
      }
    );
  } catch (error: unknown) {
    console.error('Staff Sessions Error:', error);
    return errorResponse('Internal server error', 500);
  }
}