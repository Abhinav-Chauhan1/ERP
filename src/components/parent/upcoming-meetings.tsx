import Link from "next/link";
import { format } from "date-fns";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UpcomingMeetingsProps {
  meetings: any[];
}

export function UpcomingMeetings({ meetings }: UpcomingMeetingsProps) {
  return (
    <Card className="premium-card hover-lift overflow-hidden">
      <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold tracking-tight">Parent-Teacher Meetings</CardTitle>
        <Link href="/parent/meetings/upcoming" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest">
          View All
        </Link>
      </CardHeader>
      <CardContent className="px-0 pt-4">
        {meetings.length > 0 ? (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="flex gap-4 p-4 rounded-2xl bg-muted/20 border border-muted hover:bg-muted/30 transition-all group">
                <div className="bg-primary/10 rounded-xl h-14 w-14 flex flex-col items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Calendar className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {format(new Date(meeting.scheduledDate), "d MMM")}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{meeting.title}</h3>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {format(new Date(meeting.scheduledDate), "h:mm a")}
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      Teacher: {meeting.teacher.user.firstName}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className={cn(
                      "px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-none",
                      meeting.status === "SCHEDULED" ? "bg-blue-500/10 text-blue-600" :
                        meeting.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600" :
                          "bg-muted text-muted-foreground"
                    )}>
                      {meeting.status}
                    </Badge>

                    {meeting.location && (
                      <span className="text-[10px] font-bold text-muted-foreground/60 underline decoration-primary/30 underline-offset-4">
                        {meeting.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Link href="/parent/meetings/schedule" className="block mt-4">
              <Button variant="outline" className="w-full h-11 font-bold rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-all">
                Schedule New Session
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-10 bg-muted/10 rounded-2xl border border-dashed">
            <p className="text-muted-foreground font-medium mb-6">No sessions scheduled</p>
            <Link href="/parent/meetings/schedule">
              <Button variant="default" className="font-bold rounded-xl h-10 px-6 shadow-lg shadow-primary/20 hover-lift">
                Schedule Now
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
