// components/BookingSummary.tsx

import {
    Plane,
    ShieldCheck,
    AlertTriangle,
    Calendar,
    Ticket,
    Luggage,
    Lock,
    Users,
    Info,
    RefreshCcw,
    Briefcase,
    Backpack,
    Package,
    X,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

// ------------------------------------------------------------------
// 🛠️ TYPES — Aligned with FlightData from checkout page
// ------------------------------------------------------------------
interface BaggageDetail {
    type: string;
    label: string;
    icon?: string;
    quantity: number;
    weightPerBag?: number;
    totalWeight?: number;
    weightUnit?: string;
    isApprox?: boolean;
    hasExplicitWeight?: boolean;
    isIncluded: boolean;
    displayText: string;
}

interface BaggageInfo {
    summary: string;
    details: BaggageDetail[];
    hasChecked: boolean;
    hasCarryOn: boolean;
    hasPersonalItem?: boolean;
    totalWeight?: number;
    totalWeightDisplay?: string;
    includedCount?: number;
}

// ✅ FIXED — matches FlightSegment['departure'] / ['arrival'] from checkout
interface SegmentEndpoint {
    airport?: string | null;
    code?: string | null;
    city?: string | null;
    terminal?: string | null;
    time: string;
}

// ✅ FIXED — matches FlightSlice from checkout exactly
interface Slice {
    id: string;
    direction: string;
    totalDuration?: string | null;
    stops: number;
    segments: {
        id: string;
        airline?: string | null;
        logo?: string | null;
        flightNumber?: string | null;
        aircraft?: string | null;
        classType?: string | null;
        duration?: string | null;
        layoverToNext?: string | null;
        departure: SegmentEndpoint;
        arrival: SegmentEndpoint;
    }[];
    mainDeparture?: SegmentEndpoint | null;
    mainArrival?: SegmentEndpoint | null;
    mainAirline?: string | null;
    mainLogo?: string | null;
}

interface FlightOffer {
    id: string;
    itinerary: Slice[];
    price: {
        finalPrice: number;
        currency: string;
        basePrice: number;
        markup: number;
    };
    baggage: BaggageInfo | string;
    cabinClass?: string | null;
    refundPolicy?: string;
    fareRules?: {
        change: string;
        refund: string;
        isRefundable: boolean;
    };
    conditions?: {
        refundable: boolean;
        changeable?: boolean;
    };
}

interface BookingSummaryProps {
    passengers: { adults: number; children: number; infants: number };
    flight: FlightOffer | null;
}

// ------------------------------------------------------------------
// 🟢 HELPER FUNCTIONS
// ------------------------------------------------------------------
const formatCurrency = (amount: number | undefined, currency: string = 'USD') => {
    if (amount === undefined || amount === null) return '0.00';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${amount} ${currency}`;
    }
};

const safeDateFormat = (dateString: string | undefined | null, formatString: string) => {
    if (!dateString) return '--';
    try {
        const date = parseISO(dateString);
        if (!isValid(date)) return '--';
        return format(date, formatString);
    } catch {
        return '--';
    }
};

const formatDuration = (duration: string | undefined | null) => {
    if (!duration) return '--';
    if (!duration.toUpperCase().includes('P') && (duration.includes('h') || duration.includes('m'))) {
        return duration;
    }
    const upper = duration.toUpperCase();
    const d = parseInt(upper.match(/(\d+)\s*D/)?.[1] ?? '0');
    const h = parseInt(upper.match(/(\d+)\s*H/)?.[1] ?? '0');
    const m = parseInt(upper.match(/(\d+)\s*M/)?.[1] ?? '0');
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (parts.length === 0) return duration.replace('P', '').replace('T', '').toLowerCase();
    return parts.join(' ');
};

const getPassengerText = (p: { adults: number; children: number; infants: number }) => {
    const parts: string[] = [];
    if (p.adults > 0) parts.push(`${p.adults} Adult${p.adults > 1 ? 's' : ''}`);
    if (p.children > 0) parts.push(`${p.children} Child${p.children > 1 ? 'ren' : ''}`);
    if (p.infants > 0) parts.push(`${p.infants} Infant${p.infants > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : 'No Passengers';
};

// ✅ ADDED — safely resolve departure / arrival from a slice
// Prefers mainDeparture/mainArrival; falls back to first/last segment
const getSliceDeparture = (slice: Slice): SegmentEndpoint | null => {
    if (slice.mainDeparture) return slice.mainDeparture;
    return slice.segments?.[0]?.departure ?? null;
};

const getSliceArrival = (slice: Slice): SegmentEndpoint | null => {
    if (slice.mainArrival) return slice.mainArrival;
    const segs = slice.segments ?? [];
    return segs[segs.length - 1]?.arrival ?? null;
};

const getSliceAirline = (slice: Slice): string => {
    return slice.mainAirline ?? slice.segments?.[0]?.airline ?? '';
};

const getSliceLogo = (slice: Slice): string | null => {
    return slice.mainLogo ?? slice.segments?.[0]?.logo ?? null;
};

// ------------------------------------------------------------------
// 🧳 BAGGAGE HELPERS
// ------------------------------------------------------------------
const getBagIcon = (type: string) => {
    switch (type) {
        case 'checked':       return <Luggage className="w-4 h-4" />;
        case 'carry_on':      return <Briefcase className="w-4 h-4" />;
        case 'personal_item': return <Backpack className="w-4 h-4" />;
        default:              return <Package className="w-4 h-4" />;
    }
};

const getBagColorScheme = (type: string, isIncluded: boolean) => {
    if (!isIncluded) {
        return {
            bg: 'bg-gray-50', border: 'border-gray-100',
            iconBg: 'bg-gray-100/50', iconColor: 'text-gray-400',
            textColor: 'text-gray-400', weightColor: 'text-gray-400',
        };
    }
    switch (type) {
        case 'checked':
            return {
                bg: 'bg-blue-50/60', border: 'border-blue-100',
                iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
                textColor: 'text-blue-800', weightColor: 'text-blue-600',
            };
        case 'carry_on':
            return {
                bg: 'bg-violet-50/60', border: 'border-violet-100',
                iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
                textColor: 'text-violet-800', weightColor: 'text-violet-600',
            };
        case 'personal_item':
            return {
                bg: 'bg-amber-50/60', border: 'border-amber-100',
                iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
                textColor: 'text-amber-800', weightColor: 'text-amber-600',
            };
        default:
            return {
                bg: 'bg-slate-50/60', border: 'border-slate-100',
                iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
                textColor: 'text-slate-800', weightColor: 'text-slate-600',
            };
    }
};

// ------------------------------------------------------------------
// 🧳 BAGGAGE SECTION
// ------------------------------------------------------------------
const BaggageSection = ({ baggage }: { baggage: BaggageInfo | string }) => {
    // ─── Old String Format (Backward Compatible) ───
    if (typeof baggage === 'string') {
        return (
            <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Luggage className="w-3.5 h-3.5 text-slate-400" />
                    Baggage
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Luggage className="w-4 h-4 text-slate-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{baggage}</span>
                </div>
            </div>
        );
    }

    // ─── No Data ───
    if (!baggage || !baggage.details || baggage.details.length === 0) {
        return (
            <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Luggage className="w-3.5 h-3.5 text-slate-400" />
                    Baggage
                </h4>
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-center">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-amber-700">No Baggage Info Available</p>
                    <p className="text-[9px] text-amber-500 mt-1">Contact airline for details</p>
                </div>
            </div>
        );
    }

    const includedBags = baggage.details.filter((d) => d.isIncluded);
    const excludedBags = baggage.details.filter((d) => !d.isIncluded);

    const totalWeight        = baggage.totalWeight ?? 0;
    const totalWeightDisplay = baggage.totalWeightDisplay ?? '';

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Luggage className="w-3.5 h-3.5 text-slate-400" />
                    Baggage Allowance
                </h4>
                {totalWeight > 0 && (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {totalWeightDisplay}
                    </span>
                )}
            </div>

            {/* Included Bags */}
            <div className="space-y-2">
                {includedBags.map((bag, i) => {
                    const colors         = getBagColorScheme(bag.type, true);
                    const bagTotalWeight = bag.totalWeight ?? 0;
                    const bagWeightUnit  = bag.weightUnit ?? 'kg';
                    const bagIsApprox    = bag.isApprox ?? false;

                    return (
                        <div
                            key={`${bag.type}-${i}`}
                            className={`${colors.bg} ${colors.border} border rounded-2xl p-3.5 flex items-center justify-between transition-colors duration-200`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl ${colors.iconBg} ${colors.iconColor} flex items-center justify-center`}>
                                    {getBagIcon(bag.type)}
                                </div>
                                <div>
                                    <p className={`text-xs uppercase font-bold ${colors.textColor}`}>
                                        {bag.label}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-semibold text-slate-500">
                                            Quantity: {bag.quantity}
                                        </span>
                                        {bagTotalWeight > 0 && (
                                            <>
                                                <span className="w-1 h-1 bg-slate-400 rounded-full" />
                                                <span className={`text-[10px] font-bold ${colors.weightColor}`}>
                                                    {bagTotalWeight}{bagWeightUnit}
                                                    {bagIsApprox && (
                                                        <span className="text-[8px] text-slate-500 ml-0.5">~approx</span>
                                                    )}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Excluded Bags */}
            {excludedBags.length > 0 && (
                <div className="space-y-2">
                    {excludedBags.map((bag, i) => {
                        const colors = getBagColorScheme(bag.type, false);
                        return (
                            <div
                                key={`exc-${bag.type}-${i}`}
                                className={`${colors.bg} ${colors.border} border rounded-2xl p-3 flex items-center justify-between opacity-60`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${colors.iconBg} ${colors.iconColor} flex items-center justify-center`}>
                                        {getBagIcon(bag.type)}
                                    </div>
                                    <p className={`text-[11px] font-semibold ${colors.textColor}`}>
                                        {bag.label}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-semibold text-gray-400">Not included</span>
                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                        <X className="w-3 h-3 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* No Bags At All */}
            {includedBags.length === 0 && excludedBags.length === 0 && (
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3.5 text-center">
                    <p className="text-[10px] font-bold text-amber-700 flex items-center justify-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        No baggage included — purchase separately
                    </p>
                </div>
            )}
        </div>
    );
};

// ------------------------------------------------------------------
// 🚀 MAIN COMPONENT
// ------------------------------------------------------------------
export const BookingSummary = ({ passengers, flight }: BookingSummaryProps) => {
    // 🦴 SKELETON
    if (!flight)
        return (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-2xl shadow-gray-100/50 h-auto animate-pulse sticky top-24">
                <div className="h-32 bg-slate-100 rounded-2xl mb-6" />
                <div className="space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="h-8 bg-slate-100 rounded w-full" />
                </div>
            </div>
        );

    if (!flight.itinerary || flight.itinerary.length === 0) return null;

    const totalPassengers =
        (passengers.adults || 0) + (passengers.children || 0) + (passengers.infants || 0);

    const firstSlice = flight.itinerary[0];

    // ✅ FIXED — safely resolve departure from first slice
    const firstDeparture = getSliceDeparture(firstSlice);

    // ✅ FIXED — Safe refund / change detection
    const isRefundable =
        flight.fareRules?.isRefundable ?? flight.conditions?.refundable ?? false;
    const isChangeable = flight.conditions?.changeable ?? false;
    const refundText =
        flight.refundPolicy || (isRefundable ? 'Refundable' : 'Non-refundable');

    return (
        <div className="sticky top-24 space-y-6">
            {/* 🟢 MAIN CARD */}
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden relative shadow-2xl shadow-slate-200/50">
                {/* Header Graphic */}
                <div className="absolute top-0 left-0 w-full h-28 bg-slate-900 overflow-hidden">
                    <div className="absolute -right-4 -top-10 w-32 h-32 bg-rose-500/30 rounded-full blur-3xl" />
                    <div className="absolute left-10 top-5 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative pt-6 px-6 pb-6">
                    {/* Header Info */}
                    <div className="flex justify-between items-start mb-6 text-white relative z-10">
                        <div>
                            <h3 className="text-lg font-black tracking-tight">Trip Summary</h3>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                                    <Users className="w-3 h-3 text-rose-400" />
                                    <span className="text-xs font-bold text-slate-100">
                                        {totalPassengers} Traveler{totalPassengers !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                                    <Calendar className="w-3 h-3 text-blue-400" />
                                    <span className="text-xs font-bold text-slate-100">
                                        {/* ✅ FIXED — null-safe date format */}
                                        {safeDateFormat(firstDeparture?.time, 'dd MMM')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-white text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-lg">
                            {flight.cabinClass ?? 'Economy'}
                        </div>
                    </div>

                    {/* 🛫 FLIGHT SEGMENTS */}
                    <div className="space-y-3 mb-8">
                        {flight.itinerary.map((leg, index) => {
                            // ✅ FIXED — use helper functions for safe access
                            const dep     = getSliceDeparture(leg);
                            const arr     = getSliceArrival(leg);
                            const airline = getSliceAirline(leg);
                            const logo    = getSliceLogo(leg);

                            return (
                                <div
                                    key={leg.id ?? index}
                                    className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-gray-100 p-4 relative overflow-hidden group hover:border-slate-200 transition-colors"
                                >
                                    <div
                                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                            index === 0 ? 'bg-rose-500' : 'bg-blue-500'
                                        }`}
                                    />

                                    <div className="flex justify-between items-center mb-3 pl-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {leg.direction}
                                        </span>
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                            {logo && (
                                                <img
                                                    src={logo}
                                                    alt={airline}
                                                    className="w-4 h-4 object-contain"
                                                />
                                            )}
                                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]">
                                                {airline || 'Airline'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pl-2">
                                        <div className="text-left">
                                            <p className="text-xl font-black text-slate-800 leading-none">
                                                {dep?.code ?? '---'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1 font-medium">
                                                {safeDateFormat(dep?.time, 'hh:mm a')}
                                            </p>
                                        </div>

                                        <div className="flex-1 px-4 flex flex-col items-center">
                                            <div className="flex items-center gap-1 w-full opacity-20 group-hover:opacity-40 transition-opacity">
                                                <div className="h-[2px] w-full bg-slate-900 rounded-full" />
                                                <Plane className="w-3.5 h-3.5 text-slate-900 rotate-90 shrink-0" />
                                                <div className="h-[2px] w-full bg-slate-900 rounded-full" />
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1.5 bg-slate-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                {formatDuration(leg.totalDuration)}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xl font-black text-slate-800 leading-none">
                                                {arr?.code ?? '---'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1 font-medium">
                                                {safeDateFormat(arr?.time, 'hh:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 🧳 BAGGAGE */}
                    <div className="mb-6">
                        <BaggageSection baggage={flight.baggage} />
                    </div>

                    {/* 🛡️ REFUND & CHANGE POLICY */}
                    <div className="mb-6 space-y-2">
                        {/* Refund */}
                        <div
                            className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                                isRefundable
                                    ? 'bg-emerald-50/60 border-emerald-100'
                                    : 'bg-rose-50/60 border-rose-100'
                            }`}
                        >
                            <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    isRefundable
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-rose-100 text-rose-500'
                                }`}
                            >
                                {isRefundable ? (
                                    <ShieldCheck className="w-4 h-4" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4" />
                                )}
                            </div>
                            <div>
                                <p
                                    className={`text-xs font-bold ${
                                        isRefundable ? 'text-emerald-700' : 'text-rose-700'
                                    }`}
                                >
                                    {refundText}
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    {isRefundable
                                        ? 'Cancel for full or partial refund'
                                        : 'No refund on cancellation'}
                                </p>
                            </div>
                        </div>

                        {/* Changeable */}
                        <div
                            className={`p-3 rounded-2xl border flex items-center gap-3 ${
                                isChangeable
                                    ? 'bg-blue-50/60 border-blue-100'
                                    : 'bg-gray-50 border-gray-100'
                            }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isChangeable
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                            >
                                <RefreshCcw className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <p
                                    className={`text-[11px] font-bold ${
                                        isChangeable ? 'text-blue-700' : 'text-gray-500'
                                    }`}
                                >
                                    {isChangeable ? 'Changes Allowed' : 'No Changes Allowed'}
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    {isChangeable
                                        ? 'Date/route changes may incur fees'
                                        : 'Flight cannot be changed after booking'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 📜 FARE RULES (if available) */}
                    {flight.fareRules && (
                        <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/80 mb-6">
                            <h4 className="text-[11px] font-extrabold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <Info className="w-3.5 h-3.5 text-blue-500" /> Fare Rules
                            </h4>
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                                        <RefreshCcw className="w-3 h-3 text-slate-400" />
                                        Change Penalty
                                    </span>
                                    <span
                                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                            flight.fareRules.change === 'Not Allowed'
                                                ? 'text-rose-700 bg-rose-50 border-rose-100'
                                                : flight.fareRules.change.includes('Free')
                                                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                                : 'text-slate-700 bg-white border-blue-100'
                                        }`}
                                    >
                                        {flight.fareRules.change}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                                        <X className="w-3 h-3 text-slate-400" />
                                        Cancel Penalty
                                    </span>
                                    <span
                                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                            flight.fareRules.refund === 'Not Allowed'
                                                ? 'text-rose-700 bg-rose-50 border-rose-100'
                                                : flight.fareRules.refund.includes('Free')
                                                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                                : 'text-slate-700 bg-white border-blue-100'
                                        }`}
                                    >
                                        {flight.fareRules.refund}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 💰 PRICE BREAKDOWN */}
                    <div className="border-t-2 border-dashed border-slate-100 pt-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Ticket className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">
                                {getPassengerText(passengers)}
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>Base Fare</span>
                                <span className="text-slate-700 font-semibold">
                                    {formatCurrency(flight.price?.basePrice, flight.price?.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>Taxes &amp; Fees</span>
                                <span className="text-slate-700 font-semibold">
                                    {formatCurrency(flight.price?.markup, flight.price?.currency)}
                                </span>
                            </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Total Payable
                                </p>
                                <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                                    Included all taxes
                                </p>
                            </div>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">
                                {formatCurrency(flight.price?.finalPrice, flight.price?.currency)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔒 SECURITY FOOTER */}
            <div className="flex justify-center items-center gap-2 text-[10px] font-medium text-slate-400">
                <Lock className="w-3 h-3" />
                <span>Payments are encrypted and secure</span>
            </div>
        </div>
    );
};