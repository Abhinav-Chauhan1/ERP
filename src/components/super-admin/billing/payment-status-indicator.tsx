"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface PaymentStatusIndicatorProps {
  status: 'success' | 'failed' | 'pending';
  count: number;
  label: string;
  percentage: number;
}

export function PaymentStatusIndicator({
  status,
  count,
  label,
  percentage
}: PaymentStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      case 'pending':
        return 'bg-yellow-600';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className={`text-lg font-bold ${getStatusColor()}`}>
            {count}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage}% of total</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2"
            // Note: In a real implementation, you'd need to customize the Progress component
            // to accept different colors or create variants
          />
        </div>
      </CardContent>
    </Card>
  );
}