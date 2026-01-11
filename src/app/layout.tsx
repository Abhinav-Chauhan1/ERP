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
    title: settings?.schoolName || "SikshaMitra",
    description: settings?.tagline || "The Digital Partner of Modern Schools",
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
        {/* Favicon links - use settings if available, otherwise use static files */}
        {settings?.faviconUrl ? (
          <link rel="icon" href={settings.faviconUrl} />
        ) : (
          <>
            {/* Apple Touch Icons */}
            <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
            <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
            <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
            <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
            <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
            <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
            <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
            <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
            {/* Android/Chrome Icons */}
            <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
            {/* Standard Favicons */}
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            <link rel="icon" type="image/x-icon" href="/favicon.ico" />
            {/* Web App Manifest */}
            <link rel="manifest" href="/manifest.json" />
            {/* Microsoft Tiles */}
            <meta name="msapplication-TileColor" content="#ffffff" />
            <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
            <meta name="theme-color" content="#ef4444" />
          </>
        )}
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
