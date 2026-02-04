"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileEditForm } from "./profile-edit-form";
import { AvatarUpload } from "./avatar-upload";
import { NotificationPreferences } from "./notification-preferences";
import { SecuritySettings } from "./security-settings";
import { AppearanceSettings } from "@/components/shared/settings/appearance-settings";
import { ReminderPreferences } from "@/components/calendar/reminder-preferences";
import type { ParentProfileData, ParentSettingsData } from "@/types/settings";
import { User, Bell, Shield, Palette, Clock } from "lucide-react";

interface SettingsPageClientProps {
  profile: ParentProfileData;
  settings: ParentSettingsData;
}

export function SettingsPageClient({ profile, settings }: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState("profile");
  
  const userName = `${profile.user.firstName} ${profile.user.lastName}`;
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
        <TabsTrigger value="profile" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center space-x-2">
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="reminders" className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Reminders</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <span>Security</span>
        </TabsTrigger>
        <TabsTrigger value="appearance" className="flex items-center space-x-2">
          <Palette className="h-4 w-4" />
          <span>Appearance</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-6">
        <AvatarUpload
          currentAvatar={profile.user.avatar}
          userName={userName}
        />
        
        <ProfileEditForm profile={profile} />
      </TabsContent>
      
      <TabsContent value="notifications">
        <NotificationPreferences settings={settings} schoolId={settings.schoolId} />
      </TabsContent>
      
      <TabsContent value="reminders">
        <ReminderPreferences />
      </TabsContent>
      
      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>
      
      <TabsContent value="appearance">
        <AppearanceSettings />
      </TabsContent>
    </Tabs>
  );
}
