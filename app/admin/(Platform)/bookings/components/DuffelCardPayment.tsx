'use client';

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    AlertCircle,
    CreditCard,
    RefreshCw,
    Lock,
    CheckCircle,
    Copy,
    Check,
    MapPin,
    User,
    Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import dynamic from 'next/dynamic';
const DuffelPayments = dynamic(
    () => import('@duffel/components').then((mod) => mod.DuffelPayments),
    { ssr: false },
);
export interface DuffelCardPaymentProps {
    bookingId: string;
    amount: number;
    currency: string;
    onSuccess: () => void;
    onError?: (error: any) => void;
    cardInfo?: {
        holderName?: string;
        cardNumber?: string;
        expiryDate?: string;
        zipCode?: string;
    };
}

function useCopy(timeout = 1500) {
    const [copied, setCopied] = useState(false);
    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Card number copied');
        setTimeout(() => setCopied(false), timeout);
    };
    return { copied, copy };
}

export default function DuffelCardPayment({
    bookingId,
    amount,
    currency,
    onSuccess,
    onError,
    cardInfo,
}: DuffelCardPaymentProps) {
    const [clientToken, setClientToken] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isIssuing, setIsIssuing] = useState(false);
    const { copied, copy } = useCopy();

    // ──── Fetch Client Token ────
    const fetchClientToken = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('/api/duffel/payment-intent', {
                bookingId,
                amount,
                currency,
            });
            if (res.data.success && res.data.clientToken) {
                setClientToken(res.data.clientToken);
                setPaymentIntentId(res.data.paymentIntentId || null);
            } else {
                throw new Error(res.data.message || 'Failed to create payment session');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to initialize payment');
            onError?.(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClientToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    // ──── After Payment → Confirm Intent → Issue Ticket ────
    const handleSuccessfulPayment = async () => {
        setIsIssuing(true);
        toast.success('Payment captured! Issuing ticket...');

        try {
            // Step 1: Confirm payment intent with Duffel
            if (paymentIntentId) {
                try {
                    await axios.post('/api/duffel/confirm-payment', {
                        bookingId,
                        paymentIntentId,
                    });
                } catch (confirmErr: any) {
                    console.warn(
                        'Payment confirm API failed (may already be confirmed):',
                        confirmErr?.message,
                    );
                    // Non-critical — continue to issue ticket
                }
            }

            // Step 2: Issue ticket
            const res = await axios.post('/api/flights/issue-ticket', {
                bookingId,
                paymentMethod: 'card',
            });

            if (res.data.success) {
                toast.success(res.data.message || 'Ticket issued successfully!');
                onSuccess();
            } else {
                throw new Error(res.data.message || 'Ticket issuance failed');
            }
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ||
                    err.message ||
                    'Ticket issuance failed. Contact support.',
            );
            onError?.(err);
        } finally {
            setIsIssuing(false);
        }
    };

    const handleFailedPayment = (paymentError: any) => {
        console.error('Duffel payment error:', paymentError);
        toast.error('Payment failed. Check card details and try again.');
        onError?.(paymentError);
    };

    const formatCardNumber = (num: string) => {
        return (
            num
                .replace(/\s/g, '')
                .match(/.{1,4}/g)
                ?.join(' ') || num
        );
    };

    // ═══════════════ LOADING ═══════════════
    if (loading) {
        return (
            <div className="flex flex-col items-center gap-3 py-12">
                <div className="relative">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                    <Lock className="absolute inset-0 m-auto h-2.5 w-2.5 text-gray-400" />
                </div>
                <p className="text-[11px] text-gray-400">Setting up payment…</p>
            </div>
        );
    }

    // ═══════════════ ERROR ═══════════════
    if (error || !clientToken) {
        return (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
                <AlertCircle className="h-6 w-6 text-rose-400" />
                <p className="text-[12px] font-medium text-gray-600">
                    {error || 'Could not initialize payment'}
                </p>
                <button
                    onClick={fetchClientToken}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-[11px] font-semibold text-white hover:bg-gray-800 active:scale-[0.97] cursor-pointer"
                >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                </button>
            </div>
        );
    }

    // ═══════════════ ISSUING ═══════════════
    if (isIssuing) {
        return (
            <div className="flex flex-col items-center gap-3 py-12">
                <div className="relative">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    <CheckCircle className="absolute inset-0 m-auto h-2.5 w-2.5 text-emerald-600" />
                </div>
                <div className="text-center">
                    <p className="text-[12px] font-semibold text-emerald-700">Payment successful</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Issuing ticket…</p>
                </div>
            </div>
        );
    }

    // ═══════════════ PAYMENT FORM ═══════════════
    const hasCardInfo =
        cardInfo && (cardInfo.cardNumber || cardInfo.holderName || cardInfo.expiryDate);

    return (
        <div className="space-y-4">
            {/* ── Saved Card Details ── */}
            {hasCardInfo && (
                <div className="rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                            Customer Card
                        </p>
                        <CreditCard className="h-4 w-4 text-gray-500" />
                    </div>

                    {cardInfo?.cardNumber && (
                        <div className="mb-4">
                            <button
                                onClick={() => copy(cardInfo.cardNumber!)}
                                className="group flex items-center gap-3 w-full text-left cursor-pointer transition-all hover:opacity-80 active:scale-[0.99]"
                                title="Click to copy"
                            >
                                <span className="font-mono text-[17px] font-bold tracking-[0.2em] text-white leading-none">
                                    {formatCardNumber(cardInfo.cardNumber)}
                                </span>
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-gray-400 transition-all group-hover:bg-white/20 group-hover:text-white shrink-0">
                                    {copied ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                        <Copy className="h-3 w-3" />
                                    )}
                                </span>
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                        {cardInfo?.holderName && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <User className="h-2.5 w-2.5 text-gray-500" />
                                    <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-500">
                                        Name
                                    </p>
                                </div>
                                <p className="text-[11px] font-semibold text-gray-200 uppercase truncate">
                                    {cardInfo.holderName.toUpperCase()}
                                </p>
                            </div>
                        )}

                        {cardInfo?.expiryDate && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-2.5 w-2.5 text-gray-500" />
                                    <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-500">
                                        Expires
                                    </p>
                                </div>
                                <p className="font-mono text-[11px] font-semibold text-gray-200">
                                    {cardInfo.expiryDate}
                                </p>
                            </div>
                        )}

                        {cardInfo?.zipCode && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-2.5 w-2.5 text-gray-500" />
                                    <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-500">
                                        Zip Code
                                    </p>
                                </div>
                                <p className="font-mono text-[11px] font-semibold text-gray-200">
                                    {cardInfo.zipCode}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Duffel Payment Element ── */}
            <div className=" border rounded-xl border-gray-200/80 bg-white shadow-md shadow-gray-100/80">
              
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 shadow-sm">
                            <CreditCard className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-gray-800">Payment Details</p>
                            <p className="text-[9px] text-gray-400">All fields are required</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-100">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-600">
                            Secure
                        </span>
                    </div>
                </div>

                {/* <div className="mx-5 h-px bg-gray-100" /> */}

                <div
                   className=' p-2 '
                 
                >
                    <DuffelPayments
                        paymentIntentClientToken={clientToken}
                        onSuccessfulPayment={handleSuccessfulPayment}
                        onFailedPayment={handleFailedPayment}
                        
                    />
                </div>

            </div>
        </div>
    );
}
