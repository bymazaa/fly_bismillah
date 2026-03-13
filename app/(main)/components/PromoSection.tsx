'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { appTheme } from '@/constant/theme/global';
import {
  FaWhatsapp,
  FaArrowRight,
  FaExclamationTriangle,
  FaFire,
  FaSadTear,
  FaStar,
  FaShieldAlt,
  FaPlaneDeparture,
  FaTag,
} from 'react-icons/fa';
import { MdLocalOffer } from 'react-icons/md';
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

const PromoSection = () => {
  const { layout } = appTheme;

  const [offers, setOffers] = useState<OfferType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/public/offers');
        const data = response.data.data || response.data || [];
        setOffers(data.slice(0, 5));
      } catch (err: any) {
        console.error('Error fetching offers:', err);
        setError('Failed to load special offers.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffers();
  }, []);

  return (
    <section className="relative py-28 overflow-hidden">
      {/* Section BG */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white" />
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-50 rounded-full blur-[120px] opacity-60 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-50 rounded-full blur-[100px] opacity-50 translate-y-1/3 -translate-x-1/4" />

      <div className={`${layout.container} relative z-10`}>
        {/* ======= Header ======= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-xs font-bold uppercase tracking-widest">
              <FaFire className="text-sm animate-pulse" />
              Limited Time Offers
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-[1.1]">
              Exclusive Travel{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Deals
                </span>
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400 rounded-full opacity-40" />
              </span>
            </h2>

            <p className="text-gray-500 text-lg leading-relaxed">
              Handpicked deals you won't find anywhere else. Book now before
              they're gone.
            </p>
          </div>

          {/* View All */}
          <div className="shrink-0">
            <Link href="/offers">
              <button className="group flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 transition-all duration-300 active:scale-[0.97]">
                <span>View All Offers</span>
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <FaArrowRight className="text-xs" />
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* ======= Stats Strip ======= */}
        {!isLoading && !error && offers.length > 0 && (
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 mb-12">
            {[
              {
                icon: <MdLocalOffer className="text-rose-500" />,
                text: `${offers.length} Active Deals`,
              },
              {
                icon: <FaShieldAlt className="text-green-500" />,
                text: 'Verified Offers',
              },
              {
                icon: <FaStar className="text-amber-500" />,
                text: '4.9/5 Customer Rating',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-100 text-sm font-semibold text-gray-700"
              >
                <span className="text-base">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        )}

        {/* ======= Loading ======= */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`bg-white rounded-3xl overflow-hidden shadow-2xl shadow-gray-100 animate-pulse ${
                  i === 1 ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div
                  className={`bg-gradient-to-br from-gray-200 to-gray-100 ${
                    i === 1 ? 'h-72' : 'h-56'
                  }`}
                />
                <div className="p-6 space-y-3">
                  <div className="flex gap-2">
                    <div className="w-16 h-6 bg-gray-200 rounded-full" />
                    <div className="w-12 h-6 bg-gray-100 rounded-full" />
                  </div>
                  <div className="w-3/4 h-5 bg-gray-200 rounded" />
                  <div className="w-full h-3 bg-gray-100 rounded" />
                  <div className="w-2/3 h-3 bg-gray-100 rounded" />
                  <div className="pt-3 border-t border-gray-100">
                    <div className="w-full h-12 bg-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======= Cards Grid ======= */}
        {!isLoading && !error && offers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer, idx) => {
              const isLarge = offer.isLarge || idx === 0;

              return (
                <div
                  key={offer._id || idx}
                  className={`group relative rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-500 flex flex-col ${
                    isLarge ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  {/* Image */}
                  <div
                    className={`relative overflow-hidden ${
                      isLarge ? 'h-72 md:h-80' : 'h-56'
                    }`}
                  >
                    <Image
                      src={offer.image}
                      alt={offer.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-[800ms] ease-out"
                    />
                    {/* Multi Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Badge */}
                    <div className="absolute top-5 left-5 z-10">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider text-white shadow-lg ${
                          isLarge
                            ? 'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/25'
                            : 'bg-white/15 backdrop-blur-md border border-white/20'
                        }`}
                      >
                        {isLarge ? (
                          <>
                            <HiSparkles className="text-sm" /> Featured Deal
                          </>
                        ) : (
                          <>
                            <FaFire className="text-[10px]" /> Hot Offer
                          </>
                        )}
                      </span>
                    </div>

                    {/* Bottom Title Overlay */}
                    <div className="absolute bottom-5 left-6 right-6 z-10">
                      <h3
                        className={`font-extrabold text-white leading-tight drop-shadow-lg line-clamp-2 ${
                          isLarge
                            ? 'text-2xl md:text-3xl'
                            : 'text-xl md:text-2xl'
                        }`}
                      >
                        {offer.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Description */}
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                      {offer.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {isLarge && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[11px] font-semibold border border-blue-100">
                          <FaPlaneDeparture className="text-[10px]" />
                          Flight Included
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 text-green-600 text-[11px] font-semibold border border-green-100">
                        <FaShieldAlt className="text-[10px]" />
                        Verified
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-[11px] font-semibold border border-amber-100">
                        <FaTag className="text-[10px]" />
                        Best Price
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 pt-5 flex items-center gap-3">
                      {/* WhatsApp CTA */}
                      <Link
                        href={`https://wa.me/${
                          websiteDetails.whatsappNumber || websiteDetails.phone
                        }?text=${encodeURIComponent(
                          offer.whatsappMessage ||
                            `Hi, I'm interested in: ${offer.title}`
                        )}`}
                        target="_blank"
                        className="flex-1"
                      >
                        <button className="w-full flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.97] shadow-lg shadow-green-600/10 hover:shadow-green-600/20 cursor-pointer">
                          <FaWhatsapp className="text-lg" />
                          <span className="text-sm">Book Now</span>
                        </button>
                      </Link>

                      {/* Share / Save */}
                      <button className="w-12 h-12 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all duration-200 shrink-0">
                        <FaArrowRight className="text-sm -rotate-45" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======= Error ======= */}
        {!isLoading && error && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-red-50">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FaExclamationTriangle className="text-3xl text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-500 text-sm mb-8">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gray-900 text-white rounded-xl px-8 h-12 font-bold hover:bg-gray-800 cursor-pointer"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* ======= Empty ======= */}
        {!isLoading && !error && offers.length === 0 && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaSadTear className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Offers Yet
              </h3>
              <p className="text-gray-500 text-sm mb-8">
                Check back soon for amazing deals!
              </p>
              <Link href="/packages">
                <Button className="bg-gray-900 text-white rounded-xl px-8 h-12 font-bold hover:bg-gray-800 cursor-pointer">
                  Browse Packages
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ======= Bottom CTA ======= */}
        {!isLoading && !error && offers.length > 0 && (
          <div className="mt-20">
            <div className="relative rounded-3xl overflow-hidden">
              {/* BG Image */}
              <div className="absolute inset-0">
                <Image
                  src={offers[0]?.image || '/asset/others/ottour.avif'}
                  alt="CTA Background"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gray-950/90" />
              </div>

              {/* Dot Pattern */}
              <div className="absolute inset-0 opacity-[0.03]">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '20px 20px',
                  }}
                />
              </div>

              <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left max-w-lg space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold uppercase tracking-widest">
                    <HiSparkles />
                    Custom Deals
                  </div>
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                    Want a personalized{' '}
                    <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                      travel deal?
                    </span>
                  </h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    Tell us what you need. Our experts will create a custom
                    package with the best price.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                  <Link href="/contact">
                    <button className="flex items-center justify-center gap-2.5 bg-white text-gray-900 font-bold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all active:scale-[0.97] shadow-lg cursor-pointer">
                      Contact Us
                      <FaArrowRight className="text-xs opacity-40" />
                    </button>
                  </Link>
                  <Link
                    href={`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent('Hi, I need a custom travel deal.')}`}
                    target="_blank"
                  >
                    <button className="flex items-center justify-center gap-2.5 bg-green-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-green-700 transition-all active:scale-[0.97] shadow-lg shadow-green-600/20 cursor-pointer">
                      <FaWhatsapp className="text-xl" />
                      WhatsApp
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PromoSection;