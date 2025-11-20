"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { updateSettings } from "@/lib/actions/teacher-settings-actions";
import { Loader2, Bell, Mail, MessageSquare, Megaphone, Calendar, FileText } from "lucide-react";

interface NotificationPreferencesProps {
  settings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    assignmentReminders: boolean;
    examReminders: boolean;
    messageNotifications: boolean;
    announcementNotifications: boolean;
  };
}

export function NotificationPreferences({ settings }: NotificationPreferencesProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferences, setPreferences] = useState(settings);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateSettings(preferences);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update notification preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">General Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="emailNotifications" className="cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="emailNotifications"
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleToggle("emailNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="smsNotifications" className="cursor-pointer">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
              </div>
              <Switch
                id="smsNotifications"
                checked={preferences.smsNotifications}
                onCheckedChange={() => handleToggle("smsNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="pushNotifications" className="cursor-pointer">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in browser
                  </p>
                </div>
              </div>
              <Switch
                id="pushNotifications"
                checked={preferences.pushNotifications}
                onCheckedChange={() => handleToggle("pushNotifications")}
              />
            </div>
          </div>

          {/* Specific Notifications */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Specific Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="assignmentReminders" className="cursor-pointer">
                    Assignment Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for assignment deadlines
                  </p>
                </div>
              </div>
              <Switch
                id="assignmentReminders"
                checked={preferences.assignmentReminders}
                onCheckedChange={() => handleToggle("assignmentReminders")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="examReminders" className="cursor-pointer">
                    Exam Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for upcoming exams
                  </p>
                </div>
              </div>
              <Switch
                id="examReminders"
                checked={preferences.examReminders}
                onCheckedChange={() => handleToggle("examReminders")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="messageNotifications" className="cursor-pointer">
                    Message Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new messages
                  </p>
                </div>
              </div>
              <Switch
                id="messageNotifications"
                checked={preferences.messageNotifications}
                onCheckedChange={() => handleToggle("messageNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="announcementNotifications" className="cursor-pointer">
                    Announcement Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new announcements
                  </p>
                </div>
              </div>
              <Switch
                id="announcementNotifications"
                checked={preferences.announcementNotifications}
                onCheckedChange={() => handleToggle("announcementNotifications")}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
