'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Plane,
    Loader2,
    AlertCircle,
    Copy,
    Mail,
    Phone,
    Users,
    Calendar,
    RefreshCw,
    StickyNote,
    Send,
    Trash2,
    User,
    XCircle,
    AlertTriangle,
    Shield,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminNote {
    _id?: string;
    note: string;
    addedBy: string;
    createdAt: string | null;
}

type BookingStatus = 'held' | 'processing' | 'issued' | 'cancelled' | 'failed' | 'expired';
type PaymentStatus = 'pending' | 'requires_action' | 'authorized' | 'captured' | 'failed' | 'refunded';

interface FailedBooking {
    _id: string;
    bookingReference: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    retryCount: number;
    lastRetryAt: string | null;
    contact: { email: string; phone: string };
    passengers: Array<{
        id: string;
        type: string;
        title: string;
        firstName: string;
        lastName: string;
        gender: string;
        dob: string;
        passportNumber: string | null;
        passportExpiry: string | null;
        passportCountry: string;
    }>;
    flightDetails: {
        airline: string;
        flightNumber: string;
        route: string;
        departureDate: string;
        arrivalDate: string;
        duration: string;
        logoUrl: string;
        flightType: string;
        segments: Array<{
            segmentId: string;
            carrier: string;
            flightNumber: string;
            origin: string;
            destination: string;
            departureAt: string;
            arrivingAt: string;
            duration: string;
            cabin: string;
        }>;
    };
    adminNotes: AdminNote[];
    createdAt: string;
    updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d?: string | null) => (d ? format(parseISO(d), 'dd MMM yyyy, hh:mm a') : '—');
const fmtDate = (d?: string | null) => (d ? format(parseISO(d), 'dd MMM yyyy') : '—');

// ─── Badges ───────────────────────────────────────────────────────────────────
const PAY_CONFIG: Record<string, { label: string; bg: string; text: string; ring: string; dot: string }> = {
    pending:         { label: 'Pending',         bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200',   dot: 'bg-amber-500' },
    requires_action: { label: 'Action Required', bg: 'bg-orange-50',  text: 'text-orange-700',  ring: 'ring-orange-200',  dot: 'bg-orange-500' },
    authorized:      { label: 'Authorized',      bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200',    dot: 'bg-blue-500' },
    captured:        { label: 'Captured',         bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
    failed:          { label: 'Failed',           bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-200',    dot: 'bg-rose-500' },
    refunded:        { label: 'Refunded',         bg: 'bg-gray-100',   text: 'text-gray-600',    ring: 'ring-gray-200',    dot: 'bg-gray-400' },
};

function PayBadge({ status }: { status: PaymentStatus }) {
    const s = PAY_CONFIG[status] ?? PAY_CONFIG.pending;
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1', s.bg, s.text, s.ring)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
            {s.label}
        </span>
    );
}

function CopyBtn({ text, label }: { text: string; label: string }) {
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); toast.success(`${label} copied`); }}
            className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[12px] font-semibold text-gray-700 transition-all hover:bg-gray-100 cursor-pointer"
        >
            {text}
            <Copy className="h-3 w-3 text-gray-400 transition-colors group-hover:text-gray-700" />
        </button>
    );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
    bookingRef,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
    bookingRef: string;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isDeleting ? onClose : undefined} />

            <div className="relative w-full max-w-sm">
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-2xl">
                    {/* Red accent */}
                    <div className="h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-red-500" />

                    {/* Content */}
                    <div className="px-6 pt-6 pb-5 text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-4">
                            <Trash2 className="w-5 h-5 text-rose-500" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Delete Booking?</h3>
                        <p className="text-[12px] text-gray-500 leading-relaxed">
                            This will permanently delete booking{' '}
                            <span className="font-mono font-bold text-gray-700">{bookingRef}</span>{' '}
                            and all associated data. This action cannot be undone.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                className="py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold text-gray-500 hover:bg-gray-100 active:scale-[0.97] transition-all text-sm cursor-pointer disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isDeleting}
                                className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 font-bold text-white text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.97]"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
    title, subtitle, icon, iconBg, children, rightSlot,
}: {
    title: string; subtitle?: string; icon: React.ReactNode; iconBg: string;
    children: React.ReactNode; rightSlot?: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
            <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shadow-2xl shadow-gray-100', iconBg)}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
                        {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
                    </div>
                </div>
                {rightSlot}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0 pt-0.5">{label}</span>
            <span className={cn('text-[12px] text-gray-700 text-right break-all', mono && 'font-mono')}>{value ?? '—'}</span>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FailedBookingDetailPage() {
    const { ref: bookingRef } = useParams<{ ref: string }>();
    const router = useRouter();

    const [booking, setBooking]       = useState<FailedBooking | null>(null);
    const [loading, setLoading]       = useState(true);
    const [noteText, setNoteText]     = useState('');
    const [noteAuthor, setNoteAuthor] = useState('admin');
    const [submitting, setSubmitting] = useState(false);

    // Delete state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting]           = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchBooking = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/dashboard/bookings/faild/${bookingRef}`);
            if (res.data.success) setBooking(res.data.booking);
            else toast.error(res.data.message ?? 'Failed to load booking');
        } catch {
            toast.error('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    }, [bookingRef]);

    useEffect(() => { fetchBooking(); }, [fetchBooking]);

    // ── Add note ──────────────────────────────────────────────────────────────
    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        setSubmitting(true);
        try {
            const res = await axios.post(`/api/dashboard/bookings/faild/${bookingRef}`, {
                note: noteText, addedBy: noteAuthor,
            });
            if (!res.data.success) throw new Error(res.data.message);
            setBooking((prev) => (prev ? { ...prev, adminNotes: res.data.adminNotes } : prev));
            setNoteText('');
            toast.success('Note added');
        } catch (e: any) {
            toast.error(e.message ?? 'Failed to add note');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete booking ────────────────────────────────────────────────────────
    const handleDeleteBooking = async () => {
        setIsDeleting(true);
        try {
            const res = await axios.delete(`/api/dashboard/bookings/faild/${bookingRef}`);
            if (!res.data.success) throw new Error(res.data.message);
            toast.success('Booking deleted successfully');
            router.push('/admin/bookings');
        } catch (e: any) {
            toast.error(e.message ?? 'Failed to delete booking');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading)
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] gap-4">
                <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-2xl shadow-rose-100">
                        <Plane className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <p className="text-[13px] font-semibold text-gray-700">Retrieving failed booking...</p>
                    <p className="text-[11px] text-gray-400">Fetching from database</p>
                </div>
            </div>
        );

    // ── Not Found ─────────────────────────────────────────────────────────────
    if (!booking)
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
                    <AlertCircle className="h-6 w-6 text-rose-500" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-[15px] font-bold text-gray-900">Booking Not Found</p>
                    <p className="text-[12px] text-gray-400">
                        No failed booking found for <span className="font-mono">{bookingRef}</span>
                    </p>
                </div>
                <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="mt-2 h-9 rounded-xl border-gray-200 px-5 text-[12px] font-semibold cursor-pointer"
                >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Go Back
                </Button>
            </div>
        );

    const b = booking;
    const fd = b.flightDetails;
    const routeParts = fd.route?.split('→').map((s) => s.trim()) ?? [];

    return (
        <>
            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteBooking}
                isDeleting={isDeleting}
                bookingRef={b.bookingReference}
            />

            <div className="min-h-screen bg-[#f8f9fb]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

                    {/* ═══ HEADER ═══════════════════════════════════════════════ */}
                    <header className="pt-8 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.back()}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 cursor-pointer"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-600">
                                            <XCircle className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                            Admin · Failed Booking
                                        </span>
                                    </div>
                                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
                                        {fd.route || b.bookingReference}
                                    </h1>
                                    <p className="text-[13px] text-gray-500">
                                        {fd.flightType?.replace('_', ' ')} ·{' '}
                                        {fd.departureDate ? format(parseISO(fd.departureDate), 'EEE, dd MMM yyyy') : '—'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap">
                                {/* Delete Button */}
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-[12px] font-bold hover:bg-rose-100 hover:border-rose-300 active:scale-[0.97] transition-all cursor-pointer"
                                >
                                    <Trash2 className="h-3.5 w-3.5 group-hover:animate-pulse" />
                                    Delete
                                </button>

                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 text-rose-700 ring-rose-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                    Failed
                                </span>
                                <PayBadge status={b.paymentStatus} />
                            </div>
                        </div>
                    </header>

                    {/* ═══ META BAR ══════════════════════════════════════════════ */}
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ref</span>
                            <CopyBtn text={b.bookingReference} label="Booking Ref" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100 text-[11px] text-gray-500">
                            <Calendar className="h-3.5 w-3.5 text-rose-400" />
                            <span className="font-medium">Created {fmt(b.createdAt)}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100 text-[11px] text-gray-500">
                            <Users className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="font-medium">{b.passengers.length} passenger{b.passengers.length > 1 ? 's' : ''}</span>
                        </div>
                        <button
                            onClick={fetchBooking}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100 text-[11px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <RefreshCw className="h-3.5 w-3.5" /> Refresh
                        </button>
                    </div>

                    {/* ═══ FAILURE ALERT ═════════════════════════════════════════ */}
                    <div className="mb-6 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/60 shadow-2xl shadow-gray-100">
                        <div className="flex items-start gap-4 px-6 py-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 shadow-lg mt-0.5">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-bold text-rose-900">Booking Failed</p>
                                <p className="text-[13px] text-rose-700 mt-1 leading-relaxed">
                                    This booking was not completed successfully. Review the details and logs below before taking action.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ═══ MAIN GRID ═════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

                        {/* ══ LEFT COLUMN ══════════════════════════════════════ */}
                        <div className="space-y-6">

                            {/* Flight Details */}
                            <SectionCard
                                title="Flight Details"
                                subtitle={`${fd.segments?.length ?? 0} segment${(fd.segments?.length ?? 0) !== 1 ? 's' : ''}`}
                                icon={<Plane className="h-4 w-4 text-white" />}
                                iconBg="bg-sky-600"
                                rightSlot={
                                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 ring-1 ring-sky-200 uppercase">
                                        {fd.flightType?.replace('_', ' ')}
                                    </span>
                                }
                            >
                                {/* Airline */}
                                <div className="flex items-center gap-3 pb-5 mb-5 border-b border-gray-100">
                                    {fd.logoUrl && (
                                        <img
                                            src={fd.logoUrl} alt="airline"
                                            className="h-10 w-14 object-contain rounded-lg border border-gray-200 p-1 bg-white"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    )}
                                    <div>
                                        <p className="text-[15px] font-bold text-gray-900">{fd.airline}</p>
                                        <p className="text-[11px] text-gray-400">{fd.flightNumber} · {fd.duration}</p>
                                    </div>
                                </div>

                                {/* Route visual */}
                                {routeParts.length > 0 && (
                                    <div className="flex items-center mb-6 flex-wrap gap-y-2">
                                        {routeParts.map((code, i) => (
                                            <div key={i} className="flex items-center">
                                                <div className="text-center">
                                                    <p className="font-mono text-xl font-bold text-sky-600">{code}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {i === 0 ? fmtDate(fd.departureDate) : i === routeParts.length - 1 ? fmtDate(fd.arrivalDate) : 'via'}
                                                    </p>
                                                </div>
                                                {i < routeParts.length - 1 && (
                                                    <div className="flex items-center mx-4 text-gray-300">
                                                        <div className="h-px w-8 bg-gray-200" />
                                                        <Plane className="h-3.5 w-3.5 rotate-90 mx-1.5" />
                                                        <div className="h-px w-8 bg-gray-200" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-x-8">
                                    <InfoRow label="Departs" value={fmt(fd.departureDate)} />
                                    <InfoRow label="Arrives" value={fmt(fd.arrivalDate)} />
                                    <InfoRow label="Duration" value={fd.duration} />
                                </div>
                            </SectionCard>

                            {/* Segments */}
                            {fd.segments?.length > 0 && (
                                <SectionCard
                                    title={`Segments (${fd.segments.length})`}
                                    subtitle="Individual flight legs"
                                    icon={<Plane className="h-4 w-4 text-white" />}
                                    iconBg="bg-indigo-600"
                                >
                                    <div className="space-y-4">
                                        {fd.segments.map((seg, i) => (
                                            <div key={seg.segmentId || i} className="rounded-xl border border-gray-200/70 bg-gray-50/30 p-4 transition-colors hover:bg-gray-50/60">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-mono text-[12px] font-bold text-indigo-600">
                                                        {seg.carrier} {seg.flightNumber}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-200">
                                                        {seg.cabin}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 items-center gap-4">
                                                    <div>
                                                        <p className="text-lg font-bold text-gray-900 tabular-nums">
                                                            {seg.departureAt ? format(parseISO(seg.departureAt), 'hh:mm a') : '—'}
                                                        </p>
                                                        <p className="text-[13px] font-semibold text-gray-700">{seg.origin}</p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {seg.departureAt ? format(parseISO(seg.departureAt), 'EEE, dd MMM') : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-bold text-gray-400 mb-1.5">{seg.duration}</span>
                                                        <div className="flex w-full items-center gap-1">
                                                            <div className="relative h-[2px] flex-1 rounded-full bg-gray-200">
                                                                <div className="absolute left-0 -top-[3px] h-2 w-2 rounded-full bg-gray-300" />
                                                                <div className="absolute right-0 -top-[3px] h-2 w-2 rounded-full bg-gray-300" />
                                                            </div>
                                                            <Plane className="h-3 w-3 rotate-90 text-gray-300 shrink-0" />
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900 tabular-nums">
                                                            {seg.arrivingAt ? format(parseISO(seg.arrivingAt), 'hh:mm a') : '—'}
                                                        </p>
                                                        <p className="text-[13px] font-semibold text-gray-700">{seg.destination}</p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {seg.arrivingAt ? format(parseISO(seg.arrivingAt), 'EEE, dd MMM') : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            )}

                            {/* Passengers */}
                            <SectionCard
                                title="Passengers"
                                subtitle={`${b.passengers.length} traveler${b.passengers.length > 1 ? 's' : ''}`}
                                icon={<Users className="h-4 w-4 text-white" />}
                                iconBg="bg-indigo-600"
                                rightSlot={
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 tabular-nums ring-1 ring-indigo-200">
                                        {b.passengers.length}
                                    </span>
                                }
                            >
                                <div className="overflow-x-auto -mx-6 px-6">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                {['Name', 'Type', 'DOB', 'Passport', 'Expiry', 'Country'].map((h) => (
                                                    <th key={h} className="pb-3 pr-6 text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {b.passengers.map((p, i) => (
                                                <tr key={p.id || i} className="transition-colors hover:bg-gray-50/40">
                                                    <td className="py-3.5 pr-6">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500 shrink-0">
                                                                {p.firstName?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-[12px] font-semibold text-gray-900 whitespace-nowrap">
                                                                    {p.title?.toUpperCase()} {p.firstName} {p.lastName}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 capitalize">{p.gender}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 pr-6">
                                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 ring-1 ring-indigo-200 capitalize whitespace-nowrap">
                                                            {p.type?.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 pr-6 font-mono text-[11px] text-gray-600 whitespace-nowrap">{fmtDate(p.dob)}</td>
                                                    <td className="py-3.5 pr-6 font-mono text-[11px] text-gray-600">{p.passportNumber ?? '—'}</td>
                                                    <td className="py-3.5 pr-6 font-mono text-[11px] text-gray-600 whitespace-nowrap">{fmtDate(p.passportExpiry)}</td>
                                                    <td className="py-3.5 text-[11px] text-gray-600">{p.passportCountry}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionCard>
                        </div>

                        {/* ══ RIGHT COLUMN ═════════════════════════════════════ */}
                        <div className="space-y-6">

                            {/* Booking Info */}
                            <SectionCard
                                title="Booking Info"
                                subtitle="Reference & timestamps"
                                icon={<Shield className="h-4 w-4 text-white" />}
                                iconBg="bg-gray-900"
                            >
                                <InfoRow label="Booking Ref" value={<CopyBtn text={b.bookingReference} label="Booking Ref" />} />
                                <InfoRow label="Created" value={fmt(b.createdAt)} />
                                <InfoRow label="Updated" value={fmt(b.updatedAt)} />
                            </SectionCard>

                            {/* Failure Details */}
                            <SectionCard
                                title="Failure Details"
                                subtitle="Why this booking failed"
                                icon={<AlertCircle className="h-4 w-4 text-white" />}
                                iconBg="bg-rose-500"
                            >
                                <InfoRow
                                    label="Status"
                                    value={
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Failed
                                        </span>
                                    }
                                />
                                <InfoRow label="Payment" value={<PayBadge status={b.paymentStatus} />} />
                                <InfoRow
                                    label="Retry Count"
                                    value={
                                        <span className={cn('font-mono font-bold text-[12px]', b.retryCount >= 5 ? 'text-rose-600' : 'text-amber-600')}>
                                            {b.retryCount} / 5
                                        </span>
                                    }
                                />
                                <InfoRow label="Last Retry" value={fmt(b.lastRetryAt)} />
                                <InfoRow
                                    label="Can Retry"
                                    value={
                                        b.retryCount < 5
                                            ? <span className="text-[11px] font-bold text-emerald-600">✅ Yes</span>
                                            : <span className="text-[11px] font-bold text-rose-600">❌ Limit reached</span>
                                    }
                                />
                            </SectionCard>

                            {/* Contact */}
                            <SectionCard
                                title="Contact"
                                subtitle="Customer info"
                                icon={<Mail className="h-4 w-4 text-white" />}
                                iconBg="bg-violet-600"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200/70 bg-gray-50/30 px-3 py-2.5">
                                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span className="text-[12px] text-gray-700 truncate">{b.contact.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200/70 bg-gray-50/30 px-3 py-2.5">
                                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span className="font-mono text-[12px] text-gray-700">{b.contact.phone}</span>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                    {/* ═══ ADMIN NOTES ═══════════════════════════════════════════ */}
                    <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 shadow-2xl shadow-gray-100">
                                    <StickyNote className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-gray-900">Admin Notes</h3>
                                    <p className="text-[11px] text-gray-400">Internal only — not visible to customers</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 tabular-nums ring-1 ring-sky-200">
                                {b.adminNotes?.length ?? 0} notes
                            </span>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Add note form */}
                            <div className="rounded-xl border border-sky-200/50 bg-sky-50/20 p-4 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Author</label>
                                    <input
                                        type="text"
                                        value={noteAuthor}
                                        onChange={(e) => setNoteAuthor(e.target.value)}
                                        placeholder="e.g. admin, support"
                                        className="h-9 w-48 rounded-xl border border-gray-200 bg-white px-3 text-[12px] text-gray-700 placeholder:text-gray-300 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Note</label>
                                    <textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Write an internal admin note..."
                                        rows={3}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote(); }}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[12px] text-gray-700 placeholder:text-gray-300 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200 transition-all resize-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-400">
                                        <kbd className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[9px]">Ctrl+Enter</kbd> to submit
                                    </span>
                                    <Button
                                        onClick={handleAddNote}
                                        disabled={submitting || !noteText.trim()}
                                        className="h-9 cursor-pointer rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 text-[12px] font-bold text-white shadow-2xl shadow-sky-100 transition-all hover:from-sky-600 hover:to-sky-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving…</>
                                        ) : (
                                            <><Send className="h-3.5 w-3.5 mr-1.5" />Add Note</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Notes list */}
                            {!b.adminNotes?.length ? (
                                <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-200/70 py-12 text-center">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
                                        <StickyNote className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <p className="text-[12px] font-semibold text-gray-400">No admin notes yet</p>
                                    <p className="text-[11px] text-gray-300">Document why this booking failed using the form above</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {[...b.adminNotes].reverse().map((n, reverseIdx) => (
                                        <div
                                            key={n._id ?? reverseIdx}
                                            className="group relative rounded-xl border border-gray-200/70 bg-white p-4 shadow-2xl shadow-gray-50 transition-all hover:shadow-md hover:border-gray-300"
                                            style={{ borderLeftWidth: 3, borderLeftColor: '#0ea5e9' }}
                                        >
                                            <p className="text-[12px] text-gray-700 leading-relaxed mb-3">{n.note}</p>
                                            <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                                                <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 ring-1 ring-sky-200">
                                                    <User className="h-2.5 w-2.5" />
                                                    {n.addedBy}
                                                </span>
                                                {n.createdAt && (
                                                    <span className="text-[10px] text-gray-400">{fmt(n.createdAt)}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}