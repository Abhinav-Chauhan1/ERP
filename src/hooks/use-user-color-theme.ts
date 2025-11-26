"use client";

import { useEffect, useState } from "react";

type ColorTheme = "blue" | "red" | "green" | "purple" | "orange" | "teal";

interface UseUserColorThemeReturn {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  themeClass: string;
}

/**
 * Hook to manage user-specific color themes
 * Stores theme in localStorage with a user-specific key
 */
export function useUserColorTheme(
  userId: string,
  initialTheme: ColorTheme = "blue"
): UseUserColorThemeReturn {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(initialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved color theme from localStorage with user-specific key
    const storageKey = `color-theme-${userId}`;
    const saved = localStorage.getItem(storageKey) as ColorTheme;
    
    if (saved && ["blue", "red", "green", "purple", "orange", "teal"].includes(saved)) {
      setColorThemeState(saved);
    } else if (initialTheme) {
      setColorThemeState(initialTheme);
    }
  }, [userId, initialTheme]);

  const setColorTheme = (theme: ColorTheme) => {
    // Save to localStorage with user-specific key
    const storageKey = `color-theme-${userId}`;
    localStorage.setItem(storageKey, theme);
    setColorThemeState(theme);
  };

  // Generate theme class (empty string for blue as it's the default)
  const themeClass = mounted && colorTheme !== "blue" ? `theme-${colorTheme}` : "";

  return { colorTheme, setColorTheme, themeClass };
}
