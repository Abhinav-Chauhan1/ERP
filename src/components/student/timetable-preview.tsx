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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Today's Schedule ({currentDay})</CardTitle>
      </CardHeader>
      <CardContent>
        {schedule.length > 0 ? (
          <div className="space-y-3">
            {schedule.map((slot, index) => (
              <div key={index} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-blue-50 p-2">
                    <Clock className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium">{slot.subject}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(slot.startTime), "h:mm a")} - {format(new Date(slot.endTime), "h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {slot.teacherName}
                </div>
              </div>
            ))}
            
            <div className="flex justify-end pt-2">
              <Link href="/student/academics/schedule">
                <Button variant="link" size="sm" className="font-normal text-blue-600">
                  Full schedule <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>No classes scheduled for today</p>
            <Link href="/student/academics/schedule">
              <Button variant="link" size="sm" className="font-normal text-blue-600 mt-2">
                View full schedule
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
