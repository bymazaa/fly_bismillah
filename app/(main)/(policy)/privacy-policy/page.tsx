import {
  Lock,
  Eye,
  Share2,
  Shield,
  Baby,
  UserCheck,
  Mail,
  CreditCard,
  Plane,
  Database,
  Server,
} from "lucide-react";
import { websiteDetails } from "@/constant/data";

export const metadata = {
  title: "Privacy Policy | Bismillah Travels and Tour",
  description:
    "How we collect, use, and protect your personal data — powered by Duffel & Stripe.",
};

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: Database,
      color: "rose",
      title: "1. Information We Collect",
      content: (
        <>
          <p>
            At <strong>Bismillah Travels and Tour</strong>, we collect the
            minimum information necessary to fulfill your travel bookings
            through our technology partners:
          </p>

          <div className="mt-5 space-y-4">
            {/* Duffel Data */}
            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">
                  Data Shared with Duffel (Flight Booking)
                </h4>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  "Full legal name (as on passport/government ID)",
                  "Date of birth & gender (TSA Secure Flight requirement)",
                  "Passport number, expiry date, nationality",
                  "Contact email & phone number for booking confirmation",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stripe Data */}
            <div className="bg-violet-50/50 border border-violet-100 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-violet-600" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">
                  Data Processed by Stripe (Payments)
                </h4>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  "Credit/debit card number, expiration, CVV (encrypted by Stripe — never stored on our servers)",
                  "Billing name & address for fraud verification",
                  "Transaction amount and currency (USD)",
                  "IP address & device fingerprint (Stripe Radar fraud detection)",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ),
    },
    {
      icon: Eye,
      color: "blue",
      title: "2. How We Use Your Information",
      content: (
        <>
          <p>We use your data strictly for the following purposes:</p>
          <ul className="list-none space-y-3 mt-4">
            {[
              "Searching and booking flights via Duffel's API on your behalf.",
              "Processing secure payments and issuing receipts via Stripe.",
              "Submitting required passenger data to the US Transportation Security Administration (TSA) for Secure Flight vetting.",
              "Sending booking confirmations, itinerary updates, and e-tickets to your registered email.",
              "Providing customer support for booking modifications, cancellations, and refunds.",
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
      icon: Share2,
      color: "amber",
      title: "3. Data Sharing & Third Parties",
      content: (
        <>
          <p>
            <strong>We do not sell your personal data.</strong> However, we share
            necessary information with the following parties to deliver our
            services:
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "Duffel",
                desc: "Flight data transmitted for booking, ticketing, and ancillary services.",
                icon: Plane,
                bg: "bg-blue-50",
                border: "border-blue-100",
              },
              {
                name: "Stripe",
                desc: "Payment data for transaction processing. PCI-DSS Level 1 certified.",
                icon: CreditCard,
                bg: "bg-violet-50",
                border: "border-violet-100",
              },
              {
                name: "Airlines & GDS",
                desc: "Passenger info for seat confirmation and e-ticket generation.",
                icon: Plane,
                bg: "bg-sky-50",
                border: "border-sky-100",
              },
              {
                name: "US Government",
                desc: "TSA, CBP — as legally required for all US-originating flights.",
                icon: Shield,
                bg: "bg-red-50",
                border: "border-red-100",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`${item.bg} border ${item.border} p-4 rounded-xl`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="font-bold text-gray-900 text-sm">
                      {item.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ),
    },
    {
      icon: Server,
      color: "emerald",
      title: "4. Data Security & Encryption",
      content: (
        <>
          <p>
            We implement industry-leading security measures to protect your
            data:
          </p>
          <ul className="list-none space-y-3 mt-4">
            {[
              "All website traffic is encrypted with SSL/TLS (256-bit encryption).",
              "Payment data is tokenized by Stripe — we never see or store your full card number.",
              "Duffel API communications use OAuth 2.0 authentication and encrypted channels.",
              "Our servers are hosted on SOC 2 compliant infrastructure within the United States.",
              "Regular security audits and vulnerability assessments are performed.",
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
      icon: Baby,
      color: "pink",
      title: "5. Children's Privacy (COPPA)",
      content: (
        <p>
          Our services are not directed to individuals under the age of 13. We
          do not knowingly collect personal information from children under 13
          without verifiable parental consent, in full compliance with the{" "}
          <strong>Children&apos;s Online Privacy Protection Act (COPPA)</strong>.
          If we discover that we have inadvertently collected data from a child
          under 13, we will delete it immediately.
        </p>
      ),
    },
    {
      icon: UserCheck,
      color: "sky",
      title: "6. Your Rights",
      content: (
        <>
          <p>As a US-based customer, you have the right to:</p>
          <ul className="list-none space-y-3 mt-4">
            {[
              "Request access to the personal data we hold about you.",
              "Request correction of inaccurate information.",
              "Request deletion of your data (subject to legal record-keeping requirements).",
              "Opt out of marketing communications at any time.",
              "Request a copy of your data in a portable format.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 bg-sky-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      icon: Mail,
      color: "violet",
      title: "7. Contact Us",
      content: (
        <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl">
          <p className="mb-4">
            If you have any questions about this Privacy Policy or wish to
            exercise your data rights, contact our Data Protection Officer:
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Company:</strong> Bismillah Travels and Tour
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${websiteDetails.email}`}
                className="text-rose-600 hover:underline"
              >
                {websiteDetails.email}
              </a>
            </p>
            <p>
              <strong>Phone:</strong> {websiteDetails.phone}
            </p>
            <p>
              <strong>Address:</strong> United States of America
            </p>
          </div>
        </div>
      ),
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    rose: { bg: "bg-rose-50", icon: "text-rose-500", ring: "ring-rose-100" },
    blue: { bg: "bg-blue-50", icon: "text-blue-500", ring: "ring-blue-100" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", ring: "ring-emerald-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-500", ring: "ring-amber-100" },
    pink: { bg: "bg-pink-50", icon: "text-pink-500", ring: "ring-pink-100" },
    sky: { bg: "bg-sky-50", icon: "text-sky-500", ring: "ring-sky-100" },
    violet: { bg: "bg-violet-50", icon: "text-violet-500", ring: "ring-violet-100" },
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-gray-50/30 to-white">

      {/* Decorative */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-50/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-rose-50/30 rounded-full blur-[120px] pointer-events-none" />

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-50 to-violet-100/60 rounded-2xl mb-6 ring-4 ring-violet-100 ring-offset-2 ring-offset-white">
            <Lock className="w-7 h-7 text-violet-500" />
          </div>

          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
            Your Data Matters
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Privacy{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-rose-600">Policy</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
            </span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
            How Bismillah Travels and Tour collects, uses, and protects your
            personal data. Last updated: January 24, 2026.
          </p>

          {/* Tech badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow-2xl shadow-gray-100">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              SSL Encrypted
            </span>
            <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow-2xl shadow-gray-100">
              <Plane className="w-3.5 h-3.5 text-blue-500" />
              Duffel API
            </span>
            <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow-2xl shadow-gray-100">
              <CreditCard className="w-3.5 h-3.5 text-violet-500" />
              Stripe PCI-DSS
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
                className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-100  transition-all duration-500 overflow-hidden"
              >
                <div className={`h-[3px] ${c.bg}`} />

                <div className="p-7 md:p-8">
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

                  <div className="text-gray-600 leading-[1.8] text-[15px] pl-0 md:pl-[3.75rem]">
                    {section.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= Footer ================= */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl">
            <Shield className="w-5 h-5 text-emerald-500" />
            <p className="text-sm text-gray-500">
              <strong className="text-gray-700">
                Bismillah Travels and Tour
              </strong>{" "}
              — Your data is safe with us 🔒
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}