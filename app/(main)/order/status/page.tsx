// app/booking/status/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import {
    Search, Mail, Ticket, AlertCircle, Loader2, CheckCircle,
    Clock, Plane, Users, CreditCard, ArrowLeft, Timer,
    Ban, Hourglass, XCircle, Shield, Phone, Copy, Check,
    ArrowRight, Calendar, User, Download, ExternalLink,
    MessageCircle, RefreshCcw, Info, ShieldCheck, Globe, Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { websiteDetails } from '@/constant/data';

// ================================================================
// TYPES
// ================================================================

interface BookingData {
    id:                string;
    bookingReference:  string;
    pnr:               string | null;
    status:            string;
    paymentStatus:     string;
    isLiveMode:        boolean;
    paymentDeadline:   string | null;
    priceExpiry:       string | null;
    createdAt:         string;
    updatedAt:         string;
    contact:           { email: string; phone: string };
    passengers:        any[];
    flightDetails:     any;
    pricing:           { currency: string; total_amount: number; markup: number; base_amount: number };
    paymentInfo:       { cardName: string | null; expiryDate: string | null; billingAddress: any };
    documents:         any[];
    airlineInitiatedChanges: any;
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
    icon: React.ElementType; dotColor: string;
    heading: string; description: string;
}> = {
    held: {
        label: 'Reserved', color: 'text-emerald-700', bg: 'bg-emerald-50',
        border: 'border-emerald-200', icon: CheckCircle, dotColor: 'bg-emerald-500',
        heading: 'Flight Reserved',
        description: 'Your flight is held. Complete payment before the deadline to secure your tickets.',
    },
    processing: {
        label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-50',
        border: 'border-blue-200', icon: Loader2, dotColor: 'bg-blue-500',
        heading: 'Being Processed',
        description: 'Your booking is being confirmed with the airline. This usually takes a few moments.',
    },
    issued: {
        label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50',
        border: 'border-emerald-200', icon: CheckCircle, dotColor: 'bg-emerald-500',
        heading: 'Tickets Issued',
        description: 'Your tickets have been issued successfully. Check your email for the e-ticket.',
    },
    cancelled: {
        label: 'Cancelled', color: 'text-gray-600', bg: 'bg-gray-50',
        border: 'border-gray-200', icon: XCircle, dotColor: 'bg-gray-400',
        heading: 'Booking Cancelled',
        description: 'This booking has been cancelled. Contact support for assistance.',
    },
    failed: {
        label: 'Failed', color: 'text-red-700', bg: 'bg-red-50',
        border: 'border-red-200', icon: AlertCircle, dotColor: 'bg-red-500',
        heading: 'Booking Failed',
        description: 'We were unable to complete your booking. Please try again or contact support.',
    },
    expired: {
        label: 'Expired', color: 'text-amber-700', bg: 'bg-amber-50',
        border: 'border-amber-200', icon: Hourglass, dotColor: 'bg-amber-500',
        heading: 'Booking Expired',
        description: 'The payment deadline passed. Please search for a new flight.',
    },
};

// ================================================================
// COPY BUTTON
// ================================================================

const CopyButton = ({ text }: { text: string }) => {
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
            className="p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            title="Copy"
        >
            {copied
                ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                : <Copy className="w-3.5 h-3.5 text-gray-400" />
            }
        </button>
    );
};

// ================================================================
// DEADLINE COUNTDOWN (inline)
// ================================================================

const InlineCountdown = ({ deadline }: { deadline: string }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [expired, setExpired]   = useState(false);

    useState(() => {
        const update = () => {
            const diff = new Date(deadline).getTime() - Date.now();
            if (diff <= 0) { setExpired(true); setTimeLeft('Expired'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(s).padStart(2, '0')}s`);
        };
        update();
        const i = setInterval(update, 1000);
        return () => clearInterval(i);
    });

    if (expired) return <span className="text-red-600 font-bold">Expired</span>;
    return <span className="font-mono font-black text-amber-600 tabular-nums">{timeLeft}</span>;
};

// ================================================================
// FLIGHT SEGMENT (compact)
// ================================================================

const CompactSegment = ({ seg, idx, total }: { seg: any; idx: number; total: number }) => (
    <div className="flex items-center gap-3 py-3">
        <div className="flex flex-col items-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-800 bg-white" />
            <div className="w-px h-8 bg-gray-200 my-0.5" />
            <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-white" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-sm font-black text-gray-900">
                        {safeFormat(seg.departureAt, 'hh:mm a')}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-1.5">
                        {seg.origin}
                    </span>
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {seg.duration}
                </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
                <div>
                    <span className="text-sm font-black text-gray-900">
                        {safeFormat(seg.arrivingAt, 'hh:mm a')}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-1.5">
                        {seg.destination}
                    </span>
                </div>
                <span className="text-[10px] font-semibold text-gray-500">
                    {seg.flightNumber}
                </span>
            </div>
        </div>
    </div>
);

// ================================================================
// STATUS TIMELINE
// ================================================================

const StatusTimeline = ({ status }: { status: string }) => {
    const steps = [
        { key: 'processing', label: 'Booked' },
        { key: 'held',       label: 'Reserved' },
        { key: 'issued',     label: 'Ticketed' },
    ];

    const order: Record<string, number> = { processing: 0, held: 1, issued: 2, cancelled: -1, failed: -1, expired: -1 };
    const currentIdx = order[status] ?? -1;
    const isFinal    = ['cancelled', 'failed', 'expired'].includes(status);

    return (
        <div className="flex items-center justify-between gap-1">
            {steps.map((step, idx) => {
                const isDone   = currentIdx >= 0 && idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                    <div key={step.key} className="flex items-center gap-1 flex-1">
                        <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                isFinal ? 'bg-gray-100 border-2 border-gray-200' :
                                isDone ? 'bg-emerald-500 text-white' :
                                'bg-gray-100 border-2 border-gray-200'
                            }`}>
                                {isDone && !isFinal
                                    ? <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    : <span className="text-[10px] font-bold text-gray-400">{idx + 1}</span>
                                }
                            </div>
                            <span className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${
                                isCurrent && !isFinal ? 'text-emerald-600' : 'text-gray-400'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-[2px] rounded-full mb-4 ${
                                isDone && idx < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'
                            }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ================================================================
// BOOKING RESULT CARD
// ================================================================

const BookingResult = ({ booking, onReset }: { booking: BookingData; onReset: () => void }) => {
    const router = useRouter();
    const config = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.processing;
    const StatusIcon = config.icon;

    const segments  = booking.flightDetails?.segments ?? [];
    const firstSeg  = segments[0];
    const lastSeg   = segments[segments.length - 1];

    const paxCounts = useMemo(() => {
        const pax = booking.passengers ?? [];
        return {
            adults:   pax.filter((p: any) => p.type === 'adult').length,
            children: pax.filter((p: any) => p.type === 'child').length,
            infants:  pax.filter((p: any) => p.type === 'infant_without_seat' || p.type === 'infant').length,
        };
    }, [booking]);

    const handleWhatsApp = () => {
        const msg = `Hello, I need help with my booking.\n\nReference: ${booking.bookingReference}\nPNR: ${booking.pnr ?? 'N/A'}\nRoute: ${booking.flightDetails?.route ?? 'N/A'}`;
        window.open(`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

            {/* ── Status Banner ── */}
            <div className={`rounded-2xl border ${config.border} ${config.bg} p-5`}>
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg} ${config.color}`}>
                        <StatusIcon className={`w-6 h-6 ${booking.status === 'processing' ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className={`text-lg font-black ${config.color}`}>{config.heading}</h2>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.bg} ${config.color} ${config.border}`}>
                                {config.label}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                    </div>
                </div>

                {/* Timeline */}
                <div className="mt-5 pt-4 border-t border-gray-200/50">
                    <StatusTimeline status={booking.status} />
                </div>
            </div>

            {/* ── Payment Deadline ── */}
            {booking.status === 'held' && booking.paymentDeadline && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Timer className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Payment Deadline</p>
                            <p className="text-xs text-gray-600 mt-0.5">
                                {safeFormat(booking.paymentDeadline, "dd MMM yyyy 'at' hh:mm a")}
                            </p>
                        </div>
                    </div>
                    <div className="bg-amber-100 px-4 py-2 rounded-xl">
                        <InlineCountdown deadline={booking.paymentDeadline} />
                    </div>
                </div>
            )}

            {/* ── References + Route ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-lg shadow-gray-100 overflow-hidden">
                {/* Header: Route */}
                {firstSeg && lastSeg && (
                    <div className="px-5 py-4 bg-gray-900 text-white">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                {booking.flightDetails?.logoUrl && (
                                    <img src={booking.flightDetails.logoUrl} alt="" className="w-8 h-8 object-contain rounded" />
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black">{firstSeg.origin}</span>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                        <span className="text-lg font-black">{lastSeg.destination}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {safeFormat(firstSeg.departureAt, 'EEE, dd MMM yyyy')}
                                        {booking.flightDetails?.airline && ` · ${booking.flightDetails.airline}`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black">
                                    {formatCurrency(booking.pricing.total_amount, booking.pricing.currency)}
                                </p>
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Total Price</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* References */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Booking Ref</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-sm font-black text-gray-900 font-mono">{booking.bookingReference}</span>
                                <CopyButton text={booking.bookingReference} />
                            </div>
                        </div>
                        {booking.pnr && (
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Airline PNR</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-sm font-black text-gray-900 font-mono">{booking.pnr}</span>
                                    <CopyButton text={booking.pnr} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Segments */}
                {segments.length > 0 && (
                    <div className="px-5 py-3 border-b border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Flight Segments</p>
                        <div className="divide-y divide-gray-100">
                            {segments.map((seg: any, idx: number) => (
                                <CompactSegment key={seg.segmentId ?? idx} seg={seg} idx={idx} total={segments.length} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Passengers */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3">Passengers</p>
                    <div className="space-y-2">
                        {booking.passengers.map((pax: any, idx: number) => (
                            <div key={pax.id ?? idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">
                                            {pax.title ? `${pax.title.toUpperCase()}. ` : ''}
                                            {pax.firstName} {pax.lastName}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {pax.type === 'infant_without_seat' || pax.type === 'infant'
                                                ? 'Infant' : pax.type === 'child' ? 'Child' : 'Adult'}
                                            {pax.passportNumber && ` · Passport: ${pax.passportNumber}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact + Booked On */}
                <div className="px-5 py-4">
                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                        <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Email</p>
                            <p className="text-gray-700 font-bold truncate">{booking.contact.email}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Phone</p>
                            <p className="text-gray-700 font-bold">{booking.contact.phone}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Booked On</p>
                            <p className="text-gray-700 font-bold">{safeFormat(booking.createdAt, 'dd MMM yyyy, hh:mm a')}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Payment Status</p>
                            <p className="text-gray-700 font-bold capitalize">{booking.paymentStatus}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Documents ── */}
            {booking.documents.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-lg shadow-gray-100 p-5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Download className="w-3 h-3" />Documents
                    </p>
                    <div className="space-y-2">
                        {booking.documents.map((doc: any, idx: number) => (
                            <a
                                key={idx}
                                href={doc.url ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Ticket className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs font-bold text-gray-900">
                                        {doc.docType === 'electronic_ticket' ? 'E-Ticket' : doc.docType ?? 'Document'}
                                    </span>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Actions ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    onClick={() => router.push(`/order/${booking.bookingReference}`)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors cursor-pointer"
                >
                    <Info className="w-4 h-4" />
                    View Full Details
                </button>
                <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors cursor-pointer"
                >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Support
                </button>
            </div>

            {/* ── Search Another ── */}
            <div className="text-center pt-2">
                <button
                    onClick={onReset}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                    <Search className="w-3.5 h-3.5" />
                    Check Another Booking
                </button>
            </div>

            {/* ── Test Mode ── */}
            {!booking.isLiveMode && (
                <div className="bg-amber-100 border border-amber-300 rounded-xl p-3 text-center">
                    <span className="text-xs font-bold text-amber-800">⚠ TEST MODE — This is not a real booking</span>
                </div>
            )}
        </div>
    );
};

// ================================================================
// MAIN PAGE
// ================================================================

export default function BookingStatusPage() {
    const router = useRouter();

    const [email, setEmail]           = useState('');
    const [identifier, setIdentifier] = useState('');
    const [isLoading, setIsLoading]   = useState(false);
    const [error, setError]           = useState('');
    const [booking, setBooking]       = useState<BookingData | null>(null);

    const canSubmit = email.trim().length > 0 && identifier.trim().length >= 4;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || isLoading) return;

        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post('/api/flights/order/status', {
                email:      email.trim(),
                identifier: identifier.trim(),
            });

            if (res.data.success) {
                setBooking(res.data.booking);
                toast.success('Booking found!');
            } else {
                setError(res.data.error ?? 'Booking not found.');
            }
        } catch (err: any) {
            const msg = axios.isAxiosError(err)
                ? err.response?.data?.error ?? 'Something went wrong. Please try again.'
                : 'An unexpected error occurred.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setBooking(null);
        setError('');
        setEmail('');
        setIdentifier('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-2xl mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between h-14">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:block font-semibold">Home</span>
                        </button>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                            <Shield className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500 tracking-wide">Secure Lookup</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-8 py-10">

                {/* ── No booking found yet — show search form ── */}
                {!booking ? (
                    <div className="space-y-8">

                        {/* Title */}
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-900 flex items-center justify-center">
                                <Search className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                Check Booking Status
                            </h1>
                            <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                                Enter your email and PNR or booking reference to view your flight booking status.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-100 p-6 space-y-4">

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Mail className="w-3 h-3" />Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter the email used during booking"
                                        autoComplete="email"
                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none transition-all duration-200 placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 focus:bg-white"
                                    />
                                </div>

                                {/* PNR / Reference */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Ticket className="w-3 h-3" />PNR or Booking Reference
                                    </label>
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                                        placeholder="e.g. ABC123 or FB-250101-1234"
                                        autoComplete="off"
                                        spellCheck={false}
                                        maxLength={20}
                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium font-mono outline-none transition-all duration-200 placeholder:text-gray-300 placeholder:font-sans focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 focus:bg-white uppercase tracking-wider"
                                    />
                                    <p className="text-[10px] text-gray-400">
                                        Find your PNR or booking reference in the confirmation email.
                                    </p>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!canSubmit || isLoading}
                                className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-gray-900/15 active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />Searching...</>
                                ) : (
                                    <><Search className="w-4 h-4" />Find My Booking</>
                                )}
                            </button>
                        </form>

                        {/* Help */}
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Where to Find Your Details</p>
                            <div className="space-y-3">
                                {[
                                    { icon: Mail,     title: 'Confirmation Email',   desc: 'Check the email sent after booking for your reference and PNR.' },
                                    { icon: Ticket,   title: 'PNR (6 characters)',    desc: 'The airline confirmation code, e.g. "XYZABC".' },
                                    { icon: Calendar, title: 'Booking Reference',     desc: 'Our internal reference, e.g. "FB-250101-1234".' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                            <item.icon className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{item.title}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Support */}
                        <div className="text-center space-y-3">
                            <p className="text-xs text-gray-400">Can&apos;t find your booking?</p>
                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                <a
                                    href={`mailto:${websiteDetails.email}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors"
                                >
                                    <Mail className="w-3.5 h-3.5" />Email Support
                                </a>
                                <a
                                    href={`https://wa.me/${websiteDetails.whatsappNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                                </a>
                            </div>
                        </div>

                        {/* Trust */}
                        <div className="flex items-center justify-center gap-5 pt-2">
                            {[
                                { icon: Shield,     label: 'SSL Encrypted' },
                                { icon: Lock,       label: 'Privacy Protected' },
                                { icon: ShieldCheck, label: 'Verified' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <item.icon className="w-3 h-3 text-gray-300" />
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ── Booking found — show result ── */
                    <BookingResult booking={booking} onReset={handleReset} />
                )}
            </div>
        </div>
    );
}