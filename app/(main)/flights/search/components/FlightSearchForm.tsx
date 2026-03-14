'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Repeat, Loader2 } from 'lucide-react';
import { FaLayerGroup } from 'react-icons/fa';

import OneWayForm from './OneWayForm';
import RoundTripForm from './RoundTripForm';
import MultiCityForm from './MultiCityForm';
import { MdFlightTakeoff } from 'react-icons/md';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type TabId = 'one_way' | 'round_trip' | 'multi_city';

type Tab = {
    id: TabId;
    icon: React.ElementType;
    label: string;
    subtitle: string;
};

// ------------------------------------------------------------------
// Tab config
// ------------------------------------------------------------------
const TABS: Tab[] = [
    {
        id: 'round_trip',
        icon: Repeat,
        label: 'Round Trip',
        subtitle: 'Go and return on selected dates',
    },
    {
        id: 'one_way',
        icon: Plane,
        label: 'One Way',
        subtitle: 'Single journey to your destination',
    },
    {
        id: 'multi_city',
        icon: FaLayerGroup,
        label: 'Multi City',
        subtitle: 'Visit multiple cities in one itinerary',
    },
];

// Valid tab IDs for type-safe URL parsing
const VALID_TAB_IDS = new Set<TabId>(['one_way', 'round_trip', 'multi_city']);

// ------------------------------------------------------------------
// Inner component — uses useSearchParams so must be wrapped in Suspense
// ------------------------------------------------------------------
function FlightSearchFormInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<TabId>('round_trip');

    // Sync active tab from URL on mount and param change
    useEffect(() => {
        const typeParam = searchParams.get('type');
        // ✅ Type-safe check — prevent invalid tab IDs from being set
        if (typeParam && VALID_TAB_IDS.has(typeParam as TabId)) {
            setActiveTab(typeParam as TabId);
        }
    }, [searchParams]);

    const activeMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];

    const handleTabChange = (tabId: TabId) => {
        setActiveTab(tabId);
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set('type', tabId);
        // ✅ Remove trigger so changing tab doesn't re-fire the search
        nextParams.delete('trigger');
        router.replace(`?${nextParams.toString()}`, { scroll: false });
    };

    // Called by sub-forms after they've built their URLSearchParams
    // The parent adds trigger=1 then navigates to the results page
    const handleSearchPush = (params: URLSearchParams) => {
        params.set('trigger', '1');
        router.push(`/flights/search?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="w-full rounded-3xl relative z-20 border border-gray-100/80">
            {/* ═══════════ Header ═══════════ */}
            <div className="bg-white rounded-t-3xl px-5 md:px-7 pt-5 pb-4">
                {/* Top row */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        {/* <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
                            <Plane className="w-4 h-4 text-white -rotate-45" />
                        </div> */}
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-md shadow-rose-500/20">
                  <Plane className="text-white text-lg" />
                </div>
                        <div>
                            <h3 className="text-sm md:text-[15px] font-bold text-gray-900 leading-tight">
                                Search Flights
                            </h3>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                Find the best deals worldwide
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-emerald-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Live Prices
                    </div>
                </div>

                {/* ═══════════ Tabs ═══════════ */}
                <div
                    className="grid grid-cols-3 gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100"
                    role="tablist"
                    aria-label="Flight type"
                >
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`tab-panel-${tab.id}`}
                                className={`
                                    relative flex items-center gap-2.5
                                    px-3 md:px-4 py-3 md:py-3.5
                                    rounded-xl text-left
                                    transition-all duration-300 ease-out
                                    cursor-pointer
                                    ${
                                        isActive
                                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                                            : 'bg-gray-100 text-gray-600 hover:bg-white hover:shadow-sm'
                                    }
                                `}
                            >
                                {/* Icon wrapper */}
                                <div
                                    className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                        transition-all duration-300
                                        ${isActive ? 'bg-white/15' : 'bg-gray-100'}
                                    `}
                                >
                                    <Icon
                                        className={`w-3.5 h-3.5 ${
                                            isActive ? 'text-white' : 'text-gray-500'
                                        }`}
                                    />
                                </div>

                                {/* Label */}
                                <div className="flex flex-col min-w-0">
                                    <span
                                        className={`
                                            text-[11px] md:text-xs font-bold tracking-wide
                                            ${isActive ? 'text-white' : 'text-gray-800'}
                                        `}
                                    >
                                        {tab.label}
                                    </span>
                                    <span
                                        className={`
                                            text-[9px] md:text-[10px] font-medium truncate hidden sm:block
                                            ${isActive ? 'text-gray-300' : 'text-gray-400'}
                                        `}
                                    >
                                        {tab.subtitle}
                                    </span>
                                </div>

                                {/* Active indicator dot */}
                                {isActive && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full bg-rose-500" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Active subtitle — mobile only */}
                <div className="mt-3 flex items-center gap-2 px-1 sm:hidden">
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                    <p className="text-[11px] text-gray-500 font-medium">
                        {activeMeta.subtitle}
                    </p>
                </div>
            </div>

            {/* ═══════════ Divider ═══════════ */}
            <div className="h-px bg-gray-100" />

            {/* ═══════════ Form Area ═══════════ */}
            <div className="bg-white rounded-b-3xl">
                {/*
                  ✅ key={activeTab} forces remount when tab changes — ensures
                  sub-form state (inputs, errors) resets cleanly on tab switch
                */}
                <div key={activeTab} className="animate-in fade-in duration-300">
                    {/* ✅ aria-labelledby for accessibility */}
                    <div
                        id={`tab-panel-${activeTab}`}
                        role="tabpanel"
                        className="relative z-30"
                    >
                        {activeTab === 'one_way' && (
                            <OneWayForm onSearch={handleSearchPush} />
                        )}
                        {activeTab === 'round_trip' && (
                            <RoundTripForm onSearch={handleSearchPush} />
                        )}
                        {activeTab === 'multi_city' && (
                            <MultiCityForm onSearch={handleSearchPush} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Export — wrapped in Suspense because useSearchParams requires it
// in Next.js App Router when used outside a server component boundary
// ------------------------------------------------------------------
export default function FlightSearchForm() {
    return (
        <Suspense
            fallback={
                <div className="w-full rounded-3xl border border-gray-100/80 bg-white flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                </div>
            }
        >
            <FlightSearchFormInner />
        </Suspense>
    );
}