'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Mail, Lock, AlertCircle, Loader2, CreditCard, Clock, CheckCircle,
    Ban, Plane, Phone, Timer, RefreshCcw, ShieldCheck, ArrowRight,
    Users, Globe, Shield, Check, AlertTriangle, Hourglass,
} from 'lucide-react';
import { useEffect, useState, useMemo, Suspense } from 'react';
import axios from 'axios';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './phone-input.css';

import { PaymentForm }                                             from './components/PaymentForm';
import { BookingFormData, bookingSchema, normalizePassengerTypes } from './utils/validation';
import { PassengerForm }                                           from './components/PassengerForm';
import { BookingSummary }                                          from './components/BookingSummary';
import { websiteDetails }                                          from '@/constant/data';
import { toast }                                                   from 'sonner';

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const formatTime = (iso: string) => format(parseISO(iso), 'hh:mm a');
const formatDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM');
const getDayDiff = (dep: string, arr: string) => {
    const diff = differenceInCalendarDays(parseISO(arr), parseISO(dep));
    return diff > 0 ? diff : 0;
};

/** Derive Duffel passenger type from API shape */
function deriveType(p: { type?: string | null; age?: number | null }): 'adult' | 'child' | 'infant_without_seat' {
    if (p.type === 'infant_without_seat') return 'infant_without_seat';
    if (p.type === 'child')               return 'child';
    if (p.type === 'adult')               return 'adult';
    if (p.age !== null && p.age !== undefined && p.age <= 1)  return 'infant_without_seat';
    if (p.age !== null && p.age !== undefined && p.age <= 11) return 'child';
    return 'adult';
}

// ──────────────────────────────────────────────
// STEP INDICATOR
// ──────────────────────────────────────────────
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { id: 1, label: 'Review',     icon: Plane },
        { id: 2, label: 'Passengers', icon: Users },
        { id: 3, label: 'Payment',    icon: CreditCard },
    ];
    return (
        <div className="flex items-center gap-1.5 sm:gap-2">
            {steps.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isDone   = step.id < currentStep;
                const StepIcon = step.icon;
                return (
                    <div key={step.id} className="flex items-center gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <StepIcon className="w-3.5 h-3.5" />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block transition-colors duration-300 ${isDone ? 'text-emerald-600' : isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="w-6 sm:w-10 h-[2px] mx-0.5 rounded-full bg-gray-200 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${isDone ? 'w-full bg-emerald-400' : 'w-0'}`} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ──────────────────────────────────────────────
// COUNTDOWN TIMER
// ──────────────────────────────────────────────
const CountdownTimer = ({ timeLeft, isUrgent }: { timeLeft: string; isUrgent: boolean }) => (
    <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-300 ${isUrgent ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-gray-900 border-gray-800'}`}>
        <Timer className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-gray-400'}`} />
        <div>
            <p className={`text-[8px] font-bold uppercase tracking-widest ${isUrgent ? 'text-red-400' : 'text-gray-500'}`}>
                {isUrgent ? '⚠ Hurry!' : 'Expires In'}
            </p>
            <p className={`text-base font-mono font-black leading-none tabular-nums ${isUrgent ? 'text-red-600' : 'text-white'}`}>
                {timeLeft}
            </p>
        </div>
    </div>
);

// ──────────────────────────────────────────────
// SECTION CARD
// ──────────────────────────────────────────────
const SectionCard = ({
    icon: Icon, iconColor = 'text-rose-500', iconBg = 'bg-rose-50',
    title, subtitle, badge, children,
}: {
    icon: React.ElementType; iconColor?: string; iconBg?: string;
    title: string; subtitle?: string; badge?: React.ReactNode; children: React.ReactNode;
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

// ──────────────────────────────────────────────
// FLIGHT SEGMENT CARD
// ──────────────────────────────────────────────
const FlightSegmentCard = ({ seg }: { seg: {
    layover?: string | null;
    departure: { time: string; city?: string | null; code?: string | null; airport?: string | null; terminal?: string | null };
    arrival:   { time: string; city?: string | null; code?: string | null; airport?: string | null; terminal?: string | null };
    logo?:       string | null;
    airline?:    string | null;
    duration?:   string | null;
    flightNumber?: string | null;
    aircraft?:   string | null;
} }) => (
    <div className="group/seg">
        {seg.layover && (
            <div className="my-3 ml-5 pl-4 border-l-2 border-dashed border-amber-300">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-700">
                    <Clock className="w-3 h-3" />
                    <span className="text-[11px] font-semibold">{seg.layover} layover · {seg.departure?.airport}</span>
                </div>
            </div>
        )}
        <div className="flex gap-3.5">
            <div className="flex flex-col items-center pt-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full border-2 border-gray-800 bg-white" />
                <div className="w-px flex-1 bg-gray-200 my-1 min-h-[50px]" />
                <div className="w-3 h-3 rounded-full border-2 border-gray-400 bg-white" />
            </div>
            <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-black text-gray-900">{formatTime(seg.departure.time)}</span>
                            <span className="text-sm font-semibold text-gray-600">{seg.departure.city}</span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{seg.departure.code}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-gray-500">{formatDate(seg.departure.time)}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-[10px] text-gray-400">{seg.departure.airport}</span>
                            {seg.departure.terminal && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">T{seg.departure.terminal}</span>
                            )}
                        </div>
                    </div>
                    {seg.logo && (
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1 shrink-0">
                            <img src={seg.logo} alt={seg.airline ?? ''} className="w-5 h-5 object-contain" />
                        </div>
                    )}
                </div>
                <div className="my-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-700">{seg.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span className="font-semibold text-gray-500">{seg.airline}</span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="font-mono font-bold text-gray-600">{seg.flightNumber}</span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span>{seg.aircraft}</span>
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-black text-gray-900">{formatTime(seg.arrival.time)}</span>
                        {getDayDiff(seg.departure.time, seg.arrival.time) > 0 && (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                +{getDayDiff(seg.departure.time, seg.arrival.time)}
                            </span>
                        )}
                        <span className="text-sm font-semibold text-gray-600">{seg.arrival.city}</span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{seg.arrival.code}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-gray-500">{formatDate(seg.arrival.time)}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-[10px] text-gray-400">{seg.arrival.airport}</span>
                        {seg.arrival.terminal && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">T{seg.arrival.terminal}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ──────────────────────────────────────────────
// EXPIRATION MODAL
// ──────────────────────────────────────────────
const ExpirationModal = ({ isOpen, onRefresh }: { isOpen: boolean; onRefresh: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl  p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-50 flex items-center justify-center">
                    <Hourglass className="w-9 h-9 text-amber-500 animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Session Expired</h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    The time limit for this offer has passed. Please search again for latest availability.
                </p>
                <button
                    onClick={onRefresh}
                    className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer"
                >
                    <RefreshCcw className="w-4 h-4" />Search Again
                </button>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────
// PAYMENT CONFIRMATION MODAL
// ──────────────────────────────────────────────
const PaymentModal = ({
    isOpen, onClose, onConfirm, isInstantPayment, price, isProcessing, flightData, formData,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isInstantPayment: boolean;
    price: string;
    isProcessing: boolean;
    flightData: FlightData | null;
    formData: BookingFormData | null;
}) => {
    if (!isOpen || !flightData || !formData) return null;

    const firstSeg  = flightData?.itinerary?.[0]?.segments?.[0];
    const lastSlice = flightData?.itinerary?.[0];
    const lastSeg   = lastSlice?.segments?.[lastSlice?.segments?.length - 1];
    const depCode   = firstSeg?.departure?.code ?? 'DEP';
    const arrCode   = lastSeg?.arrival?.code    ?? 'ARR';
    const depCity   = firstSeg?.departure?.city ?? '';
    const arrCity   = lastSeg?.arrival?.city     ?? '';
    const flightDate = firstSeg?.departure?.time
        ? format(parseISO(firstSeg.departure.time), 'dd MMM yyyy')
        : '';
    const flightTime = firstSeg?.departure?.time
        ? format(parseISO(firstSeg.departure.time), 'hh:mm a')
        : '';

    const rawCard   = (formData?.payment?.cardNumber ?? '').replace(/\s/g, '');
    const lastFour  = rawCard.slice(-4) || '0000';
    const cardBrand = /^4/.test(rawCard) ? 'Visa' : /^5[1-5]/.test(rawCard) ? 'Mastercard' : /^3[47]/.test(rawCard) ? 'Amex' : 'Card';
    const totalPax  = flightData?.passengers?.length ?? 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={!isProcessing ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm max-h-[calc(100vh-24px)] overflow-y-auto">
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-2xl shadow-gray-300/30">

                    {/* Header */}
                    <div className="px-5 pt-6 pb-4 text-center border-b border-gray-100">
                        <div className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center mb-3 ${
                            isInstantPayment
                                ? 'bg-rose-50 text-rose-500'
                                : 'bg-emerald-50 text-emerald-500'
                        }`}>
                            {isInstantPayment
                                ? <CreditCard className="w-5 h-5" />
                                : <ShieldCheck className="w-5 h-5" />
                            }
                        </div>
                        <h3 className="text-base font-bold text-gray-900">
                            {isInstantPayment ? 'Confirm Payment' : 'Confirm Booking'}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1">Review details before you proceed</p>
                    </div>

                    {/* Content */}
                    <div className="px-5 py-4 space-y-3">

                        {/* Flight Row */}
                        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[15px] font-black text-gray-900 leading-none">{depCode}</span>
                                        <span className="text-[9px] text-gray-400 mt-1 truncate max-w-[60px]">{depCity}</span>
                                    </div>
                                    <div className="flex flex-col items-center px-2">
                                        <div className="flex items-center gap-1">
                                            <div className="w-5 h-[1px] bg-gray-300" />
                                            <Plane className="w-3 h-3 text-gray-400 rotate-90" />
                                            <div className="w-5 h-[1px] bg-gray-300" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[15px] font-black text-gray-900 leading-none">{arrCode}</span>
                                        <span className="text-[9px] text-gray-400 mt-1 truncate max-w-[60px]">{arrCity}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 font-medium">{flightDate}</p>
                                    {flightTime && (
                                        <p className="text-[10px] text-gray-400 mt-0.5">{flightTime}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <p className="text-[8px] text-gray-400 uppercase tracking-widest mb-1.5">Passengers</p>
                                <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-sm font-bold text-gray-900">{totalPax}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <p className="text-[8px] text-gray-400 uppercase tracking-widest mb-1.5">Payment</p>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5 text-violet-500" />
                                    <span className="text-sm font-bold text-gray-900">{cardBrand} {lastFour}</span>
                                </div>
                            </div>
                        </div>

                        {/* Email Note */}
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                            <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <p className="text-[10px] text-emerald-700 leading-snug">
                                E-ticket will be sent to your email after booking.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-5 pt-2">
                        {/* Price */}
                        <div className="flex items-end justify-between mb-4">
                            <div>
                                <p className="text-[8px] text-gray-400 uppercase tracking-widest">Total</p>
                                <p className="text-[9px] text-emerald-600 font-medium mt-0.5">All taxes included</p>
                            </div>
                            <p className="text-2xl font-black text-gray-900 tracking-tight">{price}</p>
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-5 gap-2.5">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="col-span-2 py-3 rounded-xl bg-gray-50 border border-gray-200 font-semibold text-gray-500 hover:bg-gray-100 active:scale-[0.97] transition-all text-sm cursor-pointer disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isProcessing}
                                className={`col-span-3 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.97] ${
                                    isInstantPayment
                                        ? 'bg-rose-500 hover:bg-rose-600'
                                        : 'bg-gray-900 hover:bg-gray-800'
                                }`}
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {isInstantPayment
                                            ? <CreditCard className="w-3.5 h-3.5" />
                                            : <ShieldCheck className="w-3.5 h-3.5" />
                                        }
                                        <span>{isInstantPayment ? 'Pay Now' : 'Confirm Booking'}</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Lock badge */}
                        <div className="flex items-center justify-center gap-1.5 mt-3">
                            <Lock className="w-2.5 h-2.5 text-gray-300" />
                            <span className="text-[9px] text-gray-400 font-medium">Secured with 256-bit encryption</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────
// INSTANT PAYMENT BLOCK
// ──────────────────────────────────────────────
const InstantPaymentBlock = ({
    onWhatsApp,
    onSearch,
}: {
    onWhatsApp: () => void;
    onSearch: () => void;
}) => (
    <SectionCard
        icon={AlertTriangle}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        title="Instant Payment Required"
        subtitle="This flight requires immediate payment"
    >
        <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto mb-5 bg-rose-50 rounded-full flex items-center justify-center">
                <Ban className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-2">Online Booking Unavailable</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                This flight cannot be held online. Please contact our support team to complete this booking.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                    onClick={onWhatsApp}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                >
                    <Phone className="w-4 h-4" />Book via WhatsApp
                </button>
                <button
                    onClick={onSearch}
                    className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                    Search Other Flights
                </button>
            </div>
        </div>
    </SectionCard>
);

// ──────────────────────────────────────────────
// LOADING & ERROR STATES
// ──────────────────────────────────────────────
const LoadingState = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-gray-400" />
                </div>
            </div>
            <p className="text-sm font-bold text-gray-600">Loading flight details...</p>
            <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
        </div>
    </div>
);

const ErrorState = ({
    message,
    onBack,
    isInstantPayment = false,
    onWhatsApp,
}: {
    message: string;
    onBack: () => void;
    isInstantPayment?: boolean;
    onWhatsApp?: () => void;
}) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl shadow-gray-100  p-8 text-center">
            <div className={`w-16 h-16 mx-auto mb-5 rounded-xl flex items-center justify-center ${isInstantPayment ? 'bg-amber-50' : 'bg-red-50'}`}>
                {isInstantPayment
                    ? <AlertTriangle className="w-7 h-7 text-amber-500" />
                    : <AlertCircle  className="w-7 h-7 text-red-500" />
                }
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">
                {isInstantPayment ? 'Instant Payment Required' : 'Something went wrong'}
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
            <div className="flex flex-col gap-2.5">
                {isInstantPayment && onWhatsApp && (
                    <button
                        onClick={onWhatsApp}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        <Phone className="w-4 h-4" />Book via WhatsApp
                    </button>
                )}
                <button
                    onClick={onBack}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                    Search Again
                </button>
            </div>
        </div>
    </div>
);

// ──────────────────────────────────────────────
// FLIGHT DATA TYPES
// Baggage types are mirrored here so CheckoutPage + BookingSummary
// share the same shape without a circular import.
// ──────────────────────────────────────────────

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

interface FlightSegment {
    id: string;
    airline?:      string | null;
    logo?:         string | null;
    flightNumber?: string | null;
    aircraft?:     string | null;
    classType?:    string | null;
    duration?:     string | null;
    layoverToNext?: string | null;
    departure: { airport?: string|null; code?: string|null; city?: string|null; terminal?: string|null; time: string };
    arrival:   { airport?: string|null; code?: string|null; city?: string|null; terminal?: string|null; time: string };
}

interface FlightSlice {
    id: string;
    direction: string;
    totalDuration?: string | null;
    stops: number;
    segments: FlightSegment[];
    mainDeparture?: FlightSegment['departure'] | null;
    mainArrival?:   FlightSegment['arrival']   | null;
    mainAirline?:   string | null;
    mainLogo?:      string | null;
}

interface FlightPassenger {
    id: string;
    type?: string | null;
    age?:  number | null;
}

interface FlightData {
    id: string;
    expiresAt?: string | null;
    carrier: { name?: string|null; logo?: string|null; code?: string|null };
    itinerary: FlightSlice[];
    price: {
        finalPrice: number;
        currency: string;
        basePrice: number;   // ✅ FIXED — required by BookingSummary price breakdown
        markup: number;      // ✅ FIXED — required by BookingSummary taxes & fees row
    };
    baggage: BaggageInfo | string; // ✅ FIXED — was `unknown`, breaks BookingSummary prop type
    cabinClass?: string | null;
    conditions: { refundable: boolean; changeable: boolean };
    passengers: FlightPassenger[];
    // ✅ FIXED — camelCase to match updated API response
    paymentRequirements: {
        requiresInstantPayment: boolean;
        paymentRequiredBy: string | null;
        priceGuaranteeExpiresAt: string | null;
    };
}

// ──────────────────────────────────────────────
// HELPERS for expired offer redirect
// ──────────────────────────────────────────────
function tripTypeFromItinerary(flightData: FlightData): string {
    const len = flightData?.itinerary?.length ?? 1;
    return len === 2 ? 'round_trip' : len > 2 ? 'multi_city' : 'one_way';
}

function buildSearchParams(flightData: FlightData, params: URLSearchParams) {
    const tripType = tripTypeFromItinerary(flightData);
    if (tripType === 'multi_city') {
        const flights = flightData.itinerary.map((slice) => ({
            origin:      slice.segments?.[0]?.departure?.code,
            destination: slice.segments?.[slice.segments.length - 1]?.arrival?.code,
            date:        slice.segments?.[0]?.departure?.time?.split('T')[0],
        }));
        params.append('flights', JSON.stringify(flights));
    } else {
        const ob = flightData.itinerary?.[0];
        params.append('origin',      ob?.segments?.[0]?.departure?.code ?? '');
        params.append('destination', ob?.segments?.[ob?.segments?.length - 1]?.arrival?.code ?? '');
        params.append('date',        ob?.segments?.[0]?.departure?.time?.split('T')[0] ?? '');
        if (tripType === 'round_trip' && flightData.itinerary?.[1]) {
            params.append('returnDate', flightData.itinerary[1].segments?.[0]?.departure?.time?.split('T')[0] ?? '');
        }
    }
}

// ──────────────────────────────────────────────
// MAIN CHECKOUT CONTENT
// ──────────────────────────────────────────────
function CheckoutContent() {
    const searchParams  = useSearchParams();
    const router        = useRouter();

    const offerId       = searchParams.get('offer_id');
    const adultsCount   = parseInt(searchParams.get('adt')  ?? '0', 10);
    const childrenCount = parseInt(searchParams.get('chd')  ?? '0', 10);
    const infantsCount  = parseInt(searchParams.get('inf')  ?? '0', 10);

    const [isSubmitting, setIsSubmitting]               = useState(false);
    const [isLoading, setIsLoading]                     = useState(true);
    const [flightData, setFlightData]                   = useState<FlightData | null>(null);
    const [fetchError, setFetchError]                   = useState('');
    const [fetchErrorType, setFetchErrorType]           = useState<string>('');
    const [timeLeft, setTimeLeft]                       = useState('--:--');
    const [isExpired, setIsExpired]                     = useState(false);
    const [isModalOpen, setIsModalOpen]                 = useState(false);
    const [pendingFormData, setPendingFormData]         = useState<BookingFormData | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        formState: { errors },
        setValue,
    } = useForm<BookingFormData>({
        resolver:      zodResolver(bookingSchema),
        defaultValues: {
            contact:    { email: '', phone: '' },
            passengers: [],
            payment: {
                cardName: '', cardNumber: '', expiryDate: '',
                billingAddress: { street: '', city: '', state: '', zipCode: '', country: 'US' },
            },
        },
    });

    // ─── WhatsApp Redirect (defined early — used in both fetch error + form) ───
    const handleWhatsAppRedirect = (data?: FlightData | null) => {
        const fd = data ?? flightData;
        if (!fd) {
            window.open(`https://wa.me/${websiteDetails.whatsappNumber}`, '_blank');
            return;
        }
        const slice   = fd.itinerary?.[0];
        const route   = `${slice?.mainDeparture?.city ?? ''} (${slice?.mainDeparture?.code ?? ''}) to ${slice?.mainArrival?.city ?? ''} (${slice?.mainArrival?.code ?? ''})`;
        const date    = slice?.mainDeparture?.time
            ? new Date(slice.mainDeparture.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
        const message = [
            'Hello, I want to book a flight that requires instant payment.',
            '', 'Flight Info:', route, `Date: ${date}`,
            `Airline: ${slice?.mainAirline ?? ''}`,
            `Price: ${fd.price?.currency ?? ''} ${fd.price?.finalPrice ?? ''}`,
            '', `Offer ID: ${fd.id}`, '', 'Please help me complete this booking.',
        ].join('\n');
        window.open(`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    // ─── Fetch Flight Data ───
    useEffect(() => {
        if (!offerId) {
            setFetchError('Invalid or missing offer ID. Please go back and select a flight.');
            setIsLoading(false);
            return;
        }

        const getFlightDetails = async () => {
            try {
                const res    = await axios.get(`/api/flights/offer/${offerId}`);
                const result = res.data;

                if (!result.success) throw new Error(result.error ?? 'Failed to load flight offer.');

                const data: FlightData = result.data;

                // Passenger count guard
                const pax         = data.passengers ?? [];
                const apiAdults   = pax.filter((p) => deriveType(p) === 'adult').length;
                const apiChildren = pax.filter((p) => deriveType(p) === 'child').length;
                const apiInfants  = pax.filter((p) => deriveType(p) === 'infant_without_seat').length;

                if (apiAdults !== adultsCount || apiChildren !== childrenCount || apiInfants !== infantsCount) {
                    throw new Error('Passenger count mismatch. Please go back and search again.');
                }

                setFlightData(data);

                // Pre-fill form — 'infant' for UI; normalizePassengerTypes() converts on submit
                reset({
                    contact: { email: '', phone: '' },
                    payment: {
                        cardName: '', cardNumber: '', expiryDate: '',
                        billingAddress: { street: '', city: '', zipCode: '', country: 'US', state: '' },
                    },
                    passengers: pax.map((p) => {
                        const t = deriveType(p);
                        return {
                            type:            t === 'infant_without_seat' ? 'infant' : t,
                            gender:          'male' as const,
                            firstName:       '',
                            lastName:        '',
                            middleName:      '',
                            dob:             '',
                            passportNumber:  '',
                            passportExpiry:  '',
                            passportCountry: 'BD',
                        };
                    }),
                });

                setIsLoading(false);
            } catch (err: unknown) {
                let msg      = 'An unexpected error occurred. Please try again.';
                let errType  = '';

                if (axios.isAxiosError(err)) {
                    const axData = err.response?.data;
                    msg     = axData?.error ?? axData?.message ?? err.message;
                    errType = axData?.errorType ?? '';
                } else if (err instanceof Error) {
                    msg = err.message;
                }

                setFetchError(msg);
                setFetchErrorType(errType);
                setIsLoading(false);
            }
        };

        getFlightDetails();
    }, [offerId, adultsCount, childrenCount, infantsCount, reset]);

    // ─── Countdown Timer ───
    useEffect(() => {
        if (!flightData?.expiresAt || isExpired) return;

        const interval = setInterval(() => {
            const distance = new Date(flightData.expiresAt!).getTime() - Date.now();
            if (distance <= 0) {
                clearInterval(interval);
                setTimeLeft('00:00');
                setIsExpired(true);
            } else {
                const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [flightData, isExpired]);

    const isUrgent = useMemo(() => {
        const mins = parseInt(timeLeft.split(':')[0] ?? '99', 10);
        return mins < 5 && timeLeft !== '--:--';
    }, [timeLeft]);

    // ─── Pre-submit: validate → open modal ───
    const onPreSubmit: SubmitHandler<BookingFormData> = (formData) => {
        setPendingFormData(formData);
        setIsModalOpen(true);
    };

    // ─── Final submit ───
    const handleConfirmBooking = async () => {
        if (!pendingFormData || !flightData) {
            toast.error('Session is invalid. Please refresh the page.');
            return;
        }

        setIsSubmitting(true);

        try {
            // normalizePassengerTypes() converts 'infant' → 'infant_without_seat' for Duffel
            const normalizedPassengers = normalizePassengerTypes(pendingFormData.passengers);

            const bookingPayload = {
                offer_id: offerId,
                contact: {
                    email: pendingFormData.contact.email,
                    phone: pendingFormData.contact.phone,
                },
                passengers: normalizedPassengers.map((p) => ({
                    type:            p.type,
                    firstName:       p.firstName,
                    lastName:        p.lastName,
                    gender:          p.gender === 'male' ? 'm' : 'f',
                    dob:             p.dob,
                    passportNumber:  p.passportNumber  || undefined,
                    passportExpiry:  p.passportExpiry  || undefined,
                    passportCountry: p.passportCountry || 'BD',
                })),
                payment: {
                    cardName:       pendingFormData.payment.cardName,
                    cardNumber:     pendingFormData.payment.cardNumber,
                    expiryDate:     pendingFormData.payment.expiryDate,
                    billingAddress: pendingFormData.payment.billingAddress,
                },
            };

            const response = await axios.post('/api/flights/order', bookingPayload);

            if (response.data.success) {
                const ref = response.data.reference;
                if (!ref) {
                    toast.error('Booking placed but no reference returned. Please contact support.');
                    return;
                }
                router.push(`/order/${ref}`);
            } else {
                throw new Error(response.data.error ?? 'Booking failed. Please try again.');
            }

        } catch (err: unknown) {
            const axErr   = axios.isAxiosError(err) ? err.response?.data : null;
            const errType = axErr?.errorType ?? axErr?.code ?? '';
            const errMsg  = axErr?.error ?? axErr?.message
                ?? (err instanceof Error ? err.message : 'Something went wrong. Please try again.');

            if (axErr?.expired || errType === 'OFFER_EXPIRED') {
                toast.error('This flight offer has expired. Redirecting to search...', { duration: 4000 });

                const adt = pendingFormData.passengers.filter(p => p.type === 'adult').length;
                const chd = pendingFormData.passengers.filter(p => p.type === 'child').length;
                const inf = pendingFormData.passengers.filter(p =>
                    p.type === 'infant' || p.type === 'infant_without_seat'
                ).length;

                const params = new URLSearchParams({
                    type:  tripTypeFromItinerary(flightData),
                    adt:   String(adt),
                    chd:   String(chd),
                    inf:   String(inf),
                    class: 'economy',
                });
                buildSearchParams(flightData, params);
                setTimeout(() => router.push(`/flights/search?${params.toString()}`), 2500);
                return;
            }

            if (errType === 'INSTANT_PAYMENT_REQUIRED') {
                toast.error('This flight requires instant payment. Please contact our support team.');
                setIsModalOpen(false);
                return;
            }

            if (errType === 'RATE_LIMITED') {
                toast.error(errMsg);
                setIsModalOpen(false);
                return;
            }

            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRefreshSearch = () => router.push('/flights/search');

    // ─────────────────────────────────────────
    // ✅ FIXED — correct camelCase path matching updated API response
    // API now blocks instant-payment offers at fetch time (returns 400),
    // so this flag is only relevant if somehow the offer passes through.
    // ─────────────────────────────────────────
    const requiresInstantPayment =
        flightData?.paymentRequirements?.requiresInstantPayment === true;

    const summaryCounts = useMemo(() => {
        if (!flightData) return { adults: 0, children: 0, infants: 0 };
        const pax = flightData.passengers ?? [];
        return {
            adults:   pax.filter((p) => deriveType(p) === 'adult').length,
            children: pax.filter((p) => deriveType(p) === 'child').length,
            infants:  pax.filter((p) => deriveType(p) === 'infant_without_seat').length,
        };
    }, [flightData]);

    // ─── Render guards ───
    if (isLoading) return <LoadingState />;

    // ✅ FIXED — INSTANT_PAYMENT_REQUIRED comes as a 400 from offer fetch,
    // so flightData is null here. Show dedicated UI instead of generic error.
    if (fetchError && !flightData) {
        return (
            <ErrorState
                message={fetchError}
                onBack={handleRefreshSearch}
                isInstantPayment={fetchErrorType === 'INSTANT_PAYMENT_REQUIRED'}
                onWhatsApp={fetchErrorType === 'INSTANT_PAYMENT_REQUIRED'
                    ? () => handleWhatsAppRedirect(null)
                    : undefined
                }
            />
        );
    }

    return (
        <>
            <ExpirationModal isOpen={isExpired} onRefresh={handleRefreshSearch} />

            <div className={`${isExpired ? 'blur-sm pointer-events-none select-none overflow-hidden h-screen' : ''} transition-all duration-300`}>
                <div className="min-h-screen bg-gray-50">

                    {/* HEADER */}
                    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                        <div className="max-w-7xl mx-auto px-4 md:px-8">
                            <div className="flex items-center justify-between h-14 md:h-16">
                                <StepIndicator currentStep={2} />
                                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                                    <Shield className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-600 tracking-wide">Secure Checkout</span>
                                </div>
                                <CountdownTimer timeLeft={timeLeft} isUrgent={isUrgent} />
                            </div>
                        </div>
                    </header>

                    {/* PAGE TITLE */}
                    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-6">
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Complete Your Booking</h1>
                        <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-2 flex-wrap">
                            Fill in the details to secure your flight
                            <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 text-[9px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                                <Lock className="w-2.5 h-2.5" />Encrypted
                            </span>
                        </p>
                    </div>

                    {/* MAIN GRID */}
                    {flightData && (
                        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                                {/* LEFT: Form */}
                                <div className="lg:col-span-2 space-y-5">

                                    {/* ITINERARY */}
                                    <SectionCard
                                        icon={Plane}
                                        title="Flight Itinerary"
                                        subtitle={`${flightData.itinerary?.length ?? 0} leg${(flightData.itinerary?.length ?? 0) > 1 ? 's' : ''}`}
                                        badge={
                                            <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-gray-100">
                                                {flightData.cabinClass ?? 'Economy'}
                                            </span>
                                        }
                                    >
                                        {flightData.itinerary.map((slice, sIdx) => (
                                            <div key={slice.id ?? sIdx}>
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <span className={`w-1 h-6 rounded-full ${sIdx === 0 ? 'bg-rose-400' : 'bg-blue-400'}`} />
                                                    <span className="text-[10px] font-bold text-white bg-gray-800 px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5">
                                                        <Plane className="w-3 h-3" />{slice.direction} Journey
                                                    </span>
                                                </div>
                                                {slice.segments.map((seg, idx) => {
                                                    const prevLayover = idx > 0
                                                        ? slice.segments[idx - 1]?.layoverToNext ?? null
                                                        : null;
                                                    return (
                                                        <FlightSegmentCard
                                                            key={seg.id ?? idx}
                                                            seg={{ ...seg, layover: prevLayover }}
                                                        />
                                                    );
                                                })}
                                                {sIdx < flightData.itinerary.length - 1 && (
                                                    <div className="my-6 flex items-center justify-center relative">
                                                        <div className="absolute w-full h-px bg-gray-200" />
                                                        <span className="relative bg-white px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-gray-100 rounded-full">
                                                            Return Flight
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </SectionCard>

                                    {/* FORM or INSTANT PAYMENT BLOCK */}
                                    {requiresInstantPayment ? (
                                        <InstantPaymentBlock
                                            onWhatsApp={() => handleWhatsAppRedirect(flightData)}
                                            onSearch={() => router.push('/flights/search')}
                                        />
                                    ) : (
                                        <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-5">

                                            {/* CONTACT */}
                                            <SectionCard
                                                icon={Mail}
                                                iconColor="text-blue-500"
                                                iconBg="bg-blue-50"
                                                title="Contact Details"
                                                subtitle="We'll send your e-ticket here"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Mail className="w-3 h-3" />Email Address
                                                        </label>
                                                        <input
                                                            {...register('contact.email')}
                                                            type="email"
                                                            placeholder="ticket@example.com"
                                                            autoComplete="email"
                                                            className={`w-full p-3 bg-gray-50 border rounded-xl text-sm font-medium outline-none transition-all duration-200 placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 focus:bg-white ${errors.contact?.email ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
                                                        />
                                                        {errors.contact?.email && (
                                                            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3" />{errors.contact.email.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Phone className="w-3 h-3" />Phone Number
                                                        </label>
                                                        <Controller
                                                            name="contact.phone"
                                                            control={control}
                                                            render={({ field: { onChange, value } }) => (
                                                                <PhoneInput
                                                                    international
                                                                    defaultCountry="US"
                                                                    value={value}
                                                                    onChange={(val) => onChange(val ?? '')}
                                                                    placeholder="Enter phone number"
                                                                    className={`PhoneInput ${errors.contact?.phone ? 'input-error' : ''}`}
                                                                />
                                                            )}
                                                        />
                                                        {errors.contact?.phone && (
                                                            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3" />{errors.contact.phone.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </SectionCard>

                                            {/* PASSENGERS */}
                                            {flightData.passengers.map((passenger, index) => {
                                                const paxType = deriveType(passenger);
                                                const displayType: 'adult' | 'child' | 'infant' =
                                                    paxType === 'infant_without_seat' ? 'infant' : paxType;
                                                return (
                                                    <PassengerForm
                                                        key={passenger.id ?? index}
                                                        index={index}
                                                        type={displayType}
                                                        register={register}
                                                        errors={errors}
                                                        control={control}
                                                    />
                                                );
                                            })}

                                            {/* PAYMENT */}
                                            <PaymentForm
                                                register={register}
                                                errors={errors}
                                                setValue={setValue}
                                                watch={watch}
                                            />

                                            {/* SUBMIT */}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="group relative w-full py-4 font-bold text-sm uppercase tracking-wider rounded-xl text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-2xl shadow-gray-900/15 active:scale-[0.98]"
                                            >
                                                {isSubmitting ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                                                ) : (
                                                    <><ShieldCheck className="w-4 h-4 text-emerald-400" />Review & Confirm Booking<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                                )}
                                            </button>

                                            {/* TRUST BADGES */}
                                            <div className="flex items-center justify-center gap-6 pt-2">
                                                {[
                                                    { icon: Shield, label: 'SSL Secure' },
                                                    { icon: Globe,  label: 'IATA Certified' },
                                                    { icon: Lock,   label: 'PCI Compliant' },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        <item.icon className="w-3 h-3 text-gray-300" />
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* RIGHT: Summary */}
                                <div className="lg:col-span-1 lg:sticky lg:top-20 h-fit">
                                    <BookingSummary passengers={summaryCounts} flight={flightData} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Confirmation Modal */}
            {flightData && (
                <PaymentModal
                    isOpen={isModalOpen}
                    onClose={() => { if (!isSubmitting) setIsModalOpen(false); }}
                    onConfirm={handleConfirmBooking}
                    price={`${flightData.price?.currency ?? 'USD'} ${(flightData.price?.finalPrice ?? 0).toLocaleString()}`}
                    isProcessing={isSubmitting}
                    isInstantPayment={requiresInstantPayment}
                    flightData={flightData}
                    formData={pendingFormData}
                />
            )}
        </>
    );
}

// ──────────────────────────────────────────────
// EXPORT
// ──────────────────────────────────────────────
export default function CheckoutPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <CheckoutContent />
        </Suspense>
    );
}