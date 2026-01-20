export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Settings, ArrowLeft } from "lucide-react";
import { getExamsForConfig } from "@/lib/actions/subjectMarkConfigActions";
import { formatDate } from "@/lib/utils";

export default async function SubjectMarkConfigPage() {
  const examsResult = await getExamsForConfig();
  const exams = examsResult.success ? examsResult.data : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Subject Mark Configuration</h1>
        </div>
      </div>
      <p className="text-muted-foreground -mt-2 ml-1">
        Configure theory, practical, and internal assessment marks for each subject
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Select an Exam</CardTitle>
          <CardDescription>
            Choose an exam to configure subject mark components
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Settings className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No exams available</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Create an exam first to configure subject mark components.
              </p>
              <Link href="/admin/assessment/exams/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Exam
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Exam</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Term</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Total Marks</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam: any) => (
                      <tr key={exam.id} className="border-b hover:bg-accent/50">
                        <td className="py-3 px-4 align-middle">
                          <div className="font-medium">{exam.title}</div>
                          <div className="text-xs text-muted-foreground">{exam.examType?.name}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {exam.subject?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div>{exam.term?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {exam.term?.academicYear?.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {formatDate(exam.examDate)}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge variant="outline">{exam.totalMarks}</Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Link href={`/admin/assessment/subject-mark-config/${exam.id}`}>
                            <Button variant="outline" size="sm">
                              <Settings className="mr-2 h-3.5 w-3.5" />
                              Configure
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
