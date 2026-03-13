import type { Metadata } from 'next';
import FlightSearchPage from './components/SearchPageContent';
import { websiteDetails } from '@/constant/data';

// 1. International Metadata Configuration
export const metadata: Metadata = {

  title: 'Cheap Flights from USA to Bangladesh | Fly Bismillah (US Based)',

  description: 'Book air tickets from New York (JFK) to Dhaka (DAC) and worldwide. Fly Bismillah is a USA-based travel agency serving Bangladesh with 24/7 support. Best deals on Emirates, Qatar, and Biman.',
  

  keywords: [
    'Flights from USA to Bangladesh',
    'JFK to Dhaka flights',
    'Cheap air tickets Dhaka',
    'Travel Agency USA',
    'Fly Bismillah US',
    'Sylhet to London flights',
    'Biman Bangladesh tickets USA'
  ],
  
  // Canonical URL (Duplicate Content)
  alternates: {
    canonical: 'https://flybismillah.com/flights/search',
  },

  // Open Graph (Facebook/WhatsApp Sharing)
  openGraph: {
    title: 'Best Flight Deals: USA ⇄ Bangladesh',
    description: 'Trusted US-based travel agency. Get the cheapest fares for Dhaka, Sylhet, Chittagong, and New York.',
    url: 'https://flybismillah.com/flight/flights/search',
    siteName: 'Fly Bismillah',
    images: [
      {
        url: 'https://flybismillah.com/og-flight-international.jpg',
        width: 1200,
        height: 630,
        alt: 'USA to Bangladesh Flight Deals',
      },
    ],
    locale: 'en_US', 
    type: 'website',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency', // Specific Type
    name: 'Fly Bismillah',
    description: 'USA based travel agency providing flight booking services in Bangladesh and worldwide.',
    url: 'https://flybismillah.com',
    logo: 'https://flybismillah.com/logo.png',
    
    areaServed: [
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'Bangladesh' },
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'City', name: 'New York' },
      { '@type': 'City', name: 'Dhaka' }
    ],

    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: websiteDetails.whatsappNumber, // USA Number
        contactType: 'customer service',
        areaServed: 'US',
        availableLanguage: ['English', 'Bengali']
      },
      {
        '@type': 'ContactPoint',
         telephone: websiteDetails.whatsappNumber, // BD Number
        contactType: 'customer service',
        areaServed: 'BD',
        availableLanguage: ['Bengali', 'English']
      }
    ],

    sameAs: [
      'https://www.facebook.com/flybismillah',
      'https://www.instagram.com/flybismillah',
      'Complete Your Booking'
    ]
  };

  return (
    <div>
      {/* JSON-LD Script Inject */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Search Page Content */}
      <FlightSearchPage />
    </div>
  );
}