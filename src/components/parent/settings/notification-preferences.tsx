"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { updateNotificationPreferencesSchema, type UpdateNotificationPreferencesInput } from "@/lib/schemaValidation/parent-settings-schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Bell, Mail, MessageSquare, DollarSign, Calendar, GraduationCap, Megaphone } from "lucide-react";
import type { ParentSettingsData } from "@/types/settings";

interface NotificationPreferencesProps {
  settings: ParentSettingsData;
  onUpdate: (data: UpdateNotificationPreferencesInput) => Promise<{ success: boolean; message?: string }>;
}

export function NotificationPreferences({ settings, onUpdate }: NotificationPreferencesProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<UpdateNotificationPreferencesInput>({
    resolver: zodResolver(updateNotificationPreferencesSchema),
    defaultValues: {
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
      pushNotifications: settings.pushNotifications,
      feeReminders: settings.feeReminders,
      attendanceAlerts: settings.attendanceAlerts,
      examResultNotifications: settings.examResultNotifications,
      announcementNotifications: settings.announcementNotifications,
      meetingReminders: settings.meetingReminders,
      preferredContactMethod: settings.preferredContactMethod,
      notificationFrequency: settings.notificationFrequency,
    },
  });

  const onSubmit = async (values: UpdateNotificationPreferencesInput) => {
    setIsLoading(true);
    
    try {
      const result = await onUpdate(values);
      
      if (result.success) {
        toast.success(result.message || "Notification preferences updated successfully");
      } else {
        toast.error(result.message || "Failed to update notification preferences");
      }
    } catch (error) {
      toast.error("Failed to update notification preferences");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Notification Channels */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Notification Channels</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="emailNotifications" className="cursor-pointer">
                  Email Notifications
                </Label>
              </div>
              <Controller
                name="emailNotifications"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="emailNotifications"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="smsNotifications" className="cursor-pointer">
                  SMS Notifications
                </Label>
              </div>
              <Controller
                name="smsNotifications"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="smsNotifications"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="pushNotifications" className="cursor-pointer">
                  Push Notifications
                </Label>
              </div>
              <Controller
                name="pushNotifications"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="pushNotifications"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Notification Types</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="feeReminders" className="cursor-pointer">
                  Fee Reminders
                </Label>
              </div>
              <Controller
                name="feeReminders"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="feeReminders"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="attendanceAlerts" className="cursor-pointer">
                  Attendance Alerts
                </Label>
              </div>
              <Controller
                name="attendanceAlerts"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="attendanceAlerts"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="examResultNotifications" className="cursor-pointer">
                  Exam Result Notifications
                </Label>
              </div>
              <Controller
                name="examResultNotifications"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="examResultNotifications"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="announcementNotifications" className="cursor-pointer">
                  Announcement Notifications
                </Label>
              </div>
              <Controller
                name="announcementNotifications"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="announcementNotifications"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="meetingReminders" className="cursor-pointer">
                  Meeting Reminders
                </Label>
              </div>
              <Controller
                name="meetingReminders"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="meetingReminders"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          {/* Communication Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Communication Preferences</h3>
            
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
              <Controller
                name="preferredContactMethod"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="preferredContactMethod">
                      <SelectValue placeholder="Select contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationFrequency">Notification Frequency</Label>
              <Controller
                name="notificationFrequency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="notificationFrequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                      <SelectItem value="DAILY_DIGEST">Daily Digest</SelectItem>
                      <SelectItem value="WEEKLY_DIGEST">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading || !isDirty}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
