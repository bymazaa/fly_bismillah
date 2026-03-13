"use client";


import { Button } from "@/components/ui/button";
import { FaExclamationTriangle, FaRedoAlt } from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { colors, typography } = appTheme;

 

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-gray-50">
      
      {/* Icon */}
      <div className="bg-rose-50 p-6 rounded-full mb-6">
        <FaExclamationTriangle className="text-6xl text-rose-600" />
      </div>

      {/* Error Message */}
      <h2 className={`${typography.h2} text-gray-900 mb-3`}>
        We Encountered Some Turbulence!
      </h2>
      <p className={`${colors.text.body} max-w-md mx-auto mb-8`}>
        Something went wrong on our end. Don't worry, our engineers are fixing the engine. Please try again.
      </p>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={reset} 
          className={`${appTheme.button.primary} px-8 gap-2`}
        >
          <FaRedoAlt /> Try Again
        </Button>
        
        <Button 
          variant="ghost" 
          className={appTheme.button.ghost}
          onClick={() => window.location.href = "/"}
        >
          Go to Homepage
        </Button>
      </div>

    </div>
  );
}