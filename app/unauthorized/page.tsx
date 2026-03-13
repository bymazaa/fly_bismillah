// app/unauthorized/page.tsx
'use client';
import '../(main)/globals.css'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen py-20 bg-white flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-50 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-50/50 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-md w-full">

        {/* Shield Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 flex items-center justify-center shadow-2xl shadow-gray-100">
              <div className="w-20 h-20 rounded-2xl bg-white border border-red-100 flex items-center justify-center shadow-2xl shadow-gray-100">
                <svg
                  className="w-10 h-10 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
            </div>
            {/* Status Dot */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-pulse border-2 border-white shadow-sm" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-center text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-300 to-red-500 leading-none">
          403
        </h1>

        {/* Title */}
        <h2 className="text-center text-xl font-semibold text-gray-800 mt-4 tracking-wide">
          Access Denied
        </h2>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6 px-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <svg className="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* Description Card */}
        <div className="mx-4 p-4 bg-red-50/60 border border-red-100 rounded-2xl">
          <p className="text-center text-gray-500 text-sm leading-relaxed">
            You don&apos;t have the required permissions to access this page.
            Please contact your{' '}
            <span className="text-red-400 font-medium">administrator</span>{' '}
            if you believe this is a mistake.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="mt-8 mx-auto max-w-xs px-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">Redirecting to home</span>
            <span className="text-red-400 font-semibold tabular-nums">
              {countdown}s
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((10 - countdown) / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col gap-3 px-4">

          {/* Primary Button */}
          <button
            onClick={() => router.push('/')}
            className="w-full cursor-pointer py-3.5 bg-gradient-to-r from-red-500 to-red-400 text-white text-sm font-semibold rounded-2xl
                       hover:from-red-400 hover:to-red-300 transition-all duration-300
                       shadow-lg shadow-red-200 hover:shadow-red-300
                       active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
            </svg>
            Back to Home
          </button>

          {/* Secondary Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 cursor-pointer py-3.5 bg-gray-50 text-gray-600 text-sm font-semibold rounded-2xl
                         border border-gray-100 hover:bg-gray-100 hover:border-gray-200
                         transition-all duration-300 active:scale-[0.98]
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
            <button
              onClick={() => router.push('/access')}
              className="flex-1 cursor-pointer py-3.5 bg-gray-50 text-gray-600 text-sm font-semibold rounded-2xl
                         border border-gray-100 hover:bg-gray-100 hover:border-gray-200
                         transition-all duration-300 active:scale-[0.98]
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-300" />
          <p className="text-gray-300 text-xs font-mono tracking-wider">
            ERR_FORBIDDEN · {new Date().toISOString().split('T')[0]}
          </p>
          <div className="w-1.5 h-1.5 rounded-full bg-red-300" />
        </div>
      </div>
    </div>
  );
}