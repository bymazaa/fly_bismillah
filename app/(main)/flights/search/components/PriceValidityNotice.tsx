'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    RefreshCw,
    ShieldCheck,
    Zap,
    Hourglass,
    Clock,
    AlertTriangle,
    Sparkles,
    Timer,
    Plane,
} from 'lucide-react';
import { PRICE_VALIDITY_DURATION_MS } from '@/constant/control';

// ------------------------------------------------------------------
// TOTAL_SECONDS moved outside component — prevents recalculation on
// every render and avoids stale value in useEffect dependency arrays
// ------------------------------------------------------------------
const TOTAL_SECONDS = Math.floor(PRICE_VALIDITY_DURATION_MS / 1000);

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface PriceValidityNoticeProps {
    showTimer?: boolean;
    offerId: string;
}

type TimerPhase = 'safe' | 'warning' | 'danger' | 'critical' | 'expired';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const getPhase = (timeLeft: number, total: number): TimerPhase => {
    if (timeLeft <= 0) return 'expired';
    const ratio = timeLeft / total;
    if (ratio <= 0.1) return 'critical';  // last 10%
    if (ratio <= 0.25) return 'danger';   // last 25%
    if (ratio <= 0.5) return 'warning';   // last 50%
    return 'safe';
};

// ------------------------------------------------------------------
// Phase config — all visual tokens per phase
// ------------------------------------------------------------------
const PHASE_CONFIG: Record<
    Exclude<TimerPhase, 'expired'>,
    {
        bg: string;
        border: string;
        iconBg: string;
        iconColor: string;
        textPrimary: string;
        textSecondary: string;
        stroke: string;
        strokeBg: string;
        badge: string;
        badgeText: string;
        shadow: string;
        label: string;
        sublabel: string;
        icon: React.ElementType;
        animate: string;
    }
> = {
    safe: {
        bg: 'bg-emerald-50/80',
        border: 'border-emerald-200/60',
        iconBg: 'bg-emerald-500',
        iconColor: 'text-white',
        textPrimary: 'text-emerald-900',
        textSecondary: 'text-emerald-600/70',
        stroke: 'stroke-emerald-500',
        strokeBg: 'stroke-emerald-100',
        badge: 'bg-emerald-100 border-emerald-200',
        badgeText: 'text-emerald-700',
        shadow: 'shadow-sm shadow-emerald-100/50',
        label: 'Price Guaranteed',
        sublabel: 'Rates are locked for your session',
        icon: ShieldCheck,
        animate: '',
    },
    warning: {
        bg: 'bg-amber-50/80',
        border: 'border-amber-200/60',
        iconBg: 'bg-amber-500',
        iconColor: 'text-white',
        textPrimary: 'text-amber-900',
        textSecondary: 'text-amber-600/70',
        stroke: 'stroke-amber-500',
        strokeBg: 'stroke-amber-100',
        badge: 'bg-amber-100 border-amber-200',
        badgeText: 'text-amber-700',
        shadow: 'shadow-sm shadow-amber-100/50',
        label: 'Prices Updating Soon',
        sublabel: 'Book now to lock this price',
        icon: Clock,
        animate: '',
    },
    danger: {
        bg: 'bg-rose-50/80',
        border: 'border-rose-200/60',
        iconBg: 'bg-rose-500',
        iconColor: 'text-white',
        textPrimary: 'text-rose-900',
        textSecondary: 'text-rose-600/70',
        stroke: 'stroke-rose-500',
        strokeBg: 'stroke-rose-100',
        badge: 'bg-rose-100 border-rose-200',
        badgeText: 'text-rose-700',
        shadow: 'shadow-md shadow-rose-100/50',
        label: 'Price Expiring',
        sublabel: 'Select a flight before prices refresh',
        icon: AlertTriangle,
        animate: 'animate-pulse',
    },
    critical: {
        bg: 'bg-red-50/90',
        border: 'border-red-300/70',
        iconBg: 'bg-red-600',
        iconColor: 'text-white',
        textPrimary: 'text-red-900',
        textSecondary: 'text-red-600/80',
        stroke: 'stroke-red-600',
        strokeBg: 'stroke-red-100',
        badge: 'bg-red-100 border-red-200',
        badgeText: 'text-red-700',
        shadow: 'shadow-lg shadow-red-100/60',
        label: 'Expiring Now!',
        sublabel: 'Hurry — prices will refresh momentarily',
        icon: Zap,
        animate: 'animate-pulse',
    },
};

// ------------------------------------------------------------------
// Circular Timer
// ------------------------------------------------------------------
const CircularTimer = ({
    timeLeft,
    totalTime,
    phase,
}: {
    timeLeft: number;
    totalTime: number;
    phase: Exclude<TimerPhase, 'expired'>;
}) => {
    const config = PHASE_CONFIG[phase];
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const progress = timeLeft / totalTime;
    const offset = circumference * (1 - progress);

    return (
        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            {/* Ping glow for critical phase */}
            {phase === 'critical' && (
                <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
            )}

            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                {/* Background track */}
                <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    fill="none"
                    className={config.strokeBg}
                    strokeWidth="3"
                />
                {/* Progress arc */}
                <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    fill="none"
                    className={`${config.stroke} transition-all duration-1000 ease-linear`}
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>

            {/* Timer text */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${config.textPrimary}`}>
                <span className="text-[13px] font-black tabular-nums leading-none">
                    {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </span>
                {/* ✅ Fixed label — shows MM:SS so label should say "left" not "min" */}
                <span className="text-[7px] font-bold uppercase tracking-wider opacity-50 mt-0.5">
                    left
                </span>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// Expired Modal
// ------------------------------------------------------------------
const ExpiredModal = ({ onRefresh }: { onRefresh: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-xl animate-in fade-in duration-500" />

        {/* Modal */}
        <div className="relative w-full max-w-[380px] animate-in zoom-in-95 slide-in-from-bottom-6 duration-500">
            {/* Outer glow ring */}
            <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-b from-amber-200/50 to-rose-200/50 blur-sm" />

            <div className="relative bg-white rounded-[2rem] border border-gray-100 shadow-2xl shadow-gray-900/20 overflow-hidden">
                {/* Top gradient strip */}
                <div className="h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400" />

                {/* Content */}
                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className="relative mx-auto mb-6 w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-2 border-amber-200 animate-[ping_2.5s_ease-out_infinite]" />
                        <div
                            className="absolute inset-0 rounded-full border-2 border-amber-200 animate-[ping_2.5s_ease-out_infinite]"
                            style={{ animationDelay: '0.5s' }}
                        />
                        <div className="
                            relative w-full h-full rounded-full
                            bg-gradient-to-br from-amber-50 to-amber-100
                            border border-amber-200/50
                            flex items-center justify-center
                            shadow-lg shadow-amber-100/50
                        ">
                            <Hourglass className="w-8 h-8 text-amber-600" />
                        </div>
                    </div>

                    {/* Text */}
                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Session Expired
                    </h2>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-2 max-w-[280px] mx-auto">
                        Flight prices change frequently. Refresh to see the latest availability and fares.
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-4 mb-8 mt-4">
                        {[
                            { icon: Plane, label: '400+ airlines' },
                            { icon: Sparkles, label: 'Live prices' },
                            { icon: ShieldCheck, label: 'Best rates' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <item.icon className="w-3 h-3 text-gray-300" />
                                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={onRefresh}
                        className="
                            group w-full py-4 px-6
                            bg-gradient-to-r from-gray-900 to-gray-800
                            hover:from-gray-800 hover:to-gray-700
                            text-white font-bold text-sm
                            rounded-2xl
                            shadow-xl shadow-gray-900/20
                            flex items-center justify-center gap-2.5
                            transition-all duration-300
                            active:scale-[0.98]
                            cursor-pointer
                        "
                    >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                        Check Latest Fares
                    </button>

                    <p className="text-[10px] text-gray-400 mt-3 font-medium">
                        This will refresh your search results
                    </p>
                </div>
            </div>
        </div>
    </div>
);

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------
export const PriceValidityNotice = ({
    showTimer = true,
    offerId,
}: PriceValidityNoticeProps) => {
    const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
    const [isExpired, setIsExpired] = useState(false);
    const [targetTime, setTargetTime] = useState(0);

    // Reset timer when offerId changes (new search or offer selection)
    useEffect(() => {
        const newTarget = Date.now() + PRICE_VALIDITY_DURATION_MS;
        setTargetTime(newTarget);
        setIsExpired(false);
        setTimeLeft(TOTAL_SECONDS);
    }, [offerId]);

    // Countdown tick — runs every second until expired
    useEffect(() => {
        if (!targetTime) return;

        const update = () => {
            const diff = targetTime - Date.now();
            if (diff <= 0) {
                setTimeLeft(0);
                setIsExpired(true);
            } else {
                setTimeLeft(Math.floor(diff / 1000));
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);

    const phase = useMemo(() => getPhase(timeLeft, TOTAL_SECONDS), [timeLeft]);

    // ✅ Always reload the page — expired modal must show even when showTimer=false
    const handleRefresh = () => window.location.reload();

    // Expired modal takes priority — always show regardless of showTimer
    if (isExpired) return <ExpiredModal onRefresh={handleRefresh} />;

    // When showTimer is false and not expired, render nothing
    if (!showTimer) return null;

    // Guard — phase should never be 'expired' here but satisfy TS
    if (phase === 'expired') return null;

    const config = PHASE_CONFIG[phase];
    const PhaseIcon = config.icon;

    return (
        <div
            className={`
                flex items-center gap-3.5
                p-3 pr-4 my-4
                rounded-2xl border
                transition-all duration-700 ease-out
                ${config.bg} ${config.border} ${config.shadow} ${config.animate}
            `}
        >
            {/* Icon */}
            <div
                className={`
                    w-10 h-10 rounded-xl shrink-0
                    flex items-center justify-center
                    ${config.iconBg} ${config.iconColor}
                    shadow-lg shadow-current/10
                    transition-colors duration-500
                `}
            >
                {/* ✅ Fixed: w-4.5 is not a valid Tailwind class — replaced with w-[18px] */}
                <PhaseIcon className="w-[18px] h-[18px]" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${config.textSecondary}`}>
                        {config.label}
                    </span>

                    {phase === 'safe' && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${config.badge}`}>
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                            <span className={`text-[8px] font-bold ${config.badgeText}`}>LIVE</span>
                        </span>
                    )}

                    {phase === 'critical' && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${config.badge}`}>
                            <Zap className="w-2 h-2 text-red-600 fill-current" />
                            <span className={`text-[8px] font-bold ${config.badgeText}`}>URGENT</span>
                        </span>
                    )}
                </div>

                <p className={`text-[12px] font-semibold leading-tight ${config.textPrimary}`}>
                    {config.sublabel}
                </p>
            </div>

            {/* Circular timer */}
            <CircularTimer
                timeLeft={timeLeft}
                totalTime={TOTAL_SECONDS}
                phase={phase}
            />
        </div>
    );
};