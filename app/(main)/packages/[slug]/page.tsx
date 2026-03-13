'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { websiteDetails } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  FaMapMarkerAlt,
  FaArrowLeft,
  FaShareAlt,
  FaCheckCircle,
  FaRegClock,
  FaUserFriends,
  FaPassport,
  FaWhatsapp,
  FaPlane,
  FaHotel,
  FaTimes,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaSadTear,
  FaExclamationTriangle,
  FaArrowRight,
  FaShieldAlt,
  FaPaperPlane,
} from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi2';

interface PackageType {
  _id: string;
  slug: string;
  title: string;
  price: number;
  category: string;
  location: string;
  image: string;
  description: string;
  included: string[];
}

const PackageDetails = () => {
  const { layout, button } = appTheme;
  const params = useParams();
  const router = useRouter();

  const [pkg, setPkg] = useState<PackageType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    travelDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    message: '',
  });

  const slug = typeof params?.slug === 'string' ? params.slug : '';

  useEffect(() => {
    const fetchPackageDetails = async () => {
      if (!slug) return;
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`/api/dashboard/packages/${slug}`);
        const data = response.data.data || [];
        if (!data) throw new Error('Package data is missing');
        setPkg(data);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message || 'Failed to load package details.';
        console.error('Error fetching package:', err);
        setError(errorMsg);
        setPkg(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackageDetails();
  }, [slug]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'adults') {
      const val = parseInt(value);
      if (val > 10) {
        toast.error('Maximum 10 adults allowed');
        finalValue = '10';
      } else if (val < 1) {
        finalValue = '1';
      }
    }
    if (name === 'children') {
      const val = parseInt(value);
      if (val > 8) {
        toast.error('Maximum 8 children allowed');
        finalValue = '8';
      } else if (val < 0) {
        finalValue = '0';
      }
    }
    if (name === 'message') {
      if (value.length > 200) {
        toast.error('Message cannot exceed 200 characters');
        finalValue = value.slice(0, 200);
      }
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const bookingPayload = {
      packageTitle: pkg?.title || '',
      packagePrice: pkg?.price || 0,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      travelDate: formData.travelDate,
      returnDate: formData.returnDate,
      guests: {
        adults: Number(formData.adults),
        children: Number(formData.children),
      },
      notes: formData.message,
    };

    try {
      const response = await axios.post(
        '/api/general/package-book',
        bookingPayload
      );
      if (response.data.success) {
        toast.success('Booking Request Sent Successfully! ✅');
        setIsModalOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          travelDate: '',
          returnDate: '',
          adults: 1,
          children: 0,
          message: '',
        });
      } else {
        toast.error(response.data.message || 'Failed to send request.');
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 'Something went wrong!';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  // Input classes
  const inputBase =
    'w-full h-12 px-4 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 text-sm font-medium outline-none transition-all duration-300';
  const inputFocus =
    'border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-[3px] focus:ring-gray-900/5';

  // ═══════════ Loading Skeleton ═══════════
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Nav skeleton */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4">
          <div className={`${layout.container} flex justify-between`}>
            <div className="h-5 w-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Hero skeleton */}
        <div className={`${layout.container} mt-6`}>
          <div className="w-full h-[420px] md:h-[520px] bg-gray-100 rounded-3xl animate-pulse" />
        </div>

        {/* Content skeleton */}
        <div
          className={`${layout.container} mt-10 grid grid-cols-1 lg:grid-cols-3 gap-12`}
        >
          <div className="lg:col-span-2 space-y-6">
            {/* Highlight pills */}
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 w-36 bg-gray-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-7 w-2/5 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-4 w-full bg-gray-50 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-50 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="h-64 bg-gray-50 rounded-3xl animate-pulse" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-[400px] bg-gray-100 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════ Error State ═══════════
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="text-3xl text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            {error}
          </p>
          <Button
            onClick={() => router.push('/packages')}
            variant="outline"
            className="rounded-xl px-6 h-11 font-semibold"
          >
            <FaArrowLeft className="mr-2 text-xs" /> Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════ Not Found State ═══════════
  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <FaSadTear className="text-3xl text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Package Not Found
          </h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            The package you're looking for may have been removed or is no
            longer available.
          </p>
          <Button
            onClick={() => router.push('/packages')}
            className={`${button.primary} rounded-xl px-6 h-11 font-semibold`}
          >
            Browse All Packages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white min-h-screen pb-24 relative">
      {/* ═══════════ 1. Top Navigation ═══════════ */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/60">
        <div
          className={`${layout.container} py-3.5 flex justify-between items-center`}
        >
          <Link
            href="/packages"
            className="inline-flex items-center gap-2.5 text-sm text-gray-500 hover:text-gray-900 font-semibold transition-colors group"
          >
            <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-900 group-hover:text-white flex items-center justify-center transition-all duration-300">
              <FaArrowLeft className="text-xs" />
            </span>
            <span className="hidden sm:inline">All Packages</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all duration-300"
            >
              <FaShareAlt className="text-[10px]" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ 2. Hero Section ═══════════ */}
      <div className={`${layout.container} mt-5`}>
        <div className="relative w-full h-[400px] md:h-[520px] rounded-3xl overflow-hidden group">
          <Image
            src={pkg.image || '/placeholder.jpg'}
            alt={pkg.title}
            fill
            quality={100}
            className="object-cover group-hover:scale-[1.03] transition-transform duration-[1.5s] ease-out"
            priority
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

          {/* Category badge top-left */}
          <div className="absolute top-5 left-5">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <HiOutlineSparkles className="text-xs" />
              {pkg.category}
            </span>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
            <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white mb-3 leading-[1.1] tracking-tight max-w-3xl">
              {pkg.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                <FaMapMarkerAlt className="text-rose-400 text-xs" />
                <span>{pkg.location}</span>
              </div>

              <span className="w-1 h-1 rounded-full bg-white/30" />

              <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                <FaPlane className="text-rose-400 text-xs" />
                <span>Flights Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ 3. Content Grid ═══════════ */}
      <div className={`${layout.container} mt-10`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14 relative">
          {/* ═══ LEFT CONTENT (2/3) ═══ */}
          <div className="lg:col-span-2 space-y-10">
            {/* Highlights */}
            <div className="flex flex-wrap gap-4">
              {[
                {
                  icon: <FaRegClock />,
                  label: 'Duration',
                  value: 'Flexible Days',
                  bg: 'bg-blue-50',
                  iconColor: 'text-blue-500',
                },
                {
                  icon: <FaUserFriends />,
                  label: 'Group Size',
                  value: 'Unlimited',
                  bg: 'bg-amber-50',
                  iconColor: 'text-amber-500',
                },
                {
                  icon: <FaPassport />,
                  label: 'Visa',
                  value: 'Included',
                  bg: 'bg-emerald-50',
                  iconColor: 'text-emerald-500',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 flex-1 min-w-[150px]"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center ${item.iconColor} text-lg`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="font-bold text-gray-900 text-sm">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <FaPlane className="text-white text-xs" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  About This Package
                </h3>
              </div>
              <p className="text-gray-600 text-[15px] leading-[1.8] whitespace-pre-line">
                {pkg.description}
              </p>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {[
                  { icon: <FaPlane />, label: 'Flights' },
                  { icon: <FaHotel />, label: 'Hotels' },
                  { icon: <FaShieldAlt />, label: 'Travel Insurance' },
                ].map((tag) => (
                  <span
                    key={tag.label}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-rose-500 text-xs">{tag.icon}</span>
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            {/* What's Included */}
            <div className="p-7 md:p-8 rounded-3xl border border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <FaCheckCircle className="text-white text-xs" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  What&apos;s Included
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...(pkg.included || []), '24/7 Expert Support'].map(
                  (item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all duration-300"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                        <FaCheckCircle className="text-emerald-500 text-[10px]" />
                      </div>
                      <span className="text-gray-700 text-sm font-medium leading-relaxed">
                        {item}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT SIDEBAR (1/3) ═══ */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-5">
              {/* Pricing Card */}
              <div className="p-6 rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-100/40">
                {/* Price */}
                <div className="mb-6">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Starting from
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-extrabold text-gray-900">
                      ${pkg.price}
                    </h2>
                    <span className="text-gray-400 text-sm font-medium">
                      / person
                    </span>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-6 space-y-3">
                  {[
                    { label: 'Destination', value: pkg.location },
                    { label: 'Category', value: pkg.category },
                  ].map((item, i) => (
                    <div key={item.label}>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="font-bold text-gray-900">
                          {item.value}
                        </span>
                      </div>
                      {i === 0 && (
                        <div className="w-full h-px bg-gray-200 mt-3" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className={`w-full cursor-pointer h-13 text-[15px] font-bold rounded-xl ${button.primary} shadow-lg shadow-rose-500/15 hover:shadow-xl hover:shadow-rose-500/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300`}
                  >
                    Request Booking
                    <FaArrowRight className="ml-2 text-xs" />
                  </Button>

                  <a
                    href={`${websiteDetails.whatappsLink}&text=Hello,%20I%20am%20interested%20in%20the%20${encodeURIComponent(pkg.title)}%20package.`}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer h-13 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 font-bold rounded-xl active:scale-[0.98] transition-all duration-300"
                    >
                      <FaWhatsapp className="mr-2 text-lg" /> Chat on
                      WhatsApp
                    </Button>
                  </a>
                </div>

                <p className="text-[11px] text-center text-gray-400 mt-4 leading-relaxed">
                  🔒 You won't be charged yet. We'll contact you to confirm
                  dates.
                </p>
              </div>

              {/* Help Card */}
              <div className="p-5 rounded-2xl bg-gray-950 text-white text-center">
                <h4 className="font-bold text-sm mb-1">
                  Need Help Deciding?
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  Our travel experts are available 24/7
                </p>
                <a
                  href={`tel:${websiteDetails.phone}`}
                  className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 font-bold text-lg transition-colors"
                >
                  <FaPhone className="text-sm" />
                  {websiteDetails.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

   {/* ═══════════ 4. Booking Modal ═══════════ */}
{isModalOpen && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={() => setIsModalOpen(false)}
  >
    <div
      className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Book Your Trip
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
            <FaMapMarkerAlt className="text-rose-500 text-[10px]" />
            {pkg.title}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(false)}
          className="w-9 h-9 rounded-xl cursor-pointer bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200"
        >
          <FaTimes className="text-sm " />
        </button>
      </div>

      {/* Modal Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 space-y-4 max-h-[75vh] overflow-y-auto overflow-x-hidden"
      >
        {/* Name */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5">
            <FaUser className="text-gray-400 text-[10px]" /> Full Name
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            className={`${inputBase} ${inputFocus} capitalize`}
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 min-w-0">
            <label className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5">
              <FaPhone className="text-gray-400 text-[10px]" /> Phone
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+880 1XXX..."
              className={`${inputBase} ${inputFocus}`}
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <label className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5">
              <FaEnvelope className="text-gray-400 text-[10px]" /> Email
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              className={`${inputBase} ${inputFocus} lowercase`}
            />
          </div>
        </div>

        {/* ✅ Travel & Return Date — iOS Fixed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden">
          {/* Travel Date */}
          <div className="space-y-1.5 min-w-0 overflow-hidden">
            <label className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5">
              <FaCalendarAlt className="text-gray-400 text-[10px]" />
              Travel Date
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative w-full overflow-hidden rounded-xl">
              <input
                type="date"
                name="travelDate"
                required
                min={today}
                value={formData.travelDate}
                onChange={handleInputChange}
                className={`
                  ${inputBase} ${inputFocus}
                  text-gray-600
                  w-full min-w-0 box-border
                  appearance-none
                  [-webkit-appearance:none]
                  [-moz-appearance:none]
                  [&::-webkit-date-and-time-value]:text-left
                  [&::-webkit-date-and-time-value]:text-sm
                  [&::-webkit-datetime-edit]:p-0
                  [&::-webkit-datetime-edit]:text-sm
                  [&::-webkit-datetime-edit-fields-wrapper]:p-0
                  [&::-webkit-calendar-picker-indicator]:opacity-0
                  [&::-webkit-calendar-picker-indicator]:absolute
                  [&::-webkit-calendar-picker-indicator]:inset-0
                  [&::-webkit-calendar-picker-indicator]:w-full
                  [&::-webkit-calendar-picker-indicator]:h-full
                  [&::-webkit-calendar-picker-indicator]:cursor-pointer
                `}
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              />
              {/* Custom calendar icon */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <FaCalendarAlt className="text-gray-400 text-xs" />
              </div>
            </div>
          </div>

          {/* Return Date */}
          <div className="space-y-1.5 min-w-0 overflow-hidden">
            <label className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5">
              <FaCalendarAlt className="text-gray-400 text-[10px]" />
              Return Date
              <span className="text-gray-400 font-normal text-[10px]">
                (Optional)
              </span>
            </label>
            <div className="relative w-full overflow-hidden rounded-xl">
              <input
                type="date"
                name="returnDate"
                min={formData.travelDate || today}
                value={formData.returnDate}
                onChange={handleInputChange}
                className={`
                  ${inputBase} ${inputFocus}
                  text-gray-600
                  w-full min-w-0 box-border
                  appearance-none
                  [-webkit-appearance:none]
                  [-moz-appearance:none]
                  [&::-webkit-date-and-time-value]:text-left
                  [&::-webkit-date-and-time-value]:text-sm
                  [&::-webkit-datetime-edit]:p-0
                  [&::-webkit-datetime-edit]:text-sm
                  [&::-webkit-datetime-edit-fields-wrapper]:p-0
                  [&::-webkit-calendar-picker-indicator]:opacity-0
                  [&::-webkit-calendar-picker-indicator]:absolute
                  [&::-webkit-calendar-picker-indicator]:inset-0
                  [&::-webkit-calendar-picker-indicator]:w-full
                  [&::-webkit-calendar-picker-indicator]:h-full
                  [&::-webkit-calendar-picker-indicator]:cursor-pointer
                `}
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <FaCalendarAlt className="text-gray-400 text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 min-w-0">
            <label className="text-[12px] font-semibold text-gray-700">
              Adults{' '}
              <span className="text-gray-400 font-normal">(Max 10)</span>
            </label>
            <input
              type="number"
              name="adults"
              min="1"
              max="10"
              value={formData.adults}
              onChange={handleInputChange}
              className={`${inputBase} ${inputFocus} text-center font-bold`}
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <label className="text-[12px] font-semibold text-gray-700">
              Children{' '}
              <span className="text-gray-400 font-normal">(Max 8)</span>
            </label>
            <input
              type="number"
              name="children"
              min="0"
              max="8"
              value={formData.children}
              onChange={handleInputChange}
              className={`${inputBase} ${inputFocus} text-center font-bold`}
            />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-[12px] font-semibold text-gray-700 flex items-center justify-between">
            <span>Additional Notes</span>
            <span className="text-gray-400 font-normal text-[10px]">
              {formData.message.length}/200
            </span>
          </label>
          <textarea
            name="message"
            rows={3}
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Any specific requirements or preferences?"
            className="w-full min-w-0 box-border p-4 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 text-sm font-medium outline-none transition-all duration-300 border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-[3px] focus:ring-gray-900/5 resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full h-13 text-[15px] cursor-pointer font-bold rounded-xl ${button.primary} shadow-lg shadow-rose-500/15 transition-all duration-300 ${
            isSubmitting
              ? 'opacity-70'
              : 'hover:shadow-xl hover:shadow-rose-500/20 hover:-translate-y-0.5'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Sending Request...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Confirm Booking Request
              <FaPaperPlane className="text-xs" />
            </span>
          )}
        </Button>

        <p className="text-[10px] text-center text-gray-400 leading-relaxed">
          🔒 Your information is secure and will never be shared with
          third parties.
        </p>
      </form>
    </div>
  </div>
)}
    </main>
  );
};

export default PackageDetails;