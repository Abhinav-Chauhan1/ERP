// Note: Replace currentUser() calls with auth() and access session.user
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AchievementForm } from "@/components/teacher/achievements/achievement-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function NewAchievementPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const teacher = await getTeacher(session.user.id);

  if (!teacher) {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Add New Achievement</CardTitle>
          <CardDescription>
            Record your professional accomplishments, awards, and certifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AchievementForm teacherId={teacher.id} />
        </CardContent>
      </Card>
    </div>
  );
}
