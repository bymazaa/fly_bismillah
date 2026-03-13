"use client";
import { appTheme } from "@/constant/theme/global";

const page = () => {
  const { colors } = appTheme;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-rose-50">

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-rose-100/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-sky-100/40 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      {/* Main loader */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Plane animation container */}
        <div className="relative w-40 h-40 mb-10">

          {/* Outer orbit ring */}
          <div className="absolute inset-0 rounded-full border border-rose-100 animate-[spin_8s_linear_infinite]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-300 rounded-full" />
          </div>

          {/* Middle orbit ring */}
          <div className="absolute inset-4 rounded-full border border-dashed border-rose-200/60 animate-[spin_12s_linear_infinite_reverse]" />

          {/* Inner glowing circle */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-200 flex items-center justify-center">

            {/* Plane icon - pure CSS */}
            <svg
              className="w-10 h-10 text-white drop-shadow-sm"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>

            {/* Ping effect */}
            <div className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-20" />
          </div>

          {/* Orbiting dot */}
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-rose-500 rounded-full shadow-md shadow-rose-300">
              <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-40" />
            </div>
          </div>
        </div>

        {/* Brand name */}
        <h2 className={`text-2xl font-bold ${colors.text.heading} tracking-tight mb-1`}>
          Bismillah
          <span className="text-rose-600"> Travels</span>
        </h2>

        {/* Animated line loader */}
        <div className="w-48 h-[3px] bg-gray-100 rounded-full overflow-hidden mt-4 mb-4">
          <div className="h-full w-1/3 bg-gradient-to-r from-rose-500 to-rose-400 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>

        {/* Tagline */}
        <p className="text-xs text-gray-400 font-medium uppercase tracking-[0.25em]">
          Preparing your journey
        </p>
      </div>

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
};

export default page;