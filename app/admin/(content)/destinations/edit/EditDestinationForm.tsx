// app/admin/destinations/edit/EditDestinationForm.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  X,
  Image as ImageIcon,
  MapPin,
  Globe,
  Star,
  Calendar,
  DollarSign,
  Languages,
  ArrowLeft,
  Layers,
  Loader2,
  MessageCircle,
  Eye,
  EyeOff,
  Plus,
  ImagePlus,
  Info,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DestinationformSchema,
  DestinationFormValues,
} from '../../validation/destination';
import { generatedSlug } from '../../utils/main';

// ─── Helpers ───
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const PLACEHOLDER_IMAGE = '/placeholder.jpg';

const formatLastSaved = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function EditDestinationForm() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ useSearchParams is now safe — parent has Suspense
  const destinationId = searchParams.get('id') as string | undefined;

  const [attractions, setAttractions] = useState<string[]>([]);
  const [attractionInput, setAttractionInput] = useState('');

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryInput, setGalleryInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<DestinationFormValues>({
    resolver: zodResolver(DestinationformSchema),
    defaultValues: {
      rating: 5.0,
      reviews: 0,
      isActive: true,
      attractions: [],
      gallery: [],
    },
  });

  const nameValue = watch('name');
  const imageValue = watch('image');
  const isActive = watch('isActive');
  const slugValue = watch('slug');

  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);

  // ─── Fetch Destination ───
  const fetchDestination = useCallback(async () => {
    if (!destinationId) {
      setFetching(false);
      setFetchError(true);
      toast.error('Destination ID not found in URL.');
      return;
    }

    setFetching(true);
    setFetchError(false);

    try {
      const response = await axios.get(
        `/api/dashboard/destinations/${destinationId}`,
        { timeout: 15000 }
      );

      const dest =
        response.data?.data ||
        response.data?.destination ||
        response.data?.result ||
        response.data;

      if (!dest || typeof dest !== 'object' || !dest.name) {
        throw new Error('Invalid or empty response from server.');
      }

      reset({
        name: dest.name || '',
        slug: dest.slug || '',
        country: dest.country || '',
        description: dest.description || '',
        image: dest.image || '',
        rating: dest.rating ?? 5.0,
        reviews: dest.reviews ?? 0,
        isActive: dest.isActive ?? true,
        bestTime: dest.bestTime || '',
        currency: dest.currency || '',
        language: dest.language || '',
        attractions: dest.attractions || [],
        gallery: dest.gallery || [],
      });

      setAttractions(dest.attractions || []);
      setGalleryImages(dest.gallery || []);
      setLastSaved(new Date(dest.updatedAt || dest.createdAt || Date.now()));
      setFetchError(false);
    } catch (error: any) {
      setFetchError(true);

      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Server is not responding.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Check your internet connection.');
      } else if (error.response?.status === 404) {
        toast.error('Destination not found. It may have been deleted.');
      } else if (error.response?.status === 401) {
        toast.error('Unauthorized. Please log in again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            'Failed to load destination data.'
        );
      }
    } finally {
      setFetching(false);
    }
  }, [destinationId, reset]);

  useEffect(() => {
    fetchDestination();
  }, [fetchDestination]);

  // Auto slug
  useEffect(() => {
    if (nameValue) {
      setValue('slug', generatedSlug(nameValue), { shouldDirty: true });
    }
  }, [nameValue, setValue]);

  // ─── Attractions ───
  const addAttraction = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && attractionInput.trim()) {
      e.preventDefault();
      const trimmed = attractionInput.trim();
      if (!attractions.includes(trimmed)) {
        const next = [...attractions, trimmed];
        setAttractions(next);
        setValue('attractions', next, { shouldDirty: true });
        setHasChanges(true);
      } else {
        toast.error('This attraction already exists.');
      }
      setAttractionInput('');
    }
  };

  const removeAttraction = (tag: string) => {
    const next = attractions.filter((t) => t !== tag);
    setAttractions(next);
    setValue('attractions', next, { shouldDirty: true });
    setHasChanges(true);
  };

  // ─── Gallery ───
  const addGalleryImage = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const trimmed = galleryInput.trim();
    if (!trimmed) return;

    if (!isValidUrl(trimmed)) {
      toast.error('Please enter a valid image URL.');
      return;
    }
    if (galleryImages.includes(trimmed)) {
      toast.error('This image URL already exists in the gallery.');
      setGalleryInput('');
      return;
    }

    const next = [...galleryImages, trimmed];
    setGalleryImages(next);
    setValue('gallery', next, { shouldDirty: true });
    setGalleryInput('');
    setHasChanges(true);
  };

  const removeGalleryImage = (index: number) => {
    const next = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(next);
    setValue('gallery', next, { shouldDirty: true });
    setHasChanges(true);
  };

  // ─── Submit ───
  const onSubmit = async (data: DestinationFormValues) => {
    if (!destinationId) {
      toast.error('Cannot update: Destination ID is missing.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `/api/dashboard/destinations/${destinationId}`,
        data,
        { timeout: 15000 }
      );

      if (response.status === 200 || response.data?.success) {
        toast.success('Destination updated successfully!');
        setLastSaved(new Date());
        setHasChanges(false);
        await fetchDestination();
      } else {
        toast.error(response.data?.message || 'Update failed.');
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out while saving.');
      } else {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            'Something went wrong. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
    e.currentTarget.classList.add('opacity-50');
  };

  // ─── Input classes ───
  const inputBase =
    'w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none';
  const inputWithIcon = cn(inputBase, 'pl-10');
  const smallInput =
    'w-full h-10 px-3 pl-9 text-[13px] rounded-xl border border-gray-200 bg-gray-50/50 placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none';

  // ═══════════════════ FETCHING STATE ═══════════════════
  if (fetching) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200/70 bg-white p-8 shadow-2xl shadow-gray-200">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Globe className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-bold text-gray-900">Loading Destination</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Fetching data, please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════ ERROR STATE ═══════════════════
  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-gray-200/70 bg-white p-10 shadow-2xl shadow-gray-100 max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-rose-500" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-gray-900">Failed to Load</h2>
            <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">
              We couldn&apos;t load the destination data. This might be a
              network issue or the destination may have been deleted.
            </p>
            <p className="text-[10px] text-gray-400 mt-2 font-mono bg-gray-50 rounded-lg px-3 py-1.5">
              ID: {destinationId || 'not found in URL'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-10 flex-1 cursor-pointer rounded-xl border-gray-200 text-[13px] font-semibold text-gray-500"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Go Back
            </Button>
            <Button
              type="button"
              onClick={fetchDestination}
              className="h-10 flex-1 cursor-pointer rounded-xl bg-gray-900 text-[13px] font-bold text-white"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════ MAIN FORM ═══════════════════
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* ─── Unsaved Changes Banner ─── */}
      {hasChanges && (
        <div className="sticky top-0 z-40 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
              </div>
              <p className="text-[12px] font-semibold text-amber-800">
                You have unsaved changes
              </p>
            </div>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="h-7 cursor-pointer rounded-lg bg-amber-600 px-3 text-[11px] font-bold text-white hover:bg-amber-700"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Save Now
                </>
              )}
            </Button>
          </div>
        </div>
      )}

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
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-gray-100">
                    <Pencil className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Edit Destination
                  </span>
                  {hasChanges && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 ring-1 ring-amber-200">
                      <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                      UNSAVED
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
                  {nameValue || 'Edit Destination'}
                </h1>
                <div className="flex items-center gap-3">
                  <p className="text-[13px] text-gray-500">
                    Update destination details and settings.
                  </p>
                  {lastSaved && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      Saved {formatLastSaved(lastSaved)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-10 cursor-pointer rounded-xl border-gray-200 px-5 text-[13px] font-semibold text-gray-500"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={fetchDestination}
                disabled={fetching}
                className="h-10 cursor-pointer rounded-xl border-gray-200 px-4 text-[13px] font-semibold text-gray-500"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', fetching && 'animate-spin')} />
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 text-[13px] font-bold text-white"
              >
                {loading ? (
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
            {/* ──── Core Details ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-2xl shadow-gray-100">
                  <Globe className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Core Details</h3>
                  <p className="text-[11px] text-gray-400">Name, country and description</p>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <input type="hidden" {...register('slug')} />

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">
                      Destination Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                      <input {...register('name')} placeholder="e.g. Kyoto" className={inputWithIcon} />
                    </div>
                    {nameValue && slugValue && (
                      <p className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Info className="h-3 w-3" />
                        Slug:{' '}
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-500">
                          {slugValue}
                        </span>
                      </p>
                    )}
                    {errors.name && (
                      <p className="text-[11px] font-medium text-rose-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">
                      Country <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                      <input {...register('country')} placeholder="e.g. Japan" className={inputWithIcon} />
                    </div>
                    {errors.country && (
                      <p className="text-[11px] font-medium text-rose-500">{errors.country.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">
                    Description <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    {...register('description')}
                    rows={5}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-[13px] leading-relaxed placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none resize-none"
                    placeholder="Tell your customers why they should visit here..."
                  />
                  {errors.description && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ──── Attractions ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-2xl shadow-gray-100">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">Attractions</h3>
                    <p className="text-[11px] text-gray-400">Points of interest at this destination</p>
                  </div>
                </div>
                {attractions.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600 tabular-nums">
                    {attractions.length}
                  </span>
                )}
              </div>

              <div className="p-6">
                <div className="relative mb-4">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                  <input
                    value={attractionInput}
                    onChange={(e) => setAttractionInput(e.target.value)}
                    onKeyDown={addAttraction}
                    placeholder="Type an attraction and press Enter"
                    className={inputWithIcon}
                  />
                </div>

                {attractions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {attractions.map((tag, i) => (
                      <span
                        key={i}
                        className="group inline-flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-1.5 text-[12px] font-semibold text-violet-700 transition-all hover:bg-violet-100"
                      >
                        <MapPin className="h-3 w-3 text-violet-400" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeAttraction(tag)}
                          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-violet-400 hover:bg-violet-200 hover:text-violet-700 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200/70 py-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                      <MapPin className="h-4 w-4 text-gray-300" />
                    </div>
                    <p className="text-[12px] font-medium text-gray-400">No attractions added yet</p>
                    <p className="text-[10px] text-gray-300">Type above and press Enter to add</p>
                  </div>
                )}
              </div>
            </div>

            {/* ──── Photo Gallery ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-600 shadow-2xl shadow-gray-100">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">Photo Gallery</h3>
                    <p className="text-[11px] text-gray-400">Additional images for this destination</p>
                  </div>
                </div>
                {galleryImages.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-bold text-pink-600 tabular-nums">
                    {galleryImages.length} photos
                  </span>
                )}
              </div>

              <div className="space-y-4 p-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                    <input
                      value={galleryInput}
                      onChange={(e) => setGalleryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addGalleryImage(e);
                      }}
                      placeholder="Paste image URL here..."
                      className={inputWithIcon}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addGalleryImage}
                    disabled={!galleryInput.trim()}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gray-900 px-4 text-[12px] font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>

                {galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {galleryImages.map((url, index) => (
                      <div
                        key={index}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200/70 bg-gray-50 shadow-2xl shadow-gray-100 transition-all hover:shadow-md"
                      >
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          onError={handleImageError}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm opacity-0 hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1.5 left-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm tabular-nums">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-200/70 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                      <ImagePlus className="h-5 w-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-400">No photos yet</p>
                      <p className="text-[10px] text-gray-300">Paste image URLs above to build a gallery</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
          <div className="space-y-6">
            {/* ──── Status ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl shadow-2xl shadow-gray-100',
                    isActive ? 'bg-emerald-600' : 'bg-gray-400'
                  )}
                >
                  {isActive ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Visibility</h3>
                  <p className="text-[11px] text-gray-400">Control publishing status</p>
                </div>
              </div>

              <div className="p-6">
                <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-200/70 bg-gray-50/30 p-4 transition-all hover:border-gray-200 hover:bg-white">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                        isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-700">
                        {isActive ? 'Published' : 'Draft'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {isActive ? 'Visible on website' : 'Hidden from visitors'}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <input type="checkbox" {...register('isActive')} className="peer sr-only" />
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
                    <span className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-gray-400')} />
                    {isActive ? 'ACTIVE' : 'DRAFT'}
                  </span>
                </div>
              </div>
            </div>

            {/* ──── Social Proof ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 shadow-2xl shadow-gray-100">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Social Proof</h3>
                  <p className="text-[11px] text-gray-400">Rating and review count</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Rating</label>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 fill-amber-400 text-amber-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      {...register('rating', { valueAsNumber: true })}
                      className={smallInput}
                    />
                  </div>
                  {errors.rating && (
                    <p className="text-[10px] font-medium text-rose-500">{errors.rating.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Reviews</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
                    <input
                      type="number"
                      min="0"
                      {...register('reviews', { valueAsNumber: true })}
                      className={smallInput}
                    />
                  </div>
                  {errors.reviews && (
                    <p className="text-[10px] font-medium text-rose-500">{errors.reviews.message}</p>
                  )}
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
                  <h3 className="text-[15px] font-bold text-gray-900">Cover Image</h3>
                  <p className="text-[11px] text-gray-400">Main thumbnail photo</p>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-gray-200/70 bg-gray-50">
                  {imageValue ? (
                    <div className="group relative h-full w-full">
                      <img
                        src={imageValue}
                        alt="Cover"
                        onError={handleImageError}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute bottom-3 left-3">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                            <ImageIcon className="h-3 w-3" />
                            Cover Preview
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setValue('image', '', { shouldDirty: true })}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm opacity-0 hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 cursor-pointer"
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
                        <p className="text-[12px] font-semibold text-gray-400">No image yet</p>
                        <p className="text-[10px] text-gray-300">Enter URL below to preview</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Image URL <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                    <input {...register('image')} placeholder="https://example.com/photo.jpg" className={inputWithIcon} />
                  </div>
                  {errors.image && (
                    <p className="text-[10px] font-medium text-rose-500">{errors.image.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ──── Trip Details ──── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 shadow-2xl shadow-gray-100">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Trip Details</h3>
                  <p className="text-[11px] text-gray-400">Timing, currency and language</p>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Best Time <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
                    <input {...register('bestTime')} placeholder="e.g. March - May" className={smallInput} />
                  </div>
                  {errors.bestTime && (
                    <p className="text-[10px] font-medium text-rose-500">{errors.bestTime.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Currency <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
                      <input {...register('currency')} placeholder="USD" className={smallInput} />
                    </div>
                    {errors.currency && (
                      <p className="text-[10px] font-medium text-rose-500">{errors.currency.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Language <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Languages className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
                      <input {...register('language')} placeholder="EN" className={smallInput} />
                    </div>
                    {errors.language && (
                      <p className="text-[10px] font-medium text-rose-500">{errors.language.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ──── Sticky Desktop Submit ──── */}
            <div className="sticky top-6 hidden lg:block">
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-[13px] font-bold text-white"
                >
                  {loading ? (
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

                {lastSaved && (
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>Last saved {formatLastSaved(lastSaved)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}