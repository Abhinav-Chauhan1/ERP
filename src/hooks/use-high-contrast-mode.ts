"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook for detecting and managing high contrast mode
 * 
 * Detects:
 * - System-level high contrast mode (Windows High Contrast)
 * - User preference for high contrast
 * - Provides utilities for high contrast styling
 * 
 * Requirements: Accessibility - High Contrast Mode Support
 */
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [userPreference, setUserPreference] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for system high contrast mode
    const checkSystemHighContrast = () => {
      // Check for Windows High Contrast mode
      if (window.matchMedia) {
        const highContrastQuery = window.matchMedia("(prefers-contrast: high)");
        setIsHighContrast(highContrastQuery.matches);

        // Listen for changes
        const handler = (e: MediaQueryListEvent) => {
          setIsHighContrast(e.matches);
        };

        highContrastQuery.addEventListener("change", handler);
        return () => highContrastQuery.removeEventListener("change", handler);
      }
    };

    // Check for user preference in localStorage
    const checkUserPreference = () => {
      try {
        const stored = localStorage.getItem("calendar-high-contrast");
        if (stored !== null) {
          const preference = stored === "true";
          setUserPreference(preference);
          setIsHighContrast(preference);
        }
      } catch (err) {
        console.error("Error reading high contrast preference:", err);
      }
    };

    checkUserPreference();
    const cleanup = checkSystemHighContrast();

    return cleanup;
  }, []);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    setUserPreference(newValue);

    try {
      localStorage.setItem("calendar-high-contrast", String(newValue));
    } catch (err) {
      console.error("Error saving high contrast preference:", err);
    }
  };

  const resetToSystem = () => {
    setUserPreference(null);
    try {
      localStorage.removeItem("calendar-high-contrast");
    } catch (err) {
      console.error("Error removing high contrast preference:", err);
    }

    // Re-check system preference
    if (window.matchMedia) {
      const highContrastQuery = window.matchMedia("(prefers-contrast: high)");
      setIsHighContrast(highContrastQuery.matches);
    }
  };

  // Utility function to get high contrast styles
  const getHighContrastStyles = (baseColor: string) => {
    if (!isHighContrast) return baseColor;

    // In high contrast mode, use more distinct colors
    const colorMap: Record<string, string> = {
      // Map common colors to high contrast equivalents
      "#3b82f6": "#0000FF", // blue -> pure blue
      "#ef4444": "#FF0000", // red -> pure red
      "#10b981": "#00FF00", // green -> pure green
      "#f59e0b": "#FFFF00", // amber -> yellow
      "#14b8a6": "#FF00FF", // violet -> magenta
      "#ec4899": "#FF00FF", // pink -> magenta
      "#06b6d4": "#00FFFF", // cyan -> cyan
    };

    return colorMap[baseColor.toLowerCase()] || baseColor;
  };

  // Utility function to get high contrast border width
  const getHighContrastBorderWidth = (baseWidth: number = 1) => {
    return isHighContrast ? Math.max(baseWidth * 2, 2) : baseWidth;
  };

  // Utility function to get high contrast focus ring
  const getHighContrastFocusRing = () => {
    return isHighContrast
      ? "focus:ring-4 focus:ring-offset-4 focus:ring-black dark:focus:ring-white"
      : "focus:ring-2 focus:ring-offset-2 focus:ring-ring";
  };

  return {
    isHighContrast,
    userPreference,
    toggleHighContrast,
    resetToSystem,
    getHighContrastStyles,
    getHighContrastBorderWidth,
    getHighContrastFocusRing,
  };
}
