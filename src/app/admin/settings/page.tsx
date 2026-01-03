"use client";


import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, School, FileText, Bell, Shield, Palette, Loader2, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { getSystemSettings } from "@/lib/actions/settingsActions";
import { SchoolInfoForm } from "@/components/admin/settings/school-info-form";
import { AcademicSettingsForm } from "@/components/admin/settings/academic-settings-form";
import { NotificationSettingsForm } from "@/components/admin/settings/notification-settings-form";
import { SecuritySettingsForm } from "@/components/admin/settings/security-settings-form";
import { AppearanceSettingsForm } from "@/components/admin/settings/appearance-settings-form";
import { TwoFactorSettings } from "@/components/shared/settings/two-factor-settings";
import { ReminderPreferences } from "@/components/calendar/reminder-preferences";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getSystemSettings();
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        toast.error(result.error || "Failed to load settings");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setInitialLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your school's system configuration and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="school" className="space-y-4">
        <TabsList>
          <TabsTrigger value="school">
            <School className="h-4 w-4 mr-2" />
            School Info
          </TabsTrigger>
          <TabsTrigger value="academic">
            <FileText className="h-4 w-4 mr-2" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="reminders">
            <Clock className="h-4 w-4 mr-2" />
            Reminders
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="two-factor">
            <ShieldCheck className="h-4 w-4 mr-2" />
            2FA
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="payment">
            <Settings className="h-4 w-4 mr-2" />
            Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="space-y-4">
          <SchoolInfoForm initialData={settings} />
        </TabsContent>

        <TabsContent value="academic" className="space-y-4">
          <AcademicSettingsForm initialData={settings} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettingsForm initialData={settings} />
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <ReminderPreferences />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecuritySettingsForm initialData={settings} />
        </TabsContent>

        <TabsContent value="two-factor" className="space-y-4">
          <TwoFactorSettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <AppearanceSettingsForm initialData={settings} />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Permission Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage role-based and user-specific permissions for fine-grained access control
                </p>
              </div>
              <Link href="/admin/settings/permissions">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Permissions
                </button>
              </Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Payment Configuration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure payment methods and receipt verification settings for fee collection
                </p>
              </div>
              <Link href="/admin/settings/payment-configuration">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Payment Methods
                </button>
              </Link>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

