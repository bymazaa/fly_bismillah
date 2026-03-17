'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
    RefreshCcw as RefreshCcwIcon,
    ArrowUpRight,
    Timer,
    Users,
    TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';
import IssueTicketModalNew from './components/IssueTicketModalNew';

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
    contact: {
        email: string;
        phone: string;
    };
    paymentSource: {
        holderName: string;
        cardNumber: string;
        expiryDate: string;
        billingAddress?: {
            zipCode?: string;
            [key: string]: any;
        };
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
    actionData: {
        ticketUrl: string | null;
    };
}

interface GlobalStats {
    total: number;
    issued: number;
    cancelled: number;
    pending: number;
    profit: number;
    currency: string;
}

function safeFormatDate(
    dateStr: string | null | undefined,
    formatStr: string,
    fallback: string = 'N/A',
): string {
    if (!dateStr) return fallback;
    try {
        const d = new Date(dateStr);
        if (!isValid(d)) return fallback;
        return format(d, formatStr);
    } catch {
        return fallback;
    }
}

const CountdownTimer = ({ deadline }: { deadline: string }) => {
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

    if (timeLeft === 'Expired')
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                <Clock size={9} />
                Expired
            </span>
        );

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
};

const StatusBadge = ({ status }: { status: Booking['status'] }) => {
    const map: Record<
        Booking['status'],
        { label: string; dot: string; bg: string; text: string; ring: string }
    > = {
        issued: { label: 'Issued', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/60' },
        held: { label: 'Held', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200/60' },
        cancelled: { label: 'Cancelled', dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200/60' },
        expired: { label: 'Expired', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-200/60' },
        processing: { label: 'Processing', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200/60' },
        failed: { label: 'Failed', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200/60' },
    };
    const d = map[status] || map.cancelled;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${d.bg} ${d.text} ${d.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${d.dot}`} />
            {d.label}
        </span>
    );
};

function StatCard({ label, value, icon: Icon, accentColor, trend }: {
    label: string; value: string | number; icon: any; accentColor: string; trend?: string;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/60">
            <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-[0.07] ${accentColor}`} />
            <div className="relative flex items-start justify-between">
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
                    <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
                    {trend && (
                        <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                            <TrendingUp size={11} />{trend}
                        </p>
                    )}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="space-y-2 flex-[1.2]">
                        <div className="h-3.5 w-20 rounded-md bg-slate-100" />
                        <div className="h-5 w-16 rounded-md bg-slate-100" />
                    </div>
                    <div className="flex items-center gap-2.5 flex-[1.5]">
                        <div className="h-9 w-9 rounded-full bg-slate-100" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-28 rounded-md bg-slate-100" />
                            <div className="h-3 w-20 rounded-md bg-slate-100/70" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-[1.3]">
                        <div className="h-8 w-8 rounded-full bg-slate-100" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-24 rounded-md bg-slate-100" />
                            <div className="h-3 w-32 rounded-md bg-slate-100/70" />
                        </div>
                    </div>
                    <div className="space-y-2 flex-1">
                        <div className="h-3 w-20 rounded-md bg-slate-100" />
                        <div className="h-5 w-16 rounded-full bg-slate-100" />
                    </div>
                    <div className="flex-[0.7] text-right">
                        <div className="ml-auto h-4 w-16 rounded-md bg-slate-100" />
                    </div>
                    <div className="flex gap-2 flex-[0.8] justify-end">
                        <div className="h-8 w-8 rounded-lg bg-slate-100" />
                        <div className="h-8 w-16 rounded-lg bg-slate-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

const getAvatarColor = (name: string) => {
    const colors = [
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-emerald-500 to-teal-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-cyan-500 to-sky-600',
    ];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

function getPageNumbers(current: number, total: number): number[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.add(i);
    }
    return Array.from(pages).sort((a, b) => a - b);
}

export default function BookingsDashboard() {
    const router = useRouter();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'held' | 'issued' | 'cancelled'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // ✅ Issue Modal — শুধু open/close + selected booking
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const [globalStats, setGlobalStats] = useState<GlobalStats>({
        total: 0, issued: 0, cancelled: 0, pending: 0, profit: 0, currency: 'USD',
    });

    const [refreshKey, setRefreshKey] = useState(0);

    const fetchBookings = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(pageNum),
                limit: '20',
                ...(filter !== 'all' && { status: filter }),
                ...(search.trim() && { search: search.trim() }),
            });
            const res = await axios.get(`/api/dashboard/bookings?${params.toString()}`);
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
    }, [filter, search]);

    const fetchGlobalStats = useCallback(async () => {
        try {
            const res = await axios.get('/api/dashboard/stats');
            if (res.data.success) {
                const kpi = res.data.data.kpi;
                setGlobalStats({
                    total: kpi.totalBookings || 0,
                    issued: kpi.confirmedBookings || 0,
                    cancelled: kpi.cancelledBookings || 0,
                    pending: kpi.pendingBookings || 0,
                    profit: kpi.netProfit || 0,
                    currency: kpi.currency || 'USD',
                });
            }
        } catch {
            console.warn('Stats API unavailable, using page-level fallback');
        }
    }, []);

    useEffect(() => { fetchBookings(page); }, [page, refreshKey, fetchBookings]);
    useEffect(() => { fetchGlobalStats(); }, [refreshKey, fetchGlobalStats]);

    const handlePageChange = (n: number) => {
        if (n >= 1 && n <= totalPages) setPage(n);
    };

    const handleViewDetails = (booking: Booking) => {
        const hasPnr = booking.pnr && booking.pnr !== '---';
        if (hasPnr) {
            router.push(`/admin/bookings/${booking.id}`);
        } else {
            router.push(`/admin/bookings/failed/${booking.bookingRef}`);
        }
    };

    // ✅ শুধু modal open করে, বাকি সব modal component handle করে
    const openIssueModal = (b: Booking) => {
        setSelectedBooking(b);
        setIssueModalOpen(true);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setRefreshKey((prev) => prev + 1);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const stats = useMemo(() => {
        if (globalStats.total > 0) return globalStats;
        return {
            total: totalCount,
            issued: bookings.filter((b) => b.status === 'issued').length,
            cancelled: bookings.filter((b) => b.status === 'cancelled').length,
            pending: bookings.filter((b) => b.status === 'held' || b.status === 'processing').length,
            profit: bookings.filter((b) => b.status === 'issued').reduce((acc, c) => acc + (c.amount.markup || 0), 0),
            currency: 'USD',
        };
    }, [bookings, totalCount, globalStats]);

    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const t = search.toLowerCase();
            const matchSearch =
                !t ||
                b.bookingRef.toLowerCase().includes(t) ||
                b.pnr?.toLowerCase().includes(t) ||
                b.passengerName.toLowerCase().includes(t) ||
                b.contact?.email?.toLowerCase().includes(t);
            const matchFilter = filter === 'all' || b.status === filter;
            return matchSearch && matchFilter;
        });
    }, [bookings, search, filter]);

    const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

    return (
        <div className="min-h-screen w-full bg-[#f8f9fb] p-4 md:p-6 lg:p-8">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
                {/* ─── HEADER ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                Operations · Bookings
                            </span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Bookings Dashboard
                        </h1>
                        <p className="text-sm text-slate-500 max-w-lg">
                            Monitor flight reservations, issue tickets and track profit in real time.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-emerald-50/50 px-4 py-2.5 shadow-2xl shadow-gray-100">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <TrendingUp size={15} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Profit so far</p>
                            <p className="text-base font-extrabold tracking-tight text-emerald-800">
                                {stats.currency} {stats.profit.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── STAT CARDS ─── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Bookings" value={stats.total.toLocaleString()} icon={ShoppingCart} accentColor="bg-blue-500" />
                    <StatCard label="Issued" value={stats.issued.toLocaleString()} icon={CheckCircle} accentColor="bg-emerald-500" />
                    <StatCard label="Cancelled" value={stats.cancelled.toLocaleString()} icon={XCircle} accentColor="bg-rose-500" />
                    <StatCard label="Total Profit" value={`${stats.currency} ${stats.profit.toFixed(2)}`} icon={DollarSign} accentColor="bg-amber-500" />
                </div>

                {/* ─── CONTROLS ─── */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search PNR, reference, passenger, email…"
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                            {search && (
                                <button
                                    onClick={() => { setSearch(''); setPage(1); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button
                            title="Refresh"
                            onClick={handleRefresh}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all active:scale-95 cursor-pointer"
                        >
                            <RefreshCcwIcon size={15} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100/80 p-1">
                        {(['all', 'held', 'issued', 'cancelled'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => { setFilter(s); setPage(1); }}
                                className={`rounded-lg px-3.5 py-1.5 text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                                    filter === s
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── TABLE ─── */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">All Bookings</h2>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                Showing <span className="font-semibold text-slate-700">{filteredBookings.length}</span>{' '}
                                of <span className="font-semibold text-slate-700">{totalCount}</span> bookings
                            </p>
                        </div>
                        <div className="text-[11px] text-slate-400">Page {page} of {totalPages}</div>
                    </div>

                    {loading ? (
                        <TableSkeleton />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60">
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ref / PNR</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Flight</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Passenger</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Date & Status</th>
                                            <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</th>
                                            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredBookings.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-20 text-center">
                                                    <div className="mx-auto flex flex-col items-center gap-3">
                                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                                            <Plane className="h-6 w-6 text-slate-300" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-700">No bookings found</p>
                                                        <p className="text-xs text-slate-500">Try adjusting your search or filters</p>
                                                        {(search || filter !== 'all') && (
                                                            <button
                                                                onClick={() => { setSearch(''); setFilter('all'); setPage(1); }}
                                                                className="mt-1 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
                                                            >
                                                                Clear filters
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredBookings.map((booking) => {
                                                const hasPnr = booking.pnr && booking.pnr !== '---';
                                                const initials = booking.passengerName
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase();
                                                const issueDisabled = booking.canRetry === false;

                                                return (
                                                    <tr
                                                        key={booking.id}
                                                        className={`group transition-colors duration-150 ${
                                                            booking.status === 'held'
                                                                ? 'hover:bg-amber-50/30 bg-amber-50/10'
                                                                : 'hover:bg-blue-50/30'
                                                        }`}
                                                    >
                                                        {/* ── Ref / PNR ── */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="space-y-1.5">
                                                                <p className="text-[12px] font-bold text-slate-800">{booking.bookingRef}</p>
                                                                {hasPnr ? (
                                                                    <button
                                                                        onClick={() => handleCopy(booking.pnr)}
                                                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-2 py-1 font-mono text-[10px] font-bold text-white transition-all hover:bg-slate-700 active:scale-95"
                                                                        title="Copy PNR"
                                                                    >
                                                                        {booking.pnr}
                                                                        <Copy size={9} className="text-slate-400" />
                                                                    </button>
                                                                ) : (
                                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                                                                        No PNR
                                                                    </span>
                                                                )}
                                                                {booking.emailSent && (
                                                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-200/60">
                                                                        ✉ Sent
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* ── Flight ── */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="flex items-start gap-2.5">
                                                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                                                    {booking.flight.logoUrl ? (
                                                                        <img
                                                                            src={booking.flight.logoUrl}
                                                                            alt=""
                                                                            className="h-full w-full object-contain p-1"
                                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                        />
                                                                    ) : (
                                                                        <Plane size={14} className="text-slate-400" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-semibold text-slate-900 truncate max-w-[180px]">
                                                                        {booking.flight.route}
                                                                    </p>
                                                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                                                        {booking.flight.airline}
                                                                        {booking.flight.flightNumber && ` · ${booking.flight.flightNumber}`}
                                                                    </p>
                                                                    <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                                        {booking.flight.tripType.split('_').join(' ')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* ── Passenger ── */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(booking.passengerName)} text-[10px] font-bold text-white shadow-sm`}>
                                                                    {initials}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-semibold text-slate-900 truncate max-w-[150px]">{booking.passengerName}</p>
                                                                    <p className="mt-0.5 text-[11px] text-slate-500 truncate max-w-[160px]">{booking.contact.email}</p>
                                                                    {booking.passengerCount > 1 && (
                                                                        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-slate-400">
                                                                            <Users size={9} />+{booking.passengerCount - 1} travelers
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* ── Date & Status ── */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                                                                    <Calendar size={11} className="text-slate-400" />
                                                                    <span className="font-medium">
                                                                        {safeFormatDate(booking.flight.date, 'dd MMM yyyy', 'No date')}
                                                                    </span>
                                                                    {booking.flight.date && (
                                                                        <>
                                                                            <span className="text-slate-400">·</span>
                                                                            <span className="text-slate-500">
                                                                                {safeFormatDate(booking.flight.date, 'hh:mm a')}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <StatusBadge status={booking.status} />
                                                                {booking.status === 'held' && booking.timings.deadline && (
                                                                    <CountdownTimer deadline={booking.timings.deadline} />
                                                                )}
                                                                {booking.canRetry === false && booking.status === 'held' && (
                                                                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 ring-1 ring-rose-200/60">
                                                                        <AlertCircle size={9} /> Max retry
                                                                    </span>
                                                                )}
                                                                <p className="text-[10px] text-slate-400">
                                                                    Updated: {safeFormatDate(booking.updatedAt, 'dd MMM, hh:mm a', 'Never')}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        {/* ── Amount ── */}
                                                        <td className="px-5 py-4 text-center align-top">
                                                            <p className="text-[13px] font-bold text-slate-900">
                                                                {booking.amount.currency} {booking.amount.total.toFixed(2)}
                                                            </p>
                                                            {booking.amount.markup > 0 && (
                                                                <p className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200/60">
                                                                    <ArrowUpRight size={9} />+{booking.amount.markup.toFixed(2)}
                                                                </p>
                                                            )}
                                                        </td>

                                                        {/* ── Actions ── */}
                                                        <td className="px-5 py-4 text-right align-top">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {booking.status === 'issued' && (
                                                                    booking.actionData.ticketUrl ? (
                                                                        <a
                                                                            href={booking.actionData.ticketUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300"
                                                                            title="Download e-ticket"
                                                                        >
                                                                            <Download size={14} />
                                                                        </a>
                                                                    ) : (
                                                                        <span
                                                                            title="Ticket URL not available in test mode"
                                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                                                                        >
                                                                            <Download size={14} />
                                                                        </span>
                                                                    )
                                                                )}

                                                                <button
                                                                    onClick={() => handleViewDetails(booking)}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 cursor-pointer"
                                                                    title="View booking details"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>

                                                                {booking.status === 'held' && (
                                                                    <button
                                                                        onClick={() => !issueDisabled && openIssueModal(booking)}
                                                                        disabled={issueDisabled}
                                                                        title={issueDisabled ? 'Max retry limit reached' : 'Issue ticket'}
                                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-bold shadow-sm transition-all ${
                                                                            issueDisabled
                                                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                                                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.97] cursor-pointer'
                                                                        }`}
                                                                    >
                                                                        Issue
                                                                        <ChevronRight size={12} />
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

                            {/* ── Pagination ── */}
                            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                                <p className="text-[11px] text-slate-400">
                                    Page <span className="font-semibold text-slate-600">{page}</span> of{' '}
                                    <span className="font-semibold text-slate-600">{totalPages}</span>{' '}
                                    · {filteredBookings.length} shown
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                                    >
                                        <ChevronLeft size={15} />
                                    </button>
                                    {pageNumbers.map((pageNum, idx) => {
                                        const prevPage = pageNumbers[idx - 1];
                                        const showGap = prevPage && pageNum - prevPage > 1;
                                        return (
                                            <div key={pageNum} className="flex items-center gap-1.5">
                                                {showGap && <span className="px-1 text-[11px] text-slate-400">…</span>}
                                                <button
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                                        page === pageNum
                                                            ? 'bg-slate-900 text-white shadow-sm'
                                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                                    >
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ═══════════════════ ISSUE TICKET MODAL (EXTRACTED COMPONENT) ═══════════════════ */}
            {selectedBooking && (
                <IssueTicketModalNew
                    open={issueModalOpen}
                    onClose={() => {
                        setIssueModalOpen(false);
                        setSelectedBooking(null);
                    }}
                    onSuccess={() => {
                        setIssueModalOpen(false);
                        setSelectedBooking(null);
                        setRefreshKey((prev) => prev + 1);
                    }}
                    bookingId={selectedBooking.id}
                    bookingRef={selectedBooking.bookingRef}
                    pnr={selectedBooking.pnr !== '---' ? selectedBooking.pnr : 'N/A'}
                    finance={{
                        basePrice: String(selectedBooking.amount.base_amount),
                        tax: '0',
                        clientTotal: String(selectedBooking.amount.total.toFixed(2)),
                        currency: selectedBooking.amount.currency,
                        yourMarkup: selectedBooking.amount.markup,
                        duffelTotal: String(selectedBooking.amount.base_amount.toFixed(2)),
                    }}
                    paymentSource={
                        selectedBooking.paymentSource
                            ? {
                                  holderName: selectedBooking.paymentSource.holderName,
                                  cardNumber: selectedBooking.paymentSource.cardNumber,
                                  expiryDate: selectedBooking.paymentSource.expiryDate,
                                  cvv: null,
                                  billingAddress: selectedBooking.paymentSource.billingAddress,
                                  zipCode: selectedBooking.paymentSource.zipCode,
                              }
                            : null
                    }
                />
            )}
        </div>
    );
}