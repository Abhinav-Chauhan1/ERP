import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingCard } from "@/components/parent/meetings/meeting-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, Plus, Calendar } from "lucide-react";
import Link from "next/link";

/**
 * Upcoming Meetings Page
 * Requirements: 1.1, 1.4, 1.5, 1.6
 */

async function UpcomingMeetingsContent() {
  const session = await auth();
    const userId = session?.user?.id;
  
  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { parent: true },
  });

  if (!user || !user.parent) {
    redirect("/parent");
  }

  // Fetch upcoming meetings
  const meetings = await db.parentMeeting.findMany({
    where: {
      parentId: user.parent.id,
      scheduledDate: {
        gte: new Date(),
      },
      status: {
        in: ["SCHEDULED", "REQUESTED", "RESCHEDULED"],
      },
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      scheduledDate: "asc",
    },
  });

  // Map meetings to ensure duration is never null and transform nullable user fields
  const mappedMeetings = meetings.map(meeting => ({
    ...meeting,
    duration: meeting.duration ?? 30, // Default to 30 minutes if null
    teacher: {
      ...meeting.teacher,
      user: {
        ...meeting.teacher.user,
        firstName: meeting.teacher.user.firstName || '',
        lastName: meeting.teacher.user.lastName || '',
        email: meeting.teacher.user.email || '',
        phone: meeting.teacher.user.phone || null,
        avatar: meeting.teacher.user.avatar || null,
      }
    }
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            Upcoming Meetings
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your scheduled meetings with teachers
          </p>
        </div>
        <Button asChild>
          <Link href="/parent/meetings/schedule">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Link>
        </Button>
      </div>

      {mappedMeetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upcoming meetings</h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any scheduled meetings at the moment
            </p>
            <Button asChild>
              <Link href="/parent/meetings/schedule">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Your First Meeting
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mappedMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingMeetingsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function UpcomingMeetingsPage() {
  return (
    <Suspense fallback={<UpcomingMeetingsLoading />}>
      <UpcomingMeetingsContent />
    </Suspense>
  );
}
