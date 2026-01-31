"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AssignDepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  departments: Array<{ id: string; name: string }>;
  onAssign: (teacherId: string, departmentId: string) => Promise<void>;
}

export function AssignDepartmentDialog({
  isOpen,
  onClose,
  teacherId,
  departments,
  onAssign
}: AssignDepartmentDialogProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedDepartment) return;
    
    setIsLoading(true);
    try {
      await onAssign(teacherId, selectedDepartment);
      onClose();
      setSelectedDepartment("");
    } catch (error) {
      console.error("Failed to assign department:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Department</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedDepartment || isLoading}
            >
              {isLoading ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}