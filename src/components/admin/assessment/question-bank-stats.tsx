import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSchoolQuestionBankStats } from "@/lib/actions/adminQuestionBankActions";
import { BookOpen, FileQuestion, TrendingUp, Target } from "lucide-react";

export async function QuestionBankStats() {
    const result = await getSchoolQuestionBankStats();

    if (!result.success || !result.stats) {
        return null;
    }

    const { stats } = result;

    const typeStats = {
        MCQ: stats.questionsByType.find((t: any) => t.questionType === "MCQ")?._count || 0,
        TRUE_FALSE: stats.questionsByType.find((t: any) => t.questionType === "TRUE_FALSE")?._count || 0,
        ESSAY: stats.questionsByType.find((t: any) => t.questionType === "ESSAY")?._count || 0,
    };

    const difficultyStats = {
        EASY: stats.questionsByDifficulty.find((d: any) => d.difficulty === "EASY")?._count || 0,
        MEDIUM: stats.questionsByDifficulty.find((d: any) => d.difficulty === "MEDIUM")?._count || 0,
        HARD: stats.questionsByDifficulty.find((d: any) => d.difficulty === "HARD")?._count || 0,
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                    <p className="text-xs text-muted-foreground">
                        Across all subjects
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">MCQ Questions</CardTitle>
                    <FileQuestion className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{typeStats.MCQ}</div>
                    <p className="text-xs text-muted-foreground">
                        Multiple choice questions
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Used</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.mostUsedQuestions[0]?.usageCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.mostUsedQuestions[0]?.subject.name || "No usage yet"}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Difficulty Mix</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{difficultyStats.MEDIUM}</div>
                    <p className="text-xs text-muted-foreground">
                        Medium difficulty questions
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
