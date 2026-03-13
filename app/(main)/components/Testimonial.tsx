"use client";
import Image from "next/image";
import { testimonialsData } from "@/constant/data";
import { FaStar, FaQuoteLeft } from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";

const Testimonials = () => {
  const { colors, layout, typography } = appTheme;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        size={14}
        className={
          index < rating
            ? "text-amber-400 drop-shadow-sm"
            : "text-gray-200"
        }
      />
    ));
  };

  return (
    <section className="relative bg-gradient-to-b from-white via-rose-50/30 to-white py-24 lg:py-32 overflow-hidden">

      {/* ================= Decorative Background ================= */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-rose-100/40 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-50/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className={`${layout.container} relative z-10`}>

        {/* ================= Header ================= */}
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            Testimonials
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            What Our{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-rose-600">
                Happy Clients
              </span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
            </span>{" "}
            Say
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            We take pride in serving our guests with the utmost care.
            Here are some words from our satisfied travelers.
          </p>
        </div>

        {/* ================= Reviews Grid ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsData.map((item, index) => (
            <div
              key={item.id}
              className="group relative bg-white p-8 lg:p-10 rounded-3xl border border-gray-100 shadow-[0_4px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_60px_rgba(225,29,72,0.08)] hover:-translate-y-1.5 transition-all duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-8 right-8 h-[3px] bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Quote Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FaQuoteLeft className="text-rose-400 text-lg" />
              </div>

              {/* Stars */}
              <div className="flex gap-1.5 mb-5">{renderStars(item.rating)}</div>

              {/* Review Text */}
              <p className="text-gray-600 leading-[1.8] mb-8 text-[15px]">
                &ldquo;{item.review}&rdquo;
              </p>

              {/* User Info */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-rose-100 ring-offset-2 ring-offset-white">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base leading-tight mb-0.5">
                    {item.name}
                  </h4>
                  <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
                    {item.role}
                  </p>
                </div>
              </div>

              {/* Decorative corner circle */}
              <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-rose-50/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;