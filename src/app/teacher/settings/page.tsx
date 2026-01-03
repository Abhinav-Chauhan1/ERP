import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileEditForm } from "@/components/teacher/settings/profile-edit-form";
import { NotificationPreferences } from "@/components/teacher/settings/notification-preferences";
import { SecuritySettings } from "@/components/teacher/settings/security-settings";
import { AppearanceSettings } from "@/components/shared/settings/appearance-settings";
import { ReminderPreferences } from "@/components/calendar/reminder-preferences";
import { updateSettings } from "@/lib/actions/teacher-settings-actions";
import { AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getTeacherData() {
  const session = await auth();
    const userId = session?.user?.id;

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  const teacher = await db.teacher.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      settings: true,
    },
  });

  if (!teacher) {
    return null;
  }

  // Create default settings if they don't exist
  if (!teacher.settings) {
    const newSettings = await db.teacherSettings.create({
      data: {
        teacherId: teacher.id,
      },
    });
    teacher.settings = newSettings;
  }

  return {
    profile: {
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      email: teacher.user.email,
      phone: teacher.user.phone || "",
      qualification: teacher.qualification || "",
      employeeId: teacher.employeeId,
    },
    settings: teacher.settings,
  };
}

export default async function TeacherSettingsPage() {
  const data = await getTeacherData();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load settings</h2>
        <p className="text-muted-foreground">Unable to retrieve your account information</p>
      </div>
    );
  }

  const { profile, settings } = data;

  // Handler for appearance settings
  const handleAppearanceSave = async (appearanceSettings: {
    theme: string;
    colorTheme: string;
    language: string;
  }) => {
    "use server";
    const result = await updateSettings(appearanceSettings);
    if (!result.success) {
      throw new Error(result.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile" className="space-y-4">
            <ProfileEditForm profile={profile} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationPreferences
              settings={{
                emailNotifications: settings.emailNotifications,
                smsNotifications: settings.smsNotifications,
                pushNotifications: settings.pushNotifications,
                assignmentReminders: settings.assignmentReminders,
                examReminders: settings.examReminders,
                messageNotifications: settings.messageNotifications,
                announcementNotifications: settings.announcementNotifications,
              }}
            />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <ReminderPreferences />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <AppearanceSettings onSave={handleAppearanceSave} />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecuritySettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
