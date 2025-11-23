export const dynamic = 'force-dynamic';

import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "next-themes";
import { ThemeContextProvider } from "@/lib/contexts/theme-context";
import { BrandingProvider } from "@/lib/contexts/branding-context";
import { SkipToMain } from "@/components/accessibility/skip-to-main";
import { SessionManager } from "@/components/auth/SessionManager";
import { WebVitalsTracker } from "@/components/shared/web-vitals-tracker";
import { WebVitalsDisplay } from "@/components/shared/web-vitals-display";
import { KeyboardShortcutsProvider } from "@/components/shared/keyboard-shortcuts-provider";
import { getSchoolBranding } from "@/lib/actions/school-branding";

import "./globals.css";
import { Toaster } from "react-hot-toast";

// Optimize font loading with font-display: swap to prevent FOIT (Flash of Invisible Text)
// This ensures text remains visible during font loading, improving perceived performance
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Use font-display: swap to show fallback font immediately
  preload: true, // Preload the font for faster initial load
  fallback: ['system-ui', 'arial'], // Fallback fonts if Inter fails to load
});

export async function generateMetadata() {
  const brandingResult = await getSchoolBranding();
  const branding = brandingResult.success ? brandingResult.data : null;

  return {
    title: branding?.schoolName || "School ERP",
    description: branding?.tagline || "Comprehensive School Management System",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch school branding
  const brandingResult = await getSchoolBranding();
  const branding = brandingResult.success && brandingResult.data ? brandingResult.data : null;

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {branding?.favicon && <link rel="icon" href={branding.favicon} />}
          {branding?.primaryColor && (
            <style>{`:root { --primary-color: ${branding.primaryColor}; --secondary-color: ${branding.secondaryColor}; }`}</style>
          )}
        </head>
        <body className={inter.className} style={{ '--font-inter': inter.style.fontFamily } as React.CSSProperties}>
          <SkipToMain />
          <WebVitalsTracker />
          <WebVitalsDisplay />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeContextProvider>
              <BrandingProvider branding={branding}>
                <AuthProvider>
                  <SessionManager />
                  <KeyboardShortcutsProvider>
                    {children}
                  </KeyboardShortcutsProvider>
                </AuthProvider>
              </BrandingProvider>
            </ThemeContextProvider>
          </ThemeProvider>
          <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
