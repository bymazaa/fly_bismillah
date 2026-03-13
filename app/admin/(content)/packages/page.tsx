'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Eye,
  MapPin, X, Loader2, AlertTriangle, Power, CheckCircle2, Package,
  Globe, Star, DollarSign, LayoutGrid, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

// ══════════════════════════════════════════
// Types
// ══════════════════════════════════════════

interface PackageType {
  _id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  image: string;
  isFeatured: boolean;
  description?: string;
  included?: string[];
  slug: string;
}

// ══════════════════════════════════════════
// Stat Card
// ══════════════════════════════════════════

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: any;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/60">
      <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-[0.07] ${accent}`} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
          <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Category Color Helper
// ══════════════════════════════════════════

const getCategoryStyle = (cat: string) => {
  const map: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    Hajj: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/60', dot: 'bg-emerald-500' },
    Umrah: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200/60', dot: 'bg-blue-500' },
    Holiday: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200/60', dot: 'bg-amber-500' },
    Others: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200/60', dot: 'bg-violet-500' },
  };
  return map[cat] || { bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200/60', dot: 'bg-slate-400' };
};

// ══════════════════════════════════════════
// Table Skeleton
// ══════════════════════════════════════════

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-50">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
          <div className="flex items-center gap-3 flex-[2]">
            <div className="h-12 w-12 rounded-xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3.5 w-32 rounded-md bg-slate-100" />
              <div className="h-3 w-16 rounded-md bg-slate-100/70" />
            </div>
          </div>
          <div className="flex-1">
            <div className="h-3.5 w-20 rounded-md bg-slate-100" />
          </div>
          <div className="flex-1">
            <div className="h-6 w-16 rounded-full bg-slate-100" />
          </div>
          <div className="flex-1">
            <div className="h-3.5 w-16 rounded-md bg-slate-100" />
          </div>
          <div className="flex-[0.8]">
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="flex-[0.5] flex justify-end">
            <div className="h-8 w-8 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════

export default function AllPackagesPage() {
  const router = useRouter();

  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewData, setViewData] = useState<PackageType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch ──
  const fetchPackages = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/packages');
      if (data.success) setPackages(data.data);
    } catch {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // ── Handlers ──
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { data } = await axios.patch(`/api/dashboard/packages/${id}`, {
        isFeatured: !currentStatus,
      });
      if (data.success || data.ok) {
        toast.success(currentStatus ? 'Package hidden' : 'Package published');
        fetchPackages();
        setOpenMenuId(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Status update failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/dashboard/packages/${deleteId}`);
      setPackages((prev) => prev.filter((p) => p._id !== deleteId));
      toast.success('Package deleted successfully');
      setDeleteId(null);
      setOpenMenuId(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Delete failed');
    }
  };

  // ── Filter ──
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || pkg.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // ── Stats ──
  const totalPackages = packages.length;
  const publishedCount = packages.filter((p) => p.isFeatured).length;
  const hiddenCount = packages.filter((p) => !p.isFeatured).length;
  const avgPrice = totalPackages
    ? packages.reduce((a, c) => a + c.price, 0) / totalPackages
    : 0;

  const categories = ['All', 'Hajj', 'Umrah', 'Holiday', 'Others'];

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  return (
    <div
      className="min-h-screen w-full bg-[#f8f9fb] p-4 md:p-6 lg:p-8"
      onClick={() => setOpenMenuId(null)}
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        {/* ─── HEADER ─── */}
        <div
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Content · Packages
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Package Management
            </h1>
            <p className="text-sm text-slate-500 max-w-lg">
              Manage travel packages, update pricing and control visibility.
            </p>
          </div>

          <Link href="/admin/packages/create">
            <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-300/30 transition-all hover:bg-slate-800 active:scale-[0.97] cursor-pointer">
              <Plus size={16} />
              Add Package
            </button>
          </Link>
        </div>

        {/* ─── STAT CARDS ─── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Packages" value={totalPackages} icon={Package} accent="bg-blue-500" />
          <StatCard label="Published" value={publishedCount} icon={Globe} accent="bg-emerald-500" />
          <StatCard label="Hidden" value={hiddenCount} icon={Power} accent="bg-slate-500" />
          <StatCard
            label="Avg. Price"
            value={`$${avgPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            icon={DollarSign}
            accent="bg-amber-500"
          />
        </div>

        {/* ─── CONTROLS ─── */}
        <div
          className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search packages by title or location…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100/80 p-1">
            {categories.map((cat) => {
              const style = cat !== 'All' ? getCategoryStyle(cat) : null;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-lg px-3.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── DATA TABLE ─── */}
        <div
          className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Table Meta */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">All Packages</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">{filteredPackages.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalPackages}</span> packages
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {publishedCount} Live
              </span>
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Package
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Location
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Category
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Price
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPackages.length > 0 ? (
                    filteredPackages.map((pkg) => {
                      const catStyle = getCategoryStyle(pkg.category);

                      return (
                        <tr
                          key={pkg._id}
                          className="group transition-colors duration-150 hover:bg-blue-50/30"
                        >
                          {/* ── Package ── */}
                          <td className="px-5 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200/80 shadow-sm ring-1 ring-slate-100">
                                <img
                                  src={pkg.image}
                                  alt={pkg.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-slate-900 truncate max-w-[200px]">
                                  {pkg.title}
                                </p>
                                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                  ID: {pkg._id.slice(-6)}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* ── Location ── */}
                          <td className="px-5 py-4 align-top">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                                <MapPin size={12} />
                              </div>
                              <span className="text-[13px] font-medium text-slate-700">
                                {pkg.location}
                              </span>
                            </div>
                          </td>

                          {/* ── Category ── */}
                          <td className="px-5 py-4 align-top">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${catStyle.bg} ${catStyle.text} ${catStyle.ring}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`} />
                              {pkg.category}
                            </span>
                          </td>

                          {/* ── Price ── */}
                          <td className="px-5 py-4 align-top">
                            <span className="text-[13px] font-bold text-slate-900">
                              ${pkg.price.toLocaleString()}
                            </span>
                          </td>

                          {/* ── Status ── */}
                          <td className="px-5 py-4 align-top">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                                pkg.isFeatured
                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
                                  : 'bg-slate-50 text-slate-500 ring-slate-200/60'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  pkg.isFeatured ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              {pkg.isFeatured ? 'Published' : 'Hidden'}
                            </span>
                          </td>

                          {/* ── Actions ── */}
                          <td className="px-5 py-4 text-right align-top relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === pkg._id ? null : pkg._id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 cursor-pointer ml-auto"
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {/* Dropdown */}
                            {openMenuId === pkg._id && (
                              <div
                                ref={menuRef}
                                className="absolute right-5 top-14 z-50 w-52 overflow-hidden rounded-xl border border-slate-200/70 bg-white p-1.5 shadow-2xl shadow-slate-300/30 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                              >
                                <button
                                  onClick={() => {
                                    setViewData(pkg);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                                >
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-500">
                                    <Eye size={13} />
                                  </div>
                                  View Details
                                </button>

                                <Link
                                  href={`/admin/packages/edit?id=${pkg._id}`}
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <div className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                      <Pencil size={13} />
                                    </div>
                                    Edit Package
                                  </div>
                                </Link>

                                <button
                                  onClick={() => handleToggleStatus(pkg._id, pkg.isFeatured)}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-amber-50 hover:text-amber-700 cursor-pointer"
                                >
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-500">
                                    <Power size={13} />
                                  </div>
                                  {pkg.isFeatured ? 'Unpublish' : 'Publish'}
                                </button>

                                <div className="my-1 h-px bg-slate-100" />

                                <button
                                  onClick={() => {
                                    setDeleteId(pkg._id);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
                                >
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-500">
                                    <Trash2 size={13} />
                                  </div>
                                  Delete Package
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-20 text-center">
                        <div className="mx-auto flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <Package className="h-6 w-6 text-slate-300" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">No packages found</p>
                          <p className="text-xs text-slate-500">
                            Try adjusting your search or filter criteria
                          </p>
                          {(searchQuery || categoryFilter !== 'All') && (
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setCategoryFilter('All');
                              }}
                              className="mt-1 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
                            >
                              Clear filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom bar */}
          {!loading && filteredPackages.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-[11px] text-slate-400">
                {filteredPackages.length} package{filteredPackages.length !== 1 ? 's' : ''} displayed
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <LayoutGrid size={11} />
                <span>Inventory synced</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════════ */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm px-4 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60 animate-in zoom-in-95 duration-200">
            {/* Decorative top */}
            <div className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 px-6 pt-8 pb-6">
              <div className="absolute top-4 right-6 h-20 w-20 rounded-full bg-rose-200/30 blur-2xl" />
              <div className="absolute bottom-2 left-8 h-14 w-14 rounded-full bg-pink-200/40 blur-xl" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-rose-200/40 ring-1 ring-rose-100/60">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>

                <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
                  Delete Package?
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                  This will permanently delete this package from your inventory. This action{' '}
                  <span className="font-bold text-slate-700">cannot be undone</span>.
                </p>
              </div>
            </div>

            <div className="px-6 py-5 bg-white">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition-all hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-rose-300/40 transition-all hover:from-rose-700 hover:to-rose-600 active:scale-[0.97] cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          VIEW DETAILS MODAL
      ══════════════════════════════════════════ */}
      {viewData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm px-4 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Hero Image */}
            <div className="relative h-56 w-full flex-shrink-0 overflow-hidden">
              <img
                src={viewData.image}
                alt={viewData.title}
                className="h-full w-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

              {/* Close button */}
              <button
                onClick={() => setViewData(null)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-600 transition-all hover:bg-white hover:text-slate-900 cursor-pointer shadow-sm backdrop-blur-sm"
              >
                <X size={16} />
              </button>

              {/* Info on image */}
              <div className="absolute bottom-4 left-5 right-5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ring-1 mb-2 bg-white/90 backdrop-blur-sm ${
                    getCategoryStyle(viewData.category).text
                  } ${getCategoryStyle(viewData.category).ring}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${getCategoryStyle(viewData.category).dot}`} />
                  {viewData.category}
                </span>

                <h2 className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm">
                  {viewData.title}
                </h2>
                <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/80">
                  <MapPin size={12} />
                  {viewData.location}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Price & Status */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50 to-white p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Package Price
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                    ${viewData.price.toLocaleString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
                    viewData.isFeatured
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
                      : 'bg-slate-50 text-slate-500 ring-slate-200/60'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      viewData.isFeatured ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {viewData.isFeatured ? 'Published' : 'Hidden'}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
                  Description
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {viewData.description || 'No description provided.'}
                </p>
              </div>

              {/* Included Services */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
                  Included Services
                </h3>
                {viewData.included && viewData.included.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewData.included.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 transition-colors hover:bg-white"
                      >
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                          <CheckCircle2 size={13} />
                        </div>
                        <span className="text-[12px] font-medium text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400 italic">No services listed.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex-shrink-0">
              <Link href={`/admin/packages/edit?id=${viewData._id}`} className="flex-1">
                <button className="w-full rounded-xl bg-slate-900 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-slate-300/30 transition-all hover:bg-slate-800 active:scale-[0.97] cursor-pointer">
                  Edit Package
                </button>
              </Link>
              <button
                onClick={() => setViewData(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-[12px] font-semibold text-slate-700 transition-all hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}