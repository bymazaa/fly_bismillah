'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import {
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
  FaTimes,
  FaArrowRight,
  FaStar,
  FaBoxOpen,
  FaWhatsapp,
  FaTag,
  FaUsers,
  FaShieldAlt,
} from 'react-icons/fa';
import { MdTravelExplore, MdCardTravel } from 'react-icons/md';
import { HiSparkles } from 'react-icons/hi2';
import { useSearchParams, useRouter } from 'next/navigation';
import PackageCard from '../components/PackageCard';
import { websiteDetails } from '@/constant/data';

interface PackageType {
  _id: string;
  title: string;
  category: string;
  location: string;
  price: number;
  image: string;
}

const Packagesclient = () => {
  const { layout } = appTheme;
  const params = useSearchParams();
  const router = useRouter();

  const [packagesData, setPackagesData] = useState<PackageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get('/api/public/packages');
        if (response.status !== 200) throw new Error('Network error');
        const data = response.data.data || [];
        setPackagesData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const categories = useMemo(() => {
    if (!packagesData.length) return ['All'];
    return packagesData
      .reduce(
        (acc, pkg) => {
          if (pkg.category && !acc.includes(pkg.category)) acc.push(pkg.category);
          return acc;
        },
        ['All'] as string[]
      )
      .slice(0, 10);
  }, [packagesData]);

  useEffect(() => {
    const type = params.get('type');
    setActiveCategory(type ? type.toLowerCase() : 'all');
  }, [params]);

  const handleCategoryChange = (cat: string) => {
    const lowerCat = cat.toLowerCase();
    setActiveCategory(lowerCat);
    router.push(lowerCat === 'all' ? '/packages' : `/packages?type=${lowerCat}`);
  };

  const filteredPackages = useMemo(() => {
    return packagesData.filter((pkg) => {
      const matchCategory =
        activeCategory === 'all' ||
        (pkg.category && pkg.category.toLowerCase() === activeCategory);
      const matchSearch =
        (pkg.title && pkg.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (pkg.location && pkg.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (pkg.category && pkg.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery, packagesData]);

  const displayCategory =
    activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);

  const heroImageUrl =
    params.get('type') === 'hajj' || params.get('type') === 'umrah'
      ? '/asset/others/hajj_umrah.avif'
      : '/asset/others/ottour.avif';

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* ================= Hero ================= */}
      <div className="relative w-full bg-gray-950 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroImageUrl}
            alt="Packages Hero"
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
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest">
              <HiSparkles className="text-sm" />
              Curated Packages
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Find Your Perfect{' '}
              <span className="bg-gradient-to-r from-red-400 via-rose-400 to-rose-400 bg-clip-text text-transparent">
                Package
              </span>
            </h1>

            <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto">
              Spiritual journeys, holiday getaways & adventure tours — all in
              one place.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto pt-2">
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/20 flex items-center p-1.5">
                <FaSearch className="text-rose-400 ml-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search packages by name or destination..."
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
        {!isLoading && !error && packagesData.length > 0 && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto mb-10">
            {[
              {
                icon: <MdCardTravel className="text-rose-500" />,
                value: `${packagesData.length}+`,
                label: 'Packages',
              },
              {
                icon: <FaStar className="text-amber-500" />,
                value: '4.9/5',
                label: 'Avg. Rating',
              },
              {
                icon: <FaUsers className="text-blue-500" />,
                value: '10K+',
                label: 'Travelers',
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

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-100 border border-gray-200/70 p-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-xs font-bold text-gray-400 mr-1 flex items-center gap-1.5 shrink-0">
              <FaFilter className="text-[10px]" />
              Filter:
            </span>

            {isLoading
              ? [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-9 w-24 bg-gray-100 rounded-xl animate-pulse shrink-0"
                  />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border shrink-0 ${
                      activeCategory === cat.toLowerCase()
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
          </div>
        </div>

        {/* Section Header */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <FaTag className="text-rose-500 text-sm" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeCategory === 'all'
                    ? 'All Packages'
                    : `${displayCategory} Packages`}
                </h2>
                <p className="text-xs text-gray-400">
                  {filteredPackages.length} packages available
                </p>
              </div>
            </div>

            <span className="bg-white px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-500 border border-gray-200 hidden md:block">
              {filteredPackages.length} Results
            </span>
          </div>
        )}

        {/* -------- Loading -------- */}
        {isLoading && (
          <div className="space-y-8">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-2xl shadow-gray-100 animate-pulse"
                >
                  <div className="h-52 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-5 bg-gray-200 rounded-full" />
                      <div className="w-12 h-5 bg-gray-100 rounded-full" />
                    </div>
                    <div className="w-3/4 h-5 bg-gray-200 rounded" />
                    <div className="w-full h-3 bg-gray-100 rounded" />
                    <div className="w-2/3 h-3 bg-gray-100 rounded" />
                    <div className="border-t border-gray-200/70 pt-3 mt-3 flex justify-between">
                      <div className="w-20 h-6 bg-gray-200 rounded" />
                      <div className="w-24 h-9 bg-gray-200 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------- Error -------- */}
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

        {/* -------- Cards Grid -------- */}
        {!isLoading && !error && filteredPackages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              // @ts-ignore
              <PackageCard key={pkg._id} data={pkg} />
            ))}
          </div>
        )}

        {/* -------- Empty -------- */}
        {!isLoading && !error && filteredPackages.length === 0 && (
          <div className="max-w-md mx-auto mt-6">
            <div className="bg-white rounded-3xl p-10 text-center shadow-2xl shadow-gray-100 border border-gray-200/70">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <FaBoxOpen className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No packages found
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                No packages matching "
                <span className="font-semibold">{searchQuery}</span>" in{' '}
                <span className="font-semibold">{displayCategory}</span>
                .
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('All');
                }}
                className="bg-gray-900 text-white rounded-xl px-6 h-11 font-semibold hover:bg-gray-800 cursor-pointer"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ================= Bottom CTA ================= */}
      {!isLoading && !error && packagesData.length > 0 && (
        <div className={`${layout.container} mt-16`}>
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 p-8 md:p-12">
            {/* Dot Pattern */}
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
                  Need a custom package?
                </h3>
                <p className="text-gray-400 text-sm">
                  Tell us your requirements and we'll create the perfect tour
                  just for you.
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
                  href={`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent('Hi, I need a custom travel package.')}`}
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

export default Packagesclient;