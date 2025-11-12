"use client";

import { format } from "date-fns";
import { Award, BookOpen, Calendar, CheckCircle, TrendingUp, User, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { ProgressReportData } from "@/types/performance";

interface ProgressReportCardProps {
  report: ProgressReportData;
}

export function ProgressReportCard({ report }: ProgressReportCardProps) {
  const getGradeBadgeVariant = (grade: string | null) => {
    if (!grade) return "outline";
    if (["A+", "A"].includes(grade)) return "default";
    if (["B+", "B"].includes(grade)) return "secondary";
    if (["C"].includes(grade)) return "outline";
    return "destructive";
  };

  const attendancePercentage = report.attendance.percentage || 0;
  const academicPercentage = report.academicPerformance.percentage || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Progress Report</CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{report.student.name}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{report.student.class} - {report.student.section}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{report.term.name} ({report.term.academicYear})</span>
              </div>
            </div>
          </div>
          {report.isPublished && report.publishDate && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Published {format(new Date(report.publishDate), "MMM d, yyyy")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Performance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">Overall Grade</p>
            <p className="text-2xl font-bold text-blue-700">
              {report.academicPerformance.grade || "N/A"}
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-xs text-purple-600 mb-1">Percentage</p>
            <p className="text-2xl font-bold text-purple-700">
              {academicPercentage.toFixed(1)}%
            </p>
          </div>

          {report.academicPerformance.rank && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-xs text-yellow-600 mb-1 flex items-center gap-1">
                <Award className="h-3 w-3" />
                Class Rank
              </p>
              <p className="text-2xl font-bold text-yellow-700">
                #{report.academicPerformance.rank}
              </p>
            </div>
          )}

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-xs text-green-600 mb-1">Attendance</p>
            <p className="text-2xl font-bold text-green-700">
              {attendancePercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        <Separator />

        {/* Subject-wise Performance */}
        <div>
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subject-wise Performance
          </h3>
          <div className="space-y-3">
            {report.academicPerformance.subjectResults.map((subject, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{subject.subject}</h4>
                  <Badge variant={getGradeBadgeVariant(subject.grade)}>
                    {subject.grade || "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>Marks: {subject.marks}/{subject.totalMarks}</span>
                  <span className="font-medium">{subject.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={subject.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Attendance Details */}
        <div>
          <h3 className="font-semibold text-sm mb-4">Attendance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total Days</p>
              <p className="text-lg font-bold">{report.attendance.totalDays}</p>
            </div>
            <div className="border rounded-lg p-3 bg-green-50">
              <p className="text-xs text-green-600 mb-1">Present</p>
              <p className="text-lg font-bold text-green-700">{report.attendance.presentDays}</p>
            </div>
            <div className="border rounded-lg p-3 bg-red-50">
              <p className="text-xs text-red-600 mb-1">Absent</p>
              <p className="text-lg font-bold text-red-700">{report.attendance.absentDays}</p>
            </div>
            <div className="border rounded-lg p-3 bg-yellow-50">
              <p className="text-xs text-yellow-600 mb-1">Late</p>
              <p className="text-lg font-bold text-yellow-700">{report.attendance.lateDays}</p>
            </div>
          </div>

          {/* Attendance Correlation */}
          {attendancePercentage >= 90 && academicPercentage >= 75 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Strong Correlation</p>
                <p>Excellent attendance is positively impacting academic performance.</p>
              </div>
            </div>
          )}
          {attendancePercentage < 75 && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-700">
                <p className="font-medium">Attendance Alert</p>
                <p>Low attendance may be affecting academic performance. Regular attendance is important.</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Strengths and Areas for Improvement */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Strengths */}
          {report.strengths.length > 0 && (
            <div className="border rounded-lg p-4 bg-green-50/50">
              <h3 className="font-semibold text-sm mb-3 text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {report.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {report.areasForImprovement.length > 0 && (
            <div className="border rounded-lg p-4 bg-yellow-50/50">
              <h3 className="font-semibold text-sm mb-3 text-yellow-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {report.areasForImprovement.map((area, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Teacher and Principal Remarks */}
        {(report.teacherRemarks || report.principalRemarks) && (
          <>
            <Separator />
            <div className="space-y-4">
              {report.teacherRemarks && (
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-semibold text-sm mb-2 text-blue-700">Teacher's Remarks</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.teacherRemarks}</p>
                </div>
              )}

              {report.principalRemarks && (
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <h3 className="font-semibold text-sm mb-2 text-purple-700">Principal's Remarks</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.principalRemarks}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Behavioral Assessment (if available) */}
        {(report.behavioralAssessment.discipline ||
          report.behavioralAssessment.participation ||
          report.behavioralAssessment.leadership ||
          report.behavioralAssessment.teamwork) && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-4">Behavioral Assessment</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {report.behavioralAssessment.discipline && (
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Discipline</p>
                    <p className="text-sm font-medium">{report.behavioralAssessment.discipline}</p>
                  </div>
                )}
                {report.behavioralAssessment.participation && (
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Participation</p>
                    <p className="text-sm font-medium">{report.behavioralAssessment.participation}</p>
                  </div>
                )}
                {report.behavioralAssessment.leadership && (
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Leadership</p>
                    <p className="text-sm font-medium">{report.behavioralAssessment.leadership}</p>
                  </div>
                )}
                {report.behavioralAssessment.teamwork && (
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Teamwork</p>
                    <p className="text-sm font-medium">{report.behavioralAssessment.teamwork}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Report Period */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          Report Period: {format(new Date(report.term.startDate), "MMM d, yyyy")} -{" "}
          {format(new Date(report.term.endDate), "MMM d, yyyy")}
        </div>
      </CardContent>
    </Card>
  );
}
