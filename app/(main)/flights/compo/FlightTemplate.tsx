'use client';
import { useState } from 'react';
import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import {
  FaPlane,
  FaArrowRight,
  FaFilter,
  FaLuggageCart,
  FaClock,
  FaShieldAlt,
} from 'react-icons/fa';
import { flightResultsForAnyType } from '@/constant/flight';
import { toast } from 'sonner';

interface FlightTemplateProps {
  type: 'domestic' | 'international';
  title: string;
  subtitle: string;
  bgImage: string;
}

const FlightTemplate = ({ type, title, subtitle, bgImage }: FlightTemplateProps) => {
  const { layout, button } = appTheme;
  const [sortBy] = useState<'price' | 'duration'>('price');

  const baseFlights = flightResultsForAnyType.filter((f) => f.type === type);

  const sortedFlights = [...baseFlights].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    return parseInt(a.duration) - parseInt(b.duration);
  });

  function handleClick() {
    toast.error('Feature coming soon!');
  }

  return (
    <main className="bg-gradient-to-b from-slate-50 to-white min-h-screen pb-24">
      {/* ============ Hero ============ */}
      <div className="relative h-[50vh] min-h-[380px] flex items-center justify-center text-center px-4 overflow-hidden">
        <Image src={bgImage} alt={title} fill className="object-cover scale-105" priority />

        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-slate-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/20 via-transparent to-rose-900/20" />

        {/* Decorative elements */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-5">
          <span
            className="
              inline-flex items-center gap-2
              bg-white/10 backdrop-blur-md
              text-white px-5 py-2 rounded-full
              text-xs font-bold uppercase tracking-[0.2em]
              border border-white/20
              shadow-2xl
            "
          >
            <FaPlane className="text-rose-400" />
            {subtitle}
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-2xl leading-tight">
            {title}
          </h1>

          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Find the best deals on {type} flights with Bismillah Travels. Book now and save more.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {['Best Price Guarantee', 'Instant Confirmation', '24/7 Support'].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 text-white/70 text-[11px] font-medium"
              >
                <FaShieldAlt className="text-rose-400 text-[10px]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Filter Bar ============ */}
      <div className={`${layout.container} -mt-8 relative z-20 mb-10`}>
        <div
          className="
            bg-white rounded-2xl
            shadow-[0_8px_30px_rgba(0,0,0,0.06)]
            border border-slate-200/60
            p-5 flex flex-col sm:flex-row justify-between items-center gap-4
          "
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
              <FaFilter className="text-rose-500 text-sm" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {sortedFlights.length} Flights Available
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Sorted by lowest price first
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              {type} Routes
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* ============ Flight Cards ============ */}
      <div className={`${layout.container} space-y-5`}>
        {sortedFlights.map((flight, idx) => (
          <div
            key={flight.id}
            className="
              group relative
              bg-white rounded-[22px]
              border border-slate-200/70
              shadow-[0_4px_20px_rgba(0,0,0,0.04)]
              hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]
              hover:border-rose-200/60
              transition-all duration-300
              overflow-hidden
            "
          >
            {/* Top accent line */}
            <div
              className={`absolute inset-x-0 top-0 h-[3px] ${
                idx === 0
                  ? 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400'
                  : 'bg-gradient-to-r from-rose-300/40 via-rose-200/20 to-rose-300/40'
              }`}
            />

            {/* Best Value Badge */}
            {idx === 0 && (
              <div
                className="
                  absolute top-3 left-4 z-10
                  flex items-center gap-1.5
                  bg-emerald-500 text-white
                  text-[10px] font-bold uppercase tracking-wider
                  px-3 py-1.5 rounded-full
                  shadow-lg shadow-emerald-200/50
                "
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Best Value
              </div>
            )}

            <div className="p-5 lg:p-6">
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                {/* ---- Airline Info ---- */}
                <div className="flex items-center gap-4 w-full lg:w-[220px] shrink-0">
                  <div
                    className="
                      relative w-14 h-14
                      bg-white rounded-2xl
                      border border-slate-200/80
                      shadow-sm
                      flex items-center justify-center
                      overflow-hidden
                    "
                  >
                    <Image
                      src={flight.logo}
                      alt={flight.airline}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">
                      {flight.airline}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className="
                          text-[10px] font-semibold text-slate-500
                          bg-slate-50 px-2 py-0.5 rounded-md
                          border border-slate-100
                          font-mono tracking-wide
                        "
                      >
                        {flight.flightNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ---- Flight Timeline ---- */}
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between">
                    {/* Departure */}
                    <div className="text-left">
                      <p className="text-2xl font-black text-slate-900 leading-none">
                        {flight.departureTime}
                      </p>
                      <p className="text-xs font-bold text-rose-500 mt-1.5 tracking-wide">
                        {flight.fromCode}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        {flight.fromCity}
                      </p>
                    </div>

                    {/* Flight Path */}
                    <div className="flex-1 px-5 md:px-8 flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-2">
                        <FaClock className="text-[9px] text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-500">
                          {flight.duration}
                        </span>
                      </div>

                      {/* Path visual */}
                      <div className="w-full relative flex items-center h-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-[2px] bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 rounded-full" />
                        </div>

                        {/* Start dot */}
                        <div className="w-2.5 h-2.5 bg-white border-[2.5px] border-rose-400 rounded-full absolute left-0 z-10" />

                        {/* Plane */}
                        <div className="absolute left-1/2 -translate-x-1/2 bg-white px-1.5 z-10">
                          <FaPlane className="text-rose-500 text-xs" />
                        </div>

                        {/* Stop dots */}
                        {flight.stops > 0 && (
                          <div className="absolute left-[30%] top-1/2 -translate-y-1/2 z-10">
                            <div className="w-2 h-2 bg-white border-2 border-amber-500 rounded-full ring-2 ring-amber-100" />
                          </div>
                        )}

                        {/* End dot */}
                        <div className="w-2.5 h-2.5 bg-rose-400 rounded-full absolute right-0 z-10" />
                      </div>

                      <p
                        className={`text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full ${
                          flight.stops === 0
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-amber-700 bg-amber-50 border border-amber-200'
                        }`}
                      >
                        {flight.stopInfo}
                      </p>
                    </div>

                    {/* Arrival */}
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900 leading-none">
                        {flight.arrivalTime}
                      </p>
                      <p className="text-xs font-bold text-rose-500 mt-1.5 tracking-wide">
                        {flight.toCode}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        {flight.toCity}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ---- Price & CTA ---- */}
                <div
                  className="
                    w-full lg:w-auto
                    flex lg:flex-col items-center lg:items-end justify-between lg:justify-center
                    border-t lg:border-t-0 lg:border-l border-slate-100
                    pt-4 lg:pt-0 lg:pl-8
                    gap-3
                  "
                >
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5 hidden lg:block">
                      From
                    </p>
                    <p className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                      <span className="text-rose-500">$</span>
                      {flight.price}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">per person</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      onClick={handleClick}
                      className={`
                        ${button.primary}
                        w-full lg:w-40 h-11
                        rounded-xl
                        bg-rose-500 hover:bg-rose-600
                        text-white font-semibold text-sm
                        shadow-lg shadow-rose-200/50
                        group-hover:shadow-rose-300/50
                        transition-all duration-300
                        flex items-center justify-center gap-2
                        cursor-pointer
                      `}
                    >
                      Book Now
                      <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                      <FaLuggageCart className="text-slate-300" />
                      <span>20KG Baggage</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {sortedFlights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-5">
              <FaPlane className="text-rose-300 text-xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No flights found</h3>
            <p className="text-slate-400 text-sm mt-1.5">Try changing your search criteria.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default FlightTemplate;