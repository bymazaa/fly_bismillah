'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plane } from 'lucide-react';

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------
const STEPS = [
    { id: 1, label: 'Connecting',  range: [0,  25] as [number, number] },
    { id: 2, label: 'Scanning',    range: [25, 55] as [number, number] },
    { id: 3, label: 'Comparing',   range: [55, 80] as [number, number] },
    { id: 4, label: 'Finalizing',  range: [80,100] as [number, number] },
];

const TIPS = [
    'Flexible dates can save up to 40%',
    'Early morning flights are usually cheapest',
    'Tue & Wed departures cost less on average',
    'Booking 3–6 weeks ahead gets best deals',
];

// ------------------------------------------------------------------
// Shimmer wrapper
// ------------------------------------------------------------------
const Shimmer = ({ className }: { className: string }) => (
    <div className={`relative overflow-hidden bg-gray-100 rounded-lg ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
);

// ------------------------------------------------------------------
// Airline Price Grid Skeleton
// ------------------------------------------------------------------
const AirlinePriceGridSkeleton = () => (
    <div className="w-full mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 animate-pulse" />
                <div className="space-y-1.5">
                    <Shimmer className="h-3.5 w-32" />
                    <Shimmer className="h-2.5 w-20" />
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 animate-pulse" />
                <div className="w-7 h-7 rounded-lg bg-gray-100 animate-pulse" />
            </div>
        </div>

        {/* Cards row */}
        <div className="flex gap-2 overflow-hidden">
            {[160, 160, 160, 140].map((w, i) => (
                <div
                    key={i}
                    className="relative shrink-0 rounded-xl border border-gray-200/80 bg-white p-3 overflow-hidden"
                    style={{ minWidth: w }}
                >
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-gray-50/80 to-transparent" style={{ animationDelay: `${i * 100}ms` }} />
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100" />
                        <div className="space-y-1.5 flex-1">
                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                            <div className="h-2 bg-gray-50 rounded w-1/2" />
                        </div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                    <div className="h-1 bg-gray-100 rounded-full w-full">
                        <div className="h-full bg-gray-200 rounded-full" style={{ width: `${70 - i * 15}%` }} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ------------------------------------------------------------------
// Sort Bar Skeleton
// ------------------------------------------------------------------
const SortBarSkeleton = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <Shimmer className="h-6 w-40" />
                <Shimmer className="h-5 w-16 rounded-lg" />
            </div>
            <Shimmer className="h-3 w-52" />
        </div>
        <div className="flex items-center gap-2">
            <div className="h-11 w-32 rounded-xl bg-gray-100 animate-pulse" />
        </div>
    </div>
);

// ------------------------------------------------------------------
// Flight Card Skeleton
// ------------------------------------------------------------------
const FlightCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
    <div
        className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5"
        style={{ animationDelay: `${delay}ms` }}
    >
        {/* Shimmer sweep */}
        <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-gray-50/70 to-transparent pointer-events-none"
            style={{ animationDelay: `${delay}ms` }}
        />

        <div className="flex items-center gap-4">
            {/* Airline logo */}
            <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />

            {/* Route info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2.5">
                    {/* Dep time */}
                    <div className="space-y-1">
                        <div className="h-5 w-14 bg-gray-100 rounded" />
                        <div className="h-3 w-10 bg-gray-50 rounded" />
                    </div>

                    {/* Flight arc */}
                    <div className="flex-1 flex flex-col items-center gap-1 px-2">
                        <div className="h-3 w-16 bg-gray-50 rounded" />
                        <div className="w-full flex items-center gap-1">
                            <div className="h-px flex-1 bg-gray-200" />
                            <Plane className="w-3 h-3 text-gray-200 rotate-90 shrink-0" />
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        <div className="h-2.5 w-12 bg-gray-50 rounded" />
                    </div>

                    {/* Arr time */}
                    <div className="space-y-1 text-right">
                        <div className="h-5 w-14 bg-gray-100 rounded ml-auto" />
                        <div className="h-3 w-10 bg-gray-50 rounded ml-auto" />
                    </div>
                </div>

                {/* Tags row */}
                <div className="flex items-center gap-2">
                    <div className="h-5 w-16 bg-gray-100 rounded-lg" />
                    <div className="h-5 w-20 bg-gray-50 rounded-lg" />
                    <div className="h-5 w-14 bg-gray-50 rounded-lg hidden sm:block" />
                </div>
            </div>

            {/* Price + CTA */}
            <div className="shrink-0 text-right pl-4 border-l border-gray-100 space-y-2">
                <div className="h-3.5 w-20 bg-gray-50 rounded ml-auto" />
                <div className="h-7 w-24 bg-gray-100 rounded-xl ml-auto" />
                <div className="h-9 w-24 bg-gray-100 rounded-xl ml-auto" />
            </div>
        </div>
    </div>
);

// ------------------------------------------------------------------
// Progress Banner (slim, integrated)
// ------------------------------------------------------------------
const ProgressBanner = ({ progress, tipIndex, tipVisible }: {
    progress: number;
    tipIndex: number;
    tipVisible: boolean;
}) => {
    const pct = Math.floor(progress);

    const currentStep = useMemo(
        () => STEPS.find(s => progress >= s.range[0] && progress < s.range[1]) ?? STEPS[3],
        [progress],
    );

    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-4 mb-6">
            {/* Top accent */}
            <div
                className="absolute top-0 left-0 h-[2px] bg-gray-900 rounded-t-2xl transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />

            <div className="flex items-center gap-4">
                {/* Left: status */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Ping dot */}
                    <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-700" />
                    </span>

                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-900 leading-tight">
                            {currentStep.label}…
                        </p>
                        <p
                            className={`text-[10px] text-gray-400 font-medium truncate transition-opacity duration-300 ${
                                tipVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            {TIPS[tipIndex]}
                        </p>
                    </div>
                </div>

                {/* Steps pills */}
                <div className="hidden sm:flex items-center gap-1">
                    {STEPS.map(step => {
                        const isDone   = progress >= step.range[1];
                        const isActive = progress >= step.range[0] && progress < step.range[1];
                        return (
                            <div
                                key={step.id}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all duration-300 ${
                                    isDone
                                        ? 'bg-gray-900 text-white'
                                        : isActive
                                        ? 'bg-gray-100 text-gray-700 animate-pulse'
                                        : 'bg-gray-50 text-gray-300'
                                }`}
                            >
                                {step.label}
                            </div>
                        );
                    })}
                </div>

                {/* % */}
                <div className="shrink-0 text-right">
                    <span className="text-xl font-black text-gray-900 tabular-nums leading-none">{pct}</span>
                    <span className="text-xs font-bold text-gray-300">%</span>
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// Main Export
// ------------------------------------------------------------------
export const FlightSearchSkeleton = () => {
    const [progress, setProgress] = useState(0);
    const [tipIndex, setTipIndex] = useState(0);
    const [tipVisible, setTipVisible] = useState(true);

    useEffect(() => {
        const id = setInterval(() => {
            setProgress(p => {
                if (p >= 99) return 99;
                const rem = 99 - p;
                const speed = rem > 60 ? 4 : rem > 30 ? 2 : rem > 10 ? 0.8 : 0.2;
                return Math.min(p + Math.random() * speed, 99);
            });
        }, 120);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            setTipVisible(false);
            setTimeout(() => {
                setTipIndex(i => (i + 1) % TIPS.length);
                setTipVisible(true);
            }, 300);
        }, 2800);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="animate-in fade-in duration-300">
            <style>{`
                @keyframes shimmer {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>

            {/* Progress banner */}
            <ProgressBanner
                progress={progress}
                tipIndex={tipIndex}
                tipVisible={tipVisible}
            />

            {/* Airline price grid placeholder */}
            <AirlinePriceGridSkeleton />

            {/* Sort bar placeholder */}
            <SortBarSkeleton />

            {/* Flight card skeletons */}
            <div className="space-y-4">
                {[0, 150, 300, 450, 600].map((delay, i) => (
                    <FlightCardSkeleton key={i} delay={delay} />
                ))}
            </div>
        </div>
    );
};