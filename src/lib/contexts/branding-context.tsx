"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { SchoolBranding } from "@prisma/client";

interface BrandingContextType {
  branding: SchoolBranding | null;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({
  children,
  branding,
}: {
  children: ReactNode;
  branding: SchoolBranding | null;
}) {
  return (
    <BrandingContext.Provider value={{ branding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
