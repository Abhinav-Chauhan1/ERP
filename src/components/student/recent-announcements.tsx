import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentAnnouncementsProps {
  announcements: any[];
}

export function RecentAnnouncements({ announcements }: RecentAnnouncementsProps) {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Recent Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-medium line-clamp-1">{announcement.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(announcement.createdAt), "MMM dd")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {truncateText(announcement.content, 100)}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>By {announcement.publisher.user.firstName} {announcement.publisher.user.lastName}</span>
                  <Link href={`/student/communication/announcements/${announcement.id}`}>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-primary hover:underline">
                      Read more
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end">
              <Link href="/student/communication/announcements">
                <Button variant="link" size="sm" className="font-normal text-primary">
                  All announcements <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2">No announcements yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
