"use client";

import { statsData } from "@/constant/data";
import { appTheme } from "@/constant/theme/global";
import {
  FaUserFriends,
  FaMapMarkedAlt,
  FaThumbsUp,
  FaStar,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

const Stats = () => {
  const { layout } = appTheme;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "users":
        return FaUserFriends;
      case "map":
        return FaMapMarkedAlt;
      case "like":
        return FaThumbsUp;
      default:
        return FaStar;
    }
  };

  const cardAccents = [
    {
      gradient: "from-rose-500 to-pink-500",
      light: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-100",
      shadow: "shadow-rose-500/20",
      glow: "bg-rose-500/10",
      hoverBorder: "hover:border-rose-200",
      hoverShadow: "hover:shadow-rose-100",
    },
    {
      gradient: "from-orange-500 to-amber-500",
      light: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-100",
      shadow: "shadow-orange-500/20",
      glow: "bg-orange-500/10",
      hoverBorder: "hover:border-orange-200",
      hoverShadow: "hover:shadow-orange-100",
    },
    {
      gradient: "from-red-500 to-rose-500",
      light: "bg-red-50",
      text: "text-red-600",
      border: "border-red-100",
      shadow: "shadow-red-500/20",
      glow: "bg-red-500/10",
      hoverBorder: "hover:border-red-200",
      hoverShadow: "hover:shadow-red-100",
    },
    {
      gradient: "from-pink-500 to-rose-500",
      light: "bg-pink-50",
      text: "text-pink-600",
      border: "border-pink-100",
      shadow: "shadow-pink-500/20",
      glow: "bg-pink-500/10",
      hoverBorder: "hover:border-pink-200",
      hoverShadow: "hover:shadow-pink-100",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white">
      {/* ===== Background Decorations ===== */}

      {/* Soft Gradient Orbs */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] bg-rose-100/40 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-150px] left-[-80px] w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-50/40 rounded-full blur-[150px]" />

      {/* Dot Pattern */}
      <div className="absolute inset-0 opacity-[0.35]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className={`${layout.container} relative z-10 py-24 lg:py-32`}>
        {/* ===== Header ===== */}
        <div className="text-center mb-20 max-w-2xl mx-auto space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-xs font-bold uppercase tracking-widest">
            <HiSparkles className="text-sm animate-pulse" />
            Our Achievements
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
            Numbers That{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
                Speak
              </span>
              <span className="absolute -bottom-1.5 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 rounded-full opacity-30" />
            </span>{" "}
            For Us
          </h2>

          <p className="text-gray-500 text-lg leading-relaxed max-w-lg mx-auto">
            Our journey in numbers — delivering excellence every step of the
            way.
          </p>
        </div>

        {/* ===== Stats Grid ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {statsData.map((stat, index) => {
            const accent = cardAccents[index % cardAccents.length];
            const IconComp = getIcon(stat.icon);

            return (
              <div key={stat.id} className="group relative">
                {/* Hover Glow */}
                <div
                  className={`absolute -inset-1 rounded-3xl ${accent.glow} opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700`}
                />

                <div
                  className={`relative bg-white border border-gray-100 ${accent.hoverBorder} rounded-3xl p-8 lg:p-10 flex flex-col items-center text-center overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500`}
                >
                  {/* Top Gradient Line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accent.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  {/* Icon Container */}
                  <div className="relative mb-7">
                    {/* Glow Ring */}
                    <div
                      className={`absolute inset-0 rounded-2xl ${accent.glow} scale-[2] opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700`}
                    />

                    <div
                      className={`relative w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${accent.gradient} flex items-center justify-center shadow-lg ${accent.shadow} group-hover:scale-110 group-hover:shadow-xl transition-all duration-500`}
                    >
                      <IconComp className="text-2xl text-white" />
                    </div>

                    {/* Dot Decoration */}
                    <div
                      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r ${accent.gradient} opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100`}
                    />
                  </div>

                  {/* Value */}
                  <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
                    {stat.value}
                  </h3>

                  {/* Divider */}
                  <div
                    className={`w-8 h-0.5 rounded-full bg-gradient-to-r ${accent.gradient} mb-3 group-hover:w-14 transition-all duration-500`}
                  />

                  {/* Label */}
                  <p className="text-gray-400 uppercase tracking-[0.15em] text-[11px] font-bold group-hover:text-gray-600 transition-colors duration-300">
                    {stat.label}
                  </p>

                  {/* Bottom Corner Glow */}
                  <div
                    className={`absolute -bottom-8 -right-8 w-36 h-36 rounded-full ${accent.glow} opacity-0 group-hover:opacity-50 blur-2xl transition-all duration-700 pointer-events-none`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== Bottom Trust Line ===== */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {[
            "Trusted Worldwide",
            "Award Winning",
            "Premium Service",
            "24/7 Available",
          ].map((text, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-widest"
            >
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;