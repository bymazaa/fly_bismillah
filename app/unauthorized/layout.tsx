import {
    ShieldCheck,
    Lock,
    Phone,
    CreditCard,
    MessageCircle,
    CheckCircle2,
    Headphones,
} from 'lucide-react';
import '@/app/(main)/globals.css';
import { websiteDetails } from '@/constant/data';
import type { Metadata, Viewport } from 'next';  // 👈 Viewport added
import Link from 'next/link';

// ✅ VIEWPORT CONFIG - Prevents mobile zoom on input focus
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

// 🟢 LIGHTWEIGHT SEO CONFIGURATION
export const metadata: Metadata = {
    title: `Secure Checkout - ${websiteDetails.name}`,
    description:
        'Complete your flight booking securely. Your payment information is encrypted and protected.',
    robots: {
        index: false,
        follow: false,
    },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>

 

                {/* 🟢 MAIN CONTENT */}
                <main >
                    {children}
                </main>

             
             
            </body>
        </html>
    );
}