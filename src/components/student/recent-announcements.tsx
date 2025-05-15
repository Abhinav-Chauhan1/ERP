import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import Link from "next/link";

interface RecentAnnouncementsProps {
  announcements: any[];
}

export function RecentAnnouncements({ announcements }: RecentAnnouncementsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          <Megaphone className="h-5 w-5 mr-2" />
          Recent Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div 
                key={announcement.id} 
                className="bg-white border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{announcement.title}</h4>
                  <span className="text-xs text-gray-500">
                    {format(new Date(announcement.createdAt), "dd MMM")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {announcement.content}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    By: {announcement.publisher?.user?.firstName || "Admin"}
                  </span>
                  <Link href={`/student/communication/announcements/${announcement.id}`} className="text-xs text-blue-600 hover:underline">
                    Read more
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-gray-500">No recent announcements</p>
          )}
          
          {announcements && announcements.length > 0 && (
            <div className="text-center pt-2">
              <Link
                href="/student/communication/announcements"
                className="text-sm text-blue-600 hover:underline"
              >
                View all announcements
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
