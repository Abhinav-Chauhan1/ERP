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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
        <Link href="/parent/meetings/upcoming" className="text-sm text-blue-600 hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent>
        {meetings.length > 0 ? (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                <div className="bg-blue-50 rounded-md h-12 w-12 flex flex-col items-center justify-center text-blue-700">
                  <Calendar className="h-5 w-5 mb-0.5" />
                  <span className="text-xs font-medium">
                    {format(new Date(meeting.scheduledDate), "d MMM")}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium">{meeting.title}</h3>
                  
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {format(new Date(meeting.scheduledDate), "h:mm a")}
                    </div>
                    
                    <div>
                      Teacher: {meeting.teacher.user.firstName} {meeting.teacher.user.lastName}
                    </div>
                    
                    {meeting.location && (
                      <div>Location: {meeting.location}</div>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <Badge variant={
                      meeting.status === "SCHEDULED" ? "outline" :
                      meeting.status === "COMPLETED" ? "secondary" :
                      meeting.status === "CANCELLED" ? "destructive" :
                      "default"
                    }>
                      {meeting.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/parent/meetings/schedule">
                Schedule New Meeting
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">No upcoming meetings scheduled</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/parent/meetings/schedule">Schedule Meeting</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
