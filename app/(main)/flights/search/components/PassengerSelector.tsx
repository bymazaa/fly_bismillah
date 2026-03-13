'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Users, ChevronDown, Minus, Plus, Armchair, X, ChevronRight,
} from 'lucide-react';
import { MAX_PASSENGERS, MIN_PASSENGERS } from '@/constant/control';

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------
const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first'] as const;
type CabinClass = (typeof CABIN_CLASSES)[number];

const AGE_OPTIONS = Array.from({ length: 12 }, (_, i) => i); // 0-11

const getAgeLabel = (age: number): string => {
    if (age === 0) return '< 1 yr';
    if (age === 1) return '1 yr';
    return `${age} yrs`;
};

const isInfant = (age: number) => age <= 1;
const isChild  = (age: number) => age >= 2;

const MAX_YOUNG = MAX_PASSENGERS - 1;

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface PassengerOutput {
    passengers: { adults: number; children: number; infants: number };
    childAges: number[];
    cabinClass: string;
}

interface Props {
    onChange: (data: PassengerOutput) => void;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function PassengerSelector({ onChange }: Props) {
    const [isOpen, setIsOpen]         = useState(false);
    const dropdownRef                 = useRef<HTMLDivElement>(null);

    const [adults, setAdults]         = useState(MIN_PASSENGERS);
    const [youngAges, setYoungAges]   = useState<number[]>([]);
    const [cabinClass, setCabinClass] = useState<CabinClass>('economy');

    // ------------------------------------------------------------------
    // Derived
    // ------------------------------------------------------------------
    const infantCount = useMemo(() => youngAges.filter(isInfant).length, [youngAges]);
    const childCount  = useMemo(() => youngAges.filter(isChild).length,  [youngAges]);
    const totalPax    = adults + youngAges.length;

    // ------------------------------------------------------------------
    // Stable ref for parent callback
    // ------------------------------------------------------------------
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; });

    // ------------------------------------------------------------------
    // ✅ Single notification effect — replaces all manual notify() calls
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!isOpen) return;
        onChangeRef.current({
            passengers: {
                adults,
                children: youngAges.filter(isChild).length,
                infants:  youngAges.filter(isInfant).length,
            },
            childAges: youngAges.filter(isChild),
            cabinClass,
        });
    }, [adults, youngAges, cabinClass, isOpen]);

    // ------------------------------------------------------------------
    // Close on outside click / ESC
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!isOpen) return;
        const onClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setIsOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen]);

    // ------------------------------------------------------------------
    // Adults counter
    // ------------------------------------------------------------------
    const changeAdults = useCallback((op: 'add' | 'sub') => {
        setAdults(prev => {
            if (op === 'add') {
                if (prev + youngAges.length >= MAX_PASSENGERS) return prev;
                return prev + 1;
            }
            if (prev <= 1) return prev;
            if (infantCount >= prev - 1) return prev;
            return prev - 1;
        });
    }, [youngAges.length, infantCount]);

    // ------------------------------------------------------------------
    // Young traveler actions
    // ------------------------------------------------------------------
    const addYoung = useCallback(() => {
        if (totalPax >= MAX_PASSENGERS || youngAges.length >= MAX_YOUNG) return;
        setYoungAges(prev => [...prev, 5]);
    }, [totalPax, youngAges.length]);

    const removeYoung = useCallback((index: number) => {
        setYoungAges(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateYoungAge = useCallback((index: number, age: number) => {
        const currentAge = youngAges[index];
        const wouldAdd   = isInfant(age) && !isInfant(currentAge);
        if (wouldAdd && infantCount >= adults) return;
        setYoungAges(prev => prev.map((a, i) => (i === index ? age : a)));
    }, [youngAges, infantCount, adults]);

    const handleCabinChange = useCallback((cls: CabinClass) => {
        setCabinClass(cls);
    }, []);

    // ------------------------------------------------------------------
    // Trigger label
    // ------------------------------------------------------------------
    const triggerLabel = useMemo(() => {
        const parts = [`${adults} Adult${adults > 1 ? 's' : ''}`];
        if (childCount  > 0) parts.push(`${childCount} Child${childCount > 1 ? 'ren' : ''}`);
        if (infantCount > 0) parts.push(`${infantCount} Infant${infantCount > 1 ? 's' : ''}`);
        return parts.join(', ');
    }, [adults, childCount, infantCount]);

    const progressPct = Math.min((totalPax / MAX_PASSENGERS) * 100, 100);

    return (
        <div className="relative w-full h-full" ref={dropdownRef}>

            {/* ═══ Trigger ═══ */}
            <button
                type="button"
                onClick={() => setIsOpen(v => !v)}
                className={`
                    group flex items-center gap-3
                    h-full w-full rounded-xl px-3.5
                    text-left cursor-pointer bg-white
                    border transition-all duration-300
                    ${isOpen
                        ? 'border-gray-900 shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                `}
            >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500'}`}>
                    <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.14em] leading-none mb-0.5 transition-colors duration-300 ${isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                        Travelers
                    </span>
                    <span className="text-[12px] font-semibold text-gray-900 truncate leading-tight">
                        {triggerLabel}{' '}
                        <span className="text-gray-400">·</span>{' '}
                        <span className="capitalize text-gray-500">{cabinClass}</span>
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180 text-gray-900' : 'text-gray-300'}`} />
            </button>

            {/* ═══ Dropdown ═══ */}
            {isOpen && (
                <div
                    className="absolute top-[calc(100%+6px)] right-0 w-[320px] sm:w-[360px] rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 cursor-default"
                    style={{ zIndex: 9999 }}
                >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.16em]">Passengers</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">
                                    {totalPax} traveler{totalPax > 1 ? 's' : ''} selected
                                </p>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                                Max {MAX_PASSENGERS}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPct}%`, backgroundColor: totalPax >= MAX_PASSENGERS ? '#ef4444' : '#111827' }} />
                        </div>
                    </div>

                    <div className="p-5 space-y-5">

                        {/* ── Adults ── */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm">🧑</div>
                                <div>
                                    <p className="text-[13px] font-bold text-gray-900">Adults</p>
                                    <p className="text-[10px] font-medium text-gray-400">12+ years</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => changeAdults('sub')}
                                    disabled={adults <= 1 || infantCount >= adults - 1}
                                    aria-label="Decrease adults"
                                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-90">
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-sm font-bold tabular-nums text-gray-900">{adults}</span>
                                <button type="button" onClick={() => changeAdults('add')}
                                    disabled={totalPax >= MAX_PASSENGERS}
                                    aria-label="Increase adults"
                                    className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-90 shadow-sm">
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* ── Young Travelers ── */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm">👶</div>
                                    <div>
                                        <p className="text-[13px] font-bold text-gray-900">Young Travelers</p>
                                        <p className="text-[10px] font-medium text-gray-400">Under 12 · age auto-sorts</p>
                                    </div>
                                </div>
                                <button type="button" onClick={addYoung}
                                    disabled={totalPax >= MAX_PASSENGERS || youngAges.length >= MAX_YOUNG}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-bold hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95 shadow-sm">
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[9px] font-bold text-rose-600 uppercase tracking-wide">
                                    👶 0–1 yr = Infant
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-100 text-[9px] font-bold text-sky-600 uppercase tracking-wide">
                                    👦 2–11 yrs = Child
                                </span>
                            </div>

                            {youngAges.length === 0 ? (
                                <div className="text-center py-5 rounded-xl border-2 border-dashed border-gray-100">
                                    <p className="text-[11px] font-medium text-gray-300">No young travelers added</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {youngAges.map((age, i) => {
                                        const infant = isInfant(age);
                                        return (
                                            <div key={i}
                                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 ${infant ? 'bg-rose-50/60 border-rose-100' : 'bg-sky-50/60 border-sky-100'}`}>
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg shrink-0 min-w-[44px] text-center ${infant ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'}`}>
                                                    {infant ? 'Infant' : 'Child'}
                                                </span>
                                                <span className="text-[11px] font-semibold text-gray-500 flex-1">
                                                    Traveler {i + 1}
                                                </span>
                                                <div className="relative shrink-0">
                                                    <select
                                                        value={age}
                                                        onChange={e => updateYoungAge(i, Number(e.target.value))}
                                                        className={`appearance-none pl-2.5 pr-6 py-1.5 rounded-lg text-[12px] font-bold border cursor-pointer outline-none transition-all duration-200 ${infant ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-sky-100 border-sky-200 text-sky-700'}`}
                                                    >
                                                        {AGE_OPTIONS.map(a => {
                                                            const wouldExceed = isInfant(a) && !isInfant(age) && infantCount >= adults;
                                                            return (
                                                                <option key={a} value={a} disabled={wouldExceed}>
                                                                    {getAgeLabel(a)}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <ChevronRight className={`w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none ${infant ? 'text-rose-400' : 'text-sky-400'}`} />
                                                </div>
                                                <button type="button" onClick={() => removeYoung(i)}
                                                    aria-label={`Remove traveler ${i + 1}`}
                                                    className="w-6 h-6 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 flex items-center justify-center text-gray-300 transition-all cursor-pointer active:scale-90 shrink-0">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {infantCount > 0 && infantCount >= adults && (
                                <p className="mt-2.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                                    ⚠️ Each infant needs 1 adult. Add more adults to add more infants.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Cabin Class ── */}
                    <div className="px-5 pb-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Armchair className="w-3.5 h-3.5 text-gray-400" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.16em]">Cabin Class</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-gray-100 rounded-xl">
                            {CABIN_CLASSES.map(cls => (
                                <button key={cls} type="button" onClick={() => handleCabinChange(cls)} aria-pressed={cabinClass === cls}
                                    className={`py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-300 cursor-pointer ${cabinClass === cls ? 'bg-gray-900 text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                                    {cls === 'premium_economy' ? 'Prem. Economy' : cls}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                        <button type="button" onClick={() => setIsOpen(false)}
                            className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/15 active:scale-[0.98] cursor-pointer">
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}