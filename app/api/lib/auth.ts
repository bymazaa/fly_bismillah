// lib/isAuthenticated.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/connection/db';
import Admin, { AdminDocument } from '@/models/Admin.model';
import { COOKIE_NAME, JWT_SECRET } from '@/app/api/controller/constant';
import { verifyToken } from '@/lib/auth';

// ==========================================
// TYPES
// ==========================================

interface JWTPayload {
  id: string;
  sessionId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

interface AuthSuccess {
  success: true;
  response: null;
  user: AdminDocument;
  sessionId: string | null;
}

interface AuthFailure {
  success: false;
  response: NextResponse;
  user: null;
  sessionId: null;
}

type AuthResult = AuthSuccess | AuthFailure;

// Permission module keys — matches Admin model exactly
type PermissionModule =
  | 'dashboard'
  | 'booking'
  | 'transactions'
  | 'customers'
  | 'destinations'
  | 'packages'
  | 'offers'
  | 'support'
  | 'settings';

type PermissionLevel = 'full' | 'edit' | 'view' | 'none';

// Permission hierarchy — higher number = more access
const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
  full: 3,
};

// Fields to select for auth (no password, no reset tokens)
const AUTH_SELECT_FIELDS = [
  'name',
  'email',
  'role',
  'status',
  'isVerified',
  'permissions',
  'phone',
  'avatar',
  'adminId',
  'isOnline',
  'lastLogin',
  'lastActive',
  'isTwoFactorEnabled',
  'activeSessions',
  'failedLoginAttempts',
  'lockUntil',
  'blockedAt',
  'blockedBy',
  'blockReason',
  'createdBy',
].join(' ');

// ==========================================
// HELPER — Consistent error responses
// ==========================================

function authError(message: string, status: number): AuthFailure {
  return {
    success: false,
    user: null,
    sessionId: null,
    response: NextResponse.json(
      {
        success: false,
        message,
        ...(status === 401 && { code: 'SESSION_EXPIRED' }),
        ...(status === 403 && { code: 'ACCESS_DENIED' }),
        ...(status === 423 && { code: 'ACCOUNT_LOCKED' }),
      },
      { status }
    ),
  };
}

// ==========================================
// 1. isAuthenticated — Core auth check
//    ✅ Token → JWT verify → DB user
//    ✅ Status (active / blocked / suspended)
//    ✅ Lock check (brute force)
//    ✅ Session validation (force logout)
//    ✅ Auto-update lastActive + isOnline
// ==========================================

export async function isAuthenticated(): Promise<AuthResult> {
  try {
    // ─── Step 1: Extract token ───
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return authError('Unauthorized: Please login first', 401);
    }

    // ─── Step 2: Verify JWT ───
    const secret = new TextEncoder().encode(JWT_SECRET);
    let payload: JWTPayload;

    try {
      const result = await jwtVerify(token, secret);
      payload = result.payload as unknown as JWTPayload;
    } catch {
      return authError('Session expired. Please login again.', 401);
    }

    if (!payload?.id) {
      return authError('Invalid token', 401);
    }

    // ─── Step 3: Fetch admin from DB ───
    await dbConnect();
    const user = await Admin.findById(payload.id).select(AUTH_SELECT_FIELDS);

    if (!user) {
      return authError('Account not found or deleted', 403);
    }

    // ─── Step 4: Verification check ───
    if (!user.isVerified) {
      return authError('Account not verified. Contact administrator.', 403);
    }

    // ─── Step 5: Status checks (blocked / suspended) ───
    if (user.status === 'blocked') {
      const reason = user.blockReason ? `: ${user.blockReason}` : '';
      return authError(`Account blocked${reason}. Contact administrator.`, 403);
    }

    if (user.status === 'suspended') {
      return authError('Account suspended. Contact administrator.', 403);
    }

    if (user.status !== 'active') {
      return authError('Account is not active', 403);
    }

    // ─── Step 6: Lock check (brute force protection) ───
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      const remainingMs = new Date(user.lockUntil).getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return authError(
        `Account temporarily locked. Try again in ${remainingMin} minute(s).`,
        423
      );
    }

    // ─── Step 7: Role validation ───
    const validRoles = ['admin', 'editor', 'viewer'];
    if (!user.role || !validRoles.includes(user.role)) {
      return authError('Forbidden: Invalid role assigned', 403);
    }

    // ─── Step 8: Session validation (force logout detection) ───
    const sessionId = payload.sessionId || null;

    if (sessionId && user.activeSessions && user.activeSessions.length > 0) {
      const sessionExists = user.activeSessions.some(
        (s) => s.sessionId === sessionId
      );

      if (!sessionExists) {
        // Session was removed = force logged out by admin
        return authError(
          'Session terminated. You have been logged out.',
          401
        );
      }

      // ✅ Update session lastActive + global lastActive + online status
      await Admin.updateOne(
        {
          _id: user._id,
          'activeSessions.sessionId': sessionId,
        },
        {
          $set: {
            'activeSessions.$.lastActive': new Date(),
            lastActive: new Date(),
            isOnline: true,
          },
        }
      );
    } else {
      // No session tracking — just update activity
      await Admin.updateOne(
        { _id: user._id },
        {
          $set: {
            lastActive: new Date(),
            isOnline: true,
          },
        }
      );
    }

    // ─── Step 9: Clear lock if expired ───
    if (
      user.lockUntil &&
      new Date(user.lockUntil) <= new Date() &&
      user.failedLoginAttempts > 0
    ) {
      await Admin.updateOne(
        { _id: user._id },
        {
          $set: {
            failedLoginAttempts: 0,
            lockUntil: null,
          },
        }
      );
    }

    return {
      success: true,
      response: null,
      user,
      sessionId,
    };
  } catch (error) {
    console.error('[isAuthenticated] Error:', error);
    return authError('Authentication failed. Please login again.', 401);
  }
}

// ==========================================
// 2. isAdmin — Admin-only actions
//    (create staff, block/unblock, delete, settings)
// ==========================================

export async function isAdmin(): Promise<AuthResult> {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  if (auth.user.role !== 'admin') {
    return authError(
      'Forbidden: Only Admin can perform this action.',
      403
    );
  }

  return auth;
}

// ==========================================
// 3. isAdminOrEditor — Admin + Editor access
//    (edit packages, destinations, offers, bookings)
// ==========================================

export async function isAdminOrEditor(): Promise<AuthResult> {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  if (auth.user.role !== 'admin' && auth.user.role !== 'editor') {
    return authError(
      'Forbidden: Editors and Admins only.',
      403
    );
  }

  return auth;
}

// ==========================================
// 4. hasPermission — Module-level permission check
//    Maps directly to Admin model permission fields:
//    dashboard, booking, transactions, customers,
//    destinations, packages, offers, support, settings
//
//    Usage:
//    const auth = await hasPermission('booking', 'edit');
//    const auth = await hasPermission('settings', 'full');
// ==========================================

export async function hasPermission(
  module: PermissionModule,
  requiredLevel: PermissionLevel = 'view'
): Promise<AuthResult> {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  // ✅ Admin role = full access to everything, skip check
  if (auth.user.role === 'admin') return auth;

  // Get user's actual permission for this module
  const userLevel: PermissionLevel =
    (auth.user.permissions?.[module] as PermissionLevel) || 'none';

  const userRank = PERMISSION_HIERARCHY[userLevel] ?? 0;
  const requiredRank = PERMISSION_HIERARCHY[requiredLevel] ?? 0;

  if (userRank < requiredRank) {
    return authError(
      `Forbidden: You need "${requiredLevel}" permission for "${module}". ` +
      `Current: "${userLevel}".`,
      403
    );
  }

  return auth;
}

// ==========================================
// 5. hasAnyPermission — Check multiple modules
//    Returns true if user has required level on ANY module
//
//    Usage:
//    const auth = await hasAnyPermission(['booking', 'packages'], 'edit');
// ==========================================

export async function hasAnyPermission(
  modules: PermissionModule[],
  requiredLevel: PermissionLevel = 'view'
): Promise<AuthResult> {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  if (auth.user.role === 'admin') return auth;

  const requiredRank = PERMISSION_HIERARCHY[requiredLevel] ?? 0;

  const hasAccess = modules.some((mod) => {
    const userLevel: PermissionLevel =
      (auth.user.permissions?.[mod] as PermissionLevel) || 'none';
    return (PERMISSION_HIERARCHY[userLevel] ?? 0) >= requiredRank;
  });

  if (!hasAccess) {
    return authError(
      `Forbidden: You need "${requiredLevel}" access to at least one of: ${modules.join(', ')}`,
      403
    );
  }

  return auth;
}

// ==========================================
// 6. getCurrentAdminWithSession
//    Full profile + session data (for profile/settings pages)
//    Includes password field for password change
// ==========================================

export async function getCurrentAdminWithSession(): Promise<{
  admin: AdminDocument | null;
  sessionId: string | null;
  error: string | null;
  errorCode?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return {
        admin: null,
        sessionId: null,
        error: 'No token found',
        errorCode: 'NO_TOKEN',
      };
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded?.id) {
      return {
        admin: null,
        sessionId: null,
        error: 'Invalid token',
        errorCode: 'INVALID_TOKEN',
      };
    }

    await dbConnect();

    // Select password for profile/password-change endpoints
    const admin = await Admin.findById(decoded.id).select('+password');

    if (!admin) {
      return {
        admin: null,
        sessionId: null,
        error: 'Admin not found',
        errorCode: 'NOT_FOUND',
      };
    }

    // ─── Status checks ───
    if (admin.status === 'blocked') {
      return {
        admin: null,
        sessionId: null,
        error: `Account blocked${admin.blockReason ? `: ${admin.blockReason}` : ''}`,
        errorCode: 'BLOCKED',
      };
    }

    if (admin.status === 'suspended') {
      return {
        admin: null,
        sessionId: null,
        error: 'Account suspended',
        errorCode: 'SUSPENDED',
      };
    }

    // ─── Lock check ───
    if (admin.lockUntil && new Date(admin.lockUntil) > new Date()) {
      return {
        admin: null,
        sessionId: null,
        error: 'Account temporarily locked',
        errorCode: 'LOCKED',
      };
    }

    // ─── Session validation ───
    const sessionId = decoded.sessionId || null;

    if (sessionId) {
      const sessionExists = admin.activeSessions?.some(
        (s) => s.sessionId === sessionId
      );

      if (!sessionExists) {
        return {
          admin: null,
          sessionId,
          error: 'Session expired or force logged out',
          errorCode: 'SESSION_TERMINATED',
        };
      }

      // ✅ Update session + global activity
      await Admin.updateOne(
        {
          _id: admin._id,
          'activeSessions.sessionId': sessionId,
        },
        {
          $set: {
            'activeSessions.$.lastActive': new Date(),
            lastActive: new Date(),
            isOnline: true,
          },
        }
      );
    } else {
      await Admin.updateOne(
        { _id: admin._id },
        { $set: { lastActive: new Date(), isOnline: true } }
      );
    }

    return { admin, sessionId, error: null };
  } catch (error) {
    console.error('[getCurrentAdminWithSession] Error:', error);
    return {
      admin: null,
      sessionId: null,
      error: 'Authentication error',
      errorCode: 'AUTH_ERROR',
    };
  }
}

// ==========================================
// 7. UTILITY — Quick permission check helper
//    (No auth, just checks a user object)
//
//    Usage in API routes after auth:
//    if (!canAccess(user, 'booking', 'edit')) { ... }
// ==========================================

export function canAccess(
  user: AdminDocument,
  module: PermissionModule,
  requiredLevel: PermissionLevel = 'view'
): boolean {
  // Admin bypass
  if (user.role === 'admin') return true;

  const userLevel: PermissionLevel =
    (user.permissions?.[module] as PermissionLevel) || 'none';

  return (
    (PERMISSION_HIERARCHY[userLevel] ?? 0) >=
    (PERMISSION_HIERARCHY[requiredLevel] ?? 0)
  );
}

// ==========================================
// 8. UTILITY — Get all accessible modules for a user
//    Useful for sidebar/navigation filtering
// ==========================================

export function getAccessibleModules(
  user: AdminDocument,
  requiredLevel: PermissionLevel = 'view'
): PermissionModule[] {
  if (user.role === 'admin') {
    return [
      'dashboard', 'booking', 'transactions', 'customers',
      'destinations', 'packages', 'offers', 'support', 'settings',
    ];
  }

  const modules: PermissionModule[] = [];
  const allModules: PermissionModule[] = [
    'dashboard', 'booking', 'transactions', 'customers',
    'destinations', 'packages', 'offers', 'support', 'settings',
  ];

  const requiredRank = PERMISSION_HIERARCHY[requiredLevel] ?? 0;

  for (const mod of allModules) {
    const userLevel: PermissionLevel =
      (user.permissions?.[mod] as PermissionLevel) || 'none';

    if ((PERMISSION_HIERARCHY[userLevel] ?? 0) >= requiredRank) {
      modules.push(mod);
    }
  }

  return modules;
}



// utils/ip-location.ts

interface IPLocationResponse {
  city?: string;
  regionName?: string; // Division/State
  country?: string;
  status: 'success' | 'fail';
  message?: string;
}

/**
 * IP address থেকে সুন্দর ফরম্যাটে লোকেশন স্ট্রিং রিটার্ন করে।
 * ফরম্যাট: City, Division, Country
 */
export async function getIPLocation(ip: string): Promise<string> {
  // Localhost বা IPv6 loopback এর জন্য চেক
  if (ip === '127.0.0.1' || ip === '::1' || !ip) {
    return 'Local Development Area';
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`);
    const data: IPLocationResponse = await response.json();

    if (data.status === 'fail') {
      return 'Unknown Location';
    }

    // সুন্দর ফরম্যাটে স্ট্রিং তৈরি
    const locationParts = [
      data.city,
      data.regionName,
      data.country
    ].filter(Boolean); // যদি কোনো ফিল্ড না থাকে তবে সেটা বাদ দিয়ে দিবে

    return locationParts.join(', ');
  } catch (error) {
    console.error('Error fetching IP location:', error);
    return 'Unknown Location';
  }
}


// lib/logCleanup.ts
import ActivityLog from '@/models/ActivityLog';

/**
 * Options:
 * - maxKeep: per-admin upper bound (default 300). When total exceeds this, cleanup runs.
 * - keepRecent: how many latest logs to always retain (default 10). Must be <= maxKeep.
 * - dryRun: only counts/returns what would happen, performs no deletion.
 */
interface CleanupOptions {
  maxKeep?: number; // default: 300 — login/failed_login-friendly safe limit
  keepRecent?: number; // default: 10 — keep the most recent logs intact
  dryRun?: boolean; // true হলে শুধু count/plan দেখাবে, ডিলিট করবে না
}

/**
 * Per-admin activity log cleanup:
 * - If total > maxKeep, it deletes the "middle" oldest logs (i.e., oldest first),
 *   while ensuring *at least* `keepRecent` most recent logs are preserved.
 * - If keepRecent > maxKeep, maxKeep is used as keepRecent implicitly (safe fallback).
 * - Returns a clear result object for logging/monitoring.
 */
export async function cleanupActivityLogForAdmin(adminId: string, options: CleanupOptions = {}) {
  const maxKeep = options.maxKeep ?? 300;
  let keepRecent = options.keepRecent ?? 10;
  const dryRun = options.dryRun ?? false;

  // Defensive: ensure keepRecent never exceeds maxKeep to avoid inconsistent behavior
  if (keepRecent > maxKeep) keepRecent = maxKeep;

  // 1) Count total logs for this admin
  const total = await ActivityLog.countDocuments({ admin: adminId });
  if (total <= maxKeep) {
    // No cleanup needed; still report current state (useful for monitoring)
    return { deleted: 0, kept: total, maxKeep, keepRecent, remaining: total };
  }

  // 2) Calculate how many to delete such that at least keepRecent remain
  // Meaning: delete only (total - maxKeep) entries from the oldest side, but
  // ensure the last `keepRecent` items are untouched (by limiting deletion to `excess` items
  // but relying on ascending sort + limit, and by keeping recent logs intact).
  const excess = total - maxKeep;
  // If after enforcing maxKeep we still have fewer than keepRecent, that's not our case,
  // because total > maxKeep and keepRecent <= maxKeep; excess will be sufficient to protect keepRecent
  // in the way we query (oldest first, limit excess).

  // 3) Fetch the oldest logs (up to excess) so we can delete them deterministically
  // We sort ascending (oldest first) and limit to how many can be safely removed.
  const oldLogs = await ActivityLog.find({ admin: adminId })
    .sort({ createdAt: 1 }) // oldest first
    .limit(excess) // only the removable portion
    .select('_id createdAt');

  const idsToDelete = oldLogs.map(doc => doc._id);

  // 4) Execute deletion unless dry-run
  if (!dryRun && idsToDelete.length) {
    const res = await ActivityLog.deleteMany({ _id: { $in: idsToDelete } });
    const deletedCount = res.deletedCount ?? idsToDelete.length;
    return {
      deleted: deletedCount,
      kept: total - deletedCount, // effectively maxKeep (or remaining based on operation)
      maxKeep,
      keepRecent,
      remaining: total - deletedCount,
    };
  }

  // Dry-run / nothing to delete
  return {
    deleted: 0,
    dryRun: true,
    wouldDelete: idsToDelete.length,
    kept: total, // unchanged in dry-run
    maxKeep,
    keepRecent,
    remaining: total,
  };
}