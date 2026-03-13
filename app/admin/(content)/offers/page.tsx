'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  Plus, Search, MoreHorizontal, Eye,
  Pencil, Trash2, Power, X, Loader2, AlertTriangle,
  Megaphone, MessageCircle, Type, Star,
  LayoutGrid, Sparkles, Zap, Globe,
} from 'lucide-react';
import { toast } from 'sonner';

// ══════════════════════════════════════════
// Types
// ══════════════════════════════════════════

interface Offer {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  whatsappMessage: string;
  isLarge: boolean;
  isActive: boolean;
}

// ══════════════════════════════════════════
// Stat Card
// ══════════════════════════════════════════

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: any;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/60">
      <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-[0.07] ${accent}`} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
          <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Table Skeleton
// ══════════════════════════════════════════

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-50">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
          <div className="flex items-center gap-3 flex-[2]">
            <div className="h-11 w-16 rounded-xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3.5 w-32 rounded-md bg-slate-100" />
              <div className="h-3 w-16 rounded-md bg-slate-100/70" />
            </div>
          </div>
          <div className="flex-1">
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="flex-[1.5]">
            <div className="h-3.5 w-36 rounded-md bg-slate-100" />
          </div>
          <div className="flex-[0.8]">
            <div className="h-6 w-16 rounded-full bg-slate-100" />
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

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [viewData, setViewData] = useState<Offer | null>(null);
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
  const fetchOffers = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/offers');
      if (data.success) setOffers(data.data);
    } catch {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // ── Handlers ──
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { data } = await axios.patch(`/api/dashboard/offers/${id}`, {
        isActive: !currentStatus,
      });
      if (data.success) {
        toast.success(currentStatus ? 'Offer hidden' : 'Offer published');
        fetchOffers();
        setOpenMenuId(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Status update failed');
    }
  };

  const handleToggleHighlight = async (offer: Offer) => {
    try {
      const { data } = await axios.put(`/api/dashboard/offers/${offer._id}`, {
        ...offer,
        isLarge: !offer.isLarge,
      });
      if (data.success) {
        toast.success(offer.isLarge ? 'Highlight removed' : 'Offer highlighted');
        fetchOffers();
        setOpenMenuId(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Highlight update failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/dashboard/offers/${deleteId}`);
      setOffers((prev) => prev.filter((item) => item._id !== deleteId));
      toast.success('Offer deleted successfully');
      setDeleteId(null);
      setOpenMenuId(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Delete failed');
    }
  };

  // ── Filter ──
  const filteredOffers = useMemo(() => {
    return offers.filter((item) => {
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? item.isActive
          : !item.isActive;
      return matchSearch && matchStatus;
    });
  }, [offers, searchQuery, statusFilter]);

  // ── Stats ──
  const totalOffers = offers.length;
  const activeCount = useMemo(() => offers.filter((o) => o.isActive).length, [offers]);
  const hiddenCount = useMemo(() => offers.filter((o) => !o.isActive).length, [offers]);
  const featuredCount = useMemo(() => offers.filter((o) => o.isLarge).length, [offers]);

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
              <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Marketing · Offers
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Offers & Campaigns
            </h1>
            <p className="text-sm text-slate-500 max-w-lg">
              Create promotional offers, manage featured campaigns and track engagement.
            </p>
          </div>

          <Link href="/admin/offers/create">
            <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-300/30 transition-all hover:bg-slate-800 active:scale-[0.97] cursor-pointer">
              <Plus size={16} />
              Add Offer
            </button>
          </Link>
        </div>

        {/* ─── STAT CARDS ─── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Offers"
            value={totalOffers}
            icon={Megaphone}
            accent="bg-blue-500"
          />
          <StatCard
            label="Active"
            value={activeCount}
            icon={Zap}
            accent="bg-emerald-500"
            subtitle="Currently visible to users"
          />
          <StatCard
            label="Hidden"
            value={hiddenCount}
            icon={Power}
            accent="bg-slate-500"
            subtitle="Draft or unpublished"
          />
          <StatCard
            label="Featured"
            value={featuredCount}
            icon={Sparkles}
            accent="bg-violet-500"
            subtitle="Highlighted campaigns"
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
              placeholder="Search offers by title…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100/80 p-1">
            {(['all', 'active', 'hidden'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3.5 py-1.5 text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                {s}
              </button>
            ))}
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
              <h2 className="text-sm font-semibold text-slate-900">All Offers</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">{filteredOffers.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalOffers}</span> offers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeCount} Live
              </span>
              {featuredCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200/60">
                  <Sparkles size={10} />
                  {featuredCount} Featured
                </span>
              )}
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
                      Offer
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Type
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      WhatsApp Message
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
                  {filteredOffers.length > 0 ? (
                    filteredOffers.map((item) => (
                      <tr
                        key={item._id}
                        className={`group transition-colors duration-150 ${
                          item.isLarge ? 'hover:bg-violet-50/30 bg-violet-50/10' : 'hover:bg-blue-50/30'
                        }`}
                      >
                        {/* ── Offer ── */}
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200/80 shadow-sm ring-1 ring-slate-100">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              {/* Featured star overlay */}
                              {item.isLarge && (
                                <div className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 shadow-sm">
                                  <Sparkles size={8} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-900 truncate max-w-[200px]">
                                {item.title}
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                ID: {item._id.slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ── Type ── */}
                        <td className="px-5 py-4 align-top">
                          {item.isLarge ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200/60">
                              <Sparkles size={10} />
                              Featured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200/60">
                              <Megaphone size={10} />
                              Standard
                            </span>
                          )}
                        </td>

                        {/* ── WhatsApp Message ── */}
                        <td className="px-5 py-4 align-top max-w-[220px]">
                          <div className="flex items-start gap-2">
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-500 mt-0.5">
                              <MessageCircle size={12} />
                            </div>
                            <p
                              className="text-[12px] text-slate-600 line-clamp-2 leading-relaxed"
                              title={item.whatsappMessage}
                            >
                              {item.whatsappMessage}
                            </p>
                          </div>
                        </td>

                        {/* ── Status ── */}
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                              item.isActive
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
                                : 'bg-slate-50 text-slate-500 ring-slate-200/60'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {item.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>

                        {/* ── Actions ── */}
                        <td className="px-5 py-4 text-right align-top relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === item._id ? null : item._id);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 cursor-pointer ml-auto"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {/* Dropdown */}
                          {openMenuId === item._id && (
                            <div
                              ref={menuRef}
                              className="absolute right-5 top-14 z-50 w-52 overflow-hidden rounded-xl border border-slate-200/70 bg-white p-1.5 shadow-2xl shadow-slate-300/30 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                            >
                              <button
                                onClick={() => {
                                  setViewData(item);
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
                                href={`/admin/offers/edit?id=${item._id}`}
                                onClick={() => setOpenMenuId(null)}
                              >
                                <div className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                    <Pencil size={13} />
                                  </div>
                                  Edit Offer
                                </div>
                              </Link>

                              <button
                                onClick={() => handleToggleHighlight(item)}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-violet-50 hover:text-violet-700 cursor-pointer"
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-violet-500">
                                  <Sparkles size={13} />
                                </div>
                                {item.isLarge ? 'Remove Highlight' : 'Highlight Offer'}
                              </button>

                              <button
                                onClick={() => handleToggleStatus(item._id, item.isActive)}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-amber-50 hover:text-amber-700 cursor-pointer"
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-500">
                                  <Power size={13} />
                                </div>
                                {item.isActive ? 'Unpublish' : 'Publish'}
                              </button>

                              <div className="my-1 h-px bg-slate-100" />

                              <button
                                onClick={() => {
                                  setDeleteId(item._id);
                                  setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-500">
                                  <Trash2 size={13} />
                                </div>
                                Delete Offer
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-20 text-center">
                        <div className="mx-auto flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <Megaphone className="h-6 w-6 text-slate-300" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">No offers found</p>
                          <p className="text-xs text-slate-500">
                            Try adjusting your search or filter criteria
                          </p>
                          {(searchQuery || statusFilter !== 'all') && (
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
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

          {/* Bottom Bar */}
          {!loading && filteredOffers.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-[11px] text-slate-400">
                {filteredOffers.length} offer{filteredOffers.length !== 1 ? 's' : ''} displayed
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <LayoutGrid size={11} />
                <span>Campaigns synced</span>
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
            {/* Decorative */}
            <div className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 px-6 pt-8 pb-6">
              <div className="absolute top-4 right-6 h-20 w-20 rounded-full bg-rose-200/30 blur-2xl" />
              <div className="absolute bottom-2 left-8 h-14 w-14 rounded-full bg-pink-200/40 blur-xl" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-rose-200/40 ring-1 ring-rose-100/60">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
                  Delete Offer?
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                  This will permanently remove this offer from your campaigns. This{' '}
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
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

              {/* Close */}
              <button
                onClick={() => setViewData(null)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm text-slate-600 transition-all hover:bg-white hover:text-slate-900 cursor-pointer shadow-sm"
              >
                <X size={16} />
              </button>

              {/* Overlay Info */}
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm ring-1 ${
                      viewData.isActive
                        ? 'bg-emerald-500/20 text-emerald-100 ring-emerald-400/30'
                        : 'bg-white/20 text-white ring-white/20'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        viewData.isActive ? 'bg-emerald-400' : 'bg-white/60'
                      }`}
                    />
                    {viewData.isActive ? 'Active' : 'Hidden'}
                  </span>

                  {viewData.isLarge && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/20 px-2.5 py-1 text-[10px] font-bold text-violet-100 ring-1 ring-violet-400/30 backdrop-blur-sm">
                      <Sparkles size={10} />
                      Featured
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm">
                  {viewData.title}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* WhatsApp Message Card */}
              <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-emerald-50/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <MessageCircle size={14} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                    WhatsApp Auto-Reply
                  </p>
                </div>
                <p className="text-[13px] font-medium text-emerald-900 italic leading-relaxed">
                  &ldquo;{viewData.whatsappMessage}&rdquo;
                </p>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2 flex items-center gap-1.5">
                  <Type size={12} />
                  Description
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {viewData.description || 'No description provided.'}
                </p>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50 to-white p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">
                    Display Type
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {viewData.isLarge ? 'Large / Featured' : 'Standard'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50 to-white p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">
                    Slug
                  </p>
                  <p className="text-sm font-mono font-medium text-slate-700 truncate">
                    {viewData.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex-shrink-0">
              <Link href={`/admin/offers/edit?id=${viewData._id}`} className="flex-1">
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-slate-300/30 transition-all hover:bg-slate-800 active:scale-[0.97] cursor-pointer">
                  <Pencil size={13} />
                  Edit Offer
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