"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/actions/notificationActions";
import toast from "react-hot-toast";

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notifyOnAnnouncements: boolean;
  notifyOnMessages: boolean;
  notifyOnAssignments: boolean;
  notifyOnGrades: boolean;
  notifyOnAttendance: boolean;
  notifyOnFees: boolean;
  notifyOnEvents: boolean;
  notifyOnSystemUpdates: boolean;
  digestFrequency: string; // INSTANT, DAILY, WEEKLY
}

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notifyOnAnnouncements: true,
    notifyOnMessages: true,
    notifyOnAssignments: true,
    notifyOnGrades: true,
    notifyOnAttendance: true,
    notifyOnFees: true,
    notifyOnEvents: true,
    notifyOnSystemUpdates: true,
    digestFrequency: "INSTANT",
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const result = await getNotificationPreferences();
      if (result.success && result.data) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateNotificationPreferences(preferences);
      if (result.success) {
        toast.success("Notification preferences updated successfully");
      } else {
        toast.error(result.error || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-4">
        {/* Delivery Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Methods</CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleToggle("emailNotifications")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={preferences.pushNotifications}
                onCheckedChange={() => handleToggle("pushNotifications")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via SMS (charges may apply)
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={preferences.smsNotifications}
                onCheckedChange={() => handleToggle("smsNotifications")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Select which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-announcements">Announcements</Label>
                <p className="text-sm text-muted-foreground">
                  School-wide announcements and updates
                </p>
              </div>
              <Switch
                id="notify-announcements"
                checked={preferences.notifyOnAnnouncements}
                onCheckedChange={() => handleToggle("notifyOnAnnouncements")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-messages">Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Direct messages from teachers, parents, or students
                </p>
              </div>
              <Switch
                id="notify-messages"
                checked={preferences.notifyOnMessages}
                onCheckedChange={() => handleToggle("notifyOnMessages")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-assignments">Assignments</Label>
                <p className="text-sm text-muted-foreground">
                  New assignments and submission reminders
                </p>
              </div>
              <Switch
                id="notify-assignments"
                checked={preferences.notifyOnAssignments}
                onCheckedChange={() => handleToggle("notifyOnAssignments")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-grades">Grades & Results</Label>
                <p className="text-sm text-muted-foreground">
                  Exam results and grade updates
                </p>
              </div>
              <Switch
                id="notify-grades"
                checked={preferences.notifyOnGrades}
                onCheckedChange={() => handleToggle("notifyOnGrades")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-attendance">Attendance</Label>
                <p className="text-sm text-muted-foreground">
                  Attendance updates and alerts
                </p>
              </div>
              <Switch
                id="notify-attendance"
                checked={preferences.notifyOnAttendance}
                onCheckedChange={() => handleToggle("notifyOnAttendance")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-fees">Fee Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Fee payment reminders and receipts
                </p>
              </div>
              <Switch
                id="notify-fees"
                checked={preferences.notifyOnFees}
                onCheckedChange={() => handleToggle("notifyOnFees")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-events">Events</Label>
                <p className="text-sm text-muted-foreground">
                  Upcoming events and activities
                </p>
              </div>
              <Switch
                id="notify-events"
                checked={preferences.notifyOnEvents}
                onCheckedChange={() => handleToggle("notifyOnEvents")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-system">System Updates</Label>
                <p className="text-sm text-muted-foreground">
                  System maintenance and feature updates
                </p>
              </div>
              <Switch
                id="notify-system"
                checked={preferences.notifyOnSystemUpdates}
                onCheckedChange={() => handleToggle("notifyOnSystemUpdates")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Digest Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Digest Frequency</CardTitle>
            <CardDescription>
              Choose how often you want to receive notification digests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="digest-frequency">Frequency</Label>
              <Select
                value={preferences.digestFrequency}
                onValueChange={(value) =>
                  setPreferences((prev) => ({ ...prev, digestFrequency: value }))
                }
              >
                <SelectTrigger id="digest-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTANT">Instant (as they happen)</SelectItem>
                  <SelectItem value="DAILY">Daily Digest</SelectItem>
                  <SelectItem value="WEEKLY">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {preferences.digestFrequency === "INSTANT" &&
                  "You'll receive notifications immediately as they occur"}
                {preferences.digestFrequency === "DAILY" &&
                  "You'll receive a daily summary of all notifications"}
                {preferences.digestFrequency === "WEEKLY" &&
                  "You'll receive a weekly summary of all notifications"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

