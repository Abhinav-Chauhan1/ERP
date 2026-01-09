"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, GraduationCap, Users, X, Crown, ChevronDown } from "lucide-react";
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import toast from "react-hot-toast";
import { getAvailableClassesForTeacher } from "@/lib/actions/teacherActions";
import { assignTeacherToClass } from "@/lib/actions/classesActions";

interface Section {
    id: string;
    name: string;
}

interface ClassItem {
    id: string;
    name: string;
    sections: Section[];
    academicYear?: string;
    isCurrent?: boolean;
}

interface SelectedAssignment {
    classId: string;
    sectionId: string | null; // null means all sections
    isClassHead: boolean;
}

interface AssignClassDialogProps {
    teacherId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function AssignClassDialog({
    teacherId,
    onSuccess,
    trigger,
}: AssignClassDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [selectedAssignments, setSelectedAssignments] = useState<SelectedAssignment[]>([]);
    const [expandedClasses, setExpandedClasses] = useState<string[]>([]);

    const loadClasses = useCallback(async () => {
        try {
            setLoadingClasses(true);
            const result = await getAvailableClassesForTeacher(teacherId);
            if (result.success && result.data) {
                setClasses(result.data);
            } else {
                toast.error(result.error || "Failed to load classes");
            }
        } catch (error) {
            toast.error("Failed to load classes");
        } finally {
            setLoadingClasses(false);
        }
    }, [teacherId]);

    useEffect(() => {
        if (open) {
            loadClasses();
            setSelectedAssignments([]);
            setExpandedClasses([]);
        }
    }, [open, loadClasses]);

    const toggleClassExpanded = (classId: string) => {
        setExpandedClasses(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    const isAssigned = (classId: string, sectionId: string | null) => {
        return selectedAssignments.some(
            a => a.classId === classId && a.sectionId === sectionId
        );
    };

    const toggleAssignment = (classId: string, sectionId: string | null) => {
        if (isAssigned(classId, sectionId)) {
            setSelectedAssignments(prev =>
                prev.filter(a => !(a.classId === classId && a.sectionId === sectionId))
            );
        } else {
            setSelectedAssignments(prev => [
                ...prev,
                { classId, sectionId, isClassHead: false }
            ]);
        }
    };

    const setClassHead = (classId: string, sectionId: string | null) => {
        setSelectedAssignments(prev => prev.map(a => ({
            ...a,
            isClassHead: a.classId === classId && a.sectionId === sectionId
        })));
    };

    const removeAssignment = (classId: string, sectionId: string | null) => {
        setSelectedAssignments(prev =>
            prev.filter(a => !(a.classId === classId && a.sectionId === sectionId))
        );
    };

    const handleAssign = async () => {
        if (selectedAssignments.length === 0) {
            toast.error("Please select at least one class or section");
            return;
        }

        try {
            setLoading(true);

            let successCount = 0;
            let errorMessages: string[] = [];

            for (const assignment of selectedAssignments) {
                const result = await assignTeacherToClass({
                    classId: assignment.classId,
                    sectionId: assignment.sectionId,
                    teacherId: teacherId,
                    isClassHead: assignment.isClassHead,
                });

                if (result.success) {
                    successCount++;
                } else {
                    const classItem = classes.find(c => c.id === assignment.classId);
                    const section = classItem?.sections.find(s => s.id === assignment.sectionId);
                    const label = section ? `${classItem?.name} - ${section.name}` : classItem?.name || 'Unknown';
                    errorMessages.push(`${label}: ${result.error}`);
                }
            }

            if (successCount === selectedAssignments.length) {
                toast.success(`Successfully assigned ${successCount} item${successCount > 1 ? 's' : ''}`);
                setOpen(false);
                setSelectedAssignments([]);
                onSuccess?.();
            } else if (successCount > 0) {
                toast.success(`Assigned ${successCount} item${successCount > 1 ? 's' : ''}`);
                if (errorMessages.length > 0) {
                    toast.error(`Failed: ${errorMessages[0]}`);
                }
                setOpen(false);
                setSelectedAssignments([]);
                onSuccess?.();
            } else {
                toast.error(errorMessages[0] || "Failed to assign");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const getClassById = (id: string) => classes.find(c => c.id === id);
    const getSectionById = (classId: string, sectionId: string) => {
        const classItem = getClassById(classId);
        return classItem?.sections.find(s => s.id === sectionId);
    };

    const getAssignmentLabel = (assignment: SelectedAssignment) => {
        const classItem = getClassById(assignment.classId);
        if (!classItem) return 'Unknown';
        if (!assignment.sectionId) return `${classItem.name} (All Sections)`;
        const section = getSectionById(assignment.classId, assignment.sectionId);
        return `${classItem.name} - Section ${section?.name || 'Unknown'}`;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Assign Class
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Assign Classes/Sections to Teacher</DialogTitle>
                    <DialogDescription>
                        Select classes or individual sections. You can designate one as class head.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Class list with expandable sections */}
                    <div className="space-y-2">
                        <Label>Available Classes & Sections</Label>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            {loadingClasses ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : classes.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No classes available
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {classes.map((classItem) => (
                                        <Collapsible
                                            key={classItem.id}
                                            open={expandedClasses.includes(classItem.id)}
                                            onOpenChange={() => toggleClassExpanded(classItem.id)}
                                        >
                                            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                                                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedClasses.includes(classItem.id) ? 'rotate-180' : ''
                                                            }`} />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium flex-1">{classItem.name}</span>
                                                {classItem.isCurrent && (
                                                    <Badge variant="secondary" className="text-xs">Current</Badge>
                                                )}
                                                <Button
                                                    variant={isAssigned(classItem.id, null) ? "default" : "outline"}
                                                    size="sm"
                                                    className="text-xs h-7"
                                                    onClick={() => toggleAssignment(classItem.id, null)}
                                                >
                                                    {isAssigned(classItem.id, null) ? "Added" : "Add All"}
                                                </Button>
                                            </div>
                                            <CollapsibleContent>
                                                <div className="ml-8 pl-4 border-l space-y-1 py-1">
                                                    {classItem.sections.length === 0 ? (
                                                        <div className="text-xs text-muted-foreground py-2">
                                                            No sections defined
                                                        </div>
                                                    ) : (
                                                        classItem.sections.map((section) => (
                                                            <div
                                                                key={section.id}
                                                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                                                            >
                                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span className="text-sm flex-1">Section {section.name}</span>
                                                                <Button
                                                                    variant={isAssigned(classItem.id, section.id) ? "default" : "outline"}
                                                                    size="sm"
                                                                    className="text-xs h-6 px-2"
                                                                    onClick={() => toggleAssignment(classItem.id, section.id)}
                                                                >
                                                                    {isAssigned(classItem.id, section.id) ? "Added" : "Add"}
                                                                </Button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Selected assignments */}
                    {selectedAssignments.length > 0 && (
                        <div className="space-y-2">
                            <Label>Selected Assignments ({selectedAssignments.length})</Label>
                            <ScrollArea className="max-h-[150px]">
                                <div className="space-y-2">
                                    {selectedAssignments.map((assignment, idx) => (
                                        <div
                                            key={`${assignment.classId}-${assignment.sectionId || 'all'}`}
                                            className={`flex items-center justify-between p-2 rounded-md border ${assignment.isClassHead ? 'border-primary bg-primary/5' : 'bg-muted/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span className="text-sm truncate">
                                                    {getAssignmentLabel(assignment)}
                                                </span>
                                                {assignment.isClassHead && (
                                                    <Badge className="bg-primary text-primary-foreground shrink-0 text-xs">
                                                        <Crown className="h-3 w-3 mr-1" />
                                                        Head
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {!assignment.isClassHead && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0"
                                                        onClick={() => setClassHead(assignment.classId, assignment.sectionId)}
                                                        title="Set as Class Head"
                                                    >
                                                        <Crown className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeAssignment(assignment.classId, assignment.sectionId)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <p className="text-xs text-muted-foreground">
                                Click the crown icon to designate as class head (only one allowed).
                            </p>
                        </div>
                    )}

                    {selectedAssignments.length === 0 && !loadingClasses && (
                        <div className="text-center p-4 border rounded-md border-dashed text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Click on classes or sections above to add them</p>
                        </div>
                    )}
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
                        disabled={loading || selectedAssignments.length === 0}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign {selectedAssignments.length > 0 ? `(${selectedAssignments.length})` : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
