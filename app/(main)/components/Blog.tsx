"use client";
import Image from "next/image";
import Link from "next/link";
import { blogsData } from "@/constant/data";
import { FaCalendarAlt, FaUser, FaArrowRight } from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";

const Blog = () => {
  const { colors, layout, typography } = appTheme;

  return (
    <section className="relative bg-gradient-to-b from-white via-gray-50/50 to-white py-24 lg:py-32 overflow-hidden">

      {/* ================= Decorative Background ================= */}
      <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-rose-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-[400px] h-[400px] bg-sky-50/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className={`${layout.container} relative z-10`}>

        {/* ================= Section Header ================= */}
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            Our Blog
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            Latest{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-rose-600">Travel News</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
            </span>{" "}
            & Tips
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Stay updated with the latest travel guides, Hajj &amp; Umrah news,
            and exclusive offers.
          </p>
        </div>

        {/* ================= Blog Grid ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogsData.map((blog, index) => (
            <article
              key={blog.id}
              className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-[0_4px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_60px_rgba(225,29,72,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col h-full"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image Wrapper */}
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                {/* Date Badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-gray-700 shadow-lg flex items-center gap-2">
                  <FaCalendarAlt className="text-rose-500 text-[10px]" />
                  {blog.date}
                </div>

                {/* Category Badge (Optional) */}
                <div className="absolute top-4 right-4 bg-rose-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">
                  Travel
                </div>
              </div>

              {/* Content Wrapper */}
              <div className="p-7 flex flex-col flex-grow">
                {/* Author Meta */}
                <div className="flex items-center gap-2 text-[11px] font-semibold text-rose-500 mb-4 uppercase tracking-wider">
                  <div className="w-6 h-6 bg-rose-50 rounded-full flex items-center justify-center">
                    <FaUser className="text-[9px] text-rose-400" />
                  </div>
                  <span>By {blog.author}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-rose-600 transition-colors duration-300 leading-snug">
                  <Link href="#">{blog.title}</Link>
                </h3>

                {/* Excerpt */}
                <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                  {blog.excerpt}
                </p>

                {/* Read More Link */}
                <div className="pt-5 border-t border-gray-50">
                  <Link
                    href="#"
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-800 hover:text-rose-600 transition-colors group/link"
                  >
                    Read Full Article
                    <span className="w-7 h-7 bg-rose-50 rounded-full flex items-center justify-center group-hover/link:bg-rose-500 transition-all duration-300">
                      <FaArrowRight className="text-[10px] text-rose-500 group-hover/link:text-white group-hover/link:translate-x-0.5 transition-all duration-300" />
                    </span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;