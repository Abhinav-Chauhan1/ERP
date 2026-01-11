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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  Bell,
  Hash,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PromotionConfirmData {
  totalStudents: number;
  eligibleStudents: number;
  studentsWithWarnings: number;
  warnings: Array<{
    studentId: string;
    studentName: string;
    warnings: string[];
  }>;
}

export interface PromotionConfirmResult {
  excludedStudents: Array<{
    studentId: string;
    reason: string;
  }>;
  rollNumberStrategy: "auto" | "manual" | "preserve";
  sendNotifications: boolean;
}

interface PromotionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PromotionConfirmData;
  onConfirm: (result: PromotionConfirmResult) => void;
  onCancel: () => void;
}

export function PromotionConfirmDialog({
  open,
  onOpenChange,
  data,
  onConfirm,
  onCancel,
}: PromotionConfirmDialogProps) {
  const [rollNumberStrategy, setRollNumberStrategy] = useState<"auto" | "manual" | "preserve">("auto");
  const [sendNotifications, setSendNotifications] = useState(true);
  const [excludedStudents, setExcludedStudents] = useState<
    Array<{ studentId: string; reason: string }>
  >([]);
  const [exclusionReasons, setExclusionReasons] = useState<Record<string, string>>({});

  const hasWarnings = data.studentsWithWarnings > 0;
  const studentsToPromote = data.totalStudents - excludedStudents.length;

  const handleExcludeStudent = (studentId: string) => {
    const reason = exclusionReasons[studentId] || "Has warnings";
    setExcludedStudents([...excludedStudents, { studentId, reason }]);
  };

  const handleIncludeStudent = (studentId: string) => {
    setExcludedStudents(excludedStudents.filter((s) => s.studentId !== studentId));
  };

  const isExcluded = (studentId: string) => {
    return excludedStudents.some((s) => s.studentId === studentId);
  };

  const handleConfirm = () => {
    onConfirm({
      excludedStudents,
      rollNumberStrategy,
      sendNotifications,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Promotion</DialogTitle>
          <DialogDescription>
            Review and configure promotion settings before executing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-lg font-bold">{data.totalStudents}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-lg font-bold">{studentsToPromote}</div>
                <div className="text-xs text-muted-foreground">To Promote</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <X className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-lg font-bold">{excludedStudents.length}</div>
                <div className="text-xs text-muted-foreground">Excluded</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Warnings and Exclusions */}
          {hasWarnings && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold">Students with Warnings</h4>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.warnings.map((warning) => {
                  const excluded = isExcluded(warning.studentId);
                  return (
                    <div
                      key={warning.studentId}
                      className={cn(
                        "p-3 border rounded-lg space-y-2",
                        excluded && "bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">{warning.studentName}</div>
                          <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                            {warning.warnings.map((w, index) => (
                              <li key={index}>{w}</li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          size="sm"
                          variant={excluded ? "outline" : "destructive"}
                          onClick={() =>
                            excluded
                              ? handleIncludeStudent(warning.studentId)
                              : handleExcludeStudent(warning.studentId)
                          }
                        >
                          {excluded ? "Include" : "Exclude"}
                        </Button>
                      </div>
                      {!excluded && (
                        <Textarea
                          placeholder="Reason for exclusion (optional)"
                          value={exclusionReasons[warning.studentId] || ""}
                          onChange={(e) =>
                            setExclusionReasons({
                              ...exclusionReasons,
                              [warning.studentId]: e.target.value,
                            })
                          }
                          className="text-sm"
                          rows={2}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Roll Number Strategy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <Label className="font-semibold">Roll Number Assignment</Label>
            </div>
            <RadioGroup value={rollNumberStrategy} onValueChange={(value: any) => setRollNumberStrategy(value)}>
              <div className="flex items-start space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="auto" id="auto" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="auto" className="font-medium cursor-pointer">
                    Auto-generate
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign sequential roll numbers
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="preserve" id="preserve" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="preserve" className="font-medium cursor-pointer">
                    Preserve existing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Keep current roll numbers from previous class
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="manual" id="manual" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="manual" className="font-medium cursor-pointer">
                    Manual assignment
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Assign roll numbers manually after promotion
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Notification Settings */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="notifications" className="font-medium cursor-pointer">
                  Send Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify students and parents about promotion
                </p>
              </div>
            </div>
            <Switch
              id="notifications"
              checked={sendNotifications}
              onCheckedChange={setSendNotifications}
            />
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action cannot be easily undone. Please ensure all settings are correct before proceeding.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm & Execute Promotion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
