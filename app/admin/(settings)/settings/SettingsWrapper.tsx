// app/(dashboard)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Lock,
  User,
  Key,
  Loader2,
  CheckCircle2,
  BadgeCheck,
  Clock,
  Activity,
  AlertCircle,
  QrCode,
  X,
  ArrowRight,
  ShieldAlert,
  Settings,
  Shield,
  Fingerprint,
  Sparkles,
  Globe,
  Wifi,
  WifiOff,
  Monitor,
  Hash,
  Mail,
  Phone,
  CalendarDays,
  Zap,
  CircleDot,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  changePasswordSchema,
  ChangePasswordInput,
} from '@/app/api/controller/helper/validation';
import Link from 'next/link';

// ─── Types ───
interface ProfileData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  adminId: string;
  role: string;
  status: string;
  isVerified: boolean;
  permissions: string[];
  isTwoFactorEnabled: boolean;
  isOnline: boolean;
  lastLogin?: string;
  lastActive?: string;
  createdBy?: {
    name: string;
    email: string;
    adminId: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SessionData {
  sessionId: string;
  device?: string;
  browser?: string;
  ip?: string;
  location?: string;
  loginAt?: string;
}

interface ActivityItem {
  _id: string;
  action: string;
  description?: string;
  admin?: {
    name: string;
    email: string;
    adminId: string;
  };
  createdAt: string;
}

interface StatsData {
  totalActiveSessions: number;
  totalLoginHistory: number;
}

export  function SettingsWrapper() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [fetchingUser, setFetchingUser] = useState(true);

  // 2FA States
  const [is2FASetupMode, setIs2FASetupMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [tempSecret, setTempSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  // Modal State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);

  // Password Form
  const {
    register: registerPass,
    handleSubmit: handleSubmitPass,
    reset: resetPass,
    setError: setPassError,
    clearErrors: clearPassErrors,
    formState: { errors: errorsPass },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  // ─── Fetch Profile Data ───
  const fetchProfile = async () => {
    try {
      const { data } = await axios.get('/api/auth/profile');
      if (data.success && data.data) {
        setProfile(data.data.profile);
        setCurrentSession(data.data.currentSession);
        setRecentActivity(data.data.recentActivity || []);
        setStats(data.data.stats);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message || 'Failed to load profile';
      toast.error(msg);
    } finally {
      setFetchingUser(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ─── 2FA Logic ───
  const handle2FAToggleClick = () => {
    if (profile?.isTwoFactorEnabled) {
      setIsDisableModalOpen(true);
      return;
    }
    start2FASetup();
  };

  const start2FASetup = async () => {
    try {
      setVerifying2FA(true);
      const { data } = await axios.get('/api/auth/2fa/setup');
      if (data.success && data.qrCodeUrl) {
        setQrCodeUrl(data.qrCodeUrl);
        setTempSecret(data.secret);
        setIs2FASetupMode(true);
      } else {
        toast.error('Could not generate QR Code');
      }
    } catch {
      toast.error('Failed to start 2FA setup');
    } finally {
      setVerifying2FA(false);
    }
  };

  const confirmDisable2FA = async () => {
    setDisabling2FA(true);
    try {
      const { data } = await axios.post('/api/auth/2fa/disable');
      if (data.success) {
        toast.success('Two-Factor Authentication Disabled');
        setProfile((prev) =>
          prev ? { ...prev, isTwoFactorEnabled: false } : null
        );
        setIsDisableModalOpen(false);
      }
    } catch {
      toast.error('Failed to disable 2FA');
    } finally {
      setDisabling2FA(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setVerifying2FA(true);
    try {
      const { data } = await axios.post('/api/auth/2fa/enable', {
        code: twoFactorCode,
        secret: tempSecret,
      });
      if (data.success) {
        toast.success('2FA Enabled Successfully!');
        setIs2FASetupMode(false);
        setTwoFactorCode('');
        setTempSecret('');
        setProfile((prev) =>
          prev ? { ...prev, isTwoFactorEnabled: true } : null
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid Code');
    } finally {
      setVerifying2FA(false);
    }
  };

  const cancel2FASetup = () => {
    setIs2FASetupMode(false);
    setTwoFactorCode('');
    setTempSecret('');
  };

  // ─── Password Submit ───
  const onPasswordSubmit = async (formData: ChangePasswordInput) => {
    setLoading(true);
    clearPassErrors('root');
    try {
      await axios.put('/api/auth/change-password', formData);
      toast.success('Password updated successfully');
      resetPass();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update password';
      setPassError('root', { message: errorMessage });
      if (error.response?.data?.details?.fieldErrors) {
        const fields = error.response.data.details.fieldErrors;
        if (fields.oldPassword)
          setPassError('currentPassword', {
            message: fields.oldPassword[0],
          });
        if (fields.newPassword)
          setPassError('newPassword', {
            message: fields.newPassword[0],
          });
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ───
  const inputBase =
    'w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-[13px] placeholder:text-gray-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none';
  const inputWithIcon = cn(inputBase, 'pl-10');

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-violet-50 text-violet-700 ring-violet-200',
      editor: 'bg-sky-50 text-sky-700 ring-sky-200',
      viewer: 'bg-gray-100 text-gray-600 ring-gray-200',
    };
    return styles[role] || styles.viewer;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      blocked: 'bg-rose-50 text-rose-700 ring-rose-200',
      inactive: 'bg-amber-50 text-amber-700 ring-amber-200',
    };
    return styles[status] || styles.inactive;
  };

  // ─── Loading Skeleton ───
  if (fetchingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <Skeleton className="h-[400px] w-full rounded-2xl" />
              <Skeleton className="h-[280px] w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-7 space-y-6">
              <Skeleton className="h-[360px] w-full rounded-2xl" />
              <Skeleton className="h-[300px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* ─── Disable 2FA Modal ─── */}
      <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-gray-100 bg-white p-0 shadow-xl overflow-hidden">
          <div className="p-6 pb-0">
            <DialogHeader className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
                <ShieldAlert className="h-6 w-6 text-rose-500" />
              </div>
              <DialogTitle className="text-center text-[17px] font-bold text-gray-900">
                Disable Two-Factor Authentication?
              </DialogTitle>
              <DialogDescription className="text-center text-[13px] text-gray-500 leading-relaxed">
                Disabling 2FA will make your account less secure. You
                will only need your password to sign in.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 p-6 pt-4 border-t border-gray-100 bg-gray-50/50 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDisableModalOpen(false)}
              className="w-full sm:w-1/2 h-10 rounded-xl border-gray-200 text-[13px] font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisable2FA}
              disabled={disabling2FA}
              className="w-full sm:w-1/2 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-[13px] font-bold cursor-pointer"
            >
              {disabling2FA ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disabling...
                </span>
              ) : (
                'Yes, Disable 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="pt-8 pb-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-200/50">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Settings
              </span>
            </div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900">
              Account Settings
            </h1>
            <p className="text-[13px] text-gray-400">
              Manage your profile and security preferences
            </p>
          </div>
        </header>

        {/* ═══════════════════ MAIN GRID ═══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ═══════════════ LEFT COLUMN ═══════════════ */}
          <div className="lg:col-span-5 space-y-6">
            {/* ──── Profile Card ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-100">
              {/* Profile Header Gradient */}
              <div className="relative h-24 bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
                <div className="absolute -bottom-8 left-6">
                  <div className="relative">
                    <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-gray-800 shadow-lg ring-4 ring-white">
                      {profile?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        profile?.name?.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] border-white',
                        profile?.isOnline
                          ? 'bg-emerald-500'
                          : 'bg-gray-400'
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 pt-12 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900">
                      {profile?.name}
                    </h3>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {profile?.email}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
                      getRoleBadge(profile?.role || '')
                    )}
                  >
                    {profile?.role}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
                      getStatusBadge(profile?.status || '')
                    )}
                  >
                    <CircleDot className="h-2.5 w-2.5" />
                    {profile?.status}
                  </span>
                  {profile?.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-200">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
                  <DetailRow
                    icon={<Hash className="h-3.5 w-3.5" />}
                    label="Admin ID"
                    value={profile?.adminId || '—'}
                  />
                  {profile?.phone && (
                    <DetailRow
                      icon={<Phone className="h-3.5 w-3.5" />}
                      label="Phone"
                      value={profile.phone}
                    />
                  )}
                  <DetailRow
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label="Last Login"
                    value={
                      profile?.lastLogin
                        ? format(new Date(profile.lastLogin), 'PP p')
                        : 'Never'
                    }
                  />
                  <DetailRow
                    icon={<Activity className="h-3.5 w-3.5" />}
                    label="Last Active"
                    value={
                      profile?.lastActive
                        ? format(
                            new Date(profile.lastActive),
                            'PP p'
                          )
                        : 'Now'
                    }
                  />
                  <DetailRow
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    label="Joined"
                    value={
                      profile?.createdAt
                        ? format(new Date(profile.createdAt), 'PP')
                        : '—'
                    }
                  />
                  {profile?.createdBy && (
                    <DetailRow
                      icon={<User className="h-3.5 w-3.5" />}
                      label="Created By"
                      value={profile.createdBy.name}
                    />
                  )}
                </div>

                {/* Stats Row */}
                {stats && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50/70 p-3 text-center">
                      <p className="text-[20px] font-extrabold text-blue-600 tabular-nums">
                        {stats.totalActiveSessions}
                      </p>
                      <p className="text-[10px] font-semibold text-blue-400 mt-0.5">
                        Active Sessions
                      </p>
                    </div>
                    <div className="rounded-xl bg-violet-50/70 p-3 text-center">
                      <p className="text-[20px] font-extrabold text-violet-600 tabular-nums">
                        {stats.totalLoginHistory}
                      </p>
                      <p className="text-[10px] font-semibold text-violet-400 mt-0.5">
                        Total Logins
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ──── Current Session ──── */}
            {currentSession && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-100">
                <div className="flex items-center gap-3 border-b border-gray-50 px-6 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <Globe className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900">
                      Current Session
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Your active connection
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {currentSession.device && (
                    <DetailRow
                      icon={<Monitor className="h-3.5 w-3.5" />}
                      label="Device"
                      value={currentSession.device}
                    />
                  )}
                  {currentSession.browser && (
                    <DetailRow
                      icon={<Globe className="h-3.5 w-3.5" />}
                      label="Browser"
                      value={currentSession.browser}
                    />
                  )}
                  {currentSession.ip && (
                    <DetailRow
                      icon={<Wifi className="h-3.5 w-3.5" />}
                      label="IP Address"
                      value={currentSession.ip}
                    />
                  )}
                  {currentSession.location && (
                    <DetailRow
                      icon={<Globe className="h-3.5 w-3.5" />}
                      label="Location"
                      value={currentSession.location}
                    />
                  )}
                  {currentSession.loginAt && (
                    <DetailRow
                      icon={<Clock className="h-3.5 w-3.5" />}
                      label="Connected"
                      value={format(
                        new Date(currentSession.loginAt),
                        'PP p'
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ──── 2FA Card ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 px-6 py-4">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    profile?.isTwoFactorEnabled
                      ? 'bg-emerald-50'
                      : 'bg-gray-100'
                  )}
                >
                  <Fingerprint
                    className={cn(
                      'h-4 w-4',
                      profile?.isTwoFactorEnabled
                        ? 'text-emerald-600'
                        : 'text-gray-400'
                    )}
                  />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {profile?.isTwoFactorEnabled
                      ? 'Currently enabled'
                      : 'Not configured'}
                  </p>
                </div>
              </div>

              <div className="p-6">
                {!is2FASetupMode ? (
                  <div className="space-y-4">
                    <p className="text-[13px] leading-relaxed text-gray-500">
                      {profile?.isTwoFactorEnabled
                        ? 'Your account is protected with an authenticator app.'
                        : 'Add an extra layer of security using an authenticator app.'}
                    </p>

                    <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-2xl shadow-gray-100">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg',
                            profile?.isTwoFactorEnabled
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-800">
                            {profile?.isTwoFactorEnabled
                              ? 'Enabled'
                              : 'Disabled'}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {profile?.isTwoFactorEnabled
                              ? 'Tap to disable'
                              : 'Tap to enable'}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={
                            profile?.isTwoFactorEnabled || false
                          }
                          onChange={handle2FAToggleClick}
                          disabled={verifying2FA || disabling2FA}
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-200 shadow-inner transition-colors after:absolute after:left-[3px] after:top-[3px] after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-2xl shadow-gray-100 after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-5" />
                      </div>
                    </label>

                    <div className="flex justify-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold',
                          profile?.isTwoFactorEnabled
                            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                            : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            profile?.isTwoFactorEnabled
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          )}
                        />
                        {profile?.isTwoFactorEnabled
                          ? 'PROTECTED'
                          : 'UNPROTECTED'}
                      </span>
                    </div>
                  </div>
                ) : (
                  // ─── 2FA Setup State ───
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-[13px] font-bold text-gray-800">
                        <QrCode className="h-4 w-4 text-blue-500" />{' '}
                        Scan QR Code
                      </h4>
                      <button
                        onClick={cancel2FASetup}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mx-auto w-fit rounded-xl border border-gray-100 bg-white p-3 shadow-2xl shadow-gray-100">
                      {qrCodeUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrCodeUrl}
                          alt="2FA QR Code"
                          className="h-36 w-36 object-contain"
                        />
                      ) : (
                        <Skeleton className="h-36 w-36 rounded-lg" />
                      )}
                    </div>

                    <p className="text-center text-[11px] leading-relaxed text-gray-400">
                      Scan with Google Authenticator or Authy
                      <br />
                      then enter the 6-digit code below
                    </p>

                    <div className="flex gap-2">
                      <Input
                        value={twoFactorCode}
                        onChange={(e) =>
                          setTwoFactorCode(e.target.value)
                        }
                        placeholder="000000"
                        className="h-11 rounded-xl border-gray-200 bg-gray-50 text-center text-[16px] font-bold tracking-[0.3em] text-gray-800 placeholder:text-gray-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        maxLength={6}
                      />
                      <Button
                        onClick={verifyAndEnable2FA}
                        disabled={
                          verifying2FA || twoFactorCode.length !== 6
                        }
                        className="h-11 w-12 shrink-0 rounded-xl bg-blue-500 p-0 text-white hover:bg-blue-600 disabled:opacity-40 cursor-pointer"
                      >
                        {verifying2FA ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
          <div className="lg:col-span-7 space-y-6">
            {/* ──── Password Card ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 px-6 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                  <Key className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">
                    Change Password
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Update your password regularly
                  </p>
                </div>
              </div>

              <div className="p-6">
                <form
                  onSubmit={handleSubmitPass(onPasswordSubmit)}
                  className="space-y-5"
                >
                  {errorsPass.root && (
                    <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                      <p className="text-[12px] font-medium text-rose-600">
                        {errorsPass.root.message}
                      </p>
                    </div>
                  )}

                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-semibold text-gray-700">
                        Current Password{' '}
                        <span className="text-rose-400">*</span>
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[11px] font-bold text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                      <input
                        type="password"
                        {...registerPass('currentPassword')}
                        className={cn(
                          inputWithIcon,
                          (errorsPass.currentPassword ||
                            errorsPass.root) &&
                            'border-rose-200 bg-rose-50/30 focus:border-rose-300 focus:ring-rose-100'
                        )}
                        placeholder="Enter current password"
                      />
                    </div>
                    {errorsPass.currentPassword && (
                      <p className="text-[11px] font-medium text-rose-500">
                        {errorsPass.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-gray-700">
                        New Password{' '}
                        <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                        <input
                          type="password"
                          {...registerPass('newPassword')}
                          className={cn(
                            inputWithIcon,
                            errorsPass.newPassword &&
                              'border-rose-200 bg-rose-50/30'
                          )}
                          placeholder="Min 8 characters"
                        />
                      </div>
                      {errorsPass.newPassword && (
                        <p className="text-[11px] font-medium text-rose-500">
                          {errorsPass.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-gray-700">
                        Confirm Password{' '}
                        <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <CheckCircle2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                        <input
                          type="password"
                          {...registerPass('confirmPassword')}
                          className={cn(
                            inputWithIcon,
                            errorsPass.confirmPassword &&
                              'border-rose-200 bg-rose-50/30'
                          )}
                          placeholder="Repeat password"
                        />
                      </div>
                      {errorsPass.confirmPassword && (
                        <p className="text-[11px] font-medium text-rose-500">
                          {errorsPass.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      disabled={loading}
                      className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 text-[13px] font-bold text-white shadow-lg shadow-blue-200/50 transition-all hover:from-blue-600 hover:to-violet-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5" />
                          Update Password
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* ──── Permissions Card ──── */}
            {profile?.permissions && profile.permissions.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-100">
                <div className="flex items-center gap-3 border-b border-gray-50 px-6 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                    <Zap className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900">
                      Permissions
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Your access rights
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {profile.permissions.map((perm, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {perm.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──── Recent Activity Card ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
                    <FileText className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900">
                      Recent Activity
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Your latest actions
                    </p>
                  </div>
                </div>
                {recentActivity.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 tabular-nums ring-1 ring-sky-200">
                    {recentActivity.length}
                  </span>
                )}
              </div>

              <div className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivity.map((item) => (
                      <div
                        key={item._id}
                        className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3.5 transition-all hover:border-gray-200 hover:bg-white hover:shadow-2xl shadow-gray-100"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 mt-0.5">
                          <Activity className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-700 truncate">
                            {item.action
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (l) =>
                                l.toUpperCase()
                              )}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            {item.admin && (
                              <span className="text-[10px] text-gray-400">
                                by {item.admin.name}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-300 tabular-nums">
                              {format(
                                new Date(item.createdAt),
                                'MMM d, p'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-100 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                      <Activity className="h-5 w-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-400">
                        No recent activity
                      </p>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        Your actions will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Row Component ───
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[12px] text-gray-400">
        {icon} {label}
      </span>
      <span className="text-[11px] font-semibold text-gray-600 max-w-[55%] truncate text-right">
        {value}
      </span>
    </div>
  );
}