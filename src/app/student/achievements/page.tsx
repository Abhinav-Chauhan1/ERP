import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Award, Medal, Scroll, Bookmark, Calendar, User } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUserDetails } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Achievements | Student Portal",
  description: "View your certificates, awards and achievements",
};

export default async function StudentAchievementsPage() {
  const userDetails = await getCurrentUserDetails();
  
  if (!userDetails?.dbUser || userDetails.dbUser.role !== "STUDENT") {
    redirect("/login");
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: userDetails.dbUser.id
    }
  });

  if (!student) {
    redirect("/student");
  }

  // For demonstration purposes, we'll create some mock data
  // In a real application, you would fetch this from your database
  const certificates = [
    {
      id: "1",
      title: "Academic Excellence",
      issueDate: new Date("2023-05-15"),
      issuedBy: "School Principal",
      description: "Awarded for outstanding academic performance in the 2022-2023 academic year.",
      category: "Academic",
      imageUrl: "/assets/certificates/academic-excellence.png"
    },
    {
      id: "2",
      title: "Mathematics Olympiad",
      issueDate: new Date("2023-02-10"),
      issuedBy: "National Mathematics Society",
      description: "Silver medal in the Regional Mathematics Olympiad.",
      category: "Competition",
      imageUrl: "/assets/certificates/math-olympiad.png"
    }
  ];
  
  const awards = [
    {
      id: "1",
      title: "Best Student of the Year",
      awardDate: new Date("2023-04-20"),
      presenter: "School Board",
      category: "Academic",
      description: "Recognized for exceptional academics, leadership, and school involvement."
    },
    {
      id: "2",
      title: "Sports Champion",
      awardDate: new Date("2022-11-15"),
      presenter: "Sports Department",
      category: "Sports",
      description: "Outstanding performance in school sports competitions."
    }
  ];
  
  const extraCurricular = [
    {
      id: "1",
      activity: "School Debate Club",
      role: "Club President",
      duration: "2022-2023",
      achievements: "Led the team to state finals; Organized 5 inter-school events",
      category: "Leadership"
    },
    {
      id: "2",
      activity: "Community Service",
      role: "Volunteer",
      duration: "2022-2023",
      achievements: "Completed 50 hours of community service in local orphanage",
      category: "Service"
    },
    {
      id: "3",
      activity: "Science Club",
      role: "Member",
      duration: "2021-2023",
      achievements: "Participated in the National Science Fair; Conducted 3 experiments",
      category: "Academic"
    }
  ];
  
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
                      Issued on {certificate.issueDate.toLocaleDateString()}
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
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Scroll className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No certificates yet</h3>
                <p className="text-sm text-gray-500">
                  Your certificates will appear here when awarded
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="awards">
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
                        Awarded on {award.awardDate.toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Presenter: {award.presenter}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No awards yet</h3>
                <p className="text-sm text-gray-500">
                  Your awards will appear here when received
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="extra-curricular">
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
