"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

type ColorTheme = "blue" | "red" | "green" | "purple" | "orange" | "teal";

interface UserThemeWrapperProps {
  children: React.ReactNode;
  initialTheme?: ColorTheme;
  userRole: "admin" | "teacher" | "student" | "parent";
}

/**
 * Wrapper component that applies user-specific color themes at the layout level
 * This ensures each user's theme preference is isolated and doesn't affect other users
 */
export function UserThemeWrapper({ 
  children, 
  initialTheme = "blue",
  userRole 
}: UserThemeWrapperProps) {
  const { user } = useUser();
  const [colorTheme, setColorTheme] = useState<ColorTheme>(initialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user?.id) {
      // Load saved color theme from localStorage with user and role-specific key
      const storageKey = `color-theme-${userRole}-${user.id}`;
      const saved = localStorage.getItem(storageKey) as ColorTheme;
      
      if (saved && ["blue", "red", "green", "purple", "orange", "teal"].includes(saved)) {
        setColorTheme(saved);
      } else if (initialTheme) {
        setColorTheme(initialTheme);
      }
    }
  }, [user?.id, initialTheme, userRole]);

  // Generate theme class (empty string for blue as it's the default)
  const themeClass = mounted && colorTheme !== "blue" ? `theme-${colorTheme}` : "";

  // Apply theme to body element so it affects fixed-position elements
  useEffect(() => {
    if (mounted) {
      // Remove all theme classes from body
      document.body.classList.remove(
        "theme-blue",
        "theme-red",
        "theme-green",
        "theme-purple",
        "theme-orange",
        "theme-teal"
      );
      
      // Add new theme class (skip blue as it's default)
      if (colorTheme !== "blue") {
        document.body.classList.add(`theme-${colorTheme}`);
      }
      
      console.log('[UserThemeWrapper] Applied theme to body:', colorTheme);
    }
    
    // Cleanup: remove theme class when component unmounts
    return () => {
      if (mounted && colorTheme !== "blue") {
        document.body.classList.remove(`theme-${colorTheme}`);
      }
    };
  }, [mounted, colorTheme]);

  // Expose the theme setter globally so ColorThemeToggle can use it
  useEffect(() => {
    if (user?.id && mounted) {
      (window as any).__setUserColorTheme = (theme: ColorTheme) => {
        const storageKey = `color-theme-${userRole}-${user.id}`;
        localStorage.setItem(storageKey, theme);
        setColorTheme(theme);
      };
      (window as any).__getUserColorTheme = () => colorTheme;
    }
  }, [user?.id, colorTheme, mounted, userRole]);

  // Debug logging
  useEffect(() => {
    if (mounted) {
      console.log('[UserThemeWrapper]', { 
        userRole, 
        colorTheme, 
        themeClass, 
        userId: user?.id,
        fullClassName: `h-full relative ${themeClass}`
      });
    }
  }, [mounted, userRole, colorTheme, themeClass, user?.id]);

  // Don't render with theme until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="h-full relative">
        {children}
      </div>
    );
  }

  return (
    <div 
      className={`h-full relative ${themeClass}`.trim()} 
      data-theme={colorTheme} 
      data-role={userRole}
    >
      {children}
    </div>
  );
}
