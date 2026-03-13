'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Plus,
  Save,
  Image as ImageIcon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Tag,
  MapPin,
  DollarSign,
  FileText,
  ListChecks,
  FolderOpen,
  ImagePlus,
  X,
  Info,
  Package,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import axios from 'axios';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { PackageFormValues, packageSchema } from '../../validation/package';
import { PACKAGE_LIMITS } from '@/app/admin/helper/constant';

// ═══════════════════ ENTRY ═══════════════════
export default function EditPackagePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EditForm />
    </Suspense>
  );
}

// ═══════════════════ FORM ═══════════════════
function EditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('id');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: {
      title: '',
      price: 0,
      category: '',
      location: '',
      imageUrl: '',
      description: '',
      included: [{ value: '' }],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    name: 'included',
    control: form.control,
  });

  // Fetch existing data
  useEffect(() => {
    if (!packageId) {
      toast.error('Invalid Package ID');
      router.push('/admin/packages');
      return;
    }

    async function fetchPackageData() {
      try {
        const data = await axios.get(`/api/dashboard/packages/${packageId}`);

        if (data.status === 200 && data.data) {
          const pkg = data.data.data;

          const formattedIncluded =
            pkg.included && pkg.included.length > 0
              ? pkg.included.map((item: string) => ({ value: item }))
              : [{ value: '' }];

          form.reset({
            title: pkg.title,
            price: pkg.price,
            category: pkg.category,
            location: pkg.location,
            imageUrl: pkg.image,
            description: pkg.description,
            included: formattedIncluded,
          });
        } else {
          toast.error('Package not found');
          router.push('/admin/packages');
        }
      } catch {
        toast.error('Error loading package details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPackageData();
  }, [packageId, form, router]);

  const watchedTitle = form.watch('title');
  const watchedDesc = form.watch('description');
  const watchedImage = form.watch('imageUrl');
  const watchedCategory = form.watch('category');

  const titleLength = watchedTitle?.length || 0;
  const descLength = watchedDesc?.length || 0;

  // Submit (UPDATE)
  const onSubmit = async (data: PackageFormValues) => {
    if (!packageId) return;
    setIsSubmitting(true);

    try {
      const apiPayload = {
        ...data,
        included: data.included,
      };

      const response = await fetch(`/api/dashboard/packages/${packageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          form.setError('title', { message: 'This title is already taken' });
          toast.error('Duplicate Title');
        } else {
          toast.error(result.message || 'Update failed');
        }
        return;
      }

      toast.success('Package Updated!', {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      });
      router.push('/admin/packages');
      router.refresh();
    } catch {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  if (!packageId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] gap-4">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
            <AlertCircle className="h-6 w-6 text-rose-500" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[15px] font-bold text-gray-900">
            Invalid Package ID
          </p>
          <p className="text-[12px] text-gray-400">
            No package ID was provided in the URL.
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/packages')}
          variant="outline"
          className="mt-2 h-9 rounded-xl border-gray-200 px-5 text-[12px] font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to Packages
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6 lg:px-8">
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/packages"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:border-gray-300 active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-2xl shadow-gray-100">
                    <Pencil className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Edit Mode
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
                  Edit Package
                </h1>
                <p className="text-[13px] text-gray-500">
                  {watchedTitle ? (
                    <>
                      Updating{' '}
                      <span className="font-semibold text-gray-700">
                        {watchedTitle}
                      </span>
                    </>
                  ) : (
                    'Modify package details and settings.'
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
                Discard
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
                className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
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

        {/* ═══════════════════ FORM ═══════════════════ */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              {/* ═══════════════ LEFT COLUMN ═══════════════ */}
              <div className="space-y-6">
                {/* ──── Package Details ──── */}
                <Card className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                  <CardHeader className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 shadow-2xl shadow-gray-100">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-[15px] font-bold text-gray-900">
                          Package Details
                        </CardTitle>
                        <CardDescription className="text-[11px] text-gray-400">
                          Core information, location and pricing
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 p-6">
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-[13px] font-semibold text-gray-700">
                              Package Title{' '}
                              <span className="text-rose-400">*</span>
                            </FormLabel>
                            <span
                              className={cn(
                                'text-[10px] font-bold tabular-nums transition-colors',
                                titleLength > 100
                                  ? 'text-rose-500'
                                  : titleLength > 80
                                    ? 'text-amber-500'
                                    : 'text-gray-300'
                              )}
                            >
                              {titleLength}/100
                            </span>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                              <Input
                                className="h-11 rounded-xl pl-10 bg-gray-50/50 border-gray-200 text-[13px] font-medium placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all"
                                placeholder="e.g. Premium Umrah Package 2025"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[11px] font-medium" />
                        </FormItem>
                      )}
                    />

                    {/* Price + Location */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[13px] font-semibold text-gray-700">
                              Price <span className="text-rose-400">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                                <Input
                                  type="number"
                                  className="h-11 rounded-xl pl-10 bg-gray-50/50 border-gray-200 text-[13px] font-semibold placeholder:text-gray-300 placeholder:font-normal focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.valueAsNumber)
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[11px] font-medium" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[13px] font-semibold text-gray-700">
                              Location{' '}
                              <span className="text-rose-400">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                                <Input
                                  className="h-11 rounded-xl pl-10 bg-gray-50/50 border-gray-200 text-[13px] placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all"
                                  placeholder="e.g. Makkah & Madinah"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[11px] font-medium" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-[13px] font-semibold text-gray-700">
                              Description{' '}
                              <span className="text-rose-400">*</span>
                            </FormLabel>
                            <span
                              className={cn(
                                'text-[10px] font-bold tabular-nums transition-colors',
                                descLength > 3000
                                  ? 'text-rose-500'
                                  : descLength > 2500
                                    ? 'text-amber-500'
                                    : 'text-gray-300'
                              )}
                            >
                              {descLength}/3000
                            </span>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed itinerary, hotel details, schedule..."
                              className="min-h-[200px] rounded-xl bg-gray-50/50 border-gray-200 text-[13px] leading-relaxed placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 resize-y transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="flex items-center gap-1.5 text-[10px] text-gray-400">
                            <Info className="h-3 w-3" />
                            Supports Markdown formatting for rich content
                          </FormDescription>
                          <FormMessage className="text-[11px] font-medium" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* ──── Included Services ──── */}
                <Card className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                  <CardHeader className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-2xl shadow-gray-100">
                          <ListChecks className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-[15px] font-bold text-gray-900">
                            Included Services
                          </CardTitle>
                          <CardDescription className="text-[11px] text-gray-400">
                            Features and amenities in this package
                          </CardDescription>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tabular-nums',
                          fields.length >= 15
                            ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                            : fields.length > 0
                              ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                              : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                        )}
                      >
                        {fields.length}/15
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {fields.length > 0 ? (
                      <div className="space-y-2">
                        {fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="group flex items-center gap-1.5 rounded-xl border border-gray-200/70 bg-gray-50/30 p-1 pr-1.5 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm"
                          >
                            <FormField
                              control={form.control}
                              name={`included.${index}.value`}
                              render={({ field: inputField }) => (
                                <FormItem className="flex-1 space-y-0">
                                  <FormControl>
                                    <div className="flex items-center">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-gray-400 shadow-sm ring-1 ring-gray-100 ml-0.5">
                                        {index + 1}
                                      </div>
                                      <Input
                                        className="flex-1 border-0 bg-transparent shadow-none text-[13px] placeholder:text-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0"
                                        placeholder="e.g. 5-Star Hotel Accommodation"
                                        {...inputField}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage className="pl-10 text-[10px]" />
                                </FormItem>
                              )}
                            />
                            <button
                              type="button"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 cursor-pointer"
                              onClick={() => fields.length > 1 && remove(index)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-200/70 py-10 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
                          <ListChecks className="h-5 w-5 text-gray-300" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-gray-400">
                            No services added yet
                          </p>
                          <p className="text-[10px] text-gray-300">
                            Click the button below to add services
                          </p>
                        </div>
                      </div>
                    )}

                    {fields.length <
                    PACKAGE_LIMITS.INCLUDED_ITEMS.MAX_COUNT ? (
                      <button
                        type="button"
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-3 text-[12px] font-semibold text-gray-400 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 active:scale-[0.99] cursor-pointer"
                        onClick={() => append({ value: '' })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Service
                      </button>
                    ) : (
                      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-2.5 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-200">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Maximum 15 services reached
                      </div>
                    )}

                    {form.formState.errors.included && (
                      <p className="mt-3 text-center text-[11px] font-medium text-rose-500">
                        {form.formState.errors.included.message ||
                          'Please add at least one service'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
              <div className="space-y-6">
                {/* ──── Category ──── */}
                <Card className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                  <CardHeader className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-2xl shadow-gray-100">
                        <FolderOpen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-[15px] font-bold text-gray-900">
                          Category
                        </CardTitle>
                        <CardDescription className="text-[11px] text-gray-400">
                          Organize your package type
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl bg-gray-50/50 border-gray-200 text-[13px] focus:ring-2 focus:ring-gray-900/5 transition-all">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px] rounded-xl border-gray-200 shadow-2xl shadow-gray-100">
                              <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">
                                  Pilgrimage
                                </SelectLabel>
                                <SelectItem value="Hajj">
                                  Hajj Package
                                </SelectItem>
                                <SelectItem value="Umrah">
                                  Umrah Package
                                </SelectItem>
                                <SelectItem value="Islamic Tour">
                                  Islamic Tour
                                </SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">
                                  Travel
                                </SelectLabel>
                                <SelectItem value="Holiday">
                                  Holiday / Vacation
                                </SelectItem>
                                <SelectItem value="Tour">
                                  Tour Package
                                </SelectItem>
                                <SelectItem value="Travels">Travels</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">
                                  Services
                                </SelectLabel>
                                <SelectItem value="Airlines">
                                  Airlines / Ticket
                                </SelectItem>
                                <SelectItem value="Hotel">
                                  Hotel Booking
                                </SelectItem>
                                <SelectItem value="Visa">
                                  Visa Service
                                </SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">
                                  Other
                                </SelectLabel>
                                <SelectItem value="Others">Others</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[11px] font-medium" />
                        </FormItem>
                      )}
                    />

                    {watchedCategory && (
                      <div className="mt-3 flex justify-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600 ring-1 ring-violet-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                          {watchedCategory}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ──── Cover Image ──── */}
                <Card className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                  <CardHeader className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 shadow-2xl shadow-gray-100">
                        <ImagePlus className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-[15px] font-bold text-gray-900">
                          Cover Image
                        </CardTitle>
                        <CardDescription className="text-[11px] text-gray-400">
                          Main package thumbnail
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    {/* Preview */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-gray-200/70 bg-gray-50">
                      {watchedImage && !imageError ? (
                        <div className="group relative h-full w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={watchedImage}
                            alt="Preview"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={() => setImageError(true)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                                <ImageIcon className="h-3 w-3" />
                                Cover Preview
                              </span>
                              {watchedCategory && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-violet-500/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                                  <Package className="h-3 w-3" />
                                  {watchedCategory}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              form.setValue('imageUrl', '');
                              setImageError(false);
                            }}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm opacity-0 backdrop-blur-sm transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2.5">
                          <div
                            className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-full',
                              imageError
                                ? 'bg-rose-50 text-rose-400'
                                : 'bg-white text-gray-300 shadow-2xl shadow-gray-100'
                            )}
                          >
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <div className="text-center">
                            <p
                              className={cn(
                                'text-[12px] font-semibold',
                                imageError ? 'text-rose-500' : 'text-gray-400'
                              )}
                            >
                              {imageError ? 'Invalid image URL' : 'No image yet'}
                            </p>
                            <p className="text-[10px] text-gray-300">
                              {imageError
                                ? 'Check the link and try again'
                                : 'Enter URL below to preview'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* URL Input */}
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Image URL <span className="text-rose-400">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                              <Input
                                className="h-11 rounded-xl pl-10 bg-gray-50/50 border-gray-200 text-[13px] placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all"
                                placeholder="https://example.com/image.jpg"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setImageError(false);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px] font-medium" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* ──── Sticky Actions ──── */}
                <div className="sticky top-6 hidden lg:block space-y-2.5">
                  <Button
                    type="submit"
                    className="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all duration-300 hover:from-amber-600 hover:to-amber-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-3.5 w-3.5" />
                        Save Changes
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full cursor-pointer rounded-xl border-gray-200 text-[13px] font-semibold text-gray-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => router.back()}
                  >
                    Discard Changes
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

// ═══════════════════ LOADING SKELETON ═══════════════════
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left */}
          <div className="space-y-6">
            {/* Details card */}
            <div className="rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-48 rounded" />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3 w-10 rounded" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-14 rounded" />
                    <Skeleton className="h-11 w-full rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-18 rounded" />
                    <Skeleton className="h-11 w-full rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3 w-14 rounded" />
                  </div>
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                  <Skeleton className="h-3 w-56 rounded" />
                </div>
              </div>
            </div>

            {/* Services card */}
            <div className="rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36 rounded" />
                      <Skeleton className="h-3 w-52 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
              </div>
              <div className="p-6 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
                <Skeleton className="mt-4 h-12 w-full rounded-xl border-2 border-dashed" />
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Category */}
            <div className="rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <Skeleton className="h-11 w-full rounded-xl" />
                <div className="flex justify-center">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}