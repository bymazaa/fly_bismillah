"use client";
import Image from "next/image";
import { partnersData } from "@/constant/data";
import { appTheme } from "@/constant/theme/global";

const Partners = () => {
  const { layout } = appTheme;

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-white via-gray-50/40 to-white">

      {/* ================= Decorative Background ================= */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-rose-50/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-50/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sky-50/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className={`${layout.container} relative z-10`}>

        {/* ================= Header ================= */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            Our Best
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            Trusted{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-rose-600">Partners</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
            </span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            We collaborate with trusted airlines, hotels, and travel service
            providers to deliver exceptional experiences.
          </p>
        </div>

        {/* ================= Partners Logo Grid ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
          {partnersData.map((partner, index) => (
            <div
              key={partner.id}
              className="group relative bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_40px_rgba(225,29,72,0.08)] hover:-translate-y-1.5 transition-all duration-500 flex items-center justify-center"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Top accent line on hover */}
              <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative w-28 h-14 md:w-32 md:h-16  opacity-60 group-hover:opacity-100 transition-all duration-500">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Partner name tooltip on hover */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 group-hover:-bottom-4 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg">
                {partner.name}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </div>
          ))}
        </div>

        {/* ================= Bottom Divider ================= */}
        <div className="flex items-center justify-center mt-16">
          <div className="h-px w-16 bg-gray-200" />
          <div className="w-2 h-2 bg-rose-400 rounded-full mx-4" />
          <div className="h-px w-16 bg-gray-200" />
        </div>
      </div>
    </section>
  );
};

export default Partners;