"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    BookOpen,
    Check,
    ExternalLink,
    Filter,
    Loader2,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

import {
    getClassSubjects,
    getClassesWithSections,
    getAllSubjects,
    assignSubjectToClass,
    assignSubjectToSection,
    removeSubjectAssignment
} from "@/lib/actions/curriculumActions";

interface ClassType {
    id: string;
    name: string;
    sections: { id: string; name: string }[];
}

interface SubjectType {
    id: string;
    name: string;
    code: string;
    department?: { name: string } | null;
}

interface AssignmentType {
    id: string;
    subject: SubjectType;
    classId: string;
    sectionId?: string | null;
    section?: { id: string; name: string } | null;
}

export default function CurriculumPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialClassId = searchParams.get("classId");
    const initialSubjectId = searchParams.get("subject");

    const [classes, setClasses] = useState<ClassType[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || "");
    const [assignments, setAssignments] = useState<AssignmentType[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<SubjectType[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);

    // Assignment form state
    const [selectedSubjectToAssign, setSelectedSubjectToAssign] = useState<string>(initialSubjectId || "");
    const [assignScope, setAssignScope] = useState<"class" | "section">("class");
    const [selectedSectionToAssign, setSelectedSectionToAssign] = useState<string>("all");

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            if (initialClassId !== selectedClassId) {
                // Update URL without full reload
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set("classId", selectedClassId);
                window.history.pushState({}, "", newUrl);
            }
            fetchAssignments(selectedClassId);
        } else {
            setAssignments([]);
        }
    }, [selectedClassId]);

    useEffect(() => {
        if (initialSubjectId && classes.length > 0 && !assignDialogOpen) {
            // If arrived with a subject ID, open the dialog
            setSelectedSubjectToAssign(initialSubjectId);
            // If we don't have a class selected yet, we might want to prompt or wait
            // But typically user selects class first
            if (selectedClassId) {
                setAssignDialogOpen(true);
            }
        }
    }, [initialSubjectId, classes, selectedClassId]);

    async function fetchInitialData() {
        try {
            setLoading(true);
            const [classesResult, subjectsResult] = await Promise.all([
                getClassesWithSections(),
                getAllSubjects()
            ]);

            if (classesResult.success && classesResult.data) {
                setClasses(classesResult.data);
                // If no class selected but we have classes, select the first one
                if (!selectedClassId && classesResult.data.length > 0) {
                    setSelectedClassId(classesResult.data[0].id);
                }
            }

            if (subjectsResult.success && subjectsResult.data) {
                setAvailableSubjects(subjectsResult.data);
            }
        } catch (error) {
            console.error("Failed to load initial data", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }

    async function fetchAssignments(classId: string) {
        try {
            setLoadingAssignments(true);
            const result = await getClassSubjects(classId);
            if (result.success && result.data) {
                setAssignments(result.data);
            } else {
                toast.error("Failed to load assignments");
            }
        } catch (error) {
            console.error("Error fetching assignments", error);
        } finally {
            setLoadingAssignments(false);
        }
    }

    const handleAssignSubject = async () => {
        if (!selectedClassId || !selectedSubjectToAssign) {
            toast.error("Please select a class and subject");
            return;
        }

        if (assignScope === "section" && (!selectedSectionToAssign || selectedSectionToAssign === "all")) {
            toast.error("Please select specific sections");
            return;
        }

        try {
            setAssignLoading(true);
            let result;

            if (assignScope === "class") {
                result = await assignSubjectToClass(selectedClassId, selectedSubjectToAssign);
            } else {
                result = await assignSubjectToSection(selectedClassId, selectedSectionToAssign, selectedSubjectToAssign);
            }

            if (result.success) {
                toast.success("Subject assigned successfully");
                setAssignDialogOpen(false);
                fetchAssignments(selectedClassId);
                // Clear selection but keep dialog state clean
                setSelectedSubjectToAssign("");
            } else {
                toast.error(result.error || "Failed to assign subject");
            }
        } catch (error) {
            console.error("Error assigning subject", error);
            toast.error("An unexpected error occurred");
        } finally {
            setAssignLoading(false);
        }
    };

    const handleRemoveAssignment = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to remove ${name} from this class/section?`)) {
            try {
                const result = await removeSubjectAssignment(id);
                if (result.success) {
                    toast.success("Assignment removed");
                    fetchAssignments(selectedClassId);
                } else {
                    toast.error(result.error || "Failed to remove assignment");
                }
            } catch (error) {
                console.error("Error removing assignment", error);
                toast.error("An unexpected error occurred");
            }
        }
    };

    const selectedClass = classes.find(c => c.id === selectedClassId);

    // Group assignments: Class Level vs Section Level
    const classAssignments = assignments.filter(a => !a.sectionId);
    const sectionAssignments = assignments.filter(a => a.sectionId);

    // Group section assignments by section
    const assignmentsBySection: Record<string, AssignmentType[]> = {};
    if (selectedClass) {
        selectedClass.sections.forEach(section => {
            assignmentsBySection[section.id] = sectionAssignments.filter(a => a.sectionId === section.id);
        });
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Curriculum Management</h1>
                    <p className="text-muted-foreground">Manage subjects assigned to classes and sections</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push("/admin/teaching/subjects")}>
                        Manage All Subjects
                    </Button>
                    <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Assign Subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Assign Subject</DialogTitle>
                                <DialogDescription>
                                    Add a subject to the class curriculum. You can assign it to the entire class or specific sections.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Subject</Label>
                                    <Select
                                        value={selectedSubjectToAssign}
                                        onValueChange={setSelectedSubjectToAssign}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="p-2 sticky top-0 bg-white z-10 border-b mb-1">
                                                <Input
                                                    placeholder="Search subjects..."
                                                    className="h-8"
                                                    onChange={(e) => {
                                                        // Could implement client-side filtering here if needed
                                                    }}
                                                />
                                            </div>
                                            {availableSubjects.map(subject => (
                                                <SelectItem key={subject.id} value={subject.id}>
                                                    {subject.name} ({subject.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedClass && selectedClass.sections.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label>Assignment Scope</Label>
                                        <div className="flex items-center space-x-2 border p-1 rounded-md bg-muted/40 w-fit">
                                            <Button
                                                type="button"
                                                variant={assignScope === "class" ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setAssignScope("class")}
                                                className="h-8"
                                            >
                                                Entire Class
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={assignScope === "section" ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => {
                                                    setAssignScope("section");
                                                    if (selectedClass.sections.length > 0) {
                                                        setSelectedSectionToAssign(selectedClass.sections[0].id);
                                                    }
                                                }}
                                                className="h-8"
                                            >
                                                Specific Section
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {assignScope === "section" && selectedClass && (
                                    <div className="grid gap-2">
                                        <Label>Select Section</Label>
                                        <Select
                                            value={selectedSectionToAssign}
                                            onValueChange={setSelectedSectionToAssign}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select section" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedClass.sections.map(section => (
                                                    <SelectItem key={section.id} value={section.id}>
                                                        Section {section.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAssignSubject} disabled={assignLoading}>
                                    {assignLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Assign
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Class Selector Sidebar */}
                <Card className="w-full lg:w-64 h-fit flex-shrink-0">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg">Classes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <div className="flex flex-col space-y-1">
                            {classes.map(cls => (
                                <Button
                                    key={cls.id}
                                    variant={selectedClassId === cls.id ? "secondary" : "ghost"}
                                    className="justify-start font-normal"
                                    onClick={() => setSelectedClassId(cls.id)}
                                >
                                    <div className="flex justify-between w-full items-center">
                                        <span>{cls.name}</span>
                                        <Badge variant="outline" className="text-[10px] ml-2">
                                            {cls.sections.length} Sec
                                        </Badge>
                                    </div>
                                </Button>
                            ))}
                            {classes.length === 0 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No active classes found.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    {selectedClass ? (
                        <>
                            {/* Class Level Assignments */}
                            <Card>
                                <CardHeader className="pb-3 bg-muted/30">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-lg">Core Curriculum</CardTitle>
                                            <CardDescription>Subjects taught to the entire class ({selectedClass.name})</CardDescription>
                                        </div>
                                        <Badge variant="secondary" className="px-3">
                                            {classAssignments.length} Subjects
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {loadingAssignments ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : classAssignments.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {classAssignments.map(assignment => (
                                                <div key={assignment.id} className="flex flex-col border rounded-lg p-4 hover:shadow-sm transition-shadow bg-card">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-primary/10 rounded-md text-primary">
                                                                <BookOpen className="h-4 w-4" />
                                                            </div>
                                                            <h3 className="font-semibold text-sm">{assignment.subject.name}</h3>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => router.push(`/admin/teaching/subjects/${assignment.subject.id}`)}>
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => handleRemoveAssignment(assignment.id, assignment.subject.name)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Remove from Class
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-auto pt-2">
                                                        <Badge variant="outline" className="text-xs font-mono">
                                                            {assignment.subject.code}
                                                        </Badge>
                                                        {assignment.subject.department && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {assignment.subject.department.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                            <h3 className="text-sm font-medium text-muted-foreground">No subjects assigned globally</h3>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                                                Assign subjects here that are taught to all sections of {selectedClass.name}.
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-4" onClick={() => {
                                                setAssignScope("class");
                                                setAssignDialogOpen(true);
                                            }}>
                                                Assign Subject
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Section Specific Assignments */}
                            {selectedClass.sections.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold tracking-tight">Section-Specific Subjects</h2>
                                        <p className="text-sm text-muted-foreground hidden md:block">
                                            Subjects assigned only to specific sections
                                        </p>
                                    </div>

                                    <Tabs defaultValue={selectedClass.sections[0].id} className="w-full">
                                        <TabsList className="w-full justify-start h-auto flex-wrap p-1 bg-muted/50">
                                            {selectedClass.sections.map(section => (
                                                <TabsTrigger key={section.id} value={section.id} className="min-w-[100px]">
                                                    Section {section.name}
                                                    <Badge variant="secondary" className="ml-2 bg-muted text-[10px] px-1 h-4">
                                                        {assignmentsBySection[section.id]?.length || 0}
                                                    </Badge>
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>

                                        {selectedClass.sections.map(section => {
                                            const sectionSubjects = assignmentsBySection[section.id] || [];
                                            // Include class assignments for view only
                                            const allSubjects = [...classAssignments, ...sectionSubjects];

                                            return (
                                                <TabsContent key={section.id} value={section.id} className="mt-4 space-y-4">
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <div className="flex justify-between items-center">
                                                                <CardTitle className="text-base">Section {section.name} Curriculum</CardTitle>
                                                                <Button size="sm" variant="outline" onClick={() => {
                                                                    setAssignScope("section");
                                                                    setSelectedSectionToAssign(section.id);
                                                                    setAssignDialogOpen(true);
                                                                }}>
                                                                    <Plus className="h-3 w-3 mr-2" />
                                                                    Add Subject
                                                                </Button>
                                                            </div>
                                                            <CardDescription>
                                                                Includes both class-wide subjects and section-specific electives
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {sectionSubjects.length > 0 ? (
                                                                <div className="grid gap-4">
                                                                    {sectionSubjects.map(assignment => (
                                                                        <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-md bg-accent/20">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                                                                                    <Users className="h-4 w-4" />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-medium">{assignment.subject.name}</p>
                                                                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                                                        <span className="font-mono">{assignment.subject.code}</span>
                                                                                        <span>•</span>
                                                                                        <span className="text-blue-600 font-medium">Unique to Section {section.name}</span>
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveAssignment(assignment.id, assignment.subject.name)}>
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}

                                                                    {classAssignments.length > 0 && <Separator className="my-2" />}

                                                                    {classAssignments.map(assignment => (
                                                                        <div key={`inherited-${assignment.id}`} className="flex items-center justify-between p-3 border border-dashed rounded-md opacity-70">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 bg-muted rounded-md text-muted-foreground">
                                                                                    <BookOpen className="h-4 w-4" />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-medium">{assignment.subject.name}</p>
                                                                                    <p className="text-xs text-muted-foreground">Inherited from Class {selectedClass.name}</p>
                                                                                </div>
                                                                            </div>
                                                                            <Badge variant="outline" className="text-xs">Class Wide</Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-6 text-muted-foreground">
                                                                    <p className="text-sm">No special subjects assigned to this section.</p>
                                                                    <p className="text-xs mt-1">It follows the standard class curriculum.</p>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                            )
                                        })}
                                    </Tabs>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-lg bg-muted/10">
                            <BookOpen className="h-16 w-16 text-muted-foreground/20 mb-4" />
                            <h3 className="text-lg font-medium">Select a Class</h3>
                            <p className="text-muted-foreground text-center max-w-sm">
                                Select a class from the sidebar to manage its curriculum and subject assignments.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
