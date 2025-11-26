import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AchievementForm } from "@/components/teacher/achievements/achievement-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function getTeacher(clerkId: string) {
  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      teacher: true,
    },
  });

  return user?.teacher;
}

export default async function NewAchievementPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  const teacher = await getTeacher(user.id);

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
