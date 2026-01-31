"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Loader2 } from "lucide-react";
import { updateSyllabusStatus } from "@/lib/actions/syllabusActions";
import toast from "react-hot-toast";

type SyllabusStatus = 
  | "DRAFT" 
  | "PENDING_REVIEW" 
  | "APPROVED" 
  | "PUBLISHED" 
  | "ARCHIVED" 
  | "DEPRECATED";

interface StatusChangeDropdownProps {
  syllabusId: string;
  currentStatus: SyllabusStatus;
  userId: string;
  onStatusChanged?: () => void;
}

// Define available status transitions based on current status
const statusTransitions: Record<SyllabusStatus, SyllabusStatus[]> = {
  DRAFT: ["PENDING_REVIEW", "ARCHIVED"],
  PENDING_REVIEW: ["DRAFT", "APPROVED", "ARCHIVED"],
  APPROVED: ["PENDING_REVIEW", "PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED", "DEPRECATED"],
  ARCHIVED: ["DRAFT", "PUBLISHED"],
  DEPRECATED: ["ARCHIVED"],
};

const statusLabels: Record<SyllabusStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
  DEPRECATED: "Deprecated",
};

const statusDescriptions: Record<SyllabusStatus, string> = {
  DRAFT: "The syllabus is in draft mode and only visible to admins.",
  PENDING_REVIEW: "The syllabus is awaiting review and approval.",
  APPROVED: "The syllabus has been approved and is ready to be published.",
  PUBLISHED: "The syllabus is published and visible to teachers and students.",
  ARCHIVED: "The syllabus is archived and hidden from active listings.",
  DEPRECATED: "The syllabus is deprecated and should no longer be used.",
};

export function StatusChangeDropdown({
  syllabusId,
  currentStatus,
  userId,
  onStatusChanged,
}: StatusChangeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SyllabusStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const availableTransitions = statusTransitions[currentStatus] || [];

  const handleStatusSelect = (status: SyllabusStatus) => {
    setSelectedStatus(status);
    setConfirmDialogOpen(true);
    setIsOpen(false);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedStatus) return;

    setIsUpdating(true);
    try {
      const result = await updateSyllabusStatus(syllabusId, selectedStatus);

      if (result.success) {
        toast.success(`Status updated to ${statusLabels[selectedStatus]}`);
        setConfirmDialogOpen(false);
        setSelectedStatus(null);
        
        // Call the callback to refresh the syllabus list
        if (onStatusChanged) {
          onStatusChanged();
        }
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  if (availableTransitions.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Change Status
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Change Status To</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableTransitions.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusSelect(status)}
            >
              {statusLabels[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStatus && (
                <>
                  Are you sure you want to change the status to{" "}
                  <strong>{statusLabels[selectedStatus]}</strong>?
                  <br />
                  <br />
                  {statusDescriptions[selectedStatus]}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusChange}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
