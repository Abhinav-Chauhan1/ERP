import Link from "next/link";
import { format } from "date-fns";
import { FileText, BookOpen, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface UpcomingAssessmentsProps {
  exams: any[];
  assignments: any[];
}

export function UpcomingAssessments({ exams, assignments }: UpcomingAssessmentsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Upcoming Assessments</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exams">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="exams">
            {exams.length > 0 ? (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div 
                    key={exam.id} 
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-blue-50 p-2">
                        <FileText className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <h4 className="font-medium">{exam.title}</h4>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" /> {exam.subject.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {format(new Date(exam.examDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-200 text-blue-800">
                      {exam.examType.name}
                    </Badge>
                  </div>
                ))}
                
                <div className="flex justify-end">
                  <Link href="/student/assessments/exams">
                    <Button variant="link" size="sm" className="font-normal text-blue-600">
                      View all exams <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2">No upcoming exams</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assignments">
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-amber-50 p-2">
                        <FileText className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" /> {assignment.subject.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Due: {format(new Date(assignment.dueDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Badge variant={isPastDue(assignment.dueDate) ? "destructive" : "outline"} className={isPastDue(assignment.dueDate) ? "" : "border-amber-200 text-amber-800"}>
                        {isPastDue(assignment.dueDate) ? "Overdue" : "Due soon"}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end">
                  <Link href="/student/assessments/assignments">
                    <Button variant="link" size="sm" className="font-normal text-blue-600">
                      View all assignments <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2">No pending assignments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function isPastDue(dueDate: string | Date) {
  const now = new Date();
  const due = new Date(dueDate);
  return now > due;
}
