import { redirect } from "next/navigation";
import { Metadata } from "next";
import { format } from "date-fns";
import { Award, Medal, Scroll, Calendar, User, Trash2 } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
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

export const metadata: Metadata = {
  title: "Achievements | Student Portal",
  description: "View your certificates, awards and achievements",
};

export default async function StudentAchievementsPage() {
  // Use direct authentication instead of getCurrentUserDetails
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
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
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">My Achievements</h1>
      
      <Tabs defaultValue="certificates" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
          <TabsTrigger value="extra-curricular">Extra-curricular</TabsTrigger>
        </TabsList>
        
        <TabsContent value="certificates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Certificates</h2>
            <AchievementDialogTrigger title="Add Certificate">
              <CertificateForm categories={categories.certificate} />
            </AchievementDialogTrigger>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.length > 0 ? (
              certificates.map(certificate => (
                <Card key={certificate.id} className="overflow-hidden">
                  {certificate.imageUrl && (
                    <div className="h-48 w-full bg-gray-100 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Scroll className="h-12 w-12 text-gray-400" />
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{certificate.title}</CardTitle>
                      <Badge variant="outline">{certificate.category}</Badge>
                    </div>
                    <CardDescription>
                      Issued on {format(new Date(certificate.issueDate), "MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-2">
                      {certificate.description}
                    </p>
                    <p className="text-sm flex items-center text-gray-500">
                      <User className="h-3.5 w-3.5 mr-2" />
                      Issued by: {certificate.issuedBy}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-end">
                    <form action={async () => {
                      "use server";
                      await deleteAchievement(certificate.id, "certificate");
                    }}>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Scroll className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No certificates yet</h3>
                <p className="text-sm text-gray-500">
                  Your certificates will appear here when added
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="awards">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Awards</h2>
            <AchievementDialogTrigger title="Add Award">
              <AwardForm categories={categories.award} />
            </AchievementDialogTrigger>
          </div>
          
          <div className="space-y-6">
            {awards.length > 0 ? (
              awards.map(award => (
                <Card key={award.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-3 rounded-full">
                          <Award className="h-6 w-6 text-amber-600" />
                        </div>
                        <CardTitle className="text-lg">{award.title}</CardTitle>
                      </div>
                      <Badge>{award.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-4">
                      {award.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Awarded on {format(new Date(award.awardDate), "MMMM d, yyyy")}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Presenter: {award.presenter}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-end">
                    <form action={async () => {
                      "use server";
                      await deleteAchievement(award.id, "award");
                    }}>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No awards yet</h3>
                <p className="text-sm text-gray-500">
                  Your awards will appear here when added
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="extra-curricular">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Extra-curricular Activities</h2>
            <AchievementDialogTrigger title="Add Activity">
              <ExtraCurricularForm categories={categories.extraCurricular} />
            </AchievementDialogTrigger>
          </div>
          
          <div className="space-y-4">
            {extraCurricular.length > 0 ? (
              extraCurricular.map(activity => (
                <Card key={activity.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <CardTitle className="text-lg">{activity.activity}</CardTitle>
                      <Badge variant="outline">{activity.category}</Badge>
                    </div>
                    <CardDescription>
                      {activity.role} • {activity.duration}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Achievements: </span>
                      {activity.achievements}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-end">
                    <form action={async () => {
                      "use server";
                      await deleteAchievement(activity.id, "extraCurricular");
                    }}>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Medal className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No extra-curricular activities yet</h3>
                <p className="text-sm text-gray-500">
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
