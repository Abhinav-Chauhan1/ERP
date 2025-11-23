export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="container p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-8">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <AccountSettings student={student} settings={settings} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings studentId={student.id} settings={settings} />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacySettings studentId={student.id} settings={settings} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <AppearanceSettings studentId={student.id} settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
