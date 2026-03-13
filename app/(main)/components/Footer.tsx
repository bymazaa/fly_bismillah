'use client';

import Link from 'next/link';
import Image from 'next/image';
import { footerData, headerData } from '@/constant/data';
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaPinterest,
  FaYoutube,
  FaWhatsapp,
  FaArrowRight,
  FaArrowUp,
} from 'react-icons/fa';
import { appTheme } from '@/constant/theme/global';

const Footer = () => {
  const { colors, layout, button } = appTheme;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'map':
        return <FaMapMarkerAlt />;
      case 'phone':
        return <FaPhoneAlt />;
      case 'email':
        return <FaEnvelope />;
      case 'facebook':
        return <FaFacebookF />;
      case 'twitter':
        return <FaTwitter />;
      case 'pinterest':
        return <FaPinterest />;
      case 'instagram':
        return <FaInstagram />;
      case 'youtube':
        return <FaYoutube />;
      case 'whatsapp':
        return <FaWhatsapp />;
      default:
        return <FaLinkedinIn />;
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative print:hidden bg-gray-950 text-white overflow-hidden">
      {/* ═══════════ Background Elements ═══════════ */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

   
      {/* ═══════════ Main Footer Content ═══════════ */}
      <div
        className={`${layout.container} relative z-10 pt-16 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12`}
      >
        {/* Column 1: Brand */}
        <div className="space-y-5">
          <Link href="/" className="inline-block">
            <Image
              height={160}
              width={160}
              alt="Fly Bismillah Logo"
              src="/logo.jpg"
              className="rounded-xl"
            />
          </Link>

          <p className="text-sm text-gray-400 leading-[1.8] pr-4">
            {footerData.about.text}
          </p>

          {/* Social Icons */}
          <div className="flex gap-2 pt-2">
            {headerData.socialLinks.map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="group w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800/80 text-gray-500 hover:bg-rose-600 hover:text-white border border-gray-800 hover:border-rose-500 transition-all duration-300 hover:scale-105"
              >
                <span className="text-sm">{getIcon(social.icon)}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Contact */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-300 mb-6 flex items-center gap-2">
            <span className="w-6 h-px bg-rose-600" />
            {footerData.contact.title}
          </h3>

          <ul className="space-y-4">
            {footerData.contact.info.map((item, idx) => (
              <li key={idx} className="group flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800/80 border border-gray-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-600/10 group-hover:border-rose-600/30 transition-all duration-300">
                  <span className="text-rose-500 text-xs">
                    {getIcon(item.icon)}
                  </span>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-300 leading-relaxed transition-colors">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Support Links */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-300 mb-6 flex items-center gap-2">
            <span className="w-6 h-px bg-rose-600" />
            {footerData.support.title}
          </h3>

          <ul className="space-y-3">
            {footerData.support.links.map((link, idx) => (
              <li key={idx}>
                <Link
                  href={link.href}
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all duration-300"
                >
                  <FaArrowRight className="text-[8px] text-gray-700 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all duration-300" />
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: QR / App */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-300 mb-6 flex items-center gap-2">
            <span className="w-6 h-px bg-rose-600" />
            {footerData.getApp.title}
          </h3>

          <p className="text-sm text-gray-400 mb-5 leading-relaxed">
            {footerData.getApp.text}
          </p>

          <div className="w-32 h-32 rounded-2xl overflow-hidden border border-gray-800 bg-white p-1.5 shadow-lg shadow-black/20">
            <Image
              src="/siteqrwebp.webp"
              width={200}
              height={200}
              alt="Scan QR Code"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <p className="text-[11px] text-gray-600 mt-3">
            Scan to visit our website
          </p>
        </div>
      </div>

      {/* ═══════════ Bottom Bar ═══════════ */}
      <div className="relative z-10 border-t border-gray-800/80">
        <div
          className={`${layout.container} py-5 flex flex-col md:flex-row justify-between items-center gap-4`}
        >
          {/* Copyright */}
          <p className="text-xs text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} {footerData.bottomBar.copyright}
          </p>

          {/* Developer Credit */}
          <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
            Crafted with
            <span className="text-rose-500 text-xs">♥</span>
            by
            <Link
              href="https://mazaharul.site"
              target="_blank"
              className="text-gray-400 hover:text-white font-semibold transition-colors"
            >
              MazaSoft
            </Link>
          </p>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            className="group flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-all duration-300"
          >
            Back to top
            <span className="w-7 h-7 rounded-lg bg-gray-800 group-hover:bg-rose-600 border border-gray-700 group-hover:border-rose-500 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-0.5">
              <FaArrowUp className="text-[10px]" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;