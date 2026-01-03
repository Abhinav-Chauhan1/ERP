"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Eye } from "lucide-react";
import { AttendanceDisplay } from "./attendance-display";
import { getAttendanceForReportCard } from "@/lib/actions/reportCardsActions";
import { useToast } from "@/hooks/use-toast";

interface ReportCardViewProps {
  reportCardId: string;
  studentId: string;
  termId: string;
  studentName: string;
  className: string;
  section: string;
  totalMarks?: number;
  percentage?: number;
  grade?: string;
  rank?: number;
  teacherRemarks?: string;
  principalRemarks?: string;
}

export function ReportCardView({
  reportCardId,
  studentId,
  termId,
  studentName,
  className,
  section,
  totalMarks,
  percentage,
  grade,
  rank,
  teacherRemarks,
  principalRemarks,
}: ReportCardViewProps) {
  const { toast } = useToast();
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        setLoading(true);
        const result = await getAttendanceForReportCard(studentId, termId);

        if (result.success && result.data) {
          setAttendanceData(result.data);
        } else {
          toast({
            title: "Warning",
            description: result.error || "Could not load attendance data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
        toast({
          title: "Error",
          description: "Failed to load attendance data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [studentId, termId, toast]);

  return (
    <div className="space-y-6">
      {/* Student Information Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Report Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Student Name</p>
              <p className="font-medium">{studentName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Class</p>
              <p className="font-medium">{className}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Section</p>
              <p className="font-medium">{section}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rank</p>
              <p className="font-medium">{rank || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMarks || "N/A"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Percentage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {percentage ? `${percentage.toFixed(2)}%` : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{grade || "N/A"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Section */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading attendance data...</span>
          </CardContent>
        </Card>
      ) : attendanceData ? (
        <AttendanceDisplay
          percentage={attendanceData.percentage}
          daysPresent={attendanceData.daysPresent}
          totalDays={attendanceData.totalDays}
          daysAbsent={attendanceData.daysAbsent}
          daysLate={attendanceData.daysLate}
          daysHalfDay={attendanceData.daysHalfDay}
          daysLeave={attendanceData.daysLeave}
          isLowAttendance={attendanceData.isLowAttendance}
          showDetails={true}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No attendance data available
          </CardContent>
        </Card>
      )}

      {/* Remarks Section */}
      {(teacherRemarks || principalRemarks) && (
        <Card>
          <CardHeader>
            <CardTitle>Remarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teacherRemarks && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Teacher's Remarks
                </p>
                <p className="text-sm text-gray-600">{teacherRemarks}</p>
              </div>
            )}
            {principalRemarks && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Principal's Remarks
                </p>
                <p className="text-sm text-gray-600">{principalRemarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview PDF
        </Button>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Report Card
        </Button>
      </div>
    </div>
  );
}
