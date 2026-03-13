// app/documentation/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════
// ICONS (inline SVG — no external deps)
// ═══════════════════════════════════════════
const icons = {
  plane: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  search: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  book: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  ticket: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  ),
  shield: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  mail: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  card: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  ),
  rocket: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  code: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
  globe: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  user: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  users: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  cog: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  check: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  bolt: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  chart: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  terminal: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  database: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
  key: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  ),
  server: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
    </svg>
  ),
  arrowRight: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  chevronRight: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
  chevronDown: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  menu: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
    </svg>
  ),
  x: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  copy: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  ),
  bell: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  ),
  folder: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  ),
  download: (p: any) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
};

type IconKey = keyof typeof icons;

// ═══════════════════════════════════════════
// SIDEBAR NAVIGATION STRUCTURE
// ═══════════════════════════════════════════
interface NavItem {
  id: string;
  label: string;
  icon?: IconKey;
  children?: { id: string; label: string }[];
}

const navigation: NavItem[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: "rocket",
    children: [
      { id: "introduction", label: "Introduction" },
      { id: "installation", label: "Installation" },
      { id: "env-setup", label: "Environment Setup" },
    ],
  },
  {
    id: "core-features",
    label: "Core Features",
    icon: "bolt",
    children: [
      { id: "flight-search", label: "Flight Search" },
      { id: "booking-system", label: "Booking System" },
      { id: "payment", label: "Payment & Pricing" },
      { id: "email-system", label: "Email System" },
      { id: "webhook-system", label: "Webhook System" },
    ],
  },
  {
    id: "admin-panel",
    label: "Admin Panel",
    icon: "cog",
    children: [
      { id: "admin-dashboard", label: "Dashboard" },
      { id: "booking-management", label: "Booking Management" },
      { id: "staff-management", label: "Staff Management" },
      { id: "roles-permissions", label: "Roles & Permissions" },
    ],
  },
  {
    id: "cli-tool",
    label: "CLI Tool",
    icon: "terminal",
    children: [
      { id: "cli-overview", label: "Overview" },
      { id: "cli-commands", label: "Menu Options" },
      { id: "cli-admin-ops", label: "Admin Operations" },
    ],
  },
  {
    id: "architecture",
    label: "Architecture",
    icon: "code",
    children: [
      { id: "tech-stack", label: "Tech Stack" },
      { id: "system-flow", label: "System Flow" },
      { id: "database-schema", label: "Database Schema" },
      { id: "api-routes", label: "API Routes" },
    ],
  },
  {
    id: "services",
    label: "External Services",
    icon: "globe",
    children: [
      { id: "duffel-api", label: "Duffel API" },
      { id: "stripe-integration", label: "Stripe" },
      { id: "resend-email", label: "Resend Email" },
      { id: "mongodb-atlas", label: "MongoDB Atlas" },
    ],
  },
  {
    id: "deployment",
    label: "Deployment",
    icon: "server",
    children: [
      { id: "vercel-deploy", label: "Vercel Deployment" },
      { id: "env-reference", label: "Env Variables" },
      { id: "domain-dns", label: "Domain & DNS" },
    ],
  },
  {
    id: "project-status",
    label: "Status & Roadmap",
    icon: "chart",
    children: [
      { id: "current-status", label: "Current Status" },
      { id: "roadmap", label: "Roadmap" },
    ],
  },
];

// ═══════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-lg border border-zinc-200 bg-zinc-950 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        <span className="text-[11px] font-mono text-zinc-500">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
          {icons.copy({ className: "w-3.5 h-3.5" })}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed">
        <code className="text-zinc-300 font-mono">{code}</code>
      </pre>
    </div>
  );
};

const Callout = ({ type = "info", title, children }: { type?: "info" | "warning" | "danger" | "tip"; title?: string; children: React.ReactNode }) => {
  const styles = { info: "border-blue-200 bg-blue-50/50 text-blue-900", warning: "border-amber-200 bg-amber-50/50 text-amber-900", danger: "border-red-200 bg-red-50/50 text-red-900", tip: "border-emerald-200 bg-emerald-50/50 text-emerald-900" };
  const emoji = { info: "ℹ️", warning: "⚠️", danger: "🚨", tip: "💡" };
  return (
    <div className={`border rounded-lg p-4 my-4 ${styles[type]}`}>
      {title && <p className="font-semibold text-sm mb-1">{emoji[type]} {title}</p>}
      <div className="text-sm leading-relaxed opacity-90">{children}</div>
    </div>
  );
};

const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto my-4 border border-zinc-200 rounded-lg">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50">
          {headers.map((h, i) => (
            <th key={i} className="text-left px-4 py-2.5 font-semibold text-zinc-700 text-xs uppercase tracking-wider">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-2.5 text-zinc-600">
                {cell.startsWith("`") && cell.endsWith("`") ? (
                  <code className="px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded text-xs font-mono">{cell.slice(1, -1)}</code>
                ) : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "outline" }) => {
  const styles = { default: "bg-zinc-100 text-zinc-700 border-zinc-200", success: "bg-emerald-50 text-emerald-700 border-emerald-200", warning: "bg-amber-50 text-amber-700 border-amber-200", danger: "bg-red-50 text-red-700 border-red-200", outline: "bg-transparent text-zinc-500 border-zinc-300" };
  return <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold border rounded-md ${styles[variant]}`}>{children}</span>;
};

const StepList = ({ steps }: { steps: { title: string; desc: string }[] }) => (
  <div className="space-y-4 my-4">
    {steps.map((s, i) => (
      <div key={i} className="flex gap-4">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</div>
        <div className="flex-1 pb-4 border-b border-zinc-100 last:border-0">
          <p className="font-semibold text-zinc-900 text-sm">{s.title}</p>
          <p className="text-zinc-500 text-sm mt-0.5 leading-relaxed">{s.desc}</p>
        </div>
      </div>
    ))}
  </div>
);

const MiniCard = ({ icon, title, desc, tags }: { icon: IconKey; title: string; desc: string; tags?: string[] }) => (
  <div className="border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 hover:shadow-sm transition-all group">
    <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center mb-3 group-hover:bg-zinc-900 group-hover:text-white transition-all text-zinc-600">
      {icons[icon]({ className: "w-4 h-4" })}
    </div>
    <h4 className="font-semibold text-zinc-900 text-sm mb-1">{title}</h4>
    <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
    {tags && (
      <div className="flex flex-wrap gap-1 mt-3">
        {tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════════
// RIGHT SIDEBAR COMPONENT
// ═══════════════════════════════════════════
const Sidebar = ({ activeSection, onNavigate, mobileOpen, onClose }: { activeSection: string; onNavigate: (id: string) => void; mobileOpen: boolean; onClose: () => void }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    for (const group of navigation) {
      if (group.children?.some((c) => c.id === activeSection)) {
        setExpanded((prev) => ({ ...prev, [group.id]: true }));
      }
    }
  }, [activeSection]);

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-200">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
          {icons.plane({ className: "w-4 h-4 text-white" })}
        </div>
        <div>
          <span className="font-bold text-sm text-zinc-900 block leading-none">Fly Bismillah</span>
          <span className="text-[10px] text-zinc-400 font-medium">Documentation</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded-md text-zinc-400">
          {icons.search({ className: "w-3.5 h-3.5 flex-shrink-0" })}
          <span className="text-xs">Search docs...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-zinc-400 font-mono">⌘K</kbd>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navigation.map((group) => {
          const Icon = icons[group.icon || "folder"];
          const isExpanded = expanded[group.id] ?? false;
          const isActive = group.children?.some((c) => c.id === activeSection);

          return (
            <div key={group.id} className="mb-0.5">
              <button
                onClick={() => toggle(group.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors text-sm ${isActive ? "text-zinc-900 font-semibold bg-zinc-100" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 opacity-60" />
                <span className="flex-1">{group.label}</span>
                <span className={`transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}>
                  {icons.chevronDown({ className: "w-3.5 h-3.5 opacity-40" })}
                </span>
              </button>

              {isExpanded && group.children && (
                <div className="ml-4 pl-3 border-l border-zinc-200 mt-0.5 mb-1.5">
                  {group.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => { onNavigate(child.id); onClose(); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-[13px] transition-colors block ${activeSection === child.id ? "text-zinc-900 font-semibold bg-zinc-100" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"}`}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-zinc-100">
        <a href="https://flybismillah.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
          {icons.globe({ className: "w-3.5 h-3.5" })}
          flybismillah.com
          {icons.arrowRight({ className: "w-3 h-3 ml-auto" })}
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — RIGHT side */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-l border-zinc-200 bg-white fixed top-0 right-0 bottom-0 z-40 flex-col">
        {content}
      </aside>

      {/* Mobile overlay — slides from RIGHT */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
          <aside className="lg:hidden fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col">
            <button onClick={onClose} className="absolute top-4 left-4 p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
              {icons.x({ className: "w-5 h-5 text-zinc-500" })}
            </button>
            {content}
          </aside>
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// CONTENT SECTIONS
// ═══════════════════════════════════════════
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{children}</h2>
);
const SectionSub = ({ children }: { children: React.ReactNode }) => (
  <p className="text-zinc-500 text-sm mb-6">{children}</p>
);
const Divider = () => <hr className="border-zinc-200 my-10" />;

// ═══════════════════════════════════════════
// ALL DOCS CONTENT
// ═══════════════════════════════════════════
const DocsContent = () => (
  <div className="prose-zinc max-w-none">
    {/* ===== GETTING STARTED ===== */}
    <section id="introduction">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="success">Live Project</Badge>
        <Badge>v2.0</Badge>
      </div>
      <SectionTitle>Introduction</SectionTitle>
      <SectionSub>What Fly Bismillah is and why it exists</SectionSub>
      <p className="text-zinc-600 text-sm leading-relaxed mb-4">
        <strong>Fly Bismillah</strong> is a modern B2C online travel agency platform. It provides real-time
        global flight search, booking, ticket hold (Pay Later) and instant ticket issuance — all fully automated.
      </p>
      <p className="text-zinc-600 text-sm leading-relaxed mb-6">
        Built on <strong>Duffel API</strong> with access to 500+ airlines worldwide, the platform handles
        everything from search to e-ticket delivery with zero manual steps.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { v: "500+", l: "Airlines", e: "✈️" },
          { v: "Real-time", l: "Flight Data", e: "⚡" },
          { v: "100%", l: "Automated", e: "🤖" },
          { v: "Secure", l: "Webhooks", e: "🔐" },
        ].map((s) => (
          <div key={s.l} className="text-center p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
            <span className="text-xl block mb-1">{s.e}</span>
            <span className="font-bold text-zinc-900 text-lg block">{s.v}</span>
            <span className="text-zinc-500 text-xs">{s.l}</span>
          </div>
        ))}
      </div>
      <Callout type="info" title="Platform Type">
        This is a <strong>B2C (Business to Customer)</strong> platform. End users search and book flights directly. Admins manage bookings, pricing markup and ticket issuance from the admin dashboard.
      </Callout>
    </section>

    <Divider />

    <section id="installation">
      <SectionTitle>Installation</SectionTitle>
      <SectionSub>Set up the project locally in under 5 minutes</SectionSub>
      <h3 className="font-semibold text-zinc-900 text-base mb-2">Prerequisites</h3>
      <Table headers={["Requirement", "Version", "Note"]} rows={[["Node.js", "`v18+`", "LTS recommended"], ["pnpm / npm", "`Latest`", "pnpm preferred"], ["MongoDB", "`Atlas`", "Cloud database"], ["Git", "`Latest`", "Version control"]]} />
      <h3 className="font-semibold text-zinc-900 text-base mb-2 mt-6">Steps</h3>
      <CodeBlock language="bash" code={`# Clone the repository
git clone https://github.com/your-repo/fly-bismillah.git
cd fly-bismillah

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Run development server
pnpm dev`} />
      <Callout type="tip" title="Quick Start">
        Use the included <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">start.bat</code> file on Windows to auto-check dependencies, build, and launch with a single click.
      </Callout>
    </section>

    <Divider />

    <section id="env-setup">
      <SectionTitle>Environment Setup</SectionTitle>
      <SectionSub>All required environment variables for the platform</SectionSub>
      <CodeBlock language="env" code={`# Database
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/flybismillah"

# Duffel Flight API
DUFFEL_ACCESS_TOKEN="duffel_test_xxxxxx"
DUFFEL_WEBHOOK_SECRET="whsec_xxxxxx"

# Email (Resend)
RESEND_API_KEY="re_xxxxxx"
ADMIN_EMAIL="admin@flybismillah.com"

# Payment (Stripe)
STRIPE_SECRET_KEY="sk_test_xxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxx"

# Auth
JWT_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"

# App
NEXT_PUBLIC_APP_URL="https://flybismillah.com"
NODE_ENV="production"`} />
      <Callout type="warning" title="Security">
        Never commit <code className="text-xs bg-amber-100 px-1 rounded">.env.local</code> to Git. The file is listed in <code className="text-xs bg-amber-100 px-1 rounded">.gitignore</code> by default.
      </Callout>
    </section>

    <Divider />

    <section id="flight-search">
      <SectionTitle>Flight Search</SectionTitle>
      <SectionSub>Real-time global flight search across 500+ airlines</SectionSub>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <MiniCard icon="search" title="Multi-type Search" desc="Supports One-way, Round-trip and Multi-city itineraries with flexible dates." tags={["One-way", "Round-trip", "Multi-city"]} />
        <MiniCard icon="bolt" title="Smart Filters" desc="Filter by price range, airline, stops (Direct/1-Stop/2-Stop) and departure time." tags={["Price", "Airline", "Stops"]} />
        <MiniCard icon="ticket" title="Real-time Pricing" desc="Live data from Duffel API — prices update in real-time with availability." tags={["Live Data", "Accurate"]} />
        <MiniCard icon="globe" title="Global Coverage" desc="Access to 500+ airlines worldwide including budget carriers and full-service." tags={["500+ Airlines"]} />
      </div>
      <StepList steps={[
        { title: "User enters search criteria", desc: "Origin, destination, dates, passenger count and cabin class." },
        { title: "API creates offer request", desc: "Duffel API is called with the search parameters to fetch live offers." },
        { title: "Results displayed", desc: "Offers are sorted by price with filter/sort options for the user." },
        { title: "User selects a flight", desc: "Selected offer details are shown with full breakdown before proceeding." },
      ]} />
    </section>

    <Divider />

    <section id="booking-system">
      <SectionTitle>Booking System</SectionTitle>
      <SectionSub>Hold booking and instant issuance workflow</SectionSub>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div className="border border-zinc-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            {icons.clock({ className: "w-5 h-5 text-amber-500" })}
            <h4 className="font-semibold text-zinc-900">Hold Booking (Pay Later)</h4>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed mb-3">Reserve a seat without payment. The hold lasts until the airline&apos;s deadline.</p>
          <ul className="space-y-1.5 text-xs text-zinc-500">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> PNR generated instantly</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Payment deadline from airline</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Auto-cancel on expiry</li>
          </ul>
        </div>
        <div className="border border-zinc-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            {icons.bolt({ className: "w-5 h-5 text-emerald-500" })}
            <h4 className="font-semibold text-zinc-900">Instant Issuance</h4>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed mb-3">After payment, ticket is issued and delivered automatically via email.</p>
          <ul className="space-y-1.5 text-xs text-zinc-500">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ticket confirmed in seconds</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> E-ticket PDF attached</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Confirmation email sent</li>
          </ul>
        </div>
      </div>
    </section>

    <Divider />

    <section id="payment">
      <SectionTitle>Payment & Pricing</SectionTitle>
      <SectionSub>Revenue model with admin markup and gateway fees</SectionSub>
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 mb-6">
        <h4 className="font-semibold text-zinc-900 text-sm mb-4">💰 Pricing Formula</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-zinc-500">Airline Net Fare</span><span className="font-mono text-zinc-700">Base Price</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">+ Admin Markup</span><span className="font-mono text-emerald-600">Your Profit</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">+ Gateway Fee</span><span className="font-mono text-amber-600">Processing</span></div>
          <div className="border-t border-dashed border-zinc-300 pt-2 mt-2">
            <div className="flex justify-between font-semibold"><span className="text-zinc-900">= Sell Price to Customer</span><span className="font-mono text-zinc-900">Total</span></div>
          </div>
        </div>
      </div>
      <CodeBlock language="text" code={`Profit = Sell Price - (Airline Net Fare + Gateway Fee)

Example:
  Net Fare:    $500  (from Duffel)
  Markup:      $30   (your profit)
  Gateway:     $15   (Stripe fee)
  ─────────────────
  Sell Price:  $545  (charged to customer)
  Your Profit: $30`} />
      <Callout type="info">Refunds are processed back to the original payment method. Airline penalties are deducted. Service markup is retained as revenue.</Callout>
    </section>

    <Divider />

    <section id="email-system">
      <SectionTitle>Email System</SectionTitle>
      <SectionSub>Automated transactional emails via Resend + React Email</SectionSub>
      <Table headers={["Email Type", "Trigger", "Contains"]} rows={[
        ["Booking Confirmation", "Order created", "PNR, route, dates, passenger info"],
        ["E-Ticket Delivery", "Ticket issued", "PDF attachment, booking ref"],
        ["Payment Receipt", "Payment success", "Amount, transaction ID"],
        ["Hold Reminder", "Before deadline", "Deadline time, payment link"],
        ["Cancellation", "Order cancelled", "Refund info, reason"],
        ["Password Reset", "User request", "OTP code, reset link"],
        ["2FA Alert", "Login attempt", "Verification code"],
      ]} />
    </section>

    <Divider />

    <section id="webhook-system">
      <SectionTitle>Webhook System</SectionTitle>
      <SectionSub>Real-time event processing from Duffel and Stripe</SectionSub>
      <Callout type="tip" title="How it works">Webhooks are HTTP callbacks from Duffel/Stripe to your server. They notify about events like booking creation, ticket issuance, and schedule changes automatically.</Callout>
      <h3 className="font-semibold text-zinc-900 text-base mb-3 mt-6">Duffel Webhook Events</h3>
      <Table headers={["Event", "Action", "Status"]} rows={[
        ["`order.created`", "Save booking to DB, send confirmation email", "✅ Active"],
        ["`order.updated`", "Send e-ticket when documents available", "✅ Active"],
        ["`order.airline_initiated_change`", "Alert admin about schedule change", "✅ Active"],
        ["`order_cancellation.confirmed`", "Update booking status to cancelled", "✅ Active"],
      ]} />
      <h3 className="font-semibold text-zinc-900 text-base mb-3 mt-6">Security</h3>
      <ul className="space-y-2 text-sm text-zinc-600">
        <li className="flex items-start gap-2">{icons.shield({ className: "w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" })}<span><strong>HMAC-SHA256</strong> signature verification on every webhook request</span></li>
        <li className="flex items-start gap-2">{icons.shield({ className: "w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" })}<span><strong>x-duffel-signature</strong> header validated against webhook secret</span></li>
        <li className="flex items-start gap-2">{icons.shield({ className: "w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" })}<span>Crash-proof error handling with graceful fallbacks</span></li>
      </ul>
    </section>

    <Divider />

    <section id="admin-dashboard">
      <SectionTitle>Admin Dashboard</SectionTitle>
      <SectionSub>Backend management interface for platform operators</SectionSub>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <MiniCard icon="chart" title="Overview Stats" desc="Total sales, profit from markup, today's bookings, and revenue charts." />
        <MiniCard icon="ticket" title="Booking List" desc="All bookings with PNR, route, status, dates and action buttons." />
        <MiniCard icon="bolt" title="Quick Actions" desc="Issue ticket, cancel booking, resend email from the dashboard." />
        <MiniCard icon="bell" title="Risk Alerts" desc="Airline schedule changes and hold deadline warnings." />
        <MiniCard icon="users" title="Customer List" desc="View all customers with their booking history." />
        <MiniCard icon="cog" title="Settings" desc="Markup config, email templates, notification preferences." />
      </div>
    </section>

    <Divider />

    <section id="booking-management">
      <SectionTitle>Booking Management</SectionTitle>
      <SectionSub>Complete booking lifecycle from hold to completion</SectionSub>
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 mb-6">
        <h4 className="font-semibold text-zinc-900 text-sm mb-3">Booking Status Flow</h4>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <Badge variant="warning">pending</Badge><span className="text-zinc-400">→</span>
          <Badge variant="default">held</Badge><span className="text-zinc-400">→</span>
          <Badge variant="success">confirmed</Badge><span className="text-zinc-400">→</span>
          <Badge variant="success">ticketed</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono mt-2">
          <span className="text-zinc-400">or</span>
          <Badge variant="danger">cancelled</Badge><span className="text-zinc-400">/</span>
          <Badge variant="danger">expired</Badge><span className="text-zinc-400">/</span>
          <Badge variant="warning">refunded</Badge>
        </div>
      </div>
      <Table headers={["Action", "Who", "When"]} rows={[
        ["Issue Ticket", "Admin / Auto", "After payment confirmed"],
        ["Cancel Booking", "Admin / User", "Before ticket issued"],
        ["Resend Email", "Admin", "Anytime after booking"],
        ["View Details", "Admin", "Anytime"],
        ["Process Refund", "Admin", "After cancellation"],
      ]} />
    </section>

    <Divider />

    <section id="staff-management">
      <SectionTitle>Staff Management</SectionTitle>
      <SectionSub>Create and manage admin accounts from dashboard or CLI</SectionSub>
      <Callout type="info" title="Two Methods">Admins can be managed via the <strong>Admin Dashboard</strong> (web UI) or the <strong>CLI Tool</strong> (command line). Both connect to the same MongoDB database.</Callout>
      <h3 className="font-semibold text-zinc-900 text-base mb-3 mt-6">Admin Account Fields</h3>
      <Table headers={["Field", "Type", "Description"]} rows={[
        ["`name`", "String", "Full name of the admin"],
        ["`email`", "String", "Login email (unique)"],
        ["`password`", "String", "Bcrypt hashed (12 rounds)"],
        ["`phone`", "String", "Optional contact number"],
        ["`adminId`", "String", "Auto-generated unique ID (ADM-XXXX-XXXX)"],
        ["`role`", "Enum", "admin / editor / viewer"],
        ["`status`", "Enum", "active / blocked / suspended"],
        ["`permissions`", "Object", "Granular access control per module"],
        ["`lastLogin`", "Date", "Last successful login timestamp"],
        ["`isOnline`", "Boolean", "Real-time online status"],
        ["`activeSessions`", "Array", "Current active sessions with device info"],
        ["`loginHistory`", "Array", "Login audit trail"],
        ["`isTwoFactorEnabled`", "Boolean", "2FA status"],
        ["`blockReason`", "String", "Why admin was blocked (if applicable)"],
      ]} />
      <h3 className="font-semibold text-zinc-900 text-base mb-3 mt-6">Staff Operations</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <MiniCard icon="user" title="Create Admin" desc="Add new admin with name, email, password, role and auto-generated ID." />
        <MiniCard icon="search" title="Search & List" desc="Find admins by name, email or ID. View all with status indicators." />
        <MiniCard icon="cog" title="Update Profile" desc="Change name, phone, email or role with validation." />
        <MiniCard icon="shield" title="Block / Unblock" desc="Block with reason, unblock with session reset. Preserves audit trail." />
        <MiniCard icon="key" title="Reset Password" desc="Force reset with new password, clears all active sessions." />
        <MiniCard icon="user" title="Delete Admin" desc="Double confirmation (ID + DELETE keyword). Cannot delete last admin." />
      </div>
      <Callout type="warning" title="Maximum Limit">The platform allows a maximum of <strong>10 admin accounts</strong>. This limit is enforced in both the web dashboard and CLI tool.</Callout>
    </section>

    <Divider />

    <section id="roles-permissions">
      <SectionTitle>Roles & Permissions</SectionTitle>
      <SectionSub>Granular access control with three role levels</SectionSub>
      <Table headers={["Module", "Admin", "Editor", "Viewer"]} rows={[
        ["Dashboard", "✅ Full", "✅ Full", "✅ Full"],
        ["Bookings", "✅ Full", "✏️ Edit", "👁 View"],
        ["Transactions", "✅ Full", "❌ None", "❌ None"],
        ["Customers", "✅ Full", "✅ Full", "❌ None"],
        ["Destinations", "✅ Full", "✏️ Edit", "👁 View"],
        ["Packages", "✅ Full", "✏️ Edit", "👁 View"],
        ["Offers", "✅ Full", "✏️ Edit", "👁 View"],
        ["Support", "✅ Full", "✅ Full", "❌ None"],
        ["Settings", "✅ Full", "❌ None", "❌ None"],
      ]} />
      <Callout type="tip">Permission levels: <strong>full</strong> (read + write + delete), <strong>edit</strong> (read + write), <strong>view</strong> (read only), <strong>none</strong> (no access).</Callout>
    </section>

    <Divider />

    <section id="cli-overview">
      <SectionTitle>CLI Tool Overview</SectionTitle>
      <SectionSub>Windows batch script for server management and admin operations</SectionSub>
      <p className="text-zinc-600 text-sm leading-relaxed mb-4">
        The CLI tool (<code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">start.bat</code>) is a self-contained Windows batch script that embeds a Node.js admin management CLI. It handles system checks, project building, server management and direct database admin operations.
      </p>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="border border-zinc-200 rounded-lg p-4 text-center">
          <span className="text-2xl block mb-2">🔧</span>
          <span className="font-semibold text-zinc-900 text-sm block">Auto System Check</span>
          <span className="text-zinc-500 text-xs">Node.js, deps, build</span>
        </div>
        <div className="border border-zinc-200 rounded-lg p-4 text-center">
          <span className="text-2xl block mb-2">🖥️</span>
          <span className="font-semibold text-zinc-900 text-sm block">Server Management</span>
          <span className="text-zinc-500 text-xs">Start, build, background</span>
        </div>
        <div className="border border-zinc-200 rounded-lg p-4 text-center">
          <span className="text-2xl block mb-2">👤</span>
          <span className="font-semibold text-zinc-900 text-sm block">Admin Management</span>
          <span className="text-zinc-500 text-xs">CRUD operations via CLI</span>
        </div>
      </div>
      <Callout type="info" title="How It Works">The batch script extracts embedded JavaScript code (after <code className="text-xs bg-blue-100 px-1 rounded">::JSSTART</code> marker) into a temporary file, runs it with Node.js, then cleans up. No additional files needed.</Callout>
    </section>

    <Divider />

    <section id="cli-commands">
      <SectionTitle>CLI Menu Options</SectionTitle>
      <SectionSub>Main menu of the start.bat launcher</SectionSub>
      <Table headers={["Option", "Command", "Description"]} rows={[
        ["[1]", "Admin CLI", "Launch interactive admin management CLI"],
        ["[2]", "Server + Browser", "Start production server and open browser"],
        ["[3]", "Rebuild", "Run next build to rebuild the project"],
        ["[4]", "Clean + Rebuild", "Delete .next folder and rebuild from scratch"],
        ["[5]", "Server + Admin CLI", "Start server in background, then open Admin CLI"],
        ["[0]", "Exit", "Close the launcher"],
      ]} />
      <h3 className="font-semibold text-zinc-900 text-base mb-3 mt-6">Auto System Checks</h3>
      <p className="text-zinc-600 text-sm mb-3">On launch, the script automatically verifies:</p>
      <ul className="space-y-1.5 text-sm text-zinc-600 mb-4">
        <li className="flex items-center gap-2">{icons.check({ className: "w-4 h-4 text-emerald-500" })} Node.js is installed and accessible</li>
        <li className="flex items-center gap-2">{icons.check({ className: "w-4 h-4 text-emerald-500" })} Package manager detected (pnpm preferred, npm fallback)</li>
        <li className="flex items-center gap-2">{icons.check({ className: "w-4 h-4 text-emerald-500" })} Dependencies installed (<code className="text-xs bg-zinc-100 px-1 rounded">node_modules</code>)</li>
        <li className="flex items-center gap-2">{icons.check({ className: "w-4 h-4 text-emerald-500" })} Project built (<code className="text-xs bg-zinc-100 px-1 rounded">.next</code> folder)</li>
      </ul>
    </section>

    <Divider />

    <section id="cli-admin-ops">
      <SectionTitle>CLI Admin Operations</SectionTitle>
      <SectionSub>Interactive admin management directly from the command line</SectionSub>
      <p className="text-zinc-600 text-sm leading-relaxed mb-4">
        The Admin CLI connects directly to MongoDB (using your <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">DATABASE_URL</code>) and provides full CRUD operations without needing the web server running.
      </p>
      <Table headers={["Option", "Operation", "Details"]} rows={[
        ["[1]", "➕ Create Admin", "Name, email, password (with strength check), phone, role selection"],
        ["[2]", "📋 List All", "All admins with online status, role badges, login timestamps"],
        ["[3]", "🔍 Search", "Search by name, email, or admin ID with fuzzy matching"],
        ["[4]", "✏️ Update", "Change name, phone, email, or role with validation"],
        ["[5]", "🗑️ Delete", "Double confirmation required (Admin ID + type DELETE)"],
        ["[6]", "🚫 Block/Unblock", "Block with reason, unblock with session reset"],
        ["[7]", "🔑 Reset Password", "New password with strength validation, clears sessions"],
      ]} />
      <h3 className="font-semibold text-zinc-900 text-base mb-3 mt-6">Security Features</h3>
      <ul className="space-y-1.5 text-sm text-zinc-600">
        <li className="flex items-center gap-2">{icons.shield({ className: "w-4 h-4 text-zinc-400" })} Password input is masked (hidden with <code className="text-xs bg-zinc-100 px-1 rounded">*</code> characters)</li>
        <li className="flex items-center gap-2">{icons.shield({ className: "w-4 h-4 text-zinc-400" })} Password strength enforcement: min 6 chars, uppercase, lowercase, number</li>
        <li className="flex items-center gap-2">{icons.shield({ className: "w-4 h-4 text-zinc-400" })} Bcrypt hashing with 12 salt rounds</li>
        <li className="flex items-center gap-2">{icons.shield({ className: "w-4 h-4 text-zinc-400" })} Cannot delete the last admin account</li>
        <li className="flex items-center gap-2">{icons.shield({ className: "w-4 h-4 text-zinc-400" })} MongoDB URI masked in console output</li>
        <li className="flex items-center gap-2">{icons.shield({ className: "w-4 h-4 text-zinc-400" })} Graceful Ctrl+C handling with DB disconnect</li>
      </ul>
    </section>

    <Divider />

    <section id="tech-stack">
      <SectionTitle>Tech Stack</SectionTitle>
      <SectionSub>All technologies, frameworks and tools used</SectionSub>
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { cat: "Frontend", items: ["Next.js 14 (App Router)", "React 18", "Tailwind CSS", "TypeScript"] },
          { cat: "Backend", items: ["Next.js API Routes", "Server Components", "Middleware", "JWT Auth"] },
          { cat: "Database", items: ["MongoDB Atlas", "Mongoose ODM", "Indexed queries"] },
          { cat: "Services", items: ["Duffel API", "Stripe", "Resend", "React Email"] },
          { cat: "DevOps", items: ["Vercel Edge", "GitHub Actions", "pnpm", "ESLint"] },
          { cat: "Security", items: ["HMAC-SHA256", "Bcrypt", "CORS", "Rate limiting"] },
        ].map((group) => (
          <div key={group.cat} className="border border-zinc-200 rounded-lg p-4">
            <h4 className="font-semibold text-zinc-900 text-sm mb-2">{group.cat}</h4>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item} className="text-zinc-500 text-xs flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    <Divider />

    <section id="system-flow">
      <SectionTitle>System Flow</SectionTitle>
      <SectionSub>How data flows through the platform</SectionSub>
      <div className="border border-zinc-200 rounded-lg p-6 bg-zinc-50">
        <div className="flex flex-col items-center space-y-3 text-sm">
          {[
            { e: "👤", l: "Customer", s: "Search → Select → Book" },
            { e: "⚡", l: "Next.js App", s: "SSR + API Routes + Auth" },
            { e: "✈️", l: "Duffel API", s: "Flight data + Booking + Ticketing" },
            { e: "💳", l: "Stripe", s: "Payment processing" },
            { e: "🗄️", l: "MongoDB", s: "Data persistence" },
            { e: "📧", l: "Resend", s: "Automated emails" },
            { e: "🔔", l: "Webhooks", s: "Real-time event handling" },
          ].map((item, i, arr) => (
            <React.Fragment key={item.l}>
              <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg p-3 text-center hover:border-zinc-300 transition-colors">
                <span className="text-lg mr-2">{item.e}</span>
                <span className="font-semibold text-zinc-900">{item.l}</span>
                <span className="text-zinc-400 text-xs block mt-0.5">{item.s}</span>
              </div>
              {i < arr.length - 1 && <div className="w-px h-3 bg-zinc-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>

    <Divider />

    <section id="database-schema">
      <SectionTitle>Database Schema</SectionTitle>
      <SectionSub>MongoDB collections and their structure</SectionSub>
      <Table headers={["Collection", "Purpose", "Key Fields"]} rows={[
        ["admins", "Staff accounts", "name, email, role, permissions, adminId"],
        ["bookings", "Flight reservations", "pnr, route, passengers, status, duffelOrderId"],
        ["transactions", "Payment records", "amount, stripeId, bookingRef, status"],
        ["customers", "End user accounts", "name, email, phone, passportInfo"],
        ["destinations", "Searchable locations", "city, country, airportCode, iata"],
        ["notifications", "System alerts", "type, message, read, adminId"],
      ]} />
      <Callout type="info">All collections use Mongoose ODM with timestamps enabled (<code className="text-xs bg-blue-100 px-1 rounded">createdAt</code>, <code className="text-xs bg-blue-100 px-1 rounded">updatedAt</code>).</Callout>
    </section>

    <Divider />

    <section id="api-routes">
      <SectionTitle>API Routes</SectionTitle>
      <SectionSub>Next.js API endpoints</SectionSub>
      <Table headers={["Endpoint", "Method", "Auth", "Purpose"]} rows={[
        ["`/api/flights/search`", "POST", "Public", "Search flights via Duffel"],
        ["`/api/flights/offers`", "POST", "Public", "Get offer details"],
        ["`/api/bookings/create`", "POST", "Auth", "Create a booking/hold"],
        ["`/api/bookings/[id]`", "GET", "Auth", "Get booking details"],
        ["`/api/bookings/cancel`", "POST", "Admin", "Cancel a booking"],
        ["`/api/bookings/issue`", "POST", "Admin", "Issue ticket from hold"],
        ["`/api/payments/create`", "POST", "Auth", "Create payment intent"],
        ["`/api/webhooks/duffel`", "POST", "Webhook", "Duffel event handler"],
        ["`/api/webhooks/stripe`", "POST", "Webhook", "Stripe event handler"],
        ["`/api/admin/login`", "POST", "Public", "Admin authentication"],
        ["`/api/admin/admins`", "GET/POST", "Admin", "List/Create admins"],
        ["`/api/admin/admins/[id]`", "PATCH/DELETE", "Admin", "Update/Delete admin"],
      ]} />
    </section>

    <Divider />

    <section id="duffel-api">
      <SectionTitle>Duffel API</SectionTitle>
      <SectionSub>Flight search, booking and ticketing engine</SectionSub>
      <p className="text-zinc-600 text-sm leading-relaxed mb-4">Duffel provides access to <strong>500+ airlines</strong> worldwide. The API handles offer requests, order creation, ticket issuance, cancellations and real-time webhook notifications.</p>
      <Table headers={["Variable", "Purpose"]} rows={[
        ["`DUFFEL_ACCESS_TOKEN`", "API authentication token (test or live)"],
        ["`DUFFEL_WEBHOOK_SECRET`", "Webhook signature verification secret"],
      ]} />
      <Callout type="warning">Use <code className="text-xs bg-amber-100 px-1 rounded">duffel_test_</code> tokens for development. Switch to <code className="text-xs bg-amber-100 px-1 rounded">duffel_live_</code> for production.</Callout>
    </section>

    <Divider />

    <section id="stripe-integration">
      <SectionTitle>Stripe Integration</SectionTitle>
      <SectionSub>Secure payment processing</SectionSub>
      <Table headers={["Variable", "Purpose"]} rows={[
        ["`STRIPE_SECRET_KEY`", "Server-side API key"],
        ["`STRIPE_PUBLISHABLE_KEY`", "Client-side key for Stripe Elements"],
        ["`STRIPE_WEBHOOK_SECRET`", "Payment event verification"],
      ]} />
    </section>

    <Divider />

    <section id="resend-email">
      <SectionTitle>Resend Email</SectionTitle>
      <SectionSub>Transactional email service with React Email templates</SectionSub>
      <Table headers={["Variable", "Purpose"]} rows={[
        ["`RESEND_API_KEY`", "API key for sending emails"],
        ["`ADMIN_EMAIL`", "Default sender/reply-to address"],
      ]} />
    </section>

    <Divider />

    <section id="mongodb-atlas">
      <SectionTitle>MongoDB Atlas</SectionTitle>
      <SectionSub>Cloud database with auto-scaling</SectionSub>
      <Table headers={["Variable", "Purpose"]} rows={[
        ["`DATABASE_URL`", "MongoDB connection string (or MONGODB_URI)"],
      ]} />
    </section>

    <Divider />

    <section id="vercel-deploy">
      <SectionTitle>Vercel Deployment</SectionTitle>
      <SectionSub>Edge deployment with auto CI/CD from GitHub</SectionSub>
      <StepList steps={[
        { title: "Push to GitHub", desc: "Code is stored in a private GitHub repository." },
        { title: "Vercel auto-deploys", desc: "Every push to main branch triggers a new deployment." },
        { title: "Environment variables", desc: "Set all env vars in Vercel dashboard → Settings → Environment Variables." },
        { title: "Domain setup", desc: "Connect custom domain (flybismillah.com) in Vercel → Domains." },
      ]} />
    </section>

    <Divider />

    <section id="env-reference">
      <SectionTitle>Environment Variables Reference</SectionTitle>
      <SectionSub>Complete list of all required environment variables</SectionSub>
      <Table headers={["Variable", "Required", "Service"]} rows={[
        ["`DATABASE_URL`", "✅ Yes", "MongoDB Atlas"],
        ["`DUFFEL_ACCESS_TOKEN`", "✅ Yes", "Duffel API"],
        ["`DUFFEL_WEBHOOK_SECRET`", "✅ Yes", "Duffel Webhooks"],
        ["`RESEND_API_KEY`", "✅ Yes", "Email Service"],
        ["`ADMIN_EMAIL`", "✅ Yes", "Email Sender"],
        ["`STRIPE_SECRET_KEY`", "✅ Yes", "Payment"],
        ["`STRIPE_PUBLISHABLE_KEY`", "✅ Yes", "Payment (Client)"],
        ["`STRIPE_WEBHOOK_SECRET`", "✅ Yes", "Payment Webhooks"],
        ["`JWT_SECRET`", "✅ Yes", "Authentication"],
        ["`NEXTAUTH_SECRET`", "✅ Yes", "Session"],
        ["`NEXT_PUBLIC_APP_URL`", "✅ Yes", "App Config"],
      ]} />
    </section>

    <Divider />

    <section id="domain-dns">
      <SectionTitle>Domain & DNS</SectionTitle>
      <SectionSub>Domain configuration and email authentication</SectionSub>
      <Table headers={["Record", "Type", "Purpose"]} rows={[
        ["DKIM", "TXT", "Email authentication for Resend"],
        ["SPF", "TXT", "Sender verification"],
        ["DMARC", "TXT", "Email delivery policy"],
        ["CNAME", "CNAME", "Vercel deployment alias"],
        ["A Record", "A", "Root domain to Vercel IP"],
      ]} />
    </section>

    <Divider />

    <section id="current-status">
      <SectionTitle>Current Status</SectionTitle>
      <SectionSub>Which modules are complete and which are in progress</SectionSub>
      <div className="space-y-2 mb-6">
        {[
          { s: "done" as const, l: "Flight Search & Booking System" },
          { s: "done" as const, l: "Email System (Resend + React Email)" },
          { s: "done" as const, l: "Webhook System (Duffel + Stripe)" },
          { s: "done" as const, l: "MongoDB Database & Schema" },
          { s: "done" as const, l: "Admin Dashboard & Staff Management" },
          { s: "done" as const, l: "CLI Tool (start.bat)" },
          { s: "pending" as const, l: "Payment Gateway (Stripe live integration)" },
          { s: "pending" as const, l: "Production Deployment (flybismillah.com)" },
        ].map((item) => (
          <div key={item.l} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${item.s === "done" ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" : "bg-amber-50/50 border-amber-200 text-amber-800"}`}>
            {item.s === "done" ? icons.check({ className: "w-4 h-4 text-emerald-500 flex-shrink-0" }) : icons.clock({ className: "w-4 h-4 text-amber-500 flex-shrink-0" })}
            <span className="flex-1">{item.l}</span>
            <Badge variant={item.s === "done" ? "success" : "warning"}>{item.s === "done" ? "Complete" : "In Progress"}</Badge>
          </div>
        ))}
      </div>
      <div className="border border-zinc-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-zinc-900 text-sm">Overall Progress</span>
          <span className="font-bold text-zinc-900">75%</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-900 rounded-full transition-all duration-1000" style={{ width: "75%" }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-zinc-400 text-xs">6 of 8 modules complete</span>
          <span className="text-zinc-400 text-xs">2 in progress</span>
        </div>
      </div>
    </section>

    <Divider />

    <section id="roadmap">
      <SectionTitle>Roadmap</SectionTitle>
      <SectionSub>Planned features and improvements</SectionSub>
      <div className="space-y-3">
        {[
          { phase: "Phase 1", status: "done" as const, items: ["Flight search & filters", "Hold booking system", "Admin dashboard", "Email automation", "CLI tool"] },
          { phase: "Phase 2", status: "pending" as const, items: ["Stripe live payment", "Production deployment", "Performance optimization", "SEO optimization"] },
          { phase: "Phase 3", status: "pending" as const, items: ["Mobile app (React Native)", "Multi-language support", "Advanced analytics", "Customer loyalty program"] },
        ].map((phase) => (
          <div key={phase.phase} className="border border-zinc-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-zinc-900 text-sm">{phase.phase}</span>
              <Badge variant={phase.status === "done" ? "success" : "warning"}>{phase.status === "done" ? "Complete" : "Planned"}</Badge>
            </div>
            <ul className="space-y-1">
              {phase.items.map((item) => (
                <li key={item} className="text-zinc-500 text-xs flex items-center gap-2">
                  {phase.status === "done" ? icons.check({ className: "w-3.5 h-3.5 text-emerald-500" }) : <span className="w-3.5 h-3.5 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-zinc-300" /></span>}
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    <div className="mt-16 pt-8 border-t border-zinc-200 text-center">
      <p className="text-zinc-400 text-xs">© {new Date().getFullYear()} Fly Bismillah — B2C Online Travel Agency Platform</p>
      <a href="https://flybismillah.com" className="text-zinc-500 text-xs hover:text-zinc-900 transition-colors mt-1 inline-block">flybismillah.com →</a>
    </div>
  </div>
);

// ═══════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════
export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const allIds = navigation.flatMap((g) => g.children?.map((c) => c.id) || []);
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (let i = allIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(allIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(allIds[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigate = useCallback((id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const offset = el.offsetTop - 80;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, []);

  return (
    <>
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }
        body { overflow-x: hidden; }
      `}</style>

      <div className="min-h-screen bg-white">
        <Sidebar
          activeSection={activeSection}
          onNavigate={handleNavigate}
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Top bar (mobile) */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
              {icons.plane({ className: "w-3 h-3 text-white" })}
            </div>
            <span className="font-semibold text-sm text-zinc-900">Docs</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
          >
            {icons.menu({ className: "w-5 h-5 text-zinc-600" })}
          </button>
        </header>

        {/* Main content — padding on RIGHT for sidebar */}
        <main className="lg:pr-64">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-12 pb-16">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-8">
              <span>Docs</span>
              {icons.chevronRight({ className: "w-3 h-3" })}
              <span className="text-zinc-600 font-medium capitalize">{activeSection.replace(/-/g, " ")}</span>
            </div>

            <DocsContent />
          </div>
        </main>
      </div>
    </>
  );
}