// app/admin/sessions/page.tsx

'use client';

import * as React from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Globe,
  Shield,
  Clock,
  LogOut,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Activity,
  Wifi,
  MapPin,
  Fingerprint,
  ChevronDown,
  History,
  Zap,
  Eye,
  Server,
  Chrome,
  MoreVertical,
  Trash2,
  Info,
  ShieldCheck,
  ShieldAlert,
  Radio,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogOverlay,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface ISession {
  sessionId: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: string;
  lastActive: string;
  duration?: string;
  isCurrentSession?: boolean;
}

interface ILoginHistoryEntry {
  device: string;
  browser: string;
  ip: string;
  location: string;
  time: string;
  status: 'current' | 'completed';
}

interface IStaffInfo {
  _id: string;
  name: string;
  email: string;
  adminId: string;
  role: string;
  avatar: string | null;
  status: string;
  isOnline: boolean;
  lastActive: string;
  lastLogin: string;
}

interface ISessionStats {
  totalActiveSessions: number;
  uniqueDevices: number;
  uniqueLocations: number;
  uniqueIPs: number;
  totalLoginHistory: number;
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function getDeviceIcon(device: string): React.ElementType {
  const d = device.toLowerCase();
  if (d.includes('iphone') || d.includes('android phone')) return Smartphone;
  if (d.includes('ipad') || d.includes('tablet')) return Tablet;
  if (d.includes('mac') || d.includes('laptop')) return Laptop;
  return Monitor;
}

function getDeviceColor(device: string): {
  bg: string;
  text: string;
  ring: string;
  gradient: string;
} {
  const d = device.toLowerCase();
  if (d.includes('iphone') || d.includes('mac'))
    return {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      ring: 'ring-gray-200',
      gradient: 'from-gray-600 to-gray-800',
    };
  if (d.includes('windows'))
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      ring: 'ring-blue-200',
      gradient: 'from-blue-600 to-blue-800',
    };
  if (d.includes('android'))
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'ring-emerald-200',
      gradient: 'from-emerald-600 to-emerald-800',
    };
  if (d.includes('linux'))
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'ring-amber-200',
      gradient: 'from-amber-600 to-amber-800',
    };
  return {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    ring: 'ring-violet-200',
    gradient: 'from-violet-600 to-violet-800',
  };
}

function getBrowserIcon(browser: string): string {
  const b = browser.toLowerCase();
  if (b.includes('chrome')) return '🌐';
  if (b.includes('firefox')) return '🦊';
  if (b.includes('safari')) return '🧭';
  if (b.includes('edge')) return '🔷';
  if (b.includes('opera')) return '🔴';
  return '🌍';
}

function getTimeSince(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

function getSessionDuration(loginTime: string): string {
  try {
    const diff = Date.now() - new Date(loginTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  } catch {
    return 'Unknown';
  }
}

// ═══════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  description,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
}) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-2xl hover:shadow-gray-50 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1.5 tracking-tight">
            {value}
          </p>
          {description && (
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              {description}
            </p>
          )}
        </div>
        <div
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-gray-100/50 group-hover:shadow-xl ',
            color
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// CURRENT SESSION CARD
// ═══════════════════════════════════════

function CurrentSessionCard({ session }: { session: ISession }) {
  const DeviceIcon = getDeviceIcon(session.device);
  const deviceColor = getDeviceColor(session.device);

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                <DeviceIcon className="w-6 h-6 text-white" />
              </div>
              {/* Live indicator */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 ring-2 ring-gray-900 items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                </span>
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold">This Device</h3>
              <p className="text-[12px] text-white/50 font-medium">
                Current active session
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-400/30">
            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" />
              ACTIVE NOW
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-3.5 backdrop-blur-sm border border-white/5">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
              Device
            </p>
            <p className="text-sm font-semibold text-white/90 truncate">
              {session.device}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3.5 backdrop-blur-sm border border-white/5">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
              Browser
            </p>
            <p className="text-sm font-semibold text-white/90 truncate flex items-center gap-1.5">
              <span>{getBrowserIcon(session.browser)}</span>
              {session.browser}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3.5 backdrop-blur-sm border border-white/5">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
              IP Address
            </p>
            <p className="text-sm font-semibold text-white/90 font-mono">
              {session.ip}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3.5 backdrop-blur-sm border border-white/5">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
              Location
            </p>
            <p className="text-sm font-semibold text-white/90 truncate flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-white/50 shrink-0" />
              {session.location}
            </p>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-4 text-[11px] text-white/40">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Logged in {getTimeSince(session.loginTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Duration: {getSessionDuration(session.loginTime)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold">Secured</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// OTHER SESSION CARD
// ═══════════════════════════════════════

function SessionCard({
  session,
  onTerminate,
  isTerminating,
}: {
  session: ISession;
  onTerminate: (sessionId: string) => void;
  isTerminating: boolean;
}) {
  const DeviceIcon = getDeviceIcon(session.device);
  const deviceColor = getDeviceColor(session.device);

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      {/* Hover accent */}
      <div
        className={clsx(
          'absolute top-0 left-0 w-1 h-full rounded-r-full transition-all duration-300',
          'bg-gray-200 group-hover:bg-gradient-to-b',
          `group-hover:${deviceColor.gradient}`
        )}
      />

      <div className="flex items-start gap-4">
        {/* Device Icon */}
        <div className="relative shrink-0">
          <div
            className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center ring-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md',
              deviceColor.bg,
              deviceColor.text,
              deviceColor.ring
            )}
          >
            <DeviceIcon className="w-5 h-5" />
          </div>
          {/* Activity pulse */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 ring-2 ring-white" />
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-[15px] font-bold text-gray-900 truncate">
                {session.device}
              </h4>
              <p className="text-[13px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                <span>{getBrowserIcon(session.browser)}</span>
                {session.browser}
              </p>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl border border-gray-200/80 bg-white p-1 shadow-xl"
              >
                <DropdownMenuItem
                  onClick={() => onTerminate(session.sessionId)}
                  disabled={isTerminating}
                  className="cursor-pointer rounded-lg px-3 py-2.5 font-medium text-rose-600 transition-colors focus:bg-rose-50 focus:text-rose-700"
                >
                  {isTerminating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  <span className="text-[13px]">End Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <Globe className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span className="truncate font-mono text-gray-500">
                {session.ip}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span className="truncate">{session.location}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span>{getTimeSince(session.loginTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <Activity className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span>Active {getTimeSince(session.lastActive)}</span>
            </div>
          </div>

          {/* Duration bar */}
          <div className="mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-medium">
                Session duration
              </span>
              <span className="text-[11px] font-bold text-gray-600">
                {getSessionDuration(session.loginTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick terminate button (visible on hover) */}
      <button
        onClick={() => onTerminate(session.sessionId)}
        disabled={isTerminating}
        className={clsx(
          'absolute bottom-4 right-4 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300',
          'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100',
          'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0',
          'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isTerminating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <span className="flex items-center gap-1">
            <LogOut className="w-3 h-3" />
            End
          </span>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
// LOGIN HISTORY ITEM
// ═══════════════════════════════════════

function HistoryItem({
  entry,
  isLast,
}: {
  entry: ILoginHistoryEntry;
  isLast: boolean;
}) {
  const DeviceIcon = getDeviceIcon(entry.device);
  const isActive = entry.status === 'current';

  return (
    <div className="relative group">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[19px] top-[40px] bottom-0 w-[2px] bg-gradient-to-b from-gray-200 to-gray-100" />
      )}

      <div className="flex gap-3.5 py-3 px-2 rounded-xl hover:bg-gray-50/50 transition-colors">
        {/* Timeline dot */}
        <div className="relative z-10 shrink-0 mt-0.5">
          <div
            className={clsx(
              'w-[38px] h-[38px] rounded-lg flex items-center justify-center ring-1 transition-all',
              isActive
                ? 'bg-emerald-50 text-emerald-600 ring-emerald-200'
                : 'bg-gray-50 text-gray-400 ring-gray-200'
            )}
          >
            <DeviceIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-gray-800 truncate">
              {entry.device}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {isActive && (
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] font-bold text-emerald-700">
                  Active
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                {getTimeSince(entry.time)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              {getBrowserIcon(entry.browser)} {entry.browser}
            </span>
            <span>·</span>
            <span className="font-mono">{entry.ip}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {entry.location}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SECURITY TIPS
// ═══════════════════════════════════════

function SecurityTips() {
  const tips = [
    {
      icon: Shield,
      title: 'Enable 2FA',
      desc: 'Add an extra layer of security',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Eye,
      title: 'Review Sessions',
      desc: 'Regularly check active sessions',
      color: 'bg-violet-50 text-violet-600',
    },
    {
      icon: Zap,
      title: 'Logout Unused',
      desc: 'End sessions you don\'t recognize',
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        Security Tips
      </h3>
      <div className="space-y-2.5">
        {tips.map((tip) => (
          <div
            key={tip.title}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
          >
            <div
              className={clsx(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                tip.color
              )}
            >
              <tip.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">
                {tip.title}
              </p>
              <p className="text-[11px] text-gray-400">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-gray-100">
        <Monitor className="w-9 h-9 text-gray-300" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1.5">
        No other active sessions
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-sm">
        You&apos;re only logged in on this device. Your account is secure.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════

export default function ActiveSessionsPage() {
  const router = useRouter();

  // State
  const [currentSession, setCurrentSession] = React.useState<ISession | null>(
    null
  );
  const [otherSessions, setOtherSessions] = React.useState<ISession[]>([]);
  const [loginHistory, setLoginHistory] = React.useState<ILoginHistoryEntry[]>(
    []
  );
  const [staffInfo, setStaffInfo] = React.useState<IStaffInfo | null>(null);
  const [stats, setStats] = React.useState<ISessionStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [terminatingId, setTerminatingId] = React.useState<string | null>(null);
  const [showTerminateAllDialog, setShowTerminateAllDialog] =
    React.useState(false);
  const [isTerminatingAll, setIsTerminatingAll] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  // ── Fetch Sessions ──
  const fetchSessions = React.useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        const response = await axios.get('/api/auth/profile', {
          withCredentials: true,
        });

        if (response.data.success && response.data.data) {
          const { profile, currentSession: cs, stats: s } = response.data.data;

          setStaffInfo(profile);
          setStats(s);

          // Get full session details
          const profileRes = await axios.get(
            `/api/admin/staff/${profile._id}/sessions`,
            { withCredentials: true }
          );

          if (profileRes.data.success && profileRes.data.data) {
            const sessionData = profileRes.data.data;

            // Find current session and separate others
            const allSessions: ISession[] =
              sessionData.activeSessions || [];

            if (cs?.sessionId) {
              const current = allSessions.find(
                (s: ISession) => s.sessionId === cs.sessionId
              );
              const others = allSessions.filter(
                (s: ISession) => s.sessionId !== cs.sessionId
              );

              setCurrentSession(
                current || { ...cs, isCurrentSession: true }
              );
              setOtherSessions(others);
            } else {
              setCurrentSession(allSessions[0] || null);
              setOtherSessions(allSessions.slice(1));
            }

            setLoginHistory(sessionData.recentLoginHistory || []);
            setStats(sessionData.stats || s);
          }
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            //router.push('/access');
            return;
          }
          toast.error(
            error.response?.data?.message || 'Failed to load sessions'
          );
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [router]
  );

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── Terminate Single Session ──
  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId);
    try {
      const response = await axios.delete(
        `/api/auth/sessions/${sessionId}/logout`,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Session terminated successfully');
        setOtherSessions((prev) =>
          prev.filter((s) => s.sessionId !== sessionId)
        );
        // Refresh stats
        fetchSessions(true);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || 'Failed to terminate session'
        );
      }
    } finally {
      setTerminatingId(null);
    }
  };

  // ── Terminate All Other Sessions ──
  const handleTerminateAll = async () => {
    setIsTerminatingAll(true);
    try {
      const response = await axios.post(
        '/api/auth/logout',
        { logoutAll: false },
        { withCredentials: true }
      );

      // Actually we need to terminate all OTHER sessions
      // Use the staff logout-all endpoint but keep current
      if (staffInfo?._id) {
        const logoutRes = await axios.delete(
          `/api/admin/staff/${staffInfo._id}/logout-all`,
          { withCredentials: true }
        );

        if (logoutRes.data.success) {
          toast.success(
            `${otherSessions.length} session(s) terminated`
          );
          setOtherSessions([]);
          setShowTerminateAllDialog(false);
          fetchSessions(true);
        }
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || 'Failed to terminate sessions'
        );
      }
    } finally {
      setIsTerminatingAll(false);
    }
  };

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="w-40 h-5 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-56 h-3 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
              >
                <div className="w-16 h-3 bg-gray-100 rounded mb-3" />
                <div className="w-12 h-7 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Current session skeleton */}
          <div className="bg-gray-200 rounded-2xl h-64 animate-pulse mb-6" />

          {/* Session cards skeleton */}
          <div className="grid gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                  <div className="flex-1 space-y-2.5">
                    <div className="w-32 h-4 bg-gray-100 rounded-lg" />
                    <div className="w-48 h-3 bg-gray-50 rounded-lg" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="w-full h-3 bg-gray-50 rounded-lg" />
                      <div className="w-full h-3 bg-gray-50 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalSessions = 1 + otherSessions.length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 shadow-lg">
                <Fingerprint className="w-5 h-5 text-white" />
              </div>
              Active Sessions
            </h1>
            <p className="text-sm text-gray-400 mt-1 ml-[52px]">
              Manage your login sessions across all devices
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSessions(true)}
              disabled={isRefreshing}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-all',
                'hover:bg-gray-50 hover:shadow-sm active:scale-[0.97] cursor-pointer',
                isRefreshing && 'opacity-60 cursor-not-allowed'
              )}
            >
              <RefreshCw
                className={clsx('w-4 h-4', isRefreshing && 'animate-spin')}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {otherSessions.length > 0 && (
              <button
                onClick={() => setShowTerminateAllDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-all active:scale-[0.97] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">End All Others</span>
                <span className="sm:hidden">End All</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-200/60 text-[10px] font-bold px-1">
                  {otherSessions.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Active Sessions"
              value={totalSessions}
              icon={Wifi}
              color="bg-emerald-50/50 text-emerald-600"
              description={`${otherSessions.length} other device${otherSessions.length !== 1 ? 's' : ''}`}
            />
            <StatCard
              label="Devices"
              value={stats.uniqueDevices}
              icon={Monitor}
              color="bg-blue-50/50 text-blue-600"
            />
            <StatCard
              label="Locations"
              value={stats.uniqueLocations}
              icon={MapPin}
              color="bg-violet-50/50 text-violet-600"
            />
            <StatCard
              label="Login History"
              value={stats.totalLoginHistory}
              icon={History}
              color="bg-amber-50/50 text-amber-600"
              description="Total logins recorded"
            />
          </div>
        )}

        {/* ── Security Alert (if many sessions) ── */}
        {otherSessions.length >= 3 && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3.5 animate-in fade-in duration-300">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-amber-100 shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-800">
                Multiple sessions detected
              </h4>
              <p className="text-[12px] text-amber-600 mt-0.5 leading-relaxed">
                You have{' '}
                <span className="font-bold">{otherSessions.length}</span> other
                active sessions. If you don&apos;t recognize any, terminate them
                immediately.
              </p>
            </div>
            <button
              onClick={() => setShowTerminateAllDialog(true)}
              className="shrink-0 px-3 py-1.5 bg-amber-600 text-white text-[12px] font-bold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Review
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left Column: Sessions ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Session */}
            {currentSession && (
              <div>
                <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-500" />
                  Current Session
                </h2>
                <CurrentSessionCard session={currentSession} />
              </div>
            )}

            {/* Other Sessions */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  Other Sessions
                  {otherSessions.length > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center px-1.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                      {otherSessions.length}
                    </span>
                  )}
                </h2>
              </div>

              {otherSessions.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-4">
                  {otherSessions.map((session) => (
                    <SessionCard
                      key={session.sessionId}
                      session={session}
                      onTerminate={handleTerminateSession}
                      isTerminating={terminatingId === session.sessionId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Login History */}
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl border border-gray-100 hover:shadow-2xl hover:shadow-gray-100 transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                    <History className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-bold text-gray-900">
                      Login History
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {loginHistory.length} recent login records
                    </p>
                  </div>
                </span>
                <ChevronDown
                  className={clsx(
                    'w-5 h-5 text-gray-300 transition-transform duration-300',
                    showHistory && 'rotate-180 text-gray-500'
                  )}
                />
              </button>

              {showHistory && loginHistory.length > 0 && (
                <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {loginHistory.map((entry, index) => (
                    <HistoryItem
                      key={`${entry.time}-${index}`}
                      entry={entry}
                      isLast={index === loginHistory.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Info & Tips ── */}
          <div className="space-y-6">
            {/* Account Info */}
            {staffInfo && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Account Info
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-sm font-bold">
                      {staffInfo.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-gray-900 truncate">
                        {staffInfo.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {staffInfo.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between py-2 px-1">
                      <span className="text-[12px] text-gray-400">Role</span>
                      <span className="text-[12px] font-bold text-gray-700 capitalize px-2 py-0.5 bg-gray-50 rounded-md">
                        {staffInfo.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-1 border-t border-gray-50">
                      <span className="text-[12px] text-gray-400">Status</span>
                      <span
                        className={clsx(
                          'text-[12px] font-bold capitalize px-2 py-0.5 rounded-md',
                          staffInfo.isOnline
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-50 text-gray-500'
                        )}
                      >
                        {staffInfo.isOnline ? '🟢 Online' : '⚫ Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-1 border-t border-gray-50">
                      <span className="text-[12px] text-gray-400">
                        Last login
                      </span>
                      <span className="text-[12px] font-semibold text-gray-600">
                        {getTimeSince(staffInfo.lastLogin)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-1 border-t border-gray-50">
                      <span className="text-[12px] text-gray-400">
                        Admin ID
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                        {staffInfo.adminId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tips */}
            <SecurityTips />

            {/* Session Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                Session Summary
              </h3>
              <div className="space-y-2">
                {/* Device breakdown */}
                {[currentSession, ...otherSessions]
                  .filter(Boolean)
                  .map((session) => {
                    const s = session as ISession;
                    const DeviceIcon = getDeviceIcon(s.device);
                    const color = getDeviceColor(s.device);
                    const isCurrent = s.sessionId === currentSession?.sessionId;

                    return (
                      <div
                        key={s.sessionId}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50/50"
                      >
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            color.bg,
                            color.text
                          )}
                        >
                          <DeviceIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-700 truncate">
                            {s.device}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {s.browser}
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>

      {/* ── Terminate All Dialog ── */}
      <AlertDialog
        open={showTerminateAllDialog}
        onOpenChange={setShowTerminateAllDialog}
      >
        <AlertDialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <AlertDialogContent className="max-w-[380px] rounded-2xl border-0 p-0 shadow-2xl overflow-hidden gap-0 animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="relative bg-gradient-to-b from-rose-50 to-white px-6 pt-7 pb-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-40" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-rose-50 shadow-sm ring-1 ring-rose-200/60">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>

              <AlertDialogHeader className="mt-4 space-y-1.5 text-left">
                <AlertDialogTitle className="text-[17px] font-extrabold text-gray-900">
                  End all other sessions?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[12.5px] leading-relaxed text-gray-400">
                  This will immediately sign out{' '}
                  <span className="font-bold text-gray-600">
                    {otherSessions.length}
                  </span>{' '}
                  other session
                  {otherSessions.length !== 1 ? 's' : ''} on other devices.
                  Your current session will remain active.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Session list preview */}
              <div className="mt-3 max-h-32 overflow-y-auto space-y-1.5">
                {otherSessions.slice(0, 3).map((session) => {
                  const DeviceIcon = getDeviceIcon(session.device);
                  return (
                    <div
                      key={session.sessionId}
                      className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-100"
                    >
                      <DeviceIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-[11px] text-gray-600 font-medium truncate">
                        {session.device} · {session.browser}
                      </span>
                    </div>
                  );
                })}
                {otherSessions.length > 3 && (
                  <p className="text-[11px] text-gray-400 text-center font-medium">
                    +{otherSessions.length - 3} more
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100">
            <AlertDialogFooter className="gap-2.5 sm:gap-2.5">
              <AlertDialogCancel
                className="cursor-pointer flex-1 h-10 rounded-xl border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-all shadow-sm"
                disabled={isTerminatingAll}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleTerminateAll();
                }}
                className="cursor-pointer flex-1 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-[13px] font-bold text-white shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-rose-700 transition-all active:scale-[0.97] border-0"
                disabled={isTerminatingAll}
              >
                {isTerminatingAll ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Ending...
                  </span>
                ) : (
                  `End ${otherSessions.length} Session${otherSessions.length !== 1 ? 's' : ''}`
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}