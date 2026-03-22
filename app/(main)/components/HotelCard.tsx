'use client';
import Image from 'next/image';
import { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaBed, FaHeart, FaRegHeart } from 'react-icons/fa';
import { HiOutlineArrowRight } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { appTheme } from '@/constant/theme/global';
import { websiteDetails } from '@/constant/data';

interface HotelProps {
    data: {
        id: number;
        slug: string;
        title: string;
        price: number;
        location: string;
        image: string;
        description: string;
        rating: number;
        reviews: number;
        amenities: string[];
    };
}

const HotelCard = ({ data }: HotelProps) => {
    const { button } = appTheme;
    const [liked, setLiked] = useState(false);

    function handleClick() {
        const message = `Hello, I am interested in booking a hotel stay at ${data.title} located in ${data.location}. Could you please provide me with more information regarding availability and rates? Thank you!`;
        const url = `https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }

    return (
        <div
            className="
                bg-white rounded-3xl
                border border-slate-200/70
                shadow-2xl shadow-gray-100 
                overflow-hidden flex flex-col h-full
            "
        >
            {/* ──── Image Section ──── */}
            <div className="relative h-60 w-full overflow-hidden">
                <Image
                    src={data.image}
                    alt={data.title}
                    fill
                    className="object-cover"
                />

                {/* Top row: Rating + Heart */}
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                    <div
                        className="
                            flex items-center gap-1.5
                            bg-white/95 backdrop-blur-md
                            border border-white/80
                            px-3 py-1.5 rounded-xl
                            shadow-lg shadow-black/10
                        "
                    >
                        <FaStar className="text-rose-400 text-xs" />
                        <span className="text-sm font-bold text-slate-800">{data.rating}</span>
                        <span className="text-[11px] text-slate-400 font-medium">({data.reviews})</span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setLiked(!liked);
                        }}
                        className={`
                            w-9 h-9 rounded-full flex items-center justify-center
                            backdrop-blur-md border border-white/60
                            shadow-lg shadow-black/10
                            transition-all duration-200
                            ${liked
                                ? 'bg-slate-900 text-white border-slate-800'
                                : 'bg-white/90 text-slate-400'
                            }
                        `}
                    >
                        {liked ? <FaHeart className="text-sm" /> : <FaRegHeart className="text-sm" />}
                    </button>
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-4 left-4">
                    <div
                        className="
                            bg-slate-900
                            text-white px-4 py-2 rounded-xl
                            shadow-lg shadow-black/20
                        "
                    >
                        <span className="text-xl font-extrabold">${data.price}</span>
                        <span className="text-slate-400 text-xs font-medium ml-1">/ night</span>
                    </div>
                </div>
            </div>

            {/* ──── Content Section ──── */}
            <div className="p-5 md:p-6 flex flex-col flex-1">
                <div className="mb-3">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                        {data.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <FaMapMarkerAlt className="text-slate-400 text-xs flex-shrink-0" />
                        <span className="text-sm text-slate-400 font-medium truncate">{data.location}</span>
                    </div>
                </div>

                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
                    {data.description}
                </p>

                {/* Amenities */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {[
                        { icon: FaWifi,         label: 'WiFi' },
                        { icon: FaSwimmingPool, label: 'Pool' },
                        { icon: FaBed,          label: 'Bed'  },
                    ].map((amenity) => (
                        <div
                            key={amenity.label}
                            title={amenity.label}
                            className="
                                flex items-center gap-1.5
                                bg-slate-50 text-slate-500
                                px-3 py-1.5 rounded-lg
                                text-xs font-medium
                                border border-slate-100
                            "
                        >
                            <amenity.icon className="text-[11px] text-slate-400" />
                            <span className="text-slate-600">{amenity.label}</span>
                        </div>
                    ))}
                    {data.amenities.length > 3 && (
                        <span
                            className="
                                text-xs font-semibold text-slate-500
                                bg-slate-50 px-3 py-1.5 rounded-lg
                                border border-slate-100
                            "
                        >
                            +{data.amenities.length - 3} more
                        </span>
                    )}
                </div>

                <div className="border-t border-slate-100 mb-4" />

                {/* CTA Button */}
                <div className="mt-auto">
                    <Button
                        onClick={handleClick}
                        className="
                            w-full h-12 rounded-xl font-bold text-sm
                            bg-rose-500 hover:bg-rose-600
                            text-white
                            shadow-none
                            cursor-pointer
                            flex items-center justify-center gap-2
                            transition-all duration-200
                        "
                    >
                        Contact Now
                        <HiOutlineArrowRight className="text-base" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default HotelCard;