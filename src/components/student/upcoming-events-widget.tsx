import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, ChevronRight, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUpcomingEventsForDashboard } from "@/lib/actions/student-event-actions";

export async function UpcomingEventsWidget() {
  const events = await getUpcomingEventsForDashboard();
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex items-start gap-3 pb-3 border-b last:pb-0 last:border-b-0">
                <div className="bg-primary/10 h-10 w-10 rounded-md flex flex-col items-center justify-center text-primary">
                  <span className="text-xs font-medium">
                    {format(new Date(event.startDate), "MMM")}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {format(new Date(event.startDate), "d")}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{event.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(event.startDate), "h:mm a")}
                    </div>
                    {event.type && (
                      <Badge variant="outline" className="text-xs">
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {event.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/student/events">
                View All Events
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No upcoming events at this time
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/student/events">Browse Events</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
