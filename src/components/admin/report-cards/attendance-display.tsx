"use client";

import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AttendanceDisplayProps {
  percentage: number;
  daysPresent: number;
  totalDays: number;
  daysAbsent?: number;
  daysLate?: number;
  daysHalfDay?: number;
  daysLeave?: number;
  isLowAttendance?: boolean;
  lowAttendanceThreshold?: number;
  showDetails?: boolean;
  className?: string;
}

export function AttendanceDisplay({
  percentage,
  daysPresent,
  totalDays,
  daysAbsent = 0,
  daysLate = 0,
  daysHalfDay = 0,
  daysLeave = 0,
  isLowAttendance = false,
  lowAttendanceThreshold = 75,
  showDetails = true,
  className,
}: AttendanceDisplayProps) {
  // Determine status and styling based on percentage
  const getAttendanceStatus = () => {
    if (totalDays === 0) {
      return {
        label: "No Data",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        icon: Info,
        variant: "secondary" as const,
      };
    }

    if (percentage >= 90) {
      return {
        label: "Excellent",
        color: "text-green-700",
        bgColor: "bg-green-50",
        icon: CheckCircle,
        variant: "default" as const,
      };
    }

    if (percentage >= lowAttendanceThreshold) {
      return {
        label: "Good",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: CheckCircle,
        variant: "default" as const,
      };
    }

    return {
      label: "Needs Improvement",
      color: "text-red-700",
      bgColor: "bg-red-50",
      icon: AlertCircle,
      variant: "destructive" as const,
    };
  };

  const status = getAttendanceStatus();
  const StatusIcon = status.icon;

  if (totalDays === 0) {
    return (
      <Card className={cn("border-gray-200", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-500" />
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No attendance data available for this term
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-gray-200", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StatusIcon className={cn("h-4 w-4", status.color)} />
            Attendance
          </span>
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main percentage display */}
        <div className={cn("rounded-lg p-4", status.bgColor)}>
          <div className="flex items-baseline justify-between">
            <div>
              <p className={cn("text-3xl font-bold", status.color)}>
                {percentage.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {daysPresent} / {totalDays} days
              </p>
            </div>
            {isLowAttendance && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Attendance is below {lowAttendanceThreshold}% threshold
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Detailed breakdown */}
        {showDetails && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Present:</span>
              <span className="font-medium text-green-700">{daysPresent} days</span>
            </div>
            {daysAbsent > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Absent:</span>
                <span className="font-medium text-red-700">{daysAbsent} days</span>
              </div>
            )}
            {daysLate > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Late:</span>
                <span className="font-medium text-orange-700">{daysLate} days</span>
              </div>
            )}
            {daysHalfDay > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Half Day:</span>
                <span className="font-medium text-blue-700">{daysHalfDay} days</span>
              </div>
            )}
            {daysLeave > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Leave (Excused):</span>
                <span className="font-medium text-gray-700">{daysLeave} days</span>
              </div>
            )}
          </div>
        )}

        {/* Warning message for low attendance */}
        {isLowAttendance && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-800">
              <strong>Note:</strong> Attendance is below the required threshold
              of {lowAttendanceThreshold}%. Please ensure regular attendance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for displaying in tables or lists
 */
export function AttendanceDisplayCompact({
  percentage,
  daysPresent,
  totalDays,
  isLowAttendance = false,
  className,
}: Pick<
  AttendanceDisplayProps,
  "percentage" | "daysPresent" | "totalDays" | "isLowAttendance" | "className"
>) {
  if (totalDays === 0) {
    return (
      <span className={cn("text-sm text-gray-500", className)}>N/A</span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <span
              className={cn(
                "font-medium",
                isLowAttendance ? "text-red-700" : "text-green-700"
              )}
            >
              {percentage.toFixed(1)}%
            </span>
            {isLowAttendance && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {daysPresent} / {totalDays} days present
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
