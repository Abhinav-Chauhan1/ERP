export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardList, ChevronRight } from "lucide-react";
import { TeacherMarksEntryForm } from "@/components/teacher/teacher-marks-entry-form";
import Link from "next/link";

export default async function TeacherMarksEntryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/teacher/assessments" className="hover:text-foreground transition-colors">
          Assessments
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Marks Entry</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marks Entry</h1>
          <p className="text-muted-foreground mt-1">
            Enter marks for offline exams in bulk
          </p>
        </div>
      </div>

      <Alert>
        <ClipboardList className="h-4 w-4" />
        <AlertDescription>
          Select an exam, class, and section to begin entering marks. Make sure subject mark
          configuration is set up for the exam before entering marks.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Select Exam and Class</CardTitle>
          <CardDescription>
            Choose the exam and class/section for which you want to enter marks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherMarksEntryForm />
        </CardContent>
      </Card>
    </div>
  );
}
