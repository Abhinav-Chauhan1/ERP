import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Calendar } from "lucide-react";
import { MeetingCard } from "@/components/parent/meetings/meeting-card";

/**
 * Meeting History Page
 * Requirements: 1.1, 1.8
 */

async function MeetingHistoryContent() {
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

  // Fetch past meetings with notes and outcomes
  const meetings = await db.parentMeeting.findMany({
    where: {
      parentId: user.parent.id,
      scheduledDate: {
        lt: new Date(),
      },
      status: {
        in: ["COMPLETED", "CANCELLED"],
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
      scheduledDate: "desc",
    },
    take: 50, // Limit to 50 most recent meetings
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Meeting History
        </h1>
        <p className="text-muted-foreground mt-1">
          View your past meetings with teachers, including notes and outcomes
        </p>
      </div>

      {mappedMeetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No meeting history</h3>
            <p className="text-muted-foreground text-center">
              You don't have any past meetings yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Group meetings by month */}
          {(() => {
            const groupedMeetings = mappedMeetings.reduce((acc, meeting) => {
              const monthYear = new Date(meeting.scheduledDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              });
              if (!acc[monthYear]) {
                acc[monthYear] = [];
              }
              acc[monthYear].push(meeting);
              return acc;
            }, {} as Record<string, typeof mappedMeetings>);

            return Object.entries(groupedMeetings).map(([monthYear, monthMeetings]) => (
              <div key={monthYear} className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground">{monthYear}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {monthMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} isPast />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}

function MeetingHistoryLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MeetingHistoryPage() {
  return (
    <Suspense fallback={<MeetingHistoryLoading />}>
      <MeetingHistoryContent />
    </Suspense>
  );
}
