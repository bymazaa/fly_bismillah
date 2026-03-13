// app/api/cron/cleanup-sessions/route.ts

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import ActivityLog from '@/models/ActivityLog';
import Admin from '@/models/Admin.model';

// ================================================================
// CONFIGURATION
// ================================================================

const CONFIG = {
  // Sessions older than this will be removed
  SESSION_MAX_AGE_DAYS: 7,

  // Login history older than this will be trimmed
  LOGIN_HISTORY_MAX_ENTRIES: 50,

  // Activity logs older than this will be deleted
  ACTIVITY_LOG_MAX_AGE_DAYS: 90,

  // Expired reset tokens older than this will be cleared
  EXPIRED_TOKEN_CLEANUP_HOURS: 24,

  // Cron secret for security
  CRON_SECRET: process.env.CRON_SECRET || '',
};

// ================================================================
// TYPES
// ================================================================

interface CleanupResult {
  expiredSessionsRemoved: number;
  staleOnlineFixed: number;
  expiredTokensCleared: number;
  oldActivityLogsDeleted: number;
  loginHistoryTrimmed: number;
  totalStaffProcessed: number;
  executionTimeMs: number;
}

// ================================================================
// GET /api/cron/cleanup-sessions
//
// Vercel Cron Job OR manual trigger by admin
//
// Security:
// - Vercel cron sends Authorization header automatically
// - Manual trigger needs CRON_SECRET in query param
// ================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1️⃣ Security: Verify cron secret
    const authHeader = request.headers.get('authorization');
    const querySecret = new URL(request.url).searchParams.get(
      'secret'
    );

    const isVercelCron =
      authHeader === `Bearer ${CONFIG.CRON_SECRET}`;
    const isManualTrigger =
      querySecret === CONFIG.CRON_SECRET;

    // Development mode এ secret check skip
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev && !isVercelCron && !isManualTrigger) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // ═══════════════════════════════════════
    // CLEANUP RESULTS TRACKER
    // ═══════════════════════════════════════

    const result: CleanupResult = {
      expiredSessionsRemoved: 0,
      staleOnlineFixed: 0,
      expiredTokensCleared: 0,
      oldActivityLogsDeleted: 0,
      loginHistoryTrimmed: 0,
      totalStaffProcessed: 0,
      executionTimeMs: 0,
    };

    // ═══════════════════════════════════════
    // 1. EXPIRED SESSIONS CLEANUP
    // ═══════════════════════════════════════

    const sessionCutoff = new Date();
    sessionCutoff.setDate(
      sessionCutoff.getDate() - CONFIG.SESSION_MAX_AGE_DAYS
    );

    // Find all staff with active sessions
    const staffWithSessions = await Admin.find({
      'activeSessions.0': { $exists: true },
    }).select('name activeSessions isOnline loginHistory');

    result.totalStaffProcessed = staffWithSessions.length;

    for (const staff of staffWithSessions) {
      const originalCount = staff.activeSessions?.length || 0;

      // Filter out expired sessions
      const validSessions = (staff.activeSessions || []).filter(
        (session) => {
          const lastActive = session.lastActive
            ? new Date(session.lastActive)
            : new Date(session.loginTime);
          return lastActive > sessionCutoff;
        }
      );

      const removedCount = originalCount - validSessions.length;

      if (removedCount > 0) {
        // Move expired sessions to login history
        const expiredSessions = (
          staff.activeSessions || []
        ).filter((session) => {
          const lastActive = session.lastActive
            ? new Date(session.lastActive)
            : new Date(session.loginTime);
          return lastActive <= sessionCutoff;
        });

        const historyEntries = expiredSessions.map((session) => ({
          device: session.device || 'Unknown',
          browser: session.browser || 'Unknown',
          ip: session.ip || 'Unknown',
          location: session.location || 'Unknown',
          time: session.loginTime || new Date(),
          status: 'completed' as const,
        }));

        // Update: remove expired sessions + add to history
        await Admin.findByIdAndUpdate(staff._id, {
          $set: {
            activeSessions: validSessions,
          },
          $push: {
            loginHistory: {
              $each: historyEntries,
              $slice: -CONFIG.LOGIN_HISTORY_MAX_ENTRIES,
            },
          },
        });

        result.expiredSessionsRemoved += removedCount;
      }
    }

    // ═══════════════════════════════════════
    // 2. FIX STALE ONLINE STATUS
    //    isOnline = true but no active sessions
    // ═══════════════════════════════════════

    const staleOnlineResult = await Admin.updateMany(
      {
        isOnline: true,
        $or: [
          { activeSessions: { $size: 0 } },
          { activeSessions: { $exists: false } },
        ],
      },
      {
        $set: {
          isOnline: false,
          lastActive: new Date(),
        },
      }
    );

    result.staleOnlineFixed = staleOnlineResult.modifiedCount;

    // ═══════════════════════════════════════
    // 3. CLEAR EXPIRED PASSWORD RESET TOKENS
    // ═══════════════════════════════════════

    const tokenCutoff = new Date();
    tokenCutoff.setHours(
      tokenCutoff.getHours() - CONFIG.EXPIRED_TOKEN_CLEANUP_HOURS
    );

    const expiredTokenResult = await Admin.updateMany(
      {
        resetPasswordExpire: { $lt: tokenCutoff },
        resetPasswordToken: { $ne: null },
      },
      {
        $set: {
          resetPasswordToken: null,
          resetPasswordExpire: null,
        },
      }
    );

    result.expiredTokensCleared = expiredTokenResult.modifiedCount;

    // ═══════════════════════════════════════
    // 4. DELETE OLD ACTIVITY LOGS
    // ═══════════════════════════════════════

    const activityLogCutoff = new Date();
    activityLogCutoff.setDate(
      activityLogCutoff.getDate() -
        CONFIG.ACTIVITY_LOG_MAX_AGE_DAYS
    );

    const oldLogsResult = await ActivityLog.deleteMany({
      createdAt: { $lt: activityLogCutoff },
    });

    result.oldActivityLogsDeleted = oldLogsResult.deletedCount;

    // ═══════════════════════════════════════
    // 5. TRIM LOGIN HISTORY
    //    Keep only last N entries per staff
    // ═══════════════════════════════════════

    const staffWithLargeHistory = await Admin.find({
      [`loginHistory.${CONFIG.LOGIN_HISTORY_MAX_ENTRIES}`]: {
        $exists: true,
      },
    }).select('_id loginHistory');

    for (const staff of staffWithLargeHistory) {
      const historyLength = staff.loginHistory?.length || 0;

      if (historyLength > CONFIG.LOGIN_HISTORY_MAX_ENTRIES) {
        // Keep only last N entries
        const trimmedHistory = (staff.loginHistory || [])
          .sort(
            (a, b) =>
              new Date(b.time).getTime() -
              new Date(a.time).getTime()
          )
          .slice(0, CONFIG.LOGIN_HISTORY_MAX_ENTRIES);

        await Admin.findByIdAndUpdate(staff._id, {
          $set: { loginHistory: trimmedHistory },
        });

        result.loginHistoryTrimmed++;
      }
    }

    // ═══════════════════════════════════════
    // 6. FIX STUCK LOGIN HISTORY STATUS
    //    loginHistory status "current" but no
    //    matching active session
    // ═══════════════════════════════════════

    await Admin.updateMany(
      {
        'loginHistory.status': 'current',
        activeSessions: { $size: 0 },
      },
      {
        $set: {
          'loginHistory.$[elem].status': 'completed',
        },
      },
      {
        arrayFilters: [{ 'elem.status': 'current' }],
      }
    );

    // ═══════════════════════════════════════
    // EXECUTION TIME
    // ═══════════════════════════════════════

    result.executionTimeMs = Date.now() - startTime;

    // ═══════════════════════════════════════
    // LOG & RESPONSE
    // ═══════════════════════════════════════

    console.log('═══════════════════════════════════════');
    console.log('🧹 SESSION CLEANUP COMPLETED');
    console.log(
      `   Expired Sessions Removed: ${result.expiredSessionsRemoved}`
    );
    console.log(
      `   Stale Online Fixed: ${result.staleOnlineFixed}`
    );
    console.log(
      `   Expired Tokens Cleared: ${result.expiredTokensCleared}`
    );
    console.log(
      `   Old Activity Logs Deleted: ${result.oldActivityLogsDeleted}`
    );
    console.log(
      `   Login History Trimmed: ${result.loginHistoryTrimmed}`
    );
    console.log(
      `   Staff Processed: ${result.totalStaffProcessed}`
    );
    console.log(
      `   Execution Time: ${result.executionTimeMs}ms`
    );
    console.log('═══════════════════════════════════════');

    return NextResponse.json(
      {
        success: true,
        message: 'Cleanup completed successfully',
        data: result,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const executionTime = Date.now() - startTime;
    console.error('Cleanup Cron Error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        message: 'Cleanup failed',
        error: message,
        executionTimeMs: executionTime,
      },
      { status: 500 }
    );
  }
}