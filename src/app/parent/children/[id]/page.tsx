import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getChildDetails } from "@/lib/actions/parent-children-actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, GraduationCap, MapPin, School } from "lucide-react";
import { ChildDetailTabs } from "@/components/parent/child-detail-tabs";

export const metadata: Metadata = {
  title: "Child Details | Parent Portal",
  description: "View detailed information about your child",
};

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params before accessing properties
  const param = await params;
  const childId = param.id;
  
  const childDetails = await getChildDetails(childId);
  
  if (!childDetails || !childDetails.student) {
    notFound();
  }
  
  const { student, currentEnrollment } = childDetails;
  
  // Type assertion to help TypeScript understand the student includes user relation
  const studentWithUser = student as typeof student & {
    user: {
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
    };
  };
  
  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="mb-6" asChild>
        <Link href="/parent/children/overview">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Children
        </Link>
      </Button>
      
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 rounded-xl p-8 mb-8 border border-blue-100">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-40 w-40 border-4 border-white shadow-xl">
              <AvatarImage src={studentWithUser.user.avatar || ""} alt={studentWithUser.user.firstName || 'Student'} />
              <AvatarFallback className="text-5xl bg-gradient-to-br from-blue-500 to-teal-600 text-white">
                {(studentWithUser.user.firstName || 'S').charAt(0)}{(studentWithUser.user.lastName || 'T').charAt(0)}
              </AvatarFallback>
            </Avatar>
            {childDetails.isPrimary && (
              <Badge className="bg-blue-600 text-white">Primary Child</Badge>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {studentWithUser.user.firstName || ''} {studentWithUser.user.lastName || ''}
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Admission ID: <span className="font-semibold">{student.admissionId}</span>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Current Class</p>
                  <p className="text-sm font-semibold">
                    {currentEnrollment ? (
                      `${currentEnrollment.class.name} - ${currentEnrollment.section.name}`
                    ) : (
                      "Not enrolled"
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <School className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Roll Number</p>
                  <p className="text-sm font-semibold">{student.rollNumber || "Not assigned"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Date of Birth</p>
                  <p className="text-sm font-semibold">{format(new Date(student.dateOfBirth), "PPP")}</p>
                </div>
              </div>
              
              {student.address && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Address</p>
                    <p className="text-sm font-semibold truncate">{student.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Comprehensive Academic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Grades Summary */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Current Grades
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/parent/children/${childId}/performance`}>
                  View Analytics
                </Link>
              </Button>
            </div>
            {childDetails.examResults && childDetails.examResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {childDetails.examResults.slice(0, 6).map((result: any) => (
                  <div key={result.id} className="bg-muted rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{result.exam.subject.name}</h3>
                        <p className="text-xs text-muted-foreground">{result.exam.title}</p>
                      </div>
                      <Badge variant={
                        (result.marks / result.exam.totalMarks * 100) >= 90 ? "default" :
                        (result.marks / result.exam.totalMarks * 100) >= 75 ? "secondary" : "outline"
                      }>
                        {result.grade || `${(result.marks / result.exam.totalMarks * 100).toFixed(0)}%`}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Score</span>
                      <span className="font-semibold">{result.marks}/{result.exam.totalMarks}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No grades available yet</p>
            )}
          </div>
        </div>

        {/* Attendance Summary Card */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Attendance
          </h2>
          <div className="text-center mb-4">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-2">
              <span className="text-3xl font-bold text-primary">
                {childDetails.attendanceStats.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950 rounded">
              <span className="text-sm">Present</span>
              <span className="font-semibold">{childDetails.attendanceStats.presentDays} days</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950 rounded">
              <span className="text-sm">Absent</span>
              <span className="font-semibold">{childDetails.attendanceStats.absentDays} days</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-950 rounded">
              <span className="text-sm">Late</span>
              <span className="font-semibold">{childDetails.attendanceStats.lateDays} days</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/parent/children/${childId}/attendance`}>
              View Calendar
            </Link>
          </Button>
        </div>
      </div>

      {/* Assignments Section */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <School className="h-5 w-5 text-primary" />
          Current Assignments
        </h2>
        {childDetails.assignments && childDetails.assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childDetails.assignments.map((assignment: any) => (
              <div key={assignment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{assignment.title}</h3>
                  <Badge variant={assignment.submissions.length > 0 ? "default" : "secondary"}>
                    {assignment.submissions.length > 0 ? "Submitted" : "Pending"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{assignment.subject.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                </div>
                {assignment.description && (
                  <p className="text-sm mt-2 line-clamp-2">{assignment.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No current assignments</p>
        )}
      </div>

      {/* Behavior Records Section */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Behavior Records
        </h2>
        {childDetails.behaviorRecords && childDetails.behaviorRecords.length > 0 ? (
          <div className="space-y-3">
            {childDetails.behaviorRecords.map((record: any) => (
              <div key={record.id} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium">{record.title}</h3>
                  <Badge variant={record.type === 'POSITIVE' ? 'default' : record.type === 'NEGATIVE' ? 'destructive' : 'secondary'}>
                    {record.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{record.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(record.date), "MMM d, yyyy")} • {record.teacher?.user?.firstName} {record.teacher?.user?.lastName}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No behavior records</p>
        )}
      </div>

      {/* Tabs */}
      <ChildDetailTabs childDetails={childDetails} />
    </div>
  );
}
