// app/(dashboard)/layout.tsx

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './components/AppSidebar';
import '@/app/(main)/globals.css';
import { Toaster } from 'sonner';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard | FlyBismillah',
    description: 'Travel Agency Management System - Admin Panel',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head />
            <body className="antialiased bg-[#f8f9fb] text-slate-900 selection:bg-blue-100 selection:text-blue-700">
                <SidebarProvider>
                    <AppSidebar />

                    <SidebarInset>
                        {/* ═══════════════════════════════════
                            STICKY HEADER — only trigger
                        ═══════════════════════════════════ */}
                        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-4">
                            <SidebarTrigger className="cursor-pointer -ml-1" />
                        </header>

                        {/* ═══════════════════════════════════
                            MAIN CONTENT — no overlap
                        ═══════════════════════════════════ */}
                        <main className="flex flex-1 flex-col min-h-[calc(100vh-3.5rem)] overflow-x-hidden z-20">
                            {/* Page Content */}
                            <div className="flex-1">{children}</div>

                            {/* Footer */}
                            <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur-sm px-4 md:px-6 py-3">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
                                    <p>
                                        © {new Date().getFullYear()}{' '}
                                        <span className="font-semibold text-slate-500">
                                            FlyBismillah
                                        </span>
                                        . Admin Dashboard
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                            All systems operational
                                        </span>
                                    </div>
                                </div>
                            </footer>
                        </main>
                    </SidebarInset>
                </SidebarProvider>

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