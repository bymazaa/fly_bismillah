import type { Metadata, Viewport } from "next";
import { Poppins, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { Suspense } from "react";
import { websiteDetails } from "@/constant/data";

// ── Fonts ──
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
  display: "swap",
});

// ── Site Config ──
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flybismillah.com";
const siteName = "Bismillah Travels & Tours";
const sitePhone = websiteDetails.phone; 
const siteEmail = "info@flybismillah.com"; 
const siteAddress = {
  street: websiteDetails.address,
  city: "Dhaka",
  region: "Warren, Michigan ",
  country: "US",
  zip: "48091",
  lat: 42.4590,
  lng: -83.0326,
};

// ── Viewport ──
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
};

// ── Metadata ──
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      "Bismillah Travels & Tours | Hajj, Umrah & Holiday Packages 2025–2026 | Flight Booking & Visa Processing Bangladesh",
    template: "%s | Bismillah Travels & Tours",
  },

  description:
    "Bismillah Travels & Tours is your trusted travel partner in Bangladesh for Hajj packages 2025–2026, Umrah visa processing, affordable international flight booking, hotel reservations, and holiday tour packages. We also serve clients in the USA. Book now for the best deals!",

  keywords: [
    // ── Brand ──
    "Bismillah Travels",
    "Bismillah Travels & Tours",
    "fly bismillah",
    "flybismillah",
    "flybismillah.com",
    "bismillah travel agency",
    "bismillah tours",

    // ── Hajj ──
    "Hajj package 2025",
    "Hajj package 2026",
    "Hajj package Bangladesh",
    "Hajj package from Dhaka",
    "affordable Hajj package",
    "best Hajj package Bangladesh",
    "Hajj tour operator",
    "Hajj visa processing",
    "Hajj booking",
    "Hajj group package",

    // ── Umrah ──
    "Umrah package 2025",
    "Umrah package Bangladesh",
    "Umrah visa processing",
    "cheap Umrah package",
    "Umrah booking online",
    "Umrah tour package Dhaka",
    "Ramadan Umrah package",
    "family Umrah package",

    // ── Flights ──
    "flight booking Bangladesh",
    "international flight booking",
    "cheap flights from Dhaka",
    "airline ticket booking",
    "flight ticket online",
    "domestic flight Bangladesh",
    "Dhaka to Jeddah flight",
    "Dhaka to Medina flight",
    "Dhaka to Dubai flight",

    // ── Visa ──
    "visa processing Bangladesh",
    "Saudi Arabia visa",
    "tourist visa Bangladesh",
    "visa assistance Dhaka",
    "USA visa processing",
    "visa consultant Bangladesh",

    // ── Hotel ──
    "hotel booking Makkah",
    "hotel booking Madinah",
    "hotel reservation Saudi Arabia",
    "Makkah hotel near Haram",
    "Madinah hotel package",

    // ── Tours & Holiday ──
    "holiday packages Bangladesh",
    "tour packages from Dhaka",
    "international tour packages",
    "Cox's Bazar tour package",
    "Dubai tour package",
    "Malaysia tour package",
    "Thailand tour package",
    "Turkey tour package",
    "Singapore tour package",
    "Europe tour package Bangladesh",

    // ── General ──
    "travel agency Bangladesh",
    "travel agency Dhaka",
    "best travel agency Bangladesh",
    "tour operator Bangladesh",
    "travel agent near me",
    "online travel booking Bangladesh",
    "trusted travel agency",
    "travel company Bangladesh",
    "ATAB member travel agency",
  ],

  // ── Authors & Creator ──
  authors: [
    { name: "Bismillah Travels & Tours", url: siteUrl },
    { name: "fly bismillah", url: siteUrl },
  ],
  creator: "Bismillah Travels & Tours",
  publisher: "Bismillah Travels & Tours",

  // ── Category ──
  category: "Travel",

  // ── Canonical & Alternates ──
  alternates: {
    canonical: siteUrl,
    languages: {
      "en-US": siteUrl,
      "bn-BD": siteUrl,
    },
  },

  // ── Open Graph ──
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["bn_BD"],
    url: siteUrl,
    title:
      "Bismillah Travels & Tours — Your Trusted Partner for Hajj, Umrah & Holiday Packages",
    description:
      "Book affordable Hajj & Umrah packages, international flights, hotel reservations, and visa processing with Bismillah Travels & Tours. Trusted travel agency in Bangladesh serving worldwide clients.",
    siteName: siteName,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bismillah Travels & Tours — Hajj, Umrah & Holiday Packages",
        type: "image/jpeg",
      },
      {
        url: "/og-image-square.jpg",
        width: 600,
        height: 600,
        alt: "Bismillah Travels & Tours Logo",
        type: "image/jpeg",
      },
    ],
    countryName: "Bangladesh",
    phoneNumbers: [sitePhone],
    emails: [siteEmail],
  },

  // ── Twitter ──
  twitter: {
    card: "summary_large_image",
    title: "Bismillah Travels & Tours — Hajj, Umrah & Flights",
    description:
      "Best deals on Hajj packages 2025–2026, Umrah visa, international flights & holiday tours from Bangladesh.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bismillah Travels & Tours",
      },
    ],
    creator: "@flybismillah",
    site: "@flybismillah",
  },

  // ── Icons ──
  icons: {
    icon: [
      { url: "/icon.png", sizes: "any" },
    ],
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon.png",
  },

  // ── Manifest ──
  manifest: "/manifest.json",

  // ── Robots ──
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Verification ──
  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ||
      "your-google-verification-code",
    // yandex: "your-yandex-code",
  },

  // ── Other ──
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
};

// ═══════════════════════════════════════
// ── JSON-LD Structured Data Schemas ──
// ═══════════════════════════════════════

// 1. Travel Agency (Organization)
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": `${siteUrl}/#organization`,
  name: siteName,
  alternateName: ["Bismillah Travels", "Fly Bismillah", "flybismillah"],
  url: siteUrl,
  logo: `${siteUrl}/icon.png`,
  image: `${siteUrl}/og-image.jpg`,
  description:
    "Trusted travel agency in Bangladesh providing Hajj & Umrah packages, flight booking, hotel reservation, and visa processing services.",
  telephone: sitePhone,
  email: siteEmail,
  foundingDate: "2020", // আপনার প্রতিষ্ঠানের শুরুর বছর
  priceRange: "$$",
  currenciesAccepted: "BDT, USD",
  paymentAccepted: "Cash, Bank Transfer, bKash, Nagad, Card",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Saturday",
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
      ],
      opens: "09:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Friday",
      opens: "14:00",
      closes: "21:00",
    },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: siteAddress.street,
    addressLocality: siteAddress.city,
    addressRegion: siteAddress.region,
    postalCode: siteAddress.zip,
    addressCountry: siteAddress.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: siteAddress.lat,
    longitude: siteAddress.lng,
  },
  areaServed: [
    { "@type": "Country", name: "Bangladesh" },
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Saudi Arabia" },
  ],
  sameAs: [
    "https://www.facebook.com/flybismillah", // আপনার Facebook
    // "https://www.instagram.com/flybismillah",
    // "https://www.youtube.com/@flybismillah",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Travel Packages",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Hajj Packages",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "TouristTrip",
              name: "Hajj Package 2025–2026",
              description:
                "Complete Hajj package including flights, 5-star hotel, visa, and transportation",
              touristType: "Pilgrims",
            },
          },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "Umrah Packages",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "TouristTrip",
              name: "Umrah Package 2025",
              description:
                "Affordable Umrah package with hotel near Haram, visa processing, and guided tour",
              touristType: "Pilgrims",
            },
          },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "Holiday Packages",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "TouristTrip",
              name: "International Holiday Tours",
              description:
                "Tour packages to Dubai, Malaysia, Thailand, Turkey, Singapore, and Europe",
            },
          },
        ],
      },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "150",
    bestRating: "5",
    worstRating: "1",
  },
};

// 2. Website Schema
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: siteName,
  description:
    "Book Hajj, Umrah, flights, hotels, and tour packages with Bismillah Travels & Tours",
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
  inLanguage: ["en-US", "bn-BD"],
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// 3. BreadcrumbList
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Hajj Packages",
      item: `${siteUrl}/hajj`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Umrah Packages",
      item: `${siteUrl}/umrah`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Flights",
      item: `${siteUrl}/flights`,
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "Tours",
      item: `${siteUrl}/tours`,
    },
    {
      "@type": "ListItem",
      position: 6,
      name: "Contact",
      item: `${siteUrl}/contact`,
    },
  ],
};

// 4. FAQPage Schema (Google FAQ Rich Result)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does a Hajj package cost from Bangladesh?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hajj packages from Bangladesh typically range from BDT 5,00,000 to BDT 12,00,000 depending on the package tier (Economy, Standard, Premium). Contact us for the latest 2025–2026 pricing.",
      },
    },
    {
      "@type": "Question",
      name: "What documents are required for Umrah visa?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For Umrah visa you need: valid passport (6+ months validity), passport-size photos, NID copy, vaccination certificate (Meningitis), and completed application form. We handle the entire visa processing.",
      },
    },
    {
      "@type": "Question",
      name: "Do you provide flight-only booking?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! We offer standalone flight booking for domestic and international destinations. We work with all major airlines including Biman Bangladesh, Saudi Airlines, Emirates, Qatar Airways, and more.",
      },
    },
    {
      "@type": "Question",
      name: "Can I book from the USA?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely! We serve clients in both Bangladesh and the USA. You can book online or contact our support team for personalized assistance.",
      },
    },
  ],
};

// 5. Service Schema (for Google rich results)
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${siteUrl}/#service`,
  serviceType: [
    "Hajj Packages",
    "Umrah Packages",
    "Flight Booking",
    "Hotel Reservation",
    "Visa Processing",
    "Holiday Tour Packages",
    "Airport Transfer",
    "Travel Insurance",
  ],
  provider: {
    "@id": `${siteUrl}/#organization`,
  },
  areaServed: [
    { "@type": "Country", name: "Bangladesh" },
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Saudi Arabia" },
    { "@type": "Country", name: "United Arab Emirates" },
    { "@type": "Country", name: "Malaysia" },
    { "@type": "Country", name: "Thailand" },
    { "@type": "Country", name: "Turkey" },
  ],
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "BDT",
    availability: "https://schema.org/InStock",
  },
};

// 6. Local Business (for Google Maps & Local Search)
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#localbusiness`,
  name: siteName,
  image: `${siteUrl}/og-image.jpg`,
  url: siteUrl,
  telephone: sitePhone,
  email: siteEmail,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteAddress.street,
    addressLocality: siteAddress.city,
    addressRegion: siteAddress.region,
    postalCode: siteAddress.zip,
    addressCountry: siteAddress.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: siteAddress.lat,
    longitude: siteAddress.lng,
  },
 openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "09:00",
      closes: "21:00",
    },
  ],
  priceRange: "$$",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className="scroll-smooth">
      <head>
        {/* ── Preconnect ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ── DNS Prefetch ── */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        {/* ── Structured Data (6 Schemas) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationSchema,
              websiteSchema,
              breadcrumbSchema,
              faqSchema,
              serviceSchema,
              localBusinessSchema,
            ]),
          }}
        />

        {/* ── Geo Meta Tags ── */}
        <meta name="geo.region" content="US-MI" />
        <meta name="geo.placename" content={siteAddress.city} />
        <meta
          name="geo.position"
          content={`${siteAddress.lat};${siteAddress.lng}`}
        />
        <meta name="ICBM" content={`${siteAddress.lat}, ${siteAddress.lng}`} />

        {/* ── Additional SEO Meta ── */}
        <meta name="subject" content="Travel Agency - Hajj, Umrah, Flights & Tours" />
        <meta name="language" content="English" />
        <meta name="rating" content="General" />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="target" content="all" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />
        <meta name="revisit-after" content="3 days" />
        <meta name="Classification" content="Travel" />
        <meta name="directory" content="submission" />

        {/* ── Apple Web App ── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bismillah Travels" />
      </head>
      <body
        className={`${poppins.variable} ${greatVibes.variable} font-sans antialiased bg-gray-50 text-gray-800`}
      >
        {/* ── Skip to Content (Accessibility) ── */}
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-emerald-600
                     px-4 py-2 text-sm font-semibold text-white shadow-lg
                     transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>

        <Suspense fallback={<div className="h-20 bg-white shadow-sm" />}>
          <Navbar />
        </Suspense>

        <main id="main-content">{children}</main>

        <Toaster
          position="top-center"
          closeButton
          expand={false}
          duration={3000}
          visibleToasts={5}
          toastOptions={{
            style: {
              maxWidth: "25rem",
              width: "auto",
            },
          }}
        />

        <Footer />

        {/* ── Noscript Fallback ── */}
        <noscript>
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              backgroundColor: "#f9fafb",
              color: "#374151",
            }}
          >
            <h1>Bismillah Travels & Tours</h1>
            <p>
              Your trusted travel partner for Hajj, Umrah & Holiday packages.
            </p>
            <p>
              Please enable JavaScript to use our booking system. Contact us at{" "}
              {siteEmail} or call {sitePhone}
            </p>
          </div>
        </noscript>
      </body>
    </html>
  );
}