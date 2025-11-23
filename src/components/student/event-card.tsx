"use client";

import { useState } from "react";
import { format, isAfter, isBefore } from "date-fns";
import { Calendar, MapPin, Users, Clock, CheckCircle, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RegistrationDialog } from "@/components/student/event-registration-dialog";
import { cancelEventRegistration } from "@/lib/actions/student-event-actions";
import { EventStatus } from "@prisma/client";

interface EventParticipant {
  id: string;
  userId: string;
  eventId: string;
  role?: string;
}

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    location?: string | null;
    type?: string | null;
    status: string;
    isPublic: boolean;
    thumbnail?: string | null;
    maxParticipants?: number | null;
    registrationDeadline?: Date | string | null;
    participants: EventParticipant[];
  };
  userId: string;
  studentId: string;
  isRegistered: boolean;
  isOngoing?: boolean;
  isPast?: boolean;
  registrationInfo?: EventParticipant | null;
}

export function EventCard({ 
  event, 
  userId, 
  studentId, 
  isRegistered, 
  isOngoing = false, 
  isPast = false, 
  registrationInfo = null 
}: EventCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if registration is still open
  const now = new Date();
  const isRegistrationOpen = event.registrationDeadline 
    ? isAfter(new Date(event.registrationDeadline), now)
    : isAfter(new Date(event.startDate), now);
  
  // Format event dates
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const sameDay = startDate.toDateString() === endDate.toDateString();
  
  const dateDisplay = sameDay
    ? `${format(startDate, "MMMM d, yyyy")}`
    : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  
  const timeDisplay = sameDay
    ? `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`
    : `${format(startDate, "h:mm a, MMM d")} - ${format(endDate, "h:mm a, MMM d")}`;
  
  // Handle cancellation
  const handleCancelRegistration = async () => {
    setIsLoading(true);
    try {
      const result = await cancelEventRegistration(event.id);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to cancel registration");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get event status badge
  const getEventStatusBadge = () => {
    if (event.status === EventStatus.CANCELLED) {
      return <Badge variant="destructive">Cancelled</Badge>;
    } else if (event.status === EventStatus.POSTPONED) {
      return <Badge variant="outline" className="border-amber-500 text-amber-700">Postponed</Badge>;
    } else if (isAfter(startDate, now)) {
      return <Badge variant="outline">Upcoming</Badge>;
    } else if (isBefore(endDate, now)) {
      return <Badge variant="secondary">Completed</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Ongoing</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {event.thumbnail ? (
        <div className="relative h-40 w-full bg-gray-100">
          <img
            src={event.thumbnail}
            alt={event.title}
            width={400}
            height={160}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-40 w-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
          <Calendar className="h-10 w-10 text-blue-500" />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
          {getEventStatusBadge()}
        </div>
        
        {event.type && (
          <CardDescription className="flex items-center mt-1">
            <Tag className="h-3.5 w-3.5 mr-1" />
            {event.type}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1">
        {event.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {event.description}
          </p>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <p>{dateDisplay}</p>
              <p className="text-gray-500">{timeDisplay}</p>
            </div>
          </div>
          
          {event.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-600">{event.location}</span>
            </div>
          )}
          
          {event.maxParticipants && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-600">
                {event.maxParticipants} maximum participants
              </span>
            </div>
          )}
          
          {event.registrationDeadline && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-600">
                Registration deadline: {format(new Date(event.registrationDeadline), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        {isRegistered ? (
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Registered
              {registrationInfo?.role && registrationInfo.role !== "ATTENDEE" && (
                <Badge variant="outline" className="ml-2">
                  {registrationInfo.role.charAt(0) + registrationInfo.role.slice(1).toLowerCase()}
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" asChild>
                <a href={`/student/events/${event.id}`}>View Details</a>
              </Button>
              
              {!isPast && event.status !== EventStatus.CANCELLED && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" disabled={isLoading}>
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your registration for "{event.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Registration</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleCancelRegistration} 
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Cancel Registration
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ) : isPast ? (
          <Button variant="outline" className="w-full" disabled>
            Event Ended
          </Button>
        ) : isOngoing ? (
          <Button className="w-full" asChild>
            <a href={`/student/events/${event.id}`}>View Details</a>
          </Button>
        ) : event.status === EventStatus.CANCELLED ? (
          <Button variant="outline" className="w-full" disabled>
            Event Cancelled
          </Button>
        ) : (
          <RegistrationDialog 
            event={{
              id: event.id,
              title: event.title,
              startDate: typeof event.startDate === 'string' ? event.startDate : event.startDate.toISOString(),
              maxParticipants: event.maxParticipants
            }} 
            userId={userId} 
            studentId={studentId} 
            isOpen={isRegistrationOpen} 
          />
        )}
      </CardFooter>
    </Card>
  );
}
