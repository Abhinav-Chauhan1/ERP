export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ClipboardList, History, ChevronRight } from "lucide-react";
import { MarksEntryForm } from "@/components/admin/marks-entry-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MarksEntryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/assessment" className="hover:text-foreground transition-colors">
          Assessment
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
        <Link href="/admin/assessment/marks-audit" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <History className="mr-2 h-4 w-4" />
            View Audit Logs
          </Button>
        </Link>
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
          <MarksEntryForm />
        </CardContent>
      </Card>
    </div>
  );
}
