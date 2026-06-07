import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BookOpen,
    Calendar,
    Users,
    Clock,
    DoorOpen,
    Crown,
    ChevronRight,
} from "lucide-react";
import { getTeacherClasses } from "@/lib/actions/teacherClassesActions";

export const dynamic = "force-dynamic";

export default async function TeacherClassesPage() {
    const { classes } = await getTeacherClasses();

    // Group for the schedule view: day → list of slots
    const classesByDay: Record<
        string,
        { id: string; sectionId: string | null; displayName: string; subject: string; scheduleTime: string; roomName: string }[]
    > = {};

    classes.forEach((cls) => {
        const days = cls.scheduleDay.split(", ").filter(Boolean);
        days.forEach((day) => {
            if (!classesByDay[day]) classesByDay[day] = [];
            classesByDay[day].push({
                id: cls.id,
                sectionId: cls.sectionId,
                displayName: cls.displayName,
                subject: cls.subject,
                scheduleTime: cls.scheduleTime,
                roomName: cls.roomName,
            });
        });
    });

    const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    const sortedDays = Object.keys(classesByDay).sort(
        (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Classes</h1>
                    <p className="text-muted-foreground text-sm">
                        Classes and sections where you teach a subject
                    </p>
                </div>
                <Link href="/teacher/teaching/timetable">
                    <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        View Timetable
                    </Button>
                </Link>
            </div>

            {classes.length === 0 ? (
                <Card>
                    <CardContent className="py-16 flex flex-col items-center text-center gap-3">
                        <BookOpen className="h-12 w-12 text-muted-foreground/20" />
                        <h3 className="font-semibold text-lg">No classes assigned yet</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            You haven't been assigned to any class or section as a subject
                            teacher. Contact the admin to assign subjects.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="all-classes">
                    <TabsList className="mb-4">
                        <TabsTrigger value="all-classes">
                            All Classes ({classes.length})
                        </TabsTrigger>
                        <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
                    </TabsList>

                    {/* ── All Classes grid ──────────────────────────────────── */}
                    <TabsContent value="all-classes">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {classes.map((cls) => (
                                <Card
                                    key={`${cls.id}-${cls.sectionId ?? "all"}`}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <CardTitle className="text-base leading-tight">
                                                    {cls.name}
                                                </CardTitle>
                                                {cls.section && (
                                                    <CardDescription className="mt-0.5">
                                                        Section {cls.section}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {cls.isClassHead && (
                                                    <Badge variant="secondary" className="text-[10px] gap-1">
                                                        <Crown className="h-3 w-3" />
                                                        Class Head
                                                    </Badge>
                                                )}
                                                {cls.section ? (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        Section {cls.section}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        All Sections
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        {/* Subjects */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
                                                Subjects you teach
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {cls.subjects.length > 0 ? (
                                                    cls.subjects.map((s) => (
                                                        <Badge
                                                            key={s.id}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {s.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="rounded-md bg-muted/50 p-2">
                                                <Users className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                                                <p className="font-semibold">{cls.studentCount}</p>
                                                <p className="text-muted-foreground">Students</p>
                                            </div>
                                            <div className="rounded-md bg-muted/50 p-2">
                                                <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                                                <p className="font-semibold truncate" title={cls.scheduleDay}>
                                                    {cls.scheduleDay === "Not scheduled"
                                                        ? "—"
                                                        : cls.scheduleDay.split(", ").length + "d"}
                                                </p>
                                                <p className="text-muted-foreground">Days/wk</p>
                                            </div>
                                            <div className="rounded-md bg-muted/50 p-2">
                                                <DoorOpen className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                                                <p className="font-semibold truncate" title={cls.roomName}>
                                                    {cls.roomName === "Not assigned" ? "—" : cls.roomName}
                                                </p>
                                                <p className="text-muted-foreground">Room</p>
                                            </div>
                                        </div>

                                        {/* Schedule time */}
                                        {cls.scheduleTime !== "Not scheduled" && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="h-3 w-3" />
                                                {cls.scheduleDay} · {cls.scheduleTime}
                                            </p>
                                        )}
                                    </CardContent>

                                    <div className="px-6 pb-4">
                                        <Link
                                            href={`/teacher/teaching/classes/${cls.id}${cls.sectionId ? `?section=${cls.sectionId}` : ""}`}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-1"
                                            >
                                                View Class
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* ── Weekly schedule ───────────────────────────────────── */}
                    <TabsContent value="schedule">
                        <div className="space-y-4">
                            {sortedDays.length === 0 ? (
                                <Card>
                                    <CardContent className="py-10 text-center text-muted-foreground text-sm">
                                        No timetable slots found.
                                    </CardContent>
                                </Card>
                            ) : (
                                sortedDays.map((day) => (
                                    <Card key={day}>
                                        <CardHeader className="py-3 bg-muted/30">
                                            <CardTitle className="text-base capitalize">
                                                {day.charAt(0) + day.slice(1).toLowerCase()}
                                            </CardTitle>
                                            <CardDescription>
                                                {classesByDay[day].length} slot
                                                {classesByDay[day].length !== 1 ? "s" : ""}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-2">
                                            {classesByDay[day].map((slot, i) => (
                                                <Link
                                                    key={`${slot.id}-${slot.sectionId}-${i}`}
                                                    href={`/teacher/teaching/classes/${slot.id}${slot.sectionId ? `?section=${slot.sectionId}` : ""}`}
                                                >
                                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                                                                <BookOpen className="h-4 w-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-sm">{slot.displayName}</p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {slot.subject}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 text-xs text-muted-foreground">
                                                            <p>{slot.scheduleTime}</p>
                                                            <p>{slot.roomName}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
