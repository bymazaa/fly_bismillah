'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  X,
  Image as ImageIcon,
  Megaphone,
  MessageCircle,
  ArrowLeft,
  Loader2,
  Type,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  ImagePlus,
  Save,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { offerformSchema, offerFormValues } from '../../validation/offer';
import { generatedSlug } from '../../utils/main';

const PLACEHOLDER_IMAGE = '/placeholder.jpg';

function EditOfferFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<offerFormValues>({
    resolver: zodResolver(offerformSchema),
    defaultValues: {
      isLarge: false,
      isActive: true,
      whatsappMessage: '',
    },
  });

  const titleValue = watch('title');
  const imageValue = watch('image');
  const isLarge = watch('isLarge');
  const isActive = watch('isActive');
  const slugValue = watch('slug');

  // ─── Fetch existing data ───
  useEffect(() => {
    const fetchOffer = async () => {
      if (!offerId) return;
      try {
        const response = await axios.get(`/api/dashboard/offers/${offerId}`);
        if (response.data.success) {
          reset(response.data.data);
        }
      } catch (error) {
        toast.error('Failed to load offer details');
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [offerId, reset]);

  // ─── Auto slug ───
  useEffect(() => {
    if (titleValue) {
      setValue('slug', generatedSlug(titleValue));
    }
  }, [titleValue, setValue]);

  // ─── Submit ───
  const onSubmit = async (data: offerFormValues) => {
    if (!offerId) return;
    setSaving(true);
    try {
      const response = await axios.put(
        `/api/dashboard/offers/${offerId}`,
        data
      );
      if (response.data.success) {
        toast.success('Offer updated successfully!');
        router.push('/admin/offers');
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── Image error ───
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
    e.currentTarget.classList.add('opacity-50');
  };

  // ─── Reusable classes ───
  const inputBase =
    'w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none';
  const inputWithIcon = cn(inputBase, 'pl-10');

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] gap-4">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl shadow-orange-100">
            <Megaphone className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[13px] font-semibold text-gray-700">
            Loading offer...
          </p>
          <p className="text-[11px] text-gray-400">
            Fetching campaign details
          </p>
        </div>
      </div>
    );
  }

  // ─── Invalid ID state ───
  if (!offerId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
          <X className="h-6 w-6 text-rose-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[15px] font-bold text-gray-900">
            Invalid Offer ID
          </p>
          <p className="text-[12px] text-gray-400">
            No offer ID was provided in the URL.
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/offers')}
          variant="outline"
          className="mt-2 h-9 rounded-xl border-gray-200 px-5 text-[12px] font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to Offers
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24"
      >
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:border-gray-300 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl shadow-gray-100">
                    <Pencil className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Edit Offer
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
                  Update Offer
                </h1>
                <p className="text-[13px] text-gray-500">
                  {titleValue ? (
                    <>
                      Editing{' '}
                      <span className="font-semibold text-gray-700">
                        {titleValue}
                      </span>
                    </>
                  ) : (
                    'Modify campaign details and settings.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-10 cursor-pointer rounded-xl border-gray-200 px-5 text-[13px] font-semibold text-gray-500 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all hover:from-gray-900 hover:to-gray-950 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-3.5 w-3.5" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* ═══════════════════ CONTENT ═══════════════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* ═══════════════ LEFT COLUMN ═══════════════ */}
          <div className="space-y-6">
            {/* ──── Offer Details ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 shadow-2xl shadow-gray-100">
                  <Megaphone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Offer Details
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Title, description and messaging
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <input type="hidden" {...register('slug')} />

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">
                    Offer Title <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                    <input
                      {...register('title')}
                      placeholder="e.g. Special Hajj Discount 2026"
                      className={inputWithIcon}
                    />
                  </div>
                  {titleValue && slugValue && (
                    <p className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Info className="h-3 w-3" />
                      Slug:{' '}
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-500">
                        {slugValue}
                      </span>
                    </p>
                  )}
                  {errors.title && (
                    <p className="text-[11px] font-medium text-rose-500">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">
                    Description <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    {...register('description')}
                    rows={5}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-[13px] leading-relaxed placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none resize-none"
                    placeholder="Describe the offer details, what's included, terms & conditions..."
                  />
                  {errors.description && (
                    <p className="text-[11px] font-medium text-rose-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* WhatsApp Message */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">
                    WhatsApp Message <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                    <input
                      {...register('whatsappMessage')}
                      placeholder="Message sent when user clicks the offer"
                      className={inputWithIcon}
                    />
                  </div>
                  <p className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Info className="h-3 w-3" />
                    This message is auto-sent via WhatsApp when a user taps the
                    offer.
                  </p>
                  {errors.whatsappMessage && (
                    <p className="text-[11px] font-medium text-rose-500">
                      {errors.whatsappMessage.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
          <div className="space-y-6">
            {/* ──── Visibility ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl shadow-2xl shadow-gray-100',
                    isActive ? 'bg-emerald-600' : 'bg-gray-400'
                  )}
                >
                  {isActive ? (
                    <Eye className="h-4 w-4 text-white" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Visibility
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Control publishing status
                  </p>
                </div>
              </div>

              <div className="p-6">
                <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-200/70 bg-gray-50/30 p-4 transition-all hover:border-gray-200 hover:bg-white">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-700">
                        {isActive ? 'Published' : 'Draft'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {isActive
                          ? 'Visible on website'
                          : 'Hidden from visitors'}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register('isActive')}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-200 shadow-sm transition-colors after:absolute after:left-[3px] after:top-[3px] after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-5" />
                  </div>
                </label>

                <div className="mt-3 flex justify-center">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold',
                      isActive
                        ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                        : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isActive ? 'bg-emerald-500' : 'bg-gray-400'
                      )}
                    />
                    {isActive ? 'ACTIVE' : 'DRAFT'}
                  </span>
                </div>
              </div>
            </div>

            {/* ──── Display Layout ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl shadow-2xl shadow-gray-100',
                    isLarge ? 'bg-violet-600' : 'bg-gray-400'
                  )}
                >
                  {isLarge ? (
                    <Maximize2 className="h-4 w-4 text-white" />
                  ) : (
                    <Minimize2 className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Display Layout
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Choose card size on website
                  </p>
                </div>
              </div>

              <div className="p-6">
                <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-200/70 bg-gray-50/30 p-4 transition-all hover:border-gray-200 hover:bg-white">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                        isLarge
                          ? 'bg-violet-50 text-violet-600'
                          : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {isLarge ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-700">
                        {isLarge ? 'Large Banner' : 'Standard Card'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {isLarge
                          ? 'Full-width highlighted layout'
                          : 'Regular grid card layout'}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register('isLarge')}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-200 shadow-sm transition-colors after:absolute after:left-[3px] after:top-[3px] after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-violet-500 peer-checked:after:translate-x-5" />
                  </div>
                </label>

                <div className="mt-3 flex justify-center">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold',
                      isLarge
                        ? 'bg-violet-50 text-violet-600 ring-1 ring-violet-200'
                        : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isLarge ? 'bg-violet-500' : 'bg-gray-400'
                      )}
                    />
                    {isLarge ? 'LARGE' : 'STANDARD'}
                  </span>
                </div>
              </div>
            </div>

            {/* ──── Cover Image ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 shadow-2xl shadow-gray-100">
                  <ImagePlus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Cover Image
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Main visual for this offer
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-6">
                {/* Preview */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-gray-200/70 bg-gray-50">
                  {imageValue ? (
                    <div className="group relative h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageValue}
                        alt="Offer Cover"
                        onError={handleImageError}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                            <ImageIcon className="h-3 w-3" />
                            Cover Preview
                          </span>
                          {isLarge && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-500/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm uppercase">
                              <Maximize2 className="h-3 w-3" />
                              Large
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setValue('image', '')}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm opacity-0 backdrop-blur-sm transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-300 shadow-2xl shadow-gray-100">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-[12px] font-semibold text-gray-400">
                          No image yet
                        </p>
                        <p className="text-[10px] text-gray-300">
                          Enter URL below to preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* URL Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Image URL <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                    <input
                      {...register('image')}
                      placeholder="https://example.com/offer-banner.jpg"
                      className={inputWithIcon}
                    />
                  </div>
                  {errors.image && (
                    <p className="text-[10px] font-medium text-rose-500">
                      {errors.image.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ──── Sticky Desktop Submit ──── */}
            <div className="sticky top-6 hidden lg:block">
              <Button
                type="submit"
                disabled={saving}
                className="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all duration-300 hover:from-gray-900 hover:to-gray-950 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-3.5 w-3.5" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function EditOfferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] gap-4">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl shadow-orange-100">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[13px] font-semibold text-gray-700">
              Loading...
            </p>
            <p className="text-[11px] text-gray-400">Please wait</p>
          </div>
        </div>
      }
    >
      <EditOfferFormContent />
    </Suspense>
  );
}