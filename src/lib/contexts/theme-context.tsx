"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ColorTheme = "blue" | "red" | "green" | "purple" | "orange" | "teal";

interface ThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("blue");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved color theme from localStorage
    const saved = localStorage.getItem("color-theme") as ColorTheme;
    if (saved && ["blue", "red", "green", "purple", "orange", "teal"].includes(saved)) {
      setColorThemeState(saved);
      // Don't apply theme globally - let individual components handle it
    }
  }, []);

  const setColorTheme = (theme: ColorTheme) => {
    // Save to localStorage only - don't apply globally
    // Individual dashboards can apply their own themes if needed
    localStorage.setItem("color-theme", theme);
    setColorThemeState(theme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useColorTheme must be used within ThemeContextProvider");
  }
  return context;
}
