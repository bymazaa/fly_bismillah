'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { headerData } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';
import Image from 'next/image';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { MdAirplaneTicket, MdOutlineAirplaneTicket } from 'react-icons/md';

import {
  FaPhoneAlt,
  FaEnvelope,
  FaBars,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaChevronRight,
  FaHome,
  FaPlaneDeparture,
  FaHotel,
  FaKaaba,
  FaInfoCircle,
  FaHeadset,
  FaYoutube,
  FaPinterest,
  FaWhatsapp,
  FaArrowRight,
  FaGlobeAmericas,
  FaSuitcaseRolling,
  FaConciergeBell,
  FaPassport,
  FaMapMarkedAlt,
} from 'react-icons/fa';

import { Loader2, LogOut, User, LayoutDashboard, Shield } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { IoMdArrowDropdown } from 'react-icons/io';

const Navbar = () => {
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { layout, button: btnTheme } = appTheme;

  const [user, setUser] = useState<{
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        const data = await res.json();
        if (data.success && data.data?.profile) {
          setUser(data.data.profile);
        } else {
          setUser(null);
          if (res.status === 403 || res.status === 401) {
            console.warn('Auth issue:', data.message);
          }
        }
      } catch (error) {
        console.error('Profile fetch failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setShowLogoutModal(false);
      setMobileMenuOpen(false);
      router.push('/access');
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isActive = (href: string) => {
    if (href === '/') return pathName === '/';
    if (href.includes('?')) {
      const [basePath, queryString] = href.split('?');
      const linkParams = new URLSearchParams(queryString);
      const currentParams = new URLSearchParams(searchParams?.toString() || '');
      if (pathName !== basePath) return false;
      for (const [key, value] of Array.from(linkParams.entries())) {
        if (currentParams.get(key) !== value) return false;
      }
      return true;
    }
    return pathName === href || (pathName.startsWith(href) && href !== '/');
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'whatsapp':
        return <FaWhatsapp />;
      case 'facebook':
        return <FaFacebookF />;
      case 'twitter':
        return <FaTwitter />;
      case 'instagram':
        return <FaInstagram />;
      case 'youtube':
        return <FaYoutube />;
      default:
        return <FaPinterest />;
    }
  };

  const firstLetter = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <header className="w-full relative bg-white print:hidden z-50">
        {/* ═══════════ Top Bar — Soft Gradient ═══════════ */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-slate-300 hidden md:block">
          <div
            className={`${layout.container} flex justify-between items-center h-10`}
          >
            <div className="flex items-center divide-x divide-slate-700/50">
              <a
                href={`mailto:${headerData.contact.email}`}
                className="flex items-center gap-2.5 pr-5 text-[11.5px] font-medium hover:text-white transition-all duration-300 cursor-pointer group"
              >
                <div className="w-5 h-5 rounded-md bg-white/[0.07] flex items-center justify-center group-hover:bg-rose-500/20 transition-all duration-300">
                  <FaEnvelope className="text-rose-400 text-[8px] group-hover:text-rose-300" />
                </div>
                {headerData.contact.email}
              </a>
              {headerData.contact.phones.map((item, i) => (
                <a
                  key={i}
                  href={`tel:${item}`}
                  className="flex items-center gap-2.5 px-5 text-[11.5px] font-medium hover:text-white transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-md bg-white/[0.07] flex items-center justify-center group-hover:bg-emerald-500/20 transition-all duration-300">
                    <FaPhoneAlt className="text-emerald-400 text-[8px] group-hover:text-emerald-300" />
                  </div>
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {headerData.socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-[10px] transition-all duration-300 cursor-pointer"
                >
                  {getIcon(social.icon)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════ Main Nav ═══════════ */}
        <nav
          className={`w-full bg-white/80 backdrop-blur-2xl sticky top-0 z-50 transition-all duration-700 ease-out ${
            scrolled
              ? 'shadow-[0_8px_40px_rgba(0,0,0,0.04)] border-b border-slate-100/50'
              : 'border-b border-slate-100/80'
          }`}
        >
          <div
            className={`${layout.container} flex justify-between items-center h-16 md:h-[72px]`}
          >
            {/* Logo */}
            <Link
              href="/"
              className="relative flex items-center h-10 w-32 md:h-11 md:w-44 lg:h-12 lg:w-48 overflow-hidden cursor-pointer group"
            >
              <Image
                src="/logo.jpg"
                alt="logo"
                fill
                className="object-contain object-left transition-transform duration-500 group-hover:scale-[1.02]"
                priority
              />
            </Link>

            {/* Desktop Links */}
            <ul className="hidden lg:flex items-center h-full gap-0.5">
              {headerData.navLinks.map((link, idx) => {
                const active = isActive(link.href);
                return (
                  <li
                    key={idx}
                    className="relative group h-full flex items-center"
                  >
                    <Link
                      href={link.href}
                      className={`relative px-4 h-full flex items-center gap-1.5 text-[13px] font-semibold tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                        active
                          ? 'text-rose-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {link.label}
                      {link.subMenu && (
                        <IoMdArrowDropdown className="text-sm text-slate-300 group-hover:text-slate-500 transition-all duration-300 group-hover:rotate-180" />
                      )}

                      {/* Active indicator — subtle line */}
                      <span
                        className={`absolute bottom-4 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-rose-500 transition-all duration-500 ease-out ${
                          active ? 'w-5 opacity-100' : 'w-0 opacity-0'
                        }`}
                      />
                    </Link>

                    {/* Dropdown */}
                    {link.subMenu && (
                      <div className="absolute top-[85%] left-1/2 -translate-x-1/2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:top-full transition-all duration-300 ease-out pt-2.5 z-50">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100/60 overflow-hidden p-2">
                          {/* Dropdown arrow */}
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-100/60 rotate-45 rounded-tl-sm" />

                          <div className="relative">
                            {link.subMenu.map((sub, sIdx) => {
                              const subActive = isActive(sub.href);
                              return (
                                <Link
                                  key={sIdx}
                                  href={sub.href}
                                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer group/item ${
                                    subActive
                                      ? 'text-rose-600 bg-rose-50/70'
                                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80'
                                  }`}
                                >
                                  <span>{sub.label}</span>
                                  <FaArrowRight
                                    className={`text-[7px] transition-all duration-300 ${
                                      subActive
                                        ? 'text-rose-400 translate-x-0'
                                        : 'text-slate-300 -translate-x-2 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100'
                                    }`}
                                  />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Right Side */}
            <div className="flex items-center gap-2.5">
              {/* Desktop Auth */}
              <div className="hidden lg:flex items-center gap-2.5">
                {loading ? (
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
                  </div>
                ) : user ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 hover:border-slate-200/80 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-rose-500/20 group-hover:shadow-md group-hover:shadow-rose-500/25 transition-all duration-300">
                        {firstLetter}
                      </div>
                      <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-800 max-w-[80px] truncate transition-colors duration-300">
                        {user.name}
                      </span>
                    </Link>

                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="w-8 h-8 rounded-full bg-slate-50/80 hover:bg-red-50 border border-slate-100 hover:border-red-200/60 flex items-center justify-center text-slate-300 hover:text-red-400 transition-all duration-300 cursor-pointer"
                      title="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Link href="/access">
                    <button className="flex items-center gap-2 h-10 px-6 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-[12px] font-semibold transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-slate-800/15 hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0">
                      <User className="w-3.5 h-3.5" />
                      Sign In
                    </button>
                  </Link>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95">
                      <FaBars className="text-slate-500 text-sm" />
                    </button>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    className="bg-white w-[88vw] sm:w-[380px] p-0 flex flex-col h-full border-l-0 z-[110]"
                  >
                    {/* Mobile Header */}
                    <SheetHeader className="px-5 py-4 border-b border-slate-100/60 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                      <SheetTitle className="text-left">
                        <div className="relative h-9 w-28 overflow-hidden">
                          <Image
                            src="/logo.jpg"
                            alt="logo"
                            fill
                            className="object-contain object-left"
                          />
                        </div>
                      </SheetTitle>
                    </SheetHeader>

                    {/* Mobile Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
                      {/* Mobile Auth Card */}
                      {!loading && (
                        <div className="mb-6">
                          {user ? (
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-rose-50/30 border border-slate-100/80 shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-rose-500/20">
                                  {firstLetter}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-0.5">
                                    Welcome back
                                  </p>
                                  <p className="text-sm font-bold text-slate-800 truncate">
                                    {user.name}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <Link
                                  href="/admin"
                                  className="col-span-2"
                                  onClick={closeMobileMenu}
                                >
                                  <button className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-all duration-300 shadow-sm shadow-slate-800/10">
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Dashboard
                                  </button>
                                </Link>
                                <button
                                  onClick={() => {
                                    setShowLogoutModal(true);
                                    closeMobileMenu();
                                  }}
                                  className="h-10 rounded-xl border border-slate-200/80 bg-white hover:bg-red-50/50 hover:border-red-200/60 flex items-center justify-center text-slate-300 hover:text-red-400 transition-all duration-300 cursor-pointer active:scale-[0.97]"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Link
                              href="/access"
                              className="block"
                              onClick={closeMobileMenu}
                            >
                              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 transition-all duration-500 group cursor-pointer active:scale-[0.99] shadow-lg shadow-slate-900/10">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-white/15 transition-all duration-300">
                                      <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-white">
                                        Sign In
                                      </p>
                                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                                        Access your account
                                      </p>
                                    </div>
                                  </div>
                                  <FaArrowRight className="text-[10px] text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                              </div>
                            </Link>
                          )}
                        </div>
                      )}

                      {loading && (
                        <div className="flex justify-center py-8 mb-4">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                            <span className="text-[11px] text-slate-300 font-medium">
                              Loading...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Menu Label */}
                      <div className="flex items-center gap-3 mb-3 px-1">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                          Menu
                        </span>
                        <span className="flex-1 h-px bg-gradient-to-r from-slate-100 to-transparent" />
                      </div>

                      {/* Nav Items */}
                      <div className="space-y-1">
                        {headerData.navLinks.map((link, idx) => (
                          <MobileMenuItem
                            key={idx}
                            link={link}
                            subMenu={link.subMenu}
                            isActiveFunc={isActive}
                            onNavigate={closeMobileMenu}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Mobile Footer */}
                    <div className="p-4 bg-gradient-to-t from-slate-50/80 to-white border-t border-slate-100/60">
                      <div className="flex items-center gap-2 mb-3">
                        {[
                          {
                            icon: (
                              <FaPhoneAlt className="text-[8px] text-emerald-400" />
                            ),
                            href: `tel:${headerData.contact.phones[0]}`,
                            text: headerData.contact.phones[0],
                          },
                          {
                            icon: (
                              <FaEnvelope className="text-[8px] text-rose-400" />
                            ),
                            href: `mailto:${headerData.contact.email}`,
                            text: headerData.contact.email,
                          },
                        ].map((item, i) => (
                          <a
                            key={i}
                            href={item.href}
                            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-100/80 hover:border-slate-200/80 hover:shadow-sm transition-all duration-300 cursor-pointer group"
                          >
                            <span className="group-hover:scale-110 transition-transform duration-300">
                              {item.icon}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium truncate group-hover:text-slate-700 transition-colors">
                              {item.text}
                            </span>
                          </a>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {headerData.socialLinks.map((social, idx) => (
                          <a
                            key={idx}
                            href={social.href}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-100/80 text-slate-300 hover:text-rose-500 hover:border-rose-200/50 hover:bg-rose-50/30 text-[10px] transition-all duration-300 cursor-pointer"
                          >
                            {getIcon(social.icon)}
                          </a>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* ═══════════ Logout Modal — Softer ═══════════ */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => !loggingOut && setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-[380px] shadow-2xl shadow-slate-900/10 overflow-hidden animate-in zoom-in-95 fade-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-7 pt-8 text-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100/60 flex items-center justify-center mx-auto mb-5 shadow-sm shadow-red-100/50">
                <Shield className="w-7 h-7 text-red-400" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Sign Out?
              </h3>

              <p className="text-[13px] text-slate-400 leading-relaxed mb-7 max-w-[280px] mx-auto">
                You&apos;ll need to sign in again to access the dashboard
                and manage bookings.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`w-full h-12 rounded-2xl font-bold text-sm text-white transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${
                    loggingOut
                      ? 'bg-slate-200 cursor-not-allowed text-slate-400'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/15 hover:shadow-xl hover:shadow-red-500/20'
                  }`}
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing Out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Yes, Sign Out
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={loggingOut}
                  className="w-full h-12 rounded-2xl font-semibold text-sm text-slate-500 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 hover:border-slate-200/80 transition-all duration-300 cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="px-7 py-3.5 bg-slate-50/50 border-t border-slate-100/60">
              <p className="text-[11px] text-slate-300 text-center flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" />
                Session data will be cleared securely
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════ Mobile Menu Item ═══════════
const MobileMenuItem = ({
  link,
  subMenu,
  isActiveFunc,
  onNavigate,
}: {
  link: any;
  subMenu: any;
  isActiveFunc: (href: string) => boolean;
  onNavigate: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const active = isActiveFunc(link.href);

  const getLinkIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('home')) return <FaHome />;
    if (l.includes('flight') || l.includes('air')) return <FaPlaneDeparture />;
    if (l.includes('hotel') || l.includes('accommodation')) return <FaHotel />;
    if (l.includes('hajj') || l.includes('umrah') || l.includes('umra'))
      return <FaKaaba />;
    if (l.includes('about')) return <FaInfoCircle />;
    if (l.includes('contact') || l.includes('support')) return <FaHeadset />;
    if (l.includes('booking') || l.includes('reservation'))
      return <MdOutlineAirplaneTicket className="text-[18px]" />;
    if (l.includes('visa') || l.includes('passport')) return <FaPassport />;
    if (l.includes('tour') || l.includes('package') || l.includes('travel'))
      return <FaSuitcaseRolling />;
    if (l.includes('service')) return <FaConciergeBell />;
    if (l.includes('destination') || l.includes('place'))
      return <FaMapMarkedAlt />;
    if (l.includes('ticket'))
      return <MdAirplaneTicket className="text-[18px]" />;
    if (l.includes('international') || l.includes('global'))
      return <FaGlobeAmericas />;
    return <FaChevronRight />;
  };

  return (
    <div className="w-full">
      <div
        className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition-all duration-300 ${
          isOpen || active
            ? 'bg-gradient-to-r from-rose-50/60 to-slate-50/40'
            : 'hover:bg-slate-50/60'
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Icon container */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all duration-300 ${
              active || isOpen
                ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-md shadow-slate-800/15'
                : 'bg-slate-100/80 text-slate-400'
            }`}
          >
            {getLinkIcon(link.label)}
          </div>

          {subMenu ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`text-[14px] font-semibold tracking-wide flex-1 text-left transition-colors duration-300 cursor-pointer ${
                active || isOpen ? 'text-slate-800' : 'text-slate-500'
              }`}
            >
              {link.label}
            </button>
          ) : (
            <Link
              href={link.href}
              onClick={onNavigate}
              className={`text-[14px] font-semibold tracking-wide flex-1 transition-colors duration-300 cursor-pointer ${
                active ? 'text-slate-800' : 'text-slate-500'
              }`}
            >
              {link.label}
            </Link>
          )}
        </div>

        {subMenu && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-8 h-8 rounded-lg hover:bg-white/80 flex items-center justify-center transition-all duration-300 cursor-pointer"
          >
            <IoMdArrowDropdown
              className={`text-lg transition-all duration-400 ease-out ${
                isOpen ? 'rotate-180 text-rose-500' : 'text-slate-300'
              }`}
            />
          </button>
        )}
      </div>

      {/* Submenu */}
      {subMenu && (
        <div
          className={`overflow-hidden transition-all duration-400 ease-out ${
            isOpen
              ? 'max-h-[400px] opacity-100 mt-1 mb-1'
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="ml-[52px] flex flex-col gap-0.5">
            {subMenu.map((sub: any, idx: number) => {
              const subActive = isActiveFunc(sub.href);
              return (
                <Link
                  key={idx}
                  href={sub.href}
                  onClick={onNavigate}
                  className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                    subActive
                      ? 'text-rose-600 bg-rose-50/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50/60'
                  }`}
                >
                  <span>{sub.label}</span>
                  {subActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/30" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;