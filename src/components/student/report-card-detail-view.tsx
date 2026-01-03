"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Award, Calendar, TrendingUp, Clock, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { ReportCardData } from "@/lib/services/report-card-data-aggregation";

interface ReportCardDetailViewProps {
  reportCard: ReportCardData;
  onDownload?: () => void;
}

export function ReportCardDetailView({ reportCard, onDownload }: ReportCardDetailViewProps) {
  const { student, term, subjects, coScholastic, attendance, overallPerformance, remarks } = reportCard;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{term.name} Report Card</CardTitle>
              <CardDescription className="mt-2">
                Academic Year: {term.academicYear}
              </CardDescription>
            </div>
            {reportCard.pdfUrl && onDownload && (
              <Button onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Student Information</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Name:</span> {student.name}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Admission ID:</span> {student.admissionId}
                </p>
                {student.rollNumber && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Roll Number:</span> {student.rollNumber}
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-muted-foreground">Class:</span> {student.class} - {student.section}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Term Information</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Start Date:</span>{" "}
                  {new Date(term.startDate).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">End Date:</span>{" "}
                  {new Date(term.endDate).toLocaleDateString()}
                </p>
                {reportCard.publishDate && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Published:</span>{" "}
                    {new Date(reportCard.publishDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Marks</p>
              <p className="text-2xl font-bold">
                {overallPerformance.obtainedMarks} / {overallPerformance.maxMarks}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Percentage</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{overallPerformance.percentage.toFixed(2)}%</p>
              </div>
              <Progress value={overallPerformance.percentage} className="h-2" />
            </div>

            {overallPerformance.grade && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Grade</p>
                <Badge variant="outline" className="text-xl px-4 py-2">
                  <Award className="h-4 w-4 mr-2" />
                  {overallPerformance.grade}
                </Badge>
              </div>
            )}

            {overallPerformance.rank !== null && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Class Rank</p>
                <Badge variant="outline" className="text-xl px-4 py-2">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  #{overallPerformance.rank}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
          <CardDescription>Detailed marks breakdown for each subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Theory</TableHead>
                  <TableHead className="text-right">Practical</TableHead>
                  <TableHead className="text-right">Internal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.subjectId}>
                    <TableCell className="font-medium">
                      {subject.subjectName}
                      {subject.isAbsent && (
                        <Badge variant="destructive" className="ml-2">
                          Absent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {subject.isAbsent ? (
                        <span className="text-muted-foreground">-</span>
                      ) : subject.theoryMarks !== null ? (
                        <span>
                          {subject.theoryMarks} / {subject.theoryMaxMarks}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {subject.isAbsent ? (
                        <span className="text-muted-foreground">-</span>
                      ) : subject.practicalMarks !== null ? (
                        <span>
                          {subject.practicalMarks} / {subject.practicalMaxMarks}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {subject.isAbsent ? (
                        <span className="text-muted-foreground">-</span>
                      ) : subject.internalMarks !== null ? (
                        <span>
                          {subject.internalMarks} / {subject.internalMaxMarks}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {subject.isAbsent ? (
                        <span className="text-muted-foreground">AB</span>
                      ) : (
                        <span>
                          {subject.totalMarks} / {subject.maxMarks}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {subject.isAbsent ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span>{subject.percentage.toFixed(2)}%</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {subject.isAbsent ? (
                        <span className="text-muted-foreground">-</span>
                      ) : subject.grade ? (
                        <Badge variant="outline">{subject.grade}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Co-Scholastic Activities */}
      {coScholastic.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Co-Scholastic Activities</CardTitle>
            <CardDescription>Performance in extracurricular activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coScholastic.map((activity) => (
                <div key={activity.activityId} className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">{activity.activityName}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {activity.assessmentType === "GRADE" ? "Grade" : "Marks"}
                    </span>
                    {activity.assessmentType === "GRADE" ? (
                      <Badge variant="outline">{activity.grade}</Badge>
                    ) : (
                      <span className="font-medium">
                        {activity.marks} / {activity.maxMarks}
                      </span>
                    )}
                  </div>
                  {activity.remarks && (
                    <p className="text-sm text-muted-foreground italic">{activity.remarks}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Attendance Percentage</span>
              </div>
              <p className="text-2xl font-bold">{attendance.percentage?.toFixed(2) || "N/A"}%</p>
              {attendance.percentage !== null && (
                <Progress value={attendance.percentage} className="h-2" />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Days Present</p>
              <p className="text-2xl font-bold">{attendance.daysPresent}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Days</p>
              <p className="text-2xl font-bold">{attendance.totalDays}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remarks */}
      {(remarks.teacherRemarks || remarks.principalRemarks) && (
        <Card>
          <CardHeader>
            <CardTitle>Remarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {remarks.teacherRemarks && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Teacher's Remarks</h4>
                <p className="text-sm text-muted-foreground border-l-4 border-primary pl-4 py-2">
                  {remarks.teacherRemarks}
                </p>
              </div>
            )}

            {remarks.principalRemarks && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Principal's Remarks</h4>
                <p className="text-sm text-muted-foreground border-l-4 border-primary pl-4 py-2">
                  {remarks.principalRemarks}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
