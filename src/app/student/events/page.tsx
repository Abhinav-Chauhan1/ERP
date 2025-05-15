import { redirect } from "next/navigation";
import { Metadata } from "next";
import { format, isAfter, isBefore, isToday } from "date-fns";
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Tag } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUserDetails } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RegistrationDialog } from "@/components/student/event-registration-dialog";

// Define interfaces for the event data structure
interface EventParticipant {
  id: string;
  userId: string;
  eventId: string;
  role?: string;
}

interface SchoolEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  location?: string | null;
  type?: string | null;
  status: string;
  isPublic: boolean;
  thumbnail?: string | null;
  maxParticipants?: number | null;
  registrationDeadline?: string | Date | null;
  participants: EventParticipant[];
}

export const metadata: Metadata = {
  title: "Events & Activities | Student Portal",
  description: "View and register for school events and activities",
};

export default async function StudentEventsPage() {
  const userDetails = await getCurrentUserDetails();
  
  if (!userDetails?.dbUser || userDetails.dbUser.role !== "STUDENT") {
    redirect("/login");
  }
  
  // TypeScript assertion to ensure dbUser is non-null after the check above
  const dbUser = userDetails.dbUser;
  
  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  if (!student) {
    redirect("/student");
  }

  // Get all events
  const events = await db.event.findMany({
    where: {
      isPublic: true
    },
    include: {
      participants: {
        where: {
          userId: dbUser.id
        }
      }
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  // Separate events into upcoming, ongoing, and past
  const now = new Date();
  
  const upcomingEvents: SchoolEvent[] = events.filter((event: SchoolEvent) => 
    isAfter(new Date(event.startDate), now)
  );
  
  const ongoingEvents: SchoolEvent[] = events.filter((event: SchoolEvent) => 
    (isToday(new Date(event.startDate)) || isBefore(new Date(event.startDate), now)) && 
    isAfter(new Date(event.endDate), now)
  );
  
  const pastEvents: SchoolEvent[] = events.filter((event: SchoolEvent) => 
    isBefore(new Date(event.endDate), now)
  );

  // Get user's registered events
  const registeredEvents: SchoolEvent[] = events.filter((event: SchoolEvent) => 
    event.participants.length > 0
  );

  // Helper function to get event status badge
  const getEventStatusBadge = (event: SchoolEvent): JSX.Element => {
    if (event.status === "CANCELLED") {
      return <Badge variant="destructive">Cancelled</Badge>;
    } else if (event.status === "POSTPONED") {
      return <Badge variant="outline" className="border-amber-500 text-amber-700">Postponed</Badge>;
    } else if (isAfter(new Date(event.startDate), now)) {
      return <Badge variant="outline">Upcoming</Badge>;
    } else if (isBefore(new Date(event.endDate), now)) {
      return <Badge variant="secondary">Completed</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Ongoing</Badge>;
    }
  };

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">Events & Activities</h1>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-8">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="registered">My Registrations</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-6">
          <h2 className="text-lg font-medium mb-4">Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  userId={dbUser.id}
                  studentId={student.id}
                  isRegistered={event.participants.length > 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No upcoming events</h3>
              <p className="text-sm text-gray-500">
                Check back later for new upcoming events
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="ongoing" className="space-y-6">
          <h2 className="text-lg font-medium mb-4">Ongoing Events</h2>
          {ongoingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ongoingEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  userId={dbUser.id}
                  studentId={student.id}
                  isRegistered={event.participants.length > 0}
                  isOngoing={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No ongoing events</h3>
              <p className="text-sm text-gray-500">
                There are currently no ongoing events
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="registered" className="space-y-6">
          <h2 className="text-lg font-medium mb-4">My Registrations</h2>
          {registeredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  userId={dbUser.id}
                  studentId={student.id}
                  isRegistered={true}
                  registrationInfo={event.participants[0]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No registrations</h3>
              <p className="text-sm text-gray-500">
                You haven't registered for any events yet
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-6">
          <h2 className="text-lg font-medium mb-4">Past Events</h2>
          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  userId={dbUser.id}
                  studentId={student.id}
                  isRegistered={event.participants.length > 0}
                  isPast={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No past events</h3>
              <p className="text-sm text-gray-500">
                There are no past events to display
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface EventCardProps {
  event: SchoolEvent;
  userId: string;
  studentId: string;
  isRegistered: boolean;
  isOngoing?: boolean;
  isPast?: boolean;
  registrationInfo?: EventParticipant | null;
}

function EventCard({ event, userId, studentId, isRegistered, isOngoing = false, isPast = false, registrationInfo = null }: EventCardProps) {
  // Check if registration is still open
  const now = new Date();
  const isRegistrationOpen = event.registrationDeadline 
    ? isBefore(now, new Date(event.registrationDeadline))
    : isBefore(now, new Date(event.startDate));
  
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

    // Use the parent component's getEventStatusBadge function logic
    function getEventStatusBadge(event: SchoolEvent): JSX.Element {
        const now = new Date();
        
        if (event.status === "CANCELLED") {
            return <Badge variant="destructive">Cancelled</Badge>;
        } else if (event.status === "POSTPONED") {
            return <Badge variant="outline" className="border-amber-500 text-amber-700">Postponed</Badge>;
        } else if (isAfter(new Date(event.startDate), now)) {
            return <Badge variant="outline">Upcoming</Badge>;
        } else if (isBefore(new Date(event.endDate), now)) {
            return <Badge variant="secondary">Completed</Badge>;
        } else {
            return <Badge className="bg-green-100 text-green-800">Ongoing</Badge>;
        }
    }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {event.thumbnail ? (
        <div 
          className="h-40 w-full bg-cover bg-center bg-gray-100" 
          style={{ backgroundImage: `url(${event.thumbnail})` }}
        />
      ) : (
        <div className="h-40 w-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
          <Calendar className="h-10 w-10 text-blue-500" />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
          {getEventStatusBadge(event)}
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
            
            {!isPast && (
              <Button variant="outline" className="w-full mt-1">
                View Details
              </Button>
            )}
          </div>
        ) : isPast ? (
          <Button variant="outline" className="w-full" disabled>
            Event Ended
          </Button>
        ) : isOngoing ? (
          <Button className="w-full">
            Join Now
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
