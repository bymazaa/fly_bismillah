import {
  Banknote,
  Clock,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  CreditCard,
  Plane,
  Shield,
  RefreshCw,
  XCircle,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Refund Policy | Bismillah Travels and Tour",
  description:
    "USA-compliant refund and cancellation policies for Bismillah Travels and Tour — powered by Duffel & Stripe.",
};

export default function RefundPolicy() {
  const highlights = [
    {
      icon: CheckCircle2,
      color: "emerald",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      iconColor: "text-emerald-600",
      title: "24-Hour Risk-Free",
      desc: "As per US DOT regulations, cancel any booking within 24 hours of purchase for a full refund, provided the flight is at least 7 days away. Stripe refund initiated instantly.",
    },
    {
      icon: Clock,
      color: "blue",
      bg: "bg-blue-50",
      border: "border-blue-100",
      iconColor: "text-blue-600",
      title: "Refund Timeline",
      desc: "Duffel processes airline refunds within 24-72 hours. Stripe credits your original payment method within 5-10 business days after airline approval.",
    },
    {
      icon: AlertTriangle,
      color: "amber",
      bg: "bg-amber-50",
      border: "border-amber-100",
      iconColor: "text-amber-600",
      title: "Airline Penalties",
      desc: "After the 24-hour window, airline cancellation fees ($75-$400+) apply per Duffel's fare rules. Basic Economy & promotional fares are typically non-refundable.",
    },
  ];

  const sections = [
    {
      icon: RefreshCw,
      title: "1. How Refunds Are Processed",
      content: (
        <>
          <p>
            Bismillah Travels and Tour uses a two-step refund workflow powered
            by <strong>Duffel</strong> and <strong>Stripe</strong>:
          </p>
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-4 bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Plane className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">
                  Step 1 — Duffel Airline Refund
                </h4>
                <p className="text-sm text-gray-600">
                  We submit your cancellation request to the airline via
                  Duffel&apos;s API. The airline validates the request and
                  calculates the refundable amount based on fare rules.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-violet-50/50 border border-violet-100 p-4 rounded-xl">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">
                  Step 2 — Stripe Refund
                </h4>
                <p className="text-sm text-gray-600">
                  Once the airline approves, we initiate the refund through
                  Stripe to your original payment method. Stripe handles the
                  secure transfer back to your bank or card.
                </p>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      icon: Banknote,
      title: "2. Refund Calculation (USD)",
      content: (
        <>
          <p>
            Your refund amount is calculated based on the fare rules returned
            by the Duffel API for your specific booking:
          </p>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-2xl mt-4 font-mono text-sm border border-gray-800">
            <div className="text-gray-400 text-xs mb-2">// Refund Formula</div>
            <div>
              <span className="text-emerald-400">refund</span> ={" "}
              <span className="text-white">totalPaid</span> - (
              <span className="text-amber-400">airlinePenalty</span> +{" "}
              <span className="text-rose-400">serviceFee</span>)
            </div>
            
          </div>
          
        </>
      ),
    },
    {
      icon: XCircle,
      title: "3. Non-Refundable Scenarios",
      content: (
        <ul className="space-y-3">
          {[
            "Promotional, Saver, or Basic Economy fares (as flagged by Duffel's fare conditions).",
            "Passenger marked as 'No-Show' — did not check in or board the flight.",
            "Visa denials — refund is subject to airline waiver approval via Duffel.",
            "Ancillary purchases (extra baggage, seat selection) after ticket issuance.",
            "Bookings cancelled after departure time.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 bg-red-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: Shield,
      title: "4. Involuntary Cancellations & DOT Protection",
      content: (
        <p>
          If an airline cancels your flight or makes a significant schedule
          change (3+ hours for domestic, 4+ hours for international), you are
          entitled to a <strong>full refund</strong> under US Department of
          Transportation (DOT) regulations — regardless of ticket type. In
          such cases, Duffel automatically flags the booking as eligible for a
          full refund, and we process it via Stripe within 48 hours.
        </p>
      ),
    },
    {
      icon: CreditCard,
      title: "5. Stripe Payment Disputes & Chargebacks",
      content: (
        <p>
          If you believe a charge is incorrect, please contact us{" "}
          <strong>before</strong> filing a dispute with your bank. Filing a
          chargeback directly with your card issuer without contacting us may
          result in delays and additional fees. Stripe provides full
          transaction records and we can resolve most issues within 24 hours.
        </p>
      ),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-rose-50/20 to-white">

      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-50/30 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto py-20 lg:py-28 px-4 md:px-8">

        {/* ================= Header ================= */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-2xl mb-6 ring-4 ring-emerald-100 ring-offset-2 ring-offset-white">
            <Banknote className="w-7 h-7 text-emerald-500" />
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Policy
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Refund &{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-rose-600">Cancellation</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
            </span>{" "}
            Policy
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
            At Bismillah Travels and Tour, we operate under US consumer
            protection laws with transparent refund processing via Duffel &
            Stripe.
          </p>

          {/* Tech badges */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow-2xl shadow-gray-100">
              <Plane className="w-3.5 h-3.5 text-blue-500" />
              Duffel Refund API
            </span>
            <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow-2xl shadow-gray-100">
              <CreditCard className="w-3.5 h-3.5 text-violet-500" />
              Stripe Refunds
            </span>
          </div>
        </div>

        {/* ================= Highlight Cards ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`group ${item.bg} border ${item.border} p-7 rounded-2xl hover:-translate-y-1  transition-all duration-500`}
              >
                <div
                  className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-5 shadow-2xl shadow-gray-100 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <h3 className="font-extrabold text-gray-900 mb-2 text-base">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* ================= Detailed Sections ================= */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-100 transition-all duration-500 p-7 md:p-8"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-gray-100 ring-offset-1 ring-offset-white">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 pt-2">
                    {section.title}
                  </h2>
                </div>
                <div className="text-gray-600 leading-[1.8] text-[15px] pl-0 md:pl-[3.75rem]">
                  {section.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= Contact CTA ================= */}
        <div className="mt-16">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl p-10 md:p-14 overflow-hidden">

            {/* Decorative */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/15 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-600/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-white/10">
                  <HelpCircle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-extrabold text-white mb-2">
                    Need to request a refund?
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Our US support team is available Mon–Fri, 9 AM – 6 PM EST.
                    We&apos;ll process your request via Duffel within 24 hours.
                  </p>
                </div>
              </div>

              <a
                href="mailto:support@bismillahtravels.com"
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-4 rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-xl shadow-black/20 text-sm shrink-0"
              >
                <HelpCircle className="w-4 h-4" />
                Contact Support
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}