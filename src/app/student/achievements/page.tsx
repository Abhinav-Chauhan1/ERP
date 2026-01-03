import { redirect } from "next/navigation";
import { Metadata } from "next";
import { format } from "date-fns";
import { Award, Medal, Scroll, Calendar, User, Trash2 } from "lucide-react";
// Note: Replace currentUser() calls with auth() and access session.user
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getStudentAchievements, deleteAchievement } from "@/lib/actions/student-achievement-actions";
import { CertificateForm } from "@/components/student/certificate-form";
import { AwardForm } from "@/components/student/award-form";
import { ExtraCurricularForm } from "@/components/student/extra-curricular-form";
import { AchievementDialogTrigger } from "@/components/student/achievement-dialog-trigger";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Achievements | Student Portal",
  description: "View your certificates, awards and achievements",
};

export const dynamic = 'force-dynamic';

export default async function StudentAchievementsPage() {
  // Use direct authentication instead of getCurrentUserDetails
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      id: session.user.id
    }
  });

  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    redirect("/login");
  }

  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  if (!student) {
    redirect("/student");
  }

  const {
    certificates,
    awards,
    extraCurricular,
    categories
  } = await getStudentAchievements();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Achievements</h1>
        <p className="text-muted-foreground mt-1">
          Track your certificates, awards, and extra-curricular activities
        </p>
      </div>

      <Tabs defaultValue="certificates" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
          <TabsTrigger value="extra-curricular">Extra-curricular</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Certificates</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your academic and professional certificates
              </p>
            </div>
            <AchievementDialogTrigger title="Add Certificate">
              <CertificateForm categories={categories.certificate} />
            </AchievementDialogTrigger>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.length > 0 ? (
              certificates.map(certificate => (
                <Card key={certificate.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {certificate.imageUrl && (
                    <div className="h-48 w-full bg-muted relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Scroll className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg">{certificate.title}</CardTitle>
                      <Badge variant="outline" className="flex-shrink-0">{certificate.category}</Badge>
                    </div>
                    <CardDescription>
                      Issued on {format(new Date(certificate.issueDate), "MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {certificate.description}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Issued by: {certificate.issuedBy}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-end">
                    <form action={async () => {
                      "use server";
                      await deleteAchievement(certificate.id, "certificate");
                    }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[40px]"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Scroll className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Your certificates will appear here when added
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="awards" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Awards</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Recognition and honors you've received
              </p>
            </div>
            <AchievementDialogTrigger title="Add Award">
              <AwardForm categories={categories.award} />
            </AchievementDialogTrigger>
          </div>

          <div className="space-y-4">
            {awards.length > 0 ? (
              awards.map(award => (
                <Card key={award.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-lg text-amber-600 flex-shrink-0">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{award.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {award.category}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex-shrink-0">
                        {award.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {award.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>Awarded on {format(new Date(award.awardDate), "MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span>Presenter: {award.presenter}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-end">
                    <form action={async () => {
                      "use server";
                      await deleteAchievement(award.id, "award");
                    }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[40px]"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Award className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No awards yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Your awards will appear here when added
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="extra-curricular" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Extra-curricular Activities</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your participation in clubs, sports, and other activities
              </p>
            </div>
            <AchievementDialogTrigger title="Add Activity">
              <ExtraCurricularForm categories={categories.extraCurricular} />
            </AchievementDialogTrigger>
          </div>

          <div className="space-y-4">
            {extraCurricular.length > 0 ? (
              extraCurricular.map(activity => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-primary/10 rounded-md text-primary">
                            <Medal className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-lg">{activity.activity}</CardTitle>
                        </div>
                        <CardDescription>
                          {activity.role} • {activity.duration}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">{activity.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Achievements: </span>
                      <span className="text-muted-foreground">{activity.achievements}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-end">
                    <form action={async () => {
                      "use server";
                      await deleteAchievement(activity.id, "extraCurricular");
                    }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[40px]"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Medal className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No extra-curricular activities yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Your extra-curricular activities will appear here when added
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
