"use client";

import { useEffect } from "react";

/**
 * SuperAdminThemeProvider
 * 
 * Forces the application into "Dark Mode" and specifically the "SikshaMitra" theme
 * for all routes under /super-admin.
 * 
 * This ensures high contrast (White text on Black background) by enforcing:
 * 1. 'dark' class on HTML/Body
 * 2. 'theme-sikshamitra' class
 * 3. CSS variable overrides for specific text elements
 */
export function SuperAdminThemeProvider({
    children
}: {
    children: React.ReactNode
}) {
    useEffect(() => {
        // Force add classes to document element
        document.documentElement.classList.add('dark');
        document.documentElement.classList.add('theme-sikshamitra');

        // Optional: Force body background color to ensure no white flash
        document.body.style.backgroundColor = '#0a0a0a';
        document.body.style.color = '#ffffff';

        return () => {
            // Cleanup not strictly necessary if we want to persist theme,
            // but good practice if navigating away from super-admin
            // document.documentElement.classList.remove('theme-sikshamitra');
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white dark:bg-black dark:text-white theme-sikshamitra">
            {children}
        </div>
    );
}
