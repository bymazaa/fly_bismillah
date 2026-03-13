"use client";

import { useEffect, useMemo, useState } from "react";

// ==========================================
// 1. Type Definitions
// ==========================================
interface TransactionData {
  id: string;
  bookingRef: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  description: string;
  customerName: string;
  airline: string;
}

interface ApiResponse {
  success: boolean;
  data: TransactionData[];
  meta?: {
    after?: string;
    before?: string;
  };
}

// ==========================================
// 2. Helper Function (API Fetcher)
// ==========================================
async function fetchTransactionsFromAPI(
  limit = 20,
  afterCursor?: string | null
): Promise<ApiResponse> {
  try {
    let url = `/api/dashboard/transactions?limit=${limit}`;
    if (afterCursor) {
      url += `&after=${afterCursor}`;
    }
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch data");
    return await res.json();
  } catch (error) {
    console.error("API Call Error:", error);
    return { success: false, data: [] };
  }
}

// ==========================================
// 3. Status Badge Styles
// ==========================================
function getStatusConfig(status: string) {
  const s = status.toLowerCase();

  if (
    ["paid", "completed", "succeeded", "success", "captured"].some((k) =>
      s.includes(k)
    )
  ) {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      ring: "ring-emerald-200/60",
    };
  }
  if (["pending", "processing", "in_progress"].some((k) => s.includes(k))) {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      ring: "ring-amber-200/60",
    };
  }
  if (
    ["refunded", "cancelled", "canceled", "void"].some((k) => s.includes(k))
  ) {
    return {
      bg: "bg-red-50",
      text: "text-red-600",
      dot: "bg-red-500",
      ring: "ring-red-200/60",
    };
  }
  if (["failed", "declined", "error"].some((k) => s.includes(k))) {
    return {
      bg: "bg-rose-50",
      text: "text-rose-700",
      dot: "bg-rose-500",
      ring: "ring-rose-200/60",
    };
  }
  return {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
    ring: "ring-slate-200/60",
  };
}

// ==========================================
// 4. Stat Card Component
// ==========================================
function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/40 hover:border-slate-300/60">
      {/* Subtle gradient accent */}
      <div
        className={`absolute top-0 right-0 h-20 w-20 rounded-full blur-2xl opacity-20 ${accent}`}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. Skeleton Row
// ==========================================
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4">
        <div className="space-y-2">
          <div className="h-3.5 w-20 rounded-md bg-slate-100" />
          <div className="h-3 w-12 rounded-md bg-slate-100/70" />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="h-6 w-24 rounded-lg bg-slate-100" />
      </td>
      <td className="px-5 py-4">
        <div className="space-y-2">
          <div className="h-3.5 w-36 rounded-md bg-slate-100" />
          <div className="h-3 w-20 rounded-md bg-slate-100/70" />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-100" />
          <div className="h-3.5 w-24 rounded-md bg-slate-100" />
        </div>
      </td>
      <td className="px-5 py-4 text-center">
        <div className="mx-auto h-6 w-20 rounded-full bg-slate-100" />
      </td>
      <td className="px-5 py-4 text-right">
        <div className="ml-auto h-4 w-20 rounded-md bg-slate-100" />
      </td>
    </tr>
  );
}

// ==========================================
// 6. Main Page Component
// ==========================================
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");

  // UI state
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("All");

  // --- Derived statistics ---
  const totalRevenue = useMemo(
    () => transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0),
    [transactions]
  );
  const totalBookings = transactions.length;
  const averageOrderValue = useMemo(
    () => (totalBookings ? totalRevenue / totalBookings : 0),
    [totalRevenue, totalBookings]
  );

  const uniqueStatuses = useMemo(
    () =>
      Array.from(new Set(transactions.map((t) => t.status))).filter(Boolean),
    [transactions]
  );

  // Search + Status filter
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchStatus =
        activeStatus === "All" ? true : t.status === activeStatus;
      if (!q) return matchStatus;
      const haystack = [
        t.bookingRef,
        t.customerName,
        t.description,
        t.airline,
        t.status,
      ]
        .join(" ")
        .toLowerCase();
      return matchStatus && haystack.includes(q);
    });
  }, [transactions, search, activeStatus]);

  // --- Data Loading ---
  const loadTransactions = async (
    cursor: string | null = null,
    reset = false
  ) => {
    setLoading(true);
    setError("");
    if (reset) {
      setTransactions([]);
      setNextCursor(null);
    }
    try {
      const result = await fetchTransactionsFromAPI(20, cursor);
      if (!result.success) {
        setError("Failed to load data");
        return;
      }
      const newData = result.data || [];
      setTransactions((prev) => (reset ? newData : [...prev, ...newData]));
      setNextCursor(result.meta?.after || null);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while loading transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatMoney = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="min-h-screen w-full bg-[#f8f9fb] p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        {/* ═══════════════════════════════════════
            HEADER
        ═══════════════════════════════════════ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Live Dashboard
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Transactions
            </h1>
            <p className="text-sm text-slate-500 max-w-lg">
              Track bookings, payments, and revenue. Filter by status or search
              by PNR.
            </p>
          </div>

          <button
            onClick={() => {
              setActiveStatus("All");
              setSearch("");
              loadTransactions(null, true);
            }}
            disabled={loading}
            className="inline-flex w-fit h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 shadow-2xl shadow-gray-100 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <svg
                className="h-3.5 w-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.137 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
            )}
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* ═══════════════════════════════════════
            STAT CARDS
        ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Revenue"
            value={`$${formatMoney(totalRevenue)}`}
            accent="bg-emerald-400"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            }
          />
          <StatCard
            label="Total Transactions"
            value={totalBookings.toLocaleString("en-US")}
            accent="bg-blue-400"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                />
              </svg>
            }
          />
          <StatCard
            label="Avg. Order Value"
            value={`$${formatMoney(averageOrderValue)}`}
            accent="bg-violet-400"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
                />
              </svg>
            }
          />
        </div>

        {/* ═══════════════════════════════════════
            ERROR BANNER
        ═══════════════════════════════════════ */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200/60 bg-rose-50 px-4 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-100">
              <svg
                className="h-4 w-4 text-rose-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-rose-800">{error}</p>
          </div>
        )}

        {/* ═══════════════════════════════════════
            FILTER / SEARCH BAR
        ═══════════════════════════════════════ */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PNR, customer, airline…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveStatus("All")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${
                activeStatus === "All"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {uniqueStatuses.map((status) => {
              const config = getStatusConfig(status);
              return (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${
                    activeStatus === status
                      ? "bg-slate-900 text-white shadow-sm"
                      : `${config.bg} ${config.text} hover:opacity-80`
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            DATA TABLE
        ═══════════════════════════════════════ */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
          {/* Table Meta Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                All Transactions
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredTransactions.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {transactions.length}
                </span>{" "}
                records
              </p>
            </div>
            <div className="text-[11px] text-slate-400">
              {nextCursor
                ? "↓ More available"
                : transactions.length > 0
                ? "✓ All loaded"
                : ""}
            </div>
          </div>

          {/* Table Scroll */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    PNR / Ref
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {/* Skeleton Loading */}
                {loading && transactions.length === 0 && (
                  <>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <SkeletonRow key={`skel-${i}`} />
                    ))}
                  </>
                )}

                {/* Data Rows */}
                {!loading &&
                  filteredTransactions.map((txn, index) => {
                    const statusConfig = getStatusConfig(txn.status);
                    const initials = txn.customerName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={txn.id || index}
                        className="group transition-colors duration-150 hover:bg-blue-50/30"
                      >
                        {/* Date */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <div className="text-[13px] font-medium text-slate-800">
                            {new Date(txn.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            {new Date(txn.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* PNR */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200/80">
                            {txn.bookingRef}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <div className="text-[13px] font-medium text-slate-800 truncate">
                            {txn.description}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            {txn.airline}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200/50">
                              {initials}
                            </div>
                            <span className="text-[13px] font-medium text-slate-800">
                              {txn.customerName}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.ring}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                            />
                            {txn.status}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                          <span className="text-[13px] font-bold text-slate-900">
                            {txn.currency} {formatMoney(txn.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                {/* Empty State */}
                {!loading && filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <svg
                          className="h-6 w-6 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                          />
                        </svg>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-700">
                        No transactions found
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Try clearing filters or create new bookings to see
                        activity.
                      </p>
                      <button
                        onClick={() => {
                          setSearch("");
                          setActiveStatus("All");
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 cursor-pointer"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {nextCursor && (
            <div className="border-t border-slate-100 px-5 py-3.5">
              <button
                onClick={() => loadTransactions(nextCursor)}
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:border-slate-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.137 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading…
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
                      />
                    </svg>
                    Load more transactions
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}