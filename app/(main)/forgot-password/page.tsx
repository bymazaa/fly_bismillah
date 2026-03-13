// app/forgot-password/page.tsx

'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2, Shield, Info } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        setLoading(false);
        return;
      }

      setSent(true);
      toast.success('Reset link sent!');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] px-5">
      <div className="w-full max-w-[480px]">
        {/* Badge */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-2xl border border-white/80 rounded-full px-5 py-2.5 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-bold text-slate-500 tracking-[0.14em] uppercase">
              Password Recovery
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-3xl rounded-[28px] border border-white/70 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[3px]">
            <div className="h-full bg-gradient-to-r from-transparent via-gray-500/70 to-transparent" />
          </div>

          <div className="relative p-8 sm:p-10">
            {!sent ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-2 ring-gray-100">
                    <Mail className="w-8 h-8 text-gray-500" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Forgot Password?
                  </h1>
                  <p className="text-sm text-slate-400 mt-2">
                    Enter your email and we&apos;ll send you a reset link
                  </p>
                </div>

                {/* ✅ 2FA Warning */}
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
                    when you reset your password. You can re-enable it after login.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-[0.16em] flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                        <Mail className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@flybismillah.com"
                        autoFocus
                        className="w-full pl-12 pr-5 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl text-slate-900 text-[15px] placeholder:text-slate-300 font-medium transition-all duration-300 focus:bg-white focus:border-gray-300 focus:outline-none focus:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="relative w-full group/btn cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div
                      className={clsx(
                        'relative flex items-center justify-center gap-3 py-4.5 rounded-2xl font-bold text-[15px] transition-all duration-300 overflow-hidden',
                        loading || !email.trim()
                          ? 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                          : 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-[0_8px_30px_-6px_rgba(59,130,246,0.35)] active:scale-[0.98]'
                      )}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <>
                          <Mail className="w-5 h-5 opacity-80" />
                          Send Reset Link
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </>
            ) : (
              /* ── Success State ── */
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-green-50 rounded-full flex items-center justify-center mx-auto mb-5 ring-2 ring-emerald-100">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                  Check Your Email
                </h2>
                <p className="text-sm text-slate-400 mb-6 max-w-[300px] mx-auto">
                  We&apos;ve sent a password reset link to{' '}
                  <span className="text-slate-700 font-semibold">{email}</span>.
                  Check your inbox.
                </p>

                <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-100/50 rounded-2xl p-4 text-left mb-6">
                  <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    The link will expire in <span className="font-bold">30 minutes</span>.
                    If 2FA was enabled, it will be disabled after reset.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Didn&apos;t receive? Send again
                </button>
              </div>
            )}

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link
                href="/access"
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-gray-600 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}