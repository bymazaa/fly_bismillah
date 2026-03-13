
import Image from 'next/image';
import Link from 'next/link';
import { aboutPageData } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { FaBullseye, FaEye, FaArrowRight, FaPlay } from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi2';
import Stats from '../components/Stats';

const Page = () => {
  const { layout, button } = appTheme;


  return (
    <main className="bg-white min-h-screen">
      {/* ═══════════ 1. Hero Section ═══════════ */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center overflow-hidden bg-gray-950">
        <Image
          src={aboutPageData.hero.bgImage}
          alt="About Hero"
          fill
          quality={100}
          className="object-cover opacity-30"
          priority
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 to-transparent" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div
          className={`${layout.container} relative z-10 py-20 md:py-28`}
        >
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
              <HiOutlineSparkles className="text-rose-400 text-sm" />
              <span className="text-[13px] font-medium text-gray-300 tracking-wide">
                About Us
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              {aboutPageData.hero.title}
            </h1>

            <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mb-8">
              {aboutPageData.hero.subtitle}
            </p>

            {/* Quick actions */}
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/contact">
                <Button
                  className={`${button.primary} cursor-pointer px-7 h-12 rounded-xl font-semibold shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/25 hover:-translate-y-0.5 transition-all duration-300`}
                >
                  Get in Touch
                  <FaArrowRight className="ml-2 text-xs" />
                </Button>
              </Link>

              <Link
                href="/packages"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white font-semibold text-sm transition-colors group"
              >
                <span className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
                  <FaPlay className="text-[10px] ml-0.5" />
                </span>
                View Our Packages
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ═══════════ 2. Intro & Skills ═══════════ */}
      <section className={`${layout.sectionPadding} ${layout.container}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Image */}
          <div className="relative">
            <div className="relative h-[480px] md:h-[540px] w-full rounded-3xl overflow-hidden group">
              <Image
                src={aboutPageData.intro.image}
                alt="Travel Agency Office"
                fill
                className="object-cover group-hover:scale-[1.03] transition-transform duration-[1.5s] ease-out"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-5 right-4 md:-right-5 bg-white p-5 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 hidden md:flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-rose-600 flex items-center justify-center">
                <span className="text-white text-xl font-extrabold">1M+</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  Travelers Monthly
                </p>
                <p className="text-xs text-gray-500">And growing fast</p>
              </div>
            </div>

            {/* Decorative dots */}
            <div className="absolute -top-4 -left-4 w-24 h-24 hidden lg:grid grid-cols-4 gap-2 opacity-20">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-rose-500"
                />
              ))}
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 mb-4">
              <HiOutlineSparkles className="text-rose-500 text-xs" />
              <span className="text-[12px] font-semibold text-rose-600 uppercase tracking-wider">
                {aboutPageData.intro.title}
              </span>
            </div>

            <h2
              className={`text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5`}
            >
              {aboutPageData.intro.heading}
            </h2>

            <p className="text-gray-600 text-[15px] leading-[1.8] mb-8">
              {aboutPageData.intro.description1}
            </p>

            {/* Mission & Vision Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {aboutPageData.missionVision.map((item, idx) => (
                <div
                  key={idx}
                  className="group p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 group-hover:bg-rose-600 flex items-center justify-center transition-colors duration-300">
                      {item.icon === 'mission' ? (
                        <FaBullseye className="text-white text-xs" />
                      ) : (
                        <FaEye className="text-white text-xs" />
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Progress Bars */}
            <div className="space-y-5">
              {aboutPageData.skills.map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-gray-800">
                      {skill.label}
                    </span>
                    <span className="text-sm font-bold text-gray-400">
                      {skill.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${skill.percentage}%`,
                        background:
                          'linear-gradient(90deg, #e11d48 0%, #f43f5e 100%)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link href="/contact">
                <Button
                  className={`${button.primary} cursor-pointer px-7 h-12 rounded-xl font-semibold shadow-lg shadow-rose-500/15 hover:shadow-xl hover:shadow-rose-500/20 hover:-translate-y-0.5 transition-all duration-300`}
                >
                  Contact Us Today
                  <FaArrowRight className="ml-2 text-xs" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 3. Stats ═══════════ */}
      <Stats />

      {/* ═══════════ 4. How It Works ═══════════ */}
      <section className={`${layout.sectionPadding} bg-gray-50`}>
        <div className={layout.container}>
          {/* Section Header */}
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 mb-4">
              <HiOutlineSparkles className="text-rose-500 text-xs" />
              <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
              {aboutPageData.steps.title}
            </h2>
            <p className="text-gray-500 text-[15px] leading-relaxed">
              {aboutPageData.steps.desc}
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gray-200 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
            </div>

            {aboutPageData.steps.items.map((step, idx) => (
              <div
                key={idx}
                className="relative z-10 group"
              >
                <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/50 hover:-translate-y-2 transition-all duration-500 text-center h-full">
                  {/* Number */}
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 group-hover:bg-gray-900 border border-gray-100 group-hover:border-gray-900 flex items-center justify-center mb-6 transition-all duration-300 shadow-sm">
                    <span className="text-2xl font-extrabold text-gray-300 group-hover:text-white transition-colors duration-300">
                      {String(step.id).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 5. Mission & Vision ═══════════ */}
      <section className={`${layout.sectionPadding} ${layout.container}`}>
        {/* Section Header */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 mb-4">
            <HiOutlineSparkles className="text-rose-500 text-xs" />
            <span className="text-[12px] font-semibold text-rose-600 uppercase tracking-wider">
              Our Purpose
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
            What Drives Us Forward
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mission Card */}
          <div className="group relative rounded-3xl overflow-hidden bg-gray-950 text-white p-8 md:p-10 hover:shadow-2xl hover:shadow-gray-900/20 transition-all duration-500">
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            {/* Gradient orb */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FaBullseye className="text-white text-lg" />
              </div>

              <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                Our Mission
              </p>

              <h3 className="text-2xl font-bold mb-4 leading-tight">
                Delivering Excellence in Travel
              </h3>

              <p className="text-gray-400 leading-[1.8] text-[15px]">
                {aboutPageData.missionVision[0].text}
              </p>

              {/* Decorative line */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-950 flex items-center justify-center text-[10px] font-bold text-gray-500"
                      >
                        ✓
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Trusted by thousands of travelers
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vision Card */}
          <div className="group relative rounded-3xl overflow-hidden border border-gray-100 bg-white p-8 md:p-10 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-500">
            {/* Subtle background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gray-900 group-hover:bg-rose-600 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:scale-110 transition-transform">
                <FaEye className="text-white text-lg" />
              </div>

              <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-2">
                Our Vision
              </p>

              <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                Shaping the Future of Travel
              </h3>

              <p className="text-gray-600 leading-[1.8] text-[15px]">
                {aboutPageData.missionVision[1].text}
              </p>

              {/* Decorative line */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {['Innovation', 'Trust', 'Growth'].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 6. CTA Section ═══════════ */}
      <section className="bg-gray-950 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div
          className={`${layout.container} py-20 md:py-28 relative z-10 text-center`}
        >
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
              <HiOutlineSparkles className="text-rose-400 text-xs" />
              <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                Start Your Journey
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
              Ready to Explore the World?
            </h2>

            <p className="text-gray-400 text-lg leading-relaxed mb-10">
              Let us handle every detail of your trip so you can focus on
              creating unforgettable memories.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/packages">
                <Button
                  className={`${button.primary} cursor-pointer px-8 h-13 text-[15px] rounded-xl font-bold shadow-xl shadow-rose-500/20 hover:shadow-2xl hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300`}
                >
                  View Packages
                  <FaArrowRight className="ml-2 text-xs" />
                </Button>
              </Link>

              <Link href="/contact">
                <Button
                  variant="outline"
                  className="px-8 cursor-pointer h-13 text-[15px] text-black rounded-xl font-bold  border-white/20 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;