"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  GraduationCap,
  Users,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PromotionPreviewData {
  // Source details
  sourceClassName: string;
  sourceSectionName?: string;
  sourceAcademicYear: string;
  
  // Target details
  targetClassName: string;
  targetSectionName?: string;
  targetAcademicYear: string;
  
  // Student counts
  totalStudents: number;
  eligibleStudents: number;
  studentsWithWarnings: number;
  
  // Warnings
  warnings: Array<{
    studentId: string;
    studentName: string;
    warnings: string[];
  }>;
  
  // Estimated time
  estimatedTimeMinutes: number;
}

interface PromotionPreviewProps {
  data: PromotionPreviewData;
  onProceed?: () => void;
  onCancel?: () => void;
}

export function PromotionPreview({ data }: PromotionPreviewProps) {
  const hasWarnings = data.studentsWithWarnings > 0;
  const estimatedTime = data.estimatedTimeMinutes < 1 
    ? "Less than 1 minute" 
    : `${data.estimatedTimeMinutes} minute${data.estimatedTimeMinutes > 1 ? 's' : ''}`;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Promotion Summary</CardTitle>
          <CardDescription>
            Review the promotion details before proceeding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Promotion Flow */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="text-sm text-muted-foreground">From</div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-semibold">{data.sourceClassName}</div>
                  {data.sourceSectionName && (
                    <div className="text-sm text-muted-foreground">
                      Section {data.sourceSectionName}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {data.sourceAcademicYear}
                  </div>
                </div>
              </div>
            </div>

            <ArrowRight className="h-8 w-8 text-primary flex-shrink-0" />

            <div className="flex-1 space-y-2">
              <div className="text-sm text-muted-foreground">To</div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-primary">{data.targetClassName}</div>
                  {data.targetSectionName && (
                    <div className="text-sm text-muted-foreground">
                      Section {data.targetSectionName}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {data.targetAcademicYear}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data.totalStudents}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data.eligibleStudents}</div>
                <div className="text-sm text-muted-foreground">Eligible</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className={cn(
                "p-2 rounded-lg",
                hasWarnings 
                  ? "bg-yellow-100 dark:bg-yellow-900/20" 
                  : "bg-gray-100 dark:bg-gray-800"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  hasWarnings 
                    ? "text-yellow-600 dark:text-yellow-400" 
                    : "text-gray-400"
                )} />
              </div>
              <div>
                <div className="text-2xl font-bold">{data.studentsWithWarnings}</div>
                <div className="text-sm text-muted-foreground">With Warnings</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Estimated Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated completion time: <strong>{estimatedTime}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Warnings Section */}
      {hasWarnings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Student Warnings
            </CardTitle>
            <CardDescription>
              The following students have warnings. You can proceed with promotion or exclude them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.warnings.map((warning) => (
              <Alert key={warning.studentId} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{warning.studentName}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {warning.warnings.map((w, index) => (
                      <li key={index} className="text-sm">{w}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Important Notes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Before proceeding, please ensure:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>All student information is correct</li>
            <li>Target academic year and class are properly configured</li>
            <li>You have reviewed all warnings and decided on exclusions</li>
            <li>This action will update enrollment status for all selected students</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
