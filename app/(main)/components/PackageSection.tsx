'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import PackageCard from './PackageCard';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';

const PackageSection = () => {
    const { layout, typography, button } = appTheme;

    // 1. State Management
    const [packagesData, setPackagesData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 2. Fetch Packages using Axios
    useEffect(() => {
        const fetchPopularPackages = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Axios GET Request
                const response = await axios.get('/api/public/packages');

                const data = response.data.data || []
                
                setPackagesData(data);
            } catch (err: any) {
                // Proper Error Handling
                const errorMsg = err.response?.data?.message || "Failed to load packages";
                setError(errorMsg);
                console.error("Package Fetch Error:", errorMsg);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPopularPackages();
    }, []);

    return (
        <section className="py-20 bg-gray-50">
            <div className={layout.container}>
                
                {/* Header Section */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className={`${typography.subtitle} mb-2 block`}>Destinations</span>
                    <h2 className={`${typography.h2} text-gray-900 mb-4`}>
                        Our Popular Packages
                    </h2>
                    <p className="text-gray-500">
                        Explore our top-rated Hajj, Umrah, and Holiday packages designed for your comfort and spiritual journey.
                    </p>
                </div>

                {/* --- Content Area --- */}

                {/* 1. Loading State (Skeleton Effect) */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-3xl h-[450px] animate-pulse border border-gray-100 shadow-2xl shadow-gray-100 flex flex-col overflow-hidden">
                                <div className="h-64 bg-gray-200 w-full" />
                                <div className="p-5 space-y-3 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-full" />
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Error State */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-10 text-rose-500 bg-rose-50 rounded-3xl border border-rose-100">
                        <AlertCircle className="w-10 h-10 mb-2" />
                        <p className="font-bold">{error}</p>
                        <Button 
                            onClick={() => window.location.reload()} 
                            variant="ghost" 
                            className="mt-4 text-gray-600 hover:text-gray-900"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* 3. Cards Grid (Success State) */}
                {!isLoading && !error && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {packagesData.length > 0 ? (
                                packagesData.slice(0, 6).map((pkg) => (
                                    <PackageCard key={pkg._id || pkg.id} data={pkg} />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 text-gray-400 font-medium italic">
                                    No popular packages available at the moment.
                                </div>
                            )}
                        </div>

                        {/* View All Button */}
                        <div className="mt-12 text-center">
                            <Link href="/packages">
                                <Button className={`${button.primary} cursor-pointer shadow-none hover:shadow-xl transition-all duration-300`}>
                                    View All Packages
                                </Button>
                            </Link>
                        </div>
                    </>
                )}

            </div>
        </section>
    );
};

export default PackageSection;