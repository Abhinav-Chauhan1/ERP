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
    // Granular settings
    enrollmentNotificationChannels?: string[];
    paymentNotificationChannels?: string[];
    attendanceNotificationChannels?: string[];
    examResultNotificationChannels?: string[];
    leaveAppNotificationChannels?: string[];
  };
}

const AVAILABLE_CHANNELS = [
  { id: 'EMAIL', label: 'Email', icon: Mail },
  { id: 'SMS', label: 'SMS', icon: Bell },
  { id: 'WHATSAPP', label: 'WhatsApp', icon: Bell }, // Using Bell as placeholder if MessageCircle isn't available
  { id: 'IN_APP', label: 'In-App', icon: Bell },
];

export function NotificationSettingsForm({ initialData }: NotificationSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(initialData.emailEnabled);
  const [smsEnabled, setSmsEnabled] = useState(initialData.smsEnabled);
  const [pushEnabled, setPushEnabled] = useState(initialData.pushEnabled);

  // Legacy toggles (kept for backward compatibility or master switches)
  const [notifyEnrollment, setNotifyEnrollment] = useState(initialData.notifyEnrollment);
  const [notifyPayment, setNotifyPayment] = useState(initialData.notifyPayment);
  const [notifyAttendance, setNotifyAttendance] = useState(initialData.notifyAttendance);
  const [notifyExamResults, setNotifyExamResults] = useState(initialData.notifyExamResults);
  const [notifyLeaveApps, setNotifyLeaveApps] = useState(initialData.notifyLeaveApps);

  // Granular channel states
  const [enrollmentChannels, setEnrollmentChannels] = useState<string[]>(initialData.enrollmentNotificationChannels || ['EMAIL', 'IN_APP']);
  const [paymentChannels, setPaymentChannels] = useState<string[]>(initialData.paymentNotificationChannels || ['EMAIL', 'IN_APP']);
  const [attendanceChannels, setAttendanceChannels] = useState<string[]>(initialData.attendanceNotificationChannels || ['SMS', 'IN_APP']);
  const [examResultChannels, setExamResultChannels] = useState<string[]>(initialData.examResultNotificationChannels || ['EMAIL', 'IN_APP']);
  const [leaveAppChannels, setLeaveAppChannels] = useState<string[]>(initialData.leaveAppNotificationChannels || ['EMAIL', 'IN_APP']);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateNotificationSettings({
        emailEnabled,
        smsEnabled,
        pushEnabled,
        notifyEnrollment,
        notifyPayment,
        notifyAttendance,
        notifyExamResults,
        notifyLeaveApps,
        // Save granular settings
        enrollmentNotificationChannels: enrollmentChannels,
        paymentNotificationChannels: paymentChannels,
        attendanceNotificationChannels: attendanceChannels,
        examResultNotificationChannels: examResultChannels,
        leaveAppNotificationChannels: leaveAppChannels,
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

  const toggleChannel = (
    currentChannels: string[],
    setChannels: (channels: string[]) => void,
    channelId: string
  ) => {
    if (currentChannels.includes(channelId)) {
      setChannels(currentChannels.filter(id => id !== channelId));
    } else {
      setChannels([...currentChannels, channelId]);
    }
  };

  const renderChannelSelector = (
    label: string,
    description: string,
    enabled: boolean,
    setEnabled: (enabled: boolean) => void,
    channels: string[],
    setChannels: (channels: string[]) => void
  ) => (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base font-medium">{label}</Label>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <div className="pl-4 border-l-2 border-muted grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
          {AVAILABLE_CHANNELS.map((channel) => (
            <div key={channel.id} className="flex items-center space-x-2">
              <Switch
                id={`${label}-${channel.id}`}
                checked={channels.includes(channel.id)}
                onCheckedChange={() => toggleChannel(channels, setChannels, channel.id)}
                className="scale-75"
              />
              <Label htmlFor={`${label}-${channel.id}`} className="text-sm cursor-pointer">
                {channel.label}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Global Channel Settings</CardTitle>
          <CardDescription>
            Master switches for communication services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <Label>Email Service</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable/Disable email sending system-wide
              </p>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label>SMS Service</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable/Disable SMS sending system-wide
              </p>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
          </div>
          {/* Push/In-App is usually always enabled, but keeping the switch if needed */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Notification Rules</CardTitle>
          <CardDescription>
            Configure which channels are used for specific events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderChannelSelector(
            "New Student Enrollment",
            "Notify admins when a new student enrolls",
            notifyEnrollment,
            setNotifyEnrollment,
            enrollmentChannels,
            setEnrollmentChannels
          )}

          {renderChannelSelector(
            "Fee Payment Received",
            "Notify when fee payments are received",
            notifyPayment,
            setNotifyPayment,
            paymentChannels,
            setPaymentChannels
          )}

          {renderChannelSelector(
            "Attendance Alerts",
            "Notify parents about student attendance issues",
            notifyAttendance,
            setNotifyAttendance,
            attendanceChannels,
            setAttendanceChannels
          )}

          {renderChannelSelector(
            "Exam Results Published",
            "Notify students and parents when results are published",
            notifyExamResults,
            setNotifyExamResults,
            examResultChannels,
            setExamResultChannels
          )}

          {renderChannelSelector(
            "Leave Applications",
            "Notify admins about new leave applications",
            notifyLeaveApps,
            setNotifyLeaveApps,
            leaveAppChannels,
            setLeaveAppChannels
          )}

          <div className="flex justify-end pt-4">
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
