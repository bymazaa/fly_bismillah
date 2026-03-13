import {
  ScrollText,
  Shield,
  CreditCard,
  Plane,
  Globe,
  Scale,
  FileText,
  AlertCircle,
} from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | Bismillah Travels and Tour",
  description:
    "Terms of service for Bismillah Travels and Tour — a USA-based travel agency powered by Duffel and Stripe.",
};

export default function TermsConditions() {
  const sections = [
    {
      icon: FileText,
      color: "rose",
      title: "1. Agreement to Terms",
      content: (
        <p>
          Welcome to <strong>Bismillah Travels and Tour</strong>, a travel
          agency registered and operating under the laws of the United States.
          By accessing our website, creating an account, or using any of our
          booking services, you agree to comply with and be bound by these Terms
          & Conditions. If you do not agree, please discontinue use of our
          services immediately.
        </p>
      ),
    },
    {
      icon: Plane,
      color: "blue",
      title: "2. Flight Booking via Duffel",
      content: (
        <>
          <p>
            We use <strong>Duffel</strong> — a leading global flight booking
            API — to search, compare, and book flights from over 300+ airlines
            worldwide. By booking a flight through our platform:
          </p>
          <ul className="list-none space-y-3 mt-4">
            {[
              "All flight searches, availability, pricing, and seat selection are sourced in real-time via Duffel's API directly from airlines.",
              "Ticket issuance is processed through Duffel's managed airline connections. Once issued, tickets are subject to the respective airline's fare rules.",
              "Bismillah Travels and Tour acts as an intermediary. We do not operate flights and are not liable for airline schedule changes, cancellations, or operational disruptions.",
              "Ancillary services (baggage, seat upgrades, meals) are offered based on Duffel's airline integrations and availability.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 bg-blue-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      icon: CreditCard,
      color: "emerald",
      title: "3. Payments via Stripe",
      content: (
        <>
          <p>
            All payments on our platform are securely processed through{" "}
            <strong>Stripe, Inc.</strong>, a PCI-DSS Level 1 certified payment
            processor — the highest level of security in the payments industry.
          </p>
          <ul className="list-none space-y-3 mt-4">
            {[
              "We accept Visa, Mastercard, American Express, Discover, and ACH bank transfers.",
              "Your full credit/debit card details are never stored on our servers. All sensitive payment data is encrypted and tokenized by Stripe.",
              "Stripe may perform additional fraud prevention checks (3D Secure, Radar). A temporary authorization hold may appear on your statement during booking.",
              "All transactions are in US Dollars (USD). If paying with an international card, your bank may apply currency conversion fees.",
              "Receipts and invoices are generated through Stripe and delivered to your registered email address.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 bg-emerald-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      icon: Shield,
      color: "violet",
      title: "4. TSA Secure Flight Data",
      content: (
        <p>
          In compliance with the{" "}
          <strong>
            Transportation Security Administration (TSA) Secure Flight
          </strong>{" "}
          program, all passengers must provide their full legal name (as it
          appears on their government-issued photo ID or passport), date of
          birth, and gender at the time of booking. Failure to provide accurate
          Secure Flight data may result in denial of boarding. Bismillah
          Travels and Tour is not responsible for denied boarding due to
          incorrect passenger information.
        </p>
      ),
    },
    {
      icon: Globe,
      color: "amber",
      title: "5. International Travel, Visas & Documentation",
      content: (
        <>
          <p>
            It is the sole responsibility of each traveler to ensure they
            possess all necessary documentation for international travel,
            including:
          </p>
          <ul className="list-none space-y-3 mt-4">
            {[
              "A valid US passport with at least 6 months validity beyond the date of return.",
              "All required visas, transit visas, and Electronic Travel Authorizations (eTA/ESTA).",
              "Up-to-date health and vaccination records as required by the destination country.",
              "Compliance with US Customs and Border Protection (CBP) re-entry requirements.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 bg-amber-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      icon: AlertCircle,
      color: "red",
      title: "6. Limitation of Liability",
      content: (
        <p>
          Bismillah Travels and Tour shall not be held liable for any direct,
          indirect, incidental, or consequential damages arising from airline
          cancellations, schedule changes, denied boarding, lost baggage, or any
          third-party service failures. Our services are provided on an
          &quot;as-is&quot; basis. We rely on real-time data from Duffel and
          payment processing from Stripe — both of which operate under their own
          terms and conditions.
        </p>
      ),
    },
    {
      icon: Scale,
      color: "sky",
      title: "7. Governing Law & Dispute Resolution",
      content: (
        <p>
          These Terms & Conditions shall be governed by and construed in
          accordance with the laws of the{" "}
          <strong>State of New York, United States</strong>. Any disputes arising
          from or relating to these terms shall be resolved exclusively through
          binding arbitration or in the state or federal courts located within
          New York, NY. By using our services, you consent to the personal
          jurisdiction of these courts.
        </p>
      ),
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; border: string; ring: string }> = {
    rose: { bg: "bg-rose-50", icon: "text-rose-500", border: "border-rose-100", ring: "ring-rose-100" },
    blue: { bg: "bg-blue-50", icon: "text-blue-500", border: "border-blue-100", ring: "ring-blue-100" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", border: "border-emerald-100", ring: "ring-emerald-100" },
    violet: { bg: "bg-violet-50", icon: "text-violet-500", border: "border-violet-100", ring: "ring-violet-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-500", border: "border-amber-100", ring: "ring-amber-100" },
    red: { bg: "bg-red-50", icon: "text-red-500", border: "border-red-100", ring: "ring-red-100" },
    sky: { bg: "bg-sky-50", icon: "text-sky-500", border: "border-sky-100", ring: "ring-sky-100" },
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-gray-50/30 to-white">

      {/* Decorative Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-rose-50/30 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-50/30 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto py-20 lg:py-28 px-4 md:px-8">

        {/* ================= Header ================= */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-50 to-rose-100/60 rounded-2xl mb-6 ring-4 ring-rose-100 ring-offset-2 ring-offset-white">
            <ScrollText className="w-7 h-7 text-rose-500" />
          </div>

          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 mx-auto">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            Legal
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Terms &{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-rose-600">Conditions</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
            </span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
            Please read these terms carefully before using our services. Last
            updated: January 24, 2026.
          </p>

          {/* Tech Badges */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow-2xl shadow-gray-100">
              <Plane className="w-3.5 h-3.5 text-blue-500" />
              Powered by Duffel
            </span>
            <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow-2xl shadow-gray-100">
              <CreditCard className="w-3.5 h-3.5 text-violet-500" />
              Secured by Stripe
            </span>
          </div>
        </div>

        {/* ================= Content Sections ================= */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const c = colorMap[section.color] || colorMap.rose;
            const Icon = section.icon;

            return (
              <div
                key={index}
                className={`bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-100 transition-all duration-500 overflow-hidden`}
              >
                {/* Top accent */}
                <div className={`h-[3px] ${c.bg}`} />

                <div className="p-7 md:p-8">
                  {/* Section header */}
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center shrink-0 ring-2 ${c.ring} ring-offset-1 ring-offset-white`}
                    >
                      <Icon className={`w-5 h-5 ${c.icon}`} />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 pt-2">
                      {section.title}
                    </h2>
                  </div>

                  {/* Section content */}
                  <div className="text-gray-600 leading-[1.8] text-[15px] pl-0 md:pl-[3.75rem]">
                    {section.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= Footer Note ================= */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl">
            <Shield className="w-5 h-5 text-emerald-500" />
            <p className="text-sm text-gray-500">
              <strong className="text-gray-700">Bismillah Travels and Tour</strong>{" "}
              — USA Registered Travel Agency
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}