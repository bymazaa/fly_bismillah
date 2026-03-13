'use client';
import { useState } from 'react';
import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import {  FaMapMarkerAlt } from 'react-icons/fa';
import { hotels } from '@/constant/others';
import HotelCard from '../components/HotelCard';

const HotelsPage = () => {
    const { layout, typography, button } = appTheme;
    const [searchQuery, setSearchQuery] = useState("");

    // Filter Logic
    const filteredHotels = hotels.filter(hotel => 
        hotel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            
            {/* ================= 1. Hero Section ================= */}
            <div className="relative h-[45vh] min-h-[400px] flex flex-col items-center justify-center text-center px-4">
                <Image
                    src="/asset/hotel/hotelbg.jpg" // Luxury Hotel Background
                    alt="Hotel Hero"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/40" />
                
                <div className="relative z-10 max-w-4xl w-full space-y-6">
                    <h1 className={`${typography.h1} text-white drop-shadow-lg`}>
                        Find Your Perfect Stay
                    </h1>
                    <p className="text-gray-100 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
                        Discover top-rated hotels, resorts, and vacation rentals for your next trip.
                    </p>

                    {/* Search Bar Container */}
                    <div className="bg-white p-2 rounded-2xl shadow-2xl flex  md:flex-row items-center gap-2 max-w-xl mx-auto mt-6">
                        {/* Location Input */}
                        <div className="flex-1 flex  items-center px-4 h-12 md:h-14  md:w-auto border-b md:border-b-0 md:border-r border-gray-100">
                             <FaMapMarkerAlt className="text-gray-400 mr-3" />
                             <input 
                                type="text" 
                                placeholder="Where are you going?" 
                                className="w-full outline-none text-gray-700 font-medium placeholder-gray-400 bg-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                             />
                        </div>
                        
                     

                        {/* Search Button */}
                        <Button className={`${button.primary} h-12 md:h-14 px-8 rounded-xl font-bold  md:w-auto`}>
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* ================= 2. Hotels Grid ================= */}
            <div className={`${layout.container} mt-16`}>
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Hotels</h2>
                        <p className="text-gray-500 mt-1">Showing {filteredHotels.length} properties</p>
                    </div>
                    {/* Optional Filter Button could go here */}
                </div>

                {filteredHotels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredHotels.map((hotel) => (
                            <HotelCard key={hotel.id} data={hotel} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-2xl shadow-gray-100 border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-400">No hotels found</h3>
                        <p className="text-gray-400">Try searching for a different location.</p>
                        <Button 
                            variant="link" 
                            onClick={() => setSearchQuery("")}
                            className="text-rose-600 mt-2"
                        >
                            View All Hotels
                        </Button>
                    </div>
                )}
            </div>

        </main>
    );
};

export default HotelsPage;