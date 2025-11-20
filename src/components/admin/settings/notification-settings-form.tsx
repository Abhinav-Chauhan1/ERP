"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail, Bell, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateNotificationSettings } from "@/lib/actions/settingsActions";

interface NotificationSettingsFormProps {
  initialData: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    notifyEnrollment: boolean;
    notifyPayment: boolean;
    notifyAttendance: boolean;
    notifyExamResults: boolean;
    notifyLeaveApps: boolean;
  };
}

export function NotificationSettingsForm({ initialData }: NotificationSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(initialData.emailEnabled);
  const [smsNotifications, setSmsNotifications] = useState(initialData.smsEnabled);
  const [pushNotifications, setPushNotifications] = useState(initialData.pushEnabled);
  const [notifyEnrollment, setNotifyEnrollment] = useState(initialData.notifyEnrollment);
  const [notifyPayment, setNotifyPayment] = useState(initialData.notifyPayment);
  const [notifyAttendance, setNotifyAttendance] = useState(initialData.notifyAttendance);
  const [notifyExamResults, setNotifyExamResults] = useState(initialData.notifyExamResults);
  const [notifyLeaveApps, setNotifyLeaveApps] = useState(initialData.notifyLeaveApps);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateNotificationSettings({
        emailEnabled: emailNotifications,
        smsEnabled: smsNotifications,
        pushEnabled: pushNotifications,
        notifyEnrollment,
        notifyPayment,
        notifyAttendance,
        notifyExamResults,
        notifyLeaveApps,
      });
      
      if (result.success) {
        toast.success("Notification settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Enable or disable notification delivery methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <Label>Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Send notifications via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label>SMS Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Send notifications via SMS (requires SMS gateway)
              </p>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label>Push Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Send push notifications in browser
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Events</CardTitle>
          <CardDescription>
            Choose which events trigger system-wide notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Student Enrollment</Label>
              <p className="text-sm text-muted-foreground">
                Notify admins when a new student enrolls
              </p>
            </div>
            <Switch checked={notifyEnrollment} onCheckedChange={setNotifyEnrollment} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Fee Payment Received</Label>
              <p className="text-sm text-muted-foreground">
                Notify when fee payments are received
              </p>
            </div>
            <Switch checked={notifyPayment} onCheckedChange={setNotifyPayment} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Attendance Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify parents about student attendance issues
              </p>
            </div>
            <Switch checked={notifyAttendance} onCheckedChange={setNotifyAttendance} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exam Results Published</Label>
              <p className="text-sm text-muted-foreground">
                Notify students and parents when results are published
              </p>
            </div>
            <Switch checked={notifyExamResults} onCheckedChange={setNotifyExamResults} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Leave Applications</Label>
              <p className="text-sm text-muted-foreground">
                Notify admins about new leave applications
              </p>
            </div>
            <Switch checked={notifyLeaveApps} onCheckedChange={setNotifyLeaveApps} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
