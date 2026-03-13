"use client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FaPlaneSlash, FaHome, FaSearch } from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";
import "./(main)/globals.css"
export default function NotFound() {
  const { colors, typography } = appTheme;

  return (
    <div className={`min-h-[80vh] pt-20 pb-30 flex flex-col items-center justify-center text-center px-4 bg-gray-50`}>
      
      {/* Icon Animation */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-rose-100 rounded-full animate-ping opacity-20"></div>
        <FaPlaneSlash className="text-9xl text-rose-500 relative z-10" />
      </div>

      {/* Text Content */}
      <h1 className={`${typography.h1} text-gray-900 mb-2`}>
        404
      </h1>
      <h2 className={`${typography.h3} text-gray-800 mb-4`}>
        Oops! Destination Not Found
      </h2>
      <p className={`${colors.text.body} max-w-md mx-auto mb-8`}>
        It looks like you've flown off the map. The page you are looking for is not available or has been moved.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button className={`${appTheme.button.primary} cursor-pointer px-6 gap-2`}>
            <FaHome /> Back to Home
          </Button>
        </Link>
        
        <Link href="/contact">
           <Button variant="outline" className={`border-gray-100 cursor-pointer px-6 gap-2`}>
            <FaSearch /> Contact Support
          </Button>
        </Link>
      </div>

    </div>
  );
}