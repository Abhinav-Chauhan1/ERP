export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, BookOpen, GraduationCap, School2 } from "lucide-react";
import { getPreBuiltTemplates } from "@/lib/actions/reportCardTemplateActions";
import { getClassesForDropdown } from "@/lib/actions/sectionsActions";
import { AssignTemplateButton } from "@/components/admin/report-cards/assign-template-button";

const PRE_BUILT_DEFS = [
  {
    cbseLevel: "CBSE_PRIMARY",
    name: "CBSE Primary (Class 1–8)",
    description:
      "Annual report card with PT(10) + Multiple Assessment(5) + Portfolio(5) + Half Yearly(80) per term. Two-term layout with co-scholastic sections on a 5-point and 3-point grade scale.",
    Icon: BookOpen,
    badge: "Class 1–8",
    features: [
      "PT / MA / Portfolio / HY columns",
      "Two-term layout",
      "Co-scholastic (5-pt & 3-pt scale)",
      "CBSE grade scale table",
    ],
  },
  {
    cbseLevel: "CBSE_SECONDARY",
    name: "CBSE Secondary (Class 9–10)",
    description:
      "Annual report card with Theory and Practical/Internal columns. Pass mark 33% per subject. Grade awarded on CBSE 9-point scale.",
    Icon: School2,
    badge: "Class 9–10",
    features: [
      "Theory + Practical/Internal columns",
      "Pass / Fail per subject",
      "33% pass mark",
      "CBSE grade scale table",
    ],
  },
  {
    cbseLevel: "CBSE_SENIOR",
    name: "CBSE Senior Secondary (Class 11–12)",
    description:
      "Annual report card with Theory (70/80) and Practical/Internal (30/20) columns. Pass requires 33% in theory and practical separately.",
    Icon: GraduationCap,
    badge: "Class 11–12",
    features: [
      "Theory (70/80) + Practical (30/20)",
      "Separate pass check for theory & practical",
      "Single annual exam layout",
      "CBSE grade scale table",
    ],
  },
] as const;

export default async function ReportCardTemplatesPage() {
  const [templatesResult, classesResult] = await Promise.all([
    getPreBuiltTemplates(),
    getClassesForDropdown(),
  ]);

  const templates: any[] = templatesResult.success ? (templatesResult.data ?? []) : [];
  const classes: any[] = classesResult.success ? (classesResult.data ?? []) : [];

  // Map cbseLevel → DB template record (if seeded)
  const templateByLevel = new Map<string, any>(
    templates.map((t: any) => [t.cbseLevel, t]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/assessment/report-cards">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Card Templates</h1>
          <p className="text-muted-foreground mt-1">
            Select a pre-built CBSE template and assign it to your classes
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PRE_BUILT_DEFS.map((def) => {
          const dbTemplate = templateByLevel.get(def.cbseLevel);
          const { Icon } = def;

          return (
            <Card key={def.cbseLevel} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base leading-tight">{def.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {def.badge}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="mt-2 text-sm">{def.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 flex-1">
                <ul className="space-y-1.5">
                  {def.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-2">
                  {dbTemplate ? (
                    <AssignTemplateButton
                      templateId={dbTemplate.id}
                      templateName={def.name}
                      cbseLevel={def.cbseLevel}
                      classes={classes}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Run the seed script to activate this template for your school.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {classes.length > 0 && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Class Assignments</CardTitle>
            <CardDescription>Which template is assigned to each class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {classes.map((cls: any) => {
                const assigned = templates.find((t: any) => t.id === cls.reportCardTemplateId);
                return (
                  <div key={cls.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{cls.name}</span>
                    {assigned ? (
                      <Badge variant="outline">{assigned.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">No template assigned</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
