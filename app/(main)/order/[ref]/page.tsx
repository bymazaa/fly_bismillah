// app/booking/[ref]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import {
    Plane, CheckCircle, Clock, AlertCircle, Loader2, Copy, Check,
    Mail, Phone, CreditCard, Users, ShieldCheck, Download, Printer,
    ArrowLeft, Timer, Ban, RefreshCcw, Hourglass, ArrowRight,
    Globe, Calendar, MapPin, Ticket, XCircle, AlertTriangle,
    ExternalLink, MessageCircle, ChevronRight, Shield, User,
    Luggage, Info,
} from 'lucide-react';
import { websiteDetails } from '@/constant/data';

// ================================================================
// TYPES
// ================================================================

interface BookingData {
    id:                string;
    bookingReference:  string;
    duffelOrderId:     string | null;
    pnr:               string | null;
    status:            'processing' | 'held' | 'issued' | 'cancelled' | 'failed' | 'expired';
    paymentStatus:     string;
    isLiveMode:        boolean;
    paymentDeadline:   string | null;
    priceExpiry:       string | null;
    createdAt:         string;
    updatedAt:         string;
    contact:           { email: string; phone: string };
    passengers:        PassengerData[];
    flightDetails:     FlightDetails;
    pricing:           PricingData;
    paymentInfo:       { cardName: string | null; expiryDate: string | null; billingAddress: any };
    documents:         DocumentData[];
    airlineInitiatedChanges: any;
}

interface PassengerData {
    id:              string | null;
    type:            string;
    title:           string;
    firstName:       string;
    lastName:        string;
    gender:          string;
    dob:             string;
    passportNumber:  string | null;
    passportExpiry:  string | null;
    passportCountry: string | null;
}

interface FlightDetails {
    airline:       string | null;
    flightNumber:  string | null;
    route:         string;
    departureDate: string;
    arrivalDate:   string;
    duration:      string;
    logoUrl:       string | null;
    flightType:    string;
    segments:      SegmentData[];
}

interface SegmentData {
    segmentId:    string;
    carrier:      string;
    flightNumber: string;
    origin:       string;
    destination:  string;
    departureAt:  string;
    arrivingAt:   string;
    duration:     string;
    cabin:        string;
}

interface PricingData {
    currency:     string;
    total_amount: number;
    markup:       number;
    base_amount:  number;
}

interface DocumentData {
    unique_identifier: string | null;
    docType:           string | null;
    url:               string | null;
}

// ================================================================
// HELPERS
// ================================================================

const safeFormat = (iso: string | null, fmt: string) => {
    if (!iso) return '--';
    try { return format(parseISO(iso), fmt); }
    catch { return '--'; }
};

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency, minimumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

// ================================================================
// STATUS CONFIG
// ================================================================

const STATUS_CONFIG: Record<string, {
    label: string; color: string; bg: string; border: string;
    icon: React.ElementType; bannerBg: string; bannerText: string;
    heading: string; description: string;
}> = {
    held: {
        label: 'Reserved', color: 'text-emerald-700', bg: 'bg-emerald-50',
        border: 'border-emerald-200', icon: CheckCircle,
        bannerBg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        bannerText: 'text-white',
        heading: 'Your Flight is Reserved!',
        description: 'Your booking is confirmed and held. Complete payment before the deadline to secure your tickets.',
    },
    processing: {
        label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-50',
        border: 'border-blue-200', icon: Loader2,
        bannerBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        bannerText: 'text-white',
        heading: 'Processing Your Booking',
        description: 'We\'re confirming your reservation with the airline. This usually takes a few moments.',
    },
    issued: {
        label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50',
        border: 'border-emerald-200', icon: CheckCircle,
        bannerBg: 'bg-gradient-to-r from-emerald-600 to-teal-600',
        bannerText: 'text-white',
        heading: 'Booking Confirmed!',
        description: 'Your tickets have been issued. Check your email for your e-ticket and boarding details.',
    },
    cancelled: {
        label: 'Cancelled', color: 'text-gray-600', bg: 'bg-gray-50',
        border: 'border-gray-200', icon: XCircle,
        bannerBg: 'bg-gradient-to-r from-gray-600 to-gray-700',
        bannerText: 'text-white',
        heading: 'Booking Cancelled',
        description: 'This booking has been cancelled. If you need assistance, please contact our support team.',
    },
    failed: {
        label: 'Failed', color: 'text-red-700', bg: 'bg-red-50',
        border: 'border-red-200', icon: AlertCircle,
        bannerBg: 'bg-gradient-to-r from-red-500 to-red-600',
        bannerText: 'text-white',
        heading: 'Booking Failed',
        description: 'We were unable to complete your booking. Please try again or contact support.',
    },
    expired: {
        label: 'Expired', color: 'text-amber-700', bg: 'bg-amber-50',
        border: 'border-amber-200', icon: Hourglass,
        bannerBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
        bannerText: 'text-white',
        heading: 'Booking Expired',
        description: 'The payment deadline has passed and this reservation was released. Please search for a new flight.',
    },
};

// ================================================================
// COPY BUTTON
// ================================================================

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* fallback: do nothing */ }
    };

    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors text-[10px] font-bold cursor-pointer"
            title={`Copy ${label ?? text}`}
        >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
};

// Variant for dark backgrounds
const CopyButtonDark = ({ text, label }: { text: string; label?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* */ }
    };

    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-[10px] font-bold text-gray-500 cursor-pointer"
            title={`Copy ${label ?? text}`}
        >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
};

// ================================================================
// COUNTDOWN TIMER
// ================================================================

const DeadlineCountdown = ({ deadline }: { deadline: string }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const update = () => {
            const diff = new Date(deadline).getTime() - Date.now();
            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('Expired');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs  = Math.floor((diff % (1000 * 60)) / 1000);

            setIsUrgent(hours === 0 && mins < 30);

            if (hours > 0) {
                setTimeLeft(`${hours}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
            } else {
                setTimeLeft(`${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    if (isExpired) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <Ban className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-red-800">Payment Deadline Passed</p>
                        <p className="text-xs text-red-500 mt-0.5">This reservation may have been released by the airline.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-2xl p-5 border transition-all duration-300 ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <Timer className={`w-5 h-5 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-amber-600'}`} />
                    </div>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isUrgent ? 'text-red-400' : 'text-amber-500'}`}>
                            {isUrgent ? '⚠ Complete Payment Soon' : 'Payment Deadline'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {safeFormat(deadline, "dd MMM yyyy 'at' hh:mm a")}
                        </p>
                    </div>
                </div>
                <div className={`text-right px-4 py-2 rounded-xl ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <p className={`text-lg font-mono font-black tabular-nums ${isUrgent ? 'text-red-600' : 'text-amber-700'}`}>
                        {timeLeft}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isUrgent ? 'text-red-400' : 'text-amber-500'}`}>
                        Remaining
                    </p>
                </div>
            </div>
        </div>
    );
};

// ================================================================
// FLIGHT SEGMENT
// ================================================================

const FlightSegment = ({ segment, index, total }: { segment: SegmentData; index: number; total: number }) => (
    <div className="relative">
        {/* Segment header */}
        <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-bold text-white bg-gray-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
                Flight {index + 1}{total > 1 ? ` of ${total}` : ''}
            </span>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {segment.flightNumber}
            </span>
            <span className="text-[10px] text-gray-400 capitalize">{segment.cabin}</span>
        </div>

        {/* Timeline */}
        <div className="flex gap-3.5">
            <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="w-3 h-3 rounded-full border-2 border-gray-800 bg-white" />
                <div className="w-px flex-1 bg-gray-200 my-1 min-h-[40px]" />
                <div className="w-3 h-3 rounded-full border-2 border-gray-400 bg-white" />
            </div>

            <div className="flex-1 pb-2">
                {/* Departure */}
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-black text-gray-900">
                            {safeFormat(segment.departureAt, 'hh:mm a')}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {segment.origin}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {safeFormat(segment.departureAt, 'EEE, dd MMM yyyy')}
                    </p>
                </div>

                {/* Duration bar */}
                <div className="my-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-700">{segment.duration}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">{segment.carrier}</span>
                </div>

                {/* Arrival */}
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-black text-gray-900">
                            {safeFormat(segment.arrivingAt, 'hh:mm a')}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {segment.destination}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {safeFormat(segment.arrivingAt, 'EEE, dd MMM yyyy')}
                    </p>
                </div>
            </div>
        </div>

        {/* Connector to next segment */}
        {index < total - 1 && (
            <div className="my-4 ml-5 pl-4 border-l-2 border-dashed border-amber-300">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-700">
                    <Clock className="w-3 h-3" />
                    <span className="text-[11px] font-semibold">Layover</span>
                </div>
            </div>
        )}
    </div>
);

// ================================================================
// PASSENGER CARD
// ================================================================

const PassengerCard = ({ passenger, index }: { passenger: PassengerData; index: number }) => {
    const typeLabel =
        passenger.type === 'adult' ? 'Adult' :
        passenger.type === 'child' ? 'Child' :
        passenger.type === 'infant_without_seat' || passenger.type === 'infant' ? 'Infant' : 'Passenger';

    const typeBg =
        passenger.type === 'adult' ? 'bg-blue-50 text-blue-700 border-blue-100' :
        passenger.type === 'child' ? 'bg-purple-50 text-purple-700 border-purple-100' :
        'bg-pink-50 text-pink-700 border-pink-100';

    return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">
                            {passenger.title ? `${passenger.title.toUpperCase()}. ` : ''}
                            {passenger.firstName} {passenger.lastName}
                        </p>
                        <p className="text-[10px] text-gray-400">Passenger {index + 1}</p>
                    </div>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${typeBg}`}>
                    {typeLabel}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div>
                    <p className="text-gray-400 font-semibold mb-0.5">Gender</p>
                    <p className="text-gray-700 font-bold capitalize">{passenger.gender ?? '--'}</p>
                </div>
                <div>
                    <p className="text-gray-400 font-semibold mb-0.5">Date of Birth</p>
                    <p className="text-gray-700 font-bold">{safeFormat(passenger.dob, 'dd MMM yyyy')}</p>
                </div>
                {passenger.passportNumber && (
                    <div>
                        <p className="text-gray-400 font-semibold mb-0.5">Passport</p>
                        <p className="text-gray-700 font-bold font-mono">{passenger.passportNumber}</p>
                    </div>
                )}
                {passenger.passportExpiry && (
                    <div>
                        <p className="text-gray-400 font-semibold mb-0.5">Passport Expiry</p>
                        <p className="text-gray-700 font-bold">{safeFormat(passenger.passportExpiry, 'dd MMM yyyy')}</p>
                    </div>
                )}
                {passenger.passportCountry && (
                    <div>
                        <p className="text-gray-400 font-semibold mb-0.5">Nationality</p>
                        <p className="text-gray-700 font-bold">{passenger.passportCountry}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ================================================================
// SECTION CARD (reusable)
// ================================================================

const SectionCard = ({
    icon: Icon, iconColor = 'text-rose-500', iconBg = 'bg-rose-50',
    title, subtitle, badge, children,
}: {
    icon: React.ElementType; iconColor?: string; iconBg?: string;
    title: string; subtitle?: string; badge?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {badge}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

// ================================================================
// LOADING STATE
// ================================================================

const LoadingState = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-gray-400" />
                </div>
            </div>
            <p className="text-sm font-bold text-gray-600">Loading booking details...</p>
            <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
        </div>
    </div>
);

// ================================================================
// ERROR STATE
// ================================================================

const ErrorState = ({ message, onBack }: { message: string; onBack: () => void }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors cursor-pointer"
            >
                Go to Homepage
            </button>
        </div>
    </div>
);

// ================================================================
// NEXT STEPS COMPONENT
// ================================================================

const NextSteps = ({ status }: { status: string }) => {
    const steps: { icon: React.ElementType; title: string; desc: string }[] =
        status === 'held' ? [
            { icon: CreditCard, title: 'Complete Payment', desc: 'Contact our team to finalize payment before the deadline.' },
            { icon: Mail,       title: 'Receive E-Ticket', desc: 'Once paid, your e-ticket will be sent to your email.' },
            { icon: Plane,      title: 'Travel!',          desc: 'Show your e-ticket and ID at the airport check-in counter.' },
        ] : status === 'issued' ? [
            { icon: Mail,     title: 'Check Your Email', desc: 'Your e-ticket and itinerary have been sent to your email.' },
            { icon: Luggage,  title: 'Prepare to Travel', desc: 'Pack your bags and arrive at the airport 3 hours before departure.' },
            { icon: Plane,    title: 'Bon Voyage!',       desc: 'Show your e-ticket and passport at the check-in counter.' },
        ] : status === 'failed' || status === 'expired' ? [
            { icon: RefreshCcw, title: 'Search Again',     desc: 'Find the latest available flights at the best prices.' },
            { icon: Phone,      title: 'Contact Support',  desc: 'Our team is here to help you rebook your flight.' },
        ] : [];

    if (steps.length === 0) return null;

    return (
        <SectionCard icon={Info} iconColor="text-indigo-500" iconBg="bg-indigo-50" title="What Happens Next?" subtitle="Follow these steps">
            <div className="space-y-4">
                {steps.map((step, i) => (
                    <div key={i} className="flex gap-3.5">
                        <div className="flex flex-col items-center shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                                <step.icon className="w-4 h-4" />
                            </div>
                            {i < steps.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                        </div>
                        <div className="pb-4">
                            <p className="text-sm font-bold text-gray-900">{step.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
};

// ================================================================
// MAIN PAGE COMPONENT
// ================================================================

export default function BookingConfirmationPage() {
    const params  = useParams();
    const router  = useRouter();
    const ref     = (params?.ref as string) ?? '';

    const [booking, setBooking]     = useState<BookingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError]         = useState('');

    // ── Fetch Booking ──
    useEffect(() => {
        if (!ref) {
            setError('No booking reference provided.');
            setIsLoading(false);
            return;
        }

        const fetchBooking = async () => {
            try {
                const res = await axios.get(`/api/flights/order/${encodeURIComponent(ref)}`);
                if (res.data.success) {
                    setBooking(res.data.booking);
                } else {
                    setError(res.data.error ?? 'Booking not found.');
                }
            } catch (err: any) {
                const msg = axios.isAxiosError(err)
                    ? err.response?.data?.error ?? 'Failed to load booking.'
                    : 'An unexpected error occurred.';
                setError(msg);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooking();
    }, [ref]);

    // ── Set page title ──
    useEffect(() => {
        if (booking) {
            document.title = `Booking ${booking.bookingReference} | ${booking.status === 'held' ? 'Reserved' : booking.status === 'issued' ? 'Confirmed' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`;
        }
    }, [booking]);

    // ── WhatsApp Support ──
    const handleWhatsApp = () => {
        const msg = booking
            ? `Hello, I need help with my booking.\n\nReference: ${booking.bookingReference}\nPNR: ${booking.pnr ?? 'N/A'}\nRoute: ${booking.flightDetails?.route ?? 'N/A'}`
            : `Hello, I need help with booking reference: ${ref}`;
        window.open(`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    // ── Print ──
    const handlePrint = () => window.print();

    // ── Derived values ──
    const statusConfig = STATUS_CONFIG[booking?.status ?? 'processing'] ?? STATUS_CONFIG.processing;
    const StatusIcon   = statusConfig.icon;

    const passengerCounts = useMemo(() => {
        if (!booking) return { adults: 0, children: 0, infants: 0 };
        const pax = booking.passengers ?? [];
        return {
            adults:   pax.filter(p => p.type === 'adult').length,
            children: pax.filter(p => p.type === 'child').length,
            infants:  pax.filter(p => p.type === 'infant_without_seat' || p.type === 'infant').length,
        };
    }, [booking]);

    const paxSummary = [
        passengerCounts.adults   > 0 ? `${passengerCounts.adults} Adult${passengerCounts.adults > 1 ? 's' : ''}` : '',
        passengerCounts.children > 0 ? `${passengerCounts.children} Child${passengerCounts.children > 1 ? 'ren' : ''}` : '',
        passengerCounts.infants  > 0 ? `${passengerCounts.infants} Infant${passengerCounts.infants > 1 ? 's' : ''}` : '',
    ].filter(Boolean).join(', ');

    // ── Loading / Error ──
    if (isLoading) return <LoadingState />;
    if (error || !booking) return <ErrorState message={error || 'Booking not found.'} onBack={() => router.push('/')} />;

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white">
            {/* ══════════════════════════════════════════════════════
                STATUS BANNER
            ══════════════════════════════════════════════════════ */}
            <div className={`${statusConfig.bannerBg} ${statusConfig.bannerText}`}>
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                                <StatusIcon className={`w-7 h-7 ${booking.status === 'processing' ? 'animate-spin' : ''}`} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                                    {statusConfig.heading}
                                </h1>
                                <p className="text-sm opacity-90 mt-1.5 max-w-lg">
                                    {statusConfig.description}
                                </p>
                            </div>
                        </div>

                        {/* Quick Reference */}
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 min-w-[220px] border border-white/20">
                            <div className="mb-3">
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Booking Reference</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xl font-black font-mono tracking-wider">{booking.bookingReference}</p>
                                    <CopyButton text={booking.bookingReference} label="reference" />
                                </div>
                            </div>
                            {booking.pnr && (
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Airline PNR</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-lg font-black font-mono tracking-wider">{booking.pnr}</p>
                                        <CopyButton text={booking.pnr} label="PNR" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                MAIN CONTENT
            ══════════════════════════════════════════════════════ */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* ── LEFT COLUMN (2/3) ── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Payment Deadline */}
                        {booking.status === 'held' && booking.paymentDeadline && (
                            <DeadlineCountdown deadline={booking.paymentDeadline} />
                        )}

                        {/* Flight Details */}
                        <SectionCard
                            icon={Plane}
                            title="Flight Details"
                            subtitle={booking.flightDetails?.route ?? ''}
                            badge={
                                <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-gray-100">
                                    {booking.flightDetails?.flightType?.replace('_', ' ') ?? 'One Way'}
                                </span>
                            }
                        >
                            {booking.flightDetails?.logoUrl && (
                                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                                    <img
                                        src={booking.flightDetails.logoUrl}
                                        alt={booking.flightDetails.airline ?? ''}
                                        className="w-8 h-8 object-contain"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{booking.flightDetails.airline}</p>
                                        <p className="text-[10px] text-gray-400">
                                            Total duration: {booking.flightDetails.duration}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {(booking.flightDetails?.segments ?? []).map((seg, idx) => (
                                    <FlightSegment
                                        key={seg.segmentId ?? idx}
                                        segment={seg}
                                        index={idx}
                                        total={booking.flightDetails?.segments?.length ?? 0}
                                    />
                                ))}
                            </div>
                        </SectionCard>

                        {/* Passengers */}
                        <SectionCard
                            icon={Users}
                            iconColor="text-violet-500"
                            iconBg="bg-violet-50"
                            title="Passengers"
                            subtitle={paxSummary}
                        >
                            <div className="space-y-3">
                                {booking.passengers.map((pax, idx) => (
                                    <PassengerCard key={pax.id ?? idx} passenger={pax} index={idx} />
                                ))}
                            </div>
                        </SectionCard>

                        {/* Documents (if issued) */}
                        {booking.documents.length > 0 && (
                            <SectionCard
                                icon={Download}
                                iconColor="text-emerald-500"
                                iconBg="bg-emerald-50"
                                title="Travel Documents"
                                subtitle="Your e-tickets and receipts"
                            >
                                <div className="space-y-2.5">
                                    {booking.documents.map((doc, idx) => (
                                        <a
                                            key={idx}
                                            href={doc.url ?? '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                    <Ticket className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {doc.docType === 'electronic_ticket' ? 'E-Ticket' : doc.docType ?? 'Document'}
                                                    </p>
                                                    {doc.unique_identifier && (
                                                        <p className="text-[10px] text-gray-400 font-mono">{doc.unique_identifier}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                                        </a>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {/* Airline Changes Warning */}
                        {booking.airlineInitiatedChanges && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-800">Schedule Change Notice</p>
                                        <p className="text-xs text-amber-600 mt-1">
                                            The airline has made changes to your flight schedule. Please review your updated itinerary above.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Next Steps */}
                        <NextSteps status={booking.status} />
                    </div>

                    {/* ── RIGHT COLUMN (1/3) ── */}
                    <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-8 h-fit">

                        {/* Status Card */}
                        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                        {statusConfig.label}
                                    </span>
                                </div>

                                {/* Quick info grid */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-400 font-semibold">Reference</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-gray-700 font-mono">{booking.bookingReference}</span>
                                            <CopyButtonDark text={booking.bookingReference} />
                                        </div>
                                    </div>
                                    {booking.pnr && (
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-gray-400 font-semibold">PNR</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-gray-700 font-mono">{booking.pnr}</span>
                                                <CopyButtonDark text={booking.pnr} />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-400 font-semibold">Booked On</span>
                                        <span className="font-bold text-gray-700">
                                            {safeFormat(booking.createdAt, 'dd MMM yyyy, hh:mm a')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-400 font-semibold">Passengers</span>
                                        <span className="font-bold text-gray-700">{booking.passengers.length}</span>
                                    </div>
                                    {booking.paymentDeadline && booking.status === 'held' && (
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-gray-400 font-semibold">Pay Before</span>
                                            <span className="font-bold text-amber-600">
                                                {safeFormat(booking.paymentDeadline, 'dd MMM, hh:mm a')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="p-5 border-b border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Price Breakdown</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">Base Fare + Taxes</span>
                                        <span className="font-semibold text-gray-700">
                                            {formatCurrency(booking.pricing.base_amount, booking.pricing.currency)}
                                        </span>
                                    </div>
                                    {booking.pricing.markup > 0 && (
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-gray-500">Service Fee</span>
                                            <span className="font-semibold text-gray-700">
                                                {formatCurrency(booking.pricing.markup, booking.pricing.currency)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between">
                                        <span className="text-sm font-bold text-gray-900">Total</span>
                                        <span className="text-lg font-black text-gray-900">
                                            {formatCurrency(booking.pricing.total_amount, booking.pricing.currency)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="p-5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Details</p>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2.5 text-[11px]">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-gray-700 font-semibold">{booking.contact.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[11px]">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-gray-700 font-semibold">{booking.contact.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5 print:hidden">
                            <button
                                onClick={handlePrint}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <Printer className="w-4 h-4" />
                                Print Booking
                            </button>

                            <button
                                onClick={handleWhatsApp}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 font-bold text-sm text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Contact via WhatsApp
                            </button>

                            {(booking.status === 'failed' || booking.status === 'expired') && (
                                <button
                                    onClick={() => router.push('/flights/search')}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 font-bold text-sm text-white hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                    Search New Flight
                                </button>
                            )}
                        </div>

                        {/* Support Card */}
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 print:hidden">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Need Help?</p>
                            <p className="text-[11px] text-gray-500 mb-4">
                                Our support team is available 24/7 to assist you with your booking.
                            </p>
                            <div className="space-y-2">
                                <a
                                    href={`mailto:${websiteDetails.email}`}
                                    className="flex items-center gap-2 text-[11px] text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    {websiteDetails.email}
                                </a>
                                <a
                                    href={`tel:${websiteDetails.phone}`}
                                    className="flex items-center gap-2 text-[11px] text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    {websiteDetails.phone}
                                </a>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex items-center justify-center gap-4 py-2 print:hidden">
                            {[
                                { icon: Shield, label: 'SSL Secure' },
                                { icon: Globe,  label: 'IATA' },
                                { icon: ShieldCheck, label: 'Verified' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <item.icon className="w-3 h-3 text-gray-300" />
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="mt-10 text-center print:hidden">
                    <button
                        onClick={() => router.push('/')}
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Homepage
                    </button>
                </div>
            </div>

            {/* ── Test Mode Banner ── */}
            {!booking.isLiveMode && (
                <div className="fixed bottom-0 left-0 right-0 bg-amber-400 text-amber-900 text-center py-2 text-xs font-bold z-50 print:hidden">
                    ⚠ TEST MODE — This is not a real booking
                </div>
            )}
        </div>
    );
}