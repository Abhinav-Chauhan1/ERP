import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CalendarClock } from "lucide-react";
import Link from "next/link";

interface UpcomingAssessmentsProps {
  exams: any[];
  assignments: any[];
}

export function UpcomingAssessments({ exams, assignments }: UpcomingAssessmentsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Upcoming Assessments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exams" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="exams">
            {exams.length > 0 ? (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div 
                    key={exam.id} 
                    className="flex items-center bg-white border rounded-lg p-3 gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="bg-red-100 p-2 rounded-md">
                      <CalendarClock className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{exam.subject.name}</p>
                      <p className="text-sm text-gray-500 truncate">{exam.examType.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(new Date(exam.examDate), "dd MMM")}</p>
                      <p className="text-xs text-gray-500">{format(new Date(exam.startTime), "h:mm a")}</p>
                    </div>
                  </div>
                ))}
                
                <div className="text-center pt-2">
                  <Link 
                    href="/student/assessments/exams" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View all exams
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">No upcoming exams</p>
            )}
          </TabsContent>
          
          <TabsContent value="assignments">
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="flex items-center bg-white border rounded-lg p-3 gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="bg-amber-100 p-2 rounded-md">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{assignment.title}</p>
                      <p className="text-sm text-gray-500 truncate">{assignment.subject.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(new Date(assignment.dueDate), "dd MMM")}</p>
                      <p className="text-xs text-gray-500">Due date</p>
                    </div>
                  </div>
                ))}
                
                <div className="text-center pt-2">
                  <Link 
                    href="/student/assessments/assignments" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View all assignments
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">No upcoming assignments</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
