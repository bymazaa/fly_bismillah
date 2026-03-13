'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Plane,
  IdCard,
  CreditCard,
  Globe,
  Shield,
  Users,
  Fingerprint,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ==========================================
// Types
// ==========================================
export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  type: string;
  gender: string;
  dob: string;
  passportNumber: string;
  passportExpiry: string;
  passportCountry: string;
  email: string;
  phone: string;
  lastPnr: string;
  lastBookingRef: string;
  lastTravelDate: string;
  totalBookings: number;
  cardNumber: string;
  cardHolderName: string;
  cardExpiry: string;
  fullBillingAddress: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PassengerApiResponse {
  success: boolean;
  data: Passenger[];
  pagination: Pagination;
  stats?: {
    totalPassengers: number;
    withCard: number;
    withPassport: number;
  };
  appliedFilters: {
    search: string | null;
    type: string | null;
    gender: string | null;
    passportCountry: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    sortBy: string;
    sortOrder: string;
  };
}

interface FilterState {
  search: string;
  type: string;
  gender: string;
  passportCountry: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

// ==========================================
// Constants
// ==========================================
const LIMIT_OPTIONS = [10, 25, 50, 100];

const PASSENGER_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
  { value: 'infant', label: 'Infant' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const SORTABLE_COLUMNS: Record<string, string> = {
  firstName: 'Name',
  email: 'Email',
  dob: 'Date of Birth',
  type: 'Type',
  lastTravelDate: 'Last Booking',
  passportCountry: 'Country',
};

const INITIAL_FILTERS: FilterState = {
  search: '',
  type: '',
  gender: '',
  passportCountry: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'lastTravelDate',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

// ==========================================
// Helpers
// ==========================================
const safeFormat = (value: string, fmt: string) => {
  if (!value || value === 'N/A') return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return format(d, fmt);
};

const getAvatarColor = (name: string) => {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
    'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

function buildQueryString(filters: FilterState): string {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.type) params.set('type', filters.type);
  if (filters.gender) params.set('gender', filters.gender);
  if (filters.passportCountry) params.set('passportCountry', filters.passportCountry);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  return params.toString();
}

function hasActiveFilters(filters: FilterState): boolean {
  return !!(
    filters.search.trim() ||
    filters.type ||
    filters.gender ||
    filters.passportCountry ||
    filters.dateFrom ||
    filters.dateTo
  );
}

function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.type) count++;
  if (filters.gender) count++;
  if (filters.passportCountry) count++;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;
  return count;
}

// ==========================================
// Custom Hook: Debounce
// ==========================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ==========================================
// Stat Card
// ==========================================
function StatCard({
  label,
  value,
  subtitle,
  icon,
  accentColor,
  loading: isLoading,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  loading?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/60">
      <div
        className={`absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-[0.08] ${accentColor}`}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          {isLoading ? (
            <div className="h-7 w-16 rounded-lg bg-slate-100 animate-pulse" />
          ) : (
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Sensitive Data
// ==========================================
const SensitiveData: React.FC<{ value: string }> = ({ value }) => {
  const [show, setShow] = useState(false);

  if (!value || value === 'N/A') {
    return <span className="text-slate-400 text-[11px]">No card on file</span>;
  }

  const masked = `•••• •••• •••• ${value.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-mono text-[12px] transition-all duration-200 ${
          show ? 'text-slate-800 tracking-normal' : 'text-slate-500 tracking-[0.12em]'
        }`}
      >
        {show ? value : masked}
      </span>
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        className="inline-flex cursor-pointer h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all duration-200"
        title={show ? 'Hide' : 'Reveal'}
      >
        {show ? <EyeOff size={10} /> : <Eye size={10} />}
      </button>
    </div>
  );
};

// ==========================================
// Sortable Column Header
// ==========================================
function SortableHeader({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  onSort,
  align = 'left',
}: {
  label: string;
  field: string;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  align?: 'left' | 'right';
}) {
  const isActive = currentSortBy === field;

  return (
    <th
      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-700 transition-colors group ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSort(field)}
    >
      <div
        className={`inline-flex items-center gap-1.5 ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        <span>{label}</span>
        <span
          className={`transition-all duration-200 ${
            isActive
              ? 'text-blue-600 opacity-100'
              : 'text-slate-300 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isActive ? (
            currentSortOrder === 'asc' ? (
              <ArrowUp size={12} />
            ) : (
              <ArrowDown size={12} />
            )
          ) : (
            <ArrowUpDown size={12} />
          )}
        </span>
      </div>
    </th>
  );
}

// ==========================================
// Filter Panel
// ==========================================
function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  isOpen,
  onToggle,
}: {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const activeCount = countActiveFilters(filters);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
            isOpen || activeCount > 0
              ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-2xl shadow-gray-100'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {hasActiveFilters(filters) && (
          <button
            onClick={onReset}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-200"
          >
            <RotateCcw size={12} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Passenger Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => onFilterChange('type', e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {PASSENGER_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => onFilterChange('gender', e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Passport Country
              </label>
              <input
                type="text"
                placeholder="e.g. BD, US, UK"
                value={filters.passportCountry}
                onChange={(e) =>
                  onFilterChange('passportCountry', e.target.value.toUpperCase())
                }
                maxLength={3}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 uppercase placeholder:normal-case placeholder:text-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Booking From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Booking To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFilterChange('dateTo', e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              />
            </div>
          </div>

          {activeCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-[11px] font-medium text-slate-400">Active:</span>
              {filters.type && (
                <FilterTag label={`Type: ${filters.type}`} onRemove={() => onFilterChange('type', '')} />
              )}
              {filters.gender && (
                <FilterTag label={`Gender: ${filters.gender}`} onRemove={() => onFilterChange('gender', '')} />
              )}
              {filters.passportCountry && (
                <FilterTag label={`Country: ${filters.passportCountry}`} onRemove={() => onFilterChange('passportCountry', '')} />
              )}
              {filters.dateFrom && (
                <FilterTag label={`From: ${filters.dateFrom}`} onRemove={() => onFilterChange('dateFrom', '')} />
              )}
              {filters.dateTo && (
                <FilterTag label={`To: ${filters.dateTo}`} onRemove={() => onFilterChange('dateTo', '')} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Filter Tag
// ==========================================
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-[11px] font-medium text-blue-700">
      {label}
      <button
        onClick={onRemove}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
      >
        <X size={10} />
      </button>
    </span>
  );
}

// ==========================================
// Pagination Bar
// ==========================================
function PaginationBar({
  pagination,
  currentLimit,
  onPageChange,
  onLimitChange,
  loading,
}: {
  pagination: Pagination;
  currentLimit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  loading: boolean;
}) {
  const { currentPage, totalPages, totalItems, hasNextPage, hasPrevPage } = pagination;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = (currentPage - 1) * currentLimit + 1;
  const endItem = Math.min(currentPage * currentLimit, totalItems);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-5 py-4">
      <div className="flex items-center gap-4">
        <p className="text-[12px] text-slate-500">
          Showing <span className="font-semibold text-slate-700">{startItem}</span>
          {' – '}
          <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalItems.toLocaleString('en-US')}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Per page:</span>
          <select
            value={currentLimit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={loading}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-700 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 disabled:opacity-50 cursor-pointer transition-all"
          >
            {LIMIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={() => onPageChange(1)} disabled={!hasPrevPage || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
          title="First page">
          <ChevronsLeft size={14} />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={!hasPrevPage || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
          title="Previous page">
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="flex h-8 w-8 items-center justify-center text-[12px] text-slate-400">…</span>
            ) : (
              <button key={page} onClick={() => onPageChange(page)} disabled={loading}
                className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                  page === currentPage
                    ? 'bg-slate-900 text-white shadow-2xl shadow-gray-100'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                } disabled:opacity-50`}>
                {page}
              </button>
            )
          )}
        </div>

        <button onClick={() => onPageChange(currentPage + 1)} disabled={!hasNextPage || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
          title="Next page">
          <ChevronRight size={14} />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={!hasNextPage || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
          title="Last page">
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Table Skeleton (now actually used)
// ==========================================
function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={`skel-${i}`} className="animate-pulse">
          <td className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3.5 w-28 rounded-md bg-slate-100" />
                <div className="h-3 w-20 rounded-md bg-slate-100/70" />
              </div>
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="space-y-2">
              <div className="h-3.5 w-24 rounded-md bg-slate-100" />
              <div className="h-3 w-16 rounded-md bg-slate-100/70" />
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="space-y-2">
              <div className="h-3.5 w-32 rounded-md bg-slate-100" />
              <div className="h-3 w-24 rounded-md bg-slate-100/70" />
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="h-16 w-44 rounded-lg bg-slate-100" />
          </td>
          <td className="px-5 py-4 text-right">
            <div className="flex flex-col items-end gap-2">
              <div className="h-5 w-20 rounded-full bg-slate-100" />
              <div className="h-3 w-16 rounded-md bg-slate-100/70" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ==========================================
// Table Overlay
// ==========================================
function TableOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl">
      <div className="flex items-center gap-2.5 rounded-xl bg-white px-5 py-3 shadow-lg border border-slate-200/60">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm font-medium text-slate-600">Loading…</span>
      </div>
    </div>
  );
}

// ==========================================
// Mobile Card View (for small screens)
// ==========================================
function MobilePassengerCard({ passenger: p }: { passenger: Passenger }) {
  const initials = `${p.firstName?.charAt(0) || ''}${p.lastName?.charAt(0) || ''}`.toUpperCase();
  const avatarColor = getAvatarColor(p.firstName || 'A');

  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-4 space-y-3">
      {/* Top Row: Avatar + Name + Type */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-[11px] font-bold text-white`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-900 truncate">
            {p.firstName} {p.lastName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                p.type === 'adult'
                  ? 'bg-slate-100 text-slate-600'
                  : p.type === 'child'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-pink-50 text-pink-700'
              }`}
            >
              {p.type}
            </span>
            {p.gender && (
              <span className="text-[11px] text-slate-400 capitalize">{p.gender}</span>
            )}
            {p.totalBookings > 1 && (
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-medium">
                {p.totalBookings} bookings
              </span>
            )}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">
          <Plane size={9} />
          {p.lastPnr || 'NO-PNR'}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Mail size={11} className="text-slate-400" />
          <span className="truncate">{p.email || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Phone size={11} className="text-slate-400" />
          <span>{p.phone || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <IdCard size={11} className="text-slate-400" />
          <span className="font-mono">{p.passportNumber || 'N/A'}</span>
          {p.passportCountry && p.passportCountry !== 'N/A' && (
            <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-400">
              {p.passportCountry}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar size={11} className="text-slate-400" />
          <span>{safeFormat(p.lastTravelDate, 'dd MMM yyyy')}</span>
        </div>
      </div>

      {/* Card Info */}
      <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CreditCard size={11} className="text-slate-400" />
          <SensitiveData value={p.cardNumber} />
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {p.lastBookingRef || 'N/A'}
        </span>
      </div>
    </div>
  );
}

// ==========================================
// Main Page Component
// ==========================================
const PassengerListPage: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 400);
  const abortRef = useRef<AbortController | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // ─── Fetch Data ─────────────────────────────
  const fetchPassengers = useCallback(
    async (filterOverrides?: Partial<FilterState>) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      const currentFilters = { ...filtersRef.current, ...filterOverrides };
      const qs = buildQueryString(currentFilters);

      try {
        const res = await fetch(`/api/dashboard/passengers?${qs}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: PassengerApiResponse = await res.json();

        if (data.success) {
          setPassengers(data.data);
          setPagination(data.pagination);
        } else {
          toast.error('Failed to load passengers');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Fetch error:', err);
        toast.error('Server error while fetching passengers');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    []
  );

  // ─── Effects ────────────────────────────────
  useEffect(() => {
    fetchPassengers(filtersRef.current);
  }, [fetchPassengers]);

  useEffect(() => {
    if (initialLoad) return;
    const updated = { ...filtersRef.current, search: debouncedSearch, page: 1 };
    setFilters(updated);
    fetchPassengers(updated);
  }, [debouncedSearch, fetchPassengers, initialLoad]);

  // ─── Handlers ───────────────────────────────
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const updated = { ...filtersRef.current, [key]: value, page: 1 };
    setFilters(updated);
    if (key !== 'search') {
      fetchPassengers(updated);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage) return;
    const updated = { ...filtersRef.current, page };
    setFilters(updated);
    fetchPassengers(updated);
    document.getElementById('passenger-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLimitChange = (limit: number) => {
    const updated = { ...filtersRef.current, limit, page: 1 };
    setFilters(updated);
    fetchPassengers(updated);
  };

  const handleSort = (field: string) => {
    const isSameField = filtersRef.current.sortBy === field;
    const newOrder: 'asc' | 'desc' =
      isSameField && filtersRef.current.sortOrder === 'asc' ? 'desc' : 'asc';
    const updated = { ...filtersRef.current, sortBy: field, sortOrder: newOrder, page: 1 };
    setFilters(updated);
    fetchPassengers(updated);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    fetchPassengers(INITIAL_FILTERS);
  };

  // ─── Stats ──────────────────────────────────
  const withCardProfile = passengers.filter((p) => p.cardNumber && p.cardNumber !== 'N/A').length;
  const withPassport = passengers.filter((p) => p.passportNumber && p.passportNumber !== 'N/A').length;

  // ─── Initial Loader ─────────────────────────
  if (initialLoad) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-white shadow-lg shadow-slate-200/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading passenger records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f9fb] p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        {/* ═══════════════════════════════
            HEADER
        ═══════════════════════════════ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Dashboard · Passengers
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Passenger Database
            </h1>
            <p className="text-sm text-slate-500 max-w-lg">
              {pagination.totalItems.toLocaleString('en-US')} unique passengers
              with booking history, identity documents and payment profiles.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search PNR, name, phone, email…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100 shadow-2xl shadow-gray-100"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            {filters.search && !loading && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
            {loading && filters.search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════
            STAT CARDS
        ═══════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Passengers"
            value={pagination.totalItems.toLocaleString('en-US')}
            subtitle="Matching current filters"
            accentColor="bg-blue-500"
            icon={<Users className="h-5 w-5" />}
            loading={loading}
          />
          <StatCard
            label="Card Profiles"
            value={withCardProfile.toLocaleString('en-US')}
            subtitle={`Out of ${passengers.length} on this page`}
            accentColor="bg-violet-500"
            icon={<CreditCard className="h-5 w-5" />}
            loading={loading}
          />
          <StatCard
            label="With Passport"
            value={withPassport.toLocaleString('en-US')}
            subtitle={`Out of ${passengers.length} on this page`}
            accentColor="bg-emerald-500"
            icon={<Fingerprint className="h-5 w-5" />}
            loading={loading}
          />
        </div>

        {/* ═══════════════════════════════
            FILTER PANEL
        ═══════════════════════════════ */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          isOpen={filterPanelOpen}
          onToggle={() => setFilterPanelOpen((v) => !v)}
        />

        {/* ═══════════════════════════════
            DESKTOP TABLE
        ═══════════════════════════════ */}
        <div
          id="passenger-table"
          className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white hidden md:block"
        >
          {loading && !initialLoad && <TableOverlay />}

          {/* Table Meta Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Passenger Records</h2>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Sensitive data is masked by default. Click column headers to sort.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
              {filters.sortBy && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-slate-500">
                  Sorted by{' '}
                  <span className="font-semibold text-slate-700">
                    {SORTABLE_COLUMNS[filters.sortBy] || filters.sortBy}
                  </span>
                  {filters.sortOrder === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                </span>
              )}
              <span>
                Page <span className="font-semibold text-slate-600">{pagination.currentPage}</span>{' '}
                of <span className="font-semibold text-slate-600">{pagination.totalPages}</span>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <SortableHeader label="Passenger" field="firstName"
                    currentSortBy={filters.sortBy} currentSortOrder={filters.sortOrder} onSort={handleSort} />
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Passport & ID
                  </th>
                  <SortableHeader label="Contact" field="email"
                    currentSortBy={filters.sortBy} currentSortOrder={filters.sortOrder} onSort={handleSort} />
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Payment Profile
                  </th>
                  <SortableHeader label="Last Booking" field="lastTravelDate"
                    currentSortBy={filters.sortBy} currentSortOrder={filters.sortOrder}
                    onSort={handleSort} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* Loading Skeleton */}
                {loading && passengers.length === 0 && <TableSkeleton rows={filters.limit > 25 ? 10 : 6} />}

                {/* Data Rows */}
                {passengers.map((p) => {
                  const initials = `${p.firstName?.charAt(0) || ''}${p.lastName?.charAt(0) || ''}`.toUpperCase();
                  const avatarColor = getAvatarColor(p.firstName || 'A');

                  return (
                    <tr key={p.id} className="group transition-colors duration-150 hover:bg-blue-50/30">
                      {/* Passenger Info */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-[11px] font-bold text-white shadow-2xl shadow-gray-100`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">
                              {p.firstName} {p.lastName}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  p.type === 'adult'
                                    ? 'bg-slate-100 text-slate-600'
                                    : p.type === 'child'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-pink-50 text-pink-700'
                                }`}
                              >
                                {p.type}
                              </span>
                              {p.gender && (
                                <span className="text-[11px] text-slate-400 capitalize">{p.gender}</span>
                              )}
                              {p.dob && p.dob !== 'N/A' && (
                                <span className="text-[11px] text-slate-400">
                                  · {safeFormat(p.dob, 'dd MMM yyyy')}
                                </span>
                              )}
                              {p.totalBookings > 1 && (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                                  {p.totalBookings} bookings
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Passport & ID */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                              <IdCard size={12} />
                            </div>
                            <span className="font-mono text-[12px] font-medium text-slate-800">
                              {p.passportNumber || 'N/A'}
                            </span>
                            {p.passportCountry && p.passportCountry !== 'N/A' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                <Globe size={9} />
                                {p.passportCountry}
                              </span>
                            )}
                          </div>
                          <div className="ml-8 space-y-0.5">
                            <p className="text-[11px] text-slate-500">
                              Expires: <span className="font-medium text-slate-600">{safeFormat(p.passportExpiry, 'dd MMM yyyy')}</span>
                            </p>
                            <p className="text-[11px] text-slate-400">
                              DOB: {safeFormat(p.dob, 'dd MMM yyyy')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-400">
                              <Mail size={11} />
                            </div>
                            <span className="text-[12px] text-slate-700 truncate max-w-[160px]" title={p.email}>
                              {p.email || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-400">
                              <Phone size={11} />
                            </div>
                            <span className="text-[12px] font-medium text-slate-700">{p.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Payment Profile */}
                      <td className="px-5 py-4 align-top">
                        <div className="w-fit rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-3 shadow-2xl shadow-gray-100">
                          <div className="flex items-center gap-1.5 mb-2">
                            <CreditCard size={12} className="text-slate-400" />
                            <p className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px]">
                              {p.cardHolderName || 'No name'}
                            </p>
                          </div>
                          <SensitiveData value={p.cardNumber} />
                          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
                            <span className="text-[10px] text-slate-500">
                              Exp: <span className="font-medium">{p.cardExpiry || 'N/A'}</span>
                            </span>
                            {p.fullBillingAddress && p.fullBillingAddress !== 'N/A' && (
                              <span
                                className="flex items-center gap-1 border-l border-slate-100 pl-2 text-[10px] text-slate-400 max-w-[110px] truncate"
                                title={p.fullBillingAddress}
                              >
                                <MapPin size={9} className="flex-shrink-0" />
                                {p.fullBillingAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Last Booking */}
                      <td className="px-5 py-4 text-right align-top">
                        <div className="flex flex-col items-end gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xl shadow-gray-100">
                            <Plane size={10} />
                            {p.lastPnr || 'NO-PNR'}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200/80">
                            {p.lastBookingRef || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar size={10} />
                            {safeFormat(p.lastTravelDate, 'dd MMM yyyy')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty State */}
                {!loading && passengers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-20 text-center">
                      <div className="mx-auto flex flex-col items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                          <User className="h-7 w-7 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-700">No passengers found</p>
                          {hasActiveFilters(filters) && (
                            <p className="text-xs text-slate-500">Try adjusting your search or filters</p>
                          )}
                        </div>
                        {hasActiveFilters(filters) && (
                          <button onClick={handleResetFilters}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 cursor-pointer">
                            <RotateCcw size={12} />
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Desktop Pagination */}
          {pagination.totalItems > 0 && (
            <PaginationBar
              pagination={pagination}
              currentLimit={filters.limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              loading={loading}
            />
          )}
        </div>

        {/* ═══════════════════════════════
            MOBILE CARD VIEW
        ═══════════════════════════════ */}
        <div className="md:hidden space-y-3" id="passenger-table-mobile">
          {loading && !initialLoad && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2.5 rounded-xl bg-white px-5 py-3 shadow-lg border border-slate-200/60">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium text-slate-600">Loading…</span>
              </div>
            </div>
          )}

          {/* Mobile Meta */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">
                {pagination.totalItems.toLocaleString()} passengers
              </span>
            </div>
            {filters.sortBy && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                Sort: {SORTABLE_COLUMNS[filters.sortBy] || filters.sortBy}
                {filters.sortOrder === 'asc' ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
              </span>
            )}
          </div>

          {/* Cards */}
          {!loading && passengers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white px-5 py-16 text-center">
              <div className="mx-auto flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <User className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No passengers found</p>
                {hasActiveFilters(filters) && (
                  <>
                    <p className="text-xs text-slate-500">Try adjusting your filters</p>
                    <button onClick={handleResetFilters}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white cursor-pointer">
                      <RotateCcw size={12} />
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            passengers.map((p) => (
              <MobilePassengerCard key={p.id} passenger={p} />
            ))
          )}

          {/* Mobile Pagination */}
          {pagination.totalItems > 0 && (
            <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
              <PaginationBar
                pagination={pagination}
                currentLimit={filters.limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PassengerListPage;