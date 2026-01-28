"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: "dark" | "light";
  resolvedTheme: "dark" | "light";
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  systemTheme: "light",
  resolvedTheme: "light",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Load theme from storage
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      if (storedTheme && ["dark", "light", "system"].includes(storedTheme)) {
        setTheme(storedTheme);
      }
    } catch (error) {
      console.warn("Failed to load theme from localStorage:", error);
    }
    setMounted(true);
  }, [storageKey]);

  // Calculate resolved theme
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    if (disableTransitionOnChange) {
      const css = document.createElement("style");
      css.appendChild(
        document.createTextNode(
          `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
        )
      );
      document.head.appendChild(css);

      return () => {
        // Force reflow
        (() => window.getComputedStyle(document.body))();
        
        // Wait for next tick before removing
        setTimeout(() => {
          if (document.head.contains(css)) {
            document.head.removeChild(css);
          }
        }, 1);
      };
    }

    if (attribute === "class") {
      root.classList.add(resolvedTheme);
    } else {
      root.setAttribute(attribute, resolvedTheme);
    }
  }, [resolvedTheme, attribute, disableTransitionOnChange, mounted]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme);
        setTheme(newTheme);
      } catch (error) {
        console.warn("Failed to save theme to localStorage:", error);
        setTheme(newTheme);
      }
    },
    systemTheme,
    resolvedTheme,
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

// Theme Toggle Component
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Theme-aware CSS variables
export const themeVariables = {
  light: {
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',
    '--card': '0 0% 100%',
    '--card-foreground': '222.2 84% 4.9%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222.2 84% 4.9%',
    '--primary': '221.2 83.2% 53.3%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '210 40% 96%',
    '--secondary-foreground': '222.2 84% 4.9%',
    '--muted': '210 40% 96%',
    '--muted-foreground': '215.4 16.3% 46.9%',
    '--accent': '210 40% 96%',
    '--accent-foreground': '222.2 84% 4.9%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--ring': '221.2 83.2% 53.3%',
    '--radius': '0.5rem',
  },
  dark: {
    '--background': '222.2 84% 4.9%',
    '--foreground': '210 40% 98%',
    '--card': '222.2 84% 4.9%',
    '--card-foreground': '210 40% 98%',
    '--popover': '222.2 84% 4.9%',
    '--popover-foreground': '210 40% 98%',
    '--primary': '217.2 91.2% 59.8%',
    '--primary-foreground': '222.2 84% 4.9%',
    '--secondary': '217.2 32.6% 17.5%',
    '--secondary-foreground': '210 40% 98%',
    '--muted': '217.2 32.6% 17.5%',
    '--muted-foreground': '215 20.2% 65.1%',
    '--accent': '217.2 32.6% 17.5%',
    '--accent-foreground': '210 40% 98%',
    '--destructive': '0 62.8% 30.6%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '217.2 32.6% 17.5%',
    '--input': '217.2 32.6% 17.5%',
    '--ring': '224.3 76.3% 94.1%',
    '--radius': '0.5rem',
  },
} as const;