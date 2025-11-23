"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Command, Search, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

/**
 * Keyboard Shortcuts Help Modal
 * Requirements: 28.5
 * 
 * Displays a help modal with all available keyboard shortcuts when user presses ?
 */
export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  const shortcuts: ShortcutItem[] = [
    // Global shortcuts
    {
      keys: ["/"],
      description: "Focus global search",
      category: "Global",
    },
    {
      keys: ["Ctrl", "K"],
      description: "Open command palette",
      category: "Global",
    },
    {
      keys: ["?"],
      description: "Show keyboard shortcuts",
      category: "Global",
    },
    {
      keys: ["Esc"],
      description: "Close dialogs and modals",
      category: "Global",
    },

    // Navigation
    {
      keys: ["↑", "↓"],
      description: "Navigate through list items",
      category: "Navigation",
    },
    {
      keys: ["Enter"],
      description: "Select highlighted item",
      category: "Navigation",
    },
    {
      keys: ["Tab"],
      description: "Move to next form field",
      category: "Navigation",
    },
    {
      keys: ["Shift", "Tab"],
      description: "Move to previous form field",
      category: "Navigation",
    },

    // Forms
    {
      keys: ["Ctrl", "Enter"],
      description: "Submit form",
      category: "Forms",
    },
    {
      keys: ["Ctrl", "S"],
      description: "Save changes",
      category: "Forms",
    },
  ];

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  const renderKey = (key: string) => {
    // Map special keys to icons or symbols
    const keyMap: Record<string, React.ReactNode> = {
      "Ctrl": <Command className="h-3 w-3" />,
      "Cmd": <Command className="h-3 w-3" />,
      "↑": <ArrowUp className="h-3 w-3" />,
      "↓": <ArrowDown className="h-3 w-3" />,
      "Tab": <CornerDownLeft className="h-3 w-3" />,
      "/": <Search className="h-3 w-3" />,
    };

    return (
      <Badge
        variant="outline"
        className="px-2 py-1 font-mono text-xs min-w-[2rem] justify-center"
      >
        {keyMap[key] || key}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts], index) => (
            <div key={category}>
              {index > 0 && <Separator className="my-4" />}
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {category}
              </h3>
              <div className="space-y-3">
                {categoryShortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <div key={keyIdx} className="flex items-center gap-1">
                          {keyIdx > 0 && (
                            <span className="text-xs text-muted-foreground mx-1">
                              +
                            </span>
                          )}
                          {renderKey(key)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Most shortcuts work globally, but some may be
            context-specific. Press <Badge variant="outline" className="mx-1 px-1 py-0 text-xs">?</Badge> anytime to see this help.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
