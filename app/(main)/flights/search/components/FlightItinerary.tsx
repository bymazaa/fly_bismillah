'use client';

import { memo } from 'react';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    Plane,
    Utensils,
    Wifi,
    Zap,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ✅ Import from central types — not from FlightResultCard
import type { FlightLeg } from '../types/searchTypes';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const formatTime = (iso: string) => format(parseISO(iso), 'hh:mm a');
const formatDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM');

// ------------------------------------------------------------------
// Amenity icon
// ------------------------------------------------------------------
const AmenityIcon = ({ label }: { label: string }) => {
    const lower = label.toLowerCase();
    if (lower.includes('wifi'))
        return <Wifi className="w-3 h-3 text-blue-500" />;
    if (lower.includes('meal') || lower.includes('food'))
        return <Utensils className="w-3 h-3 text-amber-600" />;
    if (lower.includes('usb') || lower.includes('power'))
        return <Zap className="w-3 h-3 text-yellow-600" />;
    return <CheckCircle2 className="w-3 h-3 text-slate-600" />;
};

// ------------------------------------------------------------------
// MAIN COMPONENT — memo wrapped for performance (lazy loaded)
// ------------------------------------------------------------------
export const FlightDetails = memo(function FlightDetails({
    itinerary,
}: {
    itinerary: FlightLeg[];
}) {
    return (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
            {itinerary.map((leg, i) => (
                <div key={leg.id || i} className="mb-8 last:mb-0">

                    {/* Leg Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <span
                            className={`w-2 h-8 rounded-full ${
                                i === 0 ? 'bg-rose-400' : 'bg-sky-400'
                            }`}
                        />
                        <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.16em]">
                                {leg.direction} Journey
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Total Duration: {leg.totalDuration} •{' '}
                                {leg.segments.length} Flight
                                {leg.segments.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-6 ml-1 space-y-6">
                        {/* Vertical connector line */}
                        <div className="absolute top-3 bottom-3 left-[18px] w-[2px] bg-slate-200" />

                        {leg.segments.map((seg, j) => (
                            <div key={seg.id || j} className="relative z-10">
                                {/* Timeline dot */}
                                <div className="
                                    absolute left-[12px] top-4
                                    w-3.5 h-3.5 rounded-full
                                    bg-white border-[3px] border-slate-400
                                    shadow-sm
                                " />

                                {/* Segment Card */}
                                <div className="
                                    bg-white p-4 md:p-5
                                    rounded-xl border border-slate-200/80
                                    
                                    ml-4
                                    transition-colors duration-200
                                ">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            {/* Airline logo */}
                                            <div className="
                                                w-8 h-8 shrink-0
                                                flex items-center justify-center
                                                bg-slate-50 rounded-lg border border-slate-100
                                            ">
                                                {seg.logo ? (
                                                    <img
                                                        src={seg.logo}
                                                        // ✅ null guard — seg.airline can be null
                                                        alt={seg.airline ?? 'Airline'}
                                                        className="w-6 h-6 object-contain"
                                                    />
                                                ) : (
                                                    <Plane className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>

                                            {/* Airline + flight info */}
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {/* ✅ null guard */}
                                                    {seg.airline ?? 'Unknown Airline'}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium">
                                                    {/* ✅ null guards — aircraft and flightNumber both nullable */}
                                                    {seg.aircraft ?? 'Aircraft TBA'}
                                                    {seg.flightNumber ? ` • Flight ${seg.flightNumber}` : ''}
                                                    {' • '}
                                                    <span className="capitalize">{seg.classType}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amenities */}
                                        {seg.amenities.length > 0 && (
                                            <div className="flex gap-1.5">
                                                {seg.amenities.map((item) => (
                                                    <div
                                                        // ✅ amenity string as key — more stable than index
                                                        key={item}
                                                        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                                                        title={item}
                                                    >
                                                        <AmenityIcon label={item} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Times Row */}
                                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                                        {/* Departure */}
                                        <div>
                                            <p className="text-lg font-black text-slate-900">
                                                {formatTime(seg.departure.time)}
                                            </p>
                                            <p className="text-xs font-semibold text-slate-600">
                                                {formatDate(seg.departure.time)}
                                            </p>
                                            <p className="text-xs  text-slate-700 mt-1">
                                                {/* ✅ null guards — airport and code are string | null */}
                                                {seg.departure.airport ?? 'Airport TBA'}
                                                {seg.departure.code ? ` (${seg.departure.code})` : ''}
                                            </p>
                                        </div>

                                        {/* Arrow + duration */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-400 mb-1">
                                                {seg.duration}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-slate-300" />
                                        </div>

                                        {/* Arrival */}
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900">
                                                {formatTime(seg.arrival.time)}
                                            </p>
                                            <p className="text-xs font-semibold text-slate-600">
                                                {formatDate(seg.arrival.time)}
                                            </p>
                                            <p className="text-xs  text-slate-700 mt-1">
                                                {/* ✅ null guards */}
                                                {seg.arrival.airport ?? 'Airport TBA'}
                                                {seg.arrival.code ? ` (${seg.arrival.code})` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Layover Badge */}
                                {seg.layoverToNext && (
                                    <div className="my-5 ml-4 flex items-center gap-3">
                                        <div className="h-px bg-slate-300 flex-1 border-t border-dashed" />
                                        <div className="
                                            flex items-center gap-2
                                            px-3 py-1.5
                                            bg-amber-50 border border-amber-200/60
                                            rounded-md
                                            text-amber-700 text-[10px]
                                            font-bold uppercase tracking-wide
                                        ">
                                            <Clock className="w-3 h-3" />
                                            {seg.layoverToNext} layover
                                            {/* ✅ null guard — arrival.code can be null */}
                                            {seg.arrival.code ? ` in ${seg.arrival.code}` : ''}
                                        </div>
                                        <div className="h-px bg-slate-300 flex-1 border-t border-dashed" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
});