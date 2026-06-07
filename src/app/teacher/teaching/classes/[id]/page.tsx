import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    ArrowLeft,
    BookOpen,
    CalendarClock,
    ClipboardCheck,
    Download,
    FileText,
    PenLine,
    Users,
    BarChart,
    Clock,
    DoorOpen,
} from "lucide-react";
import { getClassDetails } from "@/lib/actions/teacherClassesActions";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { format } from "date-fns";
import { requireSchoolAccess } from "@/lib/auth/tenant";

export const dynamic = "force-dynamic";

// ── Fetch real assignments + exams for this class ────────────────────────────
async function getClassAssessmentsData(classId: string, teacherId: string, schoolId: string) {
    const [assignments, exams] = await Promise.all([
        db.assignment.findMany({
            where: {
                schoolId,
                creatorId: teacherId,
                classes: { some: { classId } },
            },
            include: {
                subject: { select: { name: true } },
                submissions: { select: { id: true, status: true, marks: true } },
            },
            orderBy: { dueDate: "desc" },
            take: 10,
        }),
        db.exam.findMany({
            where: {
                schoolId,
                creatorId: teacherId,
                subject: { classes: { some: { classId } } },
            },
            include: {
                examType: { select: { name: true } },
            },
            orderBy: { examDate: "desc" },
            take: 10,
        }),
    ]);

    const formattedAssignments = assignments.map((a) => {
        const submitted = a.submissions.filter(
            (s) => s.status === "SUBMITTED" || s.status === "GRADED"
        ).length;
        const graded = a.submissions.filter((s) => s.status === "GRADED").length;
        const avgScore =
            graded > 0
                ? (
                      a.submissions
                          .filter((s) => s.status === "GRADED" && s.marks != null)
                          .reduce((sum, s) => sum + (s.marks ?? 0), 0) / graded
                  ).toFixed(1)
                : "—";

        return {
            id: a.id,
            title: a.title,
            subject: a.subject?.name ?? "—",
            dueDate: format(a.dueDate, "MMM d, yyyy"),
            totalMarks: a.totalMarks,
            submitted,
            graded,
            averageScore: graded > 0 ? `${avgScore}/${a.totalMarks}` : "—",
            isPast: new Date() > a.dueDate,
        };
    });

    const formattedExams = exams.map((e) => ({
        id: e.id,
        title: e.title,
        date: format(e.examDate, "MMM d, yyyy"),
        type: e.examType?.name ?? "—",
        duration: `${Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000)} min`,
        totalMarks: e.totalMarks,
        status: e.examDate > new Date() ? "Upcoming" : "Completed",
    }));

    const upcoming = [
        ...exams
            .filter((e) => e.examDate > new Date())
            .map((e) => ({
                id: e.id,
                title: e.title,
                date: format(e.examDate, "MMM d"),
                type: "Exam" as const,
            })),
        ...assignments
            .filter((a) => a.dueDate > new Date())
            .map((a) => ({
                id: a.id,
                title: a.title,
                date: format(a.dueDate, "MMM d"),
                type: "Assignment" as const,
            })),
    ]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4);

    return { assignments: formattedAssignments, exams: formattedExams, upcoming };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ClassDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ section?: string }>;
}) {
    const [{ id: classId }, sp] = await Promise.all([params, searchParams]);
    const sectionId = sp.section;

    const session = await auth();
    const { schoolId } = await requireSchoolAccess();
    const teacher = session?.user?.id
        ? await db.teacher.findFirst({
              where: { user: { id: session.user.id }, schoolId: schoolId as string },
              select: { id: true },
          })
        : null;

    const [classInfo, assessments] = await Promise.all([
        getClassDetails(classId, sectionId),
        teacher
            ? getClassAssessmentsData(classId, teacher.id, schoolId as string)
            : Promise.resolve({ assignments: [], exams: [], upcoming: [] }),
    ]);

    const sectionLabel = sectionId
        ? classInfo.sections.find((s) => s.id === sectionId)?.name
        : null;

    const displayTitle = sectionLabel
        ? `${classInfo.name} — Section ${sectionLabel}`
        : classInfo.name;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/teacher/teaching/classes">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex justify-between items-center flex-1">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>
                        <p className="text-muted-foreground text-sm">
                            {classInfo.academicYear}
                            {classInfo.subjects.length > 0 &&
                                ` · ${classInfo.subjects.map((s) => s.name).join(", ")}`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/teacher/attendance/mark?classId=${classId}${sectionId ? `&sectionId=${sectionId}` : ""}`}
                        >
                            <Button variant="outline">
                                <ClipboardCheck className="mr-2 h-4 w-4" /> Take Attendance
                            </Button>
                        </Link>
                        <Link
                            href={`/teacher/assessments/assignments/create?classId=${classId}`}
                        >
                            <Button>
                                <FileText className="mr-2 h-4 w-4" /> Create Assignment
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Top row: stats + attendance */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Overview card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Class Overview</CardTitle>
                        <CardDescription>Current status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Students</p>
                                <p className="text-2xl font-bold">{classInfo.totalStudents}</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Today P / A</p>
                                <div className="flex justify-center items-center gap-1">
                                    <span className="text-xl font-bold text-green-600">
                                        {classInfo.presentToday}
                                    </span>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="text-xl font-bold text-destructive">
                                        {classInfo.absentToday}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Subjects */}
                        {classInfo.subjects.length > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                                    Subjects you teach
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {classInfo.subjects.map((s) => (
                                        <Badge key={s.id} variant="secondary" className="text-xs">
                                            {s.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Schedule */}
                        {classInfo.schedule.length > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                                    Timetable
                                </p>
                                <div className="space-y-1">
                                    {classInfo.schedule.slice(0, 4).map((slot) => (
                                        <div
                                            key={slot.id}
                                            className="flex items-center justify-between text-xs"
                                        >
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span className="capitalize">
                                                    {slot.day.charAt(0) +
                                                        slot.day.slice(1).toLowerCase()}
                                                </span>
                                                <span>
                                                    {slot.startTime}–{slot.endTime}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <DoorOpen className="h-3 w-3" />
                                                <span>{slot.room}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming */}
                        {assessments.upcoming.length > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                                    Upcoming Assessments
                                </p>
                                <ul className="space-y-1.5">
                                    {assessments.upcoming.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex items-center justify-between p-2 bg-muted/40 rounded text-xs"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <CalendarClock className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-medium truncate max-w-[120px]">
                                                    {item.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-muted-foreground">
                                                    {item.date}
                                                </span>
                                                <Badge
                                                    variant={
                                                        item.type === "Exam"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    className="text-[9px] px-1 py-0"
                                                >
                                                    {item.type}
                                                </Badge>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sections info */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Sections</CardTitle>
                        <CardDescription>
                            {sectionId
                                ? `Showing Section ${sectionLabel}`
                                : "All sections in this class"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {classInfo.sections.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No sections found.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <Link href={`/teacher/teaching/classes/${classId}`}>
                                    <Badge
                                        variant={!sectionId ? "default" : "outline"}
                                        className="cursor-pointer text-sm px-3 py-1"
                                    >
                                        All Sections
                                    </Badge>
                                </Link>
                                {classInfo.sections.map((sec) => (
                                    <Link
                                        key={sec.id}
                                        href={`/teacher/teaching/classes/${classId}?section=${sec.id}`}
                                    >
                                        <Badge
                                            variant={sectionId === sec.id ? "default" : "outline"}
                                            className="cursor-pointer text-sm px-3 py-1"
                                        >
                                            Section {sec.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Main tabs */}
            <Card>
                <Tabs defaultValue="students">
                    <CardHeader className="pb-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <CardTitle>Class Management</CardTitle>
                            <TabsList className="flex-wrap h-auto">
                                <TabsTrigger value="students">
                                    Students ({classInfo.totalStudents})
                                </TabsTrigger>
                                <TabsTrigger value="assignments">
                                    Assignments ({assessments.assignments.length})
                                </TabsTrigger>
                                <TabsTrigger value="exams">
                                    Exams ({assessments.exams.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>

                    {/* Students tab */}
                    <TabsContent value="students" className="px-6 py-4">
                        {classInfo.students.length === 0 ? (
                            <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                                <Users className="h-10 w-10 opacity-20" />
                                <p className="text-sm">No enrolled students found.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between mb-4">
                                    <p className="text-sm text-muted-foreground">
                                        {classInfo.students.length} students enrolled
                                    </p>
                                    <Link
                                        href={`/teacher/students/performance?classId=${classId}`}
                                    >
                                        <Button size="sm" variant="outline">
                                            <BarChart className="mr-1 h-3.5 w-3.5" />
                                            Performance Report
                                        </Button>
                                    </Link>
                                </div>
                                <div className="rounded-md border overflow-hidden">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Roll No
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Section
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Today
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {classInfo.students.map((student) => (
                                                <tr key={student.id} className="hover:bg-muted/20">
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                                        {student.rollNumber || "—"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-medium">
                                                                {student.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                                        {student.section}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {student.todayStatus ? (
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    student.todayStatus === "PRESENT"
                                                                        ? "border-green-500 text-green-700 dark:text-green-400"
                                                                        : student.todayStatus === "ABSENT"
                                                                        ? "border-destructive text-destructive"
                                                                        : "border-amber-500 text-amber-700"
                                                                }
                                                            >
                                                                {student.todayStatus
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                    student.todayStatus
                                                                        .slice(1)
                                                                        .toLowerCase()}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                Not marked
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            href={`/teacher/students/${student.id}`}
                                                        >
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="h-auto p-0 text-xs"
                                                            >
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* Assignments tab */}
                    <TabsContent value="assignments" className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold">Assignments</h2>
                            <Link
                                href={`/teacher/assessments/assignments/create?classId=${classId}`}
                            >
                                <Button size="sm">
                                    <FileText className="h-3.5 w-3.5 mr-2" /> Create
                                </Button>
                            </Link>
                        </div>
                        {assessments.assignments.length === 0 ? (
                            <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                                <FileText className="h-10 w-10 opacity-20" />
                                <p className="text-sm">No assignments yet.</p>
                            </div>
                        ) : (
                            assessments.assignments.map((a) => (
                                <Card key={a.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base">{a.title}</CardTitle>
                                                <CardDescription>
                                                    {a.subject} · Due {a.dueDate} · {a.totalMarks} marks
                                                </CardDescription>
                                            </div>
                                            <Link
                                                href={`/teacher/assessments/assignments/${a.id}`}
                                            >
                                                <Button variant="outline" size="sm">
                                                    Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-3 text-sm text-center">
                                            <div className="bg-muted/50 rounded-lg p-2">
                                                <p className="text-xs text-muted-foreground">
                                                    Submitted
                                                </p>
                                                <p className="font-bold">
                                                    {a.submitted}/{classInfo.totalStudents}
                                                </p>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg p-2">
                                                <p className="text-xs text-muted-foreground">
                                                    Graded
                                                </p>
                                                <p className="font-bold">
                                                    {a.graded}/{a.submitted}
                                                </p>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg p-2">
                                                <p className="text-xs text-muted-foreground">
                                                    Avg Score
                                                </p>
                                                <p className="font-bold">{a.averageScore}</p>
                                            </div>
                                        </div>
                                        {a.submitted > 0 && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-muted-foreground">
                                                        Grading progress
                                                    </span>
                                                    <span>
                                                        {Math.round(
                                                            (a.graded / a.submitted) * 100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1.5">
                                                    <div
                                                        className="bg-primary h-1.5 rounded-full"
                                                        style={{
                                                            width: `${(a.graded / a.submitted) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                        <div className="flex justify-center pt-2">
                            <Link
                                href={`/teacher/assessments/assignments?classId=${classId}`}
                            >
                                <Button variant="outline">View All Assignments</Button>
                            </Link>
                        </div>
                    </TabsContent>

                    {/* Exams tab */}
                    <TabsContent value="exams" className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold">Exams</h2>
                        </div>
                        {assessments.exams.length === 0 ? (
                            <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                                <BookOpen className="h-10 w-10 opacity-20" />
                                <p className="text-sm">No exams yet.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            {["Title", "Date", "Type", "Duration", "Marks", "Status", ""].map(
                                                (h) => (
                                                    <th
                                                        key={h}
                                                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                                    >
                                                        {h}
                                                    </th>
                                                )
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {assessments.exams.map((exam) => (
                                            <tr key={exam.id} className="hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium text-sm">
                                                    {exam.title}
                                                </td>
                                                <td className="px-4 py-3 text-sm">{exam.date}</td>
                                                <td className="px-4 py-3 text-sm">{exam.type}</td>
                                                <td className="px-4 py-3 text-sm">{exam.duration}</td>
                                                <td className="px-4 py-3 text-sm">{exam.totalMarks}</td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            exam.status === "Upcoming"
                                                                ? "secondary"
                                                                : "outline"
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {exam.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/teacher/assessments/exams/${exam.id}`}
                                                    >
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="h-auto p-0 text-xs"
                                                        >
                                                            View
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
