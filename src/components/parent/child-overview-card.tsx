"use client";

import Link from "next/link";
import { BookOpen, Calendar, Clock, BarChart2, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ChildOverviewCardProps {
  child: {
    id: string;
    admissionId: string;
    rollNumber?: string | null;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
    };
    isPrimary: boolean;
    enrollments: Array<{
      class: {
        name: string;
      };
      section: {
        name: string;
      };
    }>;
    subjects: Array<{
      name: string;
    }>;
    attendance: {
      percentage: number;
      totalDays: number;
      presentDays: number;
    };
  };
}

export function ChildOverviewCard({ child }: ChildOverviewCardProps) {
  const currentEnrollment = child.enrollments[0];
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={child.user.avatar || ""} alt={child.user.firstName} />
              <AvatarFallback className="text-xl">
                {child.user.firstName.charAt(0)}{child.user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {child.isPrimary && (
              <Badge className="mt-2">Primary</Badge>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-bold">
                {child.user.firstName} {child.user.lastName}
              </h3>
              <p className="text-gray-500">{child.user.email}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {currentEnrollment ? (
                    <>
                      Class: {currentEnrollment.class.name} - {currentEnrollment.section.name}
                    </>
                  ) : (
                    "Not enrolled in any class"
                  )}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">ID: {child.admissionId}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {child.subjects.length} Subjects
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  Roll #: {child.rollNumber || "N/A"}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Attendance</span>
                <span className="text-sm font-medium">
                  {child.attendance.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={child.attendance.percentage} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500">
                {child.attendance.presentDays} / {child.attendance.totalDays} days present
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button size="sm" asChild>
                <Link href={`/parent/children/${child.id}`}>
                  View Details
                </Link>
              </Button>
              
              <Button size="sm" variant="outline" asChild>
                <Link href={`/parent/performance/results?childId=${child.id}`}>
                  <BarChart2 className="h-4 w-4 mr-1" />
                  View Performance
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
