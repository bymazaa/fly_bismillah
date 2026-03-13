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
  FaTimes,
  FaExclamationTriangle,
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

// Navbar.tsx - শুধু পরিবর্তিত অংশগুলো দেখানো হলো

const Navbar = () => {
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { layout, button: btnTheme } = appTheme;

  // ✅ FIX 1: user type updated to match profile API response
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

  // ✅ FIX 2: Profile fetch — সঠিক response path ব্যবহার
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        const data = await res.json();

        // ✅ API success হলে data.data.profile থেকে user সেট করো
        if (data.success && data.data?.profile) {
          setUser(data.data.profile);
        } else {
          // ❌ 401/403/404 — user নেই বা blocked/session expired
          setUser(null);

          // Optional: blocked বা session expired হলে login page এ পাঠাও
          if (res.status === 403 || res.status === 401) {
            // Token already cleared by API (cookie maxAge: 0)
            // শুধু UI state reset করলেই চলবে
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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

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
        {/* ═══════════ Top Bar ═══════════ */}
        <div className="bg-gray-950 text-gray-300 hidden md:block">
          <div
            className={`${layout.container} flex justify-between items-center h-9`}
          >
            <div className="flex items-center divide-x divide-gray-800">
              <a
                href={`mailto:${headerData.contact.email}`}
                className="flex items-center gap-2 pr-4 text-[11px] font-medium hover:text-white transition-colors cursor-pointer"
              >
                <FaEnvelope className="text-rose-500 text-[9px]" />
                {headerData.contact.email}
              </a>
              {headerData.contact.phones.map((item, i) => (
                <a
                  key={i}
                  href={`tel:${item}`}
                  className="flex items-center gap-2 px-4 text-[11px] font-medium hover:text-white transition-colors cursor-pointer"
                >
                  <FaPhoneAlt className="text-rose-500 text-[9px]" />
                  {item}
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
                  className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 text-[10px] transition-all duration-200 cursor-pointer"
                >
                  {getIcon(social.icon)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════ Main Nav ═══════════ */}
        <nav
          className={`w-full bg-white/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-500 ${
            scrolled
              ? 'shadow-[0_4px_30px_rgba(0,0,0,0.06)]'
              : 'border-b border-gray-100'
          }`}
        >
          <div
            className={`${layout.container} flex justify-between items-center h-16 md:h-[68px]`}
          >
            {/* Logo */}
            <Link
              href="/"
              className="relative flex items-center h-10 w-32 md:h-11 md:w-44 lg:h-12 lg:w-48 overflow-hidden cursor-pointer"
            >
              <Image
                src="/logo.jpg"
                alt="logo"
                fill
                className="object-contain object-left"
                priority
              />
            </Link>

            {/* Desktop Links */}
            <ul className="hidden lg:flex items-center h-full">
              {headerData.navLinks.map((link, idx) => {
                const active = isActive(link.href);
                return (
                  <li
                    key={idx}
                    className="relative group h-full flex items-center"
                  >
                    <Link
                      href={link.href}
                      className={`relative px-4 h-full flex items-center gap-1 text-[13px] font-bold tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                        active
                          ? 'text-rose-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {link.label}
                      {link.subMenu && (
                        <IoMdArrowDropdown className="text-sm text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180 duration-300" />
                      )}

                      {active && (
                        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-600" />
                      )}
                    </Link>

                    {link.subMenu && (
                      <div className="absolute top-[85%] left-1/2 -translate-x-1/2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:top-full transition-all duration-300 ease-out pt-3 z-50">
                        <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-gray-100/80 overflow-hidden p-1.5">
                          {link.subMenu.map((sub, sIdx) => {
                            const subActive = isActive(sub.href);
                            return (
                              <Link
                                key={sIdx}
                                href={sub.href}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                                  subActive
                                    ? 'text-rose-600 bg-rose-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                              >
                                <span>{sub.label}</span>
                                <FaArrowRight
                                  className={`text-[7px] transition-all duration-200 ${
                                    subActive
                                      ? 'text-rose-400'
                                      : 'text-gray-300 opacity-0 group-hover:opacity-100'
                                  }`}
                                />
                              </Link>
                            );
                          })}
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
              <div className="hidden lg:flex items-center gap-2">
                {loading ? (
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                  </div>
                ) : user ? (
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {firstLetter}
                      </div>
                      <span className="text-[13px] font-semibold text-gray-700 group-hover:text-gray-900 max-w-[80px] truncate transition-colors">
                        {user.name}
                      </span>
                    </Link>

                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="w-8 h-8 rounded-full bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all duration-300 cursor-pointer"
                      title="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Link href="/access">
                    <button className="flex items-center gap-2 h-9 px-5 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-gray-900/20 hover:-translate-y-px active:scale-[0.98]">
                      Sign In
                    </button>
                  </Link>
                )}
              </div>

              {/* Mobile Menu */}
              <div className="lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95">
                      <FaBars className="text-gray-600 text-sm" />
                    </button>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    className="bg-white w-[88vw] sm:w-[380px] p-0 flex flex-col h-full border-l-0 z-[110]"
                  >
                    <SheetHeader className="px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
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

                    <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                      {/* Mobile Auth */}
                      {!loading && (
                        <div className="mb-5">
                          {user ? (
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/20">
                                  {firstLetter}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    Welcome back
                                  </p>
                                  <p className="text-sm font-bold text-gray-900 truncate">
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
                                  <button
                                    className={`w-full h-10 rounded-xl ${btnTheme.primary} text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all`}
                                  >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Dashboard
                                  </button>
                                </Link>
                                <button
                                  onClick={() => {
                                    setShowLogoutModal(true);
                                    closeMobileMenu();
                                  }}
                                  className="h-10 rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all cursor-pointer active:scale-[0.98]"
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
                              <div className="p-4 rounded-2xl bg-gray-900 hover:bg-gray-800 transition-all group cursor-pointer active:scale-[0.99]">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                      <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-white">
                                        Sign In
                                      </p>
                                      <p className="text-[11px] text-gray-400">
                                        Access your account
                                      </p>
                                    </div>
                                  </div>
                                  <FaArrowRight className="text-[10px] text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                              </div>
                            </Link>
                          )}
                        </div>
                      )}

                      {loading && (
                        <div className="flex justify-center py-6 mb-4">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                        </div>
                      )}

                      {/* Menu Label */}
                      <div className="flex items-center gap-3 mb-3 px-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                          Navigation
                        </span>
                        <span className="flex-1 h-px bg-gray-100" />
                      </div>

                      {/* Nav Items */}
                      <div className="space-y-0.5">
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

                    {/* Footer */}
                    <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        {[
                          {
                            icon: <FaPhoneAlt className="text-[9px]" />,
                            href: `tel:${headerData.contact.phones[0]}`,
                            text: headerData.contact.phones[0],
                          },
                          {
                            icon: <FaEnvelope className="text-[9px]" />,
                            href: `mailto:${headerData.contact.email}`,
                            text: headerData.contact.email,
                          },
                        ].map((item, i) => (
                          <a
                            key={i}
                            href={item.href}
                            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all cursor-pointer group"
                          >
                            <span className="text-rose-500 group-hover:scale-110 transition-transform">
                              {item.icon}
                            </span>
                            <span className="text-[11px] text-gray-600 font-medium truncate">
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
                            className="flex-1 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-rose-600 hover:border-rose-200 text-[10px] transition-all duration-200 cursor-pointer"
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

      {/* ═══════════ Logout Confirmation Modal ═══════════ */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !loggingOut && setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-[380px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pt-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
                <Shield className="w-7 h-7 text-red-500" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Sign Out?
              </h3>

              <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-[280px] mx-auto">
                You&apos;ll need to sign in again to access the admin dashboard
                and manage bookings.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`w-full h-12 rounded-xl font-bold text-sm text-white transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${
                    loggingOut
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/25'
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
                  className="w-full h-12 rounded-xl font-semibold text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all duration-300 cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" />
                Your session data will be cleared securely
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// MobileMenuItem component remains the same

// ═══════════ Mobile Menu Item (Updated) ═══════════
const MobileMenuItem = ({
  link,
  subMenu,
  isActiveFunc,
  onNavigate,
}: {
  link: any;
  subMenu: any;
  isActiveFunc: (href: string) => boolean;
  onNavigate: () => void; // ✅ Added callback to close menu
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const active = isActiveFunc(link.href);

  // ✅ Fixed & expanded icon mapping
  const getLinkIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('home')) return <FaHome />;
    if (l.includes('flight') || l.includes('air')) return <FaPlaneDeparture />;
    if (l.includes('hotel') || l.includes('accommodation'))
      return <FaHotel />;
    if (l.includes('hajj') || l.includes('umrah') || l.includes('umra'))
      return <FaKaaba />;
    if (l.includes('about')) return <FaInfoCircle />;
    if (l.includes('contact') || l.includes('support')) return <FaHeadset />;
    if (l.includes('booking') || l.includes('reservation'))
      return <MdOutlineAirplaneTicket className="text-[18px]" />;
    if (l.includes('visa') || l.includes('passport'))
      return <FaPassport />;
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
        className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition-all duration-200 ${
          isOpen || active ? 'bg-rose-50/50' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all duration-300 ${
              active || isOpen
                ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {getLinkIcon(link.label)}
          </div>

          {/* ✅ If has submenu → toggle dropdown, else navigate & close menu */}
          {subMenu ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`text-[14px] font-bold tracking-wide flex-1 text-left transition-colors cursor-pointer ${
                active || isOpen ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              {link.label}
            </button>
          ) : (
            <Link
              href={link.href}
              onClick={onNavigate}
              className={`text-[14px] font-bold tracking-wide flex-1 transition-colors cursor-pointer ${
                active ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              {link.label}
            </Link>
          )}
        </div>

        {subMenu && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer"
          >
            <IoMdArrowDropdown
              className={`text-lg text-gray-400 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-rose-600' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* ✅ Submenu items — also close menu on click */}
      {subMenu && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            isOpen ? 'max-h-[400px] opacity-100 mt-1 mb-1' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="ml-[52px] flex flex-col gap-0.5">
            {subMenu.map((sub: any, idx: number) => {
              const subActive = isActiveFunc(sub.href);
              return (
                <Link
                  key={idx}
                  href={sub.href}
                  onClick={onNavigate} // ✅ Close menu on sub-item click
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                    subActive
                      ? 'text-rose-600 bg-rose-50 font-bold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>{sub.label}</span>
                  {subActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
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