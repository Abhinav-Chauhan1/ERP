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
    <Card className="premium-card hover-lift overflow-hidden">
      <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold tracking-tight">Announcements</CardTitle>
        <Link href="/parent/communication/announcements" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest">
          View All
        </Link>
      </CardHeader>
      <CardContent className="px-0 pt-4">
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 rounded-2xl bg-muted/20 border border-muted hover:bg-muted/30 transition-all group">
                <h3 className="font-bold text-base group-hover:text-primary transition-colors">{announcement.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {announcement.content}
                </p>
                <div className="flex justify-between items-center mt-4 pt-3 border-t text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    {announcement.publisher.user.firstName}
                  </span>
                  <span>
                    {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}

            <Link href="/parent/communication/announcements" className="block mt-4">
              <Button variant="ghost" className="w-full h-11 font-bold text-primary hover:bg-primary/5 rounded-xl">
                Show More Notifications
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-2xl">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">Clear for now!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
