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
  Legend,
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
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  BadgeDollarSign,
  ChevronRight,
  BarChart3,
  Eye,
} from "lucide-react";

// ==========================================
// 1. TYPES — Matches Updated API
// ==========================================

interface KPIData {
  totalRevenue: number;
  potentialRevenue: number;
  // ✅ Profit Breakdown
  totalMarkup: number;
  paymentProcessingFees: number;
  netProfit: number;
  // Booking Counts
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  testBookings: number;
  // Other
  activePackages: number;
  activeDestinations: number;
  activeOffers: number;
  currency: string;
}

interface RevenuePoint {
  name: string;
  revenue: number;
  profit: number;
}

interface CategoryPoint {
  name: string;
  value: number;
  color: string;
}

interface ProfitBreakdown {
  markup: number;
  processingFee: number;
  realProfit: number;
}

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
  profitBreakdown: ProfitBreakdown | null;
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

const formatCurrencyDecimal = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
      label: "Issued",
    };
  if (["processing", "held", "pending"].some((x) => s.includes(x)))
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      ring: "ring-amber-500/20",
      label: "Pending",
    };
  if (["cancelled", "failed", "expired"].some((x) => s.includes(x)))
    return {
      bg: "bg-rose-50",
      text: "text-rose-700",
      dot: "bg-rose-500",
      ring: "ring-rose-500/20",
      label: "Cancelled",
    };
  return {
    bg: "bg-slate-50",
    text: "text-slate-700",
    dot: "bg-slate-500",
    ring: "ring-slate-500/20",
    label: status,
  };
}

// ==========================================
// 3. SKELETON COMPONENTS
// ==========================================

function KPISkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100/80 bg-white p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-gray-100" />
        <div className="h-4 w-16 rounded-full bg-gray-50" />
      </div>
      <div className="mt-4 h-7 w-28 rounded-lg bg-gray-100" />
      <div className="mt-2 h-3.5 w-40 rounded bg-gray-50" />
    </div>
  );
}

function ProfitCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100/80 bg-white p-5 animate-pulse">
      <div className="h-4 w-24 rounded bg-gray-100 mb-4" />
      <div className="space-y-3">
        <div className="h-6 w-32 rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-50" />
        <div className="h-3 w-3/4 rounded bg-gray-50" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-indigo-500 animate-spin" />
        <p className="text-xs text-gray-400 font-medium">Loading chart…</p>
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
// 4. CUSTOM TOOLTIP FOR REVENUE CHART
// ==========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RevenueTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200/60 bg-white/95 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-gray-200/50">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[11px] text-gray-500 min-w-[50px]">
              {entry.name}
            </span>
            <span className="text-[12px] font-bold text-gray-900 tabular-nums">
              {currency} {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 5. DASHBOARD PAGE
// ==========================================

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfitDetails, setShowProfitDetails] = useState(false);

  const loadDashboard = async () => {
    try {
      setError(null);
      setLoading(!data);
      setRefreshing(!!data);

      const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");

      const json: DashboardResponse = await res.json();
      if (!json.success) throw new Error("API returned unsuccessful response");

      setData(json.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Profit margin percentage
  const profitMargin =
    kpi && kpi.totalRevenue > 0
      ? ((kpi.netProfit / kpi.totalRevenue) * 100).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-[1360px] px-4 py-6 md:px-6 lg:px-8">
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25">
                  <Plane className="h-4 w-4 text-white -rotate-45" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block">
                    Dashboard
                  </span>
                  <h1 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl leading-none">
                    Financial Overview
                  </h1>
                </div>
              </div>
              <p className="text-[13px] text-gray-400 max-w-lg pl-[46px]">
                Real-time snapshot of bookings, revenue, profit and inventory.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              disabled={loading || refreshing}
              className="group w-fit inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] cursor-pointer shadow-sm"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 transition-transform ${
                  loading || refreshing
                    ? "animate-spin"
                    : "group-hover:rotate-90"
                }`}
              />
              {loading && !data
                ? "Loading…"
                : refreshing
                  ? "Refreshing…"
                  : "Refresh"}
            </button>
          </div>
        </header>

        {/* ═══════════════════ ERROR ═══════════════════ */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-rose-800">
                Something went wrong
              </p>
              <p className="text-[12px] text-rose-600/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ═══════════════════ HERO STATS BAR ═══════════════════ */}
        {kpi && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 overflow-hidden">
            <div className="grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 sm:grid-cols-4">
              {[
                {
                  label: "Total Revenue",
                  value: `${currencyCode} ${formatCurrency(kpi.totalRevenue)}`,
                  icon: DollarSign,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Net Profit",
                  value: `${currencyCode} ${formatCurrency(kpi.netProfit)}`,
                  icon: TrendingUp,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                  badge: `${profitMargin}% margin`,
                },
                {
                  label: "Processing Fees",
                  value: `${currencyCode} ${formatCurrency(kpi.paymentProcessingFees)}`,
                  icon: CreditCard,
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                  badge: "Duffel 2.9%",
                },
                {
                  label: "Pending Revenue",
                  value: `${currencyCode} ${formatCurrency(kpi.potentialRevenue)}`,
                  icon: Wallet,
                  color: "text-violet-600",
                  bg: "bg-violet-50",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-gray-50/60"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="inline-flex rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-extrabold text-gray-900 tabular-nums leading-tight">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════ TEST BOOKING BANNER ═══════════════════ */}
        {kpi && kpi.testBookings > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/40 px-5 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
              <FlaskConical className="h-3.5 w-3.5 text-orange-600" />
            </div>
            <p className="text-[12px] text-orange-700">
              <span className="font-bold">
                {kpi.testBookings} test booking
                {kpi.testBookings > 1 ? "s" : ""}
              </span>{" "}
              excluded from all financial metrics. Only live bookings are
              counted.
            </p>
          </div>
        )}

        {/* ═══════════════════ KPI CARDS ═══════════════════ */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !data ? (
            Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={i} />)
          ) : kpi ? (
            <>
              {/* Total Revenue */}
              <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-50 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                      <DollarSign className="h-[18px] w-[18px]" />
                    </div>
                    {kpi.totalRevenue > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        <ArrowUpRight className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900 tabular-nums">
                    {currencyCode} {formatCurrency(kpi.totalRevenue)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
                    Total Revenue
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    From {kpi.confirmedBookings} confirmed bookings
                  </p>
                </div>
              </div>

              {/* Net Profit */}
              <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                      <TrendingUp className="h-[18px] w-[18px]" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        kpi.netProfit > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {kpi.netProfit > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {profitMargin}%
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900 tabular-nums">
                    {currencyCode} {formatCurrency(kpi.netProfit)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
                    Net Profit
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    After Duffel processing fees
                  </p>
                </div>
              </div>

              {/* Total Bookings */}
              <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-50 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-transform group-hover:scale-110">
                      <ShoppingBag className="h-[18px] w-[18px]" />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900 tabular-nums">
                    {kpi.totalBookings.toLocaleString("en-US")}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
                    Total Bookings
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {kpi.confirmedBookings} issued
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {kpi.pendingBookings} pending
                    </span>
                    {kpi.cancelledBookings > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        {kpi.cancelledBookings} cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-50 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
                      <Package className="h-[18px] w-[18px]" />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900 tabular-nums">
                    {(
                      kpi.activePackages +
                      kpi.activeDestinations +
                      kpi.activeOffers
                    ).toLocaleString("en-US")}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
                    Travel Inventory
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {kpi.activePackages} packages · {kpi.activeDestinations}{" "}
                    destinations · {kpi.activeOffers} offers
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </section>

        {/* ═══════════════════ PROFIT BREAKDOWN CARD ═══════════════════ */}
        {loading && !data ? (
          <section className="mb-6">
            <ProfitCardSkeleton />
          </section>
        ) : kpi && kpi.confirmedBookings > 0 ? (
          <section className="mb-6">
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setShowProfitDetails(!showProfitDetails)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                    <Receipt className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-[14px] font-bold text-gray-900">
                      Profit Breakdown
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      How your revenue splits into profit & fees
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    showProfitDetails ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Breakdown Content */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  showProfitDetails
                    ? "max-h-[500px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-gray-50 px-6 py-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Total Markup */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                          <BadgeDollarSign className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Total Markup
                        </span>
                      </div>
                      <p className="text-xl font-extrabold text-gray-900 tabular-nums">
                        {currencyCode}{" "}
                        {formatCurrencyDecimal(kpi.totalMarkup)}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Commission + Duffel fee (stored in DB)
                      </p>
                    </div>

                    {/* Processing Fees */}
                    <div className="rounded-xl border border-orange-100/80 bg-orange-50/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                          <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Processing Fees
                        </span>
                      </div>
                      <p className="text-xl font-extrabold text-orange-700 tabular-nums">
                        − {currencyCode}{" "}
                        {formatCurrencyDecimal(kpi.paymentProcessingFees)}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Duffel card payment fee (2.9% of total)
                      </p>
                    </div>

                    {/* Net Profit */}
                    <div className="rounded-xl border border-emerald-100/80 bg-emerald-50/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Net Profit
                        </span>
                      </div>
                      <p className="text-xl font-extrabold text-emerald-700 tabular-nums">
                        {currencyCode}{" "}
                        {formatCurrencyDecimal(kpi.netProfit)}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Markup − Processing Fees = Your real profit
                      </p>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-gray-500">
                        Profit vs Fees Ratio
                      </span>
                      <span className="font-bold text-gray-700">
                        {kpi.totalMarkup > 0
                          ? (
                              (kpi.netProfit / kpi.totalMarkup) *
                              100
                            ).toFixed(1)
                          : "0"}
                        % profit retained
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{
                          width: `${
                            kpi.totalMarkup > 0
                              ? Math.max(
                                  (kpi.netProfit / kpi.totalMarkup) * 100,
                                  2
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-[10px]">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Net Profit ({currencyCode}{" "}
                        {formatCurrency(kpi.netProfit)})
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-gray-200" />
                        Fees ({currencyCode}{" "}
                        {formatCurrency(kpi.paymentProcessingFees)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ═══════════════════ CHARTS ═══════════════════ */}
        <section className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
          {/* Revenue & Profit Trend */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-lg hover:shadow-gray-100/50">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-gray-900">
                    Revenue & Profit Trend
                  </h2>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Last 6 months · Confirmed bookings only
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
                  <span className="h-2 w-6 rounded-full bg-indigo-500" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
                  <span className="h-2 w-6 rounded-full bg-emerald-500" />
                  Profit
                </span>
              </div>
            </div>

            <div className="h-[300px]">
              {loading && !data ? (
                <ChartSkeleton />
              ) : revenueTrend.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                    <TrendingUp className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400">
                    No revenue data available yet
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueTrend}
                    margin={{ left: -10, right: 5, top: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6366F1"
                          stopOpacity={0.12}
                        />
                        <stop
                          offset="100%"
                          stopColor="#6366F1"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                      <linearGradient
                        id="profitGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10B981"
                          stopOpacity={0.12}
                        />
                        <stop
                          offset="100%"
                          stopColor="#10B981"
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
                      stroke="#e2e8f0"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      dy={8}
                    />
                    <YAxis
                      stroke="#e2e8f0"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={formatShortNumber}
                      dx={-5}
                    />
                    <Tooltip
                      content={
                        <RevenueTooltip currency={currencyCode} />
                      }
                      cursor={{
                        stroke: "#6366F1",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      fill="url(#revenueGrad)"
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
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#profitGrad)"
                      dot={{
                        r: 3.5,
                        fill: "#10B981",
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 5.5,
                        fill: "#10B981",
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
          <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-lg hover:shadow-gray-100/50">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                  <Percent className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-gray-900">
                    Categories
                  </h2>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Distribution by type
                  </p>
                </div>
              </div>
            </div>

            <div className="flex h-[300px] flex-col items-center justify-center">
              {loading && !data ? (
                <ChartSkeleton />
              ) : categoryDistribution.length === 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400">No data yet</p>
                </div>
              ) : (
                <div className="flex w-full flex-col items-center gap-5">
                  <div className="h-[170px] w-[170px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={76}
                          paddingAngle={4}
                          strokeWidth={0}
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            fontSize: 12,
                            padding: "8px 12px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          }}
                          formatter={(value: number, name: string) => [
                            value,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full space-y-2.5 px-2">
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
                            className="h-3 w-3 shrink-0 rounded-[4px] ring-2 ring-white shadow"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="flex-1 truncate text-[12px] font-medium text-gray-500 group-hover:text-gray-900 transition-colors">
                            {item.name}
                          </span>
                          <span className="text-[12px] font-bold text-gray-900 tabular-nums">
                            {item.value.toLocaleString("en-US")}
                          </span>
                          <span className="w-10 text-right text-[10px] font-bold text-gray-400 tabular-nums bg-gray-50 rounded-full px-1.5 py-0.5">
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
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-lg hover:shadow-gray-100/50">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                <Calendar className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-gray-900">
                  Recent Bookings
                </h2>
                <p className="text-[11px] text-gray-400">
                  Latest bookings with profit breakdown
                </p>
              </div>
            </div>
            {recentBookings.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500 tabular-nums">
                {recentBookings.length} records
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/40">
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
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:px-6">
                    Profit
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
                    <td colSpan={6} className="px-6 py-16 text-center">
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
                      ?.split("@")[0]
                      ?.split("")
                      ?.slice(0, 2)
                      ?.join("")
                      ?.toUpperCase() || "??";

                    return (
                      <tr
                        key={b.id}
                        className={`group transition-colors hover:bg-gray-50/60 ${
                          !b.isLiveMode ? "bg-orange-50/15" : ""
                        }`}
                      >
                        {/* Customer */}
                        <td className="px-5 py-3.5 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-[11px] font-bold text-gray-500 ring-2 ring-white shadow-sm border border-gray-100">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-[13px] font-semibold text-gray-900 max-w-[140px]">
                                  {b.customerName}
                                </p>
                                {!b.isLiveMode && (
                                  <span className="inline-flex items-center gap-0.5 rounded-[4px] bg-orange-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-orange-600 border border-orange-200/80">
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
                          <p className="truncate text-[13px] font-medium text-gray-800 max-w-[200px]">
                            {b.packageTitle}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            PNR{" "}
                            <span className="rounded-[4px] bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-600">
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
                            {b.price}
                          </span>
                        </td>

                        {/* Profit */}
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          {b.profitBreakdown ? (
                            <div className="space-y-0.5">
                              <p className="text-[13px] font-bold text-emerald-600 tabular-nums">
                                +{b.currency || currencyCode}{" "}
                                {formatCurrencyDecimal(
                                  b.profitBreakdown.realProfit
                                )}
                              </p>
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-[9px] text-gray-400 tabular-nums">
                                  Fee: {b.currency || currencyCode}{" "}
                                  {formatCurrencyDecimal(
                                    b.profitBreakdown.processingFee
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-300">
                              —
                            </span>
                          )}
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
        <footer className="mt-10 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-300">
            <Eye className="h-3 w-3" />
            <p>Dashboard auto-updates on refresh · Data powered by your API</p>
          </div>
        </footer>
      </div>
    </div>
  );
}