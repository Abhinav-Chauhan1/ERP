"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { SchoolSettings } from "@prisma/client";

interface BrandingContextType {
  branding: SchoolSettings | null;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({
  children,
  branding,
}: {
  children: ReactNode;
  branding: SchoolSettings | null;
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
