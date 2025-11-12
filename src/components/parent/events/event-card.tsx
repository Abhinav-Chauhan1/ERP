"use client";

import { format } from "date-fns";
import { Calendar, MapPin, Users, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventStatus } from "@prisma/client";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    location: string | null;
    type: string | null;
    status: EventStatus;
    maxParticipants: number | null;
    registrationDeadline: Date | null;
    thumbnail: string | null;
    _count: {
      participants: number;
    };
  };
  isRegistered?: boolean;
  onViewDetails: (eventId: string) => void;
  onRegister?: (eventId: string) => void;
  onCancelRegistration?: (eventId: string) => void;
}

export function EventCard({ 
  event, 
  isRegistered = false,
  onViewDetails, 
  onRegister,
  onCancelRegistration 
}: EventCardProps) {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
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
                <Badge variant="destructive">Full</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              {format(new Date(event.startDate), "MMM d, yyyy")}
              {event.startDate.getTime() !== event.endDate.getTime() && 
                ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`
              }
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>
              {event._count.participants} participant{event._count.participants !== 1 ? 's' : ''}
              {event.maxParticipants && ` / ${event.maxParticipants} max`}
            </span>
          </div>

          {event.registrationDeadline && !isRegistered && (
            <div className="text-xs text-gray-500">
              Registration closes: {format(new Date(event.registrationDeadline), "MMM d, yyyy")}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(event.id)}
          >
            View Details
          </Button>
          
          {isRegistered ? (
            onCancelRegistration && (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onCancelRegistration(event.id)}
              >
                Cancel
              </Button>
            )
          ) : (
            onRegister && isRegistrationOpen() && (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => onRegister(event.id)}
              >
                Register
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
