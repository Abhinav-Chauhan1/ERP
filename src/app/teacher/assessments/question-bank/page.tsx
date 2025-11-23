export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { QuestionBankList } from "@/components/teacher/assessments/question-bank-list";
import { QuestionBankStats } from "@/components/teacher/assessments/question-bank-stats";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionBankPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">
            Manage your question bank for online examinations
          </p>
        </div>
        <Link href="/teacher/assessments/question-bank/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </Link>
      </div>

      <Suspense fallback={<StatsLoadingSkeleton />}>
        <QuestionBankStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>All Questions</CardTitle>
          <CardDescription>
            Browse and manage your question bank
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ListLoadingSkeleton />}>
            <QuestionBankList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      ))}
    </div>
  );
}
