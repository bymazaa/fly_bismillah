// app/(dashboard)/staff/page.tsx

'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import {
  Search, Plus, UserPlus, Users, ShieldCheck, ShieldBan, Wifi,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye, EyeOff, Pencil, Trash2, Ban, Unlock, Monitor, MoreVertical,
  X, Loader2, RotateCcw, LogOut, Shield, Clock, Globe, MapPin,
  CheckCircle2, XCircle, AlertTriangle, Zap, Activity,
  Check, ChevronDown, Lock, User,
} from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// TYPES  (aligned with Admin model)
// ==========================================
export interface IPermissions {
  dashboard: 'full' | 'none';
  booking: 'full' | 'edit' | 'view' | 'none';
  transactions: 'full'  | 'none';
  customers: 'full' | 'none';
  destinations: 'full' | 'edit' | 'view' | 'none';
  packages: 'full' | 'edit' | 'view' | 'none';
  offers: 'full' | 'edit' | 'view' | 'none';
  support: 'full' | 'none';
  settings: 'full' |  'none';
}

interface ICreatedBy { _id: string; name: string; email: string; adminId: string; }
interface IBlockedBy { _id: string; name: string; email: string; }

interface ISession {
  sessionId: string; device: string; browser: string; ip: string;
  location: string; loginTime: string; lastActive: string;
  duration?: string; isCurrentSession?: boolean;
}

interface ILoginHistory {
  device: string; browser: string; ip: string;
  location: string; time: string; status: string;
}

interface IActivityLog {
  _id: string; action: string; details: string; createdAt: string;
  admin?: { name: string; email: string; adminId: string; };
}

interface IStaff {
  _id: string; name: string; email: string; phone?: string; avatar?: string;
  adminId: string; role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'blocked' | 'suspended';
  isVerified: boolean; isOnline: boolean; isTwoFactorEnabled: boolean;
  lastLogin: string; lastActive: string; createdAt: string; updatedAt: string;
  permissions: IPermissions; blockReason?: string; blockedAt?: string;
  activeSessions?: ISession[]; loginHistory?: ILoginHistory[];
  createdBy?: ICreatedBy; blockedBy?: IBlockedBy;
}

interface IPagination {
  currentPage: number; totalPages: number; totalItems: number;
  limit: number; hasNextPage: boolean; hasPrevPage: boolean;
}

interface IStats { total: number; active: number; blocked: number; online: number; }

// ==========================================
// CONSTANTS  (matched to Admin model enums)
// ==========================================
const PERMISSION_MODULES: {
  key: keyof IPermissions;
  label: string;
  icon: string;
  desc: string;
  levels: string[];
}[] = [
  { key: 'dashboard',    label: 'Dashboard',     icon: '📊', desc: 'Analytics & metrics',  levels: ['none',  'full'] },
  { key: 'booking',      label: 'Booking',       icon: '📅', desc: 'Manage reservations',  levels: ['none', 'view', 'edit', 'full'] },
  { key: 'transactions', label: 'Transactions',  icon: '💳', desc: 'Payment & billing',    levels: ['none', 'full'] },
  { key: 'customers',    label: 'Customers',     icon: '👥', desc: 'Customer data',        levels: ['none',  'full'] },
  { key: 'destinations', label: 'Destinations',  icon: '🌍', desc: 'Locations',            levels: ['none', 'view', 'edit', 'full'] },
  { key: 'packages',     label: 'Packages',      icon: '📦', desc: 'Tour packages',        levels: ['none', 'view', 'edit', 'full'] },
  { key: 'offers',       label: 'Offers',        icon: '🏷️', desc: 'Deals & promos',       levels: ['none', 'view', 'edit', 'full'] },
  { key: 'support',      label: 'Support',       icon: '🎧', desc: 'Help & tickets',       levels: ['none', 'full'] },
  { key: 'settings',     label: 'Settings',      icon: '⚙️', desc: 'Configuration',        levels: ['none',  'full'] },
];

const PERMISSION_LEVELS = [
  { value: 'none', label: 'None', color: 'bg-slate-100 text-slate-500 border-slate-200' },
  { value: 'view', label: 'View', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'edit', label: 'Edit', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'full', label: 'Full', color: 'bg-violet-50 text-violet-700 border-violet-200' },
];

const DEFAULT_PERMISSIONS: Record<string, IPermissions> = {
  editor: {
    dashboard: 'full',
    booking: 'edit',
    transactions: 'full',
    customers: 'full',
    destinations: 'edit',
    packages: 'edit',
    offers: 'edit',
    support: 'full',
    settings: 'none',
  },
  viewer: {
    dashboard: 'full',
    booking: 'view',
    transactions: 'full',
    customers: 'full',
    destinations: 'view',
    packages: 'view',
    offers: 'view',
    support: 'full',
    settings: 'none',
  },
};

// ==========================================
// HELPERS
// ==========================================
const formatDate = (date: string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const getTimeAgo = (date: string) => {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
};

const getAvatarColor = (name: string) => {
  const colors = [
    'from-blue-500 to-blue-600', 'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600', 'from-cyan-500 to-sky-600',
    'from-indigo-500 to-blue-600', 'from-fuchsia-500 to-pink-600',
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

const getPermissionColor = (level: string) =>
  PERMISSION_LEVELS.find((l) => l.value === level)?.color || 'bg-slate-100 text-slate-500 border-slate-200';

// ==========================================
// STAT CARD
// ==========================================
function StatCard({ label, value, subtitle, icon, accentColor, loading: isLoading }: {
  label: string; value: number; subtitle?: string;
  icon: React.ReactNode; accentColor: string; loading?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/60">
      <div className={`absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-[0.08] ${accentColor}`} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          {isLoading ? (
            <div className="h-7 w-14 rounded-lg bg-slate-100 animate-pulse" />
          ) : (
            <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          )}
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TABLE SKELETON
// ==========================================
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3.5 w-28 rounded-md bg-slate-100" />
                <div className="h-3 w-36 rounded-md bg-slate-100/70" />
              </div>
            </div>
          </td>
          <td className="px-5 py-4 hidden md:table-cell"><div className="h-6 w-24 rounded-lg bg-slate-100" /></td>
          <td className="px-5 py-4"><div className="h-6 w-16 rounded-full bg-slate-100" /></td>
          <td className="px-5 py-4"><div className="h-6 w-16 rounded-full bg-slate-100" /></td>
          <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 w-20 rounded bg-slate-100" /></td>
          <td className="px-5 py-4 hidden xl:table-cell"><div className="h-7 w-20 rounded-lg bg-slate-100" /></td>
          <td className="px-5 py-4 text-right"><div className="h-8 w-24 rounded-lg bg-slate-100 ml-auto" /></td>
        </tr>
      ))}
    </>
  );
}

// ==========================================
// TABLE OVERLAY
// ==========================================
function TableOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl">
      <div className="flex items-center gap-2.5 rounded-xl bg-white px-5 py-3 shadow-lg border border-slate-200/60">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm font-medium text-slate-600">Loading…</span>
      </div>
    </div>
  );
}

// ==========================================
// PAGINATION
// ==========================================
function PaginationBar({ pagination, onPageChange, loading }: {
  pagination: IPagination; onPageChange: (p: number) => void; loading: boolean;
}) {
  const { currentPage, totalPages, totalItems, limit, hasNextPage, hasPrevPage } = pagination;
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  const getPages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-5 py-4">
      <p className="text-[12px] text-slate-500">
        Showing <span className="font-semibold text-slate-700">{startItem}</span>
        {' – '}
        <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPageChange(1)} disabled={!hasPrevPage || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all">
          <ChevronsLeft size={14} />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={!hasPrevPage || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all">
          <ChevronLeft size={14} />
        </button>
        {getPages().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`e-${idx}`} className="flex h-8 w-8 items-center justify-center text-[12px] text-slate-400">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)} disabled={loading}
              className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-[12px] font-medium transition-all cursor-pointer
                ${p === currentPage ? 'bg-slate-900 text-white shadow-2xl shadow-gray-100' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
                disabled:opacity-50`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={!hasNextPage || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all">
          <ChevronRight size={14} />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={!hasNextPage || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all">
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// MODAL WRAPPER
// ==========================================
function Modal({ open, onClose, children, maxWidth = 'max-w-xl' }: {
  open: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto border border-slate-200/60`}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose, icon, iconBg }: {
  title: string; subtitle?: string; onClose: () => void;
  icon: React.ReactNode; iconBg: string;
}) {
  return (
    <div className="sticky top-0 bg-white/95 backdrop-blur-xl px-6 py-4 border-b border-slate-100 rounded-t-2xl z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
          <X size={16} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// PERMISSION EDITOR  (with disabled support)
// ==========================================
function PermissionEditor({ permissions, onChange, disabled = false }: {
  permissions: IPermissions;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="border border-slate-200/80 rounded-xl overflow-hidden">
      {/* Locked banner when disabled */}
      {disabled && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
          <Lock size={11} className="text-slate-400" />
          <p className="text-[10px] text-slate-500 font-medium">
            Default permissions for this role — change role to update
          </p>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {PERMISSION_MODULES.map((mod) => {
          // Only show levels valid for this module
          const moduleLevels = PERMISSION_LEVELS.filter((l) => mod.levels.includes(l.value));
          const currentValue = permissions[mod.key] || 'none';

          return (
            <div
              key={mod.key}
              className={`flex items-center justify-between px-4 py-3 transition-colors
                ${disabled ? '' : 'hover:bg-slate-50/50'}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{mod.icon}</span>
                <div>
                  <p className={`text-[13px] font-semibold ${disabled ? 'text-slate-500' : 'text-slate-700'}`}>
                    {mod.label}
                  </p>
                  <p className="text-[10px] text-slate-400">{mod.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {moduleLevels.map((level) => {
                  const isActive = currentValue === level.value;

                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => {
                        if (!disabled) onChange(mod.key, level.value);
                      }}
                      disabled={disabled}
                      className={`
                        px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border
                        ${disabled ? 'cursor-default' : 'cursor-pointer'}
                        ${isActive
                          ? level.color
                          : disabled
                            ? 'bg-slate-50 text-slate-300 border-slate-100'
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                        }
                      `}
                    >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// PERMISSION VIEWER  (detail modal)
// ==========================================
function PermissionViewer({ permissions }: { permissions: IPermissions }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {PERMISSION_MODULES.map((mod) => {
        const level = permissions?.[mod.key] || 'none';
        return (
          <div key={mod.key} className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
              <span className="text-sm">{mod.icon}</span>
              {mod.label}
            </span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase ${getPermissionColor(level)}`}>
              {level}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// ROLE SELECTOR
// ==========================================
function RoleSelector({ value, onChange }: { value: string; onChange: (r: 'editor' | 'viewer') => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['editor', 'viewer'] as const).map((r) => (
        <button key={r} type="button" onClick={() => onChange(r)}
          className={`relative p-4 border-2 rounded-xl text-center transition-all cursor-pointer
            ${value === r
              ? r === 'editor'
                ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-100'
                : 'border-sky-400 bg-sky-50 ring-2 ring-sky-100'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}>
          <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg
            ${value === r ? r === 'editor' ? 'bg-violet-100' : 'bg-sky-100' : 'bg-slate-100'}`}>
            {r === 'editor' ? '✏️' : '👁️'}
          </div>
          <p className="font-bold text-sm text-slate-800">{r.charAt(0).toUpperCase() + r.slice(1)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {r === 'editor' ? 'View & edit content' : 'Read-only access'}
          </p>
          {value === r && (
            <div className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center
              ${r === 'editor' ? 'bg-violet-500' : 'bg-sky-500'}`}>
              <Check size={10} className="text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function StaffManagementPage() {
  // ═══ State ═══
  const [staffList, setStaffList] = useState<IStaff[]>([]);
  const [pagination, setPagination] = useState<IPagination>({
    currentPage: 1, totalPages: 1, totalItems: 0, limit: 10, hasNextPage: false, hasPrevPage: false,
  });
  const [stats, setStats] = useState<IStats>({ total: 0, active: 0, blocked: 0, online: 0 });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [selectedStaff, setSelectedStaff] = useState<IStaff | null>(null);
  const [staffDetail, setStaffDetail] = useState<IStaff | null>(null);
  const [staffActivity, setStaffActivity] = useState<IActivityLog[]>([]);
  const [staffSessions, setStaffSessions] = useState<ISession[]>([]);
  const [staffLoginHistory, setStaffLoginHistory] = useState<ILoginHistory[]>([]);
  const [sessionStats, setSessionStats] = useState({
    totalActiveSessions: 0, uniqueDevices: 0, uniqueLocations: 0, uniqueIPs: 0, totalLoginHistory: 0,
  });

  const [addForm, setAddForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'editor' as 'editor' | 'viewer',
    permissions: { ...DEFAULT_PERMISSIONS.editor },
  });
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'editor' as string,
    permissions: { ...DEFAULT_PERMISSIONS.editor },
  });
  const [blockReason, setBlockReason] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);

  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActiveMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ═══ Debounce ═══
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [roleFilter, statusFilter, sortBy, sortOrder]);

  // ═══ Fetch Staff ═══
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(), limit: '10', search: debouncedSearch,
        role: roleFilter, status: statusFilter, sortBy, sortOrder,
      });
      const res = await fetch(`/api/admin/staff/list?${params}`);
      const data = await res.json();
      if (data.success) {
        setStaffList(data.data.staff || []);
        setPagination(data.data.pagination);
        setStats(data.data.stats);
      } else toast.error(data.message || 'Failed to fetch staff');
    } catch { toast.error('Network error'); }
    finally { setLoading(false); setInitialLoad(false); }
  }, [currentPage, debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  // ═══ Fetch Detail ═══
  const fetchStaffDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/admin/staff/${id}`);
      const data = await res.json();
      if (data.success) { setStaffDetail(data.data.staff); setStaffActivity(data.data.recentActivity || []); }
      else toast.error(data.message || 'Failed to fetch details');
    } catch { toast.error('Network error'); }
    finally { setDetailLoading(false); }
  };

  // ═══ Fetch Sessions ═══
  const fetchStaffSessions = async (id: string) => {
    try {
      setSessionLoading(true);
      const res = await fetch(`/api/admin/staff/${id}/sessions`);
      const data = await res.json();
      if (data.success) {
        setStaffSessions(data.data.activeSessions || []);
        setStaffLoginHistory(data.data.recentLoginHistory || []);
        setSessionStats(data.data.stats || {});
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSessionLoading(false); }
  };

  // ═══ Add Staff ═══
  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return toast.error('Name is required');
    if (!addForm.email.trim()) return toast.error('Email is required');
    if (!addForm.password || addForm.password.length < 6) return toast.error('Password must be 6+ chars');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) return toast.error('Invalid email');
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/staff/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(), email: addForm.email.trim(), password: addForm.password,
          phone: addForm.phone.trim() || undefined, role: addForm.role, permissions: addForm.permissions,
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`Staff "${addForm.name}" created!`); setShowAddModal(false); resetAddForm(); fetchStaff(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setActionLoading(false); }
  };

  // ═══ Edit Staff ═══
  const openEditModal = (s: IStaff) => {
    setSelectedStaff(s);
    setEditForm({ name: s.name, email: s.email, phone: s.phone || '', password: '', role: s.role, permissions: { ...s.permissions } });
    setShowEditPw(false); setShowEditModal(true); setActiveMenu(null);
  };

  const handleEditStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (!editForm.name.trim()) return toast.error('Name required');
    if (!editForm.email.trim()) return toast.error('Email required');
    if (editForm.password && editForm.password.length < 6) return toast.error('Password 6+ chars');
    try {
      setActionLoading(true);
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(), email: editForm.email.trim(),
        phone: editForm.phone.trim() || null, role: editForm.role, permissions: editForm.permissions,
      };
      if (editForm.password) payload.password = editForm.password;
      const res = await fetch(`/api/admin/staff/${selectedStaff._id}/update`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Staff updated!');
        setShowEditModal(false); setSelectedStaff(null); fetchStaff();
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setActionLoading(false); }
  };

  // ═══ Delete Staff ═══
  const openDeleteModal = (s: IStaff) => { setSelectedStaff(s); setShowDeleteModal(true); setActiveMenu(null); };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/staff/${selectedStaff._id}/delete`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success(`"${selectedStaff.name}" deleted`); setShowDeleteModal(false); setSelectedStaff(null); fetchStaff(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setActionLoading(false); }
  };

  // ═══ Block Staff ═══
  const openBlockModal = (s: IStaff) => { setSelectedStaff(s); setBlockReason(''); setShowBlockModal(true); setActiveMenu(null); };

  const handleBlockStaff = async () => {
    if (!selectedStaff) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/staff/${selectedStaff._id}/block`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blockReason.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`"${selectedStaff.name}" blocked`); setShowBlockModal(false); setSelectedStaff(null); fetchStaff(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setActionLoading(false); }
  };

  // ═══ Unblock Staff ═══
  const handleUnblockStaff = async (s: IStaff) => {
    if (!confirm(`Unblock "${s.name}"?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/staff/${s._id}/unblock`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) { toast.success(`"${s.name}" unblocked`); fetchStaff(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setActionLoading(false); setActiveMenu(null); }
  };

  // ═══ Logout All ═══
  const handleLogoutAll = async (id: string, name: string) => {
    if (!confirm(`Logout "${name}" from ALL devices?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/staff/${id}/logout-all`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.data?.totalSessionsTerminated || 0} session(s) terminated`);
        if (showSessionsModal) fetchStaffSessions(id);
        fetchStaff();
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setActionLoading(false); }
  };

  // ═══ Open Modals ═══
  const openDetailModal = async (s: IStaff) => {
    setSelectedStaff(s); setShowDetailModal(true); setActiveMenu(null);
    await fetchStaffDetail(s._id);
  };
  const openSessionsModal = async (s: IStaff) => {
    setSelectedStaff(s); setShowSessionsModal(true); setActiveMenu(null);
    await fetchStaffSessions(s._id);
  };

  // ═══ Helpers ═══
  const resetAddForm = () => {
    setAddForm({ name: '', email: '', password: '', phone: '', role: 'editor', permissions: { ...DEFAULT_PERMISSIONS.editor } });
    setShowPw(false);
  };
  const clearFilters = () => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setSortBy('createdAt'); setSortOrder('desc'); setCurrentPage(1); };
  const hasFilters = search || roleFilter || statusFilter || sortBy !== 'createdAt' || sortOrder !== 'desc';
  const handlePageChange = (p: number) => { if (p >= 1 && p <= pagination.totalPages && p !== currentPage) setCurrentPage(p); };

  // ═══ Initial Loader ═══
  if (initialLoad) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-white shadow-lg shadow-slate-200/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading staff records…</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen w-full bg-[#f8f9fb] p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">

        {/* ═══════════ HEADER ═══════════ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Dashboard · Staff
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Staff Management
            </h1>
            <p className="text-sm text-slate-500 max-w-lg">
              {stats.total} team members — manage roles, permissions and sessions.
            </p>
          </div>
          <button onClick={() => { resetAddForm(); setShowAddModal(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all cursor-pointer">
            <UserPlus size={16} />
            Add Staff
          </button>
        </div>

        {/* ═══════════ STATS ═══════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Staff" value={stats.total} subtitle="All members" accentColor="bg-blue-500" icon={<Users size={20} />} loading={loading} />
          <StatCard label="Active" value={stats.active} subtitle="Operational" accentColor="bg-emerald-500" icon={<ShieldCheck size={20} />} loading={loading} />
          <StatCard label="Blocked" value={stats.blocked} subtitle="Restricted" accentColor="bg-rose-500" icon={<ShieldBan size={20} />} loading={loading} />
          <StatCard label="Online Now" value={stats.online} subtitle="Currently active" accentColor="bg-violet-500" icon={<Wifi size={20} />} loading={loading} />
        </div>

        {/* ═══════════ FILTERS ═══════════ */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Search name, email, ID, phone…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100 shadow-2xl shadow-gray-100" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer">
                <X size={10} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[120px]">
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[120px]">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={`${sortBy}-${sortOrder}`}
                onChange={(e) => { const [s, o] = e.target.value.split('-'); setSortBy(s); setSortOrder(o); }}
                className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[140px]">
                <option value="createdAt-desc">Newest</option>
                <option value="createdAt-asc">Oldest</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="lastLogin-desc">Recent Login</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {hasFilters && (
              <button onClick={clearFilters}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer">
                <RotateCcw size={12} /> Clear
              </button>
            )}
            <button onClick={fetchStaff} disabled={loading}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50 transition-all cursor-pointer">
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ═══════════ TABLE ═══════════ */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
          {loading && !initialLoad && staffList.length > 0 && <TableOverlay />}

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Staff Records</h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Member</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">ID</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell">Last Active</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden xl:table-cell">Sessions</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && staffList.length === 0 && <TableSkeleton />}

                {staffList.map((s) => {
                  const color = getAvatarColor(s.name || 'A');
                  return (
                    <tr key={s._id} className="group transition-colors hover:bg-blue-50/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${color} text-[11px] font-bold text-white shadow-2xl shadow-gray-100`}>
                              {s.avatar ? <img src={s.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : s.name.charAt(0).toUpperCase()}
                            </div>
                            {s.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">{s.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-md text-slate-500">{s.adminId}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase
                          ${s.role === 'admin' ? 'bg-amber-50 text-amber-700' : s.role === 'editor' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>
                          {s.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold
                          ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <p className="text-[12px] text-slate-600 font-medium">{getTimeAgo(s.lastActive)}</p>
                        <p className="text-[10px] text-slate-400">Login: {getTimeAgo(s.lastLogin)}</p>
                      </td>
                      <td className="px-5 py-4 hidden xl:table-cell">
                        <button onClick={() => openSessionsModal(s)}
                          className="inline-flex items-center gap-1.5 text-[11px] bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-2.5 py-1.5 rounded-lg transition-all font-medium text-slate-600 hover:text-blue-700 cursor-pointer">
                          <Monitor size={12} />
                          {s.activeSessions?.length || 0} active
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openDetailModal(s)} title="View"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => openEditModal(s)} title="Edit"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer">
                            <Pencil size={16} />
                          </button>
                          <div className="relative" ref={activeMenu === s._id ? menuRef : undefined}>
                            <button onClick={() => setActiveMenu(activeMenu === s._id ? null : s._id)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">
                              <MoreVertical size={16} />
                            </button>
                            {activeMenu === s._id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-50">
                                <button onClick={() => openSessionsModal(s)}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                                  <Monitor size={14} /> Sessions
                                </button>
                                <button onClick={() => handleLogoutAll(s._id, s.name)} disabled={actionLoading}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-slate-600 hover:bg-orange-50 hover:text-orange-700 transition-colors cursor-pointer disabled:opacity-50">
                                  <LogOut size={14} /> Force Logout
                                </button>
                                <div className="mx-3 my-1 border-t border-slate-100" />
                                {s.status === 'active' ? (
                                  <button onClick={() => openBlockModal(s)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                                    <Ban size={14} /> Block
                                  </button>
                                ) : (
                                  <button onClick={() => handleUnblockStaff(s)} disabled={actionLoading}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50">
                                    <Unlock size={14} /> Unblock
                                  </button>
                                )}
                                <button onClick={() => openDeleteModal(s)}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && staffList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-20 text-center">
                      <div className="mx-auto flex flex-col items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                          <Users size={28} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                          {hasFilters ? 'No staff match filters' : 'No staff yet'}
                        </p>
                        {hasFilters ? (
                          <button onClick={clearFilters}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white cursor-pointer">
                            <RotateCcw size={12} /> Clear filters
                          </button>
                        ) : (
                          <button onClick={() => { resetAddForm(); setShowAddModal(true); }}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white cursor-pointer">
                            <UserPlus size={12} /> Add first staff
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalItems > 0 && (
            <PaginationBar pagination={pagination} onPageChange={handlePageChange} loading={loading} />
          )}
        </div>

        {/* ═══════════════════════════════════════
            MODALS
        ═══════════════════════════════════════ */}

        {/* ═══ ADD MODAL ═══ */}
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
          <ModalHeader title="Add New Staff" subtitle="Create a team member"
            onClose={() => setShowAddModal(false)}
            icon={<UserPlus size={18} className="text-white" />}
            iconBg="bg-blue-600" />
          <form onSubmit={handleAddStaff} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Name *</label>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe" required
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Phone</label>
                <input type="text" value={addForm.phone} onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+880..."
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Email *</label>
              <input type="email" value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="staff@company.com" required
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={addForm.password}
                  onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters" required minLength={6}
                  className="w-full h-10 px-3 pr-10 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Role — changes auto-lock permissions below */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-2">Role *</label>
              <RoleSelector
                value={addForm.role}
                onChange={(r) =>
                  setAddForm((f) => ({
                    ...f,
                    role: r,
                    permissions: { ...DEFAULT_PERMISSIONS[r] },
                  }))
                }
              />
            </div>

            {/* Permissions — DISABLED / LOCKED to role defaults */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[12px] font-semibold text-slate-600">Permissions</label>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Lock size={10} />
                  Defaults for {addForm.role}
                </span>
              </div>
              <PermissionEditor
                permissions={addForm.permissions}
                onChange={() => {}}
                disabled
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)}
                className="flex-1 h-10 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={actionLoading}
                className="flex-1 h-10 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all">
                {actionLoading ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Plus size={14} /> Create Staff</>}
              </button>
            </div>
          </form>
        </Modal>

        {/* ═══ EDIT MODAL ═══  (permissions editable) */}
        <Modal open={showEditModal && !!selectedStaff} onClose={() => setShowEditModal(false)}>
          <ModalHeader title="Edit Staff" subtitle={`${selectedStaff?.name} · ${selectedStaff?.adminId}`}
            onClose={() => setShowEditModal(false)}
            icon={<Pencil size={16} className="text-white" />}
            iconBg="bg-amber-500" />
          <form onSubmit={handleEditStaff} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Phone</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Email</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} required
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                New Password <span className="text-slate-400 font-normal">(leave empty to keep)</span>
              </label>
              <div className="relative">
                <input type={showEditPw ? 'text' : 'password'} value={editForm.password}
                  onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter new password"
                  className="w-full h-10 px-3 pr-10 border border-slate-200 rounded-lg text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all" />
                <button type="button" onClick={() => setShowEditPw(!showEditPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                  {showEditPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {editForm.password && (
                <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-amber-700 font-medium">Password change will force logout from all devices.</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-2">Role</label>
              <RoleSelector value={editForm.role} onChange={(r) => setEditForm(f => ({ ...f, role: r }))} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-2">Permissions</label>
              <PermissionEditor
                permissions={editForm.permissions}
                onChange={(k, v) => setEditForm(f => ({ ...f, permissions: { ...f.permissions, [k]: v } }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEditModal(false)}
                className="flex-1 h-10 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
                Cancel
              </button>
              <button type="submit" disabled={actionLoading}
                className="flex-1 h-10 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all">
                {actionLoading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Changes</>}
              </button>
            </div>
          </form>
        </Modal>

        {/* ═══ DELETE MODAL ═══ */}
        <Modal open={showDeleteModal && !!selectedStaff} onClose={() => setShowDeleteModal(false)} maxWidth="max-w-md">
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Staff</h3>
            <p className="text-sm text-slate-500 mb-4">
              Permanently delete <span className="font-semibold text-slate-700">{selectedStaff?.name}</span>?
            </p>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-left mb-6 space-y-1.5">
              {['All sessions terminated', 'Data permanently deleted', 'Activity logs affected'].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <XCircle size={12} className="text-rose-500 flex-shrink-0" />
                  <p className="text-[11px] text-rose-600 font-medium">{t}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setSelectedStaff(null); }}
                className="flex-1 h-10 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
                Cancel
              </button>
              <button onClick={handleDeleteStaff} disabled={actionLoading}
                className="flex-1 h-10 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all">
                {actionLoading ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : 'Delete Forever'}
              </button>
            </div>
          </div>
        </Modal>

        {/* ═══ BLOCK MODAL ═══ */}
        <Modal open={showBlockModal && !!selectedStaff} onClose={() => setShowBlockModal(false)} maxWidth="max-w-md">
          <div className="p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ban size={24} className="text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Block Staff</h3>
              <p className="text-sm text-slate-500">
                Block <span className="font-semibold text-slate-700">{selectedStaff?.name}</span>
              </p>
            </div>
            <div className="mb-5">
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Reason (optional)</label>
              <textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Why blocking this member?" rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 resize-none transition-all" />
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3 space-y-1">
                {['All sessions terminated', 'Login blocked', 'Marked offline'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Zap size={10} className="text-amber-500" />
                    <p className="text-[10px] text-amber-600 font-medium">{t}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowBlockModal(false); setSelectedStaff(null); }}
                className="flex-1 h-10 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
                Cancel
              </button>
              <button onClick={handleBlockStaff} disabled={actionLoading}
                className="flex-1 h-10 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all">
                {actionLoading ? <><Loader2 size={14} className="animate-spin" /> Blocking…</> : <><Ban size={14} /> Block Staff</>}
              </button>
            </div>
          </div>
        </Modal>

        {/* ═══ DETAIL MODAL ═══ */}
        <Modal open={showDetailModal && !!selectedStaff} onClose={() => setShowDetailModal(false)} maxWidth="max-w-2xl">
          <ModalHeader title="Staff Profile" onClose={() => setShowDetailModal(false)}
            icon={<User size={16} className="text-white" />} iconBg="bg-blue-600" />
          <div className="p-6">
            {detailLoading ? (
              <div className="flex flex-col items-center py-16">
                <Loader2 size={32} className="animate-spin text-blue-400" />
                <p className="text-sm text-slate-400 mt-3">Loading profile…</p>
              </div>
            ) : (() => {
              const d = staffDetail || selectedStaff;
              if (!d) return null;
              return (
                <>
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarColor(d.name)} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                      {d.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900">{d.name}</h3>
                      <p className="text-sm text-slate-500">{d.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase
                          ${d.role === 'admin' ? 'bg-amber-50 text-amber-700' : d.role === 'editor' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>
                          {d.role}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold
                          ${d.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {d.status}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{d.adminId}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowDetailModal(false); openEditModal(d); }}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 cursor-pointer transition-all">
                        Edit
                      </button>
                      <button onClick={() => openSessionsModal(d)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer transition-all">
                        Sessions
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { l: 'Phone', v: d.phone || 'N/A' }, { l: 'Verified', v: d.isVerified ? 'Yes' : 'No' },
                      { l: 'Last Login', v: getTimeAgo(d.lastLogin) }, { l: 'Last Active', v: getTimeAgo(d.lastActive) },
                      { l: 'Created', v: formatDate(d.createdAt) }, { l: 'Sessions', v: `${d.activeSessions?.length || 0}` },
                    ].map(item => (
                      <div key={item.l} className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{item.l}</p>
                        <p className="text-[13px] font-semibold text-slate-800 mt-0.5">{item.v}</p>
                      </div>
                    ))}
                  </div>

                  {d.createdBy && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
                      <p className="text-[10px] text-blue-500 uppercase font-semibold">Created By</p>
                      <p className="text-sm font-medium text-blue-800">{d.createdBy.name} ({d.createdBy.email})</p>
                    </div>
                  )}

                  {d.status === 'blocked' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                      <p className="text-xs font-bold text-rose-700 mb-1">Account Blocked</p>
                      <p className="text-sm text-rose-600">Reason: {d.blockReason || 'N/A'}</p>
                      {d.blockedBy && <p className="text-xs text-rose-400 mt-1">By: {d.blockedBy.name}</p>}
                      {d.blockedAt && <p className="text-xs text-rose-400">At: {formatDate(d.blockedAt)}</p>}
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Shield size={14} className="text-slate-400" /> Permissions
                    </h4>
                    <PermissionViewer permissions={d.permissions} />
                  </div>

                  {staffActivity.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Activity size={14} className="text-slate-400" /> Recent Activity
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {staffActivity.slice(0, 10).map((log) => (
                          <div key={log._id} className="flex items-start gap-3 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700">{log.action.replace(/_/g, ' ').toUpperCase()}</p>
                              <p className="text-[11px] text-slate-500 truncate">{log.details}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatDate(log.createdAt)}{log.admin && ` · ${log.admin.name}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </Modal>

        {/* ═══ SESSIONS MODAL ═══ */}
        <Modal open={showSessionsModal && !!selectedStaff} onClose={() => setShowSessionsModal(false)} maxWidth="max-w-2xl">
          <div className="sticky top-0 bg-white/95 backdrop-blur-xl px-6 py-4 border-b border-slate-100 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Monitor size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Sessions & Logins</h2>
                  <p className="text-[11px] text-slate-500">{selectedStaff?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {staffSessions.length > 0 && (
                  <button onClick={() => selectedStaff && handleLogoutAll(selectedStaff._id, selectedStaff.name)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 cursor-pointer hover:bg-rose-700 transition-all">
                    {actionLoading ? '…' : 'Logout All'}
                  </button>
                )}
                <button onClick={() => setShowSessionsModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {sessionLoading ? (
              <div className="flex flex-col items-center py-16">
                <Loader2 size={32} className="animate-spin text-indigo-400" />
                <p className="text-sm text-slate-400 mt-3">Loading sessions…</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { l: 'Active', v: sessionStats.totalActiveSessions },
                    { l: 'Devices', v: sessionStats.uniqueDevices },
                    { l: 'IPs', v: sessionStats.uniqueIPs },
                    { l: 'Logins', v: sessionStats.totalLoginHistory },
                  ].map(s => (
                    <div key={s.l} className="bg-slate-50 rounded-xl px-3 py-3 text-center border border-slate-100">
                      <p className="text-xl font-bold text-slate-800">{s.v}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{s.l}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    Active Sessions ({staffSessions.length})
                  </h4>

                  {staffSessions.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                      <Monitor size={28} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No active sessions</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {staffSessions.map((session) => (
                        <div key={session.sessionId}
                          className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Monitor size={14} className="text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-slate-800">{session.device}</span>
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-100">
                              {session.browser}
                            </span>
                            {session.isCurrentSession && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 ml-[42px] text-[11px] text-slate-500">
                            <span className="flex items-center gap-1"><MapPin size={10} /> {session.location}</span>
                            <span className="flex items-center gap-1"><Globe size={10} /> {session.ip}</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {session.duration || getTimeAgo(session.loginTime)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2 ml-[42px]">Login: {formatDate(session.loginTime)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {staffLoginHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      Login History ({staffLoginHistory.length})
                    </h4>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {staffLoginHistory.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5 text-[11px] hover:bg-white transition-colors">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0
                            ${entry.status === 'current' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-slate-700 font-semibold min-w-[70px]">{entry.device}</span>
                          <span className="text-slate-500">{entry.browser}</span>
                          <span className="text-slate-400 font-mono text-[10px] flex-1 text-right">{entry.ip}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold
                            ${entry.status === 'current' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {entry.status}
                          </span>
                          <span className="text-slate-400 text-[10px] min-w-[50px] text-right">{getTimeAgo(entry.time)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>

      </div>
    </div>
  );
}