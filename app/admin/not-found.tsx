"use client";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-[75vh] w-full px-4">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">

        {/* 404 Visual */}
        <div className="relative">
          {/* Background shape */}
          <div className="absolute -inset-6 bg-rose-50 rounded-full blur-2xl opacity-60" />

          {/* Number display */}
          <div className="relative flex items-center gap-3">
            <span className="text-7xl sm:text-8xl font-black text-gray-200 select-none">4</span>

            {/* Middle icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-200 flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
              <svg className="w-8 h-8 sm:w-9 sm:h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <span className="text-7xl sm:text-8xl font-black text-gray-200 select-none">4</span>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Page Not Found
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
            The page you are looking for doesn&apos;t exist or has been moved to another location.
          </p>
        </div>

        {/* Divider */}
        <div className="w-12 h-[2px] bg-gray-100 rounded-full" />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-200 hover:shadow-lg hover:shadow-rose-200 hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
            </svg>
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-gray-600 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>

        {/* Help link */}
        <p className="text-xs text-gray-300 mt-2">
          Need help?{" "}
          <Link href="/admin/support" className="text-rose-500 hover:text-rose-600 font-medium underline underline-offset-2">
            Contact Support
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;