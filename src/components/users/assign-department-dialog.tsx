"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Building2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { getAvailableDepartmentsForTeacher, assignTeacherToDepartment } from "@/lib/actions/departmentsAction";

interface Department {
    id: string;
    name: string;
    description?: string | null;
}

interface AssignDepartmentDialogProps {
    teacherId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function AssignDepartmentDialog({
    teacherId,
    onSuccess,
    trigger,
}: AssignDepartmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

    const loadDepartments = useCallback(async () => {
        try {
            setLoadingDepartments(true);
            const result = await getAvailableDepartmentsForTeacher(teacherId);
            if (result.success && result.data) {
                setDepartments(result.data);
            } else {
                toast.error(result.error || "Failed to load departments");
            }
        } catch (error) {
            toast.error("Failed to load departments");
        } finally {
            setLoadingDepartments(false);
        }
    }, [teacherId]);

    useEffect(() => {
        if (open) {
            loadDepartments();
            setSelectedDepartmentId("");
        }
    }, [open, loadDepartments]);

    const handleAssign = async () => {
        if (!selectedDepartmentId) {
            toast.error("Please select a department");
            return;
        }

        try {
            setLoading(true);
            const result = await assignTeacherToDepartment(teacherId, selectedDepartmentId);

            if (result.success) {
                toast.success("Department assigned successfully");
                setOpen(false);
                setSelectedDepartmentId("");
                onSuccess?.();
            } else {
                toast.error(result.error || "Failed to assign department");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Assign Department
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Assign Department to Teacher</DialogTitle>
                    <DialogDescription>
                        Select a department to assign to this teacher.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select
                            value={selectedDepartmentId}
                            onValueChange={setSelectedDepartmentId}
                            disabled={loadingDepartments}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                            <SelectContent>
                                {loadingDepartments ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : departments.length === 0 ? (
                                    <div className="py-4 text-center text-sm text-muted-foreground">
                                        No departments available
                                    </div>
                                ) : (
                                    departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{dept.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={loading || !selectedDepartmentId}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Department
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
