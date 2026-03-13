"use client";
import { useState } from "react";
import Link from "next/link";
import { appTheme } from "@/constant/theme/global";
import { Button } from "@/components/ui/button";
import { FaPlus, FaMinus, FaHeadset } from "react-icons/fa";
import { HelpCircle } from "lucide-react";
import { faqData } from "@/constant/policy";

const FaqPage = () => {
  const { layout, button } = appTheme;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-rose-50/20 to-white">

      {/* ================= Decorative Background ================= */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-rose-100/30 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-sky-50/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 py-20 lg:py-28">

        {/* ================= Header ================= */}
        <div className={`${layout.container} text-center mb-20 max-w-2xl mx-auto`}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-50 to-rose-100/60 rounded-2xl mb-6 ring-4 ring-rose-100 ring-offset-2 ring-offset-white">
            <HelpCircle className="w-7 h-7 text-rose-500" />
          </div>

          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            Help Center
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            {faqData.header.title.includes("Asked") ? (
              <>
                Frequently{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-rose-600">Asked</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
                </span>{" "}
                Questions
              </>
            ) : (
              <span>{faqData.header.title}</span>
            )}
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            {faqData.header.subtitle}
          </p>
        </div>

        {/* ================= FAQ Accordion ================= */}
        <div className={`${layout.container} max-w-3xl mx-auto`}>
          <div className="space-y-4">
            {faqData.items.map((item, index) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all duration-500 overflow-hidden ${
                  openIndex === index
                    ? "border-rose-200 shadow-[0_8px_40px_rgba(225,29,72,0.06)]"
                    : "border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:border-rose-100 hover:shadow-[0_4px_30px_rgba(225,29,72,0.04)]"
                }`}
              >
                {/* Top accent on active */}
                {openIndex === index && (
                  <div className="h-[3px] bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400" />
                )}

                {/* Question */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none group"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                        openIndex === index
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                          : "bg-gray-50 text-gray-400 group-hover:bg-rose-50 group-hover:text-rose-500"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`text-base md:text-lg font-bold transition-colors ${
                        openIndex === index ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {item.question}
                    </span>
                  </div>

                  <span
                    className={`ml-4 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      openIndex === index
                        ? "bg-rose-500 text-white rotate-0 shadow-lg shadow-rose-200"
                        : "bg-gray-50 text-gray-400 group-hover:bg-rose-50 group-hover:text-rose-500"
                    }`}
                  >
                    {openIndex === index ? (
                      <FaMinus className="text-xs" />
                    ) : (
                      <FaPlus className="text-xs" />
                    )}
                  </span>
                </button>

                {/* Answer */}
                <div
                  className={`transition-all duration-500 ease-in-out ${
                    openIndex === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-6 pl-[4.5rem]">
                    <p className="text-gray-500 leading-[1.8] text-[15px]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= Bottom CTA ================= */}
        <div className={`${layout.container} max-w-3xl mx-auto mt-20`}>
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl p-10 md:p-14 text-center overflow-hidden">

            {/* Decorative */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/15 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-600/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(#ffffff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
                <FaHeadset className="text-2xl text-rose-400" />
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                {faqData.cta.title}
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                {faqData.cta.text}
              </p>

              <Link href={faqData.cta.link}>
                <Button className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 py-6 text-base rounded-xl shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:-translate-y-0.5">
                  {faqData.cta.btnText}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default FaqPage;