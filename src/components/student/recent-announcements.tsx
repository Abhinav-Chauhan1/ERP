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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-medium">{announcement.title}</h4>
                  <span className="text-xs text-gray-500">
                    {format(new Date(announcement.createdAt), "MMM dd")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {truncateText(announcement.content, 100)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>By {announcement.publisher.user.firstName} {announcement.publisher.user.lastName}</span>
                  <Link href={`/student/communication/announcements/${announcement.id}`}>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-600">
                      Read more
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end">
              <Link href="/student/communication/announcements">
                <Button variant="link" size="sm" className="font-normal text-blue-600">
                  All announcements <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2">No announcements yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
