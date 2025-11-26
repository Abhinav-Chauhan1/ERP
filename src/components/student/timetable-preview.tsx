"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface TimeTablePreviewProps {
  schedule: any[];
}

export function TimeTablePreview({ schedule }: TimeTablePreviewProps) {
  const [currentDay] = useState(format(new Date(), "EEEE"));

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Today's Schedule</CardTitle>
        <p className="text-sm text-muted-foreground">{currentDay}</p>
      </CardHeader>
      <CardContent>
        {schedule.length > 0 ? (
          <div className="space-y-3">
            {schedule.map((slot, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{slot.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(slot.startTime), "h:mm a")} - {format(new Date(slot.endTime), "h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {slot.teacherName}
                </div>
              </div>
            ))}
            
            <div className="flex justify-end pt-2">
              <Link href="/student/academics/schedule">
                <Button variant="link" size="sm" className="font-normal text-primary">
                  Full schedule <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No classes scheduled for today</p>
            <Link href="/student/academics/schedule">
              <Button variant="link" size="sm" className="font-normal text-primary mt-2">
                View full schedule
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
