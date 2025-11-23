"use client";

import { useBranding } from "@/lib/contexts/branding-context";
import Image from "next/image";

interface SchoolLogoProps {
  className?: string;
  showName?: boolean;
}

export function SchoolLogo({ className = "", showName = true }: SchoolLogoProps) {
  const { branding } = useBranding();

  if (!branding) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
          S
        </div>
        {showName && <span className="font-semibold text-lg">School ERP</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {branding.logo ? (
        <Image
          src={branding.logo}
          alt={`${branding.schoolName} logo`}
          width={40}
          height={40}
          className="object-contain"
        />
      ) : (
        <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
          {branding.schoolName.charAt(0)}
        </div>
      )}
      {showName && (
        <div className="flex flex-col">
          <span className="font-semibold text-lg leading-tight">
            {branding.schoolName}
          </span>
          {branding.tagline && (
            <span className="text-xs text-muted-foreground leading-tight">
              {branding.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
