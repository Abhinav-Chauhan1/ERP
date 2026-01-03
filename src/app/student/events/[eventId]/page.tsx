import { Metadata } from "next";
import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowLeft, Calendar, MapPin, Users, Clock,
  CheckCircle, AlertTriangle, Tag, ExternalLink
} from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrationDialog } from "@/components/student/event-registration-dialog";
import { getEventDetails } from "@/lib/actions/student-event-actions";
import { EventStatus } from "@prisma/client";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Event Details | Student Portal",
  description: "View details of the event and manage your registration",
};

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  try {
    const {
      student,
      user,
      event,
      isRegistered,
      registration
    } = await getEventDetails(eventId);

    if (!student || !user || !event) {
      return notFound();
    }

    // Format event dates
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const now = new Date();

    // Check if registration is still open
    const isRegistrationOpen = event.registrationDeadline
      ? new Date(event.registrationDeadline) > now
      : startDate > now;

    // Format dates for display
    const sameDay = startDate.toDateString() === endDate.toDateString();
    const dateDisplay = sameDay
      ? `${format(startDate, "MMMM d, yyyy")}`
      : `${format(startDate, "MMMM d")} - ${format(endDate, "MMMM d, yyyy")}`;

    const timeDisplay = sameDay
      ? `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`
      : `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;

    // Helper function to get event status badge
    const getEventStatusBadge = () => {
      if (event.status === EventStatus.CANCELLED) {
        return <Badge variant="destructive">Cancelled</Badge>;
      } else if (event.status === EventStatus.POSTPONED) {
        return <Badge variant="outline" className="border-amber-500 text-amber-700">Postponed</Badge>;
      } else if (startDate > now) {
        return <Badge variant="outline">Upcoming</Badge>;
      } else if (endDate < now) {
        return <Badge variant="secondary">Completed</Badge>;
      } else {
        return <Badge className="bg-green-100 text-green-800">Ongoing</Badge>;
      }
    };

    return (
      <div className="container p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/events">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Events
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Event Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <div className="relative">
                {event.thumbnail ? (
                  <div className="relative h-64 w-full">
                    <Image
                      src={event.thumbnail}
                      alt={event.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-64 w-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-blue-400" />
                  </div>
                )}

                {event.status === EventStatus.CANCELLED && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-red-500 text-white px-4 py-2 rounded-md font-bold text-xl transform -rotate-12">
                      CANCELLED
                    </div>
                  </div>
                )}
              </div>

              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <div>{getEventStatusBadge()}</div>
                </div>
                {event.type && (
                  <CardDescription className="flex items-center text-base">
                    <Tag className="h-4 w-4 mr-1.5" />
                    {event.type}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Date</h3>
                      <p className="text-gray-600">{dateDisplay}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Time</h3>
                      <p className="text-gray-600">{timeDisplay}</p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Location</h3>
                        <p className="text-gray-600">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.maxParticipants && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Capacity</h3>
                        <p className="text-gray-600">{event.maxParticipants} participants</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-2">About This Event</h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {event.description || "No description provided."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registration Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isRegistered ? (
                  <div className="space-y-4">
                    <div className="flex items-center text-green-600 gap-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">You are registered</span>
                    </div>

                    {registration?.role && (
                      <div>
                        <p className="text-sm text-gray-500">Your role</p>
                        <Badge className="mt-1">
                          {registration.role}
                        </Badge>
                      </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg mt-4">
                      <h3 className="font-medium text-blue-800 mb-1">Participant Information</h3>
                      <p className="text-sm text-blue-600">
                        Registration Date: {registration?.registrationDate
                          ? format(new Date(registration.registrationDate), "MMMM d, yyyy")
                          : "N/A"}
                      </p>
                    </div>

                    {endDate > now && event.status !== EventStatus.CANCELLED && (
                      <div className="pt-2 mt-2 border-t">
                        <Button variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-50" asChild>
                          <Link href={`/student/events/${event.id}/cancel`}>
                            Cancel Registration
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : event.status === EventStatus.CANCELLED ? (
                  <div className="space-y-4">
                    <div className="flex items-center text-red-600 gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Event has been cancelled</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      This event has been cancelled by the organizers.
                    </p>
                  </div>
                ) : endDate < now ? (
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-600 gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Event has ended</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      This event has already taken place and registration is closed.
                    </p>
                  </div>
                ) : !isRegistrationOpen ? (
                  <div className="space-y-4">
                    <div className="flex items-center text-amber-600 gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Registration closed</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Registration for this event is no longer available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      You are not registered for this event yet. Register now to secure your spot!
                    </p>

                    {event.registrationDeadline && (
                      <div className="flex items-center text-amber-600 gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>
                          Registration closes on {format(new Date(event.registrationDeadline), "MMMM d, yyyy")}
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                      <RegistrationDialog
                        event={{
                          id: event.id,
                          title: event.title,
                          startDate: event.startDate.toString(),
                          maxParticipants: event.maxParticipants
                        }}
                        userId={user.id}
                        studentId={student.id}
                        isOpen={isRegistrationOpen}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Event Guidelines</h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Please arrive 15 minutes before the event starts</li>
                    <li>Bring your student ID card for verification</li>
                    <li>Follow the event code of conduct</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Contact Information</h3>
                  <p className="text-sm text-gray-600">
                    For any questions or concerns, please contact the event organizers at events@schoolerp.edu
                  </p>
                </div>

                <Button variant="outline" className="w-full mt-2" asChild>
                  <a href="#" className="flex items-center justify-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    View Event Calendar
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching event details:", error);
    return notFound();
  }
}
