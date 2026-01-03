export const dynamic = 'force-dynamic';

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { getSubjectMarkConfigs } from "@/lib/actions/subjectMarkConfigActions";
import { formatDate } from "@/lib/utils";
import { SubjectMarkConfigForm } from "@/components/admin/subject-mark-config-form";
import { DeleteConfigButton } from "@/components/admin/delete-config-button";

interface PageProps {
  params: Promise<{
    examId: string;
  }>;
}

export default async function ExamSubjectMarkConfigPage({ params }: PageProps) {
  const { examId } = await params;

  // Fetch exam details
  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: {
      subject: true,
      examType: true,
      term: {
        include: {
          academicYear: true,
        },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  // Fetch existing configurations
  const configsResult = await getSubjectMarkConfigs(examId);
  const configs = configsResult.success ? configsResult.data : [];

  // Fetch all subjects for the form
  const subjects = await db.subject.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/assessment/subject-mark-config">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Configure Mark Components</h1>
          <p className="text-muted-foreground mt-1">
            {exam.title} - {exam.subject?.name}
          </p>
        </div>
      </div>

      {/* Exam Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Exam Type</p>
              <p className="font-medium">{exam.examType?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Term</p>
              <p className="font-medium">{exam.term?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(exam.examDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Marks</p>
              <Badge variant="outline" className="font-medium">{exam.totalMarks}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Add Subject Configuration</CardTitle>
          <CardDescription>
            Configure theory, practical, and internal assessment marks for a subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubjectMarkConfigForm 
            examId={examId} 
            examTotalMarks={exam.totalMarks}
            subjects={subjects}
          />
        </CardContent>
      </Card>

      {/* Existing Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Subjects</CardTitle>
          <CardDescription>
            Existing mark component configurations for this exam
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <PlusCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No configurations yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Add your first subject mark configuration using the form above.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Theory</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Practical</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Internal</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Total</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((config: any) => (
                      <tr key={config.id} className="border-b hover:bg-accent/50">
                        <td className="py-3 px-4 align-middle">
                          <div className="font-medium">{config.subject.name}</div>
                          <div className="text-xs text-muted-foreground">{config.subject.code}</div>
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          {config.theoryMaxMarks ? (
                            <Badge variant="outline">{config.theoryMaxMarks}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          {config.practicalMaxMarks ? (
                            <Badge variant="outline">{config.practicalMaxMarks}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          {config.internalMaxMarks ? (
                            <Badge variant="outline">{config.internalMaxMarks}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                            {config.totalMarks}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <div className="flex justify-end gap-2">
                            <DeleteConfigButton configId={config.id} />
                          </div>
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
