"use client";
import Image from "next/image";
import { aboutData } from "@/constant/data";
import { FaCheckCircle, FaPlay } from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";

const About = () => {
  const { layout } = appTheme;

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-white via-rose-50/20 to-white">

      {/* ================= Decorative Background ================= */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-50/40 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-50/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className={`${layout.container} relative z-10`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ================= Left Side: Image Composition ================= */}
          <div className="relative">

            {/* Background decorative shapes */}
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-rose-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-amber-100/40 rounded-full blur-2xl pointer-events-none" />

            {/* Main Large Image */}
            <div className="relative h-[420px] md:h-[520px] w-full md:w-[88%] rounded-3xl overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.08)] ring-1 ring-gray-100">
              <Image
                src="/asset/others/aboutbg.webp"
                alt="Makkah Clock Tower"
                fill
                className="object-cover group hover:scale-105 transition-transform duration-700"
              />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>

            {/* Secondary Overlapping Image */}
            <div className="hidden md:block absolute -bottom-8 right-0 w-[55%] h-[280px] rounded-2xl overflow-hidden border-[6px] border-white shadow-[0_12px_40px_rgba(0,0,0,0.1)] ring-1 ring-gray-100/50">
              <Image
                src="/asset/others/about-welcomwe.webp"
                alt="Happy Traveler"
                fill
                className="object-cover"
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
            </div>

            {/* Floating Experience Badge */}
            <div className="absolute top-8 right-2 md:right-[8%] bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-gray-100 group hover:shadow-[0_12px_50px_rgba(225,29,72,0.12)] transition-all duration-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                  <span className="text-white font-extrabold text-lg">
                    {aboutData.stats.years}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">
                    Years of
                  </p>
                  <p className="text-sm font-extrabold text-gray-900 leading-none">
                    {aboutData.stats.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Play Button (Decorative / Video trigger) */}
            <div className="absolute bottom-16 left-8 md:left-12 w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-[0_4px_30px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-rose-500 hover:shadow-[0_8px_40px_rgba(225,29,72,0.3)] transition-all duration-500 group/play">
              <FaPlay className="text-rose-500 text-sm ml-0.5 group-hover/play:text-white transition-colors" />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full border-2 border-rose-300/50 animate-ping pointer-events-none" />
            </div>

            {/* Decorative floating dots */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-rose-200 rounded-full"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          </div>

          {/* ================= Right Side: Content ================= */}
          <div className="flex flex-col justify-center">

            {/* Subtitle Badge */}
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 w-fit">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              {aboutData.subtitle}
            </div>

            {/* Main Title */}
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-gray-900 leading-[1.15] mb-6">
              We Are{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-rose-600">Dedicated</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
              </span>{" "}
              To Make Your Journey Spiritual
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-lg leading-[1.8] mb-10">
              {aboutData.description}
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {aboutData.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="group/feature flex items-center gap-3 bg-gray-50/80 hover:bg-rose-50/60 p-3.5 rounded-xl border border-transparent hover:border-rose-100 transition-all duration-300 cursor-default"
                >
                  <div className="w-8 h-8 bg-rose-50 group-hover/feature:bg-rose-100 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300">
                    <FaCheckCircle className="text-rose-500 text-sm" />
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 pt-8 border-t border-gray-100">
              <div className="text-center">
                <h4 className="text-3xl font-extrabold text-gray-900 mb-1">
                  5K<span className="text-rose-500">+</span>
                </h4>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Happy Clients
                </p>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div className="text-center">
                <h4 className="text-3xl font-extrabold text-gray-900 mb-1">
                  50<span className="text-rose-500">+</span>
                </h4>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Destinations
                </p>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div className="text-center">
                <h4 className="text-3xl font-extrabold text-gray-900 mb-1">
                  4.9
                  <span className="text-amber-400 text-lg ml-1">★</span>
                </h4>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Rating
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;