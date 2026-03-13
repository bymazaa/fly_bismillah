// app/admin/activity-log/page.tsx

'use client';

import * as React from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  User,
  Shield,
  Clock,
  Monitor,
  Globe,
  AlertTriangle,
  UserPlus,
  UserMinus,
  UserX,
  UserCheck,
  LogIn,
  LogOut,
  KeyRound,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Fingerprint,
  X,
  SlidersHorizontal,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Loader2,
  Info,
  ArrowUpDown,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

// ─── Types ───
interface IActivityAdmin {
  _id: string;
  name: string;
  email: string;
  adminId: string;
  role: string;
  avatar: string | null;
}

interface IActivityLog {
  _id: string;
  action: string;
  actionLabel: string;
  actionCategory: string;
  details: string;
  admin: IActivityAdmin | null;
  target: IActivityAdmin | null;
  ip: string;
  device: string;
  createdAt: string;
  timeAgo: string;
}

interface IPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface IStats {
  totalLogs: number;
  todayActivity: number;
  actionBreakdown?: Record<string, number>;
}

interface IFiltersConfig {
  availableActions: string[];
  availableCategories: string[];
}

// ─── Action Config ───
const ACTION_ICONS: Record<string, React.ElementType> = {
  created_staff: UserPlus,
  updated_staff: Edit,
  deleted_staff: Trash2,
  blocked_staff: UserX,
  unblocked_staff: UserCheck,
  self_logout: LogOut,
  self_logout_all: LogOut,
  self_logout_session: LogOut,
  force_logout_session: AlertTriangle,
  force_logout_all_sessions: AlertTriangle,
  login: LogIn,
  failed_login: AlertTriangle,
  changed_password: KeyRound,
  failed_password_change: AlertTriangle,
  updated_own_profile: User,
  password_reset_requested: Lock,
  password_reset_completed: Unlock,
};

const ACTION_COLORS: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  created_staff: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  updated_staff: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-200', dot: 'bg-blue-500' },
  deleted_staff: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200', dot: 'bg-red-500' },
  blocked_staff: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-200', dot: 'bg-rose-500' },
  unblocked_staff: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  login: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-200', dot: 'bg-sky-500' },
  failed_login: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200', dot: 'bg-amber-500' },
  self_logout: { bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200', dot: 'bg-slate-500' },
  self_logout_all: { bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200', dot: 'bg-slate-500' },
  changed_password: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-200', dot: 'bg-violet-500' },
  failed_password_change: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200', dot: 'bg-amber-500' },
  updated_own_profile: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-200', dot: 'bg-indigo-500' },
  force_logout_session: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-200', dot: 'bg-orange-500' },
  force_logout_all_sessions: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-200', dot: 'bg-orange-500' },
  password_reset_requested: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-200', dot: 'bg-cyan-500' },
  password_reset_completed: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'ring-teal-200', dot: 'bg-teal-500' },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  staff: { label: 'Staff', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: User },
  session: { label: 'Session', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Monitor },
  auth: { label: 'Auth', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Shield },
  profile: { label: 'Profile', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Fingerprint },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Activity },
};

const DEFAULT_COLOR = { bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-200', dot: 'bg-gray-500' };

// ─── Quick Date Filters ───
const DATE_PRESETS = [
  { label: 'Today', getValue: () => ({ from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }) },
  { label: 'Yesterday', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); const s = d.toISOString().split('T')[0]; return { from: s, to: s }; } },
  { label: 'Last 7 days', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 7); return { from: d.toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }; } },
  { label: 'Last 30 days', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 30); return { from: d.toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }; } },
  { label: 'This month', getValue: () => { const now = new Date(); return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], to: now.toISOString().split('T')[0] }; } },
];

// ─── Helpers ───
function getActionColor(action: string) {
  return ACTION_COLORS[action] || DEFAULT_COLOR;
}

function getActionIcon(action: string) {
  return ACTION_ICONS[action] || Activity;
}

function getInitials(name?: string): string {
  return name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??';
}

// ─── Stat Card ───
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1.5 tracking-tight">
            {value}
          </p>
          {trend && (
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            color
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-gray-100">
        <Activity className="w-9 h-9 text-gray-300" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1.5">
        {hasFilters ? 'No matching activities' : 'No activities yet'}
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-sm mb-5">
        {hasFilters
          ? 'Try adjusting your filters or search query to find what you\'re looking for.'
          : 'Activity logs will appear here once actions are performed in the system.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear all filters
        </button>
      )}
    </div>
  );
}

// ─── Activity Item ───
function ActivityItem({
  log,
  isLast,
}: {
  log: IActivityLog;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const color = getActionColor(log.action);
  const Icon = getActionIcon(log.action);
  const category = CATEGORY_CONFIG[log.actionCategory] || CATEGORY_CONFIG.other;

  return (
    <div className="group relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[23px] top-[48px] bottom-0 w-[2px] bg-gradient-to-b from-gray-200 via-gray-100 to-transparent" />
      )}

      <div
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          'relative flex gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300',
          'hover:bg-gray-50/80',
          expanded && 'bg-gray-50/80 shadow-2xl shadow-gray-100'
        )}
      >
        {/* Icon */}
        <div className="relative z-10 shrink-0">
          <div
            className={clsx(
              'flex h-[46px] w-[46px] items-center justify-center rounded-xl ring-1 transition-all duration-300',
              color.bg,
              color.text,
              color.ring,
              'group-hover:scale-105 group-hover:shadow-md'
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Action label */}
              <p className="text-[14px] font-bold text-gray-900 leading-snug">
                {log.actionLabel}
              </p>

              {/* Admin info */}
              <div className="flex items-center gap-2 mt-1">
                {log.admin && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-500">
                    <div className="w-4 h-4 rounded-md bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[8px] font-bold text-white">
                      {getInitials(log.admin.name)}
                    </div>
                    <span className="font-semibold text-gray-700">
                      {log.admin.name}
                    </span>
                  </span>
                )}

                {log.target && log.target._id !== log.admin?._id && (
                  <>
                    <span className="text-gray-300">→</span>
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-500">
                      <div className="w-4 h-4 rounded-md bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center text-[8px] font-bold text-white">
                        {getInitials(log.target.name)}
                      </div>
                      <span className="font-medium">{log.target.name}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right side - time & category */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                {log.timeAgo}
              </span>
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border',
                  category.color
                )}
              >
                <category.icon className="w-2.5 h-2.5" />
                {category.label}
              </span>
            </div>
          </div>

          {/* Details preview */}
          {log.details && (
            <p
              className={clsx(
                'text-[12px] text-gray-400 mt-2 leading-relaxed transition-all duration-300',
                expanded ? 'line-clamp-none' : 'line-clamp-1'
              )}
            >
              {log.details}
            </p>
          )}

          {/* Expanded info */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Full timestamp */}
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                <span>
                  {format(new Date(log.createdAt), 'PPpp')}
                </span>
              </div>

              {/* IP */}
              {log.ip && (
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <Globe className="w-3.5 h-3.5 text-gray-300" />
                  <span>IP: {log.ip}</span>
                </div>
              )}

              {/* Device */}
              {log.device && (
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <Monitor className="w-3.5 h-3.5 text-gray-300" />
                  <span className="truncate">{log.device}</span>
                </div>
              )}

              {/* Admin details */}
              {log.admin && (
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <User className="w-3.5 h-3.5 text-gray-300" />
                  <span>
                    {log.admin.email} ({log.admin.role})
                  </span>
                </div>
              )}

              {/* Action ID */}
              <div className="flex items-center gap-2 text-[11px] text-gray-300">
                <Info className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px]">ID: {log._id}</span>
              </div>
            </div>
          )}
        </div>

        {/* Expand indicator */}
        <div className="shrink-0 self-center">
          <ChevronDown
            className={clsx(
              'w-4 h-4 text-gray-300 transition-transform duration-300',
              expanded && 'rotate-180 text-gray-500'
            )}
          />
        </div>
      </div>
    </div>
  );
}

function ActivityLogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── State ──
  const [logs, setLogs] = React.useState<IActivityLog[]>([]);
  const [pagination, setPagination] = React.useState<IPagination | null>(null);
  const [stats, setStats] = React.useState<IStats | null>(null);
  const [filtersConfig, setFiltersConfig] = React.useState<IFiltersConfig | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Filters
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = React.useState(searchParams.get('search') || '');
  const [category, setCategory] = React.useState(searchParams.get('category') || '');
  const [action, setAction] = React.useState(searchParams.get('action') || '');
  const [dateFrom, setDateFrom] = React.useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = React.useState(searchParams.get('dateTo') || '');
  const [sortOrder, setSortOrder] = React.useState(searchParams.get('sortOrder') || 'desc');
  const [page, setPage] = React.useState(parseInt(searchParams.get('page') || '1'));
  const [showFilters, setShowFilters] = React.useState(false);

  const searchTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // ── Check if any filter is active ──
  const hasActiveFilters = React.useMemo(
    () => !!(search || category || action || dateFrom || dateTo),
    [search, category, action, dateFrom, dateTo]
  );

  // ── Fetch Activity Logs ──
  const fetchLogs = React.useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '15');
        params.set('sortOrder', sortOrder);
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        if (action) params.set('action', action);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);

        const response = await axios.get(
          `/api/auth/activity-log?${params.toString()}`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setLogs(response.data.data.logs || []);
          setPagination(response.data.data.pagination || null);
          setStats(response.data.data.stats || null);
          setFiltersConfig(response.data.data.filters || null);
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            router.push('/access');
            return;
          }
          toast.error(error.response?.data?.message || 'Failed to load activity log');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, search, category, action, dateFrom, dateTo, sortOrder, router]
  );

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Search Debounce ──
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  // ── Clear All Filters ──
  const clearAllFilters = () => {
    setSearch('');
    setSearchInput('');
    setCategory('');
    setAction('');
    setDateFrom('');
    setDateTo('');
    setSortOrder('desc');
    setPage(1);
  };

  // ── Apply Date Preset ──
  const applyDatePreset = (preset: (typeof DATE_PRESETS)[0]) => {
    const { from, to } = preset.getValue();
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  };

  // ── Top action breakdown for chart ──
  const topActions = React.useMemo(() => {
    if (!stats?.actionBreakdown) return [];
    return Object.entries(stats.actionBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({
        action,
        count,
        color: getActionColor(action),
        Icon: getActionIcon(action),
      }));
  }, [stats]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              Activity Log
            </h1>
            <p className="text-sm text-gray-400 mt-1 ml-[52px]">
              Track all system actions and user activities
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={() => fetchLogs(true)}
              disabled={isRefreshing}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-all',
                'hover:bg-gray-50 hover:shadow-2xl shadow-gray-100 active:scale-[0.97]',
                isRefreshing && 'opacity-60 cursor-not-allowed'
              )}
            >
              <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Toggle Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                'active:scale-[0.97]',
                showFilters || hasActiveFilters
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:shadow-2xl shadow-gray-100'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                  {[search, category, action, dateFrom].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Total Logs"
              value={stats.totalLogs.toLocaleString()}
              icon={BarChart3}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Today's Activity"
              value={stats.todayActivity}
              icon={TrendingUp}
              color="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Current Page"
              value={`${pagination?.currentPage || 1} / ${pagination?.totalPages || 1}`}
              icon={Eye}
              color="bg-violet-50 text-violet-600"
            />
            <StatCard
              label="Showing"
              value={`${logs.length} of ${pagination?.totalItems || 0}`}
              icon={Activity}
              color="bg-amber-50 text-amber-600"
            />
          </div>
        )}

        {/* ── Top Actions Breakdown ── */}
        {topActions.length > 0 && !showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Top Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {topActions.map(({ action: a, count, color, Icon }) => (
                <button
                  key={a}
                  onClick={() => {
                    setAction(a);
                    setPage(1);
                  }}
                  className={clsx(
                    'inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:shadow-2xl shadow-gray-100 cursor-pointer',
                    action === a
                      ? 'bg-gray-900 text-white border-gray-900'
                      : `${color.bg} ${color.text} border-transparent hover:border-gray-200`
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-bold">
                    {a.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <span
                    className={clsx(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                      action === a ? 'bg-white/20' : 'bg-white/80'
                    )}
                  >
                    {count}
                  </span>
                </button>
              ))}
              {action && (
                <button
                  onClick={() => {
                    setAction('');
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Filters Panel ── */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl shadow-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[12px] font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Search by details, name, email..."
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                  />
                  {searchInput && (
                    <button
                      onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setAction(''); setPage(1); }}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all cursor-pointer appearance-none"
                >
                  <option value="">All categories</option>
                  {(filtersConfig?.availableCategories || Object.keys(CATEGORY_CONFIG)).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat]?.label || cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Sort Order
                </label>
                <button
                  onClick={() => {
                    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                    setPage(1);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <span>{sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}</span>
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Date Filters */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Date Range
              </label>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {DATE_PRESETS.map((preset) => {
                  const { from, to } = preset.getValue();
                  const isActive = dateFrom === from && dateTo === to;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => applyDatePreset(preset)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer',
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-rose-500 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              {/* Custom date inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-medium block mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-medium block mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Active Filters Bar ── */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in duration-200">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Active:
            </span>
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-[11px] font-semibold text-gray-700">
                <Search className="w-3 h-3" />
                &quot;{search}&quot;
                <button
                  onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[11px] font-semibold text-blue-700">
                {category}
                <button
                  onClick={() => { setCategory(''); setPage(1); }}
                  className="text-blue-400 hover:text-blue-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {action && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 text-[11px] font-semibold text-violet-700">
                {action.replace(/_/g, ' ')}
                <button
                  onClick={() => { setAction(''); setPage(1); }}
                  className="text-violet-400 hover:text-violet-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateFrom && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-[11px] font-semibold text-amber-700">
                <Calendar className="w-3 h-3" />
                {dateFrom} → {dateTo || 'now'}
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                  className="text-amber-400 hover:text-amber-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 cursor-pointer ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Activity List ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-100 overflow-hidden">
          {isLoading ? (
            // Loading skeleton
            <div className="p-4 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-[46px] h-[46px] bg-gray-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
                    <div className="h-3 bg-gray-50 rounded-lg w-1/2" />
                    <div className="h-3 bg-gray-50 rounded-lg w-full" />
                  </div>
                  <div className="w-20 space-y-2 py-1">
                    <div className="h-3 bg-gray-50 rounded-lg" />
                    <div className="h-5 bg-gray-50 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearAllFilters} />
          ) : (
            <>
              {/* Timeline header */}
              <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Timeline
                </p>
                <p className="text-[11px] text-gray-400">
                  {pagination?.totalItems} total activities
                </p>
              </div>

              {/* Activity items */}
              <div className="p-2">
                {logs.map((log, index) => (
                  <ActivityItem
                    key={log._id}
                    log={log}
                    isLast={index === logs.length - 1}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <p className="text-[12px] text-gray-400 font-medium">
              Showing{' '}
              <span className="text-gray-700 font-bold">
                {(pagination.currentPage - 1) * pagination.limit + 1}
              </span>
              {' - '}
              <span className="text-gray-700 font-bold">
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalItems
                )}
              </span>
              {' of '}
              <span className="text-gray-700 font-bold">
                {pagination.totalItems}
              </span>
            </p>

            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all',
                  pagination.hasPrevPage
                    ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-2xl shadow-gray-100 cursor-pointer active:scale-[0.97]'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-transparent'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (
                      pagination.currentPage >=
                      pagination.totalPages - 2
                    ) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={clsx(
                          'w-9 h-9 rounded-xl text-[13px] font-bold transition-all cursor-pointer',
                          pageNum === pagination.currentPage
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Mobile page indicator */}
              <div className="sm:hidden px-3 py-2 text-[13px] font-bold text-gray-600">
                {pagination.currentPage} / {pagination.totalPages}
              </div>

              {/* Next */}
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={!pagination.hasNextPage}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all',
                  pagination.hasNextPage
                    ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-2xl shadow-gray-100 cursor-pointer active:scale-[0.97]'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-transparent'
                )}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Bottom Spacing ── */}
        <div className="h-8" />
      </div>
    </div>
  );
}

export default function ActivityLog(){
  return <React.Suspense fallback={<p>Loading....</p>}>
<ActivityLogPage/>
  </React.Suspense>
}