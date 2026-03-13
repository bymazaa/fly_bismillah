'use client';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaBed } from 'react-icons/fa';
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


    function handleClick() {
        //whatapps better messgae
        const message = `Hello, I am interested in booking a hotel stay at ${data.title} located in ${data.location}. Could you please provide me with more information regarding availability and rates? Thank you!`;
        const url = `https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }
    return (
        <div className="group bg-white rounded-2xl border border-gray-200/70 shadow-2xl shadow-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
            
            {/* Image Section */}
            <div className="relative h-56 w-full overflow-hidden">
                <Image
                    src={data.image}
                    alt={data.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-gray-900 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                    ${data.price} <span className="text-xs font-normal text-gray-500">/ night</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                            {data.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <FaMapMarkerAlt className="text-rose-500" />
                            {data.location}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                        <FaStar className="text-yellow-400 text-xs" />
                        <span className="text-xs font-bold text-gray-700">{data.rating}</span>
                    </div>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {data.description}
                </p>

                {/* Amenities Icons (Demo) */}
                <div className="flex gap-3 mb-6 text-gray-400 text-sm">
                    <div className="flex items-center gap-1" title="Free Wifi"><FaWifi /></div>
                    <div className="flex items-center gap-1" title="Pool"><FaSwimmingPool /></div>
                    <div className="flex items-center gap-1" title="Comfort Bed"><FaBed /></div>
                    <span className="text-xs bg-gray-100 px-2 rounded-full flex items-center">+{data.amenities.length} more</span>
                </div>

                <div className="mt-auto">
                     <Button onClick={handleClick} className={`w-full ${button.primary} font-bold`}>
                            Contact Now
                        </Button>
                </div>
            </div>
        </div>
    );
};

export default HotelCard;