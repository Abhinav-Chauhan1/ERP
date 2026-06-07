"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Loader2,
    Search,
    Trash2,
    User,
    UserCheck,
    UserX,
    X,
    CheckCircle2,
} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

import {
    assignSubjectToClass,
    assignSubjectToSection,
    assignTeacherToSubjectClass,
    assignTeacherToSubjectInSection,
    getAllSubjects,
    getClassesWithSections,
    getClassSubjects,
    getTeachersForSchool,
    removeSubjectAssignment,
    reorderClassSubjects,
} from "@/lib/actions/curriculumActions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassType {
    id: string;
    name: string;
    sections: { id: string; name: string }[];
}

interface SubjectType {
    id: string;
    name: string;
    code: string;
}

interface TeacherType {
    id: string;
    name: string;
    avatar: string | null;
    employeeId: string;
    subjectNames: string[];
}

interface AssignmentType {
    id: string;
    order: number;
    subject: SubjectType;
    classId: string;
    sectionId?: string | null;
    section?: { id: string; name: string } | null;
    teacher?: {
        id: string;
        user: { firstName: string; lastName: string; avatar: string | null };
    } | null;
}

// Drop targets can be class-level or section-level
interface DropTarget {
    classId: string;
    sectionId?: string | null; // null / undefined = whole class
    label: string;
}

const DRAG_SUBJECT   = "SUBJECT_SOURCE";     // palette → drop zone
const DRAG_ASSIGNED  = "SUBJECT_ASSIGNED";   // reorder within a zone

// ─── Palette: draggable source chip ──────────────────────────────────────────

function PaletteChip({ subject, alreadyIn }: { subject: SubjectType; alreadyIn: boolean }) {
    const [{ isDragging }, drag] = useDrag({
        type: DRAG_SUBJECT,
        item: { subject },
        collect: (m) => ({ isDragging: m.isDragging() }),
        canDrag: !alreadyIn,
    });

    return (
        <div
            ref={drag as any}
            title={alreadyIn ? "Already assigned to this class/section" : `Drag to assign ${subject.name}`}
            className={[
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm select-none transition-all",
                alreadyIn
                    ? "opacity-40 cursor-not-allowed bg-muted/30"
                    : "cursor-grab active:cursor-grabbing bg-card hover:shadow-sm hover:border-primary/40",
                isDragging ? "opacity-30 scale-95" : "",
            ].join(" ")}
        >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{subject.name}</p>
                <p className="text-[11px] font-mono text-muted-foreground">{subject.code}</p>
            </div>
            {alreadyIn && <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </div>
    );
}

// ─── Assigned chip (inside a drop zone, draggable for reordering) ─────────────

interface AssignedChipProps {
    assignment: AssignmentType;
    index: number;
    scopeKey: string;
    contextLabel: string; // e.g. "Class 1 — All Sections" or "Class 1 — Section A"
    sectionId?: string;   // set when this chip is shown inside a section zone (even if inherited)
    onReorder: (from: number, to: number) => void;
    onRemove: (id: string, name: string) => void;
    onTeacher: (a: AssignmentType, contextLabel: string, sectionId?: string) => void;
    isInherited?: boolean;
}

function AssignedChip({
    assignment,
    index,
    scopeKey,
    contextLabel,
    sectionId,
    onReorder,
    onRemove,
    onTeacher,
    isInherited = false,
}: AssignedChipProps) {
    const ref = useRef<HTMLDivElement>(null);

    const [{ handlerId }, drop] = useDrop<
        { index: number; scopeKey: string },
        void,
        { handlerId: string | symbol | null }
    >({
        accept: DRAG_ASSIGNED,
        collect: (m) => ({ handlerId: m.getHandlerId() }),
        hover(item, monitor) {
            if (!ref.current || item.scopeKey !== scopeKey) return;
            const drag = item.index;
            const hover = index;
            if (drag === hover) return;
            const rect = ref.current.getBoundingClientRect();
            const mid = (rect.bottom - rect.top) / 2;
            const off = monitor.getClientOffset();
            if (!off) return;
            const y = off.y - rect.top;
            if (drag < hover && y < mid) return;
            if (drag > hover && y > mid) return;
            onReorder(drag, hover);
            item.index = hover;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: DRAG_ASSIGNED,
        item: () => ({ id: assignment.id, index, scopeKey }),
        collect: (m) => ({ isDragging: m.isDragging() }),
        canDrag: !isInherited,
    });

    drag(drop(ref));

    const teacherName = assignment.teacher
        ? `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`
        : null;

    return (
        <div
            ref={ref}
            data-handler-id={handlerId}
            className={[
                "group flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all",
                isInherited
                    ? "border-dashed bg-muted/10"
                    : "bg-card hover:shadow-sm",
                isDragging ? "opacity-30 scale-95" : "",
            ].join(" ")}
        >
            {/* Drag handle */}
            {!isInherited ? (
                <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab active:cursor-grabbing shrink-0" />
            ) : (
                <div className="w-4 shrink-0" />
            )}

            {/* Subject info + teacher */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm truncate leading-tight ${isInherited ? "text-muted-foreground" : ""}`}>
                        {assignment.subject.name}
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground">
                        {assignment.subject.code}
                    </p>
                </div>

                {/* Teacher assignment button — always visible, even on inherited chips */}
                <button
                    type="button"
                    onClick={() => onTeacher(assignment, contextLabel, isInherited ? sectionId : undefined)}
                    className={[
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs shrink-0 transition-colors border",
                        teacherName
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                            : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
                    ].join(" ")}
                    title={teacherName ? `Change teacher (${teacherName})` : "Assign a teacher"}
                >
                    {teacherName ? (
                        <>
                            <Avatar className="h-4 w-4 shrink-0">
                                <AvatarImage src={assignment.teacher?.user.avatar ?? undefined} />
                                <AvatarFallback className="text-[7px]">{teacherName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="max-w-[80px] truncate">{teacherName.split(" ")[0]}</span>
                        </>
                    ) : (
                        <>
                            <User className="h-3 w-3 shrink-0" />
                            <span>Assign</span>
                        </>
                    )}
                </button>
            </div>

            {/* Remove — only for non-inherited */}
            {!isInherited ? (
                <button
                    type="button"
                    onClick={() => onRemove(assignment.id, assignment.subject.name)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 p-0.5 rounded"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            ) : (
                <div className="w-5 shrink-0" />
            )}
        </div>
    );
}

// ─── Drop Zone (class or section bucket) ─────────────────────────────────────

interface DropZoneProps {
    target: DropTarget;
    items: AssignmentType[];
    inheritedItems?: AssignmentType[];   // class-wide items shown in a section zone
    allAssignments: Record<string, AssignmentType[]>; // to check duplicates
    onDrop: (subject: SubjectType, target: DropTarget) => void;
    onReorder: (items: AssignmentType[]) => void;
    onRemove: (id: string, name: string) => void;
    onTeacher: (a: AssignmentType, contextLabel: string, sectionId?: string) => void;
    defaultOpen?: boolean;
}

function DropZone({
    target,
    items,
    inheritedItems,
    onDrop,
    onReorder,
    onRemove,
    onTeacher,
    defaultOpen = true,
}: DropZoneProps) {
    const [open, setOpen] = useState(defaultOpen);
    const [localItems, setLocalItems] = useState(items);

    useEffect(() => setLocalItems(items), [items]);

    const handleReorder = useCallback((from: number, to: number) => {
        setLocalItems((prev) => {
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
    }, []);

    const handleDropEnd = useCallback(() => {
        onReorder(localItems);
    }, [localItems, onReorder]);

    // Accept palette drags
    const [{ isOver, canDrop }, dropRef] = useDrop<
        { subject: SubjectType },
        void,
        { isOver: boolean; canDrop: boolean }
    >({
        accept: [DRAG_SUBJECT, DRAG_ASSIGNED],
        drop: (item: any, monitor) => {
            if (monitor.getItemType() === DRAG_SUBJECT) {
                onDrop(item.subject, target);
            } else {
                handleDropEnd();
            }
        },
        canDrop: (item: any, monitor) => {
            if (monitor.getItemType() !== DRAG_SUBJECT) return true;
            // prevent duplicate
            const alreadyAssigned = localItems.some(
                (a) => a.subject.id === item.subject.id
            );
            const alreadyInherited = (inheritedItems ?? []).some(
                (a) => a.subject.id === item.subject.id
            );
            return !alreadyAssigned && !alreadyInherited;
        },
        collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    });

    const total = localItems.length + (inheritedItems?.length ?? 0);

    // Filter inherited: hide if there's already a section-specific row for the same subject
    // (it shows in localItems, so the inherited one would be a duplicate)
    const localSubjectIds = new Set(localItems.map((a) => a.subject.id));
    const visibleInherited = (inheritedItems ?? []).filter(
        (a) => !localSubjectIds.has(a.subject.id)
    );
    const displayTotal = localItems.length + visibleInherited.length;

    return (
        <div className="border rounded-xl overflow-hidden">
            {/* Zone header */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    {open ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-sm">{target.label}</span>
                    {target.sectionId && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Section</Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{displayTotal} subject{displayTotal !== 1 ? "s" : ""}</span>
                </div>
            </button>

            {open && (
                <div
                    ref={dropRef as any}
                    className={[
                        "p-3 min-h-[80px] transition-colors",
                        isOver && canDrop
                            ? "bg-primary/5 ring-2 ring-inset ring-primary/30"
                            : isOver && !canDrop
                            ? "bg-destructive/5 ring-2 ring-inset ring-destructive/20"
                            : "bg-background",
                    ].join(" ")}
                >
                    {displayTotal === 0 ? (
                        <div className="flex flex-col items-center justify-center h-16 rounded-lg border-2 border-dashed text-muted-foreground/60 text-xs gap-1">
                            <BookOpen className="h-4 w-4" />
                            Drag subjects here
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {localItems.map((assignment, index) => (
                                <AssignedChip
                                    key={assignment.id}
                                    assignment={assignment}
                                    index={index}
                                    scopeKey={target.sectionId ?? target.classId}
                                    contextLabel={target.label}
                                    onReorder={handleReorder}
                                    onRemove={onRemove}
                                    onTeacher={onTeacher}
                                />
                            ))}
                            {visibleInherited.length > 0 && (
                                <>
                                    {localItems.length > 0 && (
                                        <div className="flex items-center gap-2 my-1">
                                            <div className="flex-1 h-px bg-border" />
                                            <span className="text-[10px] text-muted-foreground">class-wide</span>
                                            <div className="flex-1 h-px bg-border" />
                                        </div>
                                    )}
                                    {visibleInherited.map((assignment, index) => (
                                        <AssignedChip
                                            key={`inh-${assignment.id}`}
                                            assignment={assignment}
                                            index={index}
                                            scopeKey="inherited"
                                            contextLabel={target.label}
                                            sectionId={target.sectionId ?? undefined}
                                            onReorder={() => {}}
                                            onRemove={onRemove}
                                            onTeacher={onTeacher}
                                            isInherited
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {isOver && canDrop && (
                        <p className="text-center text-xs text-primary mt-2 font-medium">
                            Drop to assign
                        </p>
                    )}
                    {isOver && !canDrop && (
                        <p className="text-center text-xs text-destructive mt-2 font-medium">
                            Already assigned
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Teacher Assign Dialog ────────────────────────────────────────────────────

function TeacherDialog({
    assignment,
    contextLabel,
    sectionId,
    teachers,
    open,
    onClose,
    onAssigned,
}: {
    assignment: AssignmentType | null;
    contextLabel: string;
    sectionId?: string;           // present when editing an inherited (class-wide) subject for a specific section
    teachers: TeacherType[];
    open: boolean;
    onClose: () => void;
    onAssigned: () => void;
}) {
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);

    const filtered = teachers.filter(
        (t) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.employeeId.toLowerCase().includes(search.toLowerCase())
    );

    async function assign(teacherId: string) {
        if (!assignment) return;
        setSaving(true);
        let res;
        if (sectionId) {
            // Inherited class-wide subject — create/update a section-specific row
            res = await assignTeacherToSubjectInSection(
                assignment.subject.id,
                assignment.classId,
                sectionId,
                teacherId
            );
        } else {
            res = await assignTeacherToSubjectClass(assignment.id, teacherId);
        }
        setSaving(false);
        if (res.success) {
            toast.success("Teacher assigned");
            onAssigned();
            onClose();
        } else {
            toast.error(res.error ?? "Failed");
        }
    }

    async function remove() {
        if (!assignment) return;
        setSaving(true);
        let res;
        if (sectionId) {
            res = await assignTeacherToSubjectInSection(
                assignment.subject.id,
                assignment.classId,
                sectionId,
                null
            );
        } else {
            res = await assignTeacherToSubjectClass(assignment.id, null);
        }
        setSaving(false);
        if (res.success) {
            toast.success("Teacher removed");
            onAssigned();
            onClose();
        } else {
            toast.error(res.error ?? "Failed");
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Assign Teacher</DialogTitle>
                    <DialogDescription>
                        {assignment && (
                            <>
                                Who teaches{" "}
                                <strong className="text-foreground">{assignment.subject.name}</strong>
                                {" "}in{" "}
                                <strong className="text-foreground">{contextLabel}</strong>?
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search teachers…"
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-1">
                        {filtered.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                No teachers found
                            </p>
                        )}
                        {filtered.map((t) => {
                            const isCurrent = assignment?.teacher?.id === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    disabled={saving}
                                    onClick={() => assign(t.id)}
                                    className={[
                                        "w-full flex items-center gap-3 p-2.5 rounded-md text-left transition-colors",
                                        isCurrent
                                            ? "bg-primary/10 ring-1 ring-primary/30"
                                            : "hover:bg-accent",
                                    ].join(" ")}
                                >
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={t.avatar ?? undefined} />
                                        <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                                            {t.name}
                                            {isCurrent && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                    Current
                                                </Badge>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            #{t.employeeId}
                                            {t.subjectNames.length > 0 &&
                                                ` · ${t.subjectNames.slice(0, 2).join(", ")}${t.subjectNames.length > 2 ? ` +${t.subjectNames.length - 2}` : ""}`}
                                        </p>
                                    </div>
                                    {saving && isCurrent && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    {assignment?.teacher && (
                        <Button
                            variant="outline"
                            onClick={remove}
                            disabled={saving}
                            className="text-destructive hover:text-destructive"
                        >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove Teacher
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CurriculumPage() {
    return (
        <DndProvider backend={HTML5Backend}>
            <CurriculumContent />
        </DndProvider>
    );
}

function CurriculumContent() {
    const router = useRouter();

    // ── Data ────────────────────────────────────────────────────────────────
    const [classes, setClasses]                     = useState<ClassType[]>([]);
    const [allSubjects, setAllSubjects]             = useState<SubjectType[]>([]);
    const [teachers, setTeachers]                   = useState<TeacherType[]>([]);

    // assignments keyed by classId
    const [assignmentsMap, setAssignmentsMap]       = useState<Record<string, AssignmentType[]>>({});
    const [loadedClasses, setLoadedClasses]         = useState<Set<string>>(new Set());

    const [loading, setLoading]                     = useState(true);
    const [loadingClass, setLoadingClass]           = useState<string | null>(null);

    // ── UI state ─────────────────────────────────────────────────────────────
    const [subjectSearch, setSubjectSearch]         = useState("");
    const [classSearch, setClassSearch]             = useState("");
    const [teacherDialog, setTeacherDialog]         = useState<{ assignment: AssignmentType; contextLabel: string; sectionId?: string } | null>(null);

    const openTeacherDialog = useCallback((assignment: AssignmentType, contextLabel: string, sectionId?: string) => {
        setTeacherDialog({ assignment, contextLabel, sectionId });
    }, []);
    const [expandedClasses, setExpandedClasses]     = useState<Set<string>>(new Set());

    // ── Load initial data ────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            setLoading(true);
            const [cr, sr, tr] = await Promise.all([
                getClassesWithSections(),
                getAllSubjects(),
                getTeachersForSchool(),
            ]);
            if (cr.success && cr.data) setClasses(cr.data);
            if (sr.success && sr.data) setAllSubjects(sr.data);
            if (tr.success && tr.data) setTeachers(tr.data);
            setLoading(false);
        })();
    }, []);

    // ── Load assignments for a class (lazy) ──────────────────────────────────
    // Track which classes need fetching — a Set of classIds queued for load
    const [fetchQueue, setFetchQueue] = useState<Set<string>>(new Set());

    // Side-effect: whenever fetchQueue changes, load any queued classes
    useEffect(() => {
        fetchQueue.forEach((classId) => {
            if (loadedClasses.has(classId)) return;
            setLoadingClass(classId);
            getClassSubjects(classId).then((res) => {
                if (res.success && res.data) {
                    setAssignmentsMap((prev) => ({ ...prev, [classId]: res.data as AssignmentType[] }));
                    setLoadedClasses((prev) => new Set(prev).add(classId));
                }
                setLoadingClass(null);
            });
        });
        // Clear the queue after processing
        if (fetchQueue.size > 0) setFetchQueue(new Set());
    }, [fetchQueue]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleClass = useCallback((classId: string) => {
        setExpandedClasses((prev) => {
            const next = new Set(prev);
            if (next.has(classId)) {
                next.delete(classId);
            } else {
                next.add(classId);
            }
            return next;
        });
        // Queue a fetch if not yet loaded — done outside the state updater
        setFetchQueue((prev) => {
            if (loadedClasses.has(classId)) return prev;
            const next = new Set(prev);
            next.add(classId);
            return next;
        });
    }, [loadedClasses]);

    // ── Refresh a class's assignments ────────────────────────────────────────
    const refreshClass = useCallback(async (classId: string) => {
        const res = await getClassSubjects(classId);
        if (res.success && res.data) {
            setAssignmentsMap((prev) => ({ ...prev, [classId]: res.data as AssignmentType[] }));
        }
    }, []);

    // ── Drop: palette → zone ─────────────────────────────────────────────────
    const handleDrop = useCallback(async (subject: SubjectType, target: DropTarget) => {
        let res;
        if (target.sectionId) {
            res = await assignSubjectToSection(target.classId, target.sectionId, subject.id);
        } else {
            res = await assignSubjectToClass(target.classId, subject.id);
        }
        if (res.success) {
            toast.success(`${subject.name} added to ${target.label}`);
            await refreshClass(target.classId);
        } else {
            toast.error(res.error ?? "Failed to assign");
        }
    }, [refreshClass]);

    // ── Remove ───────────────────────────────────────────────────────────────
    const handleRemove = useCallback(async (id: string, name: string, classId: string) => {
        if (!confirm(`Remove "${name}" from this curriculum?`)) return;
        const res = await removeSubjectAssignment(id);
        if (res.success) {
            toast.success("Removed");
            await refreshClass(classId);
        } else {
            toast.error(res.error ?? "Failed");
        }
    }, [refreshClass]);

    // ── Reorder ──────────────────────────────────────────────────────────────
    const handleReorder = useCallback(async (items: AssignmentType[], classId: string) => {
        const updates = items.map((item, i) => ({ id: item.id, order: i }));
        const res = await reorderClassSubjects(updates);
        if (!res.success) toast.error("Failed to save order");
        else await refreshClass(classId);
    }, [refreshClass]);

    // ── Derived ──────────────────────────────────────────────────────────────
    const filteredSubjects = allSubjects.filter(
        (s) =>
            s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
            s.code.toLowerCase().includes(subjectSearch.toLowerCase())
    );

    const filteredClasses = classes.filter((c) =>
        c.name.toLowerCase().includes(classSearch.toLowerCase())
    );

    // Which subjects are assigned to a given class (any scope) — for greying
    const assignedInClass = useCallback(
        (classId: string, subjectId: string) =>
            (assignmentsMap[classId] ?? []).some((a) => a.subject.id === subjectId),
        [assignmentsMap]
    );

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <div className="flex flex-col h-full">
                {/* Page header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Curriculum Management</h1>
                        <p className="text-sm text-muted-foreground">
                            Drag subjects from the left panel into classes or sections
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.push("/admin/teaching/subjects")}>
                        Manage Subjects
                    </Button>
                </div>

                {/* Two-panel layout */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT: Subject palette ─────────────────────────────── */}
                    <div className="w-64 shrink-0 border-r flex flex-col overflow-hidden">
                        <div className="p-3 border-b">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Subjects ({allSubjects.length})
                            </p>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Filter subjects…"
                                    className="pl-8 h-8 text-sm"
                                    value={subjectSearch}
                                    onChange={(e) => setSubjectSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredSubjects.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-6">
                                    No subjects match
                                </p>
                            )}
                            {filteredSubjects.map((s) => (
                                <PaletteChip
                                    key={s.id}
                                    subject={s}
                                    // Grey out only if the CURRENTLY expanded class has it
                                    // (we check all expanded classes for assignment)
                                    alreadyIn={false}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── RIGHT: Class drop zones ───────────────────────────── */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Class search */}
                        <div className="sticky top-0 z-10 bg-background border-b px-4 py-2">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Filter classes…"
                                    className="pl-8 h-8 text-sm"
                                    value={classSearch}
                                    onChange={(e) => setClassSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {filteredClasses.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                    <BookOpen className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="text-sm">No classes found</p>
                                </div>
                            )}

                            {filteredClasses.map((cls) => {
                                const isExpanded = expandedClasses.has(cls.id);
                                const isLoadingThis = loadingClass === cls.id;
                                const classAssignments = (assignmentsMap[cls.id] ?? [])
                                    .filter((a) => !a.sectionId)
                                    .sort((a, b) => a.order - b.order);
                                const sectionAssignments = (assignmentsMap[cls.id] ?? [])
                                    .filter((a) => a.sectionId);

                                return (
                                    <div key={cls.id} className="border rounded-xl overflow-hidden">
                                        {/* Class header row */}
                                        <button
                                            type="button"
                                            onClick={() => toggleClass(cls.id)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="font-semibold">{cls.name}</span>
                                                {cls.sections.length > 0 && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                        {cls.sections.length} sec
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {isLoadingThis ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : isExpanded && loadedClasses.has(cls.id) ? (
                                                    <span>
                                                        {(assignmentsMap[cls.id] ?? []).length} assigned
                                                    </span>
                                                ) : null}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="p-3 space-y-3 bg-background">
                                                {isLoadingThis ? (
                                                    <div className="flex justify-center py-6">
                                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Class-wide zone */}
                                                        <DropZone
                                                            target={{ classId: cls.id, label: `${cls.name} — All Sections` }}
                                                            items={classAssignments}
                                                            allAssignments={assignmentsMap}
                                                            onDrop={handleDrop}
                                                            onReorder={(items) => handleReorder(items, cls.id)}
                                                            onRemove={(id, name) => handleRemove(id, name, cls.id)}
                                                            onTeacher={openTeacherDialog}
                                                            defaultOpen
                                                        />

                                                        {/* Section zones */}
                                                        {cls.sections.map((sec) => {
                                                            const secItems = sectionAssignments
                                                                .filter((a) => a.sectionId === sec.id)
                                                                .sort((a, b) => a.order - b.order);
                                                            return (
                                                                <DropZone
                                                                    key={sec.id}
                                                                    target={{
                                                                        classId: cls.id,
                                                                        sectionId: sec.id,
                                                                        label: `${cls.name} — Section ${sec.name}`,
                                                                    }}
                                                                    items={secItems}
                                                                    inheritedItems={classAssignments}
                                                                    allAssignments={assignmentsMap}
                                                                    onDrop={handleDrop}
                                                                    onReorder={(items) => handleReorder(items, cls.id)}
                                                                    onRemove={(id, name) => handleRemove(id, name, cls.id)}
                                                                    onTeacher={openTeacherDialog}
                                                                    defaultOpen={false}
                                                                />
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Teacher assignment dialog */}
            <TeacherDialog
                assignment={teacherDialog?.assignment ?? null}
                contextLabel={teacherDialog?.contextLabel ?? ""}
                sectionId={teacherDialog?.sectionId}
                teachers={teachers}
                open={!!teacherDialog}
                onClose={() => setTeacherDialog(null)}
                onAssigned={async () => {
                    if (teacherDialog) await refreshClass(teacherDialog.assignment.classId);
                }}
            />
        </>
    );
}
