import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EventRSVPButton } from '@/components/teacher/events/event-rsvp-button';
import { Calendar, Clock, MapPin, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

async function EventDetailContent({ eventId }: { eventId: string }) {
  const session = await auth();
const userId = session?.user?.id;
  
  if (!userId) {
    redirect('/login');
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      rsvps: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      // participants: EventParticipant doesn't have a user relation, only userId
    },
  });

  if (!event) {
    notFound();
  }

  const userRSVP = event.rsvps.find(rsvp => rsvp.userId === userId);
  const acceptedRSVPs = event.rsvps.filter(rsvp => rsvp.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{event.title}</CardTitle>
                {event.category && (
                  <Badge variant="outline">
                    {event.category.replace(/_/g, ' ')}
                  </Badge>
                )}
                {event.status && (
                  <Badge variant={event.status === 'UPCOMING' ? 'default' : event.status === 'ONGOING' ? 'secondary' : 'outline'}>
                    {event.status}
                  </Badge>
                )}
              </div>
              {event.description && (
                <CardDescription className="text-base">{event.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}

            {event.organizer && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Organizer</p>
                  <p className="text-sm text-muted-foreground">{event.organizer}</p>
                </div>
              </div>
            )}
          </div>

          {event.maxParticipants && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{acceptedRSVPs.length}</span> / {event.maxParticipants} participants
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <EventRSVPButton eventId={event.id} currentStatus={userRSVP?.status || null} />
          </div>
        </CardContent>
      </Card>

      {acceptedRSVPs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendees ({acceptedRSVPs.length})</CardTitle>
            <CardDescription>Teachers who have confirmed attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {acceptedRSVPs.map(rsvp => (
                <div key={rsvp.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {rsvp.user.firstName?.[0]}{rsvp.user.lastName?.[0]}
                    </span>
                  </div>
                  <span className="text-sm">
                    {rsvp.user.firstName} {rsvp.user.lastName}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EventDetailLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/teacher/events">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </div>

      <Suspense fallback={<EventDetailLoading />}>
        <EventDetailContent eventId={id} />
      </Suspense>
    </div>
  );
}
