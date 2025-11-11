"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Calendar, Clock, DollarSign, CalendarDays, Megaphone } from "lucide-react";
import { updateNotificationSettings } from "@/lib/actions/student-settings-actions";
import { toast } from "react-hot-toast";

interface NotificationSettingsProps {
  studentId: string;
  settings: any;
}

export function NotificationSettings({ studentId, settings }: NotificationSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailNotifications: settings?.emailNotifications ?? true,
    assignmentReminders: settings?.assignmentReminders ?? true,
    examReminders: settings?.examReminders ?? true,
    attendanceAlerts: settings?.attendanceAlerts ?? true,
    feeReminders: settings?.feeReminders ?? true,
    eventNotifications: settings?.eventNotifications ?? true,
    announcementNotifications: settings?.announcementNotifications ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateNotificationSettings({
        studentId,
        ...formData
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update notification settings");
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
      id: "assignmentReminders",
      label: "Assignment Reminders",
      description: "Get reminded about upcoming assignment deadlines",
      icon: Calendar
    },
    {
      id: "examReminders",
      label: "Exam Reminders",
      description: "Receive reminders for upcoming exams",
      icon: Bell
    },
    {
      id: "attendanceAlerts",
      label: "Attendance Alerts",
      description: "Get notified about attendance issues",
      icon: Clock
    },
    {
      id: "feeReminders",
      label: "Fee Reminders",
      description: "Receive reminders for fee payments",
      icon: DollarSign
    },
    {
      id: "eventNotifications",
      label: "Event Notifications",
      description: "Get notified about school events",
      icon: CalendarDays
    },
    {
      id: "announcementNotifications",
      label: "Announcement Notifications",
      description: "Receive school announcements",
      icon: Megaphone
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
          Choose what notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                checked={formData[option.id as keyof typeof formData]}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, [option.id]: checked })
                }
              />
            </div>
          ))}

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
