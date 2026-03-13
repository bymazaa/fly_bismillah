// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

import ActivityLog from '@/models/ActivityLog';
import { verifyToken } from '@/lib/auth';
import { COOKIE_NAME } from '@/app/api/controller/constant';

interface ILogoutBody {
  logoutAll?: boolean; // true হলে সব device থেকে logout
}

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Token verify
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      // Token নেই - cookie clear করে দাও
      const response = NextResponse.json(
        { success: true, message: 'Already logged out' },
        { status: 200 }
      );
      clearCookie(response);
      return response;
    }

    const decoded = await verifyToken(token);

    // Token invalid হলেও cookie clear করে logout করো
    if (!decoded || !decoded.id) {
      const response = NextResponse.json(
        { success: true, message: 'Logged out successfully' },
        { status: 200 }
      );
      clearCookie(response);
      return response;
    }

    await dbConnect();

    // 2️⃣ Parse body (optional)
    let logoutAll = false;
    try {
      const body: ILogoutBody = await request.json();
      logoutAll = body.logoutAll || false;
    } catch {
      // No body - single session logout
    }

    const currentSessionId = decoded.sessionId || null;

    // 3️⃣ Find admin
    const admin = await Admin.findById(decoded.id).select(
      'name email adminId activeSessions'
    );

    if (!admin) {
      // Admin not found - just clear cookie
      const response = NextResponse.json(
        { success: true, message: 'Logged out successfully' },
        { status: 200 }
      );
      clearCookie(response);
      return response;
    }

    // 4️⃣ Session info for log (before removing)
    const currentSession = admin.activeSessions?.find(
      (s) => s.sessionId === currentSessionId
    );

    let sessionsTerminated = 0;

    if (logoutAll) {
      // ──── LOGOUT ALL SESSIONS ────
      sessionsTerminated = admin.activeSessions?.length || 0;

      // Move all sessions to history
      const historyEntries = (admin.activeSessions || []).map(
        (session) => ({
          device: session.device || 'Unknown',
          browser: session.browser || 'Unknown',
          ip: session.ip || 'Unknown',
          location: session.location || 'Unknown',
          time: session.loginTime || new Date(),
          status: 'completed' as const,
        })
      );

      await Admin.findByIdAndUpdate(decoded.id, {
        $set: {
          activeSessions: [],
          isOnline: false,
          lastActive: new Date(),
        },
        $push: {
          loginHistory: {
            $each: historyEntries,
            $slice: -50,
          },
        },
      });

      // Mark all current login history as completed
      await Admin.updateOne(
        { _id: decoded.id },
        {
          $set: {
            'loginHistory.$[elem].status': 'completed',
          },
        },
        {
          arrayFilters: [{ 'elem.status': 'current' }],
        }
      );

      // Activity Log
      await ActivityLog.create({
        admin: decoded.id,
        action: 'self_logout_all',
        target: decoded.id,
        targetModel: 'Admin',
        details: `Self logged out from ALL ${sessionsTerminated} session(s)`,
        ip:
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          '',
        device: request.headers.get('user-agent') || '',
      });
    } else {
      // ──── LOGOUT CURRENT SESSION ONLY ────
      sessionsTerminated = 1;

      if (currentSessionId) {
        // Remove current session
        await Admin.findByIdAndUpdate(decoded.id, {
          $pull: {
            activeSessions: { sessionId: currentSessionId },
          },
        });

        // Add to history as completed
        if (currentSession) {
          await Admin.findByIdAndUpdate(decoded.id, {
            $push: {
              loginHistory: {
                $each: [
                  {
                    device: currentSession.device || 'Unknown',
                    browser: currentSession.browser || 'Unknown',
                    ip: currentSession.ip || 'Unknown',
                    location: currentSession.location || 'Unknown',
                    time: currentSession.loginTime || new Date(),
                    status: 'completed',
                  },
                ],
                $slice: -50,
              },
            },
          });
        }
      }

      // Check remaining sessions
      const updatedAdmin = await Admin.findById(decoded.id).select(
        'activeSessions'
      );

      const remainingSessions =
        updatedAdmin?.activeSessions?.length || 0;

      // No sessions left = offline
      if (remainingSessions === 0) {
        await Admin.findByIdAndUpdate(decoded.id, {
          $set: {
            isOnline: false,
            lastActive: new Date(),
          },
        });
      }

      // Activity Log
      await ActivityLog.create({
        admin: decoded.id,
        action: 'self_logout',
        target: decoded.id,
        targetModel: 'Admin',
        details: `Self logged out - Device: ${currentSession?.device || 'Unknown'} - Browser: ${currentSession?.browser || 'Unknown'}`,
        ip:
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          '',
        device: request.headers.get('user-agent') || '',
      });
    }

    // 5️⃣ Response with cookie cleared
    const response = NextResponse.json(
      {
        success: true,
        message: logoutAll
          ? `Logged out from all ${sessionsTerminated} session(s)`
          : 'Logged out successfully',
        data: {
          logoutAll,
          sessionsTerminated,
        },
      },
      { status: 200 }
    );

    // Clear auth cookie
    clearCookie(response);

    return response;
  } catch (error: unknown) {
    console.error('Logout Error:', error);

    // Even on error, clear cookie to ensure logout
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out',
      },
      { status: 200 }
    );
    clearCookie(response);
    return response;
  }
}

// ✅ Helper: Clear auth cookie
function clearCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}