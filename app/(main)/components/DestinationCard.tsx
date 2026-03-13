'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaArrowRight, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

interface DestinationProps {
  data: {
    _id: number;
    slug: string;
    name: string;
    country: string;
    image: string;
    rating?: number;
    reviews?: number;
    bestTime?: string;
    description?: string;
  };
}

const DestinationCard = ({ data }: DestinationProps) => {
  return (
    <Link href={`/destinations/${data._id}`} className="group block h-full">
      <div className="relative h-full rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] transition-all duration-500 flex flex-col hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative h-64 overflow-hidden">
          <Image
            src={data.image}
            alt={data.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-[800ms] ease-out"
          />

          {/* Multi-layer Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Country Badge - Glass */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-lg text-gray-800 text-[11px] font-bold uppercase tracking-wider border border-white/50">
              <FaMapMarkerAlt className="text-rose-500 text-[10px]" />
              {data.country}
            </div>
          </div>

          {/* Rating - Glass (top right) */}
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold">
              <FaStar className="text-yellow-400 text-[10px]" />
              {data.rating || 4.8}
            </div>
          </div>

          {/* Bottom Title on Image */}
          <div className="absolute bottom-4 left-5 right-5 z-10">
            <h3 className="text-2xl font-extrabold text-white leading-tight drop-shadow-lg line-clamp-1 group-hover:text-rose-300 transition-colors duration-300">
              {data.name}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {data.bestTime && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-100">
                <FaClock className="text-[9px]" />
                Best: {data.bestTime}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-100">
              <FaStar className="text-[9px]" />
              {data.reviews || 50}+ Reviews
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
            {data.description ||
              `Discover the beauty of ${data.name}. A perfect destination for travelers seeking unforgettable experiences.`}
          </p>

          {/* Divider + CTA */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100/80">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[15, 16, 17].map((id) => (
                  <img
                    key={id}
                    src={`https://i.pravatar.cc/60?img=${id}`}
                    alt="Traveler"
                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                50+ visited
              </span>
            </div>

            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs group-hover:gap-3 transition-all duration-300">
              <span className="hidden sm:inline">Explore</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-rose-200 transition-all duration-300">
                <FaArrowRight className="text-[11px] -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DestinationCard;