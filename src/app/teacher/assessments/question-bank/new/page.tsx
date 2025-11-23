export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionForm } from "@/components/teacher/assessments/question-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/assessments/question-bank">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Question</h1>
          <p className="text-muted-foreground">
            Create a new question for your question bank
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>
            Fill in the details to create a new question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionForm />
        </CardContent>
      </Card>
    </div>
  );
}
