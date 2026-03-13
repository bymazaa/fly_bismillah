// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';
import { COOKIE_NAME } from './app/api/controller/constant';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

interface RouteConfig {
  path: string;
  roles?: string[];
}

// Protected PAGE routes (UI/page level access control)
const PROTECTED_PAGE_ROUTES: RouteConfig[] = [
  { path: '/admin', roles: ['admin', 'editor', 'viewer'] },
  { path: '/dashboard', roles: ['admin', 'editor', 'viewer'] },
  { path: '/profile', roles: ['admin', 'editor', 'viewer'] },
];

// Protected API routes — sorted longest first to ensure specific paths match before catch-alls
const PROTECTED_API_ROUTES: RouteConfig[] = [
  // ── Staff CRUD (admin only) ──
  { path: '/api/admin/staff/create', roles: ['admin'] },
  { path: '/api/admin/staff/list', roles: ['admin'] },

  // ── Staff [id] operations ──
  // NOTE: Longer paths MUST come before shorter ones (handled by findMatchingRoute sort, but kept ordered here for clarity)
  { path: '/api/admin/staff/logout-all', roles: ['admin', 'editor', 'viewer'] },
  { path: '/api/admin/staff/sessions', roles: ['admin', 'editor', 'viewer'] },
  { path: '/api/admin/staff/unblock', roles: ['admin'] },
  { path: '/api/admin/staff/delete', roles: ['admin'] },
  { path: '/api/admin/staff/block', roles: ['admin'] },
  { path: '/api/admin/staff/update', roles: ['admin', 'editor', 'viewer'] },
  { path: '/api/admin/staff', roles: ['admin', 'editor', 'viewer'] }, // catch-all for staff — must come LAST

  // ── Profile (all authenticated roles) ──
  { path: '/api/auth/profile/update', roles: ['admin', 'editor', 'viewer'] },
  { path: '/api/auth/profile', roles: ['admin', 'editor', 'viewer'] },

  // ── Password change (all authenticated roles) ──
  { path: '/api/auth/change-password', roles: ['admin', 'editor', 'viewer'] },

  // ── Logout (all authenticated roles) ──
  { path: '/api/auth/logout', roles: ['admin', 'editor', 'viewer'] },

  // ── Session management (admin only) ──
  { path: '/api/admin/sessions', roles: ['admin'] },

  // ── Activity log (admin sees all, others see own — enforced in controller) ──
  { path: '/api/admin/activity-log', roles: ['admin', 'editor', 'viewer'] },

  // ── Dashboard stats (all authenticated roles) ──
  { path: '/api/dashboard/stats', roles: ['admin', 'editor', 'viewer'] },

  // ── Duffel flight search & booking (all authenticated roles) ──
  { path: '/api/duffel', roles: ['admin', 'editor', 'viewer'] },
  { path: '/api/flights', roles: ['admin', 'editor', 'viewer'] },

  // ── Payments (admin and editor only — viewers cannot initiate payments) ──
  { path: '/api/payment', roles: ['admin', 'editor'] },
  { path: '/api/stripe', roles: ['admin', 'editor'] },
];

// Public API routes — no authentication required
const PUBLIC_API_ROUTES: string[] = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify',
  '/api/public',
  '/api/cron',
  '/api/webhooks/stripe',  // Stripe webhook must be publicly accessible (signature verified inside handler)
  '/api/webhooks/duffel',  // Duffel webhook must be publicly accessible (signature verified inside handler)
];

// Auth pages — redirect to dashboard if user is already logged in
const AUTH_ROUTES: string[] = [
  '/access',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

// Redirect destination after successful login
const DEFAULT_REDIRECT = '/admin';

// Warn the client to refresh the token if it expires within this window (seconds)
const TOKEN_EXPIRY_WARNING = 5 * 60; // 5 minutes

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface AuthPayload extends JWTPayload {
  userId?: string;
  id?: string;
  role: string;
  email: string;
  sessionId?: string;
}

interface AuthResult {
  isAuthenticated: boolean;
  payload: AuthPayload | null;
  isExpiringSoon: boolean;
  error: 'TOKEN_EXPIRED' | 'INVALID_SIGNATURE' | 'INVALID_TOKEN' | null;
}

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

/**
 * Verifies the JWT token using the secret from env.
 * Returns structured auth result including expiry warning and error type.
 */
async function verifyToken(token: string): Promise<AuthResult> {
  const result: AuthResult = {
    isAuthenticated: false,
    payload: null,
    isExpiringSoon: false,
    error: null,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Middleware] JWT_SECRET is not set in environment variables');
    return result;
  }

  try {
    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);

    result.isAuthenticated = true;
    result.payload = payload as AuthPayload;

    // Check if token is expiring within the warning window
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      result.isExpiringSoon = payload.exp - now < TOKEN_EXPIRY_WARNING;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        result.error = 'TOKEN_EXPIRED';
      } else if (error.message.includes('signature')) {
        result.error = 'INVALID_SIGNATURE';
      } else {
        result.error = 'INVALID_TOKEN';
      }
    }
  }

  return result;
}

/**
 * Finds the most specific matching route config for a given pathname.
 * Sorts by path length descending so longer (more specific) paths win.
 */
function findMatchingRoute(
  pathname: string,
  routes: RouteConfig[]
): RouteConfig | undefined {
  const sorted = [...routes].sort((a, b) => b.path.length - a.path.length);
  return sorted.find((route) => pathname.startsWith(route.path));
}

/**
 * Returns true if the pathname matches any public API route.
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Returns true if the user's role is included in the allowed roles list.
 * If no roles are defined on the route, access is open to all authenticated users.
 */
function hasRequiredRole(
  userRole: string | undefined,
  allowedRoles?: string[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Applies a standard set of security headers to a response.
 * Includes CSP, HSTS, XSS protection, and frame options.
 */
function setSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http: https://pics.avs.io https://*.stripe.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com https://m.stripe.network https://q.stripe.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
}

/**
 * Clears the auth cookie from the response (used on expired/invalid token).
 */
function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Creates a redirect response to the given URL with optional query params.
 * Security headers are applied automatically.
 */
function createRedirect(
  url: string,
  req: NextRequest,
  params?: Record<string, string>
): NextResponse {
  const redirectUrl = new URL(url, req.url);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      redirectUrl.searchParams.set(key, value);
    });
  }
  const response = NextResponse.redirect(redirectUrl);
  setSecurityHeaders(response);
  return response;
}

/**
 * Creates a JSON error response for API routes.
 * Defaults to 401 Unauthorized.
 */
function createApiError(
  message: string,
  statusCode: number = 401
): NextResponse {
  const response = NextResponse.json(
    { success: false, message },
    { status: statusCode }
  );
  setSecurityHeaders(response);
  return response;
}

// ──────────────────────────────────────────────
// Main Middleware
// ──────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith('/api');

  // Skip middleware entirely for Next.js internals and static assets
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow public API routes through without any auth check
  if (isApiRoute && isPublicApiRoute(pathname)) {
    const response = NextResponse.next();
    setSecurityHeaders(response);
    return response;
  }

  // Attempt to verify the JWT from the cookie
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const auth: AuthResult = token
    ? await verifyToken(token)
    : {
        isAuthenticated: false,
        payload: null,
        isExpiringSoon: false,
        error: null,
      };

  // ═══════════════════════════════════════════
  // API ROUTE PROTECTION
  // ═══════════════════════════════════════════
  if (isApiRoute) {
    const matchedApiRoute = findMatchingRoute(pathname, PROTECTED_API_ROUTES);

    if (matchedApiRoute) {
      // Reject unauthenticated requests with a descriptive error
      if (!auth.isAuthenticated || !auth.payload) {
        const errorMsg =
          auth.error === 'TOKEN_EXPIRED'
            ? 'Session expired — please login again'
            : 'Unauthorized — please login';

        const response = createApiError(errorMsg, 401);
        if (token) clearAuthCookie(response); // Remove invalid/expired cookie
        return response;
      }

      // Reject requests where the user's role is not permitted on this route
      if (!hasRequiredRole(auth.payload.role, matchedApiRoute.roles)) {
        console.warn(
          `[Middleware] API 403: ${auth.payload.email} (${auth.payload.role}) → ${pathname}`
        );
        return createApiError('Forbidden — you do not have permission', 403);
      }

      // Forward verified auth info to the route handler via request headers
      const adminId = auth.payload.id || auth.payload.userId || '';

      const response = NextResponse.next({
        request: {
          headers: new Headers({
            ...Object.fromEntries(req.headers),
            'x-admin-id': adminId,
            'x-admin-role': auth.payload.role || '',
            'x-admin-email': auth.payload.email || '',
            'x-session-id': auth.payload.sessionId || '',
          }),
        },
      });

      setSecurityHeaders(response);

      // Signal the client to refresh their token before it expires
      if (auth.isExpiringSoon) {
        response.headers.set('x-token-expiring-soon', 'true');
      }

      return response;
    }

    // Route not in the protected list — allow through with security headers
    const response = NextResponse.next();
    setSecurityHeaders(response);
    return response;
  }

  // ═══════════════════════════════════════════
  // PAGE ROUTE PROTECTION
  // ═══════════════════════════════════════════
  const matchedPageRoute = findMatchingRoute(pathname, PROTECTED_PAGE_ROUTES);

  if (matchedPageRoute) {
    // Unauthenticated users are redirected to the login page
    if (!auth.isAuthenticated) {
      const response = createRedirect('/access', req, {
        redirect: pathname, // Preserve intended destination for post-login redirect
        ...(auth.error === 'TOKEN_EXPIRED' && { reason: 'session_expired' }),
      });
      if (token) clearAuthCookie(response); // Clean up invalid/expired cookie
      return response;
    }

    // Authenticated user does not have the required role — send to unauthorized page
    if (!hasRequiredRole(auth.payload?.role, matchedPageRoute.roles)) {
      console.warn(
        `[Middleware] Page 403: ${auth.payload?.email} (${auth.payload?.role}) → ${pathname}`
      );
      return createRedirect('/unauthorized', req);
    }
  }

  // ═══════════════════════════════════════════
  // AUTH ROUTE GUARD (redirect logged-in users away from login/signup pages)
  // ═══════════════════════════════════════════
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute && auth.isAuthenticated) {
    // Honour the redirect param if present, otherwise go to default destination
    const redirectTo =
      req.nextUrl.searchParams.get('redirect') || DEFAULT_REDIRECT;
    return createRedirect(redirectTo, req);
  }

  // ═══════════════════════════════════════════
  // ALLOW REQUEST — attach user context headers if authenticated
  // ═══════════════════════════════════════════
  const response = NextResponse.next();
  setSecurityHeaders(response);

  if (auth.isAuthenticated && auth.payload) {
    response.headers.set(
      'x-user-id',
      auth.payload.id || auth.payload.userId || ''
    );
    response.headers.set('x-user-role', auth.payload.role || '');
    response.headers.set('x-user-email', auth.payload.email || '');
    if (auth.payload.sessionId) {
      response.headers.set('x-session-id', auth.payload.sessionId);
    }
  }

  if (auth.isExpiringSoon) {
    response.headers.set('x-token-expiring-soon', 'true');
  }

  return response;
}

// ──────────────────────────────────────────────
// Matcher — exclude static assets and Next.js internals
// ──────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};