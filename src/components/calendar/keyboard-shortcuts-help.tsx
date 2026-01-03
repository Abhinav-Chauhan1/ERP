"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyboardShortcut {
  key: string;
  description: string;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  className?: string;
}

/**
 * KeyboardShortcutsHelp Component
 * 
 * Displays available keyboard shortcuts for the calendar.
 * Helps users discover and learn keyboard navigation.
 * 
 * Requirements: Accessibility - Keyboard Navigation
 */
export function KeyboardShortcutsHelp({
  shortcuts,
  className,
}: KeyboardShortcutsHelpProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
          aria-label="View keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px]"
        aria-describedby="keyboard-shortcuts-description"
      >
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription id="keyboard-shortcuts-description">
            Use these keyboard shortcuts to navigate the calendar quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th
                    className="px-4 py-2 text-left text-sm font-medium"
                    scope="col"
                  >
                    Key
                  </th>
                  <th
                    className="px-4 py-2 text-left text-sm font-medium"
                    scope="col"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map((shortcut, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-b last:border-0",
                      "hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <td className="px-4 py-3">
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                        {shortcut.key}
                      </kbd>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {shortcut.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: Keyboard shortcuts are disabled when typing in input fields.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
