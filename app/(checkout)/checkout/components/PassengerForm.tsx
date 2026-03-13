'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    UseFormRegister,
    FieldErrors,
    Control,
    Controller,
} from 'react-hook-form';
import {
    User,
    CreditCard,
    Calendar,
    Globe,
    ChevronDown,
    AlertCircle,
} from 'lucide-react';
import { BookingFormData } from '../utils/validation';
import { COUNTRY_LIST } from '../utils';

// ──────────────────────────────────────────────
// MONTHS DATA
// ──────────────────────────────────────────────
const MONTHS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

// ──────────────────────────────────────────────
// CUSTOM DATE PICKER — 3 Unified Dropdowns
// ──────────────────────────────────────────────
interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    onBlur?: () => void;
    yearRange: { min: number; max: number; descending?: boolean };
    hasError?: boolean;
}

const CustomDatePicker = ({
    value,
    onChange,
    onBlur,
    yearRange,
    hasError,
}: DatePickerProps) => {
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [year, setYear] = useState('');

    // ── Sync with external value (handles form reset) ──
    useEffect(() => {
        if (value && value.includes('-')) {
            const parts = value.split('-');
            setYear(parts[0] || '');
            setMonth(parts[1] || '');
            setDay(parts[2] || '');
        } else {
            setMonth('');
            setDay('');
            setYear('');
        }
    }, [value]);

    // ── Dynamic days count based on month/year ──
    const maxDays = useMemo(() => {
        if (!month || !year) return 31;
        return new Date(parseInt(year), parseInt(month), 0).getDate();
    }, [month, year]);

    // ── Year list ──
    const years = useMemo(() => {
        const arr: number[] = [];
        for (let y = yearRange.min; y <= yearRange.max; y++) arr.push(y);
        return yearRange.descending ? arr.reverse() : arr;
    }, [yearRange.min, yearRange.max, yearRange.descending]);

    // ── Handle individual field change ──
    const handleChange = (
        field: 'month' | 'day' | 'year',
        val: string,
    ) => {
        let m = field === 'month' ? val : month;
        let d = field === 'day' ? val : day;
        let y = field === 'year' ? val : year;

        // Auto-clamp day if it exceeds max for selected month/year
        // Example: Feb 30 → Feb 28/29
        if ((field === 'month' || field === 'year') && m && y && d) {
            const max = new Date(parseInt(y), parseInt(m), 0).getDate();
            if (parseInt(d) > max) {
                d = String(max).padStart(2, '0');
            }
        }

        setMonth(m);
        setDay(d);
        setYear(y);

        // Only emit when ALL 3 fields are filled
        if (m && d && y) {
            onChange(
                `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
            );
        }
    };

    // ── Shared select style ──
    const selectBase = `
        w-full bg-transparent py-3 text-sm font-medium
        outline-none cursor-pointer appearance-none
        transition-colors duration-200
    `;

    return (
        <div
            className={`
                flex items-center rounded-xl border overflow-hidden
                transition-all duration-200
                ${hasError
                    ? 'border-red-300 bg-red-50/30'
                    : 'border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-gray-900/5 focus-within:border-gray-900 focus-within:bg-white'
                }
            `}
        >
            {/* ── Month ── */}
            <div className="relative flex-[1.4] min-w-0">
                <select
                    value={month}
                    onChange={(e) => handleChange('month', e.target.value)}
                    onBlur={onBlur}
                    className={`${selectBase} px-3 pr-7 ${
                        month ? 'text-gray-900' : 'text-gray-400'
                    }`}
                >
                    <option value="" disabled>
                        Month
                    </option>
                    {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                            {m.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-gray-200 shrink-0" />

            {/* ── Day ── */}
            <div className="relative flex-[0.7] min-w-0">
                <select
                    value={day}
                    onChange={(e) => handleChange('day', e.target.value)}
                    onBlur={onBlur}
                    className={`${selectBase} px-2 pr-5 text-center ${
                        day ? 'text-gray-900' : 'text-gray-400'
                    }`}
                >
                    <option value="" disabled>
                        Day
                    </option>
                    {Array.from({ length: maxDays }, (_, i) => {
                        const dVal = String(i + 1).padStart(2, '0');
                        return (
                            <option key={dVal} value={dVal}>
                                {i + 1}
                            </option>
                        );
                    })}
                </select>
                <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-gray-200 shrink-0" />

            {/* ── Year ── */}
            <div className="relative flex-[0.9] min-w-0">
                <select
                    value={year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    onBlur={onBlur}
                    className={`${selectBase} px-2 pr-6 text-center ${
                        year ? 'text-gray-900' : 'text-gray-400'
                    }`}
                >
                    <option value="" disabled>
                        Year
                    </option>
                    {years.map((y) => (
                        <option key={y} value={String(y)}>
                            {y}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────
// PASSENGER FORM PROPS
// ──────────────────────────────────────────────
interface PassengerFormProps {
    index: number;
    type: 'adult' | 'child' | 'infant';
    register: UseFormRegister<BookingFormData>;
    errors: FieldErrors<BookingFormData>;
    control: Control<BookingFormData>; // ← NEW: Controller এর জন্য
}

// ──────────────────────────────────────────────
// PASSENGER FORM COMPONENT
// ──────────────────────────────────────────────
export const PassengerForm = ({
    index,
    type,
    register,
    errors,
    control,
}: PassengerFormProps) => {
    const error = errors.passengers?.[index];
    const currentYear = new Date().getFullYear();

    // ── Year ranges based on passenger type ──
    // Adult: 12+ বয়স → সর্বোচ্চ জন্মসাল = আজ - ১২
    // Child: 2-11 বয়স
    // Infant: 0-2 বয়স
    const dobYearRange = useMemo(() => {
        switch (type) {
            case 'adult':
                return {
                    min: currentYear - 80,
                    max: currentYear - 12,
                    descending: true,
                };
            case 'child':
                return {
                    min: currentYear - 12,
                    max: currentYear - 2,
                    descending: true,
                };
            case 'infant':
                return {
                    min: currentYear - 2,
                    max: currentYear,
                    descending: true,
                };
            default:
                return {
                    min: currentYear - 80,
                    max: currentYear,
                    descending: true,
                };
        }
    }, [type, currentYear]);

    // Passport Expiry: আজ থেকে ১৫ বছর পর্যন্ত
    const expiryYearRange = useMemo(
        () => ({
            min: currentYear,
            max: currentYear + 15,
            descending: false,
        }),
        [currentYear],
    );

    // ── Shared input style ──
    const inputClass = (hasErr?: boolean) => `
        w-full min-w-0 p-3 bg-gray-50 border rounded-xl
        text-sm font-medium outline-none transition-all duration-200
        placeholder:text-gray-300 placeholder:font-normal
        focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 focus:bg-white
        ${hasErr ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}
    `;

    // ── Type-based colors ──
    const typeConfig = {
        adult: { bg: 'bg-rose-50', text: 'text-rose-500', label: 'Adult' },
        child: { bg: 'bg-blue-50', text: 'text-blue-500', label: 'Child' },
        infant: {
            bg: 'bg-amber-50',
            text: 'text-amber-500',
            label: 'Infant',
        },
    };
    const config = typeConfig[type];

    return (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-100 overflow-hidden">
            {/* ═══ Header ═══ */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div
                    className={`
                        w-9 h-9 rounded-xl flex items-center justify-center
                        ${config.bg} ${config.text}
                    `}
                >
                    <User className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900">
                        Passenger {index + 1}
                        <span className="text-xs font-medium text-gray-400 ml-1.5">
                            ({config.label})
                        </span>
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        Enter details exactly as they appear on passport ·
                        <span className="text-rose-500 font-bold"> *</span>{' '}
                        Required
                    </p>
                </div>
            </div>

            {/* ═══ Form Fields ═══ */}
            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* ── First Name ── */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            First Name{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <input
                            {...register(`passengers.${index}.firstName`)}
                            placeholder="e.g. JOHN"
                            className={`${inputClass(!!error?.firstName)} uppercase`}
                        />
                        {error?.firstName && (
                            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {error.firstName.message}
                            </p>
                        )}
                    </div>

                    {/* ── Middle Name (Optional) ── */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                            Middle Name
                            <span className="text-gray-300 normal-case font-normal text-[9px]">
                                Optional
                            </span>
                        </label>
                        <input
                            {...register(`passengers.${index}.middleName`)}
                            placeholder="e.g. QUINCY"
                            className={`${inputClass()} uppercase`}
                        />
                    </div>

                    {/* ── Last Name ── */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Last Name{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <input
                            {...register(`passengers.${index}.lastName`)}
                            placeholder="e.g. DOE"
                            className={`${inputClass(!!error?.lastName)} uppercase`}
                        />
                        {error?.lastName && (
                            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {error.lastName.message}
                            </p>
                        )}
                    </div>

                    {/* ── Date of Birth (Custom Picker) ── */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Date of Birth{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <Controller
                            name={`passengers.${index}.dob`}
                            control={control}
                            render={({ field }) => (
                                <CustomDatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    yearRange={dobYearRange}
                                    hasError={!!error?.dob}
                                />
                            )}
                        />
                        {error?.dob && (
                            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {error.dob.message}
                            </p>
                        )}
                    </div>

                    {/* ── Gender ── */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Gender{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {(['male', 'female'] as const).map((g) => (
                                <label
                                    key={g}
                                    className="
                                        flex items-center gap-2 cursor-pointer
                                        bg-gray-50 px-3 py-3 rounded-xl border
                                        border-gray-200 hover:border-gray-300
                                        w-full transition-all duration-200
                                        has-[:checked]:border-gray-900
                                        has-[:checked]:bg-gray-50
                                    "
                                >
                                    <input
                                        type="radio"
                                        value={g}
                                        {...register(
                                            `passengers.${index}.gender`,
                                        )}
                                        className="accent-gray-900 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {g}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {error?.gender && (
                            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {error.gender.message}
                            </p>
                        )}
                    </div>

                    {/* ── Passport Number ── */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Passport Number{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                {...register(
                                    `passengers.${index}.passportNumber`,
                                )}
                                placeholder="A12345678"
                                className={`${inputClass(!!error?.passportNumber)} pl-10 uppercase font-mono`}
                            />
                        </div>
                        {error?.passportNumber && (
                            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {error.passportNumber.message}
                            </p>
                        )}
                    </div>

                    {/* ── Passport Expiry (Custom Picker) ── */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Passport Expiry{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <Controller
                            name={`passengers.${index}.passportExpiry`}
                            control={control}
                            render={({ field }) => (
                                <CustomDatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    yearRange={expiryYearRange}
                                    hasError={!!error?.passportExpiry}
                                />
                            )}
                        />
                        {error?.passportExpiry && (
                            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {error.passportExpiry.message}
                            </p>
                        )}
                    </div>

                    {/* ── Passport Country ── */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Passport Country{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                {...register(
                                    `passengers.${index}.passportCountry`,
                                )}
                                defaultValue="US"
                                className={`${inputClass(!!error?.passportCountry)} appearance-none cursor-pointer pr-8`}
                            >
                                <option value="" disabled>
                                    Select Country
                                </option>
                                {COUNTRY_LIST.map((country) => (
                                    <option
                                        key={country.code}
                                        value={country.code}
                                    >
                                        {country.name} ({country.code})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {error?.passportCountry && (
                            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {error.passportCountry.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};