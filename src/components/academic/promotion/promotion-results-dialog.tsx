"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Users,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PromotionResult {
  historyId: string;
  summary: {
    total: number;
    promoted: number;
    excluded: number;
    failed: number;
  };
  promotedStudents: Array<{
    id: string;
    name: string;
    admissionId: string;
    rollNumber: string;
    newClass: string;
    newSection?: string;
  }>;
  failedPromotions: Array<{
    studentId: string;
    studentName: string;
    admissionId: string;
    reason: string;
  }>;
  excludedStudents: Array<{
    studentId: string;
    studentName: string;
    admissionId: string;
    reason: string;
  }>;
}

interface PromotionResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: PromotionResult;
  onExport?: () => void;
  onClose: () => void;
}

export function PromotionResultsDialog({
  open,
  onOpenChange,
  result,
  onExport,
  onClose,
}: PromotionResultsDialogProps) {
  const [activeTab, setActiveTab] = useState("promoted");

  const hasFailures = result.summary.failed > 0;
  const hasExclusions = result.summary.excluded > 0;
  const isFullSuccess = result.summary.promoted === result.summary.total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFullSuccess ? (
              <>
                <PartyPopper className="h-5 w-5 text-green-600" />
                Promotion Completed Successfully!
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Promotion Completed with Issues
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isFullSuccess
              ? "All students have been successfully promoted"
              : "Some students could not be promoted. Review the details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">{result.summary.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg bg-green-50 dark:bg-green-900/10">
              <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{result.summary.promoted}</div>
              <div className="text-xs text-muted-foreground">Promoted</div>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
              <AlertCircle className="h-5 w-5 text-yellow-600 mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{result.summary.excluded}</div>
              <div className="text-xs text-muted-foreground">Excluded</div>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg bg-red-50 dark:bg-red-900/10">
              <XCircle className="h-5 w-5 text-red-600 mb-2" />
              <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>

          <Separator />

          {/* Alerts */}
          {isFullSuccess && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                All {result.summary.promoted} students have been successfully promoted. 
                Alumni profiles have been created for graduating students, and notifications 
                have been sent to students and parents.
              </AlertDescription>
            </Alert>
          )}

          {hasFailures && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Some Promotions Failed</AlertTitle>
              <AlertDescription>
                {result.summary.failed} student(s) could not be promoted. 
                Please review the failures below and take appropriate action.
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs for Different Lists */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="promoted" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Promoted ({result.summary.promoted})
              </TabsTrigger>
              <TabsTrigger value="excluded" className="gap-2" disabled={!hasExclusions}>
                <AlertCircle className="h-4 w-4" />
                Excluded ({result.summary.excluded})
              </TabsTrigger>
              <TabsTrigger value="failed" className="gap-2" disabled={!hasFailures}>
                <XCircle className="h-4 w-4" />
                Failed ({result.summary.failed})
              </TabsTrigger>
            </TabsList>

            {/* Promoted Students */}
            <TabsContent value="promoted" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Admission ID</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>New Class</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.promotedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No students promoted
                        </TableCell>
                      </TableRow>
                    ) : (
                      result.promotedStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.admissionId}</TableCell>
                          <TableCell>{student.rollNumber}</TableCell>
                          <TableCell>
                            {student.newClass}
                            {student.newSection && ` - ${student.newSection}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Promoted
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Excluded Students */}
            <TabsContent value="excluded" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Admission ID</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.excludedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No students excluded
                        </TableCell>
                      </TableRow>
                    ) : (
                      result.excludedStudents.map((student) => (
                        <TableRow key={student.studentId}>
                          <TableCell className="font-medium">{student.studentName}</TableCell>
                          <TableCell>{student.admissionId}</TableCell>
                          <TableCell className="text-muted-foreground">{student.reason}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Failed Promotions */}
            <TabsContent value="failed" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Admission ID</TableHead>
                      <TableHead>Failure Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.failedPromotions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No failed promotions
                        </TableCell>
                      </TableRow>
                    ) : (
                      result.failedPromotions.map((failure) => (
                        <TableRow key={failure.studentId}>
                          <TableCell className="font-medium">{failure.studentName}</TableCell>
                          <TableCell>{failure.admissionId}</TableCell>
                          <TableCell className="text-destructive">{failure.reason}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          {/* History ID */}
          <div className="text-xs text-muted-foreground text-center">
            Promotion History ID: <code className="bg-muted px-2 py-1 rounded">{result.historyId}</code>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onExport && (
            <Button variant="outline" onClick={onExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export Results
            </Button>
          )}
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
