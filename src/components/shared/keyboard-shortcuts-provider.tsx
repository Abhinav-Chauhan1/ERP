"use client";

import { useState, useEffect, useRef } from "react";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help";

/**
 * Keyboard Shortcuts Provider
 * Requirements: 28.1, 28.2, 28.3, 28.4, 28.5
 * 
 * Provides global keyboard shortcuts functionality:
 * - / to focus global search (28.1)
 * - Ctrl+K to open command palette (28.2)
 * - Arrow keys for list navigation (28.3)
 * - Tab for form navigation (28.4)
 * - ? to show keyboard shortcuts help (28.5)
 */
export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Requirement 28.2: Ctrl+K to open command palette
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Requirement 28.5: ? to show keyboard shortcuts help
      // Only trigger if not in an input field
      if (event.key === "?" && !isInputField && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        setHelpModalOpen(true);
        return;
      }

      // Requirement 28.1: / to focus global search
      // This is handled in the GlobalSearch component itself
      // but we document it here for completeness

      // Requirement 28.3: Arrow key navigation for lists
      // This is handled by individual list components using the useListNavigation hook

      // Requirement 28.4: Tab navigation for forms
      // This is native browser behavior, but we ensure it's not blocked
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {children}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      <KeyboardShortcutsHelp
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
      />
    </>
  );
}

/**
 * Hook for list navigation with arrow keys
 * Requirements: 28.3
 * 
 * Provides arrow key navigation for list items
 */
export function useListNavigation<T extends HTMLElement = HTMLElement>({
  itemCount,
  onSelect,
  enabled = true,
}: {
  itemCount: number;
  onSelect: (index: number) => void;
  enabled?: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when the container or its children have focus
      if (!containerRef.current?.contains(document.activeElement)) {
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev < itemCount - 1 ? prev + 1 : prev;
            return next;
          });
          break;

        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : prev;
            return next;
          });
          break;

        case "Enter":
          if (selectedIndex >= 0) {
            event.preventDefault();
            onSelect(selectedIndex);
          }
          break;

        case "Escape":
          event.preventDefault();
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, itemCount, selectedIndex, onSelect]);

  return {
    selectedIndex,
    setSelectedIndex,
    containerRef,
  };
}
