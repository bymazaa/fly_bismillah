'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Tag,
  MapPin,
  DollarSign,
  FileText,
  ListChecks,
  FolderOpen,
  ImagePlus,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { PackageFormValues, packageSchema } from '../../validation/package';
import { PACKAGE_LIMITS } from '@/app/admin/helper/constant';

export default function CreatePackagePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      title: "",
      price: 0,
      category: "",
      location: "Makkah & Madinah",
      imageUrl: "",
      description: "",
      included: [{ value: "Round Trip Airfare" }, { value: "Hajj Visa & Insurance" }],
    },
    mode: "onChange",
  } as any);

  const { fields, append, remove } = useFieldArray({
    name: "included",
    control: form.control,
  });

  const watchedTitle = form.watch("title");
  const watchedDesc = form.watch("description");
  const watchedImage = form.watch("imageUrl");

  const onSubmit = async (data: PackageFormValues) => {
    setIsSubmitting(true);
    try {
      const apiPayload = {
        ...data,
        included: data.included.map(item => item.value),
      };

      const response = await fetch('/api/dashboard/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          form.setError("title", { message: "This title is already taken" });
          toast.error("Duplicate Title");
        } else {
          toast.error(result.error || "Failed to create package");
        }
        return;
      }

      toast.success("Package Published!", {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      });
      router.push('/admin/packages');
      router.refresh();

    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleLength = watchedTitle?.length || 0;
  const descLength = watchedDesc?.length || 0;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6">

        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link
              href="/admin/packages"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-2xl shadow-gray-200/70 transition-all hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:border-gray-300 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl shadow-gray-200/70">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  New Package
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
                Create Package
              </h1>
              <p className="text-[13px] text-gray-500">
                Design a new travel experience for your customers.
              </p>
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
                <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/70">
                  <CardHeader className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 shadow-2xl shadow-gray-200/70">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-[15px] font-bold text-gray-900">
                          Package Details
                        </CardTitle>
                        <CardDescription className="text-[11px] text-gray-400">
                          Core information and pricing
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
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-[13px] font-semibold text-gray-700">
                              Package Title
                            </FormLabel>
                            <span
                              className={`text-[10px] font-bold tabular-nums ${
                                titleLength > 100
                                  ? 'text-rose-500'
                                  : titleLength > 80
                                  ? 'text-amber-500'
                                  : 'text-gray-300'
                              }`}
                            >
                              {titleLength}/100
                            </span>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                              <Input
                                className="h-11 pl-10 bg-gray-50/50 border-gray-200 text-[15px] font-medium placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all"
                                placeholder="e.g. Premium Umrah Package 2025"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Price + Location */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px] font-semibold text-gray-700">
                              Price
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                                <Input
                                  type="number"
                                  className="h-11 pl-10 bg-gray-50/50 border-gray-200 font-semibold placeholder:text-gray-300 placeholder:font-normal focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px] font-semibold text-gray-700">
                              Location
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                                <Input
                                  className="h-11 pl-10 bg-gray-50/50 border-gray-200 placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all"
                                  placeholder="e.g. Makkah & Madinah"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-[13px] font-semibold text-gray-700">
                              Description
                            </FormLabel>
                            <span
                              className={`text-[10px] font-bold tabular-nums ${
                                descLength > 3000
                                  ? 'text-rose-500'
                                  : descLength > 2500
                                  ? 'text-amber-500'
                                  : 'text-gray-300'
                              }`}
                            >
                              {descLength}/3000
                            </span>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed itinerary, hotel details, schedule..."
                              className="min-h-[220px] bg-gray-50/50 border-gray-200 text-[13px] leading-relaxed placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 resize-y transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <AlertCircle className="h-3 w-3" />
                            Supports Markdown formatting
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* ──── Included Services ──── */}
                <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/70">
                  <CardHeader className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-2xl shadow-gray-200/70">
                          <ListChecks className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-[15px] font-bold text-gray-900">
                            Included Services
                          </CardTitle>
                          <CardDescription className="text-[11px] text-gray-400">
                            Features included in this package
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold tabular-nums px-2 py-0.5 ${
                          fields.length >= 15
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {fields.length}/15
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="space-y-2.5">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="group flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/30 p-1 pr-1.5 transition-all hover:border-gray-200 hover:bg-white hover:shadow-2xl shadow-gray-200/70"
                        >
                          <FormField
                            control={form.control}
                            name={`included.${index}.value`}
                            render={({ field: inputField }) => (
                              <FormItem className="flex-1 space-y-0">
                                <FormControl>
                                  <div className="flex items-center">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-gray-400 shadow-2xl shadow-gray-200/70 ring-1 ring-gray-100 ml-0.5">
                                      {index + 1}
                                    </div>
                                    <Input
                                      className="flex-1 border-0 bg-transparent shadow-none text-[13px] placeholder:text-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0"
                                      placeholder="Service name"
                                      {...inputField}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <button
                            type="button"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 cursor-pointer"
                            onClick={() => remove(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {fields.length < PACKAGE_LIMITS.INCLUDED_ITEMS.MAX_COUNT ? (
                      <button
                        type="button"
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-3 text-[12px] font-semibold text-gray-400 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 active:scale-[0.99] cursor-pointer"
                        onClick={() => append({ value: "" })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Service
                      </button>
                    ) : (
                      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-2.5 text-[11px] font-semibold text-amber-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Maximum 15 items reached
                      </div>
                    )}

                    {form.formState.errors.included && (
                      <p className="mt-3 text-center text-[12px] font-medium text-rose-500">
                        {form.formState.errors.included.message || "Please add at least one item"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
              <div className="space-y-6">

                {/* ──── Category ──── */}
                <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/70">
                  <CardHeader className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-2xl shadow-gray-200/70">
                        <FolderOpen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-[15px] font-bold text-gray-900">
                          Category
                        </CardTitle>
                        <CardDescription className="text-[11px] text-gray-400">
                          Organize your package
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200 text-[13px] focus:ring-2 focus:ring-gray-900/5">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px] rounded-xl border-gray-200 shadow-2xl shadow-gray-200/70">
                              <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Pilgrimage
                                </SelectLabel>
                                <SelectItem value="Hajj">Hajj Package</SelectItem>
                                <SelectItem value="Umrah">Umrah Package</SelectItem>
                                <SelectItem value="Islamic Tour">Islamic Tour</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Travel
                                </SelectLabel>
                                <SelectItem value="Holiday">Holiday / Vacation</SelectItem>
                                <SelectItem value="Tour">Tour Package</SelectItem>
                                <SelectItem value="Travels">Travels</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Services
                                </SelectLabel>
                                <SelectItem value="Airlines">Airlines / Ticket</SelectItem>
                                <SelectItem value="Hotel">Hotel Booking</SelectItem>
                                <SelectItem value="Visa">Visa Service</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Other
                                </SelectLabel>
                                <SelectItem value="Others">Others</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* ──── Cover Image ──── */}
                <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/70">
                  <CardHeader className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-2xl shadow-gray-200/70">
                        <ImagePlus className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-[15px] font-bold text-gray-900">
                          Cover Image
                        </CardTitle>
                        <CardDescription className="text-[11px] text-gray-400">
                          Package thumbnail
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                              <Input
                                className="h-11 pl-10 bg-gray-50/50 border-gray-200 text-[13px] placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all"
                                placeholder="https://example.com/image.jpg"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setImageError(false);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Image Preview */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      {watchedImage && !imageError ? (
                        <div className="group relative h-full w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={watchedImage}
                            alt="Preview"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={() => setImageError(true)}
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="absolute bottom-3 left-3">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                                <ImageIcon className="h-3 w-3" />
                                Cover Preview
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2.5">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full ${
                              imageError
                                ? 'bg-rose-50 text-rose-400'
                                : 'bg-white text-gray-300 shadow-2xl shadow-gray-200/70'
                            }`}
                          >
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <div className="text-center">
                            <p
                              className={`text-[12px] font-semibold ${
                                imageError ? 'text-rose-500' : 'text-gray-400'
                              }`}
                            >
                              {imageError ? 'Invalid URL' : 'No image yet'}
                            </p>
                            <p className="text-[10px] text-gray-300">
                              {imageError ? 'Check the link above' : 'Enter URL to preview'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ──── Sticky Actions ──── */}
                <div className="sticky top-6 space-y-2.5">
                  <Button
                    type="submit"
                    className="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-[13px] font-bold shadow-2xl shadow-gray-200/70 transition-all duration-300 hover:from-gray-900 hover:to-gray-950 hover:shadow-md active:scale-[0.98]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publishing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Publish Package
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full cursor-pointer rounded-xl border-gray-200 text-[13px] font-semibold text-gray-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => router.back()}
                  >
                    Discard
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