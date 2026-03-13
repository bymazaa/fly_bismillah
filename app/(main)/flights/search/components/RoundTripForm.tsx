'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Search,
    MapPin,
    Calendar,
    Plane,
    ArrowLeftRight,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import PassengerSelector from './PassengerSelector';
import { z } from 'zod';
import { AirportInput } from './AirportInput';

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

    // ✅ Stable setOpen — avoids recreating on every render
    const setOpen = useCallback((isOpen: boolean) => {
        onOpenChange(isOpen ? pickerId : null);
    }, [onOpenChange, pickerId]);

    // Click outside → close
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setShowMonthPicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, setOpen]);

    // Escape → close
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setOpen(false); setShowMonthPicker(false); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, setOpen]);

    // Sync view when opening
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
            {/* Trigger */}
            <div
                onClick={() => setOpen(!open)}
                className={`group relative h-[56px] w-full bg-white rounded-xl border transition-all duration-300 flex items-center gap-3 px-3.5 cursor-pointer select-none ${hasError ? 'border-red-300 bg-red-50/30' : open ? 'border-gray-900 shadow-[0_0_0_3px_rgba(0,0,0,0.04)]' : 'border-gray-200 hover:border-gray-300'}`}
            >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${hasError ? 'bg-red-100 text-red-500' : open ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.14em] leading-none mb-0.5 ${hasError ? 'text-red-400' : open ? 'text-gray-900' : 'text-gray-400'}`}>
                        {label}
                    </span>
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

            {/* Calendar Dropdown */}
            {open && (
                <>
                    {/* ✅ Single backdrop — covers all screen sizes uniformly */}
                    <div
                        className="fixed inset-0"
                        style={{ zIndex: 9998 }}
                        onClick={() => { setOpen(false); setShowMonthPicker(false); }}
                    />
                    <div
                        className={`absolute left-0 right-0 lg:right-auto lg:w-[310px] ${dropDirection === 'up' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'}`}
                        style={{ zIndex: 9999, animation: 'calDrop 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    >
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/12 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50/80 border-b border-gray-100">
                                <button type="button" onClick={prevMonthNav} disabled={isPrevNavDisabled} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-90">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => setShowMonthPicker(!showMonthPicker)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white transition-all cursor-pointer">
                                    <span className="text-[13px] font-bold text-gray-900">{MONTHS[viewMonth]}</span>
                                    <span className="text-[13px] font-bold text-rose-600">{viewYear}</span>
                                    <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform ${showMonthPicker ? 'rotate-90' : ''}`} />
                                </button>
                                <button type="button" onClick={nextMonthNav} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white transition-all cursor-pointer active:scale-90">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Month/Year Picker */}
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

                            {/* Day headers */}
                            <div className="grid grid-cols-7 px-3 pt-2">
                                {WEEK_DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider py-1.5">{d}</div>)}
                            </div>

                            {/* Day grid */}
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

                            {/* Footer */}
                            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50/60 border-t border-gray-100">
                                <button type="button" onClick={selectToday} disabled={isDateDisabled(todayStr)} className="text-[11px] font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed">
                                    Today
                                </button>
                                {value && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-gray-400">
                                            {formatDisplay(value).weekday}, {formatDisplay(value).dayNum} {formatDisplay(value).month} {formatDisplay(value).year}
                                        </span>
                                        <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                                            Clear
                                        </button>
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
// Schema
// ------------------------------------------------------------------
const roundTripSchema = z
    .object({
        origin: z.string().min(1, 'Origin is required'),
        destination: z.string().min(1, 'Destination is required'),
        departureDate: z.string().min(1, 'Departure date is required'),
        returnDate: z.string().min(1, 'Return date is required'),
        passengers: z.object({ adults: z.number().min(1), children: z.number(), infants: z.number() }),
        cabinClass: z.string(),
    })
    .superRefine((data, ctx) => {
        if (data.origin === data.destination) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Origin and destination cannot be the same', path: ['destination'] });
        }
        if (data.returnDate && data.departureDate && data.returnDate < data.departureDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Return date cannot be before departure', path: ['returnDate'] });
        }
    });

// ------------------------------------------------------------------
// RoundTripForm
// ------------------------------------------------------------------
export default function RoundTripForm({ onSearch }: { onSearch: (params: URLSearchParams) => void }) {
    const searchParams = useSearchParams();
    const [today, setToday] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activePickerId, setActivePickerId] = useState<string | null>(null);

    useEffect(() => {
        const dt = new Date();
        const offset = dt.getTimezoneOffset() * 60000;
        setToday(new Date(dt.getTime() - offset).toISOString().split('T')[0]);
    }, []);

    const [formData, setFormData] = useState({
        origin: '', destination: '', departureDate: '', returnDate: '',
        passengers: { adults: 1, children: 0, infants: 0 },
        childAges: [] as number[],
        cabinClass: 'economy',
    });

    useEffect(() => {
        const originParam = searchParams.get('origin');
        const destParam = searchParams.get('dest');
        const dateParam = searchParams.get('date');
        const returnParam = searchParams.get('ret');
        if (originParam || destParam || dateParam) {
            setFormData(prev => ({ ...prev, origin: originParam || 'DAC', destination: destParam || 'LAX', departureDate: dateParam || '', returnDate: returnParam || '' }));
        } else {
            setFormData(prev => ({ ...prev, origin: 'DAC', destination: 'LAX', departureDate: prev.departureDate || today }));
        }
    }, [searchParams, today]);

    // ✅ Typed — no more `any`
    const handlePaxChange = useCallback((data: PassengerData) => {
        setFormData(prev => ({ ...prev, passengers: data.passengers, childAges: data.childAges, cabinClass: data.cabinClass }));
    }, []);

    const handleSwap = () => {
        setFormData(prev => ({ ...prev, origin: prev.destination, destination: prev.origin }));
        setErrors({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const result = roundTripSchema.safeParse(formData);
        if (!result.success) {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach(err => { newErrors[err.path[0] as string] = err.message; });
            setErrors(newErrors);
            return;
        }
        const params = new URLSearchParams();
        params.set('type', 'round_trip');
        params.set('origin', formData.origin);
        params.set('dest', formData.destination);
        params.set('date', formData.departureDate);
        params.set('ret', formData.returnDate);
        params.set('adt', formData.passengers.adults.toString());
        params.set('chd', formData.passengers.children.toString());
        params.set('inf', formData.passengers.infants.toString());
        params.set('class', formData.cabinClass);
        if (formData.childAges.length > 0)
            params.set('childAges', JSON.stringify(formData.childAges));
        onSearch(params);
    };

    const hasErrors = Object.values(errors).some(Boolean);

    return (
        <form onSubmit={handleSubmit} className="w-full relative bg-white p-4 md:p-5 rounded-b-3xl" style={{ zIndex: activePickerId ? 9990 : 20 }}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0">
                {/* From */}
                <div className="flex-[1.2] lg:min-w-0">
                    <AirportInput label="From" codeValue={formData.origin}
                        onSelect={code => { setFormData(prev => ({ ...prev, origin: code })); setErrors(prev => ({ ...prev, origin: '' })); }}
                        placeholder="City or airport" icon={<MapPin className="w-3.5 h-3.5" />}
                        disabledCodes={[formData.destination]} hasError={!!errors.origin} />
                </div>

                {/* Swap */}
                <div className="flex items-center justify-center lg:mx-[-6px] z-10 -my-1 lg:my-0">
                    <button type="button" onClick={handleSwap} title="Swap"
                        className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 lg:hover:bg-gray-900 lg:hover:text-white lg:hover:border-gray-900 flex items-center justify-center shadow-sm transition-all duration-300 cursor-pointer active:scale-90 lg:hover:-translate-y-px">
                        <ArrowLeftRight className="w-3 h-3" />
                    </button>
                </div>

                {/* To */}
                <div className="flex-[1.2] lg:min-w-0">
                    <AirportInput label="To" codeValue={formData.destination}
                        onSelect={code => { setFormData(prev => ({ ...prev, destination: code })); setErrors(prev => ({ ...prev, destination: '' })); }}
                        placeholder="City or airport" icon={<Plane className="w-3.5 h-3.5" />}
                        disabledCodes={[formData.origin]} hasError={!!errors.destination} />
                </div>

                <div className="hidden lg:block w-px h-8 bg-gray-200 mx-3 shrink-0" />

                {/* Departure date */}
                <div className="flex-1 lg:min-w-0">
                    <FlightDatePicker
                        label="Departure" value={formData.departureDate}
                        onChange={val => {
                            setFormData(prev => {
                                const newReturn = prev.returnDate && val && prev.returnDate < val ? '' : prev.returnDate;
                                return { ...prev, departureDate: val, returnDate: newReturn };
                            });
                            setErrors(prev => ({ ...prev, departureDate: '' }));
                        }}
                        minDate={today} hasError={!!errors.departureDate}
                        pickerId="departure" activePickerId={activePickerId} onOpenChange={setActivePickerId}
                    />
                </div>

                <div className="hidden lg:block w-2 shrink-0" />

                {/* Return date */}
                <div className="flex-1 lg:min-w-0">
                    <FlightDatePicker
                        label="Return" value={formData.returnDate}
                        onChange={val => { setFormData(prev => ({ ...prev, returnDate: val })); setErrors(prev => ({ ...prev, returnDate: '' })); }}
                        minDate={formData.departureDate || today} hasError={!!errors.returnDate}
                        pickerId="return" activePickerId={activePickerId} onOpenChange={setActivePickerId}
                    />
                </div>

                <div className="hidden lg:block w-px h-8 bg-gray-200 mx-3 shrink-0" />

                {/* Passengers */}
                <div className="flex-1 lg:min-w-0">
                    <div className="h-[56px] w-full bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-stretch">
                        <PassengerSelector onChange={handlePaxChange} />
                    </div>
                </div>

                <div className="hidden lg:block w-3 shrink-0" />

                {/* Search */}
                <div className="lg:shrink-0">
                    <button type="submit" className="w-full lg:w-auto h-[56px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl px-6 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/15 hover:-translate-y-px active:scale-[0.98] cursor-pointer">
                        <Search className="w-4 h-4" />
                        <span className="lg:hidden xl:inline">Search</span>
                    </button>
                </div>
            </div>

            {/* Error */}
            {hasErrors && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                    </div>
                    <p className="text-[11px] font-semibold text-red-600">
                        {errors.origin || errors.destination || errors.departureDate || errors.returnDate || 'Please fill all required fields.'}
                    </p>
                </div>
            )}
        </form>
    );
}