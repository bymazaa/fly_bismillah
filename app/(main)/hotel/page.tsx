'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import { HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';
import { IoSparkles } from 'react-icons/io5';
import { MdHotel, MdPool, MdSpa, MdFreeBreakfast } from 'react-icons/md';
import { FiChevronDown } from 'react-icons/fi';
import { hotels } from '@/constant/others';
import HotelCard from '../components/HotelCard';

const categories = [
    { label: 'All',       icon: IoSparkles },
    { label: 'Luxury',    icon: MdHotel },
    { label: 'Pool',      icon: MdPool },
    { label: 'Spa',       icon: MdSpa },
    { label: 'Breakfast', icon: MdFreeBreakfast },
];

const sortOptions = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Top Rated'];

const HotelsPage = () => {
    const { layout } = appTheme;
    const [searchQuery, setSearchQuery]     = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [showSort, setShowSort]           = useState(false);
    const [selectedSort, setSelectedSort]   = useState('Recommended');
    const [isVisible, setIsVisible]         = useState(false);

    useEffect(() => { setIsVisible(true); }, []);

    const filteredHotels = hotels.filter(
        (hotel) =>
            hotel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hotel.location.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <main className="bg-white min-h-screen pb-24">

            {/* ════════════════════ HERO ════════════════════ */}
            <section className="relative h-[56vh] min-h-[480px] flex flex-col items-center justify-center text-center overflow-hidden">
                <Image
                    src="/asset/hotel/hotelbg.jpg"
                    alt="Hotel Hero"
                    fill
                    className="object-cover"
                    priority
                />

                {/* Single clean overlay */}
                <div className="absolute inset-0 bg-slate-900/65" />

                {/* Hero Content */}
                <div
                    className={`relative z-10 max-w-3xl w-full px-6 space-y-6 transition-all duration-700 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 text-white/70 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        2,500+ Premium Properties
                    </div>

                    <h1 className="text-4xl md:text-[3.5rem] font-black text-white leading-[1.1] tracking-tight">
                        Find Your{' '}
                        <span className="text-rose-500">Perfect Stay</span>
                    </h1>

                    <p className="text-white/50 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                        Handpicked hotels, luxury resorts &amp; vacation rentals at the best prices.
                    </p>

                    {/* Search Bar */}
                    <div className="bg-white rounded-xl p-1.5 flex items-center gap-2 max-w-lg mx-auto mt-2 shadow-2xl shadow-black/20">
                        <div className="flex-1 flex items-center px-3 gap-2">
                            <FaMapMarkerAlt className="text-slate-400 text-sm flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Where are you going?"
                                className="w-full outline-none text-slate-700 placeholder-slate-400 bg-transparent text-sm py-2"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button className="h-10 px-6 rounded-lg font-semibold bg-rose-500 hover:bg-rose-500 text-slate-100 cursor-pointer text-sm transition-all duration-200 flex items-center gap-2 shadow-none">
                            <FaSearch className="text-xs" />
                            <span className="hidden md:inline">Search</span>
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 pt-2 text-white/40 text-xs">
                        {[
                            { value: '2.5K+', label: 'Hotels' },
                            { value: '120+',  label: 'Cities' },
                            { value: '50K+',  label: 'Reviews' },
                        ].map((s, i) => (
                            <div key={s.label} className="flex items-center gap-1.5">
                                {i > 0 && <span className="w-px h-3 bg-white/20 mr-1.5" />}
                                <span className="font-bold text-white/70 text-sm">{s.value}</span>
                                <span>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom clean edge */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
            </section>

         

            {/* ════════════════════ HOTELS GRID ════════════════════ */}
            <section className={`${layout.container} mt-10`}>

                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            Featured Hotels
                        </h2>
                        <p className="text-slate-400 mt-1 text-sm">
                            Showing{' '}
                            <span className="font-semibold text-slate-700">{filteredHotels.length}</span>{' '}
                            properties
                        </p>
                    </div>

                    {/* Subtle divider line */}
                    <div className="hidden md:block h-px flex-1 bg-slate-100 mx-8 mb-2" />
                </div>

                {/* Grid */}
                {filteredHotels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredHotels.map((hotel, index) => (
                            <div
                                key={hotel.id}
                                style={{
                                    animationDelay: `${index * 80}ms`,
                                    animation: 'fadeInUp 0.5s ease-out forwards',
                                    opacity: 0,
                                }}
                            >
                                <HotelCard data={hotel} />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-24 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-14 h-14 bg-white border border-slate-200/70 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-gray-100">
                            <FaSearch className="text-lg text-slate-300" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">No hotels found</h3>
                        <p className="text-slate-400 mt-1 text-sm max-w-xs mx-auto">
                            No properties match your search. Try a different location.
                        </p>
                        <Button
                            onClick={() => setSearchQuery('')}
                            className="mt-5 bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                        >
                            View All Hotels
                        </Button>
                    </div>
                )}

                {/* Load More */}
                {filteredHotels.length > 0 && (
                    <div className="flex justify-center mt-14">
                        <Button className="bg-white cursor-pointer text-slate-700 border border-slate-200 hover:bg-slate-50 px-10 py-5 rounded-xl font-semibold text-sm shadow-2xl shadow-gray-100 hover:shadow-md transition-all duration-200">
                            Load More Properties
                        </Button>
                    </div>
                )}
            </section>

            <style jsx global>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    );
};

export default HotelsPage;