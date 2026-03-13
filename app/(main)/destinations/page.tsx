'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import {
  FaSearch,
  FaGlobeAmericas,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaTimes,
  FaArrowRight,
  FaCompass,
  FaStar,
  FaRegMap,
  FaWhatsapp,
} from 'react-icons/fa';
import { MdTravelExplore, MdExplore } from 'react-icons/md';
import { HiSparkles } from 'react-icons/hi2';
import DestinationCard from '../components/DestinationCard';
import Link from 'next/link';
import { websiteDetails } from '@/constant/data';

interface DestinationType {
  _id: number;
  slug: string;
  name: string;
  country: string;
  image: string;
  rating?: number;
  reviews?: number;
  bestTime?: string;
  description?: string;
}

const DestinationsPage = () => {
  const { layout } = appTheme;

  const [destinations, setDestinations] = useState<DestinationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get('/api/public/destinations');
        const data = response.data.data || [];
        setDestinations(data);
      } catch (err: any) {
        console.error('Error fetching destinations:', err);
        setError('Failed to load destinations.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  const filteredDestinations = destinations.filter(
    (dest) =>
      (dest.name &&
        dest.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dest.country &&
        dest.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* ================= Hero ================= */}
      <div className="relative w-full bg-gray-950 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/asset/others/des.jpg"
            alt="Destinations Hero"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/50 to-gray-950" />
        </div>

        <div
          className={`${layout.container} relative z-10 pt-28 md:pt-36 pb-28 md:pb-36`}
        >
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest">
              <HiSparkles className="text-sm" />
              Explore the World
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Discover Amazing{' '}
              <span className="bg-gradient-to-r from-rose-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
                Destinations
              </span>
            </h1>

            <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto">
              Handpicked destinations across the globe. Find your next
              adventure.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto pt-2">
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/20 flex items-center p-1.5">
                <FaMapMarkerAlt className="text-rose-500 ml-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by city or country..."
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

        {/* Wave */}
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
        {/* Stats */}
        {!isLoading && !error && destinations.length > 0 && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto mb-10">
            {[
              {
                icon: <FaGlobeAmericas className="text-rose-500" />,
                value: `${destinations.length}+`,
                label: 'Destinations',
              },
              {
                icon: <FaStar className="text-amber-500" />,
                value: '4.8/5',
                label: 'Avg. Rating',
              },
              {
                icon: <FaRegMap className="text-blue-500" />,
                value: '30+',
                label: 'Countries',
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
                <FaCompass className="text-rose-500 text-sm" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : 'Popular Destinations'}
                </h2>
                <p className="text-xs text-gray-400">
                  {filteredDestinations.length} places available
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-10">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-2xl shadow-gray-100 animate-pulse"
                >
                  <div className="h-52 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="w-16 h-4 bg-gray-200 rounded-full" />
                    <div className="w-3/4 h-4 bg-gray-200 rounded" />
                    <div className="w-full h-3 bg-gray-100 rounded" />
                    <div className="w-1/2 h-3 bg-gray-100 rounded" />
                    <div className="flex gap-2 pt-1">
                      <div className="w-14 h-5 bg-gray-100 rounded-full" />
                      <div className="w-14 h-5 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="max-w-md mx-auto mt-6">
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

        {/* Cards Grid */}
        {!isLoading && !error && filteredDestinations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDestinations.map((dest) => (
              <DestinationCard key={dest._id} data={dest} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && filteredDestinations.length === 0 && (
          <div className="max-w-md mx-auto mt-6">
            <div className="bg-white rounded-3xl p-10 text-center shadow-2xl shadow-gray-100 border border-gray-200/70">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <MdTravelExplore className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No destinations found
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                No places matching "
                <span className="font-semibold">{searchQuery}</span>
                ". Try a different search.
              </p>
              <Button
                onClick={() => setSearchQuery('')}
                className="bg-gray-900 text-white rounded-xl px-6 h-11 font-semibold hover:bg-gray-800 cursor-pointer"
              >
                View All Destinations
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ================= Bottom CTA ================= */}
      {!isLoading && !error && destinations.length > 0 && (
        <div className={`${layout.container} mt-16`}>
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 p-8 md:p-12">
            {/* Dot pattern */}
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
                  Can't find your dream destination?
                </h3>
                <p className="text-gray-400 text-sm">
                  Our travel experts will create a custom tour package just for
                  you.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                <Link href="/contact">
                  <button className="flex items-center justify-center gap-2.5 bg-white text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.98] cursor-pointer">
                    <span>Contact Us</span>
                    <FaArrowRight className="text-xs opacity-40" />
                  </button>
                </Link>
                <Link
                  href={`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent('Hi, I need help planning a custom tour.')}`}
                  target="_blank"
                >
                  <button className="flex items-center justify-center gap-2.5 bg-green-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-green-700 transition-colors active:scale-[0.98] cursor-pointer">
                    <FaWhatsapp className="text-lg" />
                    <span>WhatsApp Us</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DestinationsPage;