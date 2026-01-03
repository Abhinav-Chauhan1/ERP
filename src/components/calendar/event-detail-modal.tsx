"use client";

import { CalendarEvent, CalendarEventCategory, EventNote } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  Paperclip,
  Edit,
  Trash2,
  FileText,
  Repeat,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type ExtendedCalendarEvent = CalendarEvent & {
  category: CalendarEventCategory;
  notes?: EventNote[];
};

interface EventDetailModalProps {
  event: ExtendedCalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onAddNote?: (event: ExtendedCalendarEvent) => void;
  onEditNote?: (event: ExtendedCalendarEvent, note: EventNote) => void;
  onDeleteNote?: (eventId: string, noteId: string) => void;
  canEdit: boolean;
  canDelete?: boolean;
  canManageNotes?: boolean;
  className?: string;
}

/**
 * EventDetailModal Component
 * 
 * Displays full details of a calendar event including:
 * - Event information (title, description, date, time, location)
 * - Category with color coding
 * - Attachments
 * - Notes (for teachers)
 * - Edit/Delete actions (for admins)
 * 
 * Requirements: 3.5
 */
export function EventDetailModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddNote,
  onEditNote,
  onDeleteNote,
  canEdit,
  canDelete = true,
  canManageNotes = false,
  className,
}: EventDetailModalProps) {
  if (!event) return null;

  const hasAttachments = event.attachments && event.attachments.length > 0;
  const hasNotes = event.notes && event.notes.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("sm:max-w-[600px] max-h-[90vh] overflow-y-auto", className)}
        aria-describedby="event-detail-description"
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${event.category.color}20`,
                  color: event.category.color,
                  borderColor: event.category.color,
                }}
              >
                {event.category.name}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4" id="event-detail-description">
          {/* Date and Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">Date:</span>
              <span>{format(event.startDate, "EEEE, MMMM d, yyyy")}</span>
            </div>

            {!event.isAllDay && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">Time:</span>
                <span>
                  {format(event.startDate, "p")} - {format(event.endDate, "p")}
                </span>
              </div>
            )}

            {event.isAllDay && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">All Day Event</span>
              </div>
            )}

            {event.isRecurring && (
              <div className="flex items-center gap-2 text-sm">
                <Repeat className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">Recurring Event</span>
              </div>
            )}
          </div>

          {/* Location */}
          {event.location && (
            <>
              <Separator />
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-medium">Location:</span>
                  <p className="text-muted-foreground mt-1">{event.location}</p>
                </div>
              </div>
            </>
          )}

          {/* Description */}
          {event.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium text-sm">Description:</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </>
          )}

          {/* Attachments */}
          {hasAttachments && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium text-sm">
                    Attachments ({event.attachments.length}):
                  </span>
                </div>
                <ul className="space-y-1" role="list">
                  {event.attachments.map((attachment, index) => (
                    <li key={index}>
                      <a
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Paperclip className="h-3 w-3" aria-hidden="true" />
                        Attachment {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Notes (for teachers) */}
          {(hasNotes || canManageNotes) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Personal Notes:</span>
                  {canManageNotes && onAddNote && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onAddNote(event)}
                      className="h-8"
                    >
                      <Edit className="h-3 w-3 mr-1" aria-hidden="true" />
                      Add Note
                    </Button>
                  )}
                </div>
                {hasNotes ? (
                  <div className="space-y-2">
                    {event.notes!.map((note) => (
                      <div
                        key={note.id}
                        className="bg-muted p-3 rounded-md text-sm space-y-2"
                      >
                        <p className="whitespace-pre-wrap">{note.content}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {format(note.createdAt, "PPp")}
                          </p>
                          {canManageNotes && (
                            <div className="flex gap-1">
                              {onEditNote && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditNote(event, note)}
                                  className="h-7 px-2"
                                >
                                  <Edit className="h-3 w-3" aria-hidden="true" />
                                </Button>
                              )}
                              {onDeleteNote && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this note?")) {
                                      onDeleteNote(event.id, note.id);
                                    }
                                  }}
                                  className="h-7 px-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : canManageNotes ? (
                  <p className="text-sm text-muted-foreground">
                    No notes yet. Click "Add Note" to create your first note for this event.
                  </p>
                ) : null}
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {format(event.createdAt, "PPp")}</p>
            {event.updatedAt.getTime() !== event.createdAt.getTime() && (
              <p>Last updated: {format(event.updatedAt, "PPp")}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          {canEdit && (
            <>
              {onEdit && (
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    onEdit(event);
                    onClose();
                  }}
                  className="w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                  Edit Event
                </Button>
              )}
              {onDelete && canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete this event? This action cannot be undone."
                      )
                    ) {
                      onDelete(event.id);
                      onClose();
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Delete Event
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
