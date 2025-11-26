import Link from "next/link";
import { format } from "date-fns";
import { Bell, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecentAnnouncementsProps {
  announcements: any[];
}

export function RecentAnnouncements({ announcements }: RecentAnnouncementsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Announcements</CardTitle>
        <Link href="/parent/communication/announcements" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent>
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border-b pb-4 last:border-0 last:pb-0">
                <h3 className="font-medium text-sm">{announcement.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {announcement.content}
                </p>
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>
                    By: {announcement.publisher.user.firstName} {announcement.publisher.user.lastName}
                  </span>
                  <span>
                    {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}
            
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/parent/communication/announcements">
                View All Announcements
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No announcements available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
