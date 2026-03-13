"use client";

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full">
      <div className="flex flex-col items-center gap-6">

        {/* Animated Dashboard Icon */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-200 flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
            {/* Grid icon - represents dashboard */}
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </div>

          {/* Spinning border */}
      
        </div>

        {/* Shimmer bar */}
        <div className="w-44 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-700">Loading Dashboard</p>
          <p className="text-xs text-gray-400">Please wait a moment...</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(500%); }
        }
      `}</style>
    </div>
  );
};

export default Loading;