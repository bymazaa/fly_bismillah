// app/reset-password/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  LockKeyhole,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Info,
  CheckCircle2,
  Sparkles,
  Plane,
  Globe,
  Star,
  KeyRound,
  Check,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import axios, { isAxiosError } from 'axios';
import { MAX_PASSWORD, MIN_PASSWORD } from '@/app/api/controller/constant';

// ─── Schema ───
const resetSchema = z
  .object({
    password: z
      .string()
      .min(MIN_PASSWORD, `At least ${MIN_PASSWORD} characters`)
      .max(MAX_PASSWORD, `At most ${MAX_PASSWORD} characters`)
      .regex(/[A-Z]/, 'One uppercase letter')
      .regex(/[a-z]/, 'One lowercase letter')
      .regex(/[0-9]/, 'One number')
      .regex(/[^a-zA-Z0-9]/, 'One special character'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

// ─── Password Strength Rules ───
const passwordRules = [
  { label: 'At least one uppercase letter', regex: /[A-Z]/ },
  { label: 'At least one lowercase letter', regex: /[a-z]/ },
  { label: 'At least one number', regex: /[0-9]/ },
  { label: 'At least one special character', regex: /[^a-zA-Z0-9]/ },
  { label: `Minimum ${MIN_PASSWORD} characters`, check: (v: string) => v.length >= MIN_PASSWORD },
];

// ─── Animated Grid Background ───
function AnimatedGrid() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute -top-[300px] -left-[200px] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-gray-100/40 via-sky-50/30 to-transparent blur-[120px] animate-blob-slow" />
      <div className="absolute -bottom-[300px] -right-[200px] w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-violet-100/35 via-purple-50/25 to-transparent blur-[120px] animate-blob-slow-reverse" />
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-amber-50/30 via-orange-50/20 to-transparent blur-[100px] animate-blob-float" />
      <div className="absolute bottom-[30%] left-[15%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-emerald-50/25 via-teal-50/15 to-transparent blur-[100px] animate-blob-drift" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-gray-50/40 via-sky-50/20 to-transparent rounded-full blur-[80px]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-t from-slate-100/50 to-transparent rounded-full blur-[60px]" />

      {[...Array(6)].map((_, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
            background: `radial-gradient(circle, ${
              ['#93c5fd', '#a5b4fc', '#86efac', '#fcd34d', '#f9a8d4', '#67e8f9'][i]
            } 0%, transparent 70%)`,
            top: `${12 + i * 15}%`,
            left: `${8 + i * 14}%`,
            animation: `floatOrb ${5 + i * 0.8}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.5}s`,
            opacity: 0.6,
          }}
        />
      ))}

      <div className="absolute top-[15%] right-[8%] w-16 h-16 border border-gray-200/20 rounded-2xl rotate-12 animate-spin-very-slow" />
      <div className="absolute bottom-[20%] left-[5%] w-12 h-12 border border-violet-200/20 rounded-full animate-bounce-very-slow" />
      <div className="absolute top-[60%] right-[15%] w-8 h-8 border border-amber-200/25 rounded-lg rotate-45 animate-pulse-slow" />
    </div>
  );
}

// ─── Decorative Icons ───
function DecorativeIcons() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      <Plane className="absolute top-[12%] right-[12%] w-5 h-5 text-gray-200/40 rotate-45 animate-float-icon" strokeWidth={1.5} />
      <Globe className="absolute bottom-[18%] left-[8%] w-6 h-6 text-violet-200/30 animate-spin-very-slow" strokeWidth={1} />
      <Star className="absolute top-[35%] left-[6%] w-4 h-4 text-amber-200/40 animate-pulse-slow" strokeWidth={1.5} />
      <Shield className="absolute bottom-[35%] right-[6%] w-4 h-4 text-emerald-200/35 animate-bounce-very-slow" strokeWidth={1.5} />
    </>
  );
}

// ─── Main Form Content ───
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [twoFactorDisabled, setTwoFactorDisabled] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!token) {
      router.push('/access?error=Invalid reset link');
    }
  }, [token, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  // Watch password for strength indicator
  const watchedPassword = watch('password', '');
  useEffect(() => {
    setPasswordValue(watchedPassword || '');
  }, [watchedPassword]);

  const onSubmit = async (data: ResetFormData) => {
    setError(null);
    if (!token) return;

    try {
      const res = await axios.put('/api/auth/reset-password', {
        token: token,
        password: data.password,
      });

      setSuccess(true);
      setTwoFactorDisabled(res.data?.data?.twoFactorDisabled || false);

      setTimeout(() => {
        router.push('/access?message=Password reset successful');
      }, 4000);
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to reset password');
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    }
  };

  if (!token) return null;

  // Password strength calculation
  const strengthScore = passwordRules.filter((rule) => {
    if ('regex' in rule) return rule?.regex?.test(passwordValue);
    if ('check' in rule) return rule.check(passwordValue);
    return false;
  }).length;

  const strengthPercent = (strengthScore / passwordRules.length) * 100;
  const strengthColor =
    strengthPercent <= 20
      ? 'bg-red-400'
      : strengthPercent <= 40
      ? 'bg-orange-400'
      : strengthPercent <= 60
      ? 'bg-amber-400'
      : strengthPercent <= 80
      ? 'bg-gray-400'
      : 'bg-emerald-400';

  const strengthLabel =
    strengthPercent <= 20
      ? 'Very Weak'
      : strengthPercent <= 40
      ? 'Weak'
      : strengthPercent <= 60
      ? 'Fair'
      : strengthPercent <= 80
      ? 'Strong'
      : 'Very Strong';

  return (
    <div
      className={clsx(
        'w-full max-w-[480px] z-10 px-5 py-8 transition-all duration-1000 ease-out',
        mounted
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-[0.98]'
      )}
    >
      {/* ── Top Badge ── */}
      <div className="flex justify-center mb-7">
        <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-2xl border border-white/80 rounded-full px-5 py-2.5 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)]">
          <div className="relative flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full shadow-[0_0_8px_2px_rgba(59,130,246,0.3)]" />
            <div className="absolute w-2 h-2 bg-gray-400 rounded-full animate-ping opacity-40" />
          </div>
          <span className="text-[11px] font-bold text-slate-500 tracking-[0.14em] uppercase">
            Password Recovery
          </span>
          <div className="w-px h-3 bg-slate-200" />
          <Shield className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {/* ── Logo ── */}
      <div className="flex justify-center mb-9">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-4 bg-gradient-to-r from-gray-400/15 via-violet-400/10 to-sky-400/15 rounded-[28px] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
          <div className="absolute -inset-2 rounded-[22px] border border-gray-200/30 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />

          <div className="relative overflow-hidden rounded-2xl">
            <div
              className={clsx(
                'absolute inset-0 bg-gradient-to-br',
                success
                  ? 'from-emerald-500 via-emerald-600 to-green-600'
                  : 'from-gray-500 via-gray-600 to-violet-600'
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '8px 8px',
              }}
            />
            <div className="relative p-4.5 sm:p-5">
              {success ? (
                <ShieldCheck
                  className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                  strokeWidth={2}
                />
              ) : (
                <KeyRound
                  className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                  strokeWidth={2}
                />
              )}
            </div>
          </div>
          <div
            className={clsx(
              'absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full blur-md',
              success ? 'bg-emerald-500/10' : 'bg-gray-500/10'
            )}
          />
        </div>
      </div>

      {/* ── Card ── */}
      <div className="relative group/card">
        <div className="absolute -inset-4 bg-gradient-to-b from-gray-100/20 via-transparent to-violet-100/20 rounded-[40px] blur-3xl opacity-0 group-hover/card:opacity-100 transition-all duration-1000 pointer-events-none" />
        <div className="absolute inset-0 bg-white/40 rounded-[28px] blur-xl translate-y-4 pointer-events-none" />

        <div className="relative bg-white/80 backdrop-blur-3xl rounded-[28px] border border-white/70 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 inset-x-0 h-[3px]">
            <div
              className={clsx(
                'h-full bg-gradient-to-r from-transparent to-transparent',
                success ? 'via-emerald-500/70' : 'via-gray-500/70'
              )}
            />
            <div
              className={clsx(
                'absolute inset-0 h-full bg-gradient-to-r from-transparent to-transparent blur-sm',
                success ? 'via-emerald-400/40' : 'via-gray-400/40'
              )}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/20 via-transparent to-violet-50/10 pointer-events-none" />

          <div className="relative p-8 sm:p-10">
            {/* ═══════════ SUCCESS STATE ═══════════ */}
            {success ? (
              <div className="animate-in zoom-in-95 fade-in duration-500">
                {/* Success Icon */}
                <div className="flex justify-center py-4 mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-200/25 rounded-full blur-3xl animate-pulse scale-150" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-50 via-white to-green-50 rounded-full flex items-center justify-center ring-2 ring-emerald-100 shadow-[0_12px_40px_-8px_rgba(16,185,129,0.15)]">
                      <div className="absolute inset-2 border-2 border-dashed border-emerald-200/40 rounded-full animate-spin-very-slow" />
                      <CheckCircle2
                        className="w-12 h-12 text-emerald-500"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">
                    <span className="inline-flex items-center gap-2.5">
                      All Set!
                      <span className="relative">
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                        <Sparkles className="w-6 h-6 text-emerald-400 absolute inset-0 animate-ping opacity-20" />
                      </span>
                    </span>
                  </h1>
                  <p className="text-[13px] sm:text-sm text-slate-400 mt-3 font-medium leading-relaxed max-w-[300px] mx-auto">
                    Your password has been updated successfully. Redirecting you
                    to login...
                  </p>
                </div>

                {/* 2FA Disabled Warning */}
                {twoFactorDisabled && (
                  <div className="mb-6 flex items-start gap-3 bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-100/50 rounded-2xl p-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white p-1.5 rounded-lg shadow-sm border border-amber-100/80 flex-shrink-0 mt-0.5">
                      <Info className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      <span className="text-amber-600 font-bold">
                        Two-Factor Authentication
                      </span>{' '}
                      has been automatically disabled. You can re-enable it
                      from Settings after login.
                    </p>
                  </div>
                )}

                {/* Progress bar */}
                <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-progress-bar" />
                </div>

                {/* Manual redirect */}
                <Link
                  href="/access"
                  className="w-full flex items-center justify-center gap-2.5 text-[13px] font-semibold text-emerald-600 hover:text-emerald-700 transition-all duration-300 py-2.5 cursor-pointer rounded-xl hover:bg-emerald-50/50"
                >
                  Go to Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              /* ═══════════ FORM STATE ═══════════ */
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">
                    <span className="inline-flex items-center gap-2.5">
                      New Password
                      <LockKeyhole className="w-6 h-6 text-gray-500" />
                    </span>
                  </h1>
                  <p className="text-[13px] sm:text-sm text-slate-400 mt-3 font-medium leading-relaxed max-w-[300px] mx-auto">
                    Create a strong, unique password to secure your account
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-6 bg-gradient-to-r from-rose-50 to-red-50/80 border border-rose-200/50 rounded-2xl p-4 flex items-start gap-3.5 animate-in zoom-in-95 fade-in duration-300 shadow-[0_4px_16px_-4px_rgba(244,63,94,0.08)]">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-rose-100 flex-shrink-0">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-rose-700 leading-snug">
                        {error}
                      </p>
                      <p className="text-[11px] text-rose-400/80 mt-1 font-medium">
                        Please check your details and try again
                      </p>
                    </div>
                  </div>
                )}

                {/* 2FA Info */}
                <div className="mb-6 flex items-start gap-3 bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-100/50 rounded-2xl p-4">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm border border-amber-100/80 flex-shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    If your account has{' '}
                    <span className="text-amber-600 font-bold">
                      Two-Factor Authentication
                    </span>{' '}
                    enabled, it will be{' '}
                    <span className="text-red-500 font-bold">
                      automatically disabled
                    </span>{' '}
                    after reset. You can re-enable it after login.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-600"
                >
                  {/* New Password */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-[0.16em] flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      New Password
                    </label>
                    <div className="relative group/input">
                      <div
                        className={clsx(
                          'absolute -inset-[2px] rounded-[18px] transition-all duration-500 pointer-events-none',
                          focusedField === 'password'
                            ? 'bg-gradient-to-r from-gray-400/30 via-gray-300/40 to-sky-400/30 opacity-100 blur-[1px]'
                            : 'opacity-0 group-hover/input:opacity-100 group-hover/input:bg-gradient-to-r group-hover/input:from-gray-200/20 group-hover/input:to-sky-200/20 group-hover/input:blur-[1px]'
                        )}
                      />
                      <div className="relative flex items-center">
                        <div
                          className={clsx(
                            'absolute left-4 transition-colors duration-300',
                            focusedField === 'password'
                              ? 'text-gray-500'
                              : 'text-slate-300'
                          )}
                        >
                          <Lock className="w-[18px] h-[18px]" />
                        </div>
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          className={clsx(
                            'relative w-full pl-12 pr-14 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl text-slate-900 text-[15px] placeholder:text-slate-300 font-medium transition-all duration-300',
                            'focus:bg-white focus:border-gray-300 focus:outline-none focus:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)]',
                            'hover:border-slate-200 hover:bg-white',
                            errors.password &&
                              'border-rose-200 bg-rose-50/30 focus:border-rose-400'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          className={clsx(
                            'absolute right-3 p-2.5 rounded-xl transition-all duration-300 cursor-pointer',
                            showPassword
                              ? 'text-gray-500 bg-gray-50 shadow-sm'
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                          )}
                        >
                          {showPassword ? (
                            <EyeOff className="w-[18px] h-[18px]" />
                          ) : (
                            <Eye className="w-[18px] h-[18px]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ── Password Strength Indicator ── */}
                    {passwordValue.length > 0 && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Strength Bar */}
                        <div className="flex items-center gap-3 px-1">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full transition-all duration-500 ease-out',
                                strengthColor
                              )}
                              style={{ width: `${strengthPercent}%` }}
                            />
                          </div>
                          <span
                            className={clsx(
                              'text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
                              strengthPercent <= 40
                                ? 'text-red-500'
                                : strengthPercent <= 60
                                ? 'text-amber-500'
                                : strengthPercent <= 80
                                ? 'text-gray-500'
                                : 'text-emerald-500'
                            )}
                          >
                            {strengthLabel}
                          </span>
                        </div>

                        {/* Rules Checklist */}
                        <div className="grid grid-cols-1 gap-1.5 px-1">
                          {passwordRules.map((rule, i) => {
                            const passed = 'regex' in rule
                              ? rule?.regex?.test(passwordValue)
                              : rule.check(passwordValue);

                            return (
                              <div
                                key={i}
                                className={clsx(
                                  'flex items-center gap-2 text-[11px] font-medium transition-all duration-300',
                                  passed ? 'text-emerald-500' : 'text-slate-300'
                                )}
                              >
                                <div
                                  className={clsx(
                                    'w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0',
                                    passed
                                      ? 'bg-emerald-50 ring-1 ring-emerald-200'
                                      : 'bg-slate-50 ring-1 ring-slate-100'
                                  )}
                                >
                                  {passed ? (
                                    <Check className="w-2.5 h-2.5" />
                                  ) : (
                                    <X className="w-2.5 h-2.5" />
                                  )}
                                </div>
                                <span>{rule.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {errors.password && !passwordValue && (
                      <p className="text-[11px] text-rose-500 font-semibold ml-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full flex-shrink-0 animate-pulse" />
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-[0.16em] flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" />
                      Confirm Password
                    </label>
                    <div className="relative group/input">
                      <div
                        className={clsx(
                          'absolute -inset-[2px] rounded-[18px] transition-all duration-500 pointer-events-none',
                          focusedField === 'confirm'
                            ? 'bg-gradient-to-r from-gray-400/30 via-gray-300/40 to-sky-400/30 opacity-100 blur-[1px]'
                            : 'opacity-0 group-hover/input:opacity-100 group-hover/input:bg-gradient-to-r group-hover/input:from-gray-200/20 group-hover/input:to-sky-200/20 group-hover/input:blur-[1px]'
                        )}
                      />
                      <div className="relative flex items-center">
                        <div
                          className={clsx(
                            'absolute left-4 transition-colors duration-300',
                            focusedField === 'confirm'
                              ? 'text-gray-500'
                              : 'text-slate-300'
                          )}
                        >
                          <ShieldCheck className="w-[18px] h-[18px]" />
                        </div>
                        <input
                          {...register('confirmPassword')}
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Re-enter your password"
                          onFocus={() => setFocusedField('confirm')}
                          onBlur={() => setFocusedField(null)}
                          className={clsx(
                            'relative w-full pl-12 pr-14 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl text-slate-900 text-[15px] placeholder:text-slate-300 font-medium transition-all duration-300',
                            'focus:bg-white focus:border-gray-300 focus:outline-none focus:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)]',
                            'hover:border-slate-200 hover:bg-white',
                            errors.confirmPassword &&
                              'border-rose-200 bg-rose-50/30 focus:border-rose-400'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          tabIndex={-1}
                          className={clsx(
                            'absolute right-3 p-2.5 rounded-xl transition-all duration-300 cursor-pointer',
                            showConfirm
                              ? 'text-gray-500 bg-gray-50 shadow-sm'
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                          )}
                        >
                          {showConfirm ? (
                            <EyeOff className="w-[18px] h-[18px]" />
                          ) : (
                            <Eye className="w-[18px] h-[18px]" />
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-rose-500 font-semibold ml-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full flex-shrink-0 animate-pulse" />
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Security Info */}
                  <div className="flex items-start gap-3 bg-gradient-to-r from-gray-50/60 to-sky-50/40 border border-gray-100/50 rounded-2xl p-4">
                    <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100/80 flex-shrink-0 mt-0.5">
                      <Info className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Protected with{' '}
                      <span className="text-gray-600 font-bold">
                        256-bit encryption
                      </span>
                      . Your password is hashed and never stored in plain text.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative w-full group/btn cursor-pointer disabled:cursor-not-allowed"
                    >
                      <div
                        className={clsx(
                          'absolute -inset-1.5 rounded-[22px] transition-all duration-500',
                          isSubmitting
                            ? 'opacity-0'
                            : 'bg-gradient-to-r from-gray-500/20 via-gray-400/15 to-violet-500/20 opacity-0 group-hover/btn:opacity-100 blur-xl'
                        )}
                      />
                      <div
                        className={clsx(
                          'relative flex items-center justify-center gap-3 py-4.5 rounded-2xl font-bold text-[15px] tracking-wide transition-all duration-300 overflow-hidden',
                          isSubmitting
                            ? 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                            : 'bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 text-white shadow-[0_8px_30px_-6px_rgba(59,130,246,0.35)] group-hover/btn:shadow-[0_12px_40px_-6px_rgba(59,130,246,0.45)] active:scale-[0.98]'
                        )}
                      >
                        {!isSubmitting && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                            <div className="absolute bottom-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          </>
                        )}
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Resetting Password...
                          </span>
                        ) : (
                          <>
                            <LockKeyhole className="w-5 h-5 opacity-80" />
                            <span>Reset Password</span>
                            <ArrowRight className="w-5 h-5 opacity-70 group-hover/btn:translate-x-1.5 group-hover/btn:opacity-100 transition-all duration-300" />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                  <Link
                    href="/access"
                    className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-gray-600 transition-all duration-300 group/back"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform duration-300" />
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-10 text-center space-y-4">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {[
            { label: 'Systems Online', color: 'emerald' },
            { label: '256-bit SSL', color: 'gray' },
            { label: 'SOC2', color: 'violet' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium"
            >
              <div
                className={clsx(
                  'w-1.5 h-1.5 rounded-full',
                  item.color === 'emerald' &&
                    'bg-emerald-400 shadow-[0_0_6px_1px_rgba(16,185,129,0.3)]',
                  item.color === 'gray' &&
                    'bg-gray-400 shadow-[0_0_6px_1px_rgba(59,130,246,0.3)]',
                  item.color === 'violet' &&
                    'bg-violet-400 shadow-[0_0_6px_1px_rgba(139,92,246,0.3)]'
                )}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-300 font-medium tracking-wide">
          © {new Date().getFullYear()}{' '}
          <span className="text-slate-400 font-semibold">Fly Bismillah</span> ·
          All rights reserved
        </p>
      </div>
    </div>
  );
}

// ─── Page Wrapper ───
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#f8fafc]">
      <AnimatedGrid />
      <DecorativeIcons />

      <Suspense
        fallback={
          <div className="z-10 flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-lg border border-white/70">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            <span className="text-sm font-semibold text-slate-500">
              Verifying reset link...
            </span>
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>

      
    </div>
  );
}