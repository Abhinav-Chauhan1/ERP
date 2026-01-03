export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CoScholasticGradeEntryForm } from "@/components/admin/co-scholastic-grade-entry-form";
import {
  getCoScholasticActivities,
  getTermsForCoScholastic,
  getClassesForCoScholastic,
} from "@/lib/actions/coScholasticActions";

export default async function CoScholasticGradesPage() {
  const [activitiesResult, termsResult, classesResult] = await Promise.all([
    getCoScholasticActivities(false),
    getTermsForCoScholastic(),
    getClassesForCoScholastic(),
  ]);

  const activities = activitiesResult.success ? activitiesResult.data : [];
  const terms = termsResult.success ? termsResult.data : [];
  const classes = classesResult.success ? classesResult.data : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/assessment/co-scholastic">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Co-Scholastic Grade Entry</h1>
          <p className="text-muted-foreground mt-1">
            Enter grades for co-scholastic activities
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Entry</CardTitle>
          <CardDescription>
            Select class, section, term, and activity to enter grades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoScholasticGradeEntryForm
            activities={activities}
            terms={terms}
            classes={classes}
          />
        </CardContent>
      </Card>
    </div>
  );
}
