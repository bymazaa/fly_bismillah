"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Percent,
  AlertTriangle,
  Calendar,
  Plane,
  FlaskConical,
} from "lucide-react";

// ==========================================
// 1. TYPES — Fixed to match API response
// ==========================================

interface KPIData {
  totalRevenue: number;
  netProfit: number;
  potentialRevenue: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  // ─── FIX #1: Added testBookings (API returns this) ───
  testBookings: number;
  activePackages: number;
  activeDestinations: number;
  activeOffers: number;
  currency: string;
}

interface RevenuePoint {
  name: string;
  value: number;
}

interface CategoryPoint {
  name: string;
  value: number;
  color: string;
}

// ─── FIX #2: Added isLiveMode field ───
interface RecentBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  packageTitle: string;
  price: number;
  currency: string;
  status: string;
  pnr: string;
  isLiveMode: boolean;
  date: string;
}

interface DashboardData {
  kpi: KPIData;
  charts: {
    revenueTrend: RevenuePoint[];
    categoryDistribution: CategoryPoint[];
  };
  recentBookings: RecentBooking[];
}

interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

// ==========================================
// 2. HELPERS
// ==========================================

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatShortNumber = (value: number) => {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toString();
};

function getStatusConfig(status: string) {
  const s = status?.toLowerCase() || "";
  if (s === "issued" || s === "confirmed")
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      ring: "ring-emerald-500/20",
    };
  if (["processing", "held", "pending"].some((x) => s.includes(x)))
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      ring: "ring-amber-500/20",
    };
  if (["cancelled", "failed", "expired"].some((x) => s.includes(x)))
    return {
      bg: "bg-rose-50",
      text: "text-rose-700",
      dot: "bg-rose-500",
      ring: "ring-rose-500/20",
    };
  return {
    bg: "bg-slate-50",
    text: "text-slate-700",
    dot: "bg-slate-500",
    ring: "ring-slate-500/20",
  };
}

// ==========================================
// 3. SKELETON COMPONENTS
// ==========================================

function KPISkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl bg-gray-100" />
        <div className="h-4 w-16 rounded-full bg-gray-100" />
      </div>
      <div className="mt-4 h-7 w-28 rounded-lg bg-gray-100" />
      <div className="mt-2 h-3.5 w-40 rounded bg-gray-50" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
        <p className="text-xs text-gray-400 font-medium">Loading chart...</p>
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-100" />
          <div>
            <div className="mb-1.5 h-3.5 w-28 rounded bg-gray-100" />
            <div className="h-3 w-20 rounded bg-gray-50" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="mb-1.5 h-3.5 w-36 rounded bg-gray-100" />
        <div className="h-3 w-20 rounded bg-gray-50" />
      </td>
      <td className="px-5 py-4">
        <div className="h-6 w-20 rounded-full bg-gray-100" />
      </td>
      <td className="px-5 py-4">
        <div className="h-3.5 w-20 rounded bg-gray-100" />
      </td>
      <td className="px-5 py-4 text-right">
        <div className="ml-auto h-3.5 w-20 rounded bg-gray-100" />
      </td>
    </tr>
  );
}

// ==========================================
// 4. DASHBOARD PAGE
// ==========================================

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setError(null);
      setLoading(!data);
      setRefreshing(!!data);

      // ─── FIX #3: Correct API URL ───
      const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");

      const json: DashboardResponse = await res.json();
      if (!json.success) throw new Error("API returned unsuccessful response");

      setData(json.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpi = data?.kpi;
  const revenueTrend = data?.charts.revenueTrend || [];
  const categoryDistribution = data?.charts.categoryDistribution || [];
  const recentBookings = data?.recentBookings || [];
  const currencyCode = kpi?.currency || "USD";

  const kpiCards = kpi
    ? [
        {
          label: "Total Revenue",
          value: `${currencyCode} ${formatCurrency(kpi.totalRevenue)}`,
          subtitle: "From all confirmed bookings",
          icon: DollarSign,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
          trend: kpi.totalRevenue > 0 ? "+12.5%" : undefined,
          trendUp: true,
        },
        {
          label: "Net Profit",
          value: `${currencyCode} ${formatCurrency(kpi.netProfit)}`,
          subtitle:
            kpi.totalRevenue > 0
              ? `${((kpi.netProfit / kpi.totalRevenue) * 100).toFixed(1)}% margin`
              : "No revenue yet",
          icon: TrendingUp,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
          trend:
            kpi.totalRevenue > 0
              ? `${((kpi.netProfit / kpi.totalRevenue) * 100).toFixed(1)}%`
              : undefined,
          trendUp: kpi.netProfit > 0,
        },
        {
          label: "Total Bookings",
          value: kpi.totalBookings.toLocaleString("en-US"),
          // ─── FIX #4: Show test booking count in subtitle ───
          subtitle: `${kpi.confirmedBookings} confirmed · ${kpi.pendingBookings} pending${
            kpi.testBookings > 0
              ? ` · ${kpi.testBookings} test`
              : ""
          }`,
          icon: ShoppingBag,
          iconBg: "bg-violet-50",
          iconColor: "text-violet-600",
        },
        {
          label: "Travel Inventory",
          value: (
            kpi.activePackages +
            kpi.activeDestinations +
            kpi.activeOffers
          ).toString(),
          subtitle: `${kpi.activePackages} packages · ${kpi.activeDestinations} destinations`,
          icon: Package,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 lg:px-8">
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-md shadow-gray-900/10">
                  <Plane className="h-4 w-4 text-white -rotate-12" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Dashboard
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[28px]">
                Financial Overview
              </h1>
              <p className="text-[13px] text-gray-500 max-w-lg">
                Real-time snapshot of your bookings, revenue, profit and
                inventory across all channels.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              disabled={loading || refreshing}
              className="group w-fit inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:shadow-md hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 transition-transform ${
                  loading || refreshing
                    ? "animate-spin"
                    : "group-hover:rotate-90"
                }`}
              />
              {loading && !data
                ? "Loading..."
                : refreshing
                  ? "Refreshing..."
                  : "Refresh"}
            </button>
          </div>

          {/* ─── Hero Stats Bar ─── */}
          {kpi && (
            <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-200/60 shadow-lg shadow-gray-200/40 sm:grid-cols-3">
              {[
                {
                  label: "Total Revenue",
                  value: `${currencyCode} ${formatCurrency(kpi.totalRevenue)}`,
                },
                {
                  label: "Net Profit",
                  value: `${currencyCode} ${formatCurrency(kpi.netProfit)}`,
                },
                {
                  label: "Pending Value",
                  value: `${currencyCode} ${formatCurrency(kpi.potentialRevenue)}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-0.5 bg-white px-5 py-4 transition-colors hover:bg-gray-50/50"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {item.label}
                  </span>
                  <span className="text-lg font-bold text-gray-900 tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ─── FIX #5: Test Booking Warning Banner ─── */}
          {kpi && kpi.testBookings > 0 && (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-orange-200/80 bg-orange-50/60 px-4 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                <FlaskConical className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <p className="text-[12px] text-orange-800">
                <span className="font-bold">{kpi.testBookings} test booking{kpi.testBookings > 1 ? "s" : ""}</span>{" "}
                excluded from financial metrics. Only live bookings are counted in revenue and profit.
              </p>
            </div>
          )}
        </header>

        {/* ═══════════════════ ERROR ═══════════════════ */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200/80 bg-gradient-to-r from-rose-50 to-white px-4 py-3.5 shadow-2xl shadow-gray-100">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-rose-800">
                Something went wrong
              </p>
              <p className="text-[12px] text-rose-600/80">{error}</p>
            </div>
          </div>
        )}

        {/* ═══════════════════ KPI CARDS ═══════════════════ */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !data
            ? Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={i} />)
            : kpiCards.map((card) => (
                <div
                  key={card.label}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl shadow-gray-100 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200"
                >
                  <div
                    className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${card.iconBg} opacity-40 blur-2xl transition-all group-hover:opacity-60 group-hover:scale-125`}
                  />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor} transition-transform duration-300 group-hover:scale-110`}
                      >
                        <card.icon className="h-[18px] w-[18px]" />
                      </div>
                      {card.trend && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            card.trendUp
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {card.trendUp ? "↑" : "↓"} {card.trend}
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
                      {card.value}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                      {card.label}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              ))}
        </section>

        {/* ═══════════════════ CHARTS ═══════════════════ */}
        <section className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
          {/* Revenue Trend */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl shadow-gray-100 transition-shadow hover:shadow-lg hover:shadow-gray-200/30">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">
                  Revenue Trend
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  Last 6 months · Confirmed bookings
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </div>
            </div>

            <div className="h-[280px]">
              {loading && !data ? (
                <ChartSkeleton />
              ) : revenueTrend.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                    <TrendingUp className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400">
                    No revenue data available yet
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueTrend}
                    margin={{ left: -15, right: 5, top: 5, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6366F1"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="100%"
                          stopColor="#6366F1"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#cbd5e1"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      dy={8}
                    />
                    <YAxis
                      stroke="#cbd5e1"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={formatShortNumber}
                      dx={-5}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "#f8fafc",
                        padding: "10px 14px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                      }}
                      itemStyle={{ color: "#c7d2fe" }}
                      labelStyle={{
                        color: "#e2e8f0",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                      formatter={(value: any) => [
                        `${currencyCode} ${formatCurrency(value as number)}`,
                        "Revenue",
                      ]}
                      cursor={{
                        stroke: "#6366F1",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Revenue"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                      dot={{
                        r: 4,
                        fill: "#6366F1",
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#6366F1",
                        stroke: "#ffffff",
                        strokeWidth: 3,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl shadow-gray-100 transition-shadow hover:shadow-lg hover:shadow-gray-200/30">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">
                  Categories
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  Distribution by type
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Percent className="h-4 w-4 text-amber-500" />
              </div>
            </div>

            <div className="flex h-[280px] flex-col items-center justify-center">
              {loading && !data ? (
                <ChartSkeleton />
              ) : categoryDistribution.length === 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                    <Package className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400">No data yet</p>
                </div>
              ) : (
                <div className="flex w-full flex-col items-center gap-5">
                  <div className="h-[160px] w-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={72}
                          paddingAngle={4}
                          strokeWidth={0}
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "none",
                            borderRadius: 12,
                            fontSize: 12,
                            color: "#f8fafc",
                            padding: "8px 12px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                          }}
                          formatter={(value: any, name: any) => [
                            value,
                            name as string,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full space-y-2 px-2">
                    {categoryDistribution.map((item) => {
                      const total = categoryDistribution.reduce(
                        (s, c) => s + c.value,
                        0
                      );
                      const pct =
                        total > 0
                          ? ((item.value / total) * 100).toFixed(0)
                          : "0";
                      return (
                        <div
                          key={item.name}
                          className="group flex items-center gap-3"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white shadow-2xl shadow-gray-100"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="flex-1 truncate text-[12px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                            {item.name}
                          </span>
                          <span className="text-[12px] font-bold text-gray-900 tabular-nums">
                            {item.value.toLocaleString("en-US")}
                          </span>
                          <span className="w-8 text-right text-[10px] font-semibold text-gray-400 tabular-nums">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════════ RECENT BOOKINGS ═══════════════════ */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-100 transition-shadow hover:shadow-lg hover:shadow-gray-200/30">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                <Calendar className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">
                  Recent Bookings
                </h2>
                <p className="text-[11px] text-gray-400">
                  Latest bookings across flights & packages
                </p>
              </div>
            </div>
            {recentBookings.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500 tabular-nums">
                {recentBookings.length} records
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:px-6">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:px-6">
                    Booking
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:px-6">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:px-6">
                    Date
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:px-6">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && !data ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRowSkeleton key={`skeleton-${idx}`} />
                  ))
                ) : recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                          <ShoppingBag className="h-6 w-6 text-gray-300" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-400">
                            No bookings yet
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            Bookings will appear here once created
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => {
                    const statusConfig = getStatusConfig(b.status);
                    const initials = b.customerName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <tr
                        key={b.id}
                        className={`group transition-colors hover:bg-gray-50/70 ${
                          !b.isLiveMode ? "bg-orange-50/20" : ""
                        }`}
                      >
                        {/* Customer */}
                        <td className="px-5 py-3.5 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-[11px] font-bold text-gray-500 ring-2 ring-white shadow-2xl shadow-gray-100">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-[13px] font-semibold text-gray-900">
                                  {b.customerName}
                                </p>
                                {/* ─── FIX #6: TEST badge for non-live bookings ─── */}
                                {!b.isLiveMode && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-orange-600 ring-1 ring-orange-200">
                                    <FlaskConical className="h-2.5 w-2.5" />
                                    Test
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-[11px] text-gray-400">
                                {b.customerPhone}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Booking */}
                        <td className="px-5 py-3.5 sm:px-6">
                          <p className="truncate text-[13px] font-medium text-gray-900 max-w-[200px]">
                            {b.packageTitle}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            PNR{" "}
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-600">
                              {b.pnr}
                            </span>
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 sm:px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.ring}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                            />
                            {b.status}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5 sm:px-6">
                          <span className="text-[13px] text-gray-600">
                            {b.date}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          <span className="text-[13px] font-bold text-gray-900 tabular-nums">
                            {b.currency || currencyCode}{" "}
                            {formatCurrency(b.price)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══════════════════ FOOTER ═══════════════════ */}
        <footer className="mt-8 pb-6 text-center">
          <p className="text-[11px] text-gray-300">
            Dashboard auto-updates on refresh · Data powered by your API
          </p>
        </footer>
      </div>
    </div>
  );
}