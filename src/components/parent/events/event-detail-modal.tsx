"use client";

import { format } from "date-fns";
import { Calendar, MapPin, Users, Clock, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EventStatus } from "@prisma/client";

interface EventDetailModalProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    location: string | null;
    organizer: string | null;
    type: string | null;
    status: EventStatus;
    maxParticipants: number | null;
    registrationDeadline: Date | null;
    thumbnail: string | null;
    _count: {
      participants: number;
    };
  } | null;
  isRegistered: boolean;
  isOpen: boolean;
  onClose: () => void;
  onRegister?: () => void;
  onCancelRegistration?: () => void;
}

export function EventDetailModal({
  event,
  isRegistered,
  isOpen,
  onClose,
  onRegister,
  onCancelRegistration,
}: EventDetailModalProps) {
  if (!event) return null;

  const getStatusBadge = () => {
    const statusColors: Record<EventStatus, string> = {
      UPCOMING: "bg-blue-100 text-blue-800",
      ONGOING: "bg-green-100 text-green-800",
      COMPLETED: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
      POSTPONED: "bg-yellow-100 text-yellow-800",
    };

    return (
      <Badge className={statusColors[event.status]}>
        {event.status}
      </Badge>
    );
  };

  const isRegistrationOpen = () => {
    if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
      return false;
    }
    
    const now = new Date();
    if (event.registrationDeadline && event.registrationDeadline < now) {
      return false;
    }
    
    if (event.maxParticipants && event._count.participants >= event.maxParticipants) {
      return false;
    }
    
    return true;
  };

  const isFull = event.maxParticipants && event._count.participants >= event.maxParticipants;
  const canRegister = !isRegistered && isRegistrationOpen();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl pr-8">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Type Badges */}
          <div className="flex flex-wrap gap-2">
            {getStatusBadge()}
            {event.type && (
              <Badge variant="outline">{event.type}</Badge>
            )}
            {isRegistered && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Registered
              </Badge>
            )}
            {isFull && !isRegistered && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Full
              </Badge>
            )}
          </div>

          {/* Thumbnail */}
          {event.thumbnail && (
            <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 relative">
              <img
                src={event.thumbnail}
                alt={event.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-semibold mb-2">About this event</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Event Details */}
          <div className="space-y-3">
            <h3 className="font-semibold">Event Details</h3>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}
                    {event.startDate.getTime() !== event.endDate.getTime() && 
                      ` - ${format(new Date(event.endDate), "EEEE, MMMM d, yyyy")}`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                </div>
              )}

              {event.organizer && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Organizer</p>
                    <p className="text-sm text-gray-600">{event.organizer}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Participants</p>
                  <p className="text-sm text-gray-600">
                    {event._count.participants} registered
                    {event.maxParticipants && ` (${event.maxParticipants} max)`}
                  </p>
                </div>
              </div>

              {event.registrationDeadline && !isRegistered && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Registration Deadline:</strong>{" "}
                    {format(new Date(event.registrationDeadline), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            
            {isRegistered ? (
              onCancelRegistration && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={onCancelRegistration}
                >
                  Cancel Registration
                </Button>
              )
            ) : (
              canRegister && onRegister && (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={onRegister}
                >
                  Register for Event
                </Button>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
