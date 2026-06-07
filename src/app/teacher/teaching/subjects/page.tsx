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
    BookOpen,
    Eye,
    Play,
    Users,
    FileText,
    School,
    TrendingUp,
    ChevronRight,
} from "lucide-react";
import { SyllabusProgress } from "@/components/academic/syllabus-progress";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions";

export const dynamic = "force-dynamic";

export default async function TeacherSubjectsPage() {
    const { subjects } = await getTeacherSubjects();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Subjects</h1>
                    <p className="text-muted-foreground text-sm">
                        Subjects you've been assigned to teach
                    </p>
                </div>
                <Link href="/teacher/academics/resources">
                    <Button>
                        <FileText className="mr-2 h-4 w-4" /> Teaching Resources
                    </Button>
                </Link>
            </div>

            {subjects.length === 0 ? (
                <Card>
                    <CardContent className="py-16 flex flex-col items-center text-center gap-3">
                        <BookOpen className="h-12 w-12 text-muted-foreground/20" />
                        <h3 className="font-semibold text-lg">No subjects assigned</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            You haven't been assigned to any subjects yet. Contact the admin
                            to get your subjects set up in the curriculum.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Subject cards */}
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {subjects.map((subject) => (
                            <Card key={subject.id} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-base">{subject.name}</CardTitle>
                                            <CardDescription className="mt-0.5 font-mono text-xs">
                                                {subject.code}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="secondary" className="shrink-0 text-xs">
                                            {subject.totalStudents} students
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 space-y-4">
                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="rounded-md bg-muted/50 p-2">
                                            <Users className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                                            <p className="font-semibold">{subject.totalStudents}</p>
                                            <p className="text-muted-foreground">Students</p>
                                        </div>
                                        <div className="rounded-md bg-muted/50 p-2">
                                            <School className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                                            <p className="font-semibold">{subject.classAssignments.length}</p>
                                            <p className="text-muted-foreground">Classes</p>
                                        </div>
                                        <div className="rounded-md bg-muted/50 p-2">
                                            <TrendingUp className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                                            <p className="font-semibold">{subject.progress}%</p>
                                            <p className="text-muted-foreground">Progress</p>
                                        </div>
                                    </div>

                                    {/* Class + section assignments */}
                                    {subject.classAssignments.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
                                                Assigned to
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {subject.classAssignments.map((ca) => (
                                                    <Link
                                                        key={`${ca.id}-${ca.sectionId ?? "all"}`}
                                                        href={`/teacher/teaching/classes/${ca.id}${ca.sectionId ? `?section=${ca.sectionId}` : ""}`}
                                                    >
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs hover:bg-accent cursor-pointer gap-1"
                                                        >
                                                            {ca.displayName}
                                                            <span className="text-muted-foreground">
                                                                · {ca.studentCount}
                                                            </span>
                                                        </Badge>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Syllabus progress bar */}
                                    {subject.totalTopics > 0 && (
                                        <div>
                                            <div className="flex justify-between mb-1 text-xs">
                                                <span className="text-muted-foreground">Syllabus coverage</span>
                                                <span className="font-medium">
                                                    {subject.completedTopics}/{subject.totalTopics} topics
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5">
                                                <div
                                                    className="bg-primary h-1.5 rounded-full transition-all"
                                                    style={{ width: `${subject.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>

                                {/* Action buttons */}
                                <div className="px-6 pb-5 flex flex-wrap gap-2 border-t pt-4">
                                    <Link href={`/teacher/teaching/classes?subject=${subject.id}`}>
                                        <Button variant="outline" size="sm" className="h-8 gap-1">
                                            <Users className="h-3.5 w-3.5" /> Classes
                                        </Button>
                                    </Link>
                                    <Link href={`/teacher/teaching/syllabus?subject=${subject.id}`}>
                                        <Button variant="outline" size="sm" className="h-8 gap-1">
                                            <BookOpen className="h-3.5 w-3.5" /> Syllabus
                                        </Button>
                                    </Link>
                                    <Link href={`/teacher/teaching/lessons?subject=${subject.id}`}>
                                        <Button variant="outline" size="sm" className="h-8 gap-1">
                                            <Play className="h-3.5 w-3.5" /> Lessons
                                        </Button>
                                    </Link>
                                    <Link href={`/teacher/teaching/subjects/${subject.id}`} className="ml-auto">
                                        <Button size="sm" className="h-8 gap-1">
                                            <Eye className="h-3.5 w-3.5" /> Details
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Syllabus progress tabs — only for subjects with syllabus */}
                    {subjects.some((s) => s.syllabus.length > 0) && (
                        <div>
                            <h2 className="text-xl font-bold tracking-tight mb-4">
                                Syllabus Progress
                            </h2>
                            <Tabs
                                defaultValue={
                                    subjects.find((s) => s.syllabus.length > 0)?.id
                                }
                                className="mt-2"
                            >
                                <TabsList className="mb-4 flex-wrap h-auto">
                                    {subjects
                                        .filter((s) => s.syllabus.length > 0)
                                        .map((subject) => (
                                            <TabsTrigger key={subject.id} value={subject.id}>
                                                {subject.name}
                                                {subject.grade && (
                                                    <span className="ml-1.5 text-[10px] opacity-60">
                                                        {subject.grade}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                        ))}
                                </TabsList>

                                {subjects
                                    .filter((s) => s.syllabus.length > 0)
                                    .map((subject) => (
                                        <TabsContent key={subject.id} value={subject.id}>
                                            <SyllabusProgress
                                                subjectName={subject.name}
                                                className={
                                                    subject.classAssignments.length > 0
                                                        ? subject.classAssignments
                                                              .map((ca) => ca.displayName)
                                                              .join(", ")
                                                        : subject.grade || ""
                                                }
                                                academicYear="Current"
                                                overallProgress={subject.progress}
                                                lastUpdated={new Date().toLocaleDateString()}
                                                units={(subject.syllabus[0]?.modules ?? []).map(
                                                    (unit: {
                                                        id: string;
                                                        title: string;
                                                        order: number;
                                                        totalTopics: number;
                                                        completedTopics: number;
                                                        subModules: {
                                                            id: string;
                                                            title: string;
                                                            isCompleted: boolean;
                                                        }[];
                                                        status: string;
                                                        lastUpdated: string;
                                                    }) => ({
                                                        ...unit,
                                                        status:
                                                            (unit.status as
                                                                | "completed"
                                                                | "in-progress"
                                                                | "not-started") || "not-started",
                                                    })
                                                )}
                                                subjectId={subject.id}
                                            />
                                        </TabsContent>
                                    ))}
                            </Tabs>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
