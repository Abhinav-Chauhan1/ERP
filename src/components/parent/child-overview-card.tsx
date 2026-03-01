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
  const attendanceColor = 
    child.attendance.percentage >= 90 ? "text-green-600 dark:text-green-500" :
    child.attendance.percentage >= 75 ? "text-primary" :
    child.attendance.percentage >= 60 ? "text-amber-600 dark:text-amber-500" : "text-destructive";
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-28 w-28 border-4 border-card shadow-md">
              <AvatarImage 
                src={child.user.avatar || ""} 
                alt={`${child.user.firstName} ${child.user.lastName}'s profile picture`}
              />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {child.user.firstName.charAt(0)}{child.user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {child.isPrimary && (
              <Badge>Primary Child</Badge>
            )}
          </div>
          
          {/* Content Section */}
          <div className="flex-1 space-y-5">
            {/* Name and Email */}
            <div>
              <h3 className="text-2xl font-bold">
                {child.user.firstName} {child.user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{child.user.email}</p>
            </div>
            
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Class</p>
                  <p className="text-sm font-semibold truncate">
                    {currentEnrollment ? (
                      `${currentEnrollment.class.name} - ${currentEnrollment.section.name}`
                    ) : (
                      "Not enrolled"
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center" aria-hidden="true">
                  <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Admission ID</p>
                  <p className="text-sm font-semibold truncate">{child.admissionId}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center" aria-hidden="true">
                  <BookOpen className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Subjects</p>
                  <p className="text-sm font-semibold">{child.subjects.length} Enrolled</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center" aria-hidden="true">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Roll Number</p>
                  <p className="text-sm font-semibold">{child.rollNumber || "Not assigned"}</p>
                </div>
              </div>
            </div>
            
            {/* Attendance Section */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">Attendance Rate</span>
                <span className={`text-lg font-bold ${attendanceColor}`} aria-label={`Attendance rate: ${child.attendance.percentage.toFixed(1)} percent`}>
                  {child.attendance.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={child.attendance.percentage} 
                className="h-2.5 mb-2"
                aria-label={`Attendance progress: ${child.attendance.percentage.toFixed(1)}%`}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{child.attendance.presentDays} present</span>
                <span>{child.attendance.totalDays - child.attendance.presentDays} absent</span>
                <span>{child.attendance.totalDays} total days</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" asChild className="flex-1 sm:flex-none">
                <Link href={`/parent/children/${child.id}`} aria-label={`View full profile for ${child.user.firstName} ${child.user.lastName}`}>
                  View Full Profile
                </Link>
              </Button>
              
              <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href={`/parent/performance/results?childId=${child.id}`} aria-label={`View performance for ${child.user.firstName} ${child.user.lastName}`}>
                  <BarChart2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Performance
                </Link>
              </Button>
              
              <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href={`/parent/academics/schedule?childId=${child.id}`} aria-label={`View schedule for ${child.user.firstName} ${child.user.lastName}`}>
                  <Calendar className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Schedule
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
