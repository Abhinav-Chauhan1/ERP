"use client";

import { useState } from "react";
import { Trash2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { unassignStudentFromRoute } from "@/lib/actions/routeActions";
import { useRouter } from "next/navigation";

interface StudentRouteListProps {
  students: Array<{
    id: string;
    pickupStop: string;
    dropStop: string;
    student: {
      id: string;
      admissionId: string;
      user: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
  routeFee: number;
}

export function StudentRouteList({ students, routeFee }: StudentRouteListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleUnassign = async (studentRouteId: string, studentName: string) => {
    try {
      setDeletingId(studentRouteId);
      const result = await unassignStudentFromRoute(studentRouteId);

      if (result.success) {
        toast.success(`${studentName} has been unassigned from this route`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to unassign student");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No students assigned to this route yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {students.map((studentRoute) => {
        const studentName = `${studentRoute.student.user.firstName} ${studentRoute.student.user.lastName}`;
        
        return (
          <div
            key={studentRoute.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{studentName}</p>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {studentRoute.student.admissionId}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Pickup: {studentRoute.pickupStop}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Drop: {studentRoute.dropStop}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">₹{routeFee.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === studentRoute.id}
                  >
                    {deletingId === studentRoute.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unassign Student</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to unassign {studentName} from this route?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleUnassign(studentRoute.id, studentName)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Unassign
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}
