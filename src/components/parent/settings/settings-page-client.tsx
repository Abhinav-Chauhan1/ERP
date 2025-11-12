"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileEditForm } from "./profile-edit-form";
import { AvatarUpload } from "./avatar-upload";
import { NotificationPreferences } from "./notification-preferences";
import { SecuritySettings } from "./security-settings";
import { 
  updateProfile, 
  uploadAvatar, 
  updateNotificationPreferences,
  changePassword 
} from "@/lib/actions/parent-settings-actions";
import type { ParentProfileData, ParentSettingsData } from "@/types/settings";
import type { UpdateProfileInput, UpdateNotificationPreferencesInput, ChangePasswordInput } from "@/lib/schemaValidation/parent-settings-schemas";
import { User, Bell, Shield } from "lucide-react";

interface SettingsPageClientProps {
  profile: ParentProfileData;
  settings: ParentSettingsData;
}

export function SettingsPageClient({ profile, settings }: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState("profile");
  
  const handleProfileUpdate = async (data: UpdateProfileInput) => {
    return await updateProfile(data);
  };
  
  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const result = await uploadAvatar(formData);
    
    return {
      success: result.success,
      message: result.message,
      avatarUrl: result.data?.avatarUrl
    };
  };
  
  const handleNotificationUpdate = async (data: UpdateNotificationPreferencesInput) => {
    return await updateNotificationPreferences(data);
  };
  
  const handlePasswordChange = async (data: ChangePasswordInput) => {
    return await changePassword(data);
  };
  
  const userName = `${profile.user.firstName} ${profile.user.lastName}`;
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
        <TabsTrigger value="profile" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center space-x-2">
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <span>Security</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-6">
        <AvatarUpload
          currentAvatar={profile.user.avatar}
          userName={userName}
          onUpload={handleAvatarUpload}
        />
        
        <ProfileEditForm
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
      </TabsContent>
      
      <TabsContent value="notifications">
        <NotificationPreferences
          settings={settings}
          onUpdate={handleNotificationUpdate}
        />
      </TabsContent>
      
      <TabsContent value="security">
        <SecuritySettings
          userId={profile.userId}
          lastPasswordChange={profile.updatedAt}
          onPasswordChange={handlePasswordChange}
        />
      </TabsContent>
    </Tabs>
  );
}
