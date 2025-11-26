export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Tag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/student/event-card";
import { getStudentEvents } from "@/lib/actions/student-event-actions";

export const metadata: Metadata = {
  title: "Events & Activities | Student Portal",
  description: "View and register for school events and activities",
};

export default async function StudentEventsPage() {
  const { 
    student, 
    user, 
    upcomingEvents, 
    ongoingEvents, 
    pastEvents, 
    registeredEvents 
  } = await getStudentEvents();

  if (!student || !user) {
    return null; // This will be handled by the action itself
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Events & Activities</h1>
        <p className="text-muted-foreground mt-1">
          View and register for school events and activities
        </p>
      </div>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="registered">My Registrations</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-6 mt-6">
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  userId={user.id}
                  studentId={student.id}
                  isRegistered={event.participants.length > 0}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
              <p className="text-muted-foreground max-w-sm">
                Check back later for new upcoming events
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="ongoing" className="space-y-6 mt-6">
          {ongoingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ongoingEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  userId={user.id}
                  studentId={student.id}
                  isRegistered={event.participants.length > 0}
                  isOngoing={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No ongoing events</h3>
              <p className="text-muted-foreground max-w-sm">
                There are currently no ongoing events
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="registered" className="space-y-6 mt-6">
          {registeredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  userId={user.id}
                  studentId={student.id}
                  isRegistered={true}
                  registrationInfo={event.participants[0]}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <CheckCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No registrations</h3>
              <p className="text-muted-foreground max-w-sm">
                You haven't registered for any events yet
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-6 mt-6">
          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  userId={user.id}
                  studentId={student.id}
                  isRegistered={event.participants.length > 0}
                  isPast={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No past events</h3>
              <p className="text-muted-foreground max-w-sm">
                There are no past events to display
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
