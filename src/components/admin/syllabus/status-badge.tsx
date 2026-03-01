"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SyllabusStatus = 
  | "DRAFT" 
  | "PENDING_REVIEW" 
  | "APPROVED" 
  | "PUBLISHED" 
  | "ARCHIVED" 
  | "DEPRECATED";

interface StatusBadgeProps {
  status: SyllabusStatus;
  className?: string;
}

const statusConfig: Record<SyllabusStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100/80",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100/80",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100/80",
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-green-100 text-green-700 border-green-300 hover:bg-green-100/80",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-100/80",
  },
  DEPRECATED: {
    label: "Deprecated",
    className: "bg-red-100 text-red-700 border-red-300 hover:bg-red-100/80",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
