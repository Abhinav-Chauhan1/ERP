"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 * Requirements: 28.1, 28.2, 28.3, 28.4
 * 
 * Provides a centralized way to register and handle keyboard shortcuts
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        // Special handling for "/" key - allow it even in input fields if it's the search shortcut
        const isSearchShortcut = shortcut.key === "/" && !shortcut.ctrl && !shortcut.shift && !shortcut.alt;
        
        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          // For search shortcut, only trigger if NOT in an input field
          if (isSearchShortcut && isInputField) {
            continue;
          }
          
          // For other shortcuts, don't trigger in input fields
          if (!isSearchShortcut && isInputField) {
            continue;
          }

          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
