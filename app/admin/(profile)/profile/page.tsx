// app/admin/profile/page.tsx

'use client';

import * as React from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  Edit3,
  Save,
  X,
  Loader2,
  KeyRound,
  Monitor,
  Clock,
  Calendar,
  Globe,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Eye,
  EyeOff,
  ChevronRight,
  LogIn,
  History,
  Zap,
  Star,
  Crown,
  BadgeCheck,
  ShieldCheck,
  Lock,
  Unlock,
  Copy,
  Check,
  ExternalLink,
  Settings,
  Bell,
  Palette,
  Info,
  ArrowRight,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Hash,
  AtSign,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import Link from 'next/link';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface IPermissions {
  dashboard: string;
  products: string;
  orders: string;
  customers: string;
  staff: string;
  settings: string;
  reports: string;
}

interface IProfile {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  adminId: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'blocked' | 'suspended';
  isVerified: boolean;
  permissions: IPermissions;
  isTwoFactorEnabled: boolean;
  isOnline: boolean;
  lastLogin: string;
  lastActive: string;
  createdBy: { name: string; email: string; adminId: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ICurrentSession {
  sessionId: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: string;
  lastActive: string;
}

interface IRecentActivity {
  _id: string;
  action: string;
  actionLabel: string;
  details: string;
  createdAt: string;
  timeAgo: string;
  admin: { name: string; email: string } | null;
}

interface IProfileStats {
  totalActiveSessions: number;
  totalLoginHistory: number;
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function getInitials(name?: string): string {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??'
  );
}

function getTimeSince(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

const ROLE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    iconBg: string;
    icon: React.ElementType;
    description: string;
    gradient: string;
  }
> = {
  admin: {
    label: 'Administrator',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200/60',
    iconBg: 'bg-blue-100',
    icon: Crown,
    description: 'Full system access & control',
    gradient: 'from-blue-500/50 to-indigo-600/50',
  },
  editor: {
    label: 'Editor',
    color: 'text-violet-700',
    bg: 'bg-violet-50 border-violet-200/60',
    iconBg: 'bg-violet-100',
    icon: Edit3,
    description: 'Can edit content & manage orders',
    gradient: 'from-violet-500 to-purple-600',
  },
  viewer: {
    label: 'Viewer',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200/60',
    iconBg: 'bg-emerald-100',
    icon: Eye,
    description: 'Read-only access to dashboard',
    gradient: 'from-emerald-500 to-teal-600',
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string; ring: string }
> = {
  active: {
    label: 'Active',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/20',
  },
  blocked: {
    label: 'Blocked',
    color: 'text-rose-700 bg-rose-50 border-rose-200/60',
    dot: 'bg-rose-500',
    ring: 'ring-rose-500/20',
  },
  suspended: {
    label: 'Suspended',
    color: 'text-amber-700 bg-amber-50 border-amber-200/60',
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/20',
  },
};

const PERMISSION_LEVELS: Record<
  string,
  { label: string; color: string; icon: React.ElementType; dotColor: string }
> = {
  full: {
    label: 'Full Access',
    color: 'text-emerald-700 bg-emerald-50/80',
    icon: CheckCircle2,
    dotColor: 'bg-emerald-500',
  },
  edit: {
    label: 'Edit',
    color: 'text-blue-700 bg-blue-50/80',
    icon: Edit3,
    dotColor: 'bg-blue-500',
  },
  view: {
    label: 'View Only',
    color: 'text-amber-700 bg-amber-50/80',
    icon: Eye,
    dotColor: 'bg-amber-500',
  },
  none: {
    label: 'No Access',
    color: 'text-gray-400 bg-gray-50/80',
    icon: X,
    dotColor: 'bg-gray-300',
  },
};

const PERMISSION_ICONS: Record<string, React.ElementType> = {
  dashboard: Activity,
  products: Star,
  orders: TrendingUp,
  customers: User,
  staff: Crown,
  settings: Settings,
  reports: TrendingUp,
};

const AVATAR_GRADIENTS = [
  'from-blue-500 via-blue-600 to-indigo-700',
  'from-violet-500 via-violet-600 to-purple-700',
  'from-emerald-500 via-emerald-600 to-teal-700',
  'from-rose-500 via-rose-600 to-pink-700',
  'from-amber-500 via-amber-600 to-orange-700',
  'from-cyan-500 via-cyan-600 to-blue-700',
  'from-indigo-500 via-indigo-600 to-blue-700',
];

function getAvatarGradient(name: string): string {
  return AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

function calculateSecurityScore(
  profile: IProfile,
  stats: IProfileStats | null
): number {
  let score = 40;
  if (profile.isVerified) score += 20;
  if (profile.isTwoFactorEnabled) score += 25;
  if (profile.phone) score += 5;
  if ((stats?.totalActiveSessions || 1) <= 3) score += 10;
  return Math.min(score, 100);
}

// ═══════════════════════════════════════
// SECTION CARD COMPONENT
// ═══════════════════════════════════════

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-gray-200/60 shadow-2xl shadow-gray-100 hover:shadow-md transition-shadow duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
      <h2 className="text-sm sm:text-[15px] font-bold text-gray-900 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-500" />
        </div>
        {title}
      </h2>
      {action}
    </div>
  );
}

// ═══════════════════════════════════════
// INFO ROW COMPONENT
// ═══════════════════════════════════════

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  badge,
  action,
  iconColor = 'text-gray-400',
  iconBg = 'bg-gray-50',
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  mono?: boolean;
  badge?: { text: string; color: string };
  action?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 sm:py-3.5 px-5 sm:px-6 group hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
            iconBg
          )}
        >
          <Icon className={clsx('w-4 h-4', iconColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p
            className={clsx(
              'text-[13px] text-xs sm:text-[14px] text-gray-800 truncate mt-0.5'
             
            )}
          >
            {value}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {badge && (
          <span
            className={clsx(
              'hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border',
              badge.color
            )}
          >
            {badge.text}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// EDIT PROFILE FORM
// ═══════════════════════════════════════

function EditProfileForm({
  profile,
  onSave,
  onCancel,
  isSaving,
}: {
  profile: IProfile;
  onSave: (data: { name: string; phone: string; avatar: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = React.useState(profile.name);
  const [phone, setPhone] = React.useState(profile.phone || '');
  const [avatar, setAvatar] = React.useState(profile.avatar || '');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = React.useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (name.trim().length < 2)
      newErrors.name = 'Name must be at least 2 characters';
    if (phone && !/^[+]?[\d\s\-()]{7,20}$/.test(phone.trim())) {
      newErrors.phone = 'Invalid phone format';
    }
    if (avatar && avatar.trim()) {
      try {
        new URL(avatar.trim());
      } catch {
        newErrors.avatar = 'Invalid URL format';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
      });
    }
  };

  const hasChanges =
    name !== profile.name ||
    phone !== (profile.phone || '') ||
    avatar !== (profile.avatar || '');

  return (
    <form
      onSubmit={handleSubmit}
      className="px-5 sm:px-6 pb-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Name */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3 h-3" />
          Full Name <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: '' }));
            }}
            className={clsx(
              'w-full px-4 py-3 sm:py-3.5 bg-gray-50/80 border-2 rounded-xl text-[14px] sm:text-[15px] text-gray-900 font-medium transition-all',
              'focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10',
              'placeholder:text-gray-300',
              errors.name
                ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-500/10'
                : 'border-gray-200/80'
            )}
            placeholder="Enter your full name"
          />
          {name && !errors.name && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          )}
        </div>
        {errors.name && (
          <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-3 h-3" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="w-3 h-3" />
          Phone Number
        </label>
        <div className="relative">
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((p) => ({ ...p, phone: '' }));
            }}
            className={clsx(
              'w-full px-4 py-3 sm:py-3.5 bg-gray-50/80 border-2 rounded-xl text-[14px] sm:text-[15px] text-gray-900 font-medium transition-all',
              'focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10',
              'placeholder:text-gray-300',
              errors.phone
                ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-500/10'
                : 'border-gray-200/80'
            )}
            placeholder="+880 1712 345678"
          />
        </div>
        {errors.phone && (
          <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-3 h-3" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* Avatar URL */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="w-3 h-3" />
          Avatar URL
        </label>
        <input
          type="url"
          value={avatar}
          onChange={(e) => {
            setAvatar(e.target.value);
            if (errors.avatar) setErrors((p) => ({ ...p, avatar: '' }));
          }}
          className={clsx(
            'w-full px-4 py-3 sm:py-3.5 bg-gray-50/80 border-2 rounded-xl text-[14px] sm:text-[15px] text-gray-900 font-medium transition-all',
            'focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10',
            'placeholder:text-gray-300',
            errors.avatar
              ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-500/10'
              : 'border-gray-200/80'
          )}
          placeholder="https://example.com/avatar.jpg"
        />
        {errors.avatar && (
          <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-3 h-3" />
            {errors.avatar}
          </p>
        )}
        {avatar && !errors.avatar && (
          <div className="flex items-center gap-3 mt-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <img
              src={avatar}
              alt="Preview"
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-2xl shadow-gray-100"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <p className="text-[11px] font-semibold text-gray-600">
                Avatar Preview
              </p>
              <p className="text-[10px] text-gray-400">
                Image will be shown as your profile picture
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100/80 rounded-xl p-4">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-blue-800">
            Limited edit access
          </p>
          <p className="text-[11px] text-blue-600/70 mt-0.5 leading-relaxed">
            Email and role can only be changed by an administrator. Contact your
            admin for those changes.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-5 py-3 rounded-xl text-[14px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-gray-700 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || !hasChanges}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl text-[14px] font-bold transition-all',
            'cursor-pointer disabled:cursor-not-allowed',
            isSaving || !hasChanges
              ? 'bg-gray-100 text-gray-400 border border-gray-200'
              : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg shadow-gray-900/20 hover:shadow-xl hover:from-gray-900 hover:to-black active:scale-[0.98]'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════
// QUICK ACTION CARD
// ═══════════════════════════════════════

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  iconBg,
  iconColor,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200/60 hover:border-gray-300/30 hover:shadow-lg hover:shadow-gray-200/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
    >
      <div
        className={clsx(
          'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105',
          iconBg
        )}
      >
        <Icon className={clsx('w-5 h-5', iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] sm:text-[14px] font-bold text-gray-900 flex items-center gap-2">
          {title}
          {badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-blue-300/10 text-blue-500 text-[10px] font-bold leading-none">
              {badge}
            </span>
          )}
        </p>
        <p className="text-[11px] text-gray-400 text-xs mt-0.5 truncate">
          {description}
        </p>
      </div>
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors shrink-0">
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════
// SECURITY ITEM
// ═══════════════════════════════════════

function SecurityItem({
  icon: Icon,
  title,
  subtitle,
  iconBg,
  iconColor,
  status,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  status: 'good' | 'warning' | 'danger';
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/50 border border-gray-100/80 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            iconBg
          )}
        >
          <Icon className={clsx('w-4 h-4', iconColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">
            {title}
          </p>
          <p className="text-[10px] sm:text-[11px] text-gray-400 truncate">
            {subtitle}
          </p>
        </div>
      </div>
      {status === 'good' && (
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
      )}
      {status === 'warning' && (
        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-500" />
        </div>
      )}
      {status === 'danger' && (
        <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// TIMELINE ITEM
// ═══════════════════════════════════════

function TimelineItem({
  icon: Icon,
  title,
  subtitle,
  iconBg,
  iconColor,
  isLast = false,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[18px] top-10 w-px h-[calc(100%+4px)] bg-gray-100" />
      )}
      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative z-10',
          iconBg
        )}
      >
        <Icon className={clsx('w-4 h-4', iconColor)} />
      </div>
      <div className="pb-5 min-w-0">
        <p className="text-[12px] sm:text-[13px] font-semibold text-gray-700">
          {title}
        </p>
        <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden mb-6 animate-pulse">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-gray-100 to-gray-50" />
          <div className="px-5 sm:px-8 pb-6 -mt-12 sm:-mt-14 relative">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gray-200 rounded-2xl ring-4 ring-white" />
              <div className="space-y-3 flex-1 pt-0 sm:pt-16">
                <div className="w-40 sm:w-52 h-6 sm:h-7 bg-gray-200 rounded-lg" />
                <div className="w-52 sm:w-72 h-4 bg-gray-100 rounded-lg" />
                <div className="flex gap-2 flex-wrap">
                  <div className="w-24 h-7 bg-gray-100 rounded-lg" />
                  <div className="w-16 h-7 bg-gray-100 rounded-lg" />
                  <div className="w-20 h-7 bg-gray-100 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200/60 p-4 animate-pulse"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg mb-3" />
              <div className="w-12 h-6 bg-gray-200 rounded mb-1" />
              <div className="w-20 h-3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200/60 p-6 animate-pulse"
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                  <div className="w-32 h-4 bg-gray-100 rounded-lg" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl" />
                      <div className="flex-1 space-y-1.5">
                        <div className="w-16 h-2.5 bg-gray-50 rounded" />
                        <div className="w-36 h-3.5 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200/60 p-5 animate-pulse"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-3 bg-gray-100 rounded" />
                  <div className="w-24 h-3 bg-gray-100 rounded" />
                </div>
                <div className="space-y-2.5">
                  <div className="w-full h-14 bg-gray-50 rounded-xl" />
                  <div className="w-full h-14 bg-gray-50 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = React.useState<IProfile | null>(null);
  const [currentSession, setCurrentSession] =
    React.useState<ICurrentSession | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<
    IRecentActivity[]
  >([]);
  const [profileStats, setProfileStats] =
    React.useState<IProfileStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [showAllPermissions, setShowAllPermissions] = React.useState(false);

  // ── Fetch Profile ──
  const fetchProfile = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/auth/profile', {
        withCredentials: true,
      });

      if (response.data.success && response.data.data) {
        setProfile(response.data.data.profile);
        setCurrentSession(response.data.data.currentSession || null);
        setRecentActivity(response.data.data.recentActivity || []);
        setProfileStats(response.data.data.stats || null);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          router.push('/access');
          return;
        }
        toast.error(
          error.response?.data?.message || 'Failed to load profile'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Update Profile ──
  const handleSaveProfile = async (data: {
    name: string;
    phone: string;
    avatar: string;
  }) => {
    setIsSaving(true);
    try {
      const response = await axios.put('/api/auth/profile/update', data, {
        withCredentials: true,
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!', { icon: '✨' });
        setProfile(response.data.data.profile);
        setIsEditing(false);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || 'Failed to update profile'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Copy ──
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Loading ──
  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return null;

  const roleConfig = ROLE_CONFIG[profile.role] || ROLE_CONFIG.viewer;
  const statusConfig = STATUS_CONFIG[profile.status] || STATUS_CONFIG.active;
  const gradient = getAvatarGradient(profile.name);
  const RoleIcon = roleConfig.icon;
  const securityScore = calculateSecurityScore(profile, profileStats);

  const permissionEntries = Object.entries(profile.permissions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50/80 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* ═══════════════════════════════
            PROFILE HEADER
        ═══════════════════════════════ */}
        <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-gray-200/60 overflow-hidden mb-4 sm:mb-6 shadow-2xl shadow-gray-100">
          {/* Top gradient bar */}
          <div
            className={clsx(
              'h-24 sm:h-32 lg:h-36 bg-gradient-to-r',
              roleConfig.gradient
            )}
          >
            {/* Pattern overlay */}
            <div
              className="w-full h-full opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          <div className="relative px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6">
            {/* Avatar + Info */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 -mt-10 sm:-mt-14 lg:-mt-16">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 bg-white rounded-[18px] sm:rounded-[22px] shadow-2xl shadow-gray-100" />
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl sm:rounded-[18px] object-cover ring-4 ring-white shadow-md"
                  />
                ) : (
                  <div
                    className={clsx(
                      'relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl sm:rounded-[18px] bg-gradient-to-br flex items-center justify-center ring-4 ring-white shadow-md',
                      gradient
                    )}
                  >
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-md">
                      {getInitials(profile.name)}
                    </span>
                  </div>
                )}

                {/* Online */}
                {profile.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 sm:h-5 sm:w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                    <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-emerald-500 ring-[3px] ring-white items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    </span>
                  </span>
                )}

                {/* Hover edit */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute inset-0 rounded-2xl sm:rounded-[18px] bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                >
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-1 sm:pt-14 lg:pt-16 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 flex-wrap">
                      <span className="truncate">{profile.name}</span>
                      {profile.isVerified && (
                        <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 shrink-0" />
                      )}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5 sm:mt-1 truncate">
                      {profile.email}
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border',
                          roleConfig.bg,
                          roleConfig.color
                        )}
                      >
                        <RoleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {roleConfig.label}
                      </span>

                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border',
                          statusConfig.color
                        )}
                      >
                        <span
                          className={clsx(
                            'w-1.5 h-1.5 rounded-full animate-pulse',
                            statusConfig.dot
                          )}
                        />
                        {statusConfig.label}
                      </span>

                      {profile.isTwoFactorEnabled && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 border border-emerald-200/60 text-emerald-700">
                          <ShieldCheck className="w-3 h-3" />
                          2FA
                        </span>
                      )}

                      {profile.isOnline && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 border border-emerald-200/60 text-emerald-700">
                          <Zap className="w-3 h-3" />
                          Online
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit button */}
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gray-900 text-white text-[12px] sm:text-[13px] font-bold shadow-lg shadow-gray-900/15 hover:shadow-xl hover:bg-black active:scale-[0.97] transition-all cursor-pointer shrink-0 w-full sm:w-auto justify-center sm:justify-start"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════
            STATS ROW
        ═══════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          {[
            {
              icon: Shield,
              label: 'Security Score',
              value: `${securityScore}%`,
              color:
                securityScore >= 80
                  ? 'text-emerald-600'
                  : securityScore >= 60
                    ? 'text-blue-600'
                    : 'text-amber-600',
              iconBg:
                securityScore >= 80
                  ? 'bg-emerald-50'
                  : securityScore >= 60
                    ? 'bg-blue-50'
                    : 'bg-amber-50',
              iconColor:
                securityScore >= 80
                  ? 'text-emerald-500'
                  : securityScore >= 60
                    ? 'text-blue-500'
                    : 'text-amber-500',
            },
            {
              icon: Monitor,
              label: 'Active Sessions',
              value: `${profileStats?.totalActiveSessions || 1}`,
              color: 'text-blue-600',
              iconBg: 'bg-blue-50',
              iconColor: 'text-blue-500',
            },
            {
              icon: History,
              label: 'Login History',
              value: `${profileStats?.totalLoginHistory || 0}`,
              color: 'text-violet-600',
              iconBg: 'bg-violet-50',
              iconColor: 'text-violet-500',
            },
            {
              icon: Clock,
              label: 'Last Active',
              value: getTimeSince(profile.lastActive),
              color: 'text-gray-700',
              iconBg: 'bg-gray-100',
              iconColor: 'text-gray-500',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/60 p-3.5 sm:p-4 lg:p-5 hover:shadow-2xl hover:shadow-gray-100 hover:border-gray-100/20 transition-all duration-300 group"
            >
              <div
                className={clsx(
                  'w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-105 transition-transform',
                  stat.iconBg
                )}
              >
                <stat.icon className={clsx('w-4 h-4', stat.iconColor)} />
              </div>
              <p
                className={clsx(
                  'text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight',
                  stat.color
                )}
              >
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 mt-0.5 truncate">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════
            MAIN GRID
        ═══════════════════════════════ */}
        <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Personal Info / Edit */}
            <SectionCard>
              <SectionHeader
                icon={User}
                title={isEditing ? 'Edit Profile' : 'Personal Information'}
                action={
                  isEditing ? (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : undefined
                }
              />

              {isEditing ? (
                <EditProfileForm
                  profile={profile}
                  onSave={handleSaveProfile}
                  onCancel={() => setIsEditing(false)}
                  isSaving={isSaving}
                />
              ) : (
                <div className="divide-y divide-gray-100/80">
                  <InfoRow
                    icon={User}
                    iconBg="bg-blue-50/50"
                    iconColor="text-blue-500"
                    label="Full Name"
                    value={profile.name}
                  />
                  <InfoRow
                    icon={AtSign}
                    iconBg="bg-violet-50/50"
                    iconColor="text-violet-500"
                    label="Email Address"
                    value={profile.email}
                    action={
                      <button
                        onClick={() =>
                          copyToClipboard(profile.email, 'email')
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    }
                  />
                  <InfoRow
                    icon={Phone}
                    iconBg="bg-emerald-50/50"
                    iconColor="text-emerald-500"
                    label="Phone"
                    value={
                      profile.phone || (
                        <span className="text-gray-300 italic font-normal">
                          Not set
                        </span>
                      )
                    }
                  />
                  <InfoRow
                    icon={Hash}
                    iconBg="bg-amber-50/50"
                    iconColor="text-amber-500"
                    label="Admin ID"
                    value={profile.adminId}
                    mono
                    action={
                      <button
                        onClick={() =>
                          copyToClipboard(profile.adminId, 'adminId')
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
                        title="Copy Admin ID"
                      >
                        {copiedField === 'adminId' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    }
                  />
                  <InfoRow
                    icon={Calendar}
                    iconBg="bg-cyan-50/50"
                    iconColor="text-cyan-500"
                    label="Member Since"
                    value={format(new Date(profile.createdAt), 'PPP')}
                  />
                  {profile.createdBy && (
                    <InfoRow
                      icon={Star}
                      iconBg="bg-rose-50"
                      iconColor="text-rose-500"
                      label="Added By"
                      value={profile.createdBy.name}
                      badge={{
                        text: profile.createdBy.adminId,
                        color: 'bg-gray-50 text-gray-500 border-gray-200',
                      }}
                    />
                  )}
                </div>
              )}
            </SectionCard>

            {/* Permissions */}
            <SectionCard>
              <SectionHeader icon={Shield} title="Permissions" />

              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {(showAllPermissions
                    ? permissionEntries
                    : permissionEntries.slice(0, 4)
                  ).map(([key, value]) => {
                    const level =
                      PERMISSION_LEVELS[value] || PERMISSION_LEVELS.none;
                    const PermIcon =
                      PERMISSION_ICONS[key] || Shield;
                    const LevelIcon = level.icon || CheckCircle2;

                    return (
                      <div
                        key={key}
                        className="group flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-gray-50/50 border border-gray-100/80 hover:bg-white hover:border-gray-200 hover:shadow-2xl shadow-gray-100 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200/80 flex items-center justify-center shrink-0">
                            <PermIcon className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                          <span className="text-[12px] sm:text-[13px] font-semibold text-gray-700 capitalize truncate">
                            {key}
                          </span>
                        </div>
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold shrink-0',
                            level.color
                          )}
                        >
                          <LevelIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">
                            {level.label}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {permissionEntries.length > 4 && (
                  <button
                    onClick={() => setShowAllPermissions(!showAllPermissions)}
                    className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <ChevronDown
                      className={clsx(
                        'w-3.5 h-3.5 transition-transform',
                        showAllPermissions && 'rotate-180'
                      )}
                    />
                    {showAllPermissions
                      ? 'Show less'
                      : `Show ${permissionEntries.length - 4} more`}
                  </button>
                )}

                {/* Role note */}
                <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-blue-50/60 to-violet-50/40 border border-blue-100/50">
                  <p className="text-[11px] sm:text-[12px] text-blue-700/70 flex items-start gap-2.5 leading-relaxed">
                    <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span>
                      As a{' '}
                      <span className="font-bold">{roleConfig.label}</span>,
                      you have {roleConfig.description.toLowerCase()}.
                      {profile.role !== 'admin' &&
                        ' Contact your admin to request permission changes.'}
                    </span>
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <SectionCard>
                <SectionHeader
                  icon={Activity}
                  title="Recent Activity"
                  action={
                    <Link
                      href="/admin/activity-log"
                      className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-blue-500 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
                    >
                      View all
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  }
                />

                <div className="px-3 sm:px-4 pb-4 sm:pb-5">
                  <div className="space-y-0.5">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div
                        key={activity._id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-colors group"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                            <Activity className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          {index < recentActivity.slice(0, 5).length - 1 && (
                            <div className="absolute left-1/2 top-full w-px h-2 bg-gray-100 -translate-x-1/2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800 truncate">
                            {activity.actionLabel ||
                              activity.action.replace(/_/g, ' ')}
                          </p>
                          {activity.details && (
                            <p className="text-[10px] sm:text-[11px] text-gray-400 truncate mt-0.5">
                              {activity.details}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium whitespace-nowrap shrink-0 bg-gray-50 px-2 py-1 rounded-md">
                          {activity.timeAgo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Quick Actions
              </h3>

              <QuickActionCard
                icon={KeyRound}
                title="Change Password"
                description="Update your password"
                href="/admin/settings"
                iconBg="bg-violet-50/50"
                iconColor="text-violet-600"
              />
              <QuickActionCard
                icon={Monitor}
                title="Active Sessions"
                description="Manage your devices"
                href="/admin/sessions"
                iconBg="bg-blue-50/50"
                iconColor="text-blue-600"
                badge={
                  profileStats && profileStats.totalActiveSessions > 1
                    ? `${profileStats.totalActiveSessions}`
                    : undefined
                }
              />
              <QuickActionCard
                icon={Shield}
                title="Two-Factor Auth"
                description={
                  profile.isTwoFactorEnabled
                    ? '2FA is enabled'
                    : 'Set up 2FA for extra security'
                }
                href="/admin/settings"
                iconBg={
                  profile.isTwoFactorEnabled
                    ? 'bg-emerald-50/50'
                    : 'bg-amber-50'
                }
                iconColor={
                  profile.isTwoFactorEnabled
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }
              />
              <QuickActionCard
                icon={Activity}
                title="Activity Log"
                description="View your activity history"
                href="/admin/activity-log"
                iconBg="bg-gray-100/50"
                iconColor="text-gray-600"
              />
            </div>

            {/* Current Session */}
            {currentSession && (
              <SectionCard>
                <div className="p-4 sm:p-5">
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    Current Session
                  </h3>

                  {/* Active badge */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/80 mb-3.5">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40" />
                    </div>
                    <span className="text-[11px] sm:text-[12px] font-bold text-emerald-700">
                      Currently active
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      {
                        icon: Monitor,
                        text: currentSession.device,
                      },
                      {
                        icon: Globe,
                        text: currentSession.browser,
                      },
                      {
                        icon: MapPin,
                        text: `${currentSession.ip} · ${currentSession.location}`,
                      },
                      {
                        icon: Clock,
                        text: `Logged in ${getTimeSince(currentSession.loginTime)}`,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 text-[11px] sm:text-[12px] text-gray-500"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                          <item.icon className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                        <span className="font-medium truncate">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Security Status */}
            <SectionCard>
              <div className="p-4 sm:p-5">
                <h3 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Security Status
                </h3>

                <div className="space-y-2">
                  <SecurityItem
                    icon={Lock}
                    title="Password"
                    subtitle={`Updated ${getTimeSince(profile.updatedAt)}`}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                    status="good"
                  />
                  <SecurityItem
                    icon={Fingerprint}
                    title="Two-Factor Auth"
                    subtitle={
                      profile.isTwoFactorEnabled
                        ? 'Enabled & active'
                        : 'Not configured'
                    }
                    iconBg={
                      profile.isTwoFactorEnabled
                        ? 'bg-emerald-50'
                        : 'bg-amber-50'
                    }
                    iconColor={
                      profile.isTwoFactorEnabled
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }
                    status={
                      profile.isTwoFactorEnabled ? 'good' : 'warning'
                    }
                  />
                  <SecurityItem
                    icon={Mail}
                    title="Email Verified"
                    subtitle={profile.email}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    status={profile.isVerified ? 'good' : 'danger'}
                  />
                  <SecurityItem
                    icon={Monitor}
                    title="Active Sessions"
                    subtitle={`${profileStats?.totalActiveSessions || 1} device${(profileStats?.totalActiveSessions || 1) !== 1 ? 's' : ''}`}
                    iconBg="bg-violet-50"
                    iconColor="text-violet-600"
                    status={
                      (profileStats?.totalActiveSessions || 1) > 3
                        ? 'warning'
                        : 'good'
                    }
                  />
                </div>

                {/* Security score bar */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Security Score
                    </span>
                    <span
                      className={clsx(
                        'text-[14px] sm:text-[15px] font-extrabold',
                        securityScore >= 80
                          ? 'text-emerald-600'
                          : securityScore >= 60
                            ? 'text-blue-600'
                            : 'text-amber-600'
                      )}
                    >
                      {securityScore}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-1000 ease-out',
                        securityScore >= 80
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : securityScore >= 60
                            ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                            : 'bg-gradient-to-r from-amber-400 to-amber-500'
                      )}
                      style={{ width: `${securityScore}%` }}
                    />
                  </div>
                  {!profile.isTwoFactorEnabled && (
                    <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-100/60">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] sm:text-[11px] text-amber-700/80 font-medium leading-relaxed">
                        Enable 2FA to improve your security score by 25%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Account Timeline */}
            <SectionCard>
              <div className="p-4 sm:p-5">
                <h3 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Account Timeline
                </h3>

                <div>
                  <TimelineItem
                    icon={Calendar}
                    title="Account Created"
                    subtitle={format(
                      new Date(profile.createdAt),
                      'PPP'
                    )}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                  />
                  <TimelineItem
                    icon={LogIn}
                    title="Last Login"
                    subtitle={getTimeSince(profile.lastLogin)}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-500"
                  />
                  <TimelineItem
                    icon={RefreshCw}
                    title="Profile Updated"
                    subtitle={getTimeSince(profile.updatedAt)}
                    iconBg="bg-violet-50"
                    iconColor="text-violet-500"
                  />
                  <TimelineItem
                    icon={Activity}
                    title="Last Active"
                    subtitle={getTimeSince(profile.lastActive)}
                    iconBg="bg-gray-100"
                    iconColor="text-gray-500"
                    isLast
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-6 sm:h-8" />
      </div>
    </div>
  );
}