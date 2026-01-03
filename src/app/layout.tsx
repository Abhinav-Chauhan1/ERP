export const dynamic = 'force-dynamic';

import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "next-themes";
import { ThemeContextProvider } from "@/lib/contexts/theme-context";
import { BrandingProvider } from "@/lib/contexts/branding-context";
import { SkipToMain } from "@/components/accessibility/skip-to-main";
import { SessionManager } from "@/components/auth/SessionManager";
import { WebVitalsTracker } from "@/components/shared/web-vitals-tracker";
import { WebVitalsDisplay } from "@/components/shared/web-vitals-display";
import { KeyboardShortcutsProvider } from "@/components/shared/keyboard-shortcuts-provider";
import { getPublicSystemSettings } from "@/lib/actions/settingsActions";

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
  const settingsResult = await getPublicSystemSettings();
  const settings = settingsResult.success ? settingsResult.data : null;

  return {
    title: settings?.schoolName || "School ERP",
    description: settings?.tagline || "Comprehensive School Management System",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch school settings
  const settingsResult = await getPublicSystemSettings();
  const settings = settingsResult.success && settingsResult.data ? settingsResult.data : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {settings?.faviconUrl && <link rel="icon" href={settings.faviconUrl} />}
        {settings?.primaryColor && (
          <style>{`:root { --primary-color: ${settings.primaryColor}; --secondary-color: ${settings.secondaryColor}; }`}</style>
        )}
      </head>
      <body className={inter.className} style={{ '--font-inter': inter.style.fontFamily } as React.CSSProperties}>
        <SkipToMain />
        <WebVitalsTracker />
        <WebVitalsDisplay />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeContextProvider>
              <BrandingProvider branding={settings}>
                <AuthProvider>
                  <SessionManager />
                  <KeyboardShortcutsProvider>
                    {children}
                  </KeyboardShortcutsProvider>
                </AuthProvider>
              </BrandingProvider>
            </ThemeContextProvider>
          </ThemeProvider>
        </SessionProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
