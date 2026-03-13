'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Search,
    MapPin,
    Calendar,
    Plane,
    Plus,
    Trash2,
    AlertCircle,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import PassengerSelector from './PassengerSelector';
import { z } from 'zod';
import { AirportInput } from './AirportInput';
import { MULTICITY_MAX_LEGS } from '@/constant/control';

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------
const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];
const MONTHS_SHORT = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
];
const WEEK_DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const WEEKDAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ------------------------------------------------------------------
// PassengerData type — matches what PassengerSelector emits
// ------------------------------------------------------------------
// ✅ Import from PassengerSelector to stay in sync
import type { PassengerOutput as PassengerData } from './PassengerSelector';

// ------------------------------------------------------------------
// ✅ Renamed MultiCityLeg — avoids conflict with @/types/flight FlightLeg
// ------------------------------------------------------------------
interface MultiCityLeg {
    id: string;       // ✅ stable ID for React key — prevents wrong DOM reuse on remove
    origin: string;
    destination: string;
    date: string;
}

// ------------------------------------------------------------------
// FlightDatePicker
// ------------------------------------------------------------------
interface FlightDatePickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    minDate?: string;
    hasError?: boolean;
    pickerId: string;
    activePickerId: string | null;
    onOpenChange: (id: string | null) => void;
}

function FlightDatePicker({
    label, value, onChange, minDate, hasError = false,
    pickerId, activePickerId, onOpenChange,
}: FlightDatePickerProps) {
    const open = activePickerId === pickerId;
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropDirection, setDropDirection] = useState<'down' | 'up'>('down');

    // ✅ Stable setOpen
    const setOpen = useCallback((isOpen: boolean) => {
        onOpenChange(isOpen ? pickerId : null);
    }, [onOpenChange, pickerId]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false); setShowMonthPicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, setOpen]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setOpen(false); setShowMonthPicker(false); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, setOpen]);

    useEffect(() => {
        if (!open) return;
        if (value) {
            const d = new Date(value + 'T00:00:00');
            setViewMonth(d.getMonth()); setViewYear(d.getFullYear());
        } else if (minDate) {
            const d = new Date(minDate + 'T00:00:00');
            setViewMonth(d.getMonth()); setViewYear(d.getFullYear());
        } else {
            const now = new Date();
            setViewMonth(now.getMonth()); setViewYear(now.getFullYear());
        }
        setShowMonthPicker(false);
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropDirection(window.innerHeight - rect.bottom < 400 ? 'up' : 'down');
        }
    }, [open, value, minDate]);

    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const isDateDisabled = (dateStr: string) => !!minDate && dateStr < minDate;

    const prevMonthNav = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonthNav = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    const selectDay = (day: number) => {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (isDateDisabled(dateStr)) return;
        onChange(dateStr); setOpen(false);
    };

    const selectToday = () => {
        if (!isDateDisabled(todayStr)) { onChange(todayStr); setOpen(false); }
    };

    const formatDisplay = (v: string) => {
        const d = new Date(v + 'T00:00:00');
        return { dayNum: d.getDate(), month: MONTHS_SHORT[d.getMonth()], year: d.getFullYear(), weekday: WEEKDAY_NAMES[d.getDay()] };
    };

    const cells: { day: number; type: 'prev' | 'curr' | 'next' }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, type: 'prev' });
    for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, type: 'curr' });
    for (let i = 1; i <= 42 - cells.length; i++) cells.push({ day: i, type: 'next' });
    const lastRowStart = Math.floor((cells.length - 1) / 7) * 7;
    const showCells = cells[lastRowStart]?.type === 'next' ? cells.slice(0, lastRowStart) : cells;

    const displayDate = value ? formatDisplay(value) : null;
    const isPrevNavDisabled = !minDate ? false : new Date(viewYear, viewMonth, 0) < new Date(minDate + 'T00:00:00');

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => setOpen(!open)}
                className={`group relative h-[56px] w-full bg-white rounded-xl border transition-all duration-300 flex items-center gap-3 px-3.5 cursor-pointer select-none ${hasError ? 'border-red-300 bg-red-50/30' : open ? 'border-gray-900 shadow-[0_0_0_3px_rgba(0,0,0,0.04)]' : 'border-gray-200 hover:border-gray-300'}`}
            >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${hasError ? 'bg-red-100 text-red-500' : open ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.14em] leading-none mb-0.5 ${hasError ? 'text-red-400' : open ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                    {displayDate ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-[14px] font-bold text-gray-900 leading-tight">{displayDate.dayNum}</span>
                            <span className="text-[12px] font-semibold text-gray-900 leading-tight">{displayDate.month}</span>
                            <span className="text-[10px] font-medium text-gray-400 leading-tight">{displayDate.year}</span>
                            <span className="text-[9px] font-medium text-gray-300 leading-tight">{displayDate.weekday}</span>
                        </div>
                    ) : (
                        <span className="text-[13px] font-semibold text-gray-300 leading-tight">Select date</span>
                    )}
                </div>
                {value ? (
                    <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); }} className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                            <X className="w-3 h-3" />
                        </button>
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                ) : (
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${open ? 'rotate-90 text-gray-900' : 'text-gray-300'}`} />
                )}
            </div>

            {open && (
                <>
                    <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => { setOpen(false); setShowMonthPicker(false); }} />
                    <div className={`absolute left-0 right-0 lg:right-auto lg:w-[310px] ${dropDirection === 'up' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'}`} style={{ zIndex: 9999, animation: 'calDrop 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/12 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50/80 border-b border-gray-100">
                                <button type="button" onClick={prevMonthNav} disabled={isPrevNavDisabled} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-90"><ChevronLeft className="w-4 h-4" /></button>
                                <button type="button" onClick={() => setShowMonthPicker(!showMonthPicker)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white transition-all cursor-pointer">
                                    <span className="text-[13px] font-bold text-gray-900">{MONTHS[viewMonth]}</span>
                                    <span className="text-[13px] font-bold text-rose-600">{viewYear}</span>
                                    <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform ${showMonthPicker ? 'rotate-90' : ''}`} />
                                </button>
                                <button type="button" onClick={nextMonthNav} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white transition-all cursor-pointer active:scale-90"><ChevronRight className="w-4 h-4" /></button>
                            </div>

                            {showMonthPicker && (
                                <div className="absolute inset-x-0 bg-white border-b border-gray-100 overflow-y-auto p-3" style={{ top: '52px', bottom: '48px', zIndex: 10 }}>
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <button type="button" onClick={() => setViewYear(y => y - 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
                                        <span className="text-sm font-bold text-gray-900 w-16 text-center">{viewYear}</span>
                                        <button type="button" onClick={() => setViewYear(y => y + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {MONTHS_SHORT.map((m, i) => {
                                            const isActive = viewMonth === i;
                                            const isCurrMonth = i === todayObj.getMonth() && viewYear === todayObj.getFullYear();
                                            const monthDisabled = minDate ? new Date(viewYear, i + 1, 0) < new Date(minDate + 'T00:00:00') : false;
                                            return (
                                                <button key={m} type="button" disabled={monthDisabled} onClick={() => { setViewMonth(i); setShowMonthPicker(false); }}
                                                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${isActive ? 'bg-gray-900 text-white shadow-md' : isCurrMonth ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                                    {m}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-7 px-3 pt-2">
                                {WEEK_DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider py-1.5">{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-[2px] px-3 pb-2">
                                {showCells.map(({ day, type }, i) => {
                                    if (type !== 'curr') return <div key={`${type}-${i}`} className="flex items-center justify-center w-full aspect-square rounded-lg text-[11px] text-gray-200 select-none">{day}</div>;
                                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isToday = dateStr === todayStr;
                                    const isSelected = dateStr === value;
                                    const disabled = isDateDisabled(dateStr);
                                    return (
                                        <button key={`curr-${day}`} type="button" disabled={disabled} onClick={() => selectDay(day)}
                                            className={`flex items-center justify-center w-full aspect-square rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent ${isSelected ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.08]' : isToday ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100 font-bold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:scale-90'}`}>
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50/60 border-t border-gray-100">
                                <button type="button" onClick={selectToday} disabled={isDateDisabled(todayStr)} className="text-[11px] font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed">Today</button>
                                {value && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-gray-400 hidden sm:inline">
                                            {formatDisplay(value).weekday}, {formatDisplay(value).dayNum} {formatDisplay(value).month} {formatDisplay(value).year}
                                        </span>
                                        <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">Clear</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ------------------------------------------------------------------
// Schema — uses plain object shape (not MultiCityLeg with id)
// ------------------------------------------------------------------
const flightLegSchema = z
    .object({
        origin: z.string().min(1, 'Origin is required'),
        destination: z.string().min(1, 'Destination is required'),
        date: z.string().min(1, 'Date is required'),
    })
    .refine(data => data.origin !== data.destination, {
        message: 'Same airport', path: ['destination'],
    });

const multiCitySchema = z.object({
    flights: z.array(flightLegSchema).min(2, 'At least 2 flights required'),
    passengers: z.object({ adults: z.number().min(1), children: z.number(), infants: z.number() }),
    cabinClass: z.string(),
});

// ✅ Stable counter for generating unique IDs
let legIdCounter = 0;
const newLegId = () => `leg-${++legIdCounter}-${Date.now()}`;

// ------------------------------------------------------------------
// MultiCityForm
// ------------------------------------------------------------------
export default function MultiCityForm({ onSearch }: { onSearch: (params: URLSearchParams) => void }) {
    const searchParams = useSearchParams();
    const [today, setToday] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activePickerId, setActivePickerId] = useState<string | null>(null);

    useEffect(() => {
        const dt = new Date();
        const offset = dt.getTimezoneOffset() * 60000;
        setToday(new Date(dt.getTime() - offset).toISOString().split('T')[0]);
    }, []);

    // ✅ MultiCityLeg includes stable `id` for React key
    const [flights, setFlights] = useState<MultiCityLeg[]>([
        { id: newLegId(), origin: 'DAC', destination: 'DXB', date: '' },
        { id: newLegId(), origin: 'DXB', destination: 'LAX', date: '' },
    ]);
    const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
    const [childAges, setChildAges]   = useState<number[]>([]);
    const [cabinClass, setCabinClass] = useState('economy');

    useEffect(() => {
        const flightsParam = searchParams.get('flights');
        if (flightsParam) {
            try {
                const parsed = JSON.parse(flightsParam);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Re-attach stable IDs when loading from URL
                    setFlights(parsed.map((f: Omit<MultiCityLeg, 'id'>) => ({ ...f, id: newLegId() })));
                }
            } catch (e) {
                console.error('Failed to parse flights param:', e);
            }
        }
    }, [searchParams]);

    const handleFlightChange = (index: number, field: keyof Omit<MultiCityLeg, 'id'>, value: string) => {
        const newFlights = [...flights];
        newFlights[index] = { ...newFlights[index], [field]: value };

        // Auto-chain: destination → next flight's origin
        if (field === 'destination' && index < flights.length - 1) {
            newFlights[index + 1].origin = value;
        }

        // Clear subsequent flights with earlier dates
        if (field === 'date' && value) {
            for (let i = index + 1; i < newFlights.length; i++) {
                if (newFlights[i].date && newFlights[i].date < value) {
                    newFlights[i].date = '';
                }
            }
        }

        setFlights(newFlights);
        setErrors(prev => {
            const next = { ...prev };
            delete next[`flights.${index}.${field}`];
            delete next['flights'];
            return next;
        });
    };

    const addFlight = () => {
        if (flights.length < MULTICITY_MAX_LEGS) {
            const lastDest = flights[flights.length - 1].destination;
            const lastDate = flights[flights.length - 1].date || today;
            setFlights(prev => [...prev, { id: newLegId(), origin: lastDest, destination: '', date: lastDate }]);
        }
    };

    const removeFlight = (index: number) => {
        if (flights.length > 2) {
            setFlights(prev => prev.filter((_, i) => i !== index));
        }
    };

    // ✅ Typed PassengerSelector handler
    const handlePaxChange = useCallback((data: PassengerData) => {
        setPassengers(data.passengers);
        setChildAges(data.childAges);
        setCabinClass(data.cabinClass);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Strip `id` before validation — schema doesn't know about it
        const result = multiCitySchema.safeParse({
            flights: flights.map(({ id: _id, ...rest }) => rest),
            passengers,
            cabinClass,
        });

        if (!result.success) {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach(err => { newErrors[err.path.join('.')] = err.message; });
            setErrors(newErrors);
            return;
        }

        const params = new URLSearchParams();
        params.set('type', 'multi_city');
        // Strip `id` from URL params — API doesn't need it
        params.set('flights', JSON.stringify(flights.map(({ id: _id, ...rest }) => rest)));
        params.set('adt', passengers.adults.toString());
        params.set('chd', passengers.children.toString());
        params.set('inf', passengers.infants.toString());
        params.set('class', cabinClass);
        if (childAges.length > 0)
            params.set('childAges', JSON.stringify(childAges));
        onSearch(params);
    };

    const hasErrors = Object.values(errors).some(Boolean);

    return (
        <form onSubmit={handleSubmit} className="w-full relative bg-white p-4 md:p-5 rounded-b-3xl" style={{ zIndex: activePickerId ? 9990 : 20 }}>
            {/* Flight Legs */}
            <div className="space-y-2">
                {flights.map((flight, index) => (
                    // ✅ Stable key — flight.id instead of index
                    // Prevents React reusing wrong component state when a middle flight is removed
                    <div
                        key={flight.id}
                        className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 p-3 rounded-2xl bg-gray-50/70 border border-gray-100 transition-all duration-300 hover:border-gray-200 animate-in fade-in slide-in-from-top-1 duration-300"
                        style={{ zIndex: activePickerId === `date-${index}` ? 9995 : 50 - index, position: 'relative' }}
                    >
                        {/* Badge */}
                        <div className="flex items-center gap-2 lg:mr-3 shrink-0">
                            <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                                {index + 1}
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider lg:hidden">Flight {index + 1}</span>
                            {index > 1 && (
                                <button type="button" onClick={() => removeFlight(index)} className="ml-auto lg:hidden w-7 h-7 rounded-lg bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition-all cursor-pointer active:scale-90">
                                    <Trash2 className="w-3 h-3 text-red-400" />
                                </button>
                            )}
                        </div>

                        {/* From */}
                        <div className="flex-[1.2] lg:min-w-0">
                            <AirportInput label="From" codeValue={flight.origin}
                                onSelect={code => handleFlightChange(index, 'origin', code)}
                                placeholder="City or airport" icon={<MapPin className="w-3.5 h-3.5" />}
                                disabledCodes={[flight.destination]} hasError={!!errors[`flights.${index}.origin`]} />
                        </div>

                        <div className="hidden lg:flex items-center justify-center mx-1 shrink-0">
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                        </div>

                        {/* To */}
                        <div className="flex-[1.2] lg:min-w-0">
                            <AirportInput label="To" codeValue={flight.destination}
                                onSelect={code => handleFlightChange(index, 'destination', code)}
                                placeholder="City or airport" icon={<Plane className="w-3.5 h-3.5" />}
                                disabledCodes={[flight.origin]} hasError={!!errors[`flights.${index}.destination`]} />
                        </div>

                        <div className="hidden lg:block w-px h-8 bg-gray-200 mx-3 shrink-0" />

                        {/* Date */}
                        <div className="flex-1 lg:min-w-0 lg:max-w-[220px]">
                            <FlightDatePicker
                                label="Date" value={flight.date}
                                onChange={val => handleFlightChange(index, 'date', val)}
                                minDate={index > 0 ? flights[index - 1].date || today : today}
                                hasError={!!errors[`flights.${index}.date`]}
                                pickerId={`date-${index}`} activePickerId={activePickerId} onOpenChange={setActivePickerId}
                            />
                        </div>

                        {/* Remove (desktop) */}
                        {index > 1 && (
                            <div className="hidden lg:flex items-center ml-2 shrink-0">
                                <button type="button" onClick={() => removeFlight(index)} title="Remove flight"
                                    className="w-9 h-9 rounded-xl bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all duration-300 cursor-pointer active:scale-90">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-4 pt-4 border-t border-gray-100 relative z-10">
                {flights.length < MULTICITY_MAX_LEGS && (
                    <button type="button" onClick={addFlight}
                        className="flex-1 h-[52px] border border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold text-sm flex items-center justify-center gap-2 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 cursor-pointer active:scale-[0.98]">
                        <Plus className="w-4 h-4" />
                        Add Flight
                        <span className="text-[10px] font-medium text-gray-400 hidden sm:inline">({flights.length}/{MULTICITY_MAX_LEGS})</span>
                    </button>
                )}

                <div className="hidden lg:block w-px h-8 bg-gray-200 mx-1 shrink-0" />

                {/* Passengers */}
                <div className="lg:w-[240px] shrink-0">
                    <div className="h-[52px] w-full bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-stretch">
                        {/* ✅ Typed — no more inline `any` */}
                        <PassengerSelector onChange={handlePaxChange} />
                    </div>
                </div>

                <div className="hidden lg:block w-2 shrink-0" />

                {/* Search */}
                <div className="lg:shrink-0">
                    <button type="submit"
                        className="w-full lg:w-auto h-[52px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl px-7 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/15 hover:-translate-y-px active:scale-[0.98] cursor-pointer">
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                    </button>
                </div>
            </div>

            {/* Error */}
            {hasErrors && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                    </div>
                    <p className="text-[11px] font-semibold text-red-600">Please fix the highlighted errors before searching.</p>
                </div>
            )}
        </form>
    );
}