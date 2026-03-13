'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import {
  FaStar,
  FaShieldAlt,
  FaHeadset,
  FaUsers,
  FaPlane,
  FaGlobeAsia,
  FaMosque,
  FaTag,
} from 'react-icons/fa';
import { MdFlightTakeoff } from 'react-icons/md';
import FlightSearchForm from '../flights/search/components/FlightSearchForm';

const sliderImages = [
  '/asset/others/hajj_umrah.avif',
  '/asset/others/utt.avif',
  '/asset/others/flimg.avif',
];

const Hero = () => {
  const { layout } = appTheme;
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full min-h-[90vh] flex flex-col bg-gray-950 overflow-hidden">
      {/* ========== Background ========== */}
      <div className="absolute inset-0 z-0">
        {sliderImages.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={img}
              alt={`Slide ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
              quality={85}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/85 via-gray-950/60 to-gray-950/95" />
      </div>

      {/* ========== Content ========== */}
      <div
        className={`relative z-10 w-full ${layout.container} flex flex-col items-center pt-10  pb-10 flex-1`}
      >
        {/* -------- Top: Title + Description (halka) -------- */}
        <div className="text-center mb-6 md:mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70 text-[11px] font-semibold uppercase tracking-widest mb-3">
            <MdFlightTakeoff className="text-rose-400" />
            Trusted by 10,000+ Travelers
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug">
            Find & Book{' '}
            <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
              Best Flight Deals
            </span>
          </h1>

          <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto">
            Search, compare and book flights to anywhere in the world.
          </p>
        </div>

        {/* -------- Middle: Search Form Card -------- */}
        <div className="w-full max-w-6xl mb-8 md:mb-12">
          <div className="relative">
            {/* Subtle glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500/20 via-orange-400/15 to-rose-500/20 blur-lg opacity-50" />

            <div className="relative rounded-2xl bg-white shadow-2xl shadow-black/30 overflow-hidden">
              {/* Top gradient line */}
              <div className="h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />

              {/* Form Header */}
              <div className="px-5 md:px-7 pt-5 pb-3 flex items-center gap-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md shadow-rose-500/20">
                  <MdFlightTakeoff className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Search Flights
                  </h3>
                  <p className="text-gray-400 text-xs">
                    300+ airlines · Best prices
                  </p>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-5 md:p-7">
                <FlightSearchForm />
              </div>
            </div>
          </div>
        </div>

        {/* -------- Bottom: Info Cards -------- */}
        <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            {
              icon: <FaMosque className="text-lg" />,
              title: 'Hajj & Umrah',
              desc: 'Exclusive spiritual packages',
              color: 'from-emerald-500/15 to-emerald-600/15',
              iconColor: 'text-emerald-400',
              borderColor: 'border-emerald-500/10',
            },
            {
              icon: <FaGlobeAsia className="text-lg" />,
              title: 'World Tours',
              desc: '50+ destinations covered',
              color: 'from-blue-500/15 to-blue-600/15',
              iconColor: 'text-blue-400',
              borderColor: 'border-blue-500/10',
            },
            {
              icon: <FaTag className="text-lg" />,
              title: 'Best Prices',
              desc: 'Price match guarantee',
              color: 'from-orange-500/15 to-orange-600/15',
              iconColor: 'text-orange-400',
              borderColor: 'border-orange-500/10',
            },
            {
              icon: <FaHeadset className="text-lg" />,
              title: '24/7 Support',
              desc: 'Always here for you',
              color: 'from-violet-500/15 to-violet-600/15',
              iconColor: 'text-violet-400',
              borderColor: 'border-violet-500/10',
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`group rounded-xl bg-white/[0.04] border border-white/[0.06] ${item.borderColor} p-4 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300 cursor-default`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center ${item.iconColor} mb-3 group-hover:scale-110 transition-transform duration-300`}
              >
                {item.icon}
              </div>
              <h4 className="text-white font-semibold text-sm mb-0.5">
                {item.title}
              </h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* -------- Trust Strip -------- */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[11, 12, 13, 14].map((id) => (
                <img
                  key={id}
                  src={`https://i.pravatar.cc/80?img=${id}`}
                  alt="user"
                  className="w-7 h-7 rounded-full border-2 border-gray-950 object-cover"
                />
              ))}
            </div>
            <div className="leading-tight">
              <p className="text-white text-xs font-bold">10,000+</p>
              <p className="text-gray-500 text-[10px]">Happy Travelers</p>
            </div>
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block" />

          <div className="flex items-center gap-1.5">
            <FaShieldAlt className="text-green-500 text-xs" />
            <span className="text-gray-400 text-xs font-medium">
              Secure Payments
            </span>
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block" />

          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-500 text-[10px]" />
              ))}
            </div>
            <span className="text-gray-400 text-xs font-medium">
              4.9/5 Rating
            </span>
          </div>
        </div>
      </div>

      {/* ========== Slide Dots ========== */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {sliderImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-400 ${
              currentSlide === idx
                ? 'w-7 bg-gradient-to-r from-rose-500 to-orange-400'
                : 'w-1.5 bg-white/25 hover:bg-white/50'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;