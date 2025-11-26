export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { SettingsPageClient } from "@/components/parent/settings/settings-page-client";
import { getSettings } from "@/lib/actions/parent-settings-actions";

export const metadata = {
  title: "Settings | Parent Portal",
  description: "Manage your profile, notifications, and security settings",
};

export default async function ParentSettingsPage() {
  // Get current user
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get database user
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    },
    include: {
      parent: true
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT || !dbUser.parent) {
    redirect("/login");
  }
  
  // Fetch settings data
  const settingsResult = await getSettings();
  
  if (!settingsResult.success || !settingsResult.data) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">
            Failed to load settings. Please try again later.
          </p>
        </div>
      </div>
    );
  }
  
  const { profile, settings } = settingsResult.data;
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, notifications, and security preferences
        </p>
      </div>
      
      <SettingsPageClient 
        profile={profile}
        settings={settings}
      />
    </div>
  );
}
