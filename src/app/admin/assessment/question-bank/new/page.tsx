import { QuestionForm } from "@/components/admin/assessment/question-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAdminQuestionPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/assessment/question-bank">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">New Question</h1>
                    <p className="text-muted-foreground">
                        Add a new question to the school question bank
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Question Details</CardTitle>
                    <CardDescription>
                        Fill in the details for the new question
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <QuestionForm />
                </CardContent>
            </Card>
        </div>
    );
}
