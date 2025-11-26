"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Video, User, X, Edit, FileText, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cancelMeeting } from "@/lib/actions/parent-meeting-actions";

interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate: Date;
  duration: number;
  location?: string | null;
  status: string;
  notes?: string | null;
  teacher: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
      avatar?: string | null;
    };
  };
  parent?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
    };
  };
}

interface MeetingDetailModalProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
}

export function MeetingDetailModal({
  meeting,
  isOpen,
  onClose,
  onReschedule,
  onCancel,
}: MeetingDetailModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (!meeting) return null;

  const isOnline = meeting.location?.toLowerCase().includes("online");
  const isPast = new Date(meeting.scheduledDate) < new Date();
  const canCancel = !isPast && meeting.status !== "CANCELLED" && meeting.status !== "COMPLETED";
  const canReschedule = !isPast && meeting.status !== "CANCELLED" && meeting.status !== "COMPLETED";

  const handleCancelMeeting = async () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("meetingId", meeting.id);
        if (cancelReason) {
          formData.append("reason", cancelReason);
        }

        const result = await cancelMeeting(formData);

        if (result.success) {
          toast({
            title: "Success",
            description: result.message || "Meeting cancelled successfully",
          });
          setShowCancelDialog(false);
          onClose();
          if (onCancel) {
            onCancel();
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to cancel meeting",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    });
  };

  const getStatusBadge = () => {
    const statusConfig = {
      SCHEDULED: { variant: "default" as const, label: "Scheduled" },
      REQUESTED: { variant: "secondary" as const, label: "Requested" },
      RESCHEDULED: { variant: "outline" as const, label: "Rescheduled" },
      COMPLETED: { variant: "secondary" as const, label: "Completed" },
      CANCELLED: { variant: "destructive" as const, label: "Cancelled" },
    };

    const config = statusConfig[meeting.status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      label: meeting.status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-primary" />
              Meeting Details
            </DialogTitle>
            <DialogDescription>
              View complete information about this meeting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Status and Title */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-2xl font-bold">{meeting.title}</h3>
                {getStatusBadge()}
              </div>
              {meeting.description && (
                <p className="text-muted-foreground mt-2">{meeting.description}</p>
              )}
            </div>

            <Separator />

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-base font-semibold">
                    {format(new Date(meeting.scheduledDate), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time</p>
                  <p className="text-base font-semibold">
                    {format(new Date(meeting.scheduledDate), "h:mm a")}
                    {meeting.duration && ` (${meeting.duration} min)`}
                  </p>
                </div>
              </div>

              {meeting.location && (
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg md:col-span-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {isOnline ? (
                      <Video className="h-5 w-5 text-primary" />
                    ) : (
                      <MapPin className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isOnline ? "Meeting Link" : "Location"}
                    </p>
                    <p className="text-base font-semibold">{meeting.location}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Teacher Information */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Teacher Information
              </h4>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={meeting.teacher.user.avatar || ""} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {meeting.teacher.user.firstName.charAt(0)}
                    {meeting.teacher.user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {meeting.teacher.user.firstName} {meeting.teacher.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{meeting.teacher.user.email}</p>
                  {meeting.teacher.user.phone && (
                    <p className="text-sm text-muted-foreground">{meeting.teacher.user.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Meeting Notes (for past meetings) */}
            {meeting.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Meeting Notes
                  </h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
                  </div>
                </div>
              </>
            )}

            {/* Completed Status Message */}
            {meeting.status === "COMPLETED" && (
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  This meeting has been completed. Check the notes above for any outcomes or action items.
                </p>
              </div>
            )}

            {/* Cancelled Status Message */}
            {meeting.status === "CANCELLED" && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <X className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">
                  This meeting has been cancelled.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {isOnline && meeting.status === "SCHEDULED" && (
              <Button className="flex-1">
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
              </Button>
            )}
            {canReschedule && onReschedule && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onReschedule();
                }}
                disabled={isPending}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={isPending}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Meeting
              </Button>
            )}
            {!canCancel && !canReschedule && (
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this meeting with {meeting.teacher.user.firstName}{" "}
              {meeting.teacher.user.lastName}? The teacher will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <label htmlFor="cancelReason" className="text-sm font-medium mb-2 block">
              Reason for cancellation (optional)
            </label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let the teacher know why you're cancelling..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Keep Meeting</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelMeeting}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Cancelling..." : "Cancel Meeting"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
