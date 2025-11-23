import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionForm } from "@/components/teacher/assessments/question-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getQuestionById } from "@/lib/actions/questionBankActions";
import { notFound } from "next/navigation";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getQuestionById(id);

  if (!result.success || !result.question) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/assessments/question-bank">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Question</h1>
          <p className="text-muted-foreground">
            Update the question details
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>
            Modify the question information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionForm question={result.question} />
        </CardContent>
      </Card>
    </div>
  );
}
