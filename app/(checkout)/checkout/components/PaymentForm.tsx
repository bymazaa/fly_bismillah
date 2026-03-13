'use client';

import React from 'react';
import {
    UseFormRegister,
    FieldErrors,
    UseFormSetValue,
    UseFormWatch,
} from 'react-hook-form';
import {
    CreditCard,
    Lock,
    MapPin,
    Globe,
    User,
    Calendar,
    Hash,
    Home,
    ChevronDown,
    Shield,
    AlertCircle,
} from 'lucide-react';
import { BookingFormData, isAvsCountry } from '../utils/validation';
import { COUNTRY_LIST } from '../utils';

// ──────────────────────────────────────────────
// PROPS
// ──────────────────────────────────────────────
interface PaymentFormProps {
    register: UseFormRegister<BookingFormData>;
    errors:   FieldErrors<BookingFormData>;
    setValue: UseFormSetValue<BookingFormData>;
    watch:    UseFormWatch<BookingFormData>;   // ← needed for country watch
}

// ──────────────────────────────────────────────
// PAYMENT FORM
// ──────────────────────────────────────────────
export const PaymentForm: React.FC<PaymentFormProps> = ({
    register,
    errors,
    setValue,
    watch,
}) => {
    // Watch country to conditionally show zipCode
    const selectedCountry = watch('payment.billingAddress.country') ?? '';
    const showZipCode     = isAvsCountry(selectedCountry);

    // ── Card Number Auto-Format: 0000 0000 0000 0000 ──
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 19) val = val.slice(0, 19);
        const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = formatted;
        setValue('payment.cardNumber', formatted, { shouldValidate: true });
    };

    // ── Expiry Auto-Format: MM/YY ──
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 4) val = val.slice(0, 4);
        if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
        e.target.value = val;
        setValue('payment.expiryDate', val, { shouldValidate: true });
    };

    // ── Shared Input Style ──
    const inputClass = (hasError?: any) => `
        w-full min-w-0 bg-gray-50 text-sm font-medium text-gray-900
        placeholder:text-gray-300 placeholder:font-normal
        border rounded-xl px-3 py-3
        transition-all duration-200 outline-none
        focus:ring-2 focus:ring-gray-900/5
        focus:border-gray-900 focus:bg-white
        ${hasError ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}
    `;

    // ── Error Message ──
    const ErrorMsg = ({ message }: { message?: string }) => {
        if (!message) return null;
        return (
            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {message}
            </p>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-100 overflow-hidden">
            {/* ═══ Header ═══ */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">
                            Payment Details
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            Enter your card information securely
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider shrink-0">
                    <Shield className="w-3 h-3" />
                    SSL Secure
                </div>
            </div>

            {/* ═══ Form Body ═══ */}
            <div className="p-5 space-y-5">
                {/* ─── Card Number ─── */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Card Number
                    </label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            {...register('payment.cardNumber')}
                            onChange={handleCardNumberChange}
                            placeholder="0000 0000 0000 0000"
                            maxLength={23}
                            inputMode="numeric"
                            className={`${inputClass(errors.payment?.cardNumber)} pl-10 font-mono tracking-widest`}
                        />
                    </div>
                    <ErrorMsg message={errors.payment?.cardNumber?.message} />
                </div>

                {/* ─── Name + Expiry ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    {/* Cardholder Name */}
                    <div className="sm:col-span-7 space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Cardholder Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                {...register('payment.cardName')}
                                placeholder="Full name on card"
                                className={`${inputClass(errors.payment?.cardName)} pl-10 uppercase`}
                            />
                        </div>
                        <ErrorMsg message={errors.payment?.cardName?.message} />
                    </div>

                    {/* Expiry */}
                    <div className="sm:col-span-5 space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Expiry Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                {...register('payment.expiryDate')}
                                onChange={handleExpiryChange}
                                placeholder="MM/YY"
                                maxLength={5}
                                inputMode="numeric"
                                className={`${inputClass(errors.payment?.expiryDate)} pl-10 text-center font-mono tracking-[0.2em]`}
                            />
                        </div>
                        <ErrorMsg message={errors.payment?.expiryDate?.message} />
                    </div>
                </div>

                {/* ─── Divider ─── */}
                <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-gray-100" />
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* ─── Billing Address Header ─── */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-900">
                            Billing Address
                        </h4>
                        <p className="text-[9px] text-gray-400">
                            Must match your card statement
                        </p>
                    </div>
                </div>

                {/* ─── Street ─── */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Street Address
                    </label>
                    <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            {...register('payment.billingAddress.street')}
                            placeholder="123 Main Street, Apt 4B"
                            className={`${inputClass(errors.payment?.billingAddress?.street)} pl-10`}
                        />
                    </div>
                    <ErrorMsg message={errors.payment?.billingAddress?.street?.message} />
                </div>

                {/* ─── City + State ─── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            City
                        </label>
                        <input
                            {...register('payment.billingAddress.city')}
                            placeholder="New York"
                            className={inputClass(errors.payment?.billingAddress?.city)}
                        />
                        <ErrorMsg message={errors.payment?.billingAddress?.city?.message} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            State / Province
                        </label>
                        <input
                            {...register('payment.billingAddress.state')}
                            placeholder="NY"
                            className={inputClass(errors.payment?.billingAddress?.state)}
                        />
                        <ErrorMsg message={errors.payment?.billingAddress?.state?.message} />
                    </div>
                </div>

                {/* ─── Country + Zip (conditional) ─── */}
                {/* Zip is shown only for US / CA / GB — AVS-supported countries */}
                <div className={`grid gap-3 ${showZipCode ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Country — always first so layout shift is minimal */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Country
                        </label>
                        <div className="relative">
                            <select
                                {...register('payment.billingAddress.country')}
                                defaultValue="US"
                                className={`${inputClass(errors.payment?.billingAddress?.country)} appearance-none cursor-pointer pr-8`}
                            >
                                <option value="" disabled>Select</option>
                                {COUNTRY_LIST.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <ErrorMsg message={errors.payment?.billingAddress?.country?.message} />
                    </div>

                    {/* Zip Code — only for AVS countries (US / CA / GB) */}
                    {showZipCode && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Zip / Postal Code
                                <span className="text-red-400 ml-0.5">*</span>
                            </label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    {...register('payment.billingAddress.zipCode')}
                                    placeholder={
                                        selectedCountry === 'GB' ? 'SW1A 1AA' :
                                        selectedCountry === 'CA' ? 'A1A 1A1'  :
                                        '10001'
                                    }
                                    inputMode="text"
                                    autoComplete="postal-code"
                                    className={`${inputClass(errors.payment?.billingAddress?.zipCode)} pl-10 font-mono`}
                                />
                            </div>
                            <ErrorMsg message={errors.payment?.billingAddress?.zipCode?.message} />
                        </div>
                    )}
                </div>

                {/* ─── Footer ─── */}
                <div className="flex items-center justify-center gap-1.5 pt-2">
                    <Lock className="w-3 h-3 text-gray-300" />
                    <span className="text-[9px] text-gray-400">
                        Your payment information is encrypted and secure. We never store your card details.
                    </span>
                </div>
            </div>
        </div>
    );
};