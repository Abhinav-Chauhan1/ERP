"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, BookOpen } from "lucide-react";
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
import { getAvailableSubjectsForTeacher } from "@/lib/actions/teacherActions";
import { assignTeacherToSubject } from "@/lib/actions/subjectTeacherActions";

interface Subject {
    id: string;
    name: string;
    code: string;
    department?: string;
}

interface AssignSubjectDialogProps {
    teacherId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function AssignSubjectDialog({
    teacherId,
    onSuccess,
    trigger,
}: AssignSubjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");

    const loadSubjects = useCallback(async () => {
        try {
            setLoadingSubjects(true);
            const result = await getAvailableSubjectsForTeacher(teacherId);
            if (result.success && result.data) {
                setSubjects(result.data);
            } else {
                toast.error(result.error || "Failed to load subjects");
            }
        } catch (error) {
            toast.error("Failed to load subjects");
        } finally {
            setLoadingSubjects(false);
        }
    }, [teacherId]);

    // Load available subjects when dialog opens
    useEffect(() => {
        if (open) {
            loadSubjects();
            setSelectedSubjectId("");
        }
    }, [open, loadSubjects]);

    const handleAssign = async () => {
        if (!selectedSubjectId) {
            toast.error("Please select a subject");
            return;
        }

        try {
            setLoading(true);
            const result = await assignTeacherToSubject(selectedSubjectId, teacherId);

            if (result.success) {
                toast.success("Subject assigned successfully");
                setOpen(false);
                setSelectedSubjectId("");
                onSuccess?.();
            } else {
                toast.error(result.error || "Failed to assign subject");
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
                        Assign Subject
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Assign Subject to Teacher</DialogTitle>
                    <DialogDescription>
                        Select a subject to assign to this teacher.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Select
                            value={selectedSubjectId}
                            onValueChange={setSelectedSubjectId}
                            disabled={loadingSubjects}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {loadingSubjects ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : subjects.length === 0 ? (
                                    <div className="py-4 text-center text-sm text-muted-foreground">
                                        No subjects available
                                    </div>
                                ) : (
                                    subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                <span>{subject.name}</span>
                                                <span className="text-muted-foreground">
                                                    ({subject.code})
                                                </span>
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
                        disabled={loading || !selectedSubjectId}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Subject
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
