'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import {
  FaMapMarkerAlt,
  FaStar,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaLanguage,
  FaCamera,
  FaArrowLeft,
  FaArrowRight,
  FaSuitcaseRolling,
  FaSadTear,
  FaExclamationTriangle,
  FaCheckCircle,
  FaShareAlt,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi2';
import PackageCard from '../../components/PackageCard';

interface DestinationType {
  _id: string;
  name: string;
  country: string;
  rating: number;
  reviews: number;
  bestTime: string;
  currency: string;
  language: string;
  description: string;
  attractions: string[];
  gallery: string[];
}

interface PackageType {
  _id: number;
  slug: string;
  title: string;
  location: string;
  price: string;
  image: string;
  category: string;
  description: string;
  included?: string[];
}

const DestinationDetails = () => {
  const { layout, button } = appTheme;
  const params = useParams();
  const router = useRouter();

  const id = typeof params?.slug === 'string' ? params.slug : '';

  const [dest, setDest] = useState<DestinationType | null>(null);
  const [relatedPackages, setRelatedPackages] = useState<PackageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const destResponse = await axios.get(
          `/api/dashboard/destinations/${id}`
        );
        const destinationData = destResponse.data.data || destResponse.data;
        setDest(destinationData);

        const pkgResponse = await axios.get('/api/public/packages');
        const allPackages = pkgResponse.data.data || [];

        if (destinationData) {
          const filtered = allPackages.filter(
            (pkg: PackageType) =>
              (pkg.location &&
                pkg.location
                  .toLowerCase()
                  .includes(destinationData.country.toLowerCase())) ||
              (pkg.location &&
                pkg.location
                  .toLowerCase()
                  .includes(
                    destinationData.name.split(',')[0].toLowerCase()
                  ))
          );
          setRelatedPackages(filtered);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load destination details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleContact = () => router.push('/contact');

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (dir: 'prev' | 'next') => {
    if (!dest?.gallery) return;
    const total = dest.gallery.length;
    if (dir === 'next') setLightboxIndex((prev) => (prev + 1) % total);
    else setLightboxIndex((prev) => (prev - 1 + total) % total);
  };

  // ═══════════ Loading ═══════════
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Nav skeleton */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4">
          <div className={`${layout.container} flex justify-between`}>
            <div className="h-5 w-32 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Hero skeleton */}
        <div className={`${layout.container} mt-5`}>
          <div className="w-full h-[420px] md:h-[520px] bg-gray-100 rounded-3xl animate-pulse" />
        </div>

        {/* Content skeleton */}
        <div
          className={`${layout.container} mt-10 grid grid-cols-1 lg:grid-cols-3 gap-12`}
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 flex-1 bg-gray-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
            <div className="h-48 bg-gray-50 rounded-3xl animate-pulse" />
            <div className="h-64 bg-gray-50 rounded-3xl animate-pulse" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-[500px] bg-gray-100 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════ Error ═══════════
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
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">{error}</p>
          <Button
            onClick={() => router.push('/destinations')}
            variant="outline"
            className="rounded-xl px-6 h-11 font-semibold cursor-pointer"
          >
            <FaArrowLeft className="mr-2 text-xs" /> Back to Destinations
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════ Not Found ═══════════
  if (!dest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <FaSadTear className="text-3xl text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Destination Not Found
          </h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            The destination you're looking for may have been removed.
          </p>
          <Button
            onClick={() => router.push('/destinations')}
            className={`${button.primary} rounded-xl px-6 h-11 font-semibold cursor-pointer`}
          >
            Browse Destinations
          </Button>
        </div>
      </div>
    );
  }

  const cityName = dest.name.split(',')[0];

  return (
    <main className="bg-white min-h-screen pb-24">
      {/* ═══════════ 1. Top Nav ═══════════ */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/60">
        <div
          className={`${layout.container} py-3.5 flex justify-between items-center`}
        >
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2.5 text-sm text-gray-500 hover:text-gray-900 font-semibold transition-colors cursor-pointer group"
          >
            <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-900 group-hover:text-white flex items-center justify-center transition-all duration-300">
              <FaArrowLeft className="text-xs" />
            </span>
            <span className="hidden sm:inline">All Destinations</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer"
            >
              <FaShareAlt className="text-[10px]" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ 2. Hero ═══════════ */}
      <div className={`${layout.container} mt-5`}>
        <div className="relative w-full h-[400px] md:h-[520px] rounded-3xl overflow-hidden group">
          {/* Main Image */}
          {dest.gallery && dest.gallery.length > 0 ? (
            <Image
              src={dest.gallery[0]}
              alt={dest.name}
              fill
              quality={100}
              className="object-cover group-hover:scale-[1.03] transition-transform duration-[1.5s] ease-out"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

          {/* Badges top-left */}
          <div className="absolute top-5 left-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <HiOutlineSparkles className="text-xs" />
              {dest.country}
            </span>

            <span className="inline-flex items-center gap-1.5 bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 text-yellow-200 px-3 py-1.5 rounded-full text-xs font-bold">
              <FaStar className="text-yellow-400 text-[10px]" />
              {dest.rating || 'N/A'}
              <span className="text-yellow-300/60 font-medium">
                ({dest.reviews || 0})
              </span>
            </span>
          </div>

          {/* Gallery count badge top-right */}
          {dest.gallery && dest.gallery.length > 1 && (
            <button
              onClick={() => openLightbox(0)}
              className="absolute top-5 right-5 inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer hover:bg-white/25 transition-all"
            >
              <FaCamera className="text-[10px]" />
              {dest.gallery.length} Photos
            </button>
          )}

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
            <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white mb-3 leading-[1.1] tracking-tight max-w-3xl">
              Explore{' '}
              <span className="text-rose-400">{cityName}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-2 text-white/80 text-sm font-medium">
                <FaMapMarkerAlt className="text-rose-400 text-xs" />
                {dest.name}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-2 text-white/80 text-sm font-medium">
                <FaSuitcaseRolling className="text-rose-400 text-xs" />
                Top Destination
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ 3. Content Grid ═══════════ */}
      <div className={`${layout.container} mt-10`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14 relative">
          {/* ═══ LEFT (2/3) ═══ */}
          <div className="lg:col-span-2 space-y-10">
            {/* Quick Facts */}
            <div className="flex flex-wrap gap-4">
              {[
                {
                  icon: <FaCalendarAlt />,
                  label: 'Best Time',
                  value: dest.bestTime || 'Year Round',
                  bg: 'bg-blue-50',
                  iconColor: 'text-blue-500',
                },
                {
                  icon: <FaMoneyBillWave />,
                  label: 'Currency',
                  value: dest.currency || 'N/A',
                  bg: 'bg-emerald-50',
                  iconColor: 'text-emerald-500',
                },
                {
                  icon: <FaLanguage />,
                  label: 'Language',
                  value: dest.language || 'N/A',
                  bg: 'bg-amber-50',
                  iconColor: 'text-amber-500',
                },
              ].map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 flex-1 min-w-[160px]"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${fact.bg} flex items-center justify-center ${fact.iconColor} text-lg`}
                  >
                    {fact.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {fact.label}
                    </p>
                    <p className="font-bold text-gray-900 text-sm">
                      {fact.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <FaMapMarkerAlt className="text-white text-xs" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  About {cityName}
                </h2>
              </div>

              <p className="text-gray-600 text-[15px] leading-[1.8] whitespace-pre-line">
                {dest.description}
              </p>
            </div>

            {/* Attractions */}
            {dest.attractions && dest.attractions.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
                    <FaStar className="text-white text-xs" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Popular Attractions
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dest.attractions.map((attr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-50 group-hover:bg-gray-900 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-white transition-all duration-300 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <span className="font-semibold text-gray-700 text-sm">
                        {attr}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {dest.gallery && dest.gallery.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                      <FaCamera className="text-white text-xs" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Photo Gallery
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 font-semibold">
                    {dest.gallery.length} photos
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dest.gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className={`relative rounded-2xl overflow-hidden group cursor-pointer ${
                        idx === 0
                          ? 'col-span-2 row-span-2 aspect-auto h-[380px] md:h-[420px]'
                          : 'aspect-square'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${dest.name} - Photo ${idx + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                          <FaCamera className="text-gray-900 text-xs" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT SIDEBAR (1/3) ═══ */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-5">
              {/* CTA Card */}
              <div className="p-6 rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-100/40">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
                    <FaMapMarkerAlt className="text-rose-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Visit {cityName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Get a personalized travel plan from our experts
                  </p>
                </div>

                {/* Quick info */}
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-5 space-y-3">
                  {[
                    { label: 'Destination', value: dest.name },
                    { label: 'Country', value: dest.country },
                    {
                      label: 'Rating',
                      value: `${dest.rating || 'N/A'} ⭐`,
                    },
                  ].map((item, i) => (
                    <div key={item.label}>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="font-bold text-gray-900 text-right text-[13px]">
                          {item.value}
                        </span>
                      </div>
                      {i < 2 && (
                        <div className="w-full h-px bg-gray-200 mt-3" />
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleContact}
                  className={`w-full cursor-pointer h-13 text-[15px] font-bold rounded-xl ${button.primary} shadow-lg shadow-rose-500/15 hover:shadow-xl hover:shadow-rose-500/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300`}
                >
                  Get Custom Quote
                  <FaArrowRight className="ml-2 text-xs" />
                </Button>

                <p className="text-[11px] text-center text-gray-400 mt-3 leading-relaxed">
                  🔒 Free consultation. No obligations.
                </p>
              </div>

              {/* Related Packages */}
              {relatedPackages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Best Packages
                    </h3>
                    <Link
                      href="/packages"
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1 group"
                    >
                      View All
                      <FaArrowRight className="text-[8px] group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {relatedPackages.slice(0, 3).map((pkg) => (
                      <PackageCard key={pkg._id} data={pkg} />
                    ))}
                  </div>
                </div>
              )}

              {relatedPackages.length === 0 && (
                <div className="p-6 rounded-2xl border border-dashed border-gray-200 text-center">
                  <FaSuitcaseRolling className="text-gray-300 text-2xl mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-semibold">
                    No packages for this location yet.
                  </p>
                  <Link
                    href="/packages"
                    className="text-xs text-rose-600 font-semibold mt-2 inline-block cursor-pointer"
                  >
                    Browse all packages →
                  </Link>
                </div>
              )}

              {/* Help Card */}
              <div className="p-5 rounded-2xl bg-gray-950 text-white text-center">
                <h4 className="font-bold text-sm mb-1">
                  Need Help Planning?
                </h4>
                <p className="text-xs text-gray-400 mb-4">
                  Our travel experts are available 24/7
                </p>
                <Button
                  onClick={handleContact}
                  className="bg-white text-gray-900 hover:bg-gray-100 font-bold w-full rounded-xl h-11 cursor-pointer active:scale-[0.98] transition-all"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ Lightbox ═══════════ */}
      {lightboxOpen && dest.gallery && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer z-10"
          >
            <FaTimes className="text-sm" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-5 text-white/60 text-sm font-semibold z-10">
            {lightboxIndex + 1} / {dest.gallery.length}
          </div>

          {/* Prev */}
          {dest.gallery.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox('prev');
              }}
              className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer z-10"
            >
              <FaChevronLeft className="text-sm" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-[90vw] h-[70vh] md:w-[80vw] md:h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={dest.gallery[lightboxIndex]}
              alt={`${dest.name} - Photo ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              quality={100}
            />
          </div>

          {/* Next */}
          {dest.gallery.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox('next');
              }}
              className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer z-10"
            >
              <FaChevronRight className="text-sm" />
            </button>
          )}
        </div>
      )}
    </main>
  );
};

export default DestinationDetails;