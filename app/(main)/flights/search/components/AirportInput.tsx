'use client';

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
} from 'react';
import { Plane, Search, MapPin } from 'lucide-react';
import { airportSuggestions } from '@/constant/flight';

export const AIRPORTS = airportSuggestions;
export type Airport = (typeof AIRPORTS)[number];

// Max results to render — prevents DOM overload on empty search
const MAX_DROPDOWN_RESULTS = 80;

type AirportInputProps = {
    label: string;
    codeValue?: string;
    onSelect: (code: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    disabledCodes?: string[];
    hasError?: boolean;
    helperText?: string;
};

const getFullName = (code: string | undefined, airports: readonly Airport[]): string => {
    if (!code) return '';
    const airport = airports.find((a) => a.code === code);
    return airport ? `${airport.city} (${airport.code})` : '';
};

export const AirportInput: React.FC<AirportInputProps> = ({
    label,
    codeValue,
    onSelect,
    placeholder = 'Search city or airport',
    icon,
    disabledCodes = [],
    hasError = false,
    helperText,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const isTypingRef = useRef(false);

    // ------------------------------------------------------------------
    // Sync external codeValue → input display value
    // ✅ inputValue added to deps to prevent stale closure
    // ------------------------------------------------------------------
    useEffect(() => {
        if (isTypingRef.current) return;

        if (codeValue) {
            const formattedName = getFullName(codeValue, AIRPORTS);
            if (formattedName && formattedName !== inputValue) {
                setInputValue(formattedName);
            }
        } else {
            if (inputValue !== '') setInputValue('');
        }
    }, [codeValue, inputValue]);

    // ------------------------------------------------------------------
    // Filter airports — memoized so it only recomputes on inputValue change
    // Empty search → show first MAX_DROPDOWN_RESULTS alphabetically
    // ✅ Hard cap prevents rendering 1000+ items at once
    // ------------------------------------------------------------------
    const filteredAirports = useMemo(() => {
        const search = inputValue.toLowerCase().trim();

        const results = !search
            ? AIRPORTS.slice(0, MAX_DROPDOWN_RESULTS)
            : AIRPORTS.filter(
                  (item) =>
                      item.code.toLowerCase().includes(search) ||
                      item.city.toLowerCase().includes(search) ||
                      item.name.toLowerCase().includes(search) ||
                      item.country.toLowerCase().includes(search),
              ).slice(0, MAX_DROPDOWN_RESULTS);

        return results;
    }, [inputValue]);

    // ------------------------------------------------------------------
    // Navigable list — disabled airports excluded
    // ✅ Use this for keyboard navigation to avoid index mismatch
    // ------------------------------------------------------------------
    const navigableAirports = useMemo(
        () => filteredAirports.filter((a) => !disabledCodes.includes(a.code)),
        [filteredAirports, disabledCodes],
    );

    // ------------------------------------------------------------------
    // Select handler
    // ------------------------------------------------------------------
    const handleSelect = useCallback(
        (airport: Airport) => {
            if (disabledCodes.includes(airport.code)) return;
            isTypingRef.current = false;
            setInputValue(`${airport.city} (${airport.code})`);
            onSelect(airport.code);
            setIsOpen(false);
            setHighlightedIndex(-1);
        },
        [disabledCodes, onSelect],
    );

    // ------------------------------------------------------------------
    // Input change
    // ------------------------------------------------------------------
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        isTypingRef.current = true;
        setInputValue(e.target.value);
        setHighlightedIndex(-1);
        if (codeValue) onSelect('');
        setIsOpen(true);
    };

    // ------------------------------------------------------------------
    // Keyboard navigation
    // ✅ Uses navigableAirports for Up/Down/Enter — no index mismatch
    // ------------------------------------------------------------------
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Backspace clears selection
        if (e.key === 'Backspace' && codeValue) {
            e.preventDefault();
            setInputValue('');
            onSelect('');
            isTypingRef.current = true;
            setIsOpen(true);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((prev) =>
                prev < navigableAirports.length - 1 ? prev + 1 : 0,
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : navigableAirports.length - 1,
            );
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            const airport = navigableAirports[highlightedIndex];
            if (airport) handleSelect(airport);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
            inputRef.current?.blur();
        }
    };

    // ------------------------------------------------------------------
    // Scroll highlighted item into view
    // ------------------------------------------------------------------
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-airport-item]');
            items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    // ------------------------------------------------------------------
    // Click outside — close and restore display value
    // ------------------------------------------------------------------
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
                isTypingRef.current = false;
                // Restore display value to match current selection
                setInputValue(codeValue ? getFullName(codeValue, AIRPORTS) : '');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [codeValue]);

    const isSelected = !!codeValue;

    return (
        <div className="relative w-full h-full" ref={wrapperRef}>
            {/* Input Container */}
            <div
                className={`
                    group relative
                    flex items-center gap-3
                    h-[56px] w-full
                    bg-white
                    rounded-xl
                    border
                    transition-all duration-300
                    cursor-text
                    px-3.5
                    ${
                        hasError
                            ? 'border-red-300 bg-red-50/30 shadow-sm shadow-red-100/50'
                            : isOpen
                              ? 'border-gray-900 shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'
                              : isSelected
                                ? 'border-gray-300 bg-gray-50/50'
                                : 'border-gray-200 hover:border-gray-300'
                    }
                `}
                onClick={() => {
                    setIsOpen(true);
                    inputRef.current?.focus();
                }}
            >
                {/* Icon */}
                <div
                    className={`
                        w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                        transition-all duration-300
                        ${
                            hasError
                                ? 'bg-red-100 text-red-500'
                                : isOpen
                                  ? 'bg-gray-900 text-white shadow-sm'
                                  : isSelected
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500'
                        }
                    `}
                >
                    {icon ?? <Plane className="w-3.5 h-3.5" />}
                </div>

                {/* Label + Input */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                    <label
                        className={`
                            text-[10px] font-bold uppercase tracking-[0.14em] leading-none mb-0.5
                            transition-colors duration-300
                            ${hasError ? 'text-red-400' : isOpen ? 'text-gray-900' : 'text-gray-400'}
                        `}
                    >
                        {label}
                    </label>

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsOpen(true)}
                        className="
                            w-full bg-transparent border-none outline-none p-0
                            text-[13px] font-semibold text-gray-900
                            placeholder:text-gray-300 placeholder:font-medium
                            truncate leading-tight
                        "
                        placeholder={placeholder}
                        autoComplete="off"
                        aria-autocomplete="list"
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        role="combobox"
                    />
                </div>

                {/* Clear / Selected indicator */}
                {isSelected && !isOpen && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-in fade-in duration-300" />
                )}
                {isOpen && (
                    <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 animate-in fade-in duration-200" />
                )}
            </div>

            {/* Helper text */}
            {helperText && (
                <p
                    className={`mt-1.5 text-[11px] font-medium flex items-center gap-1 ${
                        hasError ? 'text-red-500' : 'text-gray-400'
                    }`}
                >
                    {hasError && <span>⚠</span>}
                    {helperText}
                </p>
            )}

            {/* ═══════════ Dropdown ═══════════ */}
            {isOpen && (
                <div
                    className="
                        absolute top-[calc(100%+6px)] left-0
                        w-full min-w-[280px]
                        bg-white
                        rounded-2xl
                        shadow-[0_20px_60px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)]
                        z-[60]
                        max-h-[320px] overflow-hidden
                        animate-in fade-in slide-in-from-top-1 duration-200
                    "
                    role="listbox"
                >
                    {/* Dropdown header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.16em]">
                                Select Airport
                            </span>
                            {inputValue.trim() && (
                                <span className="text-[10px] font-semibold text-gray-400">
                                    {filteredAirports.length} result{filteredAirports.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Airport list */}
                    <div
                        ref={listRef}
                        className="overflow-y-auto max-h-[264px] custom-scrollbar p-1.5"
                    >
                        {filteredAirports.length > 0 ? (
                            filteredAirports.map((airport) => {
                                const isDisabled = disabledCodes.includes(airport.code);
                                const isCurrentSelection = codeValue === airport.code;

                                // ✅ Highlight index is based on navigableAirports
                                // so find this airport's position in the navigable list
                                const navIndex = navigableAirports.findIndex(
                                    (a) => a.code === airport.code,
                                );
                                const isHighlighted = navIndex !== -1 && highlightedIndex === navIndex;

                                return (
                                    <div
                                        // ✅ Stable key — no index in key
                                        key={airport.code}
                                        data-airport-item
                                        role="option"
                                        aria-selected={isCurrentSelection}
                                        aria-disabled={isDisabled}
                                        onClick={() => !isDisabled && handleSelect(airport)}
                                        className={`
                                            flex items-center gap-3
                                            px-3 py-2.5
                                            rounded-xl
                                            transition-all duration-150
                                            ${
                                                isDisabled
                                                    ? 'opacity-40 cursor-not-allowed'
                                                    : isHighlighted
                                                      ? 'bg-gray-100 cursor-pointer'
                                                      : isCurrentSelection
                                                        ? 'bg-emerald-50 cursor-pointer'
                                                        : 'cursor-pointer hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {/* Icon */}
                                        <div
                                            className={`
                                                w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                                transition-all duration-200
                                                ${
                                                    isCurrentSelection
                                                        ? 'bg-emerald-100 text-emerald-600'
                                                        : isHighlighted
                                                          ? 'bg-gray-900 text-white'
                                                          : isDisabled
                                                            ? 'bg-gray-100 text-gray-300'
                                                            : 'bg-gray-100 text-gray-400'
                                                }
                                            `}
                                        >
                                            <MapPin className="w-3.5 h-3.5" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`
                                                        text-[13px] font-bold truncate
                                                        ${
                                                            isDisabled
                                                                ? 'text-gray-400'
                                                                : isCurrentSelection
                                                                  ? 'text-emerald-700'
                                                                  : 'text-gray-900'
                                                        }
                                                    `}
                                                >
                                                    {airport.city}
                                                </span>
                                                <span
                                                    className={`
                                                        text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wide shrink-0
                                                        ${
                                                            isCurrentSelection
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : isHighlighted
                                                                  ? 'bg-gray-200 text-gray-700'
                                                                  : 'bg-gray-100 text-gray-500'
                                                        }
                                                    `}
                                                >
                                                    {airport.code}
                                                </span>
                                            </div>
                                            <span
                                                className={`text-[10px] font-medium truncate ${
                                                    isDisabled ? 'text-gray-300' : 'text-gray-400'
                                                }`}
                                            >
                                                {airport.name}, {airport.country}
                                            </span>
                                        </div>

                                        {/* Selected check */}
                                        {isCurrentSelection && (
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                <span className="text-white text-[9px] font-bold">✓</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                    <Search className="w-5 h-5 text-gray-300" />
                                </div>
                                <p className="text-sm font-semibold text-gray-400 mb-1">
                                    No airports found
                                </p>
                                <p className="text-[11px] text-gray-300">
                                    Try a different city or airport code
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Keyboard hint */}
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 hidden md:flex items-center gap-3">
                        {[
                            { key: '↑↓', label: 'Navigate' },
                            { key: '↵', label: 'Select' },
                            { key: 'Esc', label: 'Close' },
                        ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-[9px] font-bold text-gray-500">
                                    {key}
                                </kbd>
                                <span className="text-[10px] text-gray-400">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};