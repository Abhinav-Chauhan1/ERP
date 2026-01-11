import { Suspense } from 'react';
import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { EventCalendar } from '@/components/teacher/events/event-calendar';
import { EventFilters } from '@/components/teacher/events/event-filters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';

async function EventsContent({ searchParams }: { searchParams: Promise<{ category?: string; month?: string; year?: string }> }) {
  const session = await auth();
    const userId = session?.user?.id;
  
  if (!userId) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;

  // Parse date filters
  const currentDate = new Date();
  const month = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : currentDate.getMonth();
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentDate.getFullYear();
  
  // Build filter conditions
  const whereConditions: any = {
    isPublic: true,
  };

  // Add category filter if provided
  if (resolvedSearchParams.category && resolvedSearchParams.category !== 'all') {
    whereConditions.category = resolvedSearchParams.category;
  }

  // Fetch events for the selected month
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  whereConditions.startDate = {
    gte: startOfMonth,
    lte: endOfMonth,
  };

  const events = await prisma.event.findMany({
    where: whereConditions,
    include: {
      rsvps: {
        where: {
          userId,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  // Get user's RSVP status for each event
  const eventsWithRSVP = events.map(event => ({
    ...event,
    userRSVP: event.rsvps[0]?.status || null,
  }));

  return (
    <div className="space-y-6">
      <EventFilters currentCategory={resolvedSearchParams.category} currentMonth={month} currentYear={year} />
      <EventCalendar events={eventsWithRSVP} month={month} year={year} />
    </div>
  );
}

function EventsLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function TeacherEventsPage(
  props: { searchParams: Promise<{ category?: string; month?: string; year?: string }> }
) {
  const searchParams = await props.searchParams;
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Events Calendar</h1>
        </div>
        <p className="text-muted-foreground">
          View school events, meetings, and conferences. RSVP to events you plan to attend.
        </p>
      </div>

      <Suspense fallback={<EventsLoading />}>
        <EventsContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
