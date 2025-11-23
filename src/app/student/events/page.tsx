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
                  userId={user.id}
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
                  userId={user.id}
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
                  userId={user.id}
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
                  userId={user.id}
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
