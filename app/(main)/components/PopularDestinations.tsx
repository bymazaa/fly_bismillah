'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { appTheme } from '@/constant/theme/global';
import { Loader2, AlertCircle } from 'lucide-react';

const PopularDestinations = () => {
    const { layout, typography, button } = appTheme;

    // 1. State Management
    const [destinationsData, setDestinationsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 2. Fetch Data
    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                setIsLoading(true);
                // Axios Call
                  const response = await axios.get('/api/public/destinations');
                // Handling API Response Structure
                const data = response.data.data || []
                
                // Slice to show only top 8
                setDestinationsData(data.slice(0, 8));
            } catch (err: any) {
                const errorMsg = err.response?.data?.message || "Failed to load destinations.";
                setError(errorMsg);
                console.error("Destination Fetch Error:", errorMsg);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDestinations();
    }, []);

    return (
        <section className={`bg-gray-900 ${layout.sectionPadding} relative overflow-hidden`}>
            {/* Background SVG Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
            </div>

            <div className={`${layout.container} relative z-10`}>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="text-center md:text-left">
                        <h2 className={`${typography.h2} text-white mb-2`}>Popular Destinations</h2>
                        <p className="text-gray-400 text-lg">
                            Bring the distance closer through us.
                        </p>
                    </div>
                </div>

                {/* --- Content Area --- */}
                
                {/* 1. Loading State (Skeleton) */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-gray-800 rounded-3xl h-80 animate-pulse border border-gray-700" />
                        ))}
                    </div>
                )}

                {/* 2. Error State */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <AlertCircle className="text-rose-500 w-12 h-12 mb-3" />
                        <h3 className="text-xl font-bold text-white">Something went wrong</h3>
                        <p className="text-gray-400 mt-2">{error}</p>
                        <Button 
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="mt-6 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* 3. Success State (Grid) */}
                {!isLoading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {destinationsData.length > 0 ? (
                            destinationsData.slice(0,8).map((item) => (
                                <Link
                                    // Linking via ID as per previous requirements
                                    href={`/destinations/${item._id || item.id}`}
                                    key={item._id || item.id}
                                    className={`group bg-white ${layout.radius.card} overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer`}
                                >
                                    <div className="relative h-80 w-full overflow-hidden">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

                                        <div className="absolute bottom-0 left-0 w-full p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="h-0.5 w-8 bg-rose-600 rounded-full transition-all duration-300 group-hover:w-12"></span>
                                                <p className="text-sm text-gray-300 font-medium">
                                                    {item.reviews || 0} Reviews
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No popular destinations found.
                            </div>
                        )}
                    </div>
                )}

                {/* View All Button */}
                {!isLoading && !error && (
                    <div className="mt-12 text-center">
                        <Link href="/destinations">
                            <Button className={`${button.primary} cursor-pointer shadow-none hover:shadow-none`}>
                                View All Destinations
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default PopularDestinations;