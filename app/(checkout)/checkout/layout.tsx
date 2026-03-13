import {
    ShieldCheck,
    Lock,
    Phone,
    CreditCard,
    MessageCircle,
    CheckCircle2,
    Headphones,
    Mail,
} from 'lucide-react';
import '@/app/(main)/globals.css';
import { websiteDetails } from '@/constant/data';
import type { Metadata, Viewport } from 'next';  // 👈 Viewport added
import Link from 'next/link';
import { Toaster } from 'sonner';

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
            <body className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-rose-100 selection:text-rose-600 flex flex-col">
                {/* 🟢 Background Pattern (Subtle) */}
                <div
                    className="fixed inset-0 z-[-1] opacity-[0.03]"
                    style={{
                        backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                ></div>

                {/* 🟢 HEADER: Modern & Sticky */}
                <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 transition-all shadow-2xl shadow-gray-100">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                        {/* Left: Logo & Security Badge */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <img
                                    src="/logo.jpg"
                                    alt={websiteDetails.name}
                                    className="h-10 w-auto object-contain"
                                />
                            </div>
                            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
                            <div className="hidden md:flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100/50">
                                <Lock className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">
                                    Secure Checkout
                                </span>
                            </div>
                        </div>

                        {/* Right: Support Actions */}
                        <div className="flex items-center gap-3 md:gap-4">
                            <a
                                href={`tel:${websiteDetails.phone}`}
                                className="hidden md:flex flex-col items-end group"
                            >
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-rose-500 transition-colors">
                                    24/7 Support
                                </span>
                                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm group-hover:text-slate-900">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{websiteDetails.phone}</span>
                                </div>
                            </a>
                            <Link
                                href={`https://wa.me/${websiteDetails.whatsappNumber || websiteDetails.phone}?text=I need help with my booking`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-green-100 transition-transform active:scale-95"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span className="hidden sm:block text-sm">WhatsApp</span>
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* 🟢 MAIN CONTENT */}
                <main className="flex-grow max-w-7xl mx-auto w-full py-8 px-2 md:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    {children}
                </main>

                {/* 🟢 FOOTER: Trust & Info */}
                <footer className="mt-auto border-t border-slate-200 bg-white pt-12 pb-8">
                    <div className="max-w-7xl mx-auto px-4 md:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-slate-100 pb-10 mb-10">
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-1">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm">
                                    100% Secure Payments
                                </h4>
                                <p className="text-xs text-slate-500 max-w-[200px]">
                                    We use banking-level SSL encryption to protect your data.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-1">
                                    <Headphones className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm">
                                    24/7 Expert Support
                                </h4>
                                <p className="text-xs text-slate-500 max-w-[200px]">
                                    Our travel experts are here to help you anytime.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-1">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm">
                                    Instant Confirmation
                                </h4>
                                <p className="text-xs text-slate-500 max-w-[200px]">
                                    Receive your e-ticket immediately after payment.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left">
                                <p className="text-slate-400 text-[11px] mb-2">
                                    © {new Date().getFullYear()} {websiteDetails.name}. All rights
                                    reserved.
                                </p>
                                <div className="flex gap-4 text-xs font-medium text-slate-500">
                                    <Link target="_blank" href="/terms-conditions" className="hover:text-rose-600 transition-colors">Terms</Link>
                                    <Link target="_blank" href="/privacy-policy" className="hover:text-rose-600 transition-colors">Privacy</Link>
                                    <Link target="_blank" href="/refund-policy" className="hover:text-rose-600 transition-colors">Refund Policy</Link>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">We Accept</span>
                                <div className="h-8 px-3 bg-slate-50 border border-slate-200 rounded flex items-center gap-2 text-slate-600">
                                    <CreditCard className="w-4 h-4" /> <span className="text-[10px] font-bold">VISA</span>
                                </div>
                                <div className="h-8 px-3 bg-slate-50 border border-slate-200 rounded flex items-center gap-2 text-slate-600">
                                    <CreditCard className="w-4 h-4" /> <span className="text-[10px] font-bold">Mastercard</span>
                                </div>
                                <div className="h-8 px-3 bg-slate-50 border border-slate-200 rounded flex items-center gap-2 text-slate-600">
                                    <CreditCard className="w-4 h-4" /> <span className="text-[10px] font-bold">Amex</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>

                <Toaster
                    position="top-center"
                    closeButton
                    expand={false}
                    duration={3000}
                    visibleToasts={5}
                    toastOptions={{
                        style: {
                            maxWidth: '25rem',
                            width: 'auto',
                        },
                    }}
                />
            </body>
        </html>
    );
}