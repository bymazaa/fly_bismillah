"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plane,
  Clock,
  User,
  Mail,
  Phone,
  CreditCard,
  Wallet,
  Download,
  Copy,
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  Calendar,
  FileText,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  XCircle,
  Wifi,
  ArrowLeft,
  Shield,
  Sparkles,
  Users,
  Luggage,
  Info,
  TicketCheck,
  Ban,
  MapPin,
  Briefcase,
  Backpack,
  Package,
  Weight,
} from "lucide-react";
import { format, differenceInSeconds, parseISO } from "date-fns";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import IssueTicketModalNew from "../components/IssueTicketModalNew";

// ==========================================
// 1. TYPES
// ==========================================

interface BaggageDetail {
  type: string;
  label: string;
  icon: string;
  quantity: number;
  weightPerBag: number;
  totalWeight: number;
  weightUnit: string;
  isApprox: boolean;
  isIncluded: boolean;
  displayText: string;
}

interface BaggageInfo {
  summary: string;
  totalWeightDisplay: string;
  totalWeight: number;
  includedCount: number;
  hasChecked: boolean;
  hasCarryOn: boolean;
  hasPersonalItem: boolean;
  details: BaggageDetail[];
}

interface TripBaggage {
  summary: string;
  totalWeightDisplay: string;
  hasChecked: boolean;
  hasCarryOn: boolean;
  hasPersonalItem: boolean;
  includedCount: number;
  details: {
    type: string;
    label: string;
    icon: string;
    quantity: number;
    displayText: string;
    isIncluded: boolean;
  }[];
}

interface Segment {
  direction: string;
  sliceIndex: number;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  aircraft: string;
  origin: string;
  originCity: string;
  departingAt: string;
  destination: string;
  destinationCity: string;
  arrivingAt: string;
  duration: string;
  cabinClass: string;
  baggage: string;
  baggageInfo?: BaggageInfo;
}

interface AdminNote {
  note: string;
  addedBy: string;
  createdAt: string | null;
}

type BookingStatus =
  | "held"
  | "issued"
  | "cancelled"
  | "expired"
  | "processing"
  | "failed";

type PaymentStatus =
  | "pending"
  | "requires_action"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

interface BookingData {
  id: string;
  bookingRef: string;
  duffelOrderId: string;
  pnr: string;
  status: BookingStatus;
  tripType: "one_way" | "round_trip" | "multi_city";
  availableActions: string[];
  syncFailed?: boolean;
  policies: {
    cancellation: {
      allowed: boolean;
      penalty: string;
      note: string;
      timeline: string;
    };
    dateChange: {
      allowed: boolean;
      penalty: string;
      note: string;
      timeline: string;
    };
  };
  segments: Segment[];
  contact: { email: string; phone: string };
  passengers: {
    id: string;
    type: string;
    title: string;
    fullName: string;
    ticketNumber: string;
    gender: string;
    dob: string;
    carryingInfant: string;
  }[];
  finance: {
    basePrice: string;
    tax: string;
    clientTotal: string;
    currency: string;
    yourMarkup: number;
    duffelTotal: string;
  };
  paymentSource?: {
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
  } | null;
  documents?: {
    unique_identifier: string;
    docType: string;
    url: string;
    passenger_ids?: string[];
    passenger?: { id: string };
  }[];
  timings?: { deadline: string | null; priceExpiry?: string | null };
  retryCount?: number;
  canRetry?: boolean;
  paymentStatus: PaymentStatus;
  adminNotes: AdminNote[];
  tripBaggage?: TripBaggage;
  cancellation?: {
    id?: string | null;
    cancelled_at: string | null;
    refund_amount: string | null;
    refund_currency: string | null;
    penalty_amount: string | null;
    penalty_currency: string | null;
    refunded_at: string | null;
    raw?: any;
  } | null;
}

interface RefundAPIData {
  orderId: string;
  bookingRef: string;
  pnr: string | null;
  orderStatus: string | null;
  isLiveMode: boolean;
  financial: {
    totalAmount: number;
    baseAmount: number;
    taxAmount: number;
    currency: string;
    totalDisplay: string;
    baseDisplay: string;
    taxDisplay: string;
    markup: number;
  };
  refund: {
    isRefundable: boolean;
    penaltyAmount: number | null;
    penaltyCurrency: string;
    penaltyText: string;
    penaltyDisplay: string;
    estimatedRefund: number | null;
    estimatedRefundDisplay: string;
    breakdown: string;
  };
  change: {
    isChangeable: boolean;
    penaltyAmount: number | null;
    penaltyCurrency: string;
    penaltyText: string;
    penaltyDisplay: string;
  };
  payment: {
    awaitingPayment: boolean;
    paymentRequiredBy: string | null;
    priceGuaranteeExpiresAt: string | null;
  };
  cancellation: {
    cancelledAt: string | null;
    refundAmount: number | null;
    refundCurrency: string;
    refundTo: string | null;
    status: string | null;
  } | null;
  passengers: Array<{
    id: string;
    name: string;
    type: string;
    gender: string | null;
  }>;
  slices: Array<{
    origin: string | null;
    destination: string | null;
    departureAt: string | null;
    arrivingAt: string | null;
    airline: string | null;
    segments: number;
  }>;
  fetchedAt: string;
}

// ==========================================
// 2. HELPER COMPONENTS
// ==========================================

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const config: Record<
    string,
    { bg: string; text: string; ring: string; dot: string }
  > = {
    issued: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-200",
      dot: "bg-emerald-500",
    },
    held: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-200",
      dot: "bg-amber-500",
    },
    cancelled: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      ring: "ring-gray-200",
      dot: "bg-gray-400",
    },
    expired: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      ring: "ring-rose-200",
      dot: "bg-rose-500",
    },
    processing: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      ring: "ring-blue-200",
      dot: "bg-blue-500",
    },
    failed: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      ring: "ring-rose-200",
      dot: "bg-rose-500",
    },
  };
  const s = config[status] || config.cancelled;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1",
        s.bg,
        s.text,
        s.ring
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {status}
    </span>
  );
};

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const map: Record<
    PaymentStatus,
    { label: string; bg: string; text: string; ring: string; dot: string }
  > = {
    pending: {
      label: "Pending",
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-200",
      dot: "bg-amber-500",
    },
    requires_action: {
      label: "Action Required",
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-200",
      dot: "bg-amber-500",
    },
    authorized: {
      label: "Authorized",
      bg: "bg-blue-50",
      text: "text-blue-700",
      ring: "ring-blue-200",
      dot: "bg-blue-500",
    },
    captured: {
      label: "Captured",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-200",
      dot: "bg-emerald-500",
    },
    failed: {
      label: "Failed",
      bg: "bg-rose-50",
      text: "text-rose-700",
      ring: "ring-rose-200",
      dot: "bg-rose-500",
    },
    refunded: {
      label: "Refunded",
      bg: "bg-gray-100",
      text: "text-gray-600",
      ring: "ring-gray-200",
      dot: "bg-gray-400",
    },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1",
        s.bg,
        s.text,
        s.ring
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
};

const CopyButton = ({ text, label }: { text: string; label: string }) => (
  <button
    onClick={() => {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    }}
    className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-mono font-semibold text-gray-700 transition-all hover:bg-gray-100 cursor-pointer"
    title="Click to copy"
  >
    {text}
    <Copy className="h-3 w-3 text-gray-400 transition-colors group-hover:text-gray-700" />
  </button>
);

const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>("Loading...");

  useEffect(() => {
    if (!deadline) return;
    const calculateTime = () => {
      const diff = differenceInSeconds(new Date(deadline), new Date());
      if (diff <= 0) return "Expired";
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      return `${h}h ${m}m ${s}s`;
    };
    setTimeLeft(calculateTime());
    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft === "Expired")
    return (
      <span className="text-[13px] font-bold text-rose-600">Expired</span>
    );
  return (
    <span className="font-mono text-[14px] font-bold text-amber-700 tabular-nums tracking-tight">
      {timeLeft}
    </span>
  );
};

const BaggageTypeIcon = ({
  type,
  className,
}: {
  type: string;
  className?: string;
}) => {
  switch (type) {
    case "checked":
      return <Luggage className={className} />;
    case "carry_on":
      return <Briefcase className={className} />;
    case "personal_item":
      return <Backpack className={className} />;
    default:
      return <Package className={className} />;
  }
};

const BAGGAGE_STYLE: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  checked: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    ring: "ring-violet-200",
  },
  carry_on: {
    bg: "bg-sky-50",
    text: "text-sky-600",
    ring: "ring-sky-200",
  },
  personal_item: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    ring: "ring-teal-200",
  },
};

const getDefaultBaggageStyle = () => ({
  bg: "bg-gray-100",
  text: "text-gray-600",
  ring: "ring-gray-200",
});

const SegmentBaggageDisplay = ({
  baggageInfo,
  fallback,
}: {
  baggageInfo?: BaggageInfo;
  fallback: string;
}) => {
  if (
    !baggageInfo ||
    !baggageInfo.details ||
    baggageInfo.details.length === 0
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600 ring-1 ring-violet-200">
        <Luggage className="h-3 w-3" />
        {fallback || "Check Airline Rule"}
      </span>
    );
  }

  const includedBags = baggageInfo.details.filter((d) => d.isIncluded);
  const excludedBags = baggageInfo.details.filter((d) => !d.isIncluded);

  if (includedBags.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 ring-1 ring-amber-200">
        <AlertCircle className="h-3 w-3" />
        No Baggage Included
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {includedBags.map((bag, i) => {
        const style = BAGGAGE_STYLE[bag.type] || getDefaultBaggageStyle();
        return (
          <span
            key={i}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[10px] font-bold ring-1",
              style.bg,
              style.text,
              style.ring
            )}
            title={bag.displayText}
          >
            <BaggageTypeIcon type={bag.type} className="h-3 w-3" />
            <span>
              {bag.quantity}×{" "}
              {bag.totalWeight > 0
                ? `${bag.totalWeight}${bag.weightUnit}`
                : bag.label}
            </span>
            {bag.isApprox && (
              <span className="text-[8px] opacity-60">~</span>
            )}
          </span>
        );
      })}
      {excludedBags.length > 0 && (
        <span
          className="inline-flex items-center gap-1 rounded-sm bg-gray-50 px-2 py-1 text-[9px] font-medium text-gray-400 ring-1 ring-gray-200"
          title={excludedBags.map((b) => `No ${b.label}`).join(", ")}
        >
          <Info className="h-2.5 w-2.5" />
          {excludedBags.length} not included
        </span>
      )}
    </div>
  );
};

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================

export default function BookingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCard, setShowCard] = useState(false);

  // ── Refund state ──
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundData, setRefundData] = useState<RefundAPIData | null>(null);

  // ── Issue modal state ──
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  const openRefundModal = () => {
    setRefundModalOpen(true);
    if (!refundData && data?.id) {
      refreshRefundFromAirline();
    }
  };

  const refreshRefundFromAirline = async () => {
    if (!data) return;
    setRefundLoading(true);
    try {
      const res = await axios.get(
        `/api/dashboard/bookings/${data.id}/refund`
      );
      if (res.data.success) {
        setRefundData(res.data.data as RefundAPIData);
        toast.success("Refund information updated from airline");
      } else {
        toast.error(res.data.message || "Failed to fetch refund details");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to fetch refund details"
      );
    } finally {
      setRefundLoading(false);
    }
  };

  const fetchBooking = async () => {
    try {
      const res = await axios.get(`/api/dashboard/bookings/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch {
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const eTicketDoc =
    data?.documents?.find((doc) => doc.docType === "electronic_ticket") ||
    data?.documents?.[0];

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] gap-4">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-2xl shadow-sky-100">
            <Plane className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[13px] font-semibold text-gray-700">
            Retrieving flight details...
          </p>
          <p className="text-[11px] text-gray-400">
            Fetching booking information
          </p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
          <AlertCircle className="h-6 w-6 text-rose-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[15px] font-bold text-gray-900">
            Booking Unavailable
          </p>
          <p className="text-[12px] text-gray-400">
            Could not load booking information.
          </p>
        </div>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mt-2 h-9 rounded-xl border-gray-200 px-5 text-[12px] font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Go Back
        </Button>
      </div>
    );

  const canCancel = data.availableActions.includes("cancel");
  const canChange =
    data.availableActions.includes("change") ||
    data.availableActions.includes("update");

  const firstSeg = data.segments?.[0];
  const lastSeg = data.segments?.[data.segments.length - 1];

  const routeDisplay = (() => {
    if (!firstSeg || !lastSeg) {
      return { origin: "N/A", destination: "N/A", separator: "→" };
    }

    let origin = firstSeg.originCity || firstSeg.origin || "N/A";
    let destination = lastSeg.destinationCity || lastSeg.destination || "N/A";
    let separator = "→";

    if (data.tripType === "round_trip") {
      const outboundSegments = data.segments.filter(
        (s) => s.sliceIndex === 0
      );
      const mainDest = outboundSegments[outboundSegments.length - 1];
      if (mainDest) {
        destination =
          mainDest.destinationCity || mainDest.destination || "N/A";
      }
      separator = "↔";
    }
    return { origin, destination, separator };
  })();

  const firstDeparture = firstSeg?.departingAt
    ? parseISO(firstSeg.departingAt)
    : new Date();
  const lastArrival = lastSeg?.arrivingAt
    ? parseISO(lastSeg.arrivingAt)
    : new Date();

  const totalTripSeconds = differenceInSeconds(lastArrival, firstDeparture);
  const totalTripHours = Math.floor(totalTripSeconds / 3600);
  const totalTripMinutes = Math.floor((totalTripSeconds % 3600) / 60);
  const totalTripDurationLabel = firstSeg?.departingAt
    ? `${totalTripHours}h${totalTripMinutes ? ` ${totalTripMinutes}m` : ""}`
    : "N/A";

  const passengerCount = data.passengers.length;
  const passengerLabel =
    passengerCount === 1 ? "1 traveler" : `${passengerCount} travelers`;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:border-gray-300 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 shadow-2xl shadow-gray-100">
                    <Plane className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Booking Details
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
                  {routeDisplay.origin}{" "}
                  <span className="text-gray-300">
                    {routeDisplay.separator}
                  </span>{" "}
                  {routeDisplay.destination}
                </h1>
                <p className="text-[13px] text-gray-500">
                  {data.tripType.replace("_", " ")} •{" "}
                  {firstSeg?.departingAt
                    ? format(firstDeparture, "EEE, dd MMM yyyy")
                    : "Date unavailable"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <StatusBadge status={data.status} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                <Plane className="h-3 w-3" />
                {data.tripType.replace("_", " ")}
              </span>
            </div>
          </div>
        </header>

        {/* ═══════════════════ SYNC FAILED BANNER ═══════════════════ */}
        {data.syncFailed && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 shadow-2xl shadow-gray-100">
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 shadow-lg">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-amber-900">
                  Live airline sync unavailable
                </p>
                <p className="text-[11px] text-amber-700">
                  Showing last saved data. Duffel API did not respond —
                  ticket status, documents and deadline may be outdated.
                </p>
              </div>
              <button
                onClick={() => fetchBooking()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-all hover:bg-amber-50 cursor-pointer shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════ META BAR ═══════════════════ */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Ref
            </span>
            <CopyButton text={data.bookingRef} label="Reference" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              PNR
            </span>
            <CopyButton text={data.pnr || "N/A"} label="PNR" />
          </div>
          {data.duffelOrderId && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Duffel
              </span>
              <CopyButton text={data.duffelOrderId} label="Duffel ID" />
            </div>
          )}

          {firstSeg?.departingAt && lastSeg?.arrivingAt && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100 text-[11px] text-gray-500">
              <Calendar className="h-3.5 w-3.5 text-sky-500" />
              <span className="font-medium">
                {format(firstDeparture, "EEE, dd MMM")} –{" "}
                {format(lastArrival, "EEE, dd MMM")}
              </span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100 text-[11px] text-gray-500">
            <Users className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-medium">{passengerLabel}</span>
          </div>
          {firstSeg?.departingAt && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100 text-[11px] text-gray-500">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-medium">
                Total: {totalTripDurationLabel}
              </span>
            </div>
          )}

          {data.tripBaggage && data.tripBaggage.includedCount > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/70 bg-white px-3 py-2 shadow-2xl shadow-gray-100 text-[11px] text-gray-500">
              <Luggage className="h-3.5 w-3.5 text-violet-500" />
              <span className="font-medium">
                {data.tripBaggage.totalWeightDisplay !== "N/A"
                  ? data.tripBaggage.totalWeightDisplay
                  : data.tripBaggage.summary}
              </span>
            </div>
          )}
        </div>

        {/* ═══════════════════ DEADLINE BANNER ═══════════════════ */}
        {data.status === "held" && data.timings?.deadline && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 shadow-2xl shadow-gray-100">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 shadow-lg">
                  <Clock className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-amber-900">
                    Ticket Expires Soon
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Hold until{" "}
                    {format(
                      parseISO(data.timings.deadline),
                      "EEE, dd MMM hh:mm a"
                    )}
                  </p>
                </div>
              </div>
              <CountdownTimer deadline={data.timings.deadline} />
            </div>
          </div>
        )}

        {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* ═══════════════ LEFT COLUMN ═══════════════ */}
          <div className="space-y-6">
            {/* ──── Flight Itinerary ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 shadow-2xl shadow-gray-100">
                    <Plane className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Flight Itinerary
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {data.segments.length} segment
                      {data.segments.length > 1 ? "s" : ""}
                      {data.syncFailed && (
                        <span className="ml-1.5 text-amber-500 font-semibold">
                          (cached)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 ring-1 ring-sky-200 uppercase">
                  {data.tripType.replace("_", " ")}
                </span>
              </div>

              {data.segments.length === 0 ? (
                <div className="flex flex-col items-center gap-2.5 py-12 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
                    <AlertCircle className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-[12px] font-semibold text-gray-400">
                    Flight details unavailable
                  </p>
                  <p className="text-[11px] text-gray-300">
                    Sync failed — check Duffel dashboard directly
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.segments.map((seg, idx) => (
                    <div
                      key={idx}
                      className="p-6 transition-colors hover:bg-gray-50/30"
                    >
                      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                        <div className="flex items-center gap-3 md:w-36 md:flex-col md:items-start shrink-0">
                          {seg.airlineCode && (
                            <img
                              src={`https://pics.avs.io/200/200/${seg.airlineCode}.png`}
                              alt={seg.airlineCode}
                              className="h-10 w-10 object-contain"
                              onError={(e) =>
                                (e.currentTarget.style.display = "none")
                              }
                            />
                          )}
                          <div>
                            <p className="text-[13px] font-bold text-gray-900">
                              {seg.airline}
                            </p>
                            <p className="font-mono text-[11px] text-gray-500">
                              {seg.airlineCode && `${seg.airlineCode}-`}
                              {seg.flightNumber || "N/A"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {seg.aircraft}
                            </p>
                          </div>
                        </div>

                        <div className="relative flex-1 grid grid-cols-3 items-center gap-4">
                          <div className="text-left">
                            <p className="text-xl font-bold text-gray-900 sm:text-2xl tabular-nums">
                              {seg.departingAt
                                ? format(parseISO(seg.departingAt), "hh:mm a")
                                : "N/A"}
                            </p>
                            <p className="text-[13px] font-semibold text-gray-700">
                              {seg.origin}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {seg.departingAt
                                ? format(
                                    parseISO(seg.departingAt),
                                    "EEE, dd MMM"
                                  )
                                : ""}
                            </p>
                          </div>

                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-gray-400 mb-1.5 tabular-nums">
                              {seg.duration
                                ? seg.duration
                                    .replace("PT", "")
                                    .toLowerCase()
                                : "N/A"}
                            </span>
                            <div className="flex w-full items-center gap-1.5">
                              <div className="relative h-[2px] flex-1 rounded-full bg-gray-200">
                                <div className="absolute left-0 -top-[3px] h-2 w-2 rounded-full bg-gray-300" />
                                <div className="absolute right-0 -top-[3px] h-2 w-2 rounded-full bg-gray-300" />
                              </div>
                              <Plane className="h-3.5 w-3.5 shrink-0 rotate-90 text-gray-300" />
                            </div>
                            <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                              Direct
                            </span>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900 sm:text-2xl tabular-nums">
                              {seg.arrivingAt
                                ? format(
                                    parseISO(seg.arrivingAt),
                                    "hh:mm a"
                                  )
                                : "N/A"}
                            </p>
                            <p className="text-[13px] font-semibold text-gray-700">
                              {seg.destination}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {seg.arrivingAt
                                ? format(
                                    parseISO(seg.arrivingAt),
                                    "EEE, dd MMM"
                                  )
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3 border-t border-dashed border-gray-100 pt-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-sm bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 ring-1 ring-blue-200">
                            <User className="h-3 w-3" /> {seg.cabinClass}
                          </span>
                          {(seg.originCity || seg.destinationCity) && (
                            <span className="inline-flex items-center gap-1.5 rounded-sm bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600 ring-1 ring-gray-200">
                              <MapPin className="h-3 w-3" />
                              {seg.originCity || seg.origin}
                              <ArrowRight className="h-3 w-3" />
                              {seg.destinationCity || seg.destination}
                            </span>
                          )}
                          <SegmentBaggageDisplay
                            baggageInfo={seg.baggageInfo}
                            fallback={seg.baggage}
                          />
                        </div>

                        {seg.baggageInfo &&
                          seg.baggageInfo.totalWeight > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                              <Weight className="h-3 w-3" />
                              <span>
                                Total allowance:{" "}
                                <span className="font-semibold text-gray-600">
                                  {seg.baggageInfo.totalWeightDisplay}
                                </span>
                              </span>
                              {seg.baggageInfo.details.some(
                                (d) => d.isApprox && d.isIncluded
                              ) && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-600 ring-1 ring-amber-200">
                                  Estimated
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ──── Trip Baggage Summary ──── */}
            {data.tripBaggage &&
              data.tripBaggage.details &&
              data.tripBaggage.details.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                  <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-2xl shadow-gray-100">
                        <Luggage className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900">
                          Baggage Allowance
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          Included baggage for this trip
                        </p>
                      </div>
                    </div>
                    {data.tripBaggage.totalWeightDisplay !== "N/A" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-600 ring-1 ring-violet-200">
                        <Weight className="h-3 w-3" />
                        {data.tripBaggage.totalWeightDisplay}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {data.tripBaggage.details.map((bag, i) => {
                        const style =
                          BAGGAGE_STYLE[bag.type] ||
                          getDefaultBaggageStyle();
                        return (
                          <div
                            key={i}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm",
                              bag.isIncluded
                                ? "border-gray-200/70 bg-white"
                                : "border-gray-100 bg-gray-50/50 opacity-60"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                bag.isIncluded
                                  ? style.bg
                                  : "bg-gray-100"
                              )}
                            >
                              <BaggageTypeIcon
                                type={bag.type}
                                className={cn(
                                  "h-5 w-5",
                                  bag.isIncluded
                                    ? style.text
                                    : "text-gray-400"
                                )}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-bold text-gray-900">
                                {bag.label}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {bag.isIncluded ? (
                                  <span className="text-emerald-600 font-semibold">
                                    {bag.displayText}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">
                                    Not included
                                  </span>
                                )}
                              </p>
                            </div>
                            {bag.isIncluded && (
                              <div className="ml-auto">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Info className="h-3 w-3" />
                      <span>
                        Baggage allowance may vary per segment. Weights
                        marked with ~ are estimated based on fare class.
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {/* ──── Travelers ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-2xl shadow-gray-100">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Travelers
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {passengerLabel}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 tabular-nums ring-1 ring-indigo-200">
                  {passengerCount}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-white">
                      {["Name", "Type", "DOB", "Gender", "E-Ticket"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={cn(
                              "px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400",
                              i === 4 && "text-right"
                            )}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.passengers.map((p, idx) => (
                      <tr
                        key={idx}
                        className="transition-colors hover:bg-gray-50/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-[11px] font-bold text-gray-500">
                              {p.fullName.charAt(0)}
                            </div>
                            <div>
                              <span className="text-[13px] font-semibold text-gray-900">
                                {p.title && (
                                  <span className="text-gray-500 font-medium mr-1">
                                    {p?.title.toUpperCase()}.
                                  </span>
                                )}
                                {p.fullName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 ring-1 ring-indigo-200 capitalize whitespace-nowrap">
                            {p?.type?.replace("_", " ") ?? "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[12px] text-gray-500 tabular-nums">
                            {p.dob}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[12px] text-gray-500">
                            {p.gender === "m" || p.gender === "male"
                              ? "Male"
                              : "Female"}
                          </span>
                          {p.carryingInfant && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 ring-1 ring-amber-200">
                              +Infant: {p.carryingInfant}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.ticketNumber !== "Not Issued" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                              <CheckCircle className="h-3 w-3" />
                              {p.ticketNumber}
                            </span>
                          ) : (
                            <span className="text-[11px] italic text-gray-400">
                              Processing...
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ──── Fare Rules & Policies ──── */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Cancellation */}
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all",
                  data.policies.cancellation.allowed
                    ? "border-emerald-200/70 bg-gradient-to-br from-emerald-50/40 to-white shadow-2xl shadow-gray-100"
                    : "border-rose-200/70 bg-gradient-to-br from-rose-50/40 to-white shadow-2xl shadow-gray-100"
                )}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl",
                          data.policies.cancellation.allowed
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                        )}
                      >
                        {data.policies.cancellation.allowed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <ShieldAlert className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-gray-900">
                          Cancellation
                        </h4>
                        <p
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            data.policies.cancellation.allowed
                              ? "text-emerald-600"
                              : "text-rose-600"
                          )}
                        >
                          {data.policies.cancellation.allowed
                            ? "Refundable"
                            : "Non-Refundable"}
                        </p>
                      </div>
                    </div>
                    {data.policies.cancellation.allowed && (
                      <div className="text-right">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Penalty
                        </span>
                        <span className="text-[13px] font-bold text-gray-900">
                          {data.policies.cancellation.penalty}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border p-3 text-[12px] mb-3",
                      data.policies.cancellation.allowed
                        ? "border-emerald-100 bg-emerald-50/50 text-emerald-800"
                        : "border-rose-100 bg-rose-50/50 text-rose-800"
                    )}
                  >
                    {data.policies.cancellation.allowed
                      ? "You can cancel this ticket and receive a refund after deducting the penalty fee."
                      : "This ticket cannot be cancelled. No refund will be issued."}
                  </div>

                  <div className="flex items-center gap-2 border-t border-dashed border-gray-200 pt-3 text-[11px] text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Processing:{" "}
                      <span className="font-semibold text-gray-700">
                        {data.policies.cancellation.timeline ||
                          "7-15 Working Days"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Date Change */}
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all",
                  data.policies.dateChange.allowed
                    ? "border-blue-200/70 bg-gradient-to-br from-blue-50/40 to-white shadow-2xl shadow-gray-100"
                    : "border-rose-200/70 bg-gradient-to-br from-rose-50/40 to-white shadow-2xl shadow-gray-100"
                )}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl",
                          data.policies.dateChange.allowed
                            ? "bg-blue-100 text-blue-600"
                            : "bg-rose-100 text-rose-600"
                        )}
                      >
                        {data.policies.dateChange.allowed ? (
                          <RefreshCw className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-gray-900">
                          Date Change
                        </h4>
                        <p
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            data.policies.dateChange.allowed
                              ? "text-blue-600"
                              : "text-rose-600"
                          )}
                        >
                          {data.policies.dateChange.allowed
                            ? "Changeable"
                            : "Non-Changeable"}
                        </p>
                      </div>
                    </div>
                    {data.policies.dateChange.allowed && (
                      <div className="text-right">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Penalty
                        </span>
                        <span className="text-[13px] font-bold text-gray-900">
                          {data.policies.dateChange.penalty}
                        </span>
                        {!data.policies.dateChange.penalty.includes(
                          data.finance.currency
                        ) && (
                          <span className="block text-[9px] font-medium text-amber-600 mt-0.5">
                            *Converted at payment
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border p-3 text-[12px] mb-3",
                      data.policies.dateChange.allowed
                        ? "border-blue-100 bg-blue-50/50 text-blue-800"
                        : "border-rose-100 bg-rose-50/50 text-rose-800"
                    )}
                  >
                    {data.policies.dateChange.allowed
                      ? "Date change is permitted. Fare difference + penalty fee will apply."
                      : "Flight dates cannot be modified for this booking class."}
                  </div>

                  <div className="flex items-center gap-2 border-t border-dashed border-gray-200 pt-3 text-[11px] text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Processing:{" "}
                      <span className="font-semibold text-gray-700">
                        {data.policies.dateChange.timeline ||
                          "Instant / 24 Hours"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
          <div className="space-y-6">
            {/* ──── Booking Status ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl shadow-2xl shadow-gray-100",
                    data.status === "issued"
                      ? "bg-emerald-600"
                      : data.status === "held"
                        ? "bg-amber-500"
                        : "bg-gray-400"
                  )}
                >
                  {data.status === "issued" ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : data.status === "held" ? (
                    <Clock className="h-4 w-4 text-white" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Status
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {data.status === "issued"
                      ? "Ticketed & confirmed"
                      : data.status === "held"
                        ? "On hold – awaiting payment"
                        : data.status === "cancelled"
                          ? "Booking cancelled"
                          : data.status === "expired"
                            ? "Hold expired"
                            : data.status === "processing"
                              ? "Being processed"
                              : "Booking failed"}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="rounded-xl border border-gray-200/70 bg-gray-50/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate">{data.contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span>{data.contact.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ──── Payment Summary ──── */}
            <div className="sticky top-6 overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 shadow-2xl shadow-gray-100">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Payment
                    </h3>
                    <p className="text-[11px] text-gray-400">Order summary</p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {data.finance.currency}
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-[12px] text-gray-500">
                    Payment Status
                  </span>
                  <div className="flex items-center gap-2">
                    <PaymentStatusBadge status={data.paymentStatus} />
                    {(data.status === "cancelled" ||
                      data.paymentStatus === "refunded") && (
                      <button
                        onClick={openRefundModal}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100 cursor-pointer ring-1 ring-rose-200"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Refund
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500">Base Fare + Taxes</span>
                    <span className="font-medium text-gray-700 tabular-nums">
                      {data.finance.currency} {data.finance.duffelTotal}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500"> Markup</span>
                    <span className="font-medium text-gray-700 tabular-nums">
                      {data.finance.currency}{" "}
                      {String(data.finance.yourMarkup)}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {data.status === "held"
                        ? "To be charged"
                        : "Total paid"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                        data.status === "held"
                          ? "bg-amber-50 text-amber-600 ring-amber-200"
                          : "bg-emerald-50 text-emerald-600 ring-emerald-200"
                      )}
                    >
                      {data.status === "held"
                        ? "Pending issue"
                        : "Ticket issued"}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-[13px] font-semibold text-gray-700">
                      Total
                    </span>
                    <span className="text-xl font-bold text-gray-900 tabular-nums">
                      {data.finance.currency} {data.finance.clientTotal}
                    </span>
                  </div>
                </div>

                {data.paymentSource && !data.paymentSource.error && (
                  <div className="relative overflow-hidden rounded-xl bg-gray-900 text-gray-300 shadow-lg mt-2">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gray-800/50 blur-2xl" />
                    <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-blue-900/20 blur-xl" />

                    <div className="relative px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-6 w-8 grid-cols-2 gap-[1px] rounded bg-gradient-to-br from-amber-200 to-amber-500 border border-amber-600/30 p-[2px] opacity-90">
                            <div className="border-r border-amber-700/40 h-full" />
                            <div className="h-full" />
                          </div>
                          <Wifi className="h-4 w-4 rotate-90 text-gray-600" />
                        </div>
                        <button
                          onClick={() => setShowCard(!showCard)}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-gray-700/50 bg-gray-800/50 px-2 py-1 text-[10px] font-medium transition-colors hover:bg-gray-800 cursor-pointer"
                        >
                          <span className="text-gray-400 group-hover:text-white transition-colors">
                            {showCard ? "Hide" : "Show"}
                          </span>
                          {showCard ? (
                            <EyeOff className="h-3 w-3 text-gray-400 group-hover:text-white" />
                          ) : (
                            <Eye className="h-3 w-3 text-gray-400 group-hover:text-white" />
                          )}
                        </button>
                      </div>

                      <p className="mb-4 pl-1 font-mono text-lg tracking-widest text-white drop-shadow-sm tabular-nums">
                        {showCard
                          ? data.paymentSource.cardNumber
                              .match(/.{1,4}/g)
                              ?.join(" ") ||
                            data.paymentSource.cardNumber
                          : `•••• •••• •••• ${data.paymentSource.cardNumber.slice(-4)}`}
                      </p>

                      <div className="flex items-end justify-between border-t border-gray-800/50 pt-2">
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
                            Holder
                          </p>
                          <p className="max-w-[140px] truncate text-[11px] font-medium uppercase text-gray-200">
                            {data.paymentSource.holderName || "CLIENT"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-0.5">
                          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
                            Expires
                          </p>
                          <p className="font-mono text-[11px] font-medium text-amber-50 tabular-nums">
                            {data.paymentSource.expiryDate || "MM/YY"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {data.paymentSource?.error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-[11px] text-rose-600">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span className="font-semibold">
                        {data.paymentSource.error}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 pt-2">
                  {data.status === "issued" ? (
                    <>
                      {eTicketDoc?.url && (
                        <a
                          href={eTicketDoc.url}
                          target="_blank"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 py-2.5 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all hover:from-gray-900 hover:to-gray-950 hover:shadow-md active:scale-[0.98] cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                          Download E-Ticket
                        </a>
                      )}

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          disabled={
                            !canChange ||
                            !data.policies.dateChange.allowed
                          }
                          onClick={() => {
                            alert(
                              "Date change flow not available — please use Duffel dashboard to process date change"
                            );
                          }}
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[11px] font-bold transition-all",
                            canChange &&
                              data.policies.dateChange.allowed
                              ? "border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
                          )}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Reschedule
                        </button>
                        <button
                          disabled={
                            !canCancel ||
                            !data.policies.cancellation.allowed
                          }
                          onClick={() => {
                            toast.error(
                              "Cancellation flow not available — please use Duffel dashboard to process cancellation"
                            );
                          }}
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[11px] font-bold transition-all",
                            canCancel &&
                              data.policies.cancellation.allowed
                              ? "border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
                          )}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>

                      {(!data.policies.cancellation.allowed ||
                        !data.policies.dateChange.allowed) && (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200/70 bg-gray-50/30 py-2 text-[10px] text-gray-400">
                          <Info className="h-3 w-3" />
                          {!data.policies.cancellation.allowed &&
                          !data.policies.dateChange.allowed
                            ? "Non-Refundable & Non-Changeable"
                            : !data.policies.cancellation.allowed
                              ? "Cancellation not allowed"
                              : "Date change not allowed"}
                        </div>
                      )}
                    </>
                  ) : data.status === "held" ? (
                    <>
                      {data.canRetry === false && (
                        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2 text-[11px] text-rose-600 mb-2">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-semibold">
                            Max retry limit (5) reached. Cannot issue this
                            booking.
                          </span>
                        </div>
                      )}
                      <Button
                        onClick={() => setIssueModalOpen(true)}
                        disabled={data.canRetry === false}
                        className="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all hover:from-gray-900 hover:to-gray-950 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center gap-2">
                          <TicketCheck className="h-4 w-4" />
                          Issue Ticket
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200/70 py-6 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50">
                        <AlertCircle className="h-4 w-4 text-gray-300" />
                      </div>
                      <p className="text-[12px] font-semibold text-gray-400">
                        Booking is {data.status}
                      </p>
                      <p className="text-[10px] text-gray-300">
                        No actions available
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200/70 bg-gray-50/30 p-3 mt-2">
                  <div className="flex gap-2">
                    <Info className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
                    <div className="text-[11px] w-full">
                      <span className="font-bold text-gray-700">
                        Admin notes:
                      </span>
                      {data.adminNotes && data.adminNotes.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {[...data.adminNotes]
                            .reverse()
                            .slice(0, 15)
                            .map((note, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg border border-gray-100 bg-white p-2.5 space-y-1"
                              >
                                <p className="text-[11px] text-gray-600 leading-relaxed">
                                  {note.note}
                                </p>
                                <div className="flex items-center gap-2 text-[9px] text-gray-400">
                                  <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono font-semibold text-gray-500">
                                    {note.addedBy}
                                  </span>
                                  {note.createdAt && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {format(
                                          parseISO(note.createdAt),
                                          "dd MMM yyyy, hh:mm a"
                                        )}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic ml-1">
                          No admin notes added.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ REFUND MODAL ═══════════════════ */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 shadow-lg">
                  <RefreshCw className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Refund & Cancellation
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {data?.bookingRef} • {data?.pnr || "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {refundLoading && !refundData && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                  <p className="text-[12px] font-semibold text-gray-400">
                    Fetching from airline...
                  </p>
                </div>
              )}

              {!refundLoading && !refundData && (
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200/70 py-10 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
                    <AlertCircle className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-[12px] font-semibold text-gray-400">
                    Could not fetch refund details
                  </p>
                  <p className="text-[11px] text-gray-300 max-w-[240px]">
                    The airline may not have responded. Try again.
                  </p>
                  <button
                    onClick={refreshRefundFromAirline}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[11px] font-bold text-gray-600 transition-all hover:bg-gray-50 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                </div>
              )}

              {refundData && (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1",
                          refundData.orderStatus === "cancelled"
                            ? "bg-rose-50 text-rose-700 ring-rose-200"
                            : "bg-gray-100 text-gray-600 ring-gray-200"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            refundData.orderStatus === "cancelled"
                              ? "bg-rose-500"
                              : "bg-gray-400"
                          )}
                        />
                        {refundData.orderStatus || "Unknown"}
                      </span>
                      {!refundData.isLiveMode && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 ring-1 ring-amber-200">
                          TEST MODE
                        </span>
                      )}
                    </div>
                    {refundData.cancellation ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {refundData.cancellation.status || "Cancelled"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 ring-1 ring-blue-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Active
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200/70 bg-gray-50/30 p-4 space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                      Order Financial Summary
                    </p>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-500">Base Fare + Taxes</span>
                      <span className="font-medium text-gray-700 tabular-nums">
                        {refundData.financial.currency}{" "}
                        {refundData.financial.totalAmount}
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-500">Service Charge</span>
                      <span className="font-medium text-gray-700 tabular-nums">
                        {refundData.financial.currency}{" "}
                        {refundData.financial?.markup || 10}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex justify-between text-[13px]">
                      <span className="font-bold text-gray-700">
                        Total Paid
                      </span>
                      <span className="font-bold text-gray-900 tabular-nums">
                        {refundData.financial.currency}{" "}
                        {refundData.financial.totalAmount +
                          refundData.financial.markup}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border p-4",
                      refundData.refund.isRefundable
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-rose-200 bg-rose-50/40"
                    )}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          refundData.refund.isRefundable
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                        )}
                      >
                        {refundData.refund.isRefundable ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-[13px] font-bold",
                            refundData.refund.isRefundable
                              ? "text-emerald-800"
                              : "text-rose-800"
                          )}
                        >
                          {refundData.refund.isRefundable
                            ? "Refundable"
                            : "Non-Refundable"}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {refundData.refund.penaltyText}
                        </p>
                      </div>
                    </div>

                    {refundData.refund.isRefundable && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="rounded-lg border border-gray-200/70 bg-white p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            Penalty
                          </p>
                          <p className="mt-1 text-[14px] font-bold text-gray-900 tabular-nums">
                            {refundData.refund.penaltyDisplay}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/50 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                            Est. Refund
                          </p>
                          <p className="mt-1 text-[14px] font-bold text-emerald-700 tabular-nums">
                            {refundData.refund.estimatedRefundDisplay}
                          </p>
                        </div>
                      </div>
                    )}

                    {refundData.refund.breakdown && (
                      <p className="mt-3 text-[10px] text-gray-500 bg-white/60 rounded-lg px-3 py-2 border border-gray-100">
                        {refundData.refund.breakdown}
                      </p>
                    )}
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border p-4",
                      refundData.change.isChangeable
                        ? "border-blue-200 bg-blue-50/40"
                        : "border-gray-200 bg-gray-50/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          refundData.change.isChangeable
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        )}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            "text-[13px] font-bold",
                            refundData.change.isChangeable
                              ? "text-blue-800"
                              : "text-gray-600"
                          )}
                        >
                          {refundData.change.isChangeable
                            ? "Changes Allowed"
                            : "Non-Changeable"}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {refundData.change.penaltyText}
                        </p>
                      </div>
                      {refundData.change.isChangeable &&
                        refundData.change.penaltyDisplay !== "—" && (
                          <div className="text-right">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                              Fee
                            </p>
                            <p className="text-[13px] font-bold text-gray-900 tabular-nums">
                              {refundData.change.penaltyDisplay}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  {refundData.cancellation && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <XCircle className="h-3 w-3" /> Cancellation
                        Record
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-gray-200/70 bg-white p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            Refund Amount
                          </p>
                          <p className="mt-1 text-[14px] font-bold text-gray-900 tabular-nums">
                            {refundData.cancellation.refundAmount !== null
                              ? `${refundData.cancellation.refundCurrency} ${refundData.cancellation.refundAmount.toFixed(2)}`
                              : "N/A"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-200/70 bg-white p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            Refund To
                          </p>
                          <p className="mt-1 text-[12px] font-semibold text-gray-700 capitalize">
                            {refundData.cancellation.refundTo === "balance"
                              ? "Agency Balance"
                              : refundData.cancellation.refundTo === "card"
                                ? "Original Card"
                                : refundData.cancellation.refundTo ===
                                    "voucher"
                                  ? "Airline Voucher"
                                  : refundData.cancellation.refundTo ||
                                    "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-gray-600">
                        <p>
                          <span className="font-bold text-gray-700">
                            Cancelled:
                          </span>{" "}
                          {refundData.cancellation.cancelledAt
                            ? format(
                                parseISO(
                                  refundData.cancellation.cancelledAt
                                ),
                                "dd MMM yyyy, hh:mm a"
                              )
                            : "N/A"}
                        </p>
                        <p>
                          <span className="font-bold text-gray-700">
                            Status:
                          </span>{" "}
                          <span className="capitalize">
                            {refundData.cancellation.status ||
                              "Processing"}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {refundData.payment.awaitingPayment && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="text-[11px] text-amber-800">
                        <span className="font-bold">
                          Payment still pending.
                        </span>
                        {refundData.payment.paymentRequiredBy && (
                          <span className="ml-1">
                            Due by{" "}
                            {format(
                              parseISO(
                                refundData.payment.paymentRequiredBy
                              ),
                              "dd MMM yyyy, hh:mm a"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {refundData.passengers.length > 0 && (
                    <div className="rounded-xl border border-gray-200/70 bg-gray-50/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Passengers ({refundData.passengers.length})
                      </p>
                      <div className="space-y-2">
                        {refundData.passengers.map((pax, i) => (
                          <div
                            key={pax.id || i}
                            className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500">
                                {pax.name?.charAt(0) || "?"}
                              </div>
                              <span className="text-[12px] font-semibold text-gray-800">
                                {pax.name}
                              </span>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-600 ring-1 ring-indigo-200 capitalize">
                              {pax.type?.replace("_", " ") || "adult"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {refundData.slices.length > 0 && (
                    <div className="rounded-xl border border-gray-200/70 bg-gray-50/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Flight Route
                      </p>
                      <div className="space-y-2">
                        {refundData.slices.map((slice, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2"
                          >
                            <Plane className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                            <div className="flex items-center gap-2 text-[12px]">
                              <span className="font-mono font-bold text-gray-900">
                                {slice.origin || "—"}
                              </span>
                              <ArrowRight className="h-3 w-3 text-gray-300" />
                              <span className="font-mono font-bold text-gray-900">
                                {slice.destination || "—"}
                              </span>
                            </div>
                            {slice.departureAt && (
                              <span className="ml-auto text-[10px] text-gray-400">
                                {format(
                                  parseISO(slice.departureAt),
                                  "dd MMM"
                                )}
                              </span>
                            )}
                            {slice.airline && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                {slice.airline}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-gray-200/70 bg-gray-50/30 p-3 space-y-1 text-[10px] text-gray-500">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-600">
                        Order ID
                      </span>
                      <span className="font-mono">
                        {refundData.orderId || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-600">PNR</span>
                      <span className="font-mono">
                        {refundData.pnr || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-600">Mode</span>
                      <span>
                        {refundData.isLiveMode
                          ? "LIVE"
                          : "TEST / Sandbox"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-600">
                        Fetched
                      </span>
                      <span>
                        {refundData.fetchedAt
                          ? format(
                              parseISO(refundData.fetchedAt),
                              "dd MMM yyyy, hh:mm a"
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={refreshRefundFromAirline}
                    disabled={refundLoading}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-bold text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
                  >
                    {refundLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh from
                        Airline
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ ISSUE TICKET MODAL (EXTRACTED) ═══════════════════ */}
      <IssueTicketModalNew
        open={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        onSuccess={() => {
          setIssueModalOpen(false);
          fetchBooking();
        }}
        bookingId={data.id}
        bookingRef={data.bookingRef}
        pnr={data.pnr}
        finance={data.finance}
        paymentSource={data.paymentSource}
      />
      
    </div>
  );
}