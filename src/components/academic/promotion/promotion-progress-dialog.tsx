"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PromotionStatus = "pending" | "processing" | "completed" | "failed";

export interface PromotionProgressData {
  status: PromotionStatus;
  totalStudents: number;
  processedStudents: number;
  successfulPromotions: number;
  failedPromotions: number;
  currentOperation?: string;
  estimatedTimeRemaining?: number;
  error?: string;
}

interface PromotionProgressDialogProps {
  open: boolean;
  data: PromotionProgressData;
}

export function PromotionProgressDialog({
  open,
  data,
}: PromotionProgressDialogProps) {
  const progress = data.totalStudents > 0 
    ? (data.processedStudents / data.totalStudents) * 100 
    : 0;

  const isProcessing = data.status === "processing";
  const isCompleted = data.status === "completed";
  const isFailed = data.status === "failed";

  const formatTime = (seconds?: number) => {
    if (!seconds) return "Calculating...";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isProcessing && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {isFailed && <XCircle className="h-5 w-5 text-red-600" />}
            {isProcessing && "Processing Promotion"}
            {isCompleted && "Promotion Completed"}
            {isFailed && "Promotion Failed"}
          </DialogTitle>
          <DialogDescription>
            {isProcessing && "Please wait while we promote the students..."}
            {isCompleted && "All students have been successfully promoted"}
            {isFailed && "An error occurred during promotion"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {data.processedStudents} of {data.totalStudents} students
              </span>
              {isProcessing && data.estimatedTimeRemaining && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(data.estimatedTimeRemaining)}
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground mb-1" />
              <div className="text-lg font-bold">{data.totalStudents}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mb-1" />
              <div className="text-lg font-bold">{data.successfulPromotions}</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 mb-1" />
              <div className="text-lg font-bold">{data.failedPromotions}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>

          {/* Current Operation */}
          {isProcessing && data.currentOperation && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Current Operation</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {data.currentOperation}
              </p>
            </div>
          )}

          {/* Error Message */}
          {isFailed && data.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Error</span>
              </div>
              <p className="text-sm text-destructive/90">
                {data.error}
              </p>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge
              variant={
                isCompleted ? "default" : 
                isFailed ? "destructive" : 
                "secondary"
              }
              className={cn(
                "px-4 py-1",
                isProcessing && "animate-pulse"
              )}
            >
              {isProcessing && "Processing..."}
              {isCompleted && "Completed Successfully"}
              {isFailed && "Failed"}
            </Badge>
          </div>

          {/* Important Note */}
          {isProcessing && (
            <div className="text-xs text-center text-muted-foreground">
              Please do not close this window or navigate away
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
