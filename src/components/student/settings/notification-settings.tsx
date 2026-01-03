"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, Calendar, Clock, DollarSign, CalendarDays, Megaphone, Phone } from "lucide-react";
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
    announcementNotifications: settings?.announcementNotifications ?? true,
    whatsappNotifications: settings?.whatsappNotifications ?? false,
    whatsappOptIn: settings?.whatsappOptIn ?? false,
    preferredLanguage: settings?.preferredLanguage ?? "en"
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
    },
    {
      id: "whatsappNotifications",
      label: "WhatsApp Notifications",
      description: "Receive notifications via WhatsApp",
      icon: Phone
    }
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
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
            <div key={option.id} className="flex items-start justify-between space-x-4 py-4 border-b last:border-0">
              <div className="flex items-start space-x-3 flex-1">
                <div className="bg-primary/10 p-2 rounded-lg mt-1">
                  <option.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <Label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
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

          {/* WhatsApp Opt-in */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-sm font-medium">Communication Preferences</h3>
            
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">Preferred Language</Label>
              <Select
                value={formData.preferredLanguage}
                onValueChange={(value) => 
                  setFormData({ ...formData, preferredLanguage: value })
                }
              >
                <SelectTrigger 
                  id="preferredLanguage"
                  aria-label="Select preferred language for notifications"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                  <SelectItem value="mr">Marathi (मराठी)</SelectItem>
                  <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                  <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                  <SelectItem value="bn">Bengali (বাংলা)</SelectItem>
                  <SelectItem value="gu">Gujarati (ગુજરાતી)</SelectItem>
                  <SelectItem value="kn">Kannada (ಕನ್ನಡ)</SelectItem>
                  <SelectItem value="ml">Malayalam (മലയാളം)</SelectItem>
                  <SelectItem value="pa">Punjabi (ਪੰਜਾਬੀ)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose your preferred language for notifications and messages
              </p>
            </div>
            
            <div className="flex items-start justify-between space-x-4 py-3 border-b">
              <div className="flex items-start space-x-3 flex-1">
                <div className="bg-primary/10 p-2 rounded-lg mt-1" aria-hidden="true">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <Label htmlFor="whatsappOptIn" className="text-sm font-medium cursor-pointer">
                    WhatsApp Opt-in
                  </Label>
                  <p className="text-sm text-muted-foreground" id="whatsappOptIn-description">
                    Consent to receive messages via WhatsApp
                  </p>
                </div>
              </div>
              <Switch
                id="whatsappOptIn"
                checked={formData.whatsappOptIn}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, whatsappOptIn: checked })
                }
                aria-label="WhatsApp Opt-in"
                aria-describedby="whatsappOptIn-description"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="min-h-[44px]">
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
