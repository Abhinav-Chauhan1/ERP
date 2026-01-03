"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, MessageSquare, DollarSign, Clock, FileText, Megaphone, Calendar, Phone } from "lucide-react";
import { updateNotificationPreferences } from "@/lib/actions/parent-settings-actions";
import { toast } from "react-hot-toast";

interface NotificationPreferencesProps {
  settings: {
    id: string;
    parentId: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    whatsappNotifications: boolean;
    feeReminders: boolean;
    attendanceAlerts: boolean;
    examResultNotifications: boolean;
    announcementNotifications: boolean;
    meetingReminders: boolean;
    preferredContactMethod: string;
    notificationFrequency: string;
    whatsappOptIn: boolean;
    whatsappNumber: string | null;
    preferredLanguage: string;
  };
}

export function NotificationPreferences({ settings }: NotificationPreferencesProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailNotifications: settings.emailNotifications,
    smsNotifications: settings.smsNotifications,
    pushNotifications: settings.pushNotifications,
    whatsappNotifications: settings.whatsappNotifications,
    feeReminders: settings.feeReminders,
    attendanceAlerts: settings.attendanceAlerts,
    examResultNotifications: settings.examResultNotifications,
    announcementNotifications: settings.announcementNotifications,
    meetingReminders: settings.meetingReminders,
    preferredContactMethod: settings.preferredContactMethod,
    notificationFrequency: settings.notificationFrequency,
    whatsappOptIn: settings.whatsappOptIn,
    whatsappNumber: settings.whatsappNumber || "",
    preferredLanguage: settings.preferredLanguage || "en"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate WhatsApp number if WhatsApp is selected as contact method
      const contactMethod = formData.preferredContactMethod;
      const whatsappSelected = contactMethod === "WHATSAPP" || 
                               contactMethod === "EMAIL_AND_WHATSAPP" || 
                               contactMethod === "SMS_AND_WHATSAPP" || 
                               contactMethod === "ALL";
      
      if (whatsappSelected && !formData.whatsappNumber) {
        toast.error("Please provide a WhatsApp number when selecting WhatsApp as a contact method");
        setLoading(false);
        return;
      }

      const result = await updateNotificationPreferences({
        ...formData,
        preferredContactMethod: formData.preferredContactMethod as any,
        notificationFrequency: formData.notificationFrequency as "IMMEDIATE" | "DAILY_DIGEST" | "WEEKLY_DIGEST",
        whatsappNumber: formData.whatsappNumber || null,
        preferredLanguage: formData.preferredLanguage
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
      id: "whatsappNotifications",
      label: "WhatsApp Notifications",
      description: "Receive notifications via WhatsApp",
      icon: Phone
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
                  <div className="bg-primary/10 p-2 rounded-lg mt-1" aria-hidden="true">
                    <option.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground" id={`${option.id}-description`}>
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
                  aria-label={option.label}
                  aria-describedby={`${option.id}-description`}
                />
              </div>
            ))}
          </div>

          {/* WhatsApp Opt-in and Number */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-sm font-medium">WhatsApp Settings</h3>
            
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

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                type="tel"
                placeholder="+919876543210"
                value={formData.whatsappNumber}
                onChange={(e) => 
                  setFormData({ ...formData, whatsappNumber: e.target.value })
                }
                aria-label="WhatsApp number"
                aria-describedby="whatsappNumber-description"
              />
              <p className="text-xs text-muted-foreground" id="whatsappNumber-description">
                Enter your WhatsApp number with country code (e.g., +91 for India)
              </p>
            </div>
          </div>

          {/* Communication Preferences */}
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
            
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
              <Select
                value={formData.preferredContactMethod}
                onValueChange={(value) => 
                  setFormData({ ...formData, preferredContactMethod: value })
                }
              >
                <SelectTrigger 
                  id="preferredContactMethod"
                  aria-label="Select preferred contact method"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email Only</SelectItem>
                  <SelectItem value="SMS">SMS Only</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp Only</SelectItem>
                  <SelectItem value="EMAIL_AND_SMS">Email and SMS</SelectItem>
                  <SelectItem value="EMAIL_AND_WHATSAPP">Email and WhatsApp</SelectItem>
                  <SelectItem value="SMS_AND_WHATSAPP">SMS and WhatsApp</SelectItem>
                  <SelectItem value="ALL">All Methods</SelectItem>
                  <SelectItem value="BOTH">Both Email and SMS (Legacy)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
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
                <SelectTrigger 
                  id="notificationFrequency"
                  aria-label="Select notification frequency"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                  <SelectItem value="DAILY_DIGEST">Daily Digest</SelectItem>
                  <SelectItem value="WEEKLY_DIGEST">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
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
