"use client";

import React, { useState } from "react";
import {
    Loader2,
    X,
    TicketCheck,
    Wallet,
    AlertTriangle,
    Sparkles,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DuffelCardPayment from "./DuffelCardPayment";

interface PaymentSourceInfo {
    holderName: string;
    cardNumber: string;
    expiryDate: string;
    cvv: null;
    billingAddress?: { zipCode?: string; [key: string]: any };
    zipCode?: string | null;
    error?: string;
}

interface FinanceInfo {
    basePrice: string;
    tax: string;
    clientTotal: string;
    currency: string;
    yourMarkup: number;
    duffelTotal: string;
}

export interface IssueTicketModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    bookingId: string;
    bookingRef: string;
    pnr: string;
    finance: FinanceInfo;
    paymentSource?: PaymentSourceInfo | null;
}

export default function IssueTicketModalNew({
    open,
    onClose,
    onSuccess,
    bookingId,
    pnr,
    finance,
    paymentSource,
}: IssueTicketModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<"card" | "balance">("card");
    const [isProcessing, setIsProcessing] = useState(false);

    // ── Safe values ──
    const clientAmount = Number(finance?.clientTotal) || 0;
    const duffelAmount = Number(finance?.duffelTotal) || 0;
    const currency = finance?.currency || "GBP";
    const displayAmount = paymentMethod === "balance" ? duffelAmount : clientAmount;

    const handleIssueWithBalance = async () => {
        if (duffelAmount <= 0) {
            toast.error("Invalid amount. Cannot process payment.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await axios.post("/api/flights/issue-ticket", {
                bookingId,
                paymentMethod: "balance",
            });
            if (res.data.success) {
                toast.success("Ticket Issued Successfully!");
                onSuccess();
            } else {
                throw new Error(res.data.message || "Failed to issue ticket");
            }
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || error.message || "Failed to issue ticket"
            );
        } finally {
            setIsProcessing(false);
        }
    };

    if (!open) return null;

    // ── Validate finance data ──
    const hasValidCardAmount = clientAmount > 0 && currency;
    const hasValidBalanceAmount = duffelAmount > 0 && currency;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="w-full max-w-md max-h-[90vh] rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col">

                {/* ──── Header ──── */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 shadow">
                            <TicketCheck className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Issue Ticket</h3>
                            <p className="text-[11px] text-gray-400">
                                PNR:{" "}
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-600">
                                    {pnr}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ──── Body ──── */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain">

                    {/* Amount */}
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Total Amount
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                {paymentMethod === "balance"
                                    ? "From agency balance"
                                    : "Client card via Duffel"}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 tabular-nums">
                                {currency} {displayAmount.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-gray-400">Taxes included</p>
                        </div>
                    </div>

                    {/* ══════ Payment Methods ══════ */}
                    <div className="space-y-3">

                        {/* ── Card ── */}
                        <div
                            className={cn(
                                "rounded-xl border-2 transition-all",
                                paymentMethod === "card"
                                    ? "border-sky-500/60 bg-sky-50/20"
                                    : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                            )}
                            onClick={() => paymentMethod !== "card" && setPaymentMethod("card")}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-1">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                "mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 shrink-0",
                                                paymentMethod === "card"
                                                    ? "border-sky-600"
                                                    : "border-gray-300"
                                            )}
                                        >
                                            {paymentMethod === "card" && (
                                                <div className="h-2 w-2 rounded-full bg-sky-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-gray-900">
                                                Duffel Card Payment
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Secure card payment with 3D Secure
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white shrink-0">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        DUFFEL
                                    </span>
                                </div>

                                {paymentMethod === "card" && (
                                    <div
                                        className="mt-3 pt-3 border-t border-gray-100"
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        {hasValidCardAmount ? (
                                            <DuffelCardPayment
                                                bookingId={bookingId}
                                                amount={clientAmount}
                                                currency={currency}
                                                onSuccess={onSuccess}
                                                cardInfo={{
                                                    holderName: paymentSource?.holderName,
                                                    cardNumber: paymentSource?.cardNumber,
                                                    expiryDate: paymentSource?.expiryDate,
                                                    zipCode:
                                                        paymentSource?.billingAddress?.zipCode ||
                                                        paymentSource?.zipCode ||
                                                        undefined,
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                                <span>
                                                    Invalid payment data (amount: {clientAmount}, currency: {currency || 'missing'}).
                                                    Please go back and try again.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Balance ── */}
                        <div
                            onClick={() => setPaymentMethod("balance")}
                            className={cn(
                                "cursor-pointer rounded-xl border-2 transition-all",
                                paymentMethod === "balance"
                                    ? "border-gray-600/60 bg-gray-50/50"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                            )}
                        >
                            <div className="flex items-start gap-3 p-4">
                                <div
                                    className={cn(
                                        "mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 shrink-0",
                                        paymentMethod === "balance"
                                            ? "border-gray-700"
                                            : "border-gray-300"
                                    )}
                                >
                                    {paymentMethod === "balance" && (
                                        <div className="h-2 w-2 rounded-full bg-gray-700" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-[13px] font-bold text-gray-900">
                                                Duffel Balance
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-gray-500">
                                                Deduct from agency wallet
                                            </p>
                                        </div>
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                            <Wallet className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-amber-800">
                            This will immediately issue the ticket and charge the selected source.
                            Cannot be undone.
                        </p>
                    </div>
                </div>

                {/* ──── Footer ──── */}
                <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 px-5 py-3.5 shrink-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-9 cursor-pointer rounded-xl border-gray-200 px-5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>

                    {paymentMethod === "balance" && (
                        <Button
                            onClick={handleIssueWithBalance}
                            disabled={isProcessing || !hasValidBalanceAmount}
                            className="h-9 cursor-pointer rounded-xl bg-gray-900 px-5 text-xs font-bold text-white hover:bg-gray-800 active:scale-[0.98] disabled:opacity-60"
                        >
                            {isProcessing ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Processing…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="h-3 w-3" />
                                    Confirm & Issue
                                </span>
                            )}
                        </Button>
                    )}

                    {paymentMethod === "card" && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            <span>Use the form above to pay</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}