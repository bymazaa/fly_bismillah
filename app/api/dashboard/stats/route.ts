// app/api/dashboard/stats/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import Destination from '@/models/Destination.model';
import Offer from '@/models/Offer.model';
import Package from '@/models/Package.model';
import ActivityLog from '@/models/ActivityLog';
import { hasPermission } from '@/app/api/lib/auth';
import Admin from '@/models/Admin.model';

// ================================================================
// CONSTANTS
// ================================================================

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getMonthName(date: Date): string {
  return MONTH_NAMES[date.getMonth()];
}

function getLast6Months(): { key: string; year: number; month: number }[] {
  const months: { key: string; year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      key: getMonthName(d),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

// ================================================================
// RATE LIMITER
// ================================================================

const rateLimitMap = new Map<
  string,
  { count: number; startTime: number }
>();

function isRateLimited(ip: string): boolean {
  const windowMs = 60 * 1000;
  const maxRequests = 30;
  const now = Date.now();
  const data = rateLimitMap.get(ip) || {
    count: 0,
    startTime: now,
  };

  if (now - data.startTime > windowMs) {
    data.count = 1;
    data.startTime = now;
  } else {
    data.count++;
  }

  rateLimitMap.set(ip, data);
  return data.count > maxRequests;
}

// ================================================================
// GET /api/dashboard/stats
// ================================================================

export async function GET(req: Request) {
  // ── Auth Check ──
  const auth = await hasPermission('dashboard', 'view');
  if (!auth.success) return auth.response;

  // ── Rate Limit ──
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown-ip';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    await dbConnect();

    // ══════════════════════════════════════════════
    // PARALLEL DATA FETCH
    // ══════════════════════════════════════════════

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [
      allBookings,
      allPackages,
      totalDestinations,
      totalOffers,
      allStaff,
      todayActivityCount,
      weekActivityCount,
      recentActivities,
      todayLoginCount,
    ] = await Promise.all([
      Booking.find({})
        .select(
          'pricing status createdAt contact flightDetails pnr bookingReference isLiveMode'
        )
        .sort({ createdAt: -1 })
        .lean(),

      Package.find({}).select('category').lean(),

      Destination.countDocuments(),

      Offer.countDocuments(),

      Admin.find({})
        .select(
          'name email adminId role status isOnline lastActive lastLogin avatar activeSessions createdAt'
        )
        .sort({ lastActive: -1 })
        .lean(),

      ActivityLog.countDocuments({
        createdAt: { $gte: todayStart },
      }),

      ActivityLog.countDocuments({
        createdAt: { $gte: weekStart },
      }),

      ActivityLog.find({})
        .populate('admin', 'name email adminId role avatar')
        .populate('target', 'name email adminId role')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),

      ActivityLog.countDocuments({
        action: { $in: ['login', 'self_logout'] },
        createdAt: { $gte: todayStart },
      }),
    ]);

    // ══════════════════════════════════════════════
    // BOOKING AGGREGATION — FIXED PROFIT BREAKDOWN
    // ══════════════════════════════════════════════
    //
    // How our pricing works:
    //
    //   base_price       = airline/supplier price
    //   our commission   = base_price × 5%
    //   subtotal         = base_price + commission
    //   duffel fee       = subtotal × 2.9%   (payment processing)
    //
    //   markup (in DB)   = commission + duffel fee   (mixed together)
    //   total_amount     = base_price + markup
    //
    // To extract real profit:
    //   processing_fee   = total_amount × 2.9%
    //   real_profit      = markup − processing_fee
    //
    // ══════════════════════════════════════════════

    const statsCount = {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
    };

    let testBookingCount = 0;

    // ✅ Revenue & Profit Variables
    let totalRevenue = 0;
    let totalMarkup = 0;
    let totalProcessingFees = 0;
    let totalRealProfit = 0;
    let potentialRevenue = 0;

    // Per-booking profit map (for recent bookings breakdown)
    const bookingProfitMap = new Map<
      string,
      {
        markup: number;
        processingFee: number;
        realProfit: number;
      }
    >();

    const currencyCount = new Map<string, number>();

    const last6Months = getLast6Months();
    const revenueByMonth = new Map<string, number>();
    const profitByMonth = new Map<string, number>();
    last6Months.forEach((m) => {
      revenueByMonth.set(m.key, 0);
      profitByMonth.set(m.key, 0);
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allBookings.forEach((booking: any) => {
      const isLive = booking.isLiveMode === true;

      if (!isLive) {
        testBookingCount++;
        return;
      }

      const totalAmount = Number(booking.pricing?.total_amount) || 0;
      const markup = Number(booking.pricing?.markup) || 0;
      const status = booking.status
        ? String(booking.status).toLowerCase()
        : 'processing';
      const currency = booking.pricing?.currency as string | undefined;

      if (currency) {
        currencyCount.set(
          currency,
          (currencyCount.get(currency) || 0) + 1
        );
      }

      const createdAt = booking.createdAt
        ? new Date(booking.createdAt)
        : new Date();

      statsCount.total++;

      if (status === 'issued') {
        statsCount.confirmed++;
        totalRevenue += totalAmount;
        totalMarkup += markup;

        // ✅ Profit Calculation
        // processing_fee = total_amount × 2.9%  (Duffel card fee)
        // real_profit    = markup − processing_fee
        const processingFee = totalAmount * 0.029;
        const realProfit = markup - processingFee;

        totalProcessingFees += processingFee;
        totalRealProfit += realProfit;

        // Store per-booking breakdown
        const bookingId = booking._id?.toString();
        if (bookingId) {
          bookingProfitMap.set(bookingId, {
            markup: Number(markup.toFixed(2)),
            processingFee: Number(processingFee.toFixed(2)),
            realProfit: Number(realProfit.toFixed(2)),
          });
        }

        // Monthly charts
        if (createdAt >= sixMonthsAgo) {
          const monthKey = getMonthName(createdAt);
          if (revenueByMonth.has(monthKey)) {
            revenueByMonth.set(
              monthKey,
              (revenueByMonth.get(monthKey) || 0) + totalAmount
            );
            profitByMonth.set(
              monthKey,
              (profitByMonth.get(monthKey) || 0) + realProfit
            );
          }
        }
      } else if (
        ['cancelled', 'failed', 'expired'].includes(status)
      ) {
        statsCount.cancelled++;
      } else {
        statsCount.pending++;
        potentialRevenue += totalAmount;
      }
    });

    let baseCurrency = 'USD';
    let maxCurrencyCount = 0;
    currencyCount.forEach((count, currency) => {
      if (count > maxCurrencyCount) {
        maxCurrencyCount = count;
        baseCurrency = currency;
      }
    });

    // ✅ Revenue chart now includes both revenue & profit
    const revenueChartData = last6Months.map((m) => ({
      name: m.key,
      revenue: Number((revenueByMonth.get(m.key) || 0).toFixed(2)),
      profit: Number((profitByMonth.get(m.key) || 0).toFixed(2)),
    }));

    // ══════════════════════════════════════════════
    // CATEGORY DISTRIBUTION
    // ══════════════════════════════════════════════

    const categoryStats: Record<string, number> = {
      hajj: 0,
      umrah: 0,
      holiday: 0,
      tour: 0,
      others: 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allPackages.forEach((pkg: any) => {
      const cat = pkg.category
        ? String(pkg.category).toLowerCase()
        : 'others';

      if (cat === 'hajj') categoryStats.hajj++;
      else if (cat === 'umrah') categoryStats.umrah++;
      else if (cat === 'holiday') categoryStats.holiday++;
      else if (cat === 'tour' || cat === 'islamic tour')
        categoryStats.tour++;
      else categoryStats.others++;
    });

    const categoryChartData = [
      { name: 'Hajj', value: categoryStats.hajj, color: '#10B981' },
      { name: 'Umrah', value: categoryStats.umrah, color: '#F59E0B' },
      { name: 'Holiday', value: categoryStats.holiday, color: '#EC4899' },
      { name: 'Tour', value: categoryStats.tour, color: '#6366F1' },
      {
        name: 'Flight (Sold)',
        value: statsCount.confirmed,
        color: '#3B82F6',
      },
    ].filter((item) => item.value > 0);

    // ══════════════════════════════════════════════
    // RECENT BOOKINGS — WITH PROFIT BREAKDOWN
    // ══════════════════════════════════════════════

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentBookings = allBookings.slice(0, 8).map((b: any) => {
      const bookingId = b._id?.toString();
      const profitBreakdown = bookingProfitMap.get(bookingId) || null;

      return {
        id: b._id,
        customerName: b.contact?.email || 'Guest',
        customerPhone: b.contact?.phone || 'N/A',
        packageTitle: b.flightDetails?.route
          ? `${b.flightDetails.route} (${b.flightDetails.airline || 'Airline'})`
          : 'Flight Booking',
        price: Number(b.pricing?.total_amount) || 0,
        currency: b.pricing?.currency || baseCurrency,
        status: b.status,
        pnr: b.pnr || b.bookingReference,
        isLiveMode: b.isLiveMode === true,
        date: b.createdAt
          ? new Date(b.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'N/A',
        // ✅ Per-booking profit breakdown (only for issued bookings)
        profitBreakdown,
      };
    });

    // ══════════════════════════════════════════════
    // STAFF MANAGEMENT STATS
    // ══════════════════════════════════════════════

    const staffStats = {
      total: allStaff.length,
      active: 0,
      blocked: 0,
      suspended: 0,
      online: 0,
      totalActiveSessions: 0,
    };

    const roleDistribution: Record<string, number> = {
      admin: 0,
      editor: 0,
      viewer: 0,
    };

    interface IOnlineStaffItem {
      _id: string;
      name: string;
      email: string;
      adminId: string;
      role: string;
      avatar: string | null;
      lastActive: Date | null;
      lastActiveAgo: string;
      activeSessions: number;
      currentDevices: {
        device: string;
        browser: string;
        location: string;
      }[];
    }

    const onlineStaff: IOnlineStaffItem[] = [];

    let staffLoggedInToday = 0;

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    let newStaffThisMonth = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allStaff.forEach((staff: any) => {
      if (staff.status === 'active') staffStats.active++;
      else if (staff.status === 'blocked') staffStats.blocked++;
      else if (staff.status === 'suspended') staffStats.suspended++;

      const role = staff.role || 'viewer';
      if (roleDistribution[role] !== undefined) {
        roleDistribution[role]++;
      }

      const sessionCount = staff.activeSessions?.length || 0;
      staffStats.totalActiveSessions += sessionCount;

      if (staff.isOnline && sessionCount > 0) {
        staffStats.online++;

        onlineStaff.push({
          _id: staff._id.toString(),
          name: staff.name,
          email: staff.email,
          adminId: staff.adminId,
          role: staff.role,
          avatar: staff.avatar || null,
          lastActive: staff.lastActive,
          lastActiveAgo: staff.lastActive
            ? getTimeAgo(new Date(staff.lastActive))
            : 'Unknown',
          activeSessions: sessionCount,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentDevices: (staff.activeSessions || []).map((s: any) => ({
            device: s.device || 'Unknown',
            browser: s.browser || 'Unknown',
            location: s.location || 'Unknown',
          })),
        });
      }

      if (
        staff.lastLogin &&
        new Date(staff.lastLogin) >= todayStart
      ) {
        staffLoggedInToday++;
      }

      if (
        staff.createdAt &&
        new Date(staff.createdAt) >= thisMonthStart
      ) {
        newStaffThisMonth++;
      }
    });

    onlineStaff.sort((a, b) => {
      const aTime = a.lastActive
        ? new Date(a.lastActive).getTime()
        : 0;
      const bTime = b.lastActive
        ? new Date(b.lastActive).getTime()
        : 0;
      return bTime - aTime;
    });

    // ── Staff Login Trend (last 6 months) ──
    const loginByMonth = new Map<string, number>();
    last6Months.forEach((m) => loginByMonth.set(m.key, 0));

    const sixMonthLoginLogs = await ActivityLog.find({
      action: 'login',
      createdAt: { $gte: sixMonthsAgo },
    })
      .select('createdAt')
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sixMonthLoginLogs.forEach((log: any) => {
      if (log.createdAt) {
        const monthKey = getMonthName(new Date(log.createdAt));
        if (loginByMonth.has(monthKey)) {
          loginByMonth.set(
            monthKey,
            (loginByMonth.get(monthKey) || 0) + 1
          );
        }
      }
    });

    const loginTrendData = last6Months.map((m) => ({
      name: m.key,
      value: loginByMonth.get(m.key) || 0,
    }));

    // ── Top Active Staff (by activity count this week) ──
    const topActiveStaffAgg = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: '$admin',
          actionCount: { $sum: 1 },
          lastAction: { $max: '$createdAt' },
        },
      },
      { $sort: { actionCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'admins',
          localField: '_id',
          foreignField: '_id',
          as: 'adminInfo',
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                adminId: 1,
                role: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$adminInfo' },
      {
        $project: {
          _id: 1,
          actionCount: 1,
          lastAction: 1,
          name: '$adminInfo.name',
          email: '$adminInfo.email',
          adminId: '$adminInfo.adminId',
          role: '$adminInfo.role',
          avatar: '$adminInfo.avatar',
        },
      },
    ]);

    const topActiveStaff = topActiveStaffAgg.map((item) => ({
      _id: item._id,
      name: item.name,
      email: item.email,
      adminId: item.adminId,
      role: item.role,
      avatar: item.avatar || null,
      actionCount: item.actionCount,
      lastAction: item.lastAction,
      lastActionAgo: getTimeAgo(new Date(item.lastAction)),
    }));

    // ── Action Distribution (this week) ──
    const actionDistAgg = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const actionDistribution = actionDistAgg.map((item) => ({
      action: item._id,
      label: formatActionLabel(item._id),
      count: item.count,
    }));

    // ── Format Recent Activities ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedActivities = recentActivities.map((log: any) => ({
      _id: log._id,
      action: log.action,
      actionLabel: formatActionLabel(log.action),
      details: log.details,
      admin: log.admin
        ? {
            _id: log.admin._id,
            name: log.admin.name,
            email: log.admin.email,
            adminId: log.admin.adminId,
            role: log.admin.role,
            avatar: log.admin.avatar || null,
          }
        : null,
      target: log.target
        ? {
            _id: log.target._id,
            name: log.target.name,
            email: log.target.email,
            role: log.target.role,
          }
        : null,
      ip: log.ip,
      createdAt: log.createdAt,
      timeAgo: getTimeAgo(new Date(log.createdAt)),
    }));

    // ══════════════════════════════════════════════
    // RESPONSE
    // ══════════════════════════════════════════════

    return NextResponse.json(
      {
        success: true,
        data: {
          // ── Booking KPI Cards ──
          kpi: {
            // Revenue
            totalRevenue: Number(totalRevenue.toFixed(2)),
            potentialRevenue: Number(potentialRevenue.toFixed(2)),

            // ✅ Profit Breakdown (FIXED)
            totalMarkup: Number(totalMarkup.toFixed(2)),
            paymentProcessingFees: Number(
              totalProcessingFees.toFixed(2)
            ),
            netProfit: Number(totalRealProfit.toFixed(2)),

            // Booking Counts
            totalBookings: statsCount.total,
            pendingBookings: statsCount.pending,
            confirmedBookings: statsCount.confirmed,
            cancelledBookings: statsCount.cancelled,
            testBookings: testBookingCount,

            // Other
            activePackages: allPackages.length,
            activeDestinations: totalDestinations,
            activeOffers: totalOffers,
            currency: baseCurrency,
          },

          // ✅ Staff KPI Cards
          staffKpi: {
            totalStaff: staffStats.total,
            activeStaff: staffStats.active,
            blockedStaff: staffStats.blocked,
            suspendedStaff: staffStats.suspended,
            onlineNow: staffStats.online,
            totalActiveSessions: staffStats.totalActiveSessions,
            todayLogins: todayLoginCount,
            staffLoggedInToday,
            todayActions: todayActivityCount,
            weekActions: weekActivityCount,
            newStaffThisMonth,
            roleDistribution,
          },

          // ── Charts ──
          charts: {
            revenueTrend: revenueChartData,
            categoryDistribution: categoryChartData,
            loginTrend: loginTrendData,
            actionDistribution,
          },

          // ── Recent Bookings ──
          recentBookings,

          // ✅ Staff Management Data
          staffManagement: {
            onlineStaff,
            topActiveStaff,
            recentActivity: formattedActivities,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Dashboard API Error:', error);
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load dashboard data',
        error: message,
      },
      { status: 500 }
    );
  }
}

// ══════════════════════════════════════════════
// HELPER
// ══════════════════════════════════════════════

function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    created_staff: '👤 Staff Created',
    updated_staff: '✏️ Staff Updated',
    deleted_staff: '🗑️ Staff Deleted',
    blocked_staff: '🚫 Staff Blocked',
    unblocked_staff: '✅ Staff Unblocked',
    self_logout: '🚪 Logged Out',
    self_logout_all: '🚪 All Sessions Ended',
    self_logout_session: '🚪 Session Ended',
    force_logout_session: '⚡ Force Logout',
    force_logout_all_sessions: '⚡ Force All Logout',
    login: '🔑 Login',
    failed_login: '❌ Failed Login',
    changed_password: '🔒 Password Changed',
    failed_password_change: '❌ Failed Password Change',
    updated_own_profile: '👤 Profile Updated',
    password_reset_requested: '📧 Password Reset Requested',
    password_reset_completed: '🔒 Password Reset Done',
  };

  return labels[action] || action;
}