"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface SchoolContext {
  schoolId: string | null;
  subdomain: string | null;
  schoolName: string | null;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
  isSubdomain: boolean;
  isLoading: boolean;
}

const SubdomainContext = createContext<SchoolContext>({
  schoolId: null,
  subdomain: null,
  schoolName: null,
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  logo: null,
  isSubdomain: false,
  isLoading: true,
});

export function useSubdomain() {
  return useContext(SubdomainContext);
}

interface SubdomainProviderProps {
  children: React.ReactNode;
}

export function SubdomainProvider({ children }: SubdomainProviderProps) {
  const [context, setContext] = useState<SchoolContext>({
    schoolId: null,
    subdomain: null,
    schoolName: null,
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    logo: null,
    isSubdomain: false,
    isLoading: true,
  });

  const pathname = usePathname();

  useEffect(() => {
    async function detectSubdomain() {
      try {
        // Get current hostname
        const hostname = window.location.hostname;
        
        // Check if we're on a subdomain
        const response = await fetch('/api/subdomain/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostname }),
        });

        if (response.ok) {
          const data = await response.json();
          
          setContext({
            schoolId: data.schoolId,
            subdomain: data.subdomain,
            schoolName: data.schoolName,
            primaryColor: data.primaryColor || '#3b82f6',
            secondaryColor: data.secondaryColor || '#8b5cf6',
            logo: data.logo,
            isSubdomain: !!data.subdomain,
            isLoading: false,
          });

          // Apply theme colors if on subdomain
          if (data.subdomain && data.primaryColor) {
            document.documentElement.style.setProperty('--primary', data.primaryColor);
            document.documentElement.style.setProperty('--primary-foreground', '#ffffff');
          }
          if (data.subdomain && data.secondaryColor) {
            document.documentElement.style.setProperty('--secondary', data.secondaryColor);
            document.documentElement.style.setProperty('--secondary-foreground', '#ffffff');
          }
        } else {
          setContext(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error detecting subdomain:', error);
        setContext(prev => ({ ...prev, isLoading: false }));
      }
    }

    detectSubdomain();
  }, [pathname]);

  return (
    <SubdomainContext.Provider value={context}>
      {children}
    </SubdomainContext.Provider>
  );
}