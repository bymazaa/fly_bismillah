"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FaSearch,
  FaPassport,
  FaClock,
  FaCheckCircle,
  FaPlaneDeparture,
  FaFileAlt,
  FaTimes,
  FaGlobeAmericas,
  FaInfoCircle,
  FaListUl,
  FaCalendarAlt,
  FaShieldAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";
import { visaPackages, VisaType } from "@/constant/visa";

const VisaPage = () => {
  const { layout } = appTheme;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisa, setSelectedVisa] = useState<VisaType | null>(null);

  const filteredVisas = visaPackages.filter((v) =>
    v.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Visa process steps
  const visaSteps = [
    {
      step: "01",
      icon: FaFileAlt,
      title: "Gather Documents",
      desc: "Collect all required documents including passport, photos, bank statements, and invitation letters as per your destination country.",
      color: "rose",
    },
    {
      step: "02",
      icon: FaListUl,
      title: "Fill Application",
      desc: "Complete the visa application form accurately. Ensure all information matches your passport and supporting documents.",
      color: "blue",
    },
    {
      step: "03",
      icon: FaCalendarAlt,
      title: "Book Appointment",
      desc: "Schedule your visa appointment at the embassy or visa application center. Some countries allow online submission.",
      color: "amber",
    },
    {
      step: "04",
      icon: FaShieldAlt,
      title: "Biometrics & Interview",
      desc: "Attend your appointment for biometric data collection and interview (if required). Be prepared to answer questions about your trip.",
      color: "emerald",
    },
    {
      step: "05",
      icon: FaClock,
      title: "Processing Period",
      desc: "Wait for the embassy to process your application. Processing times vary by country — from 3 business days to 8+ weeks.",
      color: "violet",
    },
    {
      step: "06",
      icon: FaCheckCircle,
      title: "Receive Your Visa",
      desc: "Once approved, collect your passport with the visa stamp or receive your e-Visa via email. Verify all details before travel.",
      color: "sky",
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; ring: string; border: string }> = {
    rose: { bg: "bg-rose-50", icon: "text-rose-500", ring: "ring-rose-100", border: "border-rose-100" },
    blue: { bg: "bg-blue-50", icon: "text-blue-500", ring: "ring-blue-100", border: "border-blue-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-500", ring: "ring-amber-100", border: "border-amber-100" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", ring: "ring-emerald-100", border: "border-emerald-100" },
    violet: { bg: "bg-violet-50", icon: "text-violet-500", ring: "ring-violet-100", border: "border-violet-100" },
    sky: { bg: "bg-sky-50", icon: "text-sky-500", ring: "ring-sky-100", border: "border-sky-100" },
  };

  // Tips data
  const visaTips = [
    "Apply at least 4-8 weeks before your planned travel date.",
    "Ensure your passport is valid for at least 6 months beyond your travel dates.",
    "Keep photocopies of all submitted documents for your records.",
    "Bank statements should show consistent income for the last 3-6 months.",
    "Provide a clear travel itinerary with hotel bookings and return flight.",
    "Never provide false information — it can lead to permanent visa bans.",
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-gray-50/30 to-white">

      {/* ================= Decorative Background ================= */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-rose-50/25 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-50/30 rounded-full blur-[100px] pointer-events-none" />

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* ================= Hero Section ================= */}
      <section className="relative pt-32 pb-28 overflow-hidden">

        {/* Hero Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop"
            alt="Visa Information Background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/85 to-gray-900/95" />

          {/* Grid pattern on hero */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className={`${layout.container} relative z-10 text-center`}>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2.5 rounded-full mb-8">
            <FaGlobeAmericas className="text-rose-400" />
            Visa Information Guide
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 max-w-3xl mx-auto">
            Everything You Need to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300">
              Know About Visas
            </span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            Explore visa requirements, processing times, and documentation
            guides for countries around the world. Your complete visa
            information resource.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search country (e.g. Dubai, Malaysia, UK)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-16 pl-7 pr-16 rounded-2xl bg-white/95 backdrop-blur-md text-gray-900 font-semibold outline-none focus:ring-4 ring-rose-500/30 transition-all shadow-2xl text-base placeholder:text-gray-400 placeholder:font-normal"
              />
              <div className="absolute right-2 top-2 h-12 w-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-rose-200/50">
                <FaSearch />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Stats Banner ================= */}
      <div className={`${layout.container} -mt-10 relative z-20`}>
        <div className="bg-white rounded-2xl shadow-[0_8px_60px_rgba(0,0,0,0.06)] p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 border border-gray-100">
          {[
            {
              icon: FaPassport,
              title: "Comprehensive Info",
              desc: "Detailed visa guides for 50+ countries",
              color: "rose",
            },
            {
              icon: FaClock,
              title: "Processing Times",
              desc: "Accurate & up-to-date timelines",
              color: "blue",
            },
            {
              icon: FaCheckCircle,
              title: "Document Checklists",
              desc: "Complete requirement lists per country",
              color: "emerald",
            },
          ].map((stat, idx) => {
            const c = colorMap[stat.color] || colorMap.rose;
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center shrink-0 ring-2 ${c.ring} ring-offset-1 ring-offset-white`}
                >
                  <Icon className={`text-xl ${c.icon}`} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    {stat.title}
                  </h4>
                  <p className="text-sm text-gray-500">{stat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= How Visa Process Works ================= */}
      <section className="relative z-10 py-24">
        <div className={layout.container}>

          {/* Section Header */}
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              Step by Step
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
              How the Visa{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-rose-600">Process</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
              </span>{" "}
              Works
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Understanding the general visa application process helps you
              prepare better and avoid delays.
            </p>
          </div>

          {/* Process Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visaSteps.map((item, index) => {
              const c = colorMap[item.color] || colorMap.rose;
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_50px_rgba(225,29,72,0.07)] hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden"
                >
                  {/* Top accent */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] ${c.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  {/* Step number watermark */}
                  <span className="absolute top-4 right-6 text-6xl font-black text-gray-50 group-hover:text-rose-50 transition-colors duration-500 select-none pointer-events-none">
                    {item.step}
                  </span>

                  {/* Icon */}
                  <div
                    className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center mb-5 ring-2 ${c.ring} ring-offset-1 ring-offset-white group-hover:scale-110 transition-transform duration-300 relative z-10`}
                  >
                    <Icon className={`text-lg ${c.icon}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-extrabold text-gray-900 mb-2 relative z-10">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed relative z-10">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= Country Visa Information Grid ================= */}
      <section className="relative z-10 pb-24">
        <div className={layout.container}>

          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Country Guides
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                Visa Requirements by{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-rose-600">Country</span>
                  <span className="absolute bottom-0.5 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
                </span>
              </h2>
              <p className="text-gray-500 mt-3 text-base">
                Select a country to view detailed visa information and
                document requirements.
              </p>
            </div>

            <div className="text-sm font-bold text-gray-400 bg-white border border-gray-100 px-5 py-2.5 rounded-xl shadow-sm shrink-0">
              {filteredVisas.length} Countries
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredVisas.length > 0 ? (
              filteredVisas.map((visa) => (
                <div
                  key={visa.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_50px_rgba(225,29,72,0.07)] hover:-translate-y-1.5 transition-all duration-500"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={visa.image}
                      alt={visa.country}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                    {/* Visa Type Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-gray-700 shadow-md">
                      {visa.visaType}
                    </div>

                    {/* Country Name */}
                    <div className="absolute bottom-4 left-5 z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <FaMapMarkerAlt className="text-rose-400 text-xs" />
                        <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                          Destination
                        </span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-white drop-shadow-lg">
                        {visa.country}
                      </h3>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-blue-50/60 border border-blue-100/60 p-3 rounded-xl text-center">
                        <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider mb-1">
                          Processing
                        </p>
                        <p className="text-xs font-bold text-gray-800">
                          {visa.processingTime}
                        </p>
                      </div>
                      <div className="bg-violet-50/60 border border-violet-100/60 p-3 rounded-xl text-center">
                        <p className="text-[9px] text-violet-500 font-bold uppercase tracking-wider mb-1">
                          Validity
                        </p>
                        <p className="text-xs font-bold text-gray-800">
                          {visa.validity}
                        </p>
                      </div>
                      <div className="bg-amber-50/60 border border-amber-100/60 p-3 rounded-xl text-center">
                        <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wider mb-1">
                          Max Stay
                        </p>
                        <p className="text-xs font-bold text-gray-800">
                          {visa.maxStay}
                        </p>
                      </div>
                    </div>

                    {/* Requirements Preview */}
                    <div className="space-y-2 mb-5">
                      {visa.requirements.slice(0, 3).map((req, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 text-sm"
                        >
                          <FaCheckCircle className="text-emerald-400 text-xs mt-1 shrink-0" />
                          <span className="text-gray-600 text-xs leading-relaxed line-clamp-1">
                            {req}
                          </span>
                        </div>
                      ))}
                      {visa.requirements.length > 3 && (
                        <p className="text-[11px] text-gray-400 font-semibold pl-5">
                          +{visa.requirements.length - 3} more requirements
                        </p>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => setSelectedVisa(visa)}
                      className="w-full py-3.5 cursor-pointer bg-gray-50 hover:bg-rose-50 border border-gray-100 hover:border-rose-200 rounded-xl text-sm font-bold text-gray-700 hover:text-rose-600 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                    >
                      <FaInfoCircle className="text-gray-400 group-hover/btn:text-rose-500 transition-colors" />
                      View Full Requirements
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-2 ring-gray-100 ring-offset-2 ring-offset-white">
                  <FaSearch className="text-2xl text-gray-300" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                  No Countries Found
                </h3>
                <p className="text-gray-500 text-sm">
                  Try adjusting your search terms or browse all destinations.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-5 px-6 py-2.5 cursor-pointer bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-xl hover:bg-rose-100 transition-colors"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= Visa Tips Section ================= */}
      <section className="relative z-10 pb-24">
        <div className={`${layout.container} max-w-4xl mx-auto`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_40px_rgba(0,0,0,0.04)] overflow-hidden">

            {/* Tips Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/50 p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm ring-2 ring-amber-100 ring-offset-1 ring-offset-amber-50 shrink-0">
                  <FaInfoCircle className="text-amber-500 text-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                    Important Visa Tips
                  </h3>
                  <p className="text-sm text-gray-500">
                    Follow these tips to increase your visa approval chances.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips List */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visaTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-gray-50/80 hover:bg-amber-50/40 p-4 rounded-xl border border-transparent hover:border-amber-100 transition-all duration-300"
                  >
                    <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-500 text-xs font-extrabold">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Disclaimer Section ================= */}
      <section className="relative z-10 pb-24">
        <div className={`${layout.container} max-w-4xl mx-auto`}>
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl p-10 md:p-14 relative overflow-hidden">

            {/* Decorative */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/15 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-600/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative z-10 text-center">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
                <FaShieldAlt className="text-xl text-rose-400" />
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                Disclaimer
              </h3>
              <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
                The visa information provided on this page is for general
                guidance only. Requirements, processing times, and fees are
                subject to change without notice. Always verify the latest
                requirements directly with the embassy or consulate of your
                destination country. Bismillah Travels and Tour does not
                guarantee visa approval.
              </p>

              <div className="flex items-center justify-center gap-3 mt-8">
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/10 text-gray-300 text-xs font-bold px-4 py-2 rounded-full">
                  <FaGlobeAmericas className="text-rose-400 text-[10px]" />
                  Bismillah Travels and Tour
                </span>
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/10 text-gray-300 text-xs font-bold px-4 py-2 rounded-full">
                  <FaPassport className="text-amber-400 text-[10px]" />
                  USA Based Agency
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Requirements Detail Modal ================= */}
      {selectedVisa && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl relative flex flex-col overflow-hidden border border-gray-100">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white/98 backdrop-blur z-10 px-7 py-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FaMapMarkerAlt className="text-rose-500 text-xs" />
                  <span className="text-[11px] text-rose-500 font-bold uppercase tracking-wider">
                    Visa Information
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  {selectedVisa.country}
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  {selectedVisa.visaType}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisa(null)}
                className="w-10 h-10 cursor-pointer bg-gray-50 hover:bg-red-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shrink-0"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-7 space-y-7 overflow-y-auto">

              {/* Key Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Processing Time",
                    value: selectedVisa.processingTime,
                    color: "blue",
                    icon: FaClock,
                  },
                  {
                    label: "Visa Validity",
                    value: selectedVisa.validity,
                    color: "violet",
                    icon: FaCalendarAlt,
                  },
                  {
                    label: "Maximum Stay",
                    value: selectedVisa.maxStay,
                    color: "amber",
                    icon: FaPlaneDeparture,
                  },
                ].map((info, idx) => {
                  const c = colorMap[info.color] || colorMap.rose;
                  const Icon = info.icon;
                  return (
                    <div
                      key={idx}
                      className={`${c.bg} border ${c.border} p-4 rounded-xl text-center`}
                    >
                      <Icon
                        className={`${c.icon} text-sm mx-auto mb-2`}
                      />
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                        {info.label}
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        {info.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Required Documents */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center ring-2 ring-rose-100 ring-offset-1 ring-offset-white">
                    <FaFileAlt className="text-rose-500 text-sm" />
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    Required Documents
                  </h3>
                </div>

                <div className="space-y-3">
                  {selectedVisa.requirements.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 bg-gray-50/80 hover:bg-emerald-50/40 p-4 rounded-xl border border-transparent hover:border-emerald-100 transition-all duration-300"
                    >
                      <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                        <FaCheckCircle className="text-emerald-400 text-[10px]" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 leading-relaxed">
                        {doc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-amber-50/60 border border-amber-100 p-5 rounded-xl">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">
                      Important Note
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Requirements may vary based on nationality, purpose of
                      visit, and applicant profile. Always verify with the
                      official embassy or consulate before applying. Processing
                      times are estimates and may vary during peak seasons.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50/95 backdrop-blur px-7 py-5 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-400 font-medium max-w-xs">
                  Information is for guidance only. Verify with the embassy
                  before applying.
                </p>
                <button
                  onClick={() => setSelectedVisa(null)}
                  className="px-6 py-3 cursor-pointer bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default VisaPage;