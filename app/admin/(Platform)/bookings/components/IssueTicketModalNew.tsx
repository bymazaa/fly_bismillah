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

// ==========================================
// TYPES
// ==========================================

interface PaymentSourceInfo {
  holderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: null;
  billingAddress?: {
    zipCode?: string;
    [key: string]: any;
  };
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

// ==========================================
// COMPONENT
// ==========================================

export default function IssueTicketModalNew({
  open,
  onClose,
  onSuccess,
  bookingId,
  pnr,
  finance,
  paymentSource,
}: IssueTicketModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "balance">(
    "card"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // ──── Balance Issue Handler ────
  const handleIssueWithBalance = async () => {
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
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to issue ticket";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] rounded-2xl border border-gray-200/70 bg-white shadow-2xl flex flex-col"
        style={{ isolation: "isolate" }}
      >
        {/* ──── Header ──── */}
        <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg">
              <TicketCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">
                Issue Ticket
              </h3>
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
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ──── Body ──── */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Amount Summary */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-gray-50/30 p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Total Amount
              </span>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {paymentMethod === "balance"
                  ? "Using agency balance"
                  : "Client pays via Duffel card"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 tabular-nums">
                {finance.currency}{" "}
                {paymentMethod === "balance"
                  ? finance.duffelTotal
                  : finance.clientTotal}
              </p>
              <p className="text-[10px] text-gray-400">
                Taxes & fees included
              </p>
            </div>
          </div>

          {/* ══════ Payment Methods ══════ */}
          <div className="space-y-3">
            {/* ── 1. Duffel Card Payment ── */}
            <div
              className={cn(
                "relative rounded-xl border-2 transition-all",
                paymentMethod === "card"
                  ? "border-sky-500/70 bg-sky-50/20"
                  : "border-gray-200/70 bg-white hover:border-gray-300 cursor-pointer"
              )}
              onClick={() => {
                if (paymentMethod !== "card") setPaymentMethod("card");
              }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
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
                        Secure card payment with 3D Secure via Duffel.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      DUFFEL
                    </span>
                    <span className="text-[9px] text-gray-400">
                      PCI • 3DS
                    </span>
                  </div>
                </div>

                {paymentMethod === "card" && (
                  <div
                    className="mt-3 pt-3 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <DuffelCardPayment
                      bookingId={bookingId}
                      amount={Number(finance.clientTotal)}
                      currency={finance.currency}
                      onSuccess={onSuccess}
                      cardInfo={{
                        holderName: paymentSource?.holderName,
                        cardNumber: paymentSource?.cardNumber,
                        expiryDate: paymentSource?.expiryDate,
                        zipCode:
                          paymentSource?.billingAddress?.zipCode,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── 2. Duffel Balance ── */}
            <div
              onClick={() => setPaymentMethod("balance")}
              className={cn(
                "relative cursor-pointer rounded-xl border-2 transition-all",
                paymentMethod === "balance"
                  ? "border-gray-600/70 bg-gray-50/50"
                  : "border-gray-200/70 bg-white hover:border-gray-300"
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
                        Deduct from your agency wallet. Ideal for net
                        fares or corporate bookings.
                      </p>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-amber-900">
              Confirming will immediately issue the ticket and charge the
              selected source. This cannot be undone — airline
              change/refund rules will apply.
            </p>
          </div>
        </div>

        {/* ──── Footer ──── */}
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-50 bg-gray-50/40 px-6 py-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl border-gray-200 px-5 text-[13px] font-semibold text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </Button>

          {/* Balance → Confirm Button */}
          {paymentMethod === "balance" && (
            <Button
              onClick={handleIssueWithBalance}
              disabled={isProcessing}
              className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all hover:from-gray-900 hover:to-gray-950 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Confirm & Issue
                </span>
              )}
            </Button>
          )}

          {/* Card → Hint (DuffelPayments has its own button) */}
          {paymentMethod === "card" && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>Use the payment form above to proceed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}