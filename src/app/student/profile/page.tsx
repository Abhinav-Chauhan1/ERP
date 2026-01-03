import { Metadata } from "next";
import { redirect } from "next/navigation";
// Note: Replace currentUser() calls with auth() and access session.user
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { StudentProfileInfo } from "@/components/student/student-profile-info";
import { StudentProfileEdit } from "@/components/student/student-profile-edit";
import { StudentAcademicDetails } from "@/components/student/student-academic-details";
import { PasswordChangeForm } from "@/components/forms/password-change-form";
import { auth } from "@/auth";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Student Profile | School ERP",
  description: "View and manage your student profile",
};

export default async function StudentProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id }
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
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your profile information
          </p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-12">
            <div className="relative">
              <div className="relative w-32 h-32 rounded-full bg-card border-4 border-card shadow-lg overflow-hidden">
                {student.user.avatar ? (
                  <Image
                    src={student.user.avatar}
                    alt={`${student.user.firstName} ${student.user.lastName}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {student.user.firstName[0]}{student.user.lastName[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 pb-4">
              <h2 className="text-2xl font-bold">
                {student.user.firstName} {student.user.lastName}
              </h2>
              <p className="text-muted-foreground">Admission ID: {student.admissionId}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {student.enrollments[0] && (
                  <>
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {student.enrollments[0].class.name}
                    </span>
                    {student.enrollments[0].section && (
                      <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Section {student.enrollments[0].section.name}
                      </span>
                    )}
                  </>
                )}
                {student.rollNumber && (
                  <span className="inline-flex items-center rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                    Roll No: {student.rollNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <div className="border-b">
          <div className="flex space-x-8">
            <button
              data-state="active"
              className="inline-flex items-center justify-center whitespace-nowrap py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
            >
              Profile Info
            </button>
            <button
              className="inline-flex items-center justify-center whitespace-nowrap py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
            >
              Academic Details
            </button>
            <button
              className="inline-flex items-center justify-center whitespace-nowrap py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
            >
              Change Password
            </button>
          </div>
        </div>

        <TabsContent value="info" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-6 gap-6">
            <div className="md:col-span-4">
              <StudentProfileInfo student={student} />
            </div>
            <div className="md:col-span-2">
              <StudentProfileEdit student={student} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6 mt-6">
          <StudentAcademicDetails student={student} />
        </TabsContent>

        <TabsContent value="password" className="space-y-6 mt-6">
          <div className="max-w-2xl">
            <div className="rounded-lg border bg-card shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Change Your Password</h2>
              <PasswordChangeForm userId={student.userId} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
