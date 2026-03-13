'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { appTheme } from '@/constant/theme/global';
import {
  FaWhatsapp,
  FaArrowRight,
  FaSearch,
  FaTag,
  FaSadTear,
  FaExclamationTriangle,
  FaPlaneDeparture,
  FaTimes,
  FaStar,
  FaShieldAlt,
} from 'react-icons/fa';
import { MdLocalOffer, MdTravelExplore } from 'react-icons/md';
import { HiSparkles } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { websiteDetails } from '@/constant/data';

interface OfferType {
  _id: string;
  title: string;
  description: string;
  image: string;
  whatsappMessage?: string;
  isLarge?: boolean;
}

const OffersPage = () => {
  const { layout } = appTheme;

  const [offers, setOffers] = useState<OfferType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get('/api/public/offers');
        const data = response.data.data || response.data || [];
        setOffers(data);
      } catch (err: any) {
        console.error('Error fetching offers:', err);
        setError('Unable to load latest deals.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const filteredBanners = offers.filter(
    (banner) =>
      (banner.title &&
        banner.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (banner.description &&
        banner.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* ================= Hero ================= */}
      <div className="relative w-full bg-gray-950 overflow-hidden">
        {/* BG Image */}
        <div className="absolute inset-0">
          <Image
            src="/asset/blog/blog1.webp"
            alt="Offers Hero"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/50 to-gray-950" />
        </div>

        {/* Hero Content */}
        <div
          className={`${layout.container} relative z-10 pt-28 md:pt-36 pb-28 md:pb-36`}
        >
          <div className="max-w-3xl mx-auto text-center space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest">
              <HiSparkles className="text-sm" />
              Exclusive Deals
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Handpicked Travel{' '}
              <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Offers
              </span>
            </h1>

            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
              Discover curated deals on flights, tours, Hajj & Umrah packages.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto pt-2">
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/20 flex items-center p-1.5">
                <FaSearch className="text-gray-400 ml-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search deals (e.g., Dubai, Hajj)..."
                  className="flex-1 px-4 py-3.5 outline-none text-gray-800 font-medium bg-transparent placeholder-gray-400 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mr-2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                )}
                <button className="bg-gray-900 text-white rounded-xl w-11 h-11 flex items-center justify-center hover:bg-rose-600 transition-colors shrink-0">
                  <FaArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave / curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60L1440 60L1440 30C1440 30 1200 0 720 0C240 0 0 30 0 30L0 60Z"
              fill="#F9FAFB"
            />
          </svg>
        </div>
      </div>

      {/* ================= Content ================= */}
      <div className={`${layout.container} -mt-8 relative z-20`}>
        {/* Quick Stats */}
        {!isLoading && !error && offers.length > 0 && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto mb-10">
            {[
              {
                icon: <MdLocalOffer className="text-rose-500" />,
                value: `${offers.length}`,
                label: 'Active Deals',
              },
              {
                icon: <FaShieldAlt className="text-green-500" />,
                value: 'Verified',
                label: 'All Offers',
              },
              {
                icon: <FaStar className="text-amber-500" />,
                value: '4.9/5',
                label: 'Avg. Rating',
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 text-center shadow-2xl shadow-gray-100 border border-gray-200/70"
              >
                <div className="text-xl mb-1.5 flex justify-center">
                  {stat.icon}
                </div>
                <p className="font-bold text-gray-900 text-sm">{stat.value}</p>
                <p className="text-gray-400 text-[11px]">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Section Header */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <FaTag className="text-rose-500 text-sm" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : 'Trending Offers'}
                </h2>
                <p className="text-xs text-gray-400">
                  {filteredBanners.length} deals available
                </p>
              </div>
            </div>
          </div>
        )}

        {/* -------- Loading Skeleton -------- */}
        {isLoading && (
          <div className="space-y-10">
            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 animate-pulse"
                >
                  <div className="w-6 h-6 bg-gray-200 rounded-full mx-auto mb-2" />
                  <div className="w-12 h-3 bg-gray-200 rounded mx-auto mb-1" />
                  <div className="w-16 h-2 bg-gray-100 rounded mx-auto" />
                </div>
              ))}
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`rounded-2xl bg-white overflow-hidden shadow-2xl shadow-gray-100 animate-pulse ${
                    i === 1 ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div className="h-56 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="w-20 h-5 bg-gray-200 rounded-full" />
                    <div className="w-3/4 h-5 bg-gray-200 rounded" />
                    <div className="w-full h-3 bg-gray-100 rounded" />
                    <div className="w-2/3 h-3 bg-gray-100 rounded" />
                    <div className="w-full h-11 bg-gray-200 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------- Error -------- */}
        {!isLoading && error && (
          <div className="max-w-md mx-auto mt-10">
            <div className="bg-white rounded-3xl p-10 text-center shadow-2xl shadow-gray-100 border border-red-50">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FaExclamationTriangle className="text-2xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gray-900 text-white rounded-xl px-6 h-11 font-semibold hover:bg-gray-800 cursor-pointer"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* -------- Offer Cards -------- */}
        {!isLoading && !error && filteredBanners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanners.map((banner, index) => {
              const isLarge = banner.isLarge;

              return (
                <div
                  key={banner._id || index}
                  className={`group relative rounded-2xl overflow-hidden bg-white shadow-2xl shadow-gray-100 hover:shadow-xl border border-gray-200/70 hover:border-gray-200 transition-all duration-300 ${
                    isLarge ? 'lg:col-span-2' : ''
                  }`}
                >
                  {/* Image Section */}
                  <div
                    className={`relative overflow-hidden ${
                      isLarge ? 'h-64 md:h-72' : 'h-52'
                    }`}
                  >
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider text-white shadow-md ${
                          isLarge
                            ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                            : 'bg-black/40 backdrop-blur-md border border-white/10'
                        }`}
                      >
                        {isLarge ? (
                          <>
                            <HiSparkles /> Featured
                          </>
                        ) : (
                          <>
                            <FaTag className="text-[9px]" /> Deal
                          </>
                        )}
                      </span>
                    </div>

                    {/* Bottom title on image */}
                    <div className="absolute bottom-4 left-5 right-5 z-10">
                      <h3
                        className={`font-extrabold text-white leading-tight drop-shadow-2xl shadow-gray-100 ${
                          isLarge
                            ? 'text-2xl md:text-3xl'
                            : 'text-lg md:text-xl'
                        }`}
                      >
                        {banner.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 space-y-4">
                    {/* Description */}
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                      {banner.description}
                    </p>

                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-2">
                      {isLarge && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-semibold">
                          <FaPlaneDeparture className="text-[10px]" />
                          Flight Included
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-[11px] font-semibold">
                        <FaShieldAlt className="text-[10px]" />
                        Verified
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[11px] font-semibold">
                        <FaStar className="text-[10px]" />
                        Top Rated
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200/70" />

                    {/* CTA */}
                    <Link
                      href={`https://wa.me/${
                        websiteDetails.whatsappNumber
                      }?text=${encodeURIComponent(
                        banner.whatsappMessage ||
                          `Hi, I am interested in ${banner.title}`
                      )}`}
                      target="_blank"
                      className="block"
                    >
                      <button className="w-full flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 active:scale-[0.98] cursor-pointer">
                        <FaWhatsapp className="text-lg" />
                        <span className="text-sm">Book via WhatsApp</span>
                        <FaArrowRight className="text-xs opacity-60 ml-1" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* -------- Empty State -------- */}
        {!isLoading && !error && filteredBanners.length === 0 && (
          <div className="max-w-md mx-auto mt-10">
            <div className="bg-white rounded-3xl p-10 text-center shadow-2xl shadow-gray-100 border border-gray-200/70">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <MdTravelExplore className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No offers found
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                We couldn't find any deal matching "
                <span className="font-semibold">{searchQuery}</span>".
              </p>
              <Button
                onClick={() => setSearchQuery('')}
                className="bg-gray-900 text-white rounded-xl px-6 h-11 font-semibold hover:bg-gray-800 cursor-pointer"
              >
                View All Offers
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ================= Bottom CTA ================= */}
      {!isLoading && !error && offers.length > 0 && (
        <div className={`${layout.container} mt-16`}>
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 p-8 md:p-12">
            {/* BG pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Can't find what you're looking for?
                </h3>
                <p className="text-gray-400 text-sm">
                  Tell us your requirements. We'll create a custom package just
                  for you.
                </p>
              </div>

              <Link
                href={`https://wa.me/${
                  websiteDetails.whatsappNumber
                }?text=${encodeURIComponent(
                  'Hi, I need a custom travel package.'
                )}`}
                target="_blank"
                className="shrink-0"
              >
                <button className="flex items-center gap-3 bg-white text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.98] cursor-pointer">
                  <FaWhatsapp className="text-xl text-green-600" />
                  <span>Get Custom Package</span>
                  <FaArrowRight className="text-xs opacity-40" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default OffersPage;