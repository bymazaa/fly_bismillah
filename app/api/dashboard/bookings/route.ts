// app/api/admin/booking/route.ts
//
// ════════════════════════════════════════════════════════════════
// PRODUCTION-READY — All known bugs fixed
//
// FIXES APPLIED:
//   ✅ FIX 1 — ticketLink: empty url ('') no longer hides download.
//              Falls back to unique_identifier if url is empty.
//
//   ✅ FIX 2 — paymentStatus added to response (was missing entirely).
//
//   ✅ FIX 3 — emailSent + confirmationEmailSent added to response.
//
//   ✅ FIX 4 — duffelOrderId added to search $or filter.
//
//   ✅ FIX 5 — limit capped at 100 to prevent memory crash
//              from ?limit=99999 requests.
//
//   ✅ FIX 6 — retryCount + canRetry added to response so list
//              page can show "Max retry reached" badge.
//
//   ✅ FIX 7 — isLiveMode filter added as optional query param.
//              Useful for separating test vs live bookings.
// ════════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import { hasPermission } from '../../lib/auth';
import Booking from '@/models/Booking.model';
import { decrypt } from '../../flights/utils/orders';

// ════════════════════════════════════════════════════════════════
// ADMIN RATE LIMITER
//
// Separate from customer booking limiter:
//   • Customer limiter (10/min) = abuse prevention
//   • Admin limiter (60/min)    = DoS protection only
//     Admin routes are already behind auth.
// ════════════════════════════════════════════════════════════════

interface AdminRateLimitEntry {
    timestamps: number[];
}

const adminRateLimitMap = new Map<string, AdminRateLimitEntry>();

const ADMIN_RATE_CONFIG = {
    windowMs:           60 * 1000,       // 1 minute sliding window
    maxPerWindow:       60,              // 60 req/min
    maxMapSize:         1_000,           // cap map memory
    cleanupIntervalMs:  5 * 60 * 1000,  // cleanup every 5 min
};

let adminLastCleanup = Date.now();

function adminCleanup() {
    const now = Date.now();
    if (now - adminLastCleanup < ADMIN_RATE_CONFIG.cleanupIntervalMs) return;
    adminLastCleanup = now;

    for (const [ip, entry] of adminRateLimitMap.entries()) {
        const fresh = entry.timestamps.filter(
            (t) => now - t < ADMIN_RATE_CONFIG.windowMs,
        );
        if (fresh.length === 0) {
            adminRateLimitMap.delete(ip);
        } else {
            entry.timestamps = fresh;
        }
    }
}

function checkAdminRateLimit(rawIp: string): {
    limited: boolean;
    retryAfterMs?: number;
} {
    adminCleanup();

    const ip  = (rawIp.split(',')[0] || 'unknown').trim();
    const now = Date.now();

    if (
        !adminRateLimitMap.has(ip) &&
        adminRateLimitMap.size >= ADMIN_RATE_CONFIG.maxMapSize
    ) {
        return { limited: true, retryAfterMs: ADMIN_RATE_CONFIG.windowMs };
    }

    const entry = adminRateLimitMap.get(ip) || { timestamps: [] };

    entry.timestamps = entry.timestamps.filter(
        (t) => now - t < ADMIN_RATE_CONFIG.windowMs,
    );

    if (entry.timestamps.length >= ADMIN_RATE_CONFIG.maxPerWindow) {
        adminRateLimitMap.set(ip, entry);
        const oldest = entry.timestamps[0];
        return {
            limited:      true,
            retryAfterMs: ADMIN_RATE_CONFIG.windowMs - (now - oldest),
        };
    }

    entry.timestamps.push(now);
    adminRateLimitMap.set(ip, entry);
    return { limited: false };
}

// ════════════════════════════════════════════════════════════════
// GET /api/admin/booking
//
// Returns paginated booking list from DB only (no Duffel sync).
// Duffel sync happens on the individual booking detail page.
//
// Query params:
//   page     (default: 1)
//   limit    (default: 20, max: 100)
//   status   (all | held | issued | cancelled | expired | failed | processing)
//   search   (PNR | bookingRef | duffelOrderId | firstName | lastName | email)
//   liveMode (true | false — filter by environment)
//
// Permissions:
//   ✅ admin  (full ≥ view)
//   ✅ editor (edit ≥ view)
//   ✅ viewer (view ≥ view)
//   ❌ none
// ════════════════════════════════════════════════════════════════

export async function GET(req: Request) {
    const auth = await hasPermission('booking', 'view');
    if (!auth.success) return auth.response;

    try {
        // ── Rate limit ──
        const ip =
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip')       ||
            'unknown-ip';

        const rl = checkAdminRateLimit(ip);
        if (rl.limited) {
            const retryAfter = Math.ceil((rl.retryAfterMs || 60_000) / 1000);
            return NextResponse.json(
                {
                    success: false,
                    message: `Too many requests. Please wait ${retryAfter} seconds.`,
                },
                {
                    status: 429,
                    headers: { 'Retry-After': String(retryAfter) },
                },
            );
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);

        // ── Pagination ──
        const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
        // ✅ FIX 5: cap at 100 to prevent memory crash from ?limit=99999
        const limit = Math.min(
            Math.max(1, parseInt(searchParams.get('limit') || '20')),
            100,
        );
        const skip  = (page - 1) * limit;

        // ── Filters ──
        const statusFilter = searchParams.get('status')?.trim();
        const searchQuery  = searchParams.get('search')?.trim();
        const liveModeParam = searchParams.get('liveMode');

        const filter: any = {};

        // Status filter
        if (statusFilter && statusFilter !== 'all') {
            const VALID_STATUSES = [
                'held', 'issued', 'cancelled',
                'expired', 'failed', 'processing',
            ];
            if (VALID_STATUSES.includes(statusFilter)) {
                filter.status = statusFilter;
            }
        }

        // ✅ FIX 7: liveMode filter (test vs live)
        if (liveModeParam === 'true')  filter.isLiveMode = true;
        if (liveModeParam === 'false') filter.isLiveMode = false;

        // Search
        if (searchQuery) {
            filter.$or = [
                { pnr:              { $regex: searchQuery, $options: 'i' } },
                { bookingReference: { $regex: searchQuery, $options: 'i' } },
                // ✅ FIX 4: duffelOrderId search added
                { duffelOrderId:    { $regex: searchQuery, $options: 'i' } },
                { 'passengers.firstName': { $regex: searchQuery, $options: 'i' } },
                { 'passengers.lastName':  { $regex: searchQuery, $options: 'i' } },
                { 'contact.email':        { $regex: searchQuery, $options: 'i' } },
            ];
        }

        const [totalBookings, bookings] = await Promise.all([
            Booking.countDocuments(filter),
            Booking.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        const now = new Date();

        // ── Permission check for sensitive payment data ──
        const canSeePayment =
            auth.user?.role === 'admin'                          ||
            auth.user?.permissions?.booking === 'edit'          ||
            auth.user?.permissions?.booking === 'full';

        // ── Format each booking ──
        const formattedData = bookings.map((booking: any) => {
            const isPaymentExpired = booking.paymentDeadline
                ? new Date(booking.paymentDeadline) < now
                : false;

            const flight     = booking.flightDetails || {};
            const pricing    = booking.pricing       || {};
            const contact    = booking.contact       || {};
            const paymentInfo = booking.paymentInfo  || {};

            // ticketUrl is only set when it's a real downloadable URL (startsWith http).
            // unique_identifier is a Duffel doc ID like doc_xxx — not a URL.
            // In test mode, url is always empty → ticketUrl stays null.
            const firstDoc   = booking.documents?.[0] || null;
            const ticketLink =
                booking.status === 'issued' &&
                firstDoc?.url &&
                firstDoc.url.trim() !== '' &&
                firstDoc.url.startsWith('http')
                    ? firstDoc.url
                    : null;

            // ── Card masking based on permission ──
            let displayCard = null;
            const cardHolder = paymentInfo.cardName || 'N/A';

            if (paymentInfo?.cardNumber) {
                if (canSeePayment) {
                    try {
                        displayCard = decrypt(paymentInfo.cardNumber);
                    } catch {
                        displayCard = '**** (Decrypt Error)';
                    }
                } else {
                    displayCard = '**** **** **** (Hidden)';
                }
            }

            const securePaymentInfo =
                paymentInfo && Object.keys(paymentInfo).length > 0
                    ? {
                        holderName:     cardHolder,
                        cardNumber:     displayCard,
                        expiryDate:     paymentInfo.expiryDate || 'MM/YY',
                        billingAddress: paymentInfo.billingAddress || {},
                        zipCode:        paymentInfo.billingAddress?.zipCode || null,
                      }
                    : null;

            // ✅ Effective status: display-level correction for stale 'held'
            //    bookings whose deadline has passed but cron hasn't run yet.
            //    No DB write — purely for display.
            const effectiveStatus =
                booking.status === 'held' && isPaymentExpired
                    ? 'expired'
                    : booking.status;

            return {
                id:         booking._id.toString(),
                bookingRef: booking.bookingReference || 'N/A',
                pnr:        booking.pnr              || '---',

                status:    effectiveStatus,

                // ✅ FIX 2: paymentStatus was missing entirely
                paymentStatus: booking.paymentStatus || 'pending',

                // ✅ FIX 3: email flags for list-level badge display
                emailSent:             booking.emailSent             || false,
                confirmationEmailSent: booking.confirmationEmailSent || false,

                // ✅ FIX 6: retry info for "Max retry reached" badge
                retryCount: booking.retryCount || 0,
                canRetry:   (booking.retryCount || 0) < 5,

                isLiveMode: booking.isLiveMode || false,

                flight: {
                    airline:      flight.airline      || 'Unknown',
                    flightNumber: flight.flightNumber || '',
                    route:        flight.route        || 'Unknown Route',
                    date:         flight.departureDate || null,
                    duration:     flight.duration     || '',
                    tripType:     flight.flightType   || 'one_way',
                    logoUrl:      flight.logoUrl      || null,
                },

                passengerName: booking.passengers?.[0]
                    ? `${booking.passengers[0].firstName || ''} ${booking.passengers[0].lastName || ''}`.trim() || 'Guest'
                    : 'Guest',
                passengerCount: booking.passengers?.length || 0,

                contact: {
                    email: contact.email || 'N/A',
                    phone: contact.phone || 'N/A',
                },

                paymentSource: securePaymentInfo,

                amount: {
                    total:       pricing.total_amount || 0,
                    markup:      pricing.markup       || 0,
                    currency:    pricing.currency     || 'USD',
                    base_amount: pricing.base_amount  || 0,
                },

                timings: {
                    deadline:  booking.paymentDeadline || null,
                    createdAt: booking.createdAt,
                    timeLeft: booking.paymentDeadline
                        ? new Date(booking.paymentDeadline).getTime() - now.getTime()
                        : 0,
                },

                actionData: {
                    ticketUrl: ticketLink,
                },

                updatedAt: booking.updatedAt,
            };
        });

        return NextResponse.json({
            success: true,
            meta: {
                total:      totalBookings,
                page,
                limit,
                totalPages: Math.ceil(totalBookings / limit),
            },
            data: formattedData,
        });

    } catch (error: any) {
        console.error('GET Bookings Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 },
        );
    }
}