"use client";

import * as React from "react";
import { Palette, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colorThemes = [
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "purple", label: "Purple", color: "bg-teal-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
  { value: "teal", label: "Teal", color: "bg-teal-500" },
] as const;

type ColorTheme = typeof colorThemes[number]["value"];

export function ColorThemeToggle() {
  const [colorTheme, setColorThemeState] = React.useState<ColorTheme>("blue");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Get current theme from the global getter
    if (typeof window !== "undefined" && (window as any).__getUserColorTheme) {
      const currentTheme = (window as any).__getUserColorTheme();
      if (currentTheme) {
        setColorThemeState(currentTheme);
      }
    }
  }, []);

  const handleThemeChange = (theme: ColorTheme) => {
    console.log('[ColorThemeToggle] Changing theme to:', theme);
    // Use the global setter exposed by UserThemeWrapper
    if (typeof window !== "undefined" && (window as any).__setUserColorTheme) {
      (window as any).__setUserColorTheme(theme);
      setColorThemeState(theme);
      console.log('[ColorThemeToggle] Theme changed successfully');
    } else {
      console.error('[ColorThemeToggle] __setUserColorTheme not found on window');
    }
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Palette className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle color theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {colorThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => handleThemeChange(theme.value)}
            className="flex items-center gap-2"
          >
            <div className={`h-4 w-4 rounded-full ${theme.color}`} />
            <span>{theme.label}</span>
            {colorTheme === theme.value && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
