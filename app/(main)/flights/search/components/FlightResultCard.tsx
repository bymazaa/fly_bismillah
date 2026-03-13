'use client';

import { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Plane,
    ArrowRight,
    Clock,
    ChevronDown,
    Briefcase,
    AlertCircle,
    Luggage,
    ShoppingBag,   // ✅ replaces invalid "Handbag"
    HandCoins,
    BanknoteX,
} from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { BaggageInfo, FlightLeg, FlightOffer } from '../types/searchTypes';

// ✅ Import from central types — never re-export types from a component file

// ------------------------------------------------------------------
// Lazy-load FlightDetails — only fetched when user expands the card
// ------------------------------------------------------------------
const FlightDetails = lazy(() =>
    import('./FlightItinerary').then((mod) => ({ default: mod.FlightDetails })),
);

const preloadFlightDetails = () => {
    import('./FlightItinerary');
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const formatTime = (iso: string) => format(parseISO(iso), 'hh:mm a');
const formatDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM');

const getDayDiff = (dep: string, arr: string): string => {
    const diff = differenceInCalendarDays(parseISO(arr), parseISO(dep));
    return diff > 0 ? `+${diff}` : '';
};

// ------------------------------------------------------------------
// Baggage Badges
// Renders one badge per included bag type from the BaggageInfo object.
// ------------------------------------------------------------------
const BaggageBadges = ({ baggage }: { baggage: BaggageInfo }) => {
    const includedBags = baggage.details.filter((d) => d.isIncluded);

    // Nothing included — show cabin only
    if (includedBags.length === 0) {
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase border border-amber-100">
                <AlertCircle className="w-3 h-3" />
                Cabin Bag Only
            </span>
        );
    }

    return (
        <>
            {includedBags.map((bag, i) => {
                let colorClasses = 'bg-slate-50 text-slate-600 border-slate-200';
                let icon = <Briefcase className="w-3 h-3" />;

                if (bag.type === 'checked') {
                    colorClasses = 'bg-purple-50 text-purple-700 border-purple-100';
                    icon = <Luggage className="w-3 h-3" />;
                } else if (bag.type === 'carry_on') {
                    colorClasses = 'bg-slate-50 text-slate-600 border-slate-200';
                    icon = <ShoppingBag className="w-3 h-3" />; // ✅ valid icon
                } else if (bag.type === 'personal_item') {
                    colorClasses = 'bg-gray-50 text-gray-600 border-gray-200';
                    icon = <Briefcase className="w-3 h-3" />;
                }

                const label = `${bag.quantity}× ${bag.label}`;

                return (
                    <span
                        key={`${bag.type}-${i}`}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${colorClasses}`}
                    >
                        {icon}
                        {label}
                    </span>
                );
            })}
        </>
    );
};

// ------------------------------------------------------------------
// Flight Path Visual
// ------------------------------------------------------------------
const FlightPathVisual = ({ duration, stops }: { duration: string; stops: number }) => (
    <div className="flex flex-col items-center justify-center w-full px-4 min-w-[120px]">
        <div className="flex justify-between w-full mb-1.5">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> {duration}
            </span>
            <span className={`text-[10px] font-bold ${stops === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stops === 0 ? 'Non-stop' : `${stops} Stop${stops > 1 ? 's' : ''}`}
            </span>
        </div>
        <div className="relative w-full flex items-center h-4">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full h-[2px] bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full" />
            </div>
            <div className="w-2.5 h-2.5 bg-white border-[2.5px] border-slate-700 rounded-full absolute left-0 z-10 shadow-sm" />
            <div className="absolute left-1/2 -translate-x-1/2 bg-white px-1 z-10">
                <Plane className="w-3.5 h-3.5 text-slate-700 rotate-90" />
            </div>
            {stops > 0 && (
                <div className="absolute left-[32%] top-1/2 -translate-y-1/2 z-10 group cursor-help">
                    <div className="w-2.5 h-2.5 bg-white border-2 border-amber-500 rounded-full ring-2 ring-amber-100 shadow-sm" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg shadow-slate-900/40">
                        {stops} Stop{stops > 1 ? 's' : ''}
                    </div>
                </div>
            )}
            <div className="w-2.5 h-2.5 bg-slate-700 border-[2.5px] border-slate-700 rounded-full absolute right-0 z-10 shadow-sm" />
        </div>
    </div>
);

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------
export const FlightResultCard = ({ flight }: { flight: FlightOffer }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const searchParams = useSearchParams();

    const handleSelectFlight = () => {
        const query = new URLSearchParams(searchParams.toString());
        query.set('offer_id', flight.id);
        window.open(`/checkout?${query.toString()}`, '_blank');
    };

    return (
        <div className="
            relative mb-5 rounded-md bg-white/95
            border border-dashed border-slate-300/70
            transition-all duration-300 overflow-hidden group
            hover:shadow-md hover:shadow-gray-100/60
        ">
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                {/* Left: Itinerary */}
                <div className="flex-[3] p-5 lg:p-6 flex flex-col justify-center gap-6 bg-gradient-to-br from-white via-white to-slate-50/60">
                    {flight.itinerary.map((leg: FlightLeg, idx: number) => {
                        // ✅ null guard — mainDeparture/mainArrival can be null per types
                        const depTime = leg.mainDeparture?.time;
                        const arrTime = leg.mainArrival?.time;

                        if (!depTime || !arrTime) return null;

                        const dayDiff = getDayDiff(depTime, arrTime);
                        const isLast = idx === flight.itinerary.length - 1;

                        return (
                            <div
                                key={leg.id || idx}
                                className={`
                                    flex flex-col md:flex-row items-center gap-5 md:gap-6
                                    px-3.5 py-3 shadow-slate-100
                                    ${!isLast ? 'border-b border-dashed border-b-slate-300/50' : ''}
                                `}
                            >
                                {/* Airline brand */}
                                <div className="flex items-center gap-3 md:gap-4 w-full md:w-[200px] shrink-0">
                                    <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-white rounded-2xl border border-gray-100 p-1.5">
                                        {leg.mainLogo ? (
                                            <img
                                                src={leg.mainLogo}
                                                // ✅ null guard — mainAirline can be null
                                                alt={leg.mainAirline ?? 'Airline'}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <Plane className="w-6 h-6 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-slate-900 leading-tight truncate">
                                            {/* ✅ null guard — show fallback if name is null */}
                                            {leg.mainAirline ?? 'Unknown Airline'}
                                        </p>
                                        {/* ✅ null guard — aircraft can be null */}
                                        {leg.segments[0]?.aircraft && (
                                            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 border border-slate-100">
                                                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
                                                    {leg.segments[0].aircraft}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Times + path */}
                                <div className="flex-1 w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-6">
                                    {/* Departure */}
                                    <div className="text-left">
                                        <p className="text-xl font-black text-slate-900 leading-none">
                                            {formatTime(depTime)}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                                            {/* ✅ null guard */}
                                            {leg.mainDeparture?.code ?? '--'}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                            {formatDate(depTime)}
                                        </p>
                                    </div>

                                    <FlightPathVisual
                                        duration={leg.totalDuration}
                                        stops={leg.stops}
                                    />

                                    {/* Arrival */}
                                    <div className="text-right relative">
                                        <p className="text-xl font-black text-slate-900 leading-none">
                                            {formatTime(arrTime)}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                                            {/* ✅ null guard */}
                                            {leg.mainArrival?.code ?? '--'}
                                        </p>
                                        <div className="flex flex-col items-end">
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                                {formatDate(arrTime)}
                                            </p>
                                            {dayDiff && (
                                                <span className="absolute -top-3 -right-2 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 rounded-xl border border-rose-100">
                                                    {dayDiff}D
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-2 pt-3 border-t border-slate-100">
                        {/* Refund badge */}
                        {flight.conditions.refundable ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                                <HandCoins className="w-3 h-3" /> Refundable
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                                <BanknoteX className="w-3 h-3" /> Non-Refundable
                            </span>
                        )}

                        {/* ✅ Baggage badges — typed, no more `any` */}
                        <BaggageBadges baggage={flight.baggage} />
                    </div>
                </div>

                {/* Right: Price + CTA */}
                <div className="
                    flex-1 min-w-[220px]
                    bg-gradient-to-br from-rose-50 via-white to-slate-50
                    border-l border-slate-100
                    p-5 lg:p-6
                    flex flex-row lg:flex-col
                    justify-between lg:justify-center
                    items-center gap-4
                    relative overflow-hidden
                ">
                    {/* Background blobs */}
                    <div className="pointer-events-none absolute inset-0 opacity-60">
                        <div className="absolute -top-12 right-0 w-32 h-32 rounded-full bg-rose-200 blur-3xl" />
                        <div className="absolute bottom-0 -left-10 w-32 h-32 rounded-full bg-sky-200 blur-3xl" />
                    </div>

                    {/* Price */}
                    <div className="relative z-10 text-left lg:text-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.22em] mb-1 hidden lg:block">
                            Total Fare
                        </p>
                        <div className="flex items-baseline lg:justify-center gap-1">
                            <span className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
                                {flight.price.currency === 'USD' ? '$' :flight.price.currency}
                                {flight.price.finalPrice.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                            Includes all taxes & fees
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="relative z-10 flex flex-col gap-2.5 w-auto lg:w-full">
                        <button
                            onClick={handleSelectFlight}
                            className="
                                w-full px-6 py-3 rounded-2xl
                                bg-gradient-to-r from-rose-500 via-rose-500 to-rose-400
                                hover:from-rose-600 hover:to-rose-500
                                text-white font-semibold text-sm
                                flex items-center justify-center gap-2
                                shadow-lg shadow-rose-300/60
                                transition-all active:scale-95 cursor-pointer
                            "
                        >
                            Select <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                            onMouseEnter={preloadFlightDetails}
                            onClick={() => setIsExpanded((v) => !v)}
                            className="
                                text-[11px] font-semibold
                                flex items-center justify-center gap-1.5
                                transition-all py-2 rounded-md
                                text-rose-600 hover:text-rose-700 hover:bg-rose-50
                                active:scale-95 cursor-pointer
                            "
                        >
                            {isExpanded ? 'Hide Details' : 'View Flight Details'}
                            <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                    isExpanded ? 'rotate-180' : ''
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expandable details — CSS grid animation */}
            <div
                className={`
                    grid transition-all duration-300 ease-in-out
                    ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
                `}
            >
                <div className="overflow-hidden">
                    <div className="bg-slate-50/80 border-t border-slate-200 px-5 lg:px-6 pb-6 pt-5">
                        {isExpanded && (
                            <Suspense
                                fallback={
                                    <div className="flex items-center justify-center py-8 gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-200 border-t-rose-500" />
                                        <span className="text-sm text-slate-500 font-medium">
                                            Loading flight details...
                                        </span>
                                    </div>
                                }
                            >
                                <FlightDetails itinerary={flight.itinerary} />
                            </Suspense>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};