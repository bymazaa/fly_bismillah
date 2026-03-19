'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    Search,
    Plane,
    Calendar,
    Clock,
    Download,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    X,
    CheckCircle,
    XCircle,
    ShoppingCart,
    DollarSign,
    Copy,
    Eye,
    RefreshCcw,
    Timer,
    Users,
    TrendingUp,
    CreditCard,
    Wallet,
    ArrowUpRight,
    BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';
import IssueTicketModalNew from './components/IssueTicketModalNew';

// ══════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════

interface Booking {
    id: string;
    bookingRef: string;
    pnr: string;
    updatedAt: string | null;
    status: 'held' | 'issued' | 'cancelled' | 'expired' | 'processing' | 'failed';
    paymentStatus?: string;
    emailSent?: boolean;
    confirmationEmailSent?: boolean;
    retryCount?: number;
    canRetry?: boolean;
    isLiveMode?: boolean;
    flight: {
        airline: string;
        flightNumber: string;
        route: string;
        date: string | null;
        duration: string;
        tripType: 'one_way' | 'round_trip' | 'multi_city';
        logoUrl: string | null;
    };
    passengerName: string;
    passengerCount: number;
    contact: { email: string; phone: string };
    paymentSource: {
        holderName: string;
        cardNumber: string;
        expiryDate: string;
        billingAddress?: { zipCode?: string; [key: string]: any };
        zipCode?: string | null;
    } | null;
    amount: {
        total: number;
        base_amount: number;
        markup: number;
        currency: string;
    };
    timings: {
        deadline: string | null;
        createdAt: string;
        timeLeft: number;
    };
    actionData: { ticketUrl: string | null };
}

interface GlobalStats {
    total: number;
    issued: number;
    cancelled: number;
    pending: number;
    // ✅ Profit Breakdown
    totalMarkup: number;
    paymentProcessingFees: number;
    netProfit: number;
    currency: string;
}

type FilterType = 'all' | 'held' | 'issued' | 'cancelled';

// ══════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════

function safeFormat(dateStr: string | null | undefined, fmt: string, fallback = 'N/A') {
    if (!dateStr) return fallback;
    try {
        const d = new Date(dateStr);
        return isValid(d) ? format(d, fmt) : fallback;
    } catch {
        return fallback;
    }
}

const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const AVATAR_COLORS = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
];

function getAvatarColor(name: string) {
    return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function getPageNumbers(current: number, total: number): number[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set<number>([1, total]);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.add(i);
    }
    return Array.from(pages).sort((a, b) => a - b);
}

// ══════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════

function CountdownTimer({ deadline }: { deadline: string }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calc = () => {
            const diff = new Date(deadline).getTime() - Date.now();
            if (diff <= 0) {
                setIsUrgent(false);
                return 'Expired';
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setIsUrgent(diff < 3600000);
            return `${h}h ${m}m ${s}s`;
        };
        setTimeLeft(calc());
        const t = setInterval(() => setTimeLeft(calc()), 1000);
        return () => clearInterval(t);
    }, [deadline]);

    if (timeLeft === 'Expired') {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                <Clock size={9} /> Expired
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                isUrgent
                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60'
                    : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
            }`}
        >
            <Timer size={9} />
            {timeLeft}
        </span>
    );
}

function StatusBadge({ status }: { status: Booking['status'] }) {
    const map: Record<
        string,
        { label: string; dot: string; bg: string; text: string; ring: string }
    > = {
        issued: {
            label: 'Issued',
            dot: 'bg-emerald-500',
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            ring: 'ring-emerald-200/60',
        },
        held: {
            label: 'Held',
            dot: 'bg-amber-500',
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            ring: 'ring-amber-200/60',
        },
        cancelled: {
            label: 'Cancelled',
            dot: 'bg-gray-400',
            bg: 'bg-gray-50',
            text: 'text-gray-600',
            ring: 'ring-gray-200/60',
        },
        expired: {
            label: 'Expired',
            dot: 'bg-rose-500',
            bg: 'bg-rose-50',
            text: 'text-rose-600',
            ring: 'ring-rose-200/60',
        },
        processing: {
            label: 'Processing',
            dot: 'bg-blue-500',
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            ring: 'ring-blue-200/60',
        },
        failed: {
            label: 'Failed',
            dot: 'bg-red-500',
            bg: 'bg-red-50',
            text: 'text-red-700',
            ring: 'ring-red-200/60',
        },
    };
    const d = map[status] || map.cancelled;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${d.bg} ${d.text} ${d.ring}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${d.dot}`} />
            {d.label}
        </span>
    );
}

function StatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    iconBg,
    iconColor,
    badge,
}: {
    label: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    iconBg: string;
    iconColor: string;
    badge?: { text: string; color: string };
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/60">
            <div className="relative">
                <div className="flex items-center justify-between">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition-transform duration-300 group-hover:scale-110`}
                    >
                        <Icon className="h-[18px] w-[18px]" />
                    </div>
                    {badge && (
                        <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.color}`}
                        >
                            {badge.text}
                        </span>
                    )}
                </div>
                <p className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900 tabular-nums">
                    {value}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{label}</p>
                {subtitle && <p className="mt-1 text-[11px] text-gray-400">{subtitle}</p>}
            </div>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="space-y-2 flex-[1.2]">
                        <div className="h-3.5 w-20 rounded-md bg-gray-100" />
                        <div className="h-5 w-16 rounded-md bg-gray-100" />
                    </div>
                    <div className="flex items-center gap-2.5 flex-[1.5]">
                        <div className="h-9 w-9 rounded-full bg-gray-100" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-28 rounded-md bg-gray-100" />
                            <div className="h-3 w-20 rounded-md bg-gray-50" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-[1.3]">
                        <div className="h-8 w-8 rounded-full bg-gray-100" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-24 rounded-md bg-gray-100" />
                            <div className="h-3 w-32 rounded-md bg-gray-50" />
                        </div>
                    </div>
                    <div className="space-y-2 flex-1">
                        <div className="h-3 w-20 rounded-md bg-gray-100" />
                        <div className="h-5 w-16 rounded-full bg-gray-100" />
                    </div>
                    <div className="flex-[0.7] text-right">
                        <div className="ml-auto h-4 w-16 rounded-md bg-gray-100" />
                    </div>
                    <div className="flex gap-2 flex-[0.8] justify-end">
                        <div className="h-8 w-8 rounded-lg bg-gray-100" />
                        <div className="h-8 w-16 rounded-lg bg-gray-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════

export default function BookingsDashboard() {
    const router = useRouter();

    // ── Data state ──
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const searchTimer = useRef<NodeJS.Timeout | null>(null);

    // ── Modal state ──
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    // ── Global Stats from API ──
    const [globalStats, setGlobalStats] = useState<GlobalStats>({
        total: 0,
        issued: 0,
        cancelled: 0,
        pending: 0,
        totalMarkup: 0,
        paymentProcessingFees: 0,
        netProfit: 0,
        currency: 'USD',
    });
    const [statsLoaded, setStatsLoaded] = useState(false);

    // ── Debounce search ──
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [search]);

    // ── Fetch bookings ──
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
            });
            if (filter !== 'all') params.set('status', filter);
            if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

            const res = await axios.get(`/api/dashboard/bookings?${params}`);
            if (res.data.success) {
                setBookings(res.data.data);
                setTotalPages(res.data.meta.totalPages);
                setTotalCount(res.data.meta.total);
            }
        } catch {
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    }, [page, filter, debouncedSearch]);

    // ── Fetch global stats from dashboard API ──
    const fetchStats = useCallback(async () => {
        try {
            const res = await axios.get('/api/dashboard/stats');
            if (res.data.success) {
                const kpi = res.data.data.kpi;
                setGlobalStats({
                    total: kpi.totalBookings || 0,
                    issued: kpi.confirmedBookings || 0,
                    cancelled: kpi.cancelledBookings || 0,
                    pending: kpi.pendingBookings || 0,
                    totalMarkup: kpi.totalMarkup || 0,
                    paymentProcessingFees: kpi.paymentProcessingFees || 0,
                    netProfit: kpi.netProfit || 0,
                    currency: kpi.currency || 'USD',
                });
                setStatsLoaded(true);
            }
        } catch {
            console.warn('Stats API unavailable, using local calculation');
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings, refreshKey]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats, refreshKey]);

    // ── Handlers ──
    const handlePageChange = (n: number) => {
        if (n >= 1 && n <= totalPages) setPage(n);
    };

    const handleFilterChange = (f: FilterType) => {
        setFilter(f);
        setPage(1);
    };

    const handleViewDetails = (booking: Booking) => {
        const hasPnr = booking.pnr && booking.pnr !== '---';
        router.push(
            hasPnr
                ? `/admin/bookings/${booking.id}`
                : `/admin/bookings/failed/${booking.bookingRef}`,
        );
    };

    const openIssueModal = (b: Booking) => {
        setSelectedBooking(b);
        setIssueModalOpen(true);
    };

    const closeIssueModal = () => {
        setIssueModalOpen(false);
        setTimeout(() => setSelectedBooking(null), 200);
    };

    const handleIssueSuccess = () => {
        closeIssueModal();
        setRefreshKey((p) => p + 1);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied');
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setRefreshKey((p) => p + 1);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    // ══════════════════════════════════════════
    // ✅ STATS — Use global API stats, fallback to local
    // ══════════════════════════════════════════

    const stats = useMemo(() => {
        // ✅ If global stats loaded from API, use them (accurate across ALL bookings)
        if (statsLoaded && globalStats.total > 0) {
            return globalStats;
        }

        // Fallback: calculate from current page bookings (less accurate but works)
        const issuedBookings = bookings.filter((b) => b.status === 'issued');

        let localMarkup = 0;
        let localFees = 0;
        let localProfit = 0;

        issuedBookings.forEach((b) => {
            const markup = b.amount.markup || 0;
            const processingFee = (b.amount.total || 0) * 0.029;
            const realProfit = markup - processingFee;

            localMarkup += markup;
            localFees += processingFee;
            localProfit += realProfit;
        });

        return {
            total: totalCount,
            issued: issuedBookings.length,
            cancelled: bookings.filter((b) => b.status === 'cancelled').length,
            pending: bookings.filter((b) => b.status === 'held' || b.status === 'processing')
                .length,
            totalMarkup: localMarkup,
            paymentProcessingFees: localFees,
            netProfit: localProfit,
            currency: bookings[0]?.amount?.currency || 'USD',
        };
    }, [bookings, totalCount, globalStats, statsLoaded]);

    const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

    const profitMargin =
        stats.totalMarkup > 0
            ? ((stats.netProfit / stats.totalMarkup) * 100).toFixed(1)
            : '0';

    // ══════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════

    return (
        <div className="min-h-screen w-full bg-white p-4 md:p-6 lg:p-8 ">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
                {/* ═══════════════════ HEADER ═══════════════════ */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25">
                                <Plane className="h-4 w-4 text-white -rotate-45" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block">
                                    Operations · Bookings
                                </span>
                                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl leading-none">
                                    Bookings Dashboard
                                </h1>
                            </div>
                        </div>
                        <p className="text-[13px] text-gray-400 max-w-lg pl-[46px]">
                            Monitor flight reservations, issue tickets and track profit.
                        </p>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                        className="group w-fit inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] cursor-pointer shadow-sm"
                    >
                        <RefreshCcw
                            className={`h-3.5 w-3.5 transition-transform ${
                                isRefreshing ? 'animate-spin' : 'group-hover:rotate-90'
                            }`}
                        />
                        {isRefreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>

                {/* ═══════════════════ PROFIT HERO BAR ═══════════════════ */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 overflow-hidden">
                    <div className="grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 sm:grid-cols-4">
                        {[
                            {
                                label: 'Total Markup',
                                value: `${stats.currency} ${formatCurrency(stats.totalMarkup)}`,
                                icon: Wallet,
                                color: 'text-indigo-600',
                                bg: 'bg-indigo-50',
                                sub: 'Commission + Fees (DB)',
                            },
                            {
                                label: 'Processing Fees',
                                value: `${stats.currency} ${formatCurrency(stats.paymentProcessingFees)}`,
                                icon: CreditCard,
                                color: 'text-orange-600',
                                bg: 'bg-orange-50',
                                sub: 'Duffel 2.9% of total',
                            },
                            {
                                label: 'Net Profit',
                                value: `${stats.currency} ${formatCurrency(stats.netProfit)}`,
                                icon: TrendingUp,
                                color: 'text-emerald-600',
                                bg: 'bg-emerald-50',
                                sub: `${profitMargin}% of markup retained`,
                            },
                            {
                                label: 'Pending Revenue',
                                value: `${stats.pending} bookings`,
                                icon: BarChart3,
                                color: 'text-amber-600',
                                bg: 'bg-amber-50',
                                sub: 'Awaiting ticket issue',
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
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                        {item.label}
                                    </span>
                                    <span className="text-lg font-extrabold text-gray-900 tabular-nums leading-tight block">
                                        {item.value}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{item.sub}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════ STAT CARDS ═══════════════════ */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Bookings"
                        value={stats.total.toLocaleString()}
                        subtitle="All live bookings"
                        icon={ShoppingCart}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                    <StatCard
                        label="Issued"
                        value={stats.issued.toLocaleString()}
                        subtitle="Tickets confirmed"
                        icon={CheckCircle}
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                        badge={
                            stats.total > 0
                                ? {
                                      text: `${((stats.issued / stats.total) * 100).toFixed(0)}%`,
                                      color: 'bg-emerald-50 text-emerald-600',
                                  }
                                : undefined
                        }
                    />
                    <StatCard
                        label="Cancelled"
                        value={stats.cancelled.toLocaleString()}
                        subtitle="Failed or expired"
                        icon={XCircle}
                        iconBg="bg-rose-50"
                        iconColor="text-rose-600"
                    />
                    <StatCard
                        label="Net Profit"
                        value={`${stats.currency} ${formatCurrency(stats.netProfit)}`}
                        subtitle="After Duffel 2.9% fees"
                        icon={DollarSign}
                        iconBg="bg-amber-50"
                        iconColor="text-amber-600"
                        badge={
                            stats.netProfit > 0
                                ? {
                                      text: `↑ ${profitMargin}%`,
                                      color: 'bg-emerald-50 text-emerald-600',
                                  }
                                : undefined
                        }
                    />
                </div>

                {/* ═══════════════════ CONTROLS ═══════════════════ */}
                <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search PNR, reference, passenger…"
                                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl bg-gray-100/60 p-1">
                        {(['all', 'held', 'issued', 'cancelled'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => handleFilterChange(s)}
                                className={`rounded-lg px-4 py-2 text-[11px] font-bold capitalize transition-all cursor-pointer ${
                                    filter === s
                                        ? 'bg-gray-900 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
                                }`}
                            >
                              <span className='text-[11px] py-2'>  {s}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════ TABLE ═══════════════════ */}
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    {/* Table header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">All Bookings</h2>
                            <p className="mt-0.5 text-[11px] text-gray-400">
                                Showing{' '}
                                <span className="font-bold text-gray-700">{bookings.length}</span>{' '}
                                of <span className="font-bold text-gray-700">{totalCount}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500 tabular-nums">
                                Page {page} / {totalPages}
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <TableSkeleton />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-50 bg-gray-50/40">
                                            {[
                                                'Ref / PNR',
                                                'Flight',
                                                'Passenger',
                                                'Date & Status',
                                                'Amount & Profit',
                                                'Actions',
                                            ].map((h, i) => (
                                                <th
                                                    key={h}
                                                    className={`px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${
                                                        i === 4 ? 'text-center' : ''
                                                    } ${i === 5 ? 'text-right' : ''}`}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {bookings.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-20 text-center">
                                                    <div className="mx-auto flex flex-col items-center gap-3">
                                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                                                            <Plane className="h-6 w-6 text-gray-300" />
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-700">
                                                            No bookings found
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Try adjusting search or filters
                                                        </p>
                                                        {(search || filter !== 'all') && (
                                                            <button
                                                                onClick={() => {
                                                                    setSearch('');
                                                                    setFilter('all');
                                                                    setPage(1);
                                                                }}
                                                                className="mt-1 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 cursor-pointer transition-colors"
                                                            >
                                                                Clear filters
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            bookings.map((booking) => {
                                                const hasPnr =
                                                    booking.pnr && booking.pnr !== '---';
                                                const initials = getInitials(
                                                    booking.passengerName,
                                                );
                                                const issueDisabled =
                                                    booking.canRetry === false;

                                                // ✅ Per-booking profit calculation
                                                const markup = booking.amount.markup || 0;
                                                const processingFee =
                                                    (booking.amount.total || 0) * 0.029;
                                                const realProfit = markup - processingFee;
                                                const isIssued = booking.status === 'issued';

                                                return (
                                                    <tr
                                                        key={booking.id}
                                                        className={`group transition-colors ${
                                                            booking.status === 'held'
                                                                ? 'hover:bg-amber-50/30'
                                                                : 'hover:bg-gray-50/60'
                                                        }`}
                                                    >
                                                        {/* Ref / PNR */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="space-y-1.5">
                                                                <p className="text-[12px] font-bold text-gray-800">
                                                                    {booking.bookingRef}
                                                                </p>
                                                                {hasPnr ? (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleCopy(booking.pnr)
                                                                        }
                                                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-900 px-2 py-1 font-mono !text-[10px] font-bold text-white hover:bg-gray-700 active:scale-95 transition-all"
                                                                        title="Copy PNR"
                                                                    >
                                                                       <span > {booking.pnr}</span>
                                                                        <Copy
                                                                            size={9}
                                                                            className="text-gray-400"
                                                                        />
                                                                    </button>
                                                                ) : (
                                                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">
                                                                        No PNR
                                                                    </span>
                                                                )}
                                                                {booking.isLiveMode === false && (
                                                                    <span className="inline-flex items-center gap-0.5 rounded-[4px] bg-orange-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-orange-600 border border-orange-200/80">
                                                                        Test
                                                                    </span>
                                                                )}
                                                                {booking.emailSent && (
                                                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-200/60">
                                                                        ✉ Sent
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Flight */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="flex items-start gap-2.5">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                                                                    {booking.flight.logoUrl ? (
                                                                        <img
                                                                            src={
                                                                                booking.flight
                                                                                    .logoUrl
                                                                            }
                                                                            alt=""
                                                                            className="h-full w-full object-contain p-1"
                                                                            onError={(e) => {
                                                                                (
                                                                                    e.target as HTMLImageElement
                                                                                ).style.display =
                                                                                    'none';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <Plane
                                                                            size={14}
                                                                            className="text-gray-400"
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[180px]">
                                                                        {booking.flight.route}
                                                                    </p>
                                                                    <p className="mt-0.5 text-[11px] text-gray-500">
                                                                        {booking.flight.airline}
                                                                        {booking.flight
                                                                            .flightNumber &&
                                                                            ` · ${booking.flight.flightNumber}`}
                                                                    </p>
                                                                    <span className="mt-1 inline-flex rounded-[4px] bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                                        {booking.flight.tripType.replace(
                                                                            /_/g,
                                                                            ' ',
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Passenger */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="flex items-center gap-2.5">
                                                                <div
                                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(booking.passengerName)} text-[10px] font-bold text-white shadow-sm`}
                                                                >
                                                                    {initials}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[150px]">
                                                                        {booking.passengerName}
                                                                    </p>
                                                                    <p className="mt-0.5 text-[11px] text-gray-400 truncate max-w-[160px]">
                                                                        {booking.contact.email}
                                                                    </p>
                                                                    {booking.passengerCount > 1 && (
                                                                        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-gray-400">
                                                                            <Users size={9} />+
                                                                            {booking.passengerCount -
                                                                                1}{' '}
                                                                            travelers
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Date & Status */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                                                    <Calendar
                                                                        size={11}
                                                                        className="text-gray-400"
                                                                    />
                                                                    <span className="font-medium">
                                                                        {safeFormat(
                                                                            booking.flight.date,
                                                                            'dd MMM yyyy',
                                                                            'No date',
                                                                        )}
                                                                    </span>
                                                                    {booking.flight.date && (
                                                                        <>
                                                                            <span className="text-gray-300">
                                                                                ·
                                                                            </span>
                                                                            <span className="text-gray-500">
                                                                                {safeFormat(
                                                                                    booking.flight
                                                                                        .date,
                                                                                    'hh:mm a',
                                                                                )}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <StatusBadge
                                                                    status={booking.status}
                                                                />
                                                                {booking.status === 'held' &&
                                                                    booking.timings.deadline && (
                                                                        <CountdownTimer
                                                                            deadline={
                                                                                booking.timings
                                                                                    .deadline
                                                                            }
                                                                        />
                                                                    )}
                                                                {booking.canRetry === false &&
                                                                    booking.status === 'held' && (
                                                                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 ring-1 ring-rose-200/60">
                                                                            <AlertCircle size={9} />{' '}
                                                                            Max retry
                                                                        </span>
                                                                    )}
                                                                <p className="text-[10px] text-gray-400">
                                                                    Updated:{' '}
                                                                    {safeFormat(
                                                                        booking.updatedAt,
                                                                        'dd MMM, hh:mm a',
                                                                        'Never',
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        {/* ✅ Amount & Profit — FIXED */}
                                                        <td className="px-5 py-4 text-center align-top">
                                                            <div className="space-y-0">
                                                                {/* Total Amount */}
                                                                <div className="flex items-center justify-between py-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                                            Total
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-gray-900 tabular-nums">
                                                                        {booking.amount.currency}{' '}
                                                                        {formatCurrency(
                                                                            booking.amount.total,
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {markup > 0 && (
                                                                    <>
                                                                        {/* Markup (DB) */}
                                                                        <div className="flex items-center justify-between py-1 border-t border-gray-50">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                                    Markup
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-[10px] font-semibold text-indigo-600 tabular-nums">
                                                                                {
                                                                                    booking.amount
                                                                                        .currency
                                                                                }{' '}
                                                                                {formatCurrency(
                                                                                    markup,
                                                                                )}
                                                                            </span>
                                                                        </div>

                                                                        {/* Processing Fee */}
                                                                        <div className="flex items-center justify-between py-1 border-t border-gray-50">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                                    Fee{' '}
                                                                                    <span className="text-gray-300">
                                                                                        2.9%
                                                                                    </span>
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-[10px] font-semibold text-orange-500 tabular-nums">
                                                                                −
                                                                                {
                                                                                    booking.amount
                                                                                        .currency
                                                                                }{' '}
                                                                                {formatCurrency(
                                                                                    processingFee,
                                                                                )}
                                                                            </span>
                                                                        </div>

                                                                        {/* Real Profit */}
                                                                        <div className="flex items-center justify-between py-1.5 border-t border-gray-100 mt-0.5">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                                <span className="text-[10px] text-gray-500 font-bold">
                                                                                    Profit
                                                                                </span>
                                                                            </div>
                                                                            <span
                                                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                                                                                    isIssued
                                                                                        ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60'
                                                                                        : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200/60'
                                                                                }`}
                                                                            >
                                                                                {isIssued
                                                                                    ? '+'
                                                                                    : '~'}
                                                                                {
                                                                                    booking.amount
                                                                                        .currency
                                                                                }{' '}
                                                                                {formatCurrency(
                                                                                    realProfit,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {markup === 0 && (
                                                                    <span className="text-[10px] text-gray-300">
                                                                        No markup
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-5 py-4 text-right align-top">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {booking.status === 'issued' &&
                                                                    (booking.actionData
                                                                        .ticketUrl ? (
                                                                        <a
                                                                            href={
                                                                                booking.actionData
                                                                                    .ticketUrl
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all"
                                                                            title="Download ticket"
                                                                        >
                                                                            <Download size={14} />
                                                                        </a>
                                                                    ) : (
                                                                        <span
                                                                            title="No ticket URL"
                                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                                                                        >
                                                                            <Download size={14} />
                                                                        </span>
                                                                    ))}

                                                                <button
                                                                    onClick={() =>
                                                                        handleViewDetails(booking)
                                                                    }
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 cursor-pointer transition-all"
                                                                    title="View details"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>

                                                                {booking.status === 'held' && (
                                                                    <button
                                                                        onClick={() =>
                                                                            !issueDisabled &&
                                                                            openIssueModal(booking)
                                                                        }
                                                                        disabled={issueDisabled}
                                                                        title={
                                                                            issueDisabled
                                                                                ? 'Max retry reached'
                                                                                : 'Issue ticket'
                                                                        }
                                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-bold shadow-sm transition-all ${
                                                                            issueDisabled
                                                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                                : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.97] cursor-pointer'
                                                                        }`}
                                                                    >
                                                                        Issue
                                                                        <ArrowUpRight size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                                    <p className="text-[11px] text-gray-400">
                                        Page{' '}
                                        <span className="font-bold text-gray-600">{page}</span> of{' '}
                                        <span className="font-bold text-gray-600">
                                            {totalPages}
                                        </span>
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handlePageChange(page - 1)}
                                            disabled={page === 1}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                                        >
                                            <ChevronLeft size={15} />
                                        </button>
                                        {pageNumbers.map((pn, idx) => {
                                            const prev = pageNumbers[idx - 1];
                                            const gap = prev && pn - prev > 1;
                                            return (
                                                <div
                                                    key={pn}
                                                    className="flex items-center gap-1.5"
                                                >
                                                    {gap && (
                                                        <span className="px-1 text-[11px] text-gray-400">
                                                            …
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => handlePageChange(pn)}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                                            page === pn
                                                                ? 'bg-gray-900 text-white shadow-sm'
                                                                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pn}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <button
                                            onClick={() => handlePageChange(page + 1)}
                                            disabled={page === totalPages}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                                        >
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>



            {/* ═══════ ISSUE TICKET MODAL ═══════ */}
            {selectedBooking && (
                <IssueTicketModalNew
                    open={issueModalOpen}
                    onClose={closeIssueModal}
                    onSuccess={handleIssueSuccess}
                    bookingId={selectedBooking.id}
                    bookingRef={selectedBooking.bookingRef}
                    pnr={selectedBooking.pnr !== '---' ? selectedBooking.pnr : 'N/A'}
                    finance={{
                        basePrice: String(selectedBooking.amount?.base_amount ?? 0),
                        tax: '0',
                        clientTotal: String(
                            (selectedBooking.amount?.total ?? 0).toFixed(2),
                        ),
                        currency: selectedBooking.amount?.currency || 'GBP',
                        yourMarkup: selectedBooking.amount?.markup ?? 0,
                        duffelTotal: String(
                            (selectedBooking.amount?.base_amount ?? 0).toFixed(2),
                        ),
                    }}
                    paymentSource={
                        selectedBooking.paymentSource
                            ? {
                                  holderName:
                                      selectedBooking.paymentSource.holderName || '',
                                  cardNumber:
                                      selectedBooking.paymentSource.cardNumber || '',
                                  expiryDate:
                                      selectedBooking.paymentSource.expiryDate || '',
                                  cvv: null,
                                  billingAddress:
                                      selectedBooking.paymentSource.billingAddress,
                                  zipCode: selectedBooking.paymentSource.zipCode,
                              }
                            : null
                    }
                />
            )}


        </div>
    );
}