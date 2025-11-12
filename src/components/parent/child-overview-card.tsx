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
    child.attendance.percentage >= 90 ? "text-green-600" :
    child.attendance.percentage >= 75 ? "text-blue-600" :
    child.attendance.percentage >= 60 ? "text-amber-600" : "text-red-600";
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-28 w-28 border-4 border-white shadow-md">
              <AvatarImage src={child.user.avatar || ""} alt={child.user.firstName} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {child.user.firstName.charAt(0)}{child.user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {child.isPrimary && (
              <Badge className="bg-blue-600">Primary Child</Badge>
            )}
          </div>
          
          {/* Content Section */}
          <div className="flex-1 space-y-5">
            {/* Name and Email */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {child.user.firstName} {child.user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{child.user.email}</p>
            </div>
            
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Class</p>
                  <p className="text-sm font-semibold truncate">
                    {currentEnrollment ? (
                      `${currentEnrollment.class.name} - ${currentEnrollment.section.name}`
                    ) : (
                      "Not enrolled"
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Admission ID</p>
                  <p className="text-sm font-semibold truncate">{child.admissionId}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Subjects</p>
                  <p className="text-sm font-semibold">{child.subjects.length} Enrolled</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Roll Number</p>
                  <p className="text-sm font-semibold">{child.rollNumber || "Not assigned"}</p>
                </div>
              </div>
            </div>
            
            {/* Attendance Section */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Attendance Rate</span>
                <span className={`text-lg font-bold ${attendanceColor}`}>
                  {child.attendance.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={child.attendance.percentage} 
                className="h-2.5 mb-2" 
              />
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>{child.attendance.presentDays} present</span>
                <span>{child.attendance.totalDays - child.attendance.presentDays} absent</span>
                <span>{child.attendance.totalDays} total days</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" asChild className="flex-1 sm:flex-none">
                <Link href={`/parent/children/${child.id}`}>
                  View Full Profile
                </Link>
              </Button>
              
              <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href={`/parent/performance/results?childId=${child.id}`}>
                  <BarChart2 className="h-4 w-4 mr-1.5" />
                  Performance
                </Link>
              </Button>
              
              <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href={`/parent/academics/schedule?childId=${child.id}`}>
                  <Calendar className="h-4 w-4 mr-1.5" />
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
