import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { 
  BookOpen, 
  CalendarDays, 
  Clock, 
  GraduationCap, 
  File, 
  ChevronRight 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyChildren } from "@/lib/actions/parent-children-actions";
import { getChildAcademicProcess } from "@/lib/actions/parent-academic-actions";

export const metadata: Metadata = {
  title: "Academics | Parent Portal",
  description: "Track your child's academic progress",
};

export default async function ParentAcademicsPage() {
  const { children } = await getMyChildren();
  
  if (!children || children.length === 0) {
    return (
      <div className="container p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">No children found in your account. Please contact the school administration.</p>
              <Button className="mt-4" asChild>
                <a href="/parent">Return to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get the first child's data by default
  const firstChildId = children[0].id;
  const academicData = await getChildAcademicProcess(firstChildId);
  
  return (
    <div className="container p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Academic Process</h1>
          <p className="text-gray-500">Track your children's academic progress</p>
        </div>
      </div>
      
      <Tabs defaultValue={firstChildId} className="space-y-6">
        <TabsList className="mb-4">
          {children.map(child => (
            <TabsTrigger key={child.id} value={child.id}>
              {child.user.firstName} {child.user.lastName}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {children.map(child => (
          <TabsContent key={child.id} value={child.id} className="space-y-6">
            {/* Academic Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Academic Overview
                </CardTitle>
                <CardDescription>
                  Current class and enrollment information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Current Class</h3>
                    <p className="text-lg font-semibold">
                      {academicData.currentEnrollment 
                        ? `${academicData.currentEnrollment.class.name} - ${academicData.currentEnrollment.section.name}` 
                        : "Not enrolled in any class"}
                    </p>
                    
                    <h3 className="font-medium text-sm text-gray-500 mt-4">Roll Number</h3>
                    <p className="text-lg font-semibold">
                      {academicData.student.rollNumber || "Not assigned"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Admission ID</h3>
                    <p className="text-lg font-semibold">{academicData.student.admissionId}</p>
                    
                    <h3 className="font-medium text-sm text-gray-500 mt-4">Enrollment Status</h3>
                    <p className="text-lg font-semibold">
                      {academicData.currentEnrollment?.status || "Not available"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Subjects Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Subjects
                </CardTitle>
                <CardDescription>
                  Subjects and teachers for current class
                </CardDescription>
              </CardHeader>
              <CardContent>
                {academicData.subjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {academicData.subjects.map(subject => (
                      <div key={subject.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{subject.name}</h3>
                            <p className="text-sm text-gray-500">Code: {subject.code}</p>
                          </div>
                          <Link 
                            href={`/parent/academics/subjects/${subject.id}?childId=${child.id}`} 
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Teacher(s):</p>
                          <ul className="text-sm">
                            {subject.teachers.map((teacher: { id: string; name: string }) => (
                              <li key={teacher.id}>{teacher.name}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No subjects assigned yet</p>
                )}
              </CardContent>
            </Card>
            
            {/* Timetable Preview */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5" />
                    <CardTitle>Class Timetable</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/parent/academics/timetable?childId=${child.id}`}>
                      View Full Timetable
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Weekly schedule of classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {academicData.timetable.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-4 py-2 text-left">Day</th>
                          <th className="border px-4 py-2 text-left">Time</th>
                          <th className="border px-4 py-2 text-left">Subject</th>
                          <th className="border px-4 py-2 text-left">Teacher</th>
                          <th className="border px-4 py-2 text-left">Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {academicData.timetable.slice(0, 5).map((slot, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="border px-4 py-2">{slot.day}</td>
                            <td className="border px-4 py-2">
                              {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="border px-4 py-2">{slot.subjectTeacher.subject.name}</td>
                            <td className="border px-4 py-2">
                              {slot.subjectTeacher.teacher.user.firstName} {slot.subjectTeacher.teacher.user.lastName}
                            </td>
                            <td className="border px-4 py-2">{slot.room?.name || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No timetable available</p>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Assignments */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <File className="mr-2 h-5 w-5" />
                    <CardTitle>Recent Assignments</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/parent/academics/assignments?childId=${child.id}`}>
                      View All Assignments
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Recent homework and assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {academicData.assignments.length > 0 ? (
                  <div className="space-y-4">
                    {academicData.assignments.slice(0, 3).map(assignment => (
                      <div key={assignment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{assignment.title}</h3>
                            <p className="text-sm text-gray-500">Subject: {assignment.subject.name}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              new Date(assignment.dueDate) < new Date() ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </div>
                            <div className={`text-xs ${
                              assignment.submissions.length > 0 ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              {assignment.submissions.length > 0 ? 'Submitted' : 'Pending'}
                            </div>
                          </div>
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mt-2">{assignment.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No assignments available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
