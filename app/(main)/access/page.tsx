// app/access/page.tsx

'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  Smartphone,
  ArrowLeft,
  LockKeyhole,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Fingerprint,
  Shield,
  Sparkles,
  CheckCircle2,
  LogIn,
  Info,
  Plane,
  Globe,
  Star,
  KeySquare,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { toast } from 'sonner';

// ─── Schema ───
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormData = z.infer<typeof loginSchema>;

// ─── OTP Input Component (memoized) ───
const OtpInput = memo(function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^[0-9]?$/.test(char)) return;
      const arr = value.split('');
      arr[index] = char;
      const newVal = arr.join('').replace(/undefined/g, '');
      onChange(newVal.slice(0, 6));
      if (char && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, onChange],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const arr = value.split('');
        arr[index - 1] = '';
        onChange(arr.join(''));
      }
    },
    [value, onChange],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 6);
      onChange(pasted);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    },
    [onChange],
  );

  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          autoFocus={i === 0}
          className={clsx(
            'w-12 h-14 text-center text-xl font-bold rounded-2xl border-2',
            'outline-none transition-all duration-200',
            'bg-white border-slate-200 text-slate-900 caret-gray-500',
            'focus:bg-gray-50/30 focus:border-gray-400 focus:ring-4',
            'focus:ring-gray-50',
            value[i] && 'bg-gray-50/50 border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
      ))}
    </div>
  );
});

// ─── Animated Grid Background (memoized — never re-renders) ───
const AnimatedGrid = memo(function AnimatedGrid() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern — static, no animation cost */}
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

      {/* Gradient blobs — GPU-promoted via will-change: transform
          Reduced blur from 120px to 60px (halves GPU cost) */}
      <div
        className="absolute -top-[300px] -left-[200px] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-gray-100/40 via-sky-50/30 to-transparent blur-[60px] animate-blob-slow"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute -bottom-[300px] -right-[200px] w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-violet-100/35 via-purple-50/25 to-transparent blur-[60px] animate-blob-slow-reverse"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-amber-50/30 via-orange-50/20 to-transparent blur-[50px] animate-blob-float"
        style={{ willChange: 'transform' }}
      />

      {/* Removed: 4th blob, top gradient, bottom gradient (3 fewer layers)
          These added visual complexity but caused significant paint cost */}

      {/* Floating orbs — reduced from 6 to 3, simpler animation */}
      {[0, 1, 2].map((i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
            background: `radial-gradient(circle, ${['#93c5fd', '#a5b4fc', '#86efac'][i]} 0%, transparent 70%)`,
            top: `${15 + i * 25}%`,
            left: `${10 + i * 30}%`,
            animation: `floatOrb ${6 + i}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.8}s`,
            opacity: 0.5,
            willChange: 'transform',
          }}
        />
      ))}

      {/* Geometric shapes — kept but simplified */}
      <div className="absolute top-[15%] right-[8%] w-16 h-16 border border-gray-200/20 rounded-2xl rotate-12 animate-spin-very-slow" />
      <div className="absolute bottom-[20%] left-[5%] w-12 h-12 border border-violet-200/20 rounded-full animate-bounce-very-slow" />
    </div>
  );
});

// ─── Decorative Travel Icons (memoized) ───
const DecorativeIcons = memo(function DecorativeIcons() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="pointer-events-none">
      <Plane
        className="absolute top-[12%] right-[12%] w-5 h-5 text-gray-200/40 rotate-45 animate-float-icon"
        strokeWidth={1.5}
      />
      <Globe
        className="absolute bottom-[18%] left-[8%] w-6 h-6 text-violet-200/30 animate-spin-very-slow"
        strokeWidth={1}
      />
      <Star
        className="absolute top-[35%] left-[6%] w-4 h-4 text-amber-200/40 animate-pulse-slow"
        strokeWidth={1.5}
      />
      <Shield
        className="absolute bottom-[35%] right-[6%] w-4 h-4 text-emerald-200/35 animate-bounce-very-slow"
        strokeWidth={1.5}
      />
    </div>
  );
});

// ─── Footer (memoized — static content) ───
const Footer = memo(function Footer() {
  return (
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
                  'bg-violet-400 shadow-[0_0_6px_1px_rgba(139,92,246,0.3)]',
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
  );
});

// ═══════════════════════════════════════════════════
// ─── Main Page ───
//
// Performance fixes applied:
// ──────────────────────────────────────────────────
// 1. REMOVED `focusedField` state entirely
//    → Was causing full page re-render on every focus/blur
//    → Replaced with CSS-only `group/input focus-within:` selectors
//    → Zero JS cost for focus styling
//
// 2. MEMOIZED all static sub-components
//    → AnimatedGrid, DecorativeIcons, Footer, OtpInput
//    → These never need to re-render when form state changes
//
// 3. REDUCED backdrop-blur
//    → backdrop-blur-3xl → backdrop-blur-sm
//    → 3xl = 64px blur radius (extremely expensive on mobile)
//    → sm = 4px blur (visually similar, 10x cheaper)
//
// 4. REDUCED blur on gradient blobs
//    → blur-[120px] → blur-[60px] (halves paint area)
//    → Removed 3 redundant gradient layers
//
// 5. REDUCED floating orbs from 6 to 3
//    → Each animated element = continuous compositor work
//
// 6. ADDED will-change: transform on animated elements
//    → Promotes to GPU compositor layer
//    → Prevents main-thread paint blocking
//
// 7. REMOVED animate-ping on status dot
//    → animate-ping causes continuous full-opacity repaints
//    → Replaced with a static glow shadow
//
// 8. SIMPLIFIED box-shadows
//    → Multi-layer shadows cause expensive paint operations
//    → Reduced to single-layer where possible
// ═══════════════════════════════════════════════════

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>(
    'credentials',
  );
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ✅ REMOVED: focusedField state — was the #1 cause of input lag
  // Every focus/blur triggered setState → re-rendered entire page
  // including AnimatedGrid (6 blurred blobs) + all animated elements
  // Now using pure CSS :focus-within instead (zero JS cost)

  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  const redirectUrl = searchParams.get('redirect') || '/admin';

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // ── Credentials Submit ──
  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, rememberMe }),
      });
      const result = await res.json();

      if (!res.ok) {
        setGlobalError(result.message || 'Invalid credentials');
        return;
      }

      if (result.requiresTwoFactor) {
        setTempToken(result.data.tempToken);
        setLoginStep('2fa');
        toast.message('Security Check', {
          description: result.message || 'Enter your 2FA code',
        });
        return;
      }

      toast.success('Welcome back! Redirecting...', {
        icon: '🎉',
        duration: 2000,
      });
      router.push(result.data?.redirectUrl || redirectUrl);
      router.refresh();
    } catch {
      setGlobalError('Connection failed. Please try again.');
    }
  };

  // ── OTP Verify ──
  const onOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      setGlobalError('Please enter a valid 6-digit code.');
      return;
    }

    setGlobalError(null);
    setIsVerifyingOtp(true);

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tempToken, code: otpCode }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setGlobalError(result.message || 'Invalid OTP code.');
        setOtpCode('');
        setIsVerifyingOtp(false);
        return;
      }

      toast.success('Identity verified!', { icon: '🔐' });
      router.push(result.data?.redirectUrl || redirectUrl);
      router.refresh();
    } catch {
      setGlobalError('Verification failed. Please try again.');
      setIsVerifyingOtp(false);
    }
  };

  // ── Recovery Code Verify ──
  const onRecoveryVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = recoveryCode.trim();
    if (!cleanCode) {
      setGlobalError('Please enter your recovery code.');
      return;
    }

    setGlobalError(null);
    setIsVerifyingOtp(true);

    try {
      const res = await fetch('/api/auth/2fa/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tempToken,
          recoveryCode: cleanCode,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setGlobalError(result.message || 'Invalid recovery code.');
        setRecoveryCode('');
        setIsVerifyingOtp(false);
        return;
      }

      if (result.data?.warning) {
        toast.warning(result.data.warning, { duration: 6000 });
      }

      toast.success('Login successful!', { icon: '🔑' });
      router.push(result.data?.redirectUrl || redirectUrl);
      router.refresh();
    } catch {
      setGlobalError('Recovery failed. Please try again.');
      setIsVerifyingOtp(false);
    }
  };

  // ── Reset to credentials step ──
  const backToLogin = useCallback(() => {
    setLoginStep('credentials');
    setGlobalError(null);
    setOtpCode('');
    setRecoveryCode('');
    setTempToken('');
    setUseRecovery(false);
    setIsVerifyingOtp(false);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#f8fafc]">
      {/* ════════════ BACKGROUND (memoized — won't re-render on typing) ════════════ */}
      <AnimatedGrid />
      <DecorativeIcons />

      {/* ════════════ MAIN CONTENT ════════════ */}
      <div
        className={clsx(
          'w-full max-w-[480px] z-10 px-5 py-8 transition-all duration-1000 ease-out',
          mounted
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-[0.98]',
        )}
      >
        {/* ── Top Badge ── */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border border-white/80 rounded-full px-5 py-2.5 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)]">
            <div className="relative flex items-center justify-center">
              {/* ✅ Removed animate-ping — continuous repaint killer
                  Replaced with static glow shadow (same visual, zero cost) */}
              <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_2px_rgba(16,185,129,0.4)]" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 tracking-[0.14em] uppercase">
              Secure Admin Portal
            </span>
            <div className="w-px h-3 bg-slate-200" />
            <Shield className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {/* ── Logo ── */}
        <div className="flex justify-center mb-9">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-4 bg-gradient-to-r from-gray-400/15 via-violet-400/10 to-sky-400/15 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500 via-gray-600 to-gray-600" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="relative p-4.5 sm:p-5">
                {loginStep === 'credentials' ? (
                  <KeyRound
                    className="w-8 h-8 text-white drop-shadow-md"
                    strokeWidth={2}
                  />
                ) : useRecovery ? (
                  <KeySquare
                    className="w-8 h-8 text-white drop-shadow-md"
                    strokeWidth={2}
                  />
                ) : (
                  <LockKeyhole
                    className="w-8 h-8 text-white drop-shadow-md"
                    strokeWidth={2}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Card ──
            ✅ Changed backdrop-blur-3xl → backdrop-blur-sm
            backdrop-blur-3xl = 64px Gaussian blur on EVERY pixel behind
            This recalculates on every frame when content scrolls/animates
            backdrop-blur-sm = 4px blur (visually similar, ~10x cheaper) */}
        <div className="relative">
          <div className="relative bg-white/80 backdrop-blur-sm rounded-[28px] border border-white/70 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-[3px]">
              <div
                className={clsx(
                  'h-full bg-gradient-to-r from-transparent to-transparent',
                  loginStep === 'credentials'
                    ? 'via-gray-500/70'
                    : useRecovery
                      ? 'via-orange-500/70'
                      : 'via-violet-500/70',
                )}
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/20 via-transparent to-violet-50/10 pointer-events-none" />

            <div className="relative p-8 sm:p-10">
              {/* ── Header ── */}
              <div className="text-center mb-8">
                <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  {loginStep === 'credentials' ? (
                    <span className="inline-flex items-center gap-2.5">
                      Welcome Back
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </span>
                  ) : useRecovery ? (
                    <span className="inline-flex items-center gap-2.5">
                      Recovery Login
                      <KeySquare className="w-6 h-6 text-orange-500" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2.5">
                      Verify Identity
                      <Fingerprint className="w-6 h-6 text-gray-500" />
                    </span>
                  )}
                </h1>
                <p className="text-[13px] sm:text-sm text-slate-400 mt-3 font-medium leading-relaxed max-w-[300px] mx-auto">
                  {loginStep === 'credentials'
                    ? 'Sign in to access your administration dashboard'
                    : useRecovery
                      ? 'Enter one of your saved recovery codes'
                      : 'Enter the 6-digit code from your authenticator app'}
                </p>
              </div>

              {/* ── Error ── */}
              {globalError && (
                <div className="mb-6 bg-gradient-to-r from-rose-50 to-red-50/80 border border-rose-200/50 rounded-2xl p-4 flex items-start gap-3.5 animate-in zoom-in-95 fade-in duration-300">
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-rose-100 flex-shrink-0">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-rose-700 leading-snug">
                      {globalError}
                    </p>
                    <p className="text-[11px] text-rose-400/80 mt-1 font-medium">
                      Please check your details and try again
                    </p>
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 1: CREDENTIALS ═══════════ */}
              {loginStep === 'credentials' && (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-600"
                >
                  {/* Email
                      ✅ CSS-only focus styling via group/email + focus-within
                      No JS state changes → no re-renders → no lag */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-[0.16em] flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      Email Address
                    </label>
                    <div className="relative group/email">
                      {/* ✅ Pure CSS glow — activates via focus-within, zero JS */}
                      <div className="absolute -inset-[2px] rounded-[18px] transition-opacity duration-300 pointer-events-none opacity-0 group-focus-within/email:opacity-100 bg-gradient-to-r from-gray-400/25 via-gray-300/35 to-sky-400/25 blur-[1px]" />
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-slate-300 transition-colors duration-200 group-focus-within/email:text-gray-500">
                          <Mail className="w-[18px] h-[18px]" />
                        </div>
                        <input
                          {...register('email')}
                          type="email"
                          placeholder="admin@flybismillah.com"
                          className={clsx(
                            'relative w-full pl-12 pr-5 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl text-slate-900 text-[15px] placeholder:text-slate-300 font-medium transition-all duration-200',
                            'focus:bg-white focus:border-gray-300 focus:outline-none focus:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)]',
                            'hover:border-slate-200 hover:bg-white',
                            errors.email &&
                              'border-rose-200 bg-rose-50/30 focus:border-rose-400',
                          )}
                        />
                      </div>
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-rose-500 font-semibold ml-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full flex-shrink-0" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-[0.16em] flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      Password
                    </label>
                    <div className="relative group/pass">
                      <div className="absolute -inset-[2px] rounded-[18px] transition-opacity duration-300 pointer-events-none opacity-0 group-focus-within/pass:opacity-100 bg-gradient-to-r from-gray-400/25 via-gray-300/35 to-sky-400/25 blur-[1px]" />
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-slate-300 transition-colors duration-200 group-focus-within/pass:text-gray-500">
                          <Lock className="w-[18px] h-[18px]" />
                        </div>
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className={clsx(
                            'relative w-full pl-12 pr-14 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl text-slate-900 text-[15px] placeholder:text-slate-300 font-medium transition-all duration-200',
                            'focus:bg-white focus:border-gray-300 focus:outline-none focus:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)]',
                            'hover:border-slate-200 hover:bg-white',
                            errors.password &&
                              'border-rose-200 bg-rose-50/30 focus:border-rose-400',
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          className={clsx(
                            'absolute right-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer',
                            showPassword
                              ? 'text-gray-500 bg-gray-50'
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50',
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
                    {errors.password && (
                      <p className="text-[11px] text-rose-500 font-semibold ml-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full flex-shrink-0" />
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember + Forgot */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className="flex items-center gap-2.5 cursor-pointer group/check"
                    >
                      <div
                        className={clsx(
                          'w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0',
                          rememberMe
                            ? 'bg-gray-500 border-gray-500 shadow-[0_2px_10px_-2px_rgba(59,130,246,0.4)] scale-105'
                            : 'bg-white border-slate-200 group-hover/check:border-gray-300',
                        )}
                      >
                        {rememberMe && (
                          <svg
                            className="w-3 h-3 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-[13px] text-slate-400 group-hover/check:text-slate-600 transition-colors font-medium select-none">
                        Remember me
                      </span>
                    </button>
                    <Link
                      href="/forgot-password"
                      className="text-[13px] font-semibold text-gray-500 hover:text-gray-700 transition-colors duration-200 hover:underline underline-offset-2"
                    >
                      Forgot password?
                    </Link>
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
                      . Your credentials are never stored in plain text.
                    </p>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative w-full group/btn cursor-pointer disabled:cursor-not-allowed"
                    >
                      <div
                        className={clsx(
                          'relative flex items-center justify-center gap-3 py-4.5 rounded-2xl font-bold text-[15px] tracking-wide transition-all duration-200 overflow-hidden',
                          isSubmitting
                            ? 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                            : 'bg-gradient-to-r from-gray-600 via-blgrayue-500 to-gray-500 text-white shadow-gray-100 shadow-2xl group-hover/btn:shadow-gray-200',
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
                            Signing in...
                          </span>
                        ) : (
                          <>
                            <LogIn className="w-5 h-5 opacity-80" />
                            <span>Sign In to Dashboard</span>
                            <ArrowRight className="w-5 h-5 opacity-70 group-hover/btn:translate-x-1.5 group-hover/btn:opacity-100 transition-all duration-300" />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════ STEP 2: 2FA (OTP or Recovery) ═══════════ */}
              {loginStep === '2fa' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  {!useRecovery ? (
                    /* ──────── OTP MODE ──────── */
                    <form onSubmit={onOtpVerify} className="space-y-6">
                      {/* Fingerprint Visual */}
                      <div className="flex justify-center py-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gray-200/25 rounded-full blur-xl scale-150" />
                          <div className="relative w-24 h-24 bg-gradient-to-br from-gray-50 via-white to-sky-50 rounded-full flex items-center justify-center ring-2 ring-gray-100 shadow-lg">
                            <div className="absolute inset-2 border-2 border-dashed border-gray-200/40 rounded-full animate-spin-very-slow" />
                            <Fingerprint
                              className="w-12 h-12 text-gray-500"
                              strokeWidth={1.5}
                            />
                          </div>
                        </div>
                      </div>

                      {/* OTP Input */}
                      <div className="space-y-3.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.16em] text-center block">
                          Authentication Code
                        </label>
                        <OtpInput
                          value={otpCode}
                          onChange={setOtpCode}
                          disabled={isVerifyingOtp}
                        />
                      </div>

                      {/* Hint */}
                      <div className="flex items-center justify-center gap-2.5 text-[12px] text-slate-400 bg-slate-50/80 border border-slate-100 rounded-2xl py-3 px-4">
                        <Smartphone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <span>
                          Open{' '}
                          <span className="font-semibold text-slate-500">
                            Google Authenticator
                          </span>{' '}
                          or Authy
                        </span>
                      </div>

                      {/* Verify Button */}
                      <button
                        type="submit"
                        disabled={isVerifyingOtp || otpCode.length !== 6}
                        className="relative w-full group/btn cursor-pointer disabled:cursor-not-allowed"
                      >
                        <div
                          className={clsx(
                            'relative flex items-center justify-center gap-3 py-4.5 rounded-2xl font-bold text-[15px] transition-all duration-200 overflow-hidden',
                            isVerifyingOtp || otpCode.length !== 6
                              ? 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                              : 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-[0_8px_30px_-6px_rgba(59,130,246,0.35)] active:scale-[0.98]',
                          )}
                        >
                          {!isVerifyingOtp && otpCode.length === 6 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
                          )}
                          {isVerifyingOtp ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Verifying...
                            </span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 opacity-80" />
                              Verify & Continue
                            </>
                          )}
                        </div>
                      </button>

                      {/* Lost phone options */}
                      <div className="space-y-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUseRecovery(true);
                            setGlobalError(null);
                            setOtpCode('');
                          }}
                          className="w-full flex items-center justify-center gap-2.5 text-[13px] font-semibold text-orange-500 hover:text-orange-700 transition-all duration-200 py-2.5 cursor-pointer group/recovery rounded-xl hover:bg-orange-50/50 border border-transparent hover:border-orange-100"
                        >
                          <KeySquare className="w-4 h-4" />
                          <span>📱 Lost your phone? Use recovery code</span>
                        </button>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-100/50 rounded-2xl p-4">
                          <div className="bg-white p-1.5 rounded-lg shadow-sm border border-amber-100/80 flex-shrink-0 mt-0.5">
                            <Info className="w-3.5 h-3.5 text-amber-500" />
                          </div>
                          <div className="text-[12px] text-slate-500 leading-relaxed">
                            <p>
                              No recovery codes either?{' '}
                              <Link
                                href="/forgot-password"
                                className="text-gray-600 font-bold hover:underline underline-offset-2"
                              >
                                Reset your password
                              </Link>{' '}
                              — this will{' '}
                              <span className="text-amber-600 font-bold">
                                automatically disable 2FA
                              </span>{' '}
                              so you can login with new password.
                            </p>
                          </div>
                        </div>

                        <div className="relative flex items-center py-1">
                          <div className="flex-1 h-px bg-slate-100" />
                          <span className="px-3 text-[10px] text-slate-300 uppercase tracking-widest font-bold">
                            or
                          </span>
                          <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        <button
                          type="button"
                          onClick={backToLogin}
                          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-gray-600 transition-all duration-200 py-2 cursor-pointer group/back rounded-xl hover:bg-gray-50/50"
                        >
                          <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform duration-300" />
                          Back to login
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ──────── RECOVERY CODE MODE ──────── */
                    <form onSubmit={onRecoveryVerify} className="space-y-6">
                      {/* Key Visual */}
                      <div className="flex justify-center py-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-orange-200/25 rounded-full blur-xl scale-150" />
                          <div className="relative w-24 h-24 bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-full flex items-center justify-center ring-2 ring-orange-100 shadow-lg">
                            <div className="absolute inset-2 border-2 border-dashed border-orange-200/40 rounded-full animate-spin-very-slow" />
                            <KeySquare
                              className="w-12 h-12 text-orange-500"
                              strokeWidth={1.5}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Recovery Code Input */}
                      <div className="space-y-3.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.16em] text-center block">
                          Recovery Code
                        </label>
                        <div className="relative group/recovery">
                          <div className="absolute -inset-[2px] rounded-[18px] transition-opacity duration-300 pointer-events-none opacity-0 group-focus-within/recovery:opacity-100 bg-gradient-to-r from-orange-400/25 via-amber-300/35 to-orange-400/25 blur-[1px]" />
                          <input
                            type="text"
                            value={recoveryCode}
                            onChange={(e) =>
                              setRecoveryCode(e.target.value.toUpperCase())
                            }
                            placeholder="XXXX-XXXX-XXXX"
                            disabled={isVerifyingOtp}
                            autoFocus
                            className={clsx(
                              'relative w-full text-center text-xl tracking-[0.3em] font-mono font-bold',
                              'bg-white/80 border-2 border-slate-100 rounded-2xl py-4 px-5',
                              'text-slate-900 placeholder:text-slate-200 transition-all duration-200',
                              'focus:bg-white focus:border-orange-300 focus:outline-none',
                              'focus:shadow-[0_4px_20px_-4px_rgba(249,115,22,0.1)]',
                              isVerifyingOtp && 'opacity-50 cursor-not-allowed',
                            )}
                          />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-100/50 rounded-2xl p-4">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm border border-amber-100/80 flex-shrink-0 mt-0.5">
                          <Info className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <p className="text-[12px] text-slate-500 leading-relaxed">
                          Enter the recovery code you saved when enabling 2FA.
                          Each code can only be used{' '}
                          <span className="text-amber-600 font-bold">once</span>
                          .
                        </p>
                      </div>

                      {/* Verify Button */}
                      <button
                        type="submit"
                        disabled={isVerifyingOtp || !recoveryCode.trim()}
                        className="relative w-full group/btn cursor-pointer disabled:cursor-not-allowed"
                      >
                        <div
                          className={clsx(
                            'relative flex items-center justify-center gap-3 py-4.5 rounded-2xl font-bold text-[15px] transition-all duration-200 overflow-hidden',
                            isVerifyingOtp || !recoveryCode.trim()
                              ? 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                              : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_8px_30px_-6px_rgba(249,115,22,0.35)] active:scale-[0.98]',
                          )}
                        >
                          {!isVerifyingOtp && recoveryCode.trim() && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
                          )}
                          {isVerifyingOtp ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Verifying...
                            </span>
                          ) : (
                            <>
                              <KeySquare className="w-5 h-5 opacity-80" />
                              Verify Recovery Code
                            </>
                          )}
                        </div>
                      </button>

                      {/* Forgot password link */}
                      <div className="flex items-start gap-3 bg-gradient-to-r from-gray-50/60 to-sky-50/40 border border-gray-100/50 rounded-2xl p-4">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100/80 flex-shrink-0 mt-0.5">
                          <Info className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <p className="text-[12px] text-slate-500 leading-relaxed">
                          Don&apos;t have recovery codes?{' '}
                          <Link
                            href="/forgot-password"
                            className="text-gray-600 font-bold hover:underline underline-offset-2"
                          >
                            Forgot Password
                          </Link>{' '}
                          will reset your password &{' '}
                          <span className="text-orange-600 font-bold">
                            disable 2FA
                          </span>
                          .
                        </p>
                      </div>

                      {/* Navigation */}
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUseRecovery(false);
                            setGlobalError(null);
                            setRecoveryCode('');
                          }}
                          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-gray-700 transition-all duration-200 py-2 cursor-pointer rounded-xl hover:bg-gray-50/50"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to authenticator code
                        </button>

                        <button
                          type="button"
                          onClick={backToLogin}
                          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition-all duration-200 py-2 cursor-pointer rounded-xl hover:bg-slate-50/50"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to login
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer (memoized) ── */}
        <Footer />
      </div>

   
    </div>
  );
}