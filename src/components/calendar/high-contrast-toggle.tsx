"use client";

import { Button } from "@/components/ui/button";
import { Contrast } from "lucide-react";
import { useHighContrastMode } from "@/hooks/use-high-contrast-mode";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HighContrastToggleProps {
  className?: string;
}

/**
 * HighContrastToggle Component
 * 
 * Allows users to toggle high contrast mode for better visibility.
 * Persists preference to localStorage.
 * 
 * Requirements: Accessibility - High Contrast Mode Support
 */
export function HighContrastToggle({ className }: HighContrastToggleProps) {
  const { isHighContrast, toggleHighContrast } = useHighContrastMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isHighContrast ? "default" : "outline"}
            size="sm"
            onClick={toggleHighContrast}
            className={cn("gap-2", className)}
            aria-label={
              isHighContrast
                ? "Disable high contrast mode"
                : "Enable high contrast mode"
            }
            aria-pressed={isHighContrast}
          >
            <Contrast className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {isHighContrast ? "High Contrast On" : "High Contrast"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isHighContrast
              ? "Disable high contrast mode"
              : "Enable high contrast mode for better visibility"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
