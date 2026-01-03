"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StickyNote } from "lucide-react";

interface EventNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  eventTitle: string;
  initialContent?: string;
  isEditing?: boolean;
}

/**
 * EventNoteDialog Component
 * 
 * Dialog for creating and editing personal notes on calendar events.
 * Teachers can add private notes to any event for their own reference.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
export function EventNoteDialog({
  isOpen,
  onClose,
  onSave,
  eventTitle,
  initialContent = "",
  isEditing = false,
}: EventNoteDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update content when initialContent changes
  useEffect(() => {
    setContent(initialContent);
    setError(null);
  }, [initialContent, isOpen]);

  /**
   * Handle save note
   */
  const handleSave = async () => {
    // Validate content
    if (!content.trim()) {
      setError("Note content cannot be empty");
      return;
    }

    if (content.length > 5000) {
      setError("Note content is too long (maximum 5000 characters)");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(content.trim());
      setContent("");
      onClose();
    } catch (err) {
      console.error("Error saving note:", err);
      setError("Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setContent(initialContent);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            <DialogTitle>
              {isEditing ? "Edit Note" : "Add Note"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEditing
              ? `Update your personal note for "${eventTitle}"`
              : `Add a personal note to "${eventTitle}". This note is private and only visible to you.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note-content">
              Note Content
              <span className="text-muted-foreground text-xs ml-2">
                ({content.length}/5000 characters)
              </span>
            </Label>
            <Textarea
              id="note-content"
              placeholder="Enter your note here... (e.g., preparation tasks, reminders, important points)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
              disabled={isSaving}
              maxLength={5000}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 Tips for effective notes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Track preparation tasks and materials needed</li>
              <li>Note important points to remember</li>
              <li>Add reminders for follow-up actions</li>
              <li>Record any special considerations</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : isEditing ? "Update Note" : "Add Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
