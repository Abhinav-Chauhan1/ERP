import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { StudentProfileInfo } from "@/components/student/student-profile-info";
import { StudentProfileEdit } from "@/components/student/student-profile-edit";
import { StudentAcademicDetails } from "@/components/student/student-academic-details";
import { PasswordChangeForm } from "@/components/forms/password-change-form";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Student Profile | School ERP",
  description: "View and manage your student profile",
};

export default async function StudentProfilePage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== "STUDENT") {
    redirect("/login");
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
    },
    include: {
      user: true,
      enrollments: {
        include: {
          class: true,
          section: true,
        },
        orderBy: {
          enrollDate: 'desc'
        },
        take: 1
      },
      parents: {
        include: {
          parent: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  if (!student) {
    redirect("/login");
  }

  return (
    <div className="container p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="info">Profile Info</TabsTrigger>
          <TabsTrigger value="academic">Academic Details</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-6">
          <div className="grid md:grid-cols-6 gap-6">
            <div className="md:col-span-4">
              <StudentProfileInfo student={student} />
            </div>
            <div className="md:col-span-2">
              <StudentProfileEdit student={student} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="academic" className="space-y-6">
          <StudentAcademicDetails student={student} />
        </TabsContent>
        
        <TabsContent value="password" className="space-y-6">
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Change Your Password</h2>
            <PasswordChangeForm userId={student.userId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
