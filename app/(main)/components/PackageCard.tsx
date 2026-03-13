'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaMapMarkerAlt, FaStar, FaArrowRight } from 'react-icons/fa';


interface PackageProps {
    data: {
        _id: number;
        slug: string;
        title: string;
        price: string;
        image: string;
        category: string;
        location: string;
        description: string;
        included?: string[];
    };
}

const PackageCard = ({ data }: PackageProps) => {
 

    return (
        <div className="group  rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden flex flex-col h-full">
            
            {/* ================= Image Section ================= */}
            <div className="relative h-60 w-full overflow-hidden">
                <Link href={`/packages/${data._id}`}>
                    <Image
                        src={data.image}
                        alt={data.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                </Link>
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                    <span className="bg-white/95 backdrop-blur text-rose-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
                        {data.category}
                    </span>
                </div>
            </div>

            {/* ================= Content Section ================= */}
            <div className="p-6 flex flex-col flex-1">
                
                {/* Meta Info */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <FaMapMarkerAlt className="text-rose-500" />
                        <span className="line-clamp-1">{data.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                        <FaStar className="text-yellow-400" />
                        <span>4.9</span>
                    </div>
                </div>

                {/* Title */}
                <Link href={`/packages/${data._id}`}>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
                        {data.title}
                    </h3>
                </Link>

                {/* Description Excerpt */}
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {data.description}
                </p>
                
                {/* Inclusion Tags (Optional - showing first 2) */}
                <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                    {data.included?.slice(0, 2).map((item, idx) => (
                        <span key={idx} className="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">
                            {item}
                        </span>
                    ))}
                    {data.included && data.included.length > 2 && (
                        <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded border border-gray-100">
                            +{data.included.length - 2} more
                        </span>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 mb-4"></div>

                {/* Footer: Price & Button */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Starting from</p>
                        <h4 className="text-xl font-bold text-rose-600">${data.price}</h4>
                    </div>
                    
                    <Link href={`/packages/${data._id}`}>
                        <Button 
                            variant="outline" 
                            className="rounded-full w-10 cursor-pointer h-10 p-0 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all"
                        >
                            <FaArrowRight className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PackageCard;