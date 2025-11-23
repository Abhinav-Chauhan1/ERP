import { OptimizedImage } from "@/components/shared/optimized-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface Activity {
  id: string;
  user: {
    name: string;
    image?: string;
    role: string;
  };
  action: string;
  target: string;
  date: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  className?: string;
}

export function ActivityFeed({ 
  activities, 
  title = "Recent Activity", 
  className 
}: ActivityFeedProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="relative mt-1">
                {activity.user.image ? (
                  <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
                    <OptimizedImage 
                      src={activity.user.image} 
                      alt={activity.user.name}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                      qualityPreset="medium"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 rounded-full bg-primary/10 text-primary items-center justify-center text-sm font-medium">
                    {activity.user.name.charAt(0)}
                  </div>
                )}
                <span 
                  className="absolute bottom-0 right-0 rounded-full w-2.5 h-2.5 bg-green-500 ring-1 ring-white dark:ring-gray-800"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm">
                  <span className="font-medium">{activity.user.name}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="capitalize">{activity.user.role}</span> · {formatDate(activity.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
