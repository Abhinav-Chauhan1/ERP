export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/student/settings/account-settings";
import { NotificationSettings } from "@/components/student/settings/notification-settings";
import { PrivacySettings } from "@/components/student/settings/privacy-settings";
import { AppearanceSettings } from "@/components/student/settings/appearance-settings";
import { SecuritySettings } from "@/components/student/settings/security-settings";
import { getStudentSettings } from "@/lib/actions/student-settings-actions";

export const metadata: Metadata = {
  title: "Settings | Student Portal",
  description: "Manage your account settings and preferences",
};

export default async function StudentSettingsPage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
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
    },
    include: {
      user: true
    }
  });

  if (!student) {
    redirect("/student");
  }

  const settings = await getStudentSettings(student.id);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none overflow-x-auto flex-nowrap">
          <TabsTrigger 
            value="account" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs md:text-sm whitespace-nowrap px-3 md:px-4"
          >
            Account
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs md:text-sm whitespace-nowrap px-3 md:px-4"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="privacy" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs md:text-sm whitespace-nowrap px-3 md:px-4"
          >
            Privacy
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs md:text-sm whitespace-nowrap px-3 md:px-4"
          >
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="appearance" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs md:text-sm whitespace-nowrap px-3 md:px-4"
          >
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <AccountSettings student={student} settings={settings} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <NotificationSettings studentId={student.id} settings={settings} />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <PrivacySettings studentId={student.id} settings={settings} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <AppearanceSettings studentId={student.id} settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
