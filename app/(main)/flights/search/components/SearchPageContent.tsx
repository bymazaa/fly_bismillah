'use client';

import {
    useState,
    useEffect,
    Suspense,
    useRef,
    useMemo,
    useCallback,
} from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Plane,
    AlertCircle,
    Check,
    Filter,
    X,
    SlidersHorizontal,
    ChevronDown,
    BadgePercent,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { HiOutlineSparkles } from 'react-icons/hi2';

import FlightSearchForm from './FlightSearchForm';
import { FlightSearchSkeleton } from './FlightSearchSkeleton';
import { FlightResultCard } from './FlightResultCard';
import { FlightOffer } from '../types/searchTypes';
import { PriceValidityNotice } from './PriceValidityNotice';

const RESULTS_PER_PAGE = 25;

// ------------------------------------------------------------------
// Duration string → total minutes (for correct sort)
// e.g. "1d 2h 30m" → 1590
// ------------------------------------------------------------------
const durationToMinutes = (duration: string): number => {
    const d = duration.match(/(\d+)d/)?.[1];
    const h = duration.match(/(\d+)h/)?.[1];
    const m = duration.match(/(\d+)m/)?.[1];
    return (
        (parseInt(d || '0') * 1440) +
        (parseInt(h || '0') * 60) +
        parseInt(m || '0')
    );
};

// ------------------------------------------------------------------
// Filter Content
// ------------------------------------------------------------------
const FilterContent = ({
    selectedStops,
    selectedAirlines,
    stopCounts,
    airlineCounts,
    uniqueAirlines,
    toggleStop,
    toggleAirline,
}: {
    selectedStops: string[];
    selectedAirlines: string[];
    stopCounts: Record<string, number>;
    airlineCounts: Record<string, number>;
    uniqueAirlines: string[];
    toggleStop: (id: string) => void;
    toggleAirline: (name: string) => void;
}) => (
    <div className="space-y-7">
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.16em] mb-3">
                Stops
            </p>
            <div className="grid grid-cols-2 gap-2">
                {[
                    { id: 'direct', label: 'Direct' },
                    { id: '1_stop', label: '1 Stop' },
                    { id: '2_stop', label: '2 Stops' },
                    { id: '2plus_stop', label: '2+ Stops' },
                ].map((stop) => {
                    const isActive = selectedStops.includes(stop.id);
                    const count = stopCounts[stop.id] ?? 0;

                    return (
                        <button
                            key={stop.id}
                            type="button"
                            onClick={() => toggleStop(stop.id)}
                            className={`
                                relative flex flex-col items-center justify-center
                                p-3 rounded-xl border
                                transition-all duration-300 cursor-pointer
                                active:scale-[0.97]
                                ${
                                    isActive
                                        ? 'bg-gray-900 border-gray-800 text-white shadow-md'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                                }
                            `}
                        >
                            <span className="text-sm font-bold">
                                {stop.label}
                            </span>
                            <span className="text-[10px] font-medium mt-0.5 text-gray-400">
                                {count} flights
                            </span>
                            {isActive && (
                                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-md bg-emerald-500 flex items-center justify-center">
                                    <Check className="w-2 h-2 text-white" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>

        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.16em] mb-3">
                Airlines
            </p>
            <div className="space-y-1">
                {uniqueAirlines.map((airline) => {
                    const isActive = selectedAirlines.includes(airline);

                    return (
                        <button
                            key={airline}
                            type="button"
                            onClick={() => toggleAirline(airline)}
                            className="
                                w-full flex items-center justify-between
                                px-3 py-2.5 rounded-xl
                                transition-all duration-200
                                cursor-pointer hover:bg-gray-50
                                group/airline
                            "
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`
                                        w-5 h-5 rounded-md border flex items-center justify-center
                                        transition-all duration-200
                                        ${
                                            isActive
                                                ? 'bg-gray-900 border-gray-900'
                                                : 'border-gray-300 bg-white group-hover/airline:border-gray-400'
                                        }
                                    `}
                                >
                                    {isActive && (
                                        <Check className="w-3 h-3 text-white" />
                                    )}
                                </div>
                                <span
                                    className={`text-sm font-medium ${
                                        isActive ? 'text-gray-900' : 'text-gray-600'
                                    }`}
                                >
                                    {airline}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                                {airlineCounts[airline]}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
);

// ------------------------------------------------------------------
// Airline Price Grid
// ------------------------------------------------------------------
const AirlinePriceGrid = ({
    offers,
    selectedAirlines,
    onToggle,
}: {
    offers: FlightOffer[];
    selectedAirlines: string[];
    onToggle: (name: string) => void;
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const airlineStats = useMemo(() => {
        const stats: Record<
            string,
            {
                name: string;
                logo: string | null;
                minPrice: number;
                maxPrice: number;
                currency: string;
                count: number;
            }
        > = {};

        offers.forEach((offer) => {
            // ✅ null guard — carrier.name can be null
            const name = offer.carrier.name ?? 'Unknown Airline';
            const price = offer.price.finalPrice;
            const currency = offer.price.currency;
            const logo = offer.carrier.logo;

            if (!stats[name]) {
                stats[name] = { name, logo, minPrice: price, maxPrice: price, currency, count: 1 };
            } else {
                stats[name].count++;
                if (price < stats[name].minPrice) {
                    stats[name].minPrice = price;
                    stats[name].logo = logo;
                }
                if (price > stats[name].maxPrice) {
                    stats[name].maxPrice = price;
                }
            }
        });

        return Object.values(stats).sort((a, b) => a.minPrice - b.minPrice);
    }, [offers]);

    const checkScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
        }
        return () => {
            if (el) el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [airlineStats, checkScroll]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -200 : 200,
            behavior: 'smooth',
        });
    };

    if (airlineStats.length === 0) return null;

    const lowestPrice = airlineStats[0]?.minPrice ?? 0;
    const highestPrice = airlineStats[airlineStats.length - 1]?.minPrice ?? 1;
    const priceRange = highestPrice - lowestPrice || 1;

    return (
        <div className="w-full mb-6 relative">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
                        <BadgePercent className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">
                            Compare Airlines
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            {airlineStats.length} airline{airlineStats.length > 1 ? 's' : ''} available
                            {selectedAirlines.length > 0 && (
                                <span className="text-gray-900">
                                    {' · '}{selectedAirlines.length} selected
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {selectedAirlines.length > 0 && (
                        <button
                            onClick={() => selectedAirlines.forEach((a) => onToggle(a))}
                            className="
                                text-[11px] font-semibold text-rose-600
                                hover:text-rose-700
                                px-2.5 py-1.5 rounded-lg hover:bg-rose-50
                                transition-all duration-200 cursor-pointer
                            "
                        >
                            Clear
                        </button>
                    )}
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className={`
                            w-7 h-7 rounded-lg border flex items-center justify-center
                            transition-all duration-200 cursor-pointer active:scale-90
                            ${
                                canScrollLeft
                                    ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600'
                                    : 'bg-gray-50 border-gray-100 text-gray-300 cursor-default'
                            }
                        `}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className={`
                            w-7 h-7 rounded-lg border flex items-center justify-center
                            transition-all duration-200 cursor-pointer active:scale-90
                            ${
                                canScrollRight
                                    ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600'
                                    : 'bg-gray-50 border-gray-100 text-gray-300 cursor-default'
                            }
                        `}
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="relative">
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                )}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                )}

                <div
                    ref={scrollRef}
                    className="
                        flex gap-2 overflow-x-auto pb-1
                        snap-x scroll-smooth
                        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                    "
                >
                    {airlineStats.map((airline, idx) => {
                        const isSelected = selectedAirlines.includes(airline.name);
                        const isCheapest = idx === 0;
                        const priceDiff =
                            idx > 0
                                ? Math.round(((airline.minPrice - lowestPrice) / lowestPrice) * 100)
                                : 0;
                        const priceBarWidth = Math.max(
                            15,
                            100 - ((airline.minPrice - lowestPrice) / priceRange) * 85,
                        );

                        return (
                            <button
                                key={airline.name}
                                onClick={() => onToggle(airline.name)}
                                className={`
                                    group relative flex flex-col
                                    min-w-[160px] max-w-[180px]
                                    p-3 pb-2.5 rounded-xl border snap-start text-left
                                    transition-all duration-300 cursor-pointer active:scale-[0.97]
                                    ${
                                        isSelected
                                            ? 'bg-gray-900 border-gray-800 shadow-lg shadow-gray-900/15 ring-1 ring-gray-700'
                                            : isCheapest
                                              ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/50'
                                              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md hover:shadow-gray-100/50'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2.5 w-full mb-3">
                                    <div
                                        className={`
                                            w-8 h-8 rounded-lg flex items-center justify-center
                                            shrink-0 overflow-hidden transition-all duration-300
                                            ${
                                                isSelected
                                                    ? 'bg-white/10 border border-white/10'
                                                    : 'bg-white border border-gray-100'
                                            }
                                        `}
                                    >
                                        {airline.logo ? (
                                            <img
                                                src={airline.logo}
                                                alt={airline.name}
                                                className="w-5 h-5 object-contain"
                                            />
                                        ) : (
                                            <Plane
                                                className={`w-3.5 h-3.5 ${
                                                    isSelected ? 'text-white/40' : 'text-gray-300'
                                                }`}
                                            />
                                        )}
                                    </div>

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span
                                            className={`text-[11px] font-bold truncate leading-tight ${
                                                isSelected ? 'text-white' : 'text-gray-900'
                                            }`}
                                        >
                                            {airline.name}
                                        </span>
                                        <span
                                            className={`text-[9px] font-medium ${
                                                isSelected ? 'text-gray-500' : 'text-gray-400'
                                            }`}
                                        >
                                            {airline.count} flight{airline.count > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {isSelected && (
                                        <div className="w-4 h-4 rounded-md bg-emerald-500 flex items-center justify-center shrink-0">
                                            <span className="text-white text-[7px] font-bold">✓</span>
                                        </div>
                                    )}

                                    {isCheapest && !isSelected && (
                                        <span className="text-[7px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                                            Best
                                        </span>
                                    )}
                                </div>

                                <div className="w-full">
                                    <div className="flex items-baseline justify-between mb-1.5">
                                        <span
                                            className={`text-[15px] font-extrabold leading-none ${
                                                isSelected
                                                    ? 'text-white'
                                                    : isCheapest
                                                      ? 'text-emerald-700'
                                                      : 'text-gray-900'
                                            }`}
                                        >
                                            {airline.currency} {airline.minPrice.toLocaleString()}
                                        </span>
                                        {priceDiff > 0 && (
                                            <span
                                                className={`text-[9px] font-bold ${
                                                    isSelected ? 'text-red-400' : 'text-red-500'
                                                }`}
                                            >
                                                +{priceDiff}%
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className={`w-full h-1 rounded-full overflow-hidden ${
                                            isSelected ? 'bg-white/10' : 'bg-gray-100'
                                        }`}
                                    >
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                                                isSelected
                                                    ? 'bg-emerald-500'
                                                    : isCheapest
                                                      ? 'bg-emerald-500'
                                                      : priceDiff > 20
                                                        ? 'bg-red-400'
                                                        : 'bg-amber-400'
                                            }`}
                                            style={{ width: `${priceBarWidth}%` }}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedAirlines.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-[11px] font-medium text-gray-400">Showing:</span>
                    {selectedAirlines.map((name) => {
                        const airline = airlineStats.find((a) => a.name === name);
                        return (
                            <button
                                key={name}
                                onClick={() => onToggle(name)}
                                className="
                                    inline-flex items-center gap-1.5
                                    pl-2 pr-1.5 py-1 rounded-lg
                                    bg-gray-900 text-white text-[10px] font-semibold
                                    hover:bg-gray-800 transition-all duration-200
                                    cursor-pointer active:scale-95 group/tag
                                "
                            >
                                {airline?.logo && (
                                    <img
                                        src={airline.logo}
                                        alt={name}
                                        className="w-3.5 h-3.5 object-contain rounded-sm bg-white/10"
                                    />
                                )}
                                <span className="max-w-[80px] truncate">{name}</span>
                                <span className="w-4 h-4 rounded-md bg-white/10 group-hover/tag:bg-red-500 flex items-center justify-center transition-colors">
                                    <span className="text-[8px]">✕</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ------------------------------------------------------------------
// MAIN PAGE CONTENT
// ------------------------------------------------------------------
function SearchPageContent() {
    const searchParams = useSearchParams();
    const resultsRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(false);
    const [rawResults, setRawResults] = useState<FlightOffer[]>([]);
    const [error, setError] = useState('');
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    const [sortBy, setSortBy] = useState<'best' | 'price_asc' | 'price_desc' | 'duration'>('best');
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
    const [selectedStops, setSelectedStops] = useState<string[]>([]);

    const [visibleCount, setVisibleCount] = useState(RESULTS_PER_PAGE);
    const [loadingMore, setLoadingMore] = useState(false);

    const activeFilterCount = selectedAirlines.length + selectedStops.length;

    const handleResetFilters = useCallback(() => {
        setSelectedAirlines([]);
        setSelectedStops([]);
        setSortBy('best');
        setVisibleCount(RESULTS_PER_PAGE);
    }, []);

    const toggleAirline = useCallback((airline: string) => {
        setSelectedAirlines((prev) =>
            prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline],
        );
        setVisibleCount(RESULTS_PER_PAGE);
    }, []);

    const toggleStop = useCallback((stopType: string) => {
        setSelectedStops((prev) =>
            prev.includes(stopType) ? prev.filter((s) => s !== stopType) : [...prev, stopType],
        );
        setVisibleCount(RESULTS_PER_PAGE);
    }, []);

    const handleLoadMore = useCallback(() => {
        setLoadingMore(true);
        setTimeout(() => {
            setVisibleCount((prev) => prev + RESULTS_PER_PAGE);
            setLoadingMore(false);
        }, 400);
    }, []);

    useEffect(() => {
        setVisibleCount(RESULTS_PER_PAGE);
    }, [sortBy]);

    // ----------------------------------------------------------------
    // Fetch flights
    // ----------------------------------------------------------------
    useEffect(() => {
        const type = searchParams.get('type');
        const trigger = searchParams.get('trigger');

        if (!type || trigger !== '1') return;

        const fetchFlights = async () => {
            setError('');
            setLoading(true);
            setRawResults([]);
            setSelectedAirlines([]);
            setSelectedStops([]);
            setSortBy('best');
            setVisibleCount(RESULTS_PER_PAGE);

            try {
                // ✅ Build base payload
                 setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
                const payload: Record<string, unknown> = {
                    type,
                    passengers: {
                        adults: parseInt(searchParams.get('adt') || '1'),
                        children: parseInt(searchParams.get('chd') || '0'),
                        // ✅ childAges — parse from URL, required by validation schema
                        childAges: (() => {
                            try {
                                return JSON.parse(searchParams.get('childAges') || '[]');
                            } catch {
                                return [];
                            }
                        })(),
                        infants: parseInt(searchParams.get('inf') || '0'),
                    },
                    cabinClass: searchParams.get('class') || 'economy',
                };

                // ✅ Route-specific fields
                if (type === 'multi_city') {
                    try {
                        const legsJson = searchParams.get('flights');
                        if (legsJson) payload.flights = JSON.parse(legsJson);
                    } catch {
                        throw new Error('Invalid multi-city flight data.');
                    }
                } else {
                    payload.origin = searchParams.get('origin');
                    payload.destination = searchParams.get('dest');
                    payload.departureDate = searchParams.get('date');
                    if (type === 'round_trip') {
                        payload.returnDate = searchParams.get('ret');
                    }
                }

                const res = await fetch('/api/flights/search', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' },
                });

                const responseData = await res.json();

                if (!res.ok || !responseData.success) {
                    throw new Error(responseData.error || 'Failed to fetch flight data.');
                }

                setRawResults(responseData.data || []);
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : 'An unexpected error occurred.';
                console.error('[FlightSearch] Fetch error:', err);
                setError(message);
            } finally {
                setLoading(false);
                // ✅ Scroll after fetch completes, not before
                // setTimeout(() => {
                //     resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // }, 100);
            }
        };

        fetchFlights();
    }, [searchParams]);

    // ----------------------------------------------------------------
    // Filter & Sort — memoized
    // ----------------------------------------------------------------
    const filteredResults = useMemo(() => {
        let res = [...rawResults];

        // Stop filter
        if (selectedStops.length > 0) {
            res = res.filter((f) => {
                const stops = f.itinerary[0]?.stops ?? 0;
                if (selectedStops.includes('direct') && stops === 0) return true;
                if (selectedStops.includes('1_stop') && stops === 1) return true;
                if (selectedStops.includes('2_stop') && stops === 2) return true;
                if (selectedStops.includes('2plus_stop') && stops > 2) return true;
                return false;
            });
        }

        // Airline filter — ✅ null guard on carrier.name
        if (selectedAirlines.length > 0) {
            res = res.filter((f) => {
                const name = f.carrier.name ?? 'Unknown Airline';
                return selectedAirlines.includes(name);
            });
        }

        // Sort
        switch (sortBy) {
            case 'price_asc':
                res.sort((a, b) => a.price.finalPrice - b.price.finalPrice);
                break;
            case 'price_desc':
                res.sort((a, b) => b.price.finalPrice - a.price.finalPrice);
                break;
            case 'duration':
                // ✅ Convert to minutes for correct numeric sort — string sort is wrong
                res.sort(
                    (a, b) =>
                        durationToMinutes(a.itinerary[0]?.totalDuration ?? '0m') -
                        durationToMinutes(b.itinerary[0]?.totalDuration ?? '0m'),
                );
                break;
            case 'best':
            default:
                // Best = weighted score of price + duration
                res.sort((a, b) => {
                    const priceScore = a.price.finalPrice - b.price.finalPrice;
                    const durationScore =
                        durationToMinutes(a.itinerary[0]?.totalDuration ?? '0m') -
                        durationToMinutes(b.itinerary[0]?.totalDuration ?? '0m');
                    return priceScore * 0.6 + durationScore * 0.4;
                });
                break;
        }

        return res;
    }, [rawResults, selectedAirlines, selectedStops, sortBy]);

    // Sliced for display
    const visibleResults = useMemo(
        () => filteredResults.slice(0, visibleCount),
        [filteredResults, visibleCount],
    );

    const hasMore = visibleCount < filteredResults.length;
    const remainingCount = filteredResults.length - visibleCount;

    // ----------------------------------------------------------------
    // Counts for filter sidebar — memoized
    // ----------------------------------------------------------------
    const { airlineCounts, stopCounts, uniqueAirlines } = useMemo(() => {
        const aCounts: Record<string, number> = {};
        const sCounts: Record<string, number> = {
            direct: 0,
            '1_stop': 0,
            '2_stop': 0,
            '2plus_stop': 0,
        };

        rawResults.forEach((f) => {
            // ✅ null guard — carrier.name can be null
            const name = f.carrier.name ?? 'Unknown Airline';
            aCounts[name] = (aCounts[name] || 0) + 1;

            const stops = f.itinerary[0]?.stops ?? 0;
            if (stops === 0) sCounts['direct']++;
            else if (stops === 1) sCounts['1_stop']++;
            else if (stops === 2) sCounts['2_stop']++;
            else sCounts['2plus_stop']++;
        });

        return {
            airlineCounts: aCounts,
            stopCounts: sCounts,
            uniqueAirlines: Object.keys(aCounts),
        };
    }, [rawResults]);

    const filterProps = {
        selectedStops,
        selectedAirlines,
        stopCounts,
        airlineCounts,
        uniqueAirlines,
        toggleStop,
        toggleAirline,
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
            {/* ═══════════ Mobile Filter Modal ═══════════ */}
            {showMobileFilter && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowMobileFilter(false)}
                    />
                    <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto relative z-10 animate-in slide-in-from-bottom-10 duration-300 shadow-2xl">
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                                    <Filter className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">
                                        Filter Flights
                                    </h3>
                                    {activeFilterCount > 0 && (
                                        <p className="text-[10px] text-gray-400 font-medium">
                                            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowMobileFilter(false)}
                                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 py-5">
                            <FilterContent {...filterProps} />
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex items-center gap-3">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={handleResetFilters}
                                    className="
                                        h-12 px-5 rounded-xl
                                        border border-gray-200 bg-white
                                        text-sm font-semibold text-gray-700
                                        hover:bg-gray-50
                                        transition-all cursor-pointer active:scale-[0.98]
                                    "
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={() => setShowMobileFilter(false)}
                                className="
                                    flex-1 h-12 rounded-xl
                                    bg-gray-900 hover:bg-gray-800
                                    text-white text-sm font-bold
                                    flex items-center justify-center gap-2
                                    shadow-lg shadow-gray-900/10
                                    transition-all cursor-pointer active:scale-[0.98]
                                "
                            >
                                Show {filteredResults.length} Results
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ Hero ═══════════ */}
            <section className="relative overflow-hidden bg-gray-950">
                <img
                    src="/e0b.jpg"
                    alt="Flight Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/60 to-gray-950" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
                <div className="max-w-6xl mx-auto px-4 relative z-10 pt-16 md:pt-24 pb-32 md:pb-40 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-5">
                        <HiOutlineSparkles className="text-rose-400 text-sm" />
                        <span className="text-[12px] font-medium text-gray-300 tracking-wide">
                            Live fares from global airlines
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3 leading-[1.1]">
                        Find Your Next Flight
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        Search, compare and book flights from hundreds of airlines in one place.
                    </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
            </section>

            {/* ═══════════ Search Form ═══════════ */}
            <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-20 mb-10">
                <div className="rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80 bg-white">
                    <FlightSearchForm />
                </div>
            </div>

            <div ref={resultsRef} className="scroll-mt-24" />

            {/* ═══════════ Results ═══════════ */}
            <div className="max-w-7xl mx-auto px-4">
                {error ? (
                    <div className="p-8 rounded-2xl bg-red-50 border border-red-100 flex flex-col items-center justify-center gap-3 mt-8">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-red-700">Search Failed</h3>
                        <p className="text-sm text-red-600 text-center max-w-md">{error}</p>
                    </div>
                ) : (
                    (loading || rawResults.length > 0 || searchParams.get('type')) && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                            {/* ═══ Sidebar ═══ */}
                            <div className="
                                hidden lg:block lg:col-span-1
                                rounded-2xl bg-white
                                border border-gray-200/70
                                sticky top-4
                                max-h-[calc(100vh-2rem)]
                                overflow-y-auto custom-scrollbar
                                shadow-xl shadow-gray-100/40
                            ">
                                <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
                                    <div className="px-5 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                                                <Filter className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 leading-tight">
                                                    Filters
                                                </h3>
                                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                    Refine your results
                                                </p>
                                            </div>
                                        </div>

                                        {activeFilterCount > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-gray-900 bg-gray-100 w-5 h-5 rounded-md flex items-center justify-center">
                                                    {activeFilterCount}
                                                </span>
                                                <button
                                                    onClick={handleResetFilters}
                                                    className="
                                                        text-[11px] font-semibold text-rose-600
                                                        hover:text-rose-700 hover:bg-rose-50
                                                        px-2 py-1 rounded-lg
                                                        transition-all duration-200 cursor-pointer
                                                    "
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className={`px-5 py-4 transition-all duration-300 ${
                                        loading ? 'opacity-40 pointer-events-none' : ''
                                    }`}
                                >
                                    <FilterContent {...filterProps} />
                                </div>
                            </div>

                            {/* ═══ Main Content ═══ */}
                            <div className="col-span-1 lg:col-span-3">
                                {loading ? (
                                    <div className="animate-in fade-in duration-300">
                                        <FlightSearchSkeleton />
                                    </div>
                                ) : rawResults.length > 0 ? (
                                    <div className="animate-in fade-in duration-500">
                                        <PriceValidityNotice offerId="" showTimer={false} />

                                        <AirlinePriceGrid
                                            offers={rawResults}
                                            selectedAirlines={selectedAirlines}
                                            onToggle={toggleAirline}
                                        />

                                        {/* Stats & Sort */}
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h2 className="text-xl font-bold text-gray-900">
                                                        {filteredResults.length} flights found
                                                    </h2>
                                                    <span className="text-[10px] font-bold text-white bg-gray-900 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                        {searchParams.get('class') || 'Economy'}
                                                    </span>
                                                    {filteredResults.length > RESULTS_PER_PAGE && (
                                                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                                            Showing {Math.min(visibleCount, filteredResults.length)} of {filteredResults.length}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[12px] text-gray-400 mt-1.5 flex items-center gap-1.5 flex-wrap font-medium">
                                                    <span>
                                                        {parseInt(searchParams.get('adt') || '1')} Adult
                                                    </span>
                                                    {parseInt(searchParams.get('chd') || '0') > 0 && (
                                                        <span>· {searchParams.get('chd')} Child</span>
                                                    )}
                                                    {parseInt(searchParams.get('inf') || '0') > 0 && (
                                                        <span>· {searchParams.get('inf')} Infant</span>
                                                    )}
                                                    <span className="text-gray-300">·</span>
                                                    <span>Prices include all taxes & fees</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setShowMobileFilter(true)}
                                                    className="
                                                        lg:hidden h-11 px-4 rounded-xl
                                                        bg-white border border-gray-200
                                                        hover:border-gray-300 hover:bg-gray-50
                                                        flex items-center gap-2
                                                        text-sm font-semibold text-gray-700
                                                        transition-all cursor-pointer active:scale-[0.98]
                                                    "
                                                >
                                                    <SlidersHorizontal className="w-4 h-4" />
                                                    Filters
                                                    {activeFilterCount > 0 && (
                                                        <span className="w-5 h-5 rounded-md bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                                                            {activeFilterCount}
                                                        </span>
                                                    )}
                                                </button>

                                                <div className="relative">
                                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                                    </div>
                                                    <select
                                                        value={sortBy}
                                                        onChange={(e) =>
                                                            setSortBy(e.target.value as typeof sortBy)
                                                        }
                                                        className="
                                                            appearance-none
                                                            bg-white border border-gray-200
                                                            hover:border-gray-300
                                                            text-gray-700
                                                            h-11 pl-4 pr-10
                                                            rounded-xl text-sm font-semibold
                                                            focus:outline-none focus:border-gray-900
                                                            focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]
                                                            cursor-pointer
                                                            transition-all min-w-[180px]
                                                        "
                                                    >
                                                        <option value="best">Best match</option>
                                                        <option value="price_asc">Cheapest first</option>
                                                        <option value="price_desc">Expensive first</option>
                                                        <option value="duration">Fastest first</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Flight Cards */}
                                        <div className="space-y-4">
                                            {visibleResults.length > 0 ? (
                                                <>
                                                    {visibleResults.map((f) => (
                                                        <FlightResultCard key={f.id} flight={f} />
                                                    ))}

                                                    {/* Load More */}
                                                    {hasMore && (
                                                        <div className="pt-4 pb-2">
                                                            <div className="relative">
                                                                <div className="flex items-center justify-center gap-3 mb-4">
                                                                    <div className="h-px flex-1 bg-gray-200" />
                                                                    <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap">
                                                                        {Math.min(visibleCount, filteredResults.length)} of {filteredResults.length} flights
                                                                    </span>
                                                                    <div className="h-px flex-1 bg-gray-200" />
                                                                </div>

                                                                <div className="w-full max-w-xs mx-auto mb-5">
                                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-gray-900 rounded-full transition-all duration-700 ease-out"
                                                                            style={{
                                                                                width: `${Math.min(
                                                                                    (visibleCount / filteredResults.length) * 100,
                                                                                    100,
                                                                                )}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-center">
                                                                    <button
                                                                        onClick={handleLoadMore}
                                                                        disabled={loadingMore}
                                                                        className="
                                                                            group relative
                                                                            h-12 px-8 rounded-xl
                                                                            bg-gray-900 hover:bg-gray-800
                                                                            text-white text-sm font-bold
                                                                            flex items-center justify-center gap-2.5
                                                                            shadow-lg shadow-gray-900/10
                                                                            hover:shadow-xl hover:shadow-gray-900/15
                                                                            transition-all duration-300
                                                                            cursor-pointer active:scale-[0.97]
                                                                            disabled:opacity-70 disabled:cursor-wait
                                                                        "
                                                                    >
                                                                        {loadingMore ? (
                                                                            <>
                                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                                <span>Loading...</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <span>Load More Flights</span>
                                                                                <span className="text-[10px] font-semibold text-gray-400 bg-white/10 px-2 py-0.5 rounded-md">
                                                                                    +{Math.min(remainingCount, RESULTS_PER_PAGE)}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>

                                                                <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                                                                    {remainingCount} more flight{remainingCount > 1 ? 's' : ''} available
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* All loaded */}
                                                    {!hasMore && filteredResults.length > RESULTS_PER_PAGE && (
                                                        <div className="pt-4 pb-2">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <div className="h-px flex-1 bg-gray-200" />
                                                                <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400">
                                                                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                                                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                                                                    </div>
                                                                    All {filteredResults.length} flights loaded
                                                                </div>
                                                                <div className="h-px flex-1 bg-gray-200" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                                        <Filter className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                        No matching flights
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mb-4">
                                                        Try adjusting your filters
                                                    </p>
                                                    <button
                                                        onClick={handleResetFilters}
                                                        className="
                                                            text-sm font-semibold text-rose-600
                                                            hover:text-rose-700 hover:bg-rose-50
                                                            px-4 py-2 rounded-xl
                                                            transition-all cursor-pointer
                                                        "
                                                    >
                                                        Reset all filters
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-24">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                                            <Plane className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            No flights found
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Try adjusting your dates or search criteria.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Export
// ------------------------------------------------------------------
export default function FlightSearchPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            }
        >
            <SearchPageContent />
        </Suspense>
    );
}