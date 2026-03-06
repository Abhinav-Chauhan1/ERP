import { QuestionForm } from "@/components/admin/assessment/question-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSchoolQuestionById } from "@/lib/actions/adminQuestionBankActions";
import { notFound } from "next/navigation";

export default async function EditAdminQuestionPage({
    params,
}: {
    params: { id: string };
}) {
    const result = await getSchoolQuestionById(params.id);

    if (!result.success || !result.question) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/assessment/question-bank">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Edit Question</h1>
                    <p className="text-muted-foreground">
                        Make changes to the selected question
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Question Details</CardTitle>
                    <CardDescription>
                        Update the information for this question
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* @ts-ignore - Prisma types compatibility issue with the component */}
                    <QuestionForm question={result.question} />
                </CardContent>
            </Card>
        </div>
    );
}
