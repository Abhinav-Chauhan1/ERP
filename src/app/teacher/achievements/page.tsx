import { Suspense } from "react";
// Note: Replace currentUser() calls with auth() and access session.user
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AchievementList } from "@/components/teacher/achievements/achievement-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function getTeacherAchievements(teacherId: string) {
  const achievements = await db.achievement.findMany({
    where: { teacherId },
    orderBy: [
      { date: "desc" },
      { createdAt: "desc" }
    ],
  });

  return achievements;
}

import { auth } from "@/auth";

async function getTeacher(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      teacher: true,
    },
  });

  return user?.teacher;
}

export default async function AchievementsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const teacher = await getTeacher(session.user.id);

  if (!teacher) {
    redirect("/");
  }

  const achievements = await getTeacherAchievements(teacher.id);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Achievements</h1>
          <p className="text-muted-foreground mt-1">
            Track your professional accomplishments and awards
          </p>
        </div>
        <Link href="/teacher/achievements/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Achievement
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Loading achievements...</div>}>
        <AchievementList achievements={achievements} />
      </Suspense>

      {achievements.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Achievements Yet</CardTitle>
            <CardDescription>
              Start tracking your professional achievements by adding your first one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/teacher/achievements/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Achievement
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
