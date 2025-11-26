"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Video, User, MoreVertical, X, Edit, ExternalLink } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";

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
      avatar?: string | null;
    };
  };
}

interface MeetingCardProps {
  meeting: Meeting;
  onCancel?: () => void;
  onReschedule?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
  isPast?: boolean;
}

export function MeetingCard({
  meeting,
  onCancel,
  onReschedule,
  onViewDetails,
  showActions = true,
  isPast: isPastProp,
}: MeetingCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const isOnline = meeting.location?.toLowerCase().includes("online");
  const isPast = isPastProp !== undefined ? isPastProp : new Date(meeting.scheduledDate) < new Date();
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
      <Card className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        meeting.status === "CANCELLED" && "opacity-60"
      )}>
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Date Badge */}
            <div className="flex-shrink-0">
              <div 
                className="bg-primary/10 rounded-lg h-16 w-16 flex flex-col items-center justify-center text-primary"
                aria-label={`Meeting date: ${format(new Date(meeting.scheduledDate), "MMMM d, yyyy")}`}
              >
                <Calendar className="h-5 w-5 mb-1" aria-hidden="true" />
                <span className="text-xs font-bold">
                  {format(new Date(meeting.scheduledDate), "d MMM")}
                </span>
              </div>
            </div>

            {/* Meeting Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{meeting.title}</h3>
                  {meeting.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {meeting.description}
                    </p>
                  )}
                </div>
                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={isPending}
                        aria-label="Meeting actions menu"
                      >
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Open meeting actions menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewDetails && (
                        <DropdownMenuItem onClick={onViewDetails}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {canReschedule && onReschedule && (
                        <DropdownMenuItem onClick={onReschedule}>
                          <Edit className="h-4 w-4 mr-2" />
                          Reschedule
                        </DropdownMenuItem>
                      )}
                      {canCancel && (
                        <DropdownMenuItem
                          onClick={() => setShowCancelDialog(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Meeting
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Teacher Info */}
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={meeting.teacher.user.avatar || ""} 
                    alt={`${meeting.teacher.user.firstName} ${meeting.teacher.user.lastName}'s profile picture`}
                  />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {meeting.teacher.user.firstName.charAt(0)}
                    {meeting.teacher.user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {meeting.teacher.user.firstName} {meeting.teacher.user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {meeting.teacher.user.email}
                  </p>
                </div>
              </div>

              {/* Meeting Meta */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {format(new Date(meeting.scheduledDate), "h:mm a")}
                    {meeting.duration && ` (${meeting.duration} min)`}
                  </span>
                </div>
                
                {meeting.location && (
                  <div className="flex items-center gap-1.5">
                    {isOnline ? (
                      <Video className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="truncate">{meeting.location}</span>
                  </div>
                )}
              </div>

              {/* Notes for past meetings */}
              {isPast && meeting.notes && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                  <p className="text-sm">{meeting.notes}</p>
                </div>
              )}

              {/* Status Badge */}
              <div className="mt-3">
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Action Buttons */}
        {showActions && (canCancel || canReschedule) && (
          <CardFooter className="bg-muted/50 p-4 flex gap-2">
            {isOnline && meeting.status === "SCHEDULED" && (
              <Button size="sm" className="flex-1" aria-label="Join online meeting">
                <Video className="h-4 w-4 mr-2" aria-hidden="true" />
                Join Meeting
              </Button>
            )}
            {canReschedule && onReschedule && (
              <Button
                size="sm"
                variant="outline"
                onClick={onReschedule}
                disabled={isPending}
                className="flex-1"
                aria-label="Reschedule meeting"
              >
                <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                Reschedule
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={isPending}
                className="flex-1"
                aria-label="Cancel meeting"
              >
                <X className="h-4 w-4 mr-2" aria-hidden="true" />
                Cancel
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

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
              aria-describedby="cancelReason-description"
            />
            <span id="cancelReason-description" className="sr-only">
              Provide an optional reason for cancelling this meeting. The teacher will be notified.
            </span>
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
