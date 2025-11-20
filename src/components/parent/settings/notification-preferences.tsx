"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, MessageSquare, DollarSign, Clock, FileText, Megaphone, Calendar } from "lucide-react";
import { updateNotificationPreferences } from "@/lib/actions/parent-settings-actions";
import { toast } from "react-hot-toast";

interface NotificationPreferencesProps {
  settings: {
    id: string;
    parentId: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    feeReminders: boolean;
    attendanceAlerts: boolean;
    examResultNotifications: boolean;
    announcementNotifications: boolean;
    meetingReminders: boolean;
    preferredContactMethod: string;
    notificationFrequency: string;
  };
}

export function NotificationPreferences({ settings }: NotificationPreferencesProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailNotifications: settings.emailNotifications,
    smsNotifications: settings.smsNotifications,
    pushNotifications: settings.pushNotifications,
    feeReminders: settings.feeReminders,
    attendanceAlerts: settings.attendanceAlerts,
    examResultNotifications: settings.examResultNotifications,
    announcementNotifications: settings.announcementNotifications,
    meetingReminders: settings.meetingReminders,
    preferredContactMethod: settings.preferredContactMethod,
    notificationFrequency: settings.notificationFrequency
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateNotificationPreferences({
        ...formData,
        preferredContactMethod: formData.preferredContactMethod as "EMAIL" | "SMS" | "BOTH",
        notificationFrequency: formData.notificationFrequency as "IMMEDIATE" | "DAILY_DIGEST" | "WEEKLY_DIGEST"
      });

      if (result.success) {
        toast.success(result.message || "Notification preferences updated successfully");
      } else {
        toast.error(result.message || "Failed to update notification preferences");
      }
    } catch (error) {
      console.error("Notification preferences update error:", error);
      toast.error("Failed to update notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const notificationOptions = [
    {
      id: "emailNotifications",
      label: "Email Notifications",
      description: "Receive notifications via email",
      icon: Mail
    },
    {
      id: "smsNotifications",
      label: "SMS Notifications",
      description: "Receive notifications via text message",
      icon: MessageSquare
    },
    {
      id: "pushNotifications",
      label: "Push Notifications",
      description: "Receive push notifications in the app",
      icon: Bell
    },
    {
      id: "feeReminders",
      label: "Fee Reminders",
      description: "Get reminded about upcoming fee payments",
      icon: DollarSign
    },
    {
      id: "attendanceAlerts",
      label: "Attendance Alerts",
      description: "Get notified about your child's attendance",
      icon: Clock
    },
    {
      id: "examResultNotifications",
      label: "Exam Result Notifications",
      description: "Receive notifications when exam results are published",
      icon: FileText
    },
    {
      id: "announcementNotifications",
      label: "Announcement Notifications",
      description: "Receive school announcements",
      icon: Megaphone
    },
    {
      id: "meetingReminders",
      label: "Meeting Reminders",
      description: "Get reminded about scheduled parent-teacher meetings",
      icon: Calendar
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose what notifications you want to receive and how
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Types */}
          <div className="space-y-4">
            {notificationOptions.map((option) => (
              <div key={option.id} className="flex items-start justify-between space-x-4 py-3 border-b last:border-0">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="bg-blue-50 p-2 rounded-lg mt-1">
                    <option.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={option.id}
                  checked={formData[option.id as keyof typeof formData] as boolean}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, [option.id]: checked })
                  }
                />
              </div>
            ))}
          </div>

          {/* Communication Preferences */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-sm font-medium">Communication Preferences</h3>
            
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
              <Select
                value={formData.preferredContactMethod}
                onValueChange={(value) => 
                  setFormData({ ...formData, preferredContactMethod: value })
                }
              >
                <SelectTrigger id="preferredContactMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email Only</SelectItem>
                  <SelectItem value="SMS">SMS Only</SelectItem>
                  <SelectItem value="BOTH">Both Email and SMS</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose your preferred method for important communications
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationFrequency">Notification Frequency</Label>
              <Select
                value={formData.notificationFrequency}
                onValueChange={(value) => 
                  setFormData({ ...formData, notificationFrequency: value })
                }
              >
                <SelectTrigger id="notificationFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                  <SelectItem value="DAILY_DIGEST">Daily Digest</SelectItem>
                  <SelectItem value="WEEKLY_DIGEST">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose how often you want to receive notifications
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
