"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface SchoolNotificationSettingsProps {
  schoolId: string;
}

interface NotificationSettings {
  emailNotifications: {
    enabled: boolean;
    adminAlerts: boolean;
    systemUpdates: boolean;
    billingAlerts: boolean;
    usageAlerts: boolean;
  };
  smsNotifications: {
    enabled: boolean;
    criticalAlerts: boolean;
    billingAlerts: boolean;
  };
  whatsappNotifications: {
    enabled: boolean;
    adminAlerts: boolean;
    systemUpdates: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    realTimeAlerts: boolean;
    dailyDigest: boolean;
  };
  alertThresholds: {
    usageWarning: number; // percentage
    usageCritical: number; // percentage
    billingDueDays: number;
  };
  notificationTiming: {
    quietHoursStart: string;
    quietHoursEnd: string;
    timezone: string;
  };
}

const defaultSettings: NotificationSettings = {
  emailNotifications: {
    enabled: true,
    adminAlerts: true,
    systemUpdates: true,
    billingAlerts: true,
    usageAlerts: true,
  },
  smsNotifications: {
    enabled: false,
    criticalAlerts: true,
    billingAlerts: true,
  },
  whatsappNotifications: {
    enabled: false,
    adminAlerts: false,
    systemUpdates: false,
  },
  pushNotifications: {
    enabled: true,
    realTimeAlerts: true,
    dailyDigest: false,
  },
  alertThresholds: {
    usageWarning: 80,
    usageCritical: 95,
    billingDueDays: 7,
  },
  notificationTiming: {
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    timezone: "Asia/Kolkata",
  },
};

export function SchoolNotificationSettings({ schoolId }: SchoolNotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotificationSettings();
  }, [schoolId]);

  const fetchNotificationSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/notification-settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data.settings });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (category: keyof NotificationSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success('Notification settings updated successfully');
      } else {
        throw new Error('Failed to update notification settings');
      }
    } catch (error) {
      toast.error('Failed to update notification settings');
      console.error('Error updating notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure email notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all email notifications
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications.enabled}
              onCheckedChange={(checked) => 
                handleSettingChange('emailNotifications', 'enabled', checked)
              }
            />
          </div>

          {settings.emailNotifications.enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Admin Alerts</Label>
                  <Switch
                    checked={settings.emailNotifications.adminAlerts}
                    onCheckedChange={(checked) => 
                      handleSettingChange('emailNotifications', 'adminAlerts', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>System Updates</Label>
                  <Switch
                    checked={settings.emailNotifications.systemUpdates}
                    onCheckedChange={(checked) => 
                      handleSettingChange('emailNotifications', 'systemUpdates', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Billing Alerts</Label>
                  <Switch
                    checked={settings.emailNotifications.billingAlerts}
                    onCheckedChange={(checked) => 
                      handleSettingChange('emailNotifications', 'billingAlerts', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Usage Alerts</Label>
                  <Switch
                    checked={settings.emailNotifications.usageAlerts}
                    onCheckedChange={(checked) => 
                      handleSettingChange('emailNotifications', 'usageAlerts', checked)
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            Configure SMS notification preferences for critical alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                SMS notifications for critical alerts only
              </p>
            </div>
            <Switch
              checked={settings.smsNotifications.enabled}
              onCheckedChange={(checked) => 
                handleSettingChange('smsNotifications', 'enabled', checked)
              }
            />
          </div>

          {settings.smsNotifications.enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Critical System Alerts</Label>
                  <Switch
                    checked={settings.smsNotifications.criticalAlerts}
                    onCheckedChange={(checked) => 
                      handleSettingChange('smsNotifications', 'criticalAlerts', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Billing Alerts</Label>
                  <Switch
                    checked={settings.smsNotifications.billingAlerts}
                    onCheckedChange={(checked) => 
                      handleSettingChange('smsNotifications', 'billingAlerts', checked)
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Notifications
          </CardTitle>
          <CardDescription>
            Configure WhatsApp notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable WhatsApp Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications via WhatsApp Business API
              </p>
            </div>
            <Switch
              checked={settings.whatsappNotifications.enabled}
              onCheckedChange={(checked) => 
                handleSettingChange('whatsappNotifications', 'enabled', checked)
              }
            />
          </div>

          {settings.whatsappNotifications.enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Admin Alerts</Label>
                  <Switch
                    checked={settings.whatsappNotifications.adminAlerts}
                    onCheckedChange={(checked) => 
                      handleSettingChange('whatsappNotifications', 'adminAlerts', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>System Updates</Label>
                  <Switch
                    checked={settings.whatsappNotifications.systemUpdates}
                    onCheckedChange={(checked) => 
                      handleSettingChange('whatsappNotifications', 'systemUpdates', checked)
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Thresholds
          </CardTitle>
          <CardDescription>
            Configure when to trigger various alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usageWarning">Usage Warning (%)</Label>
              <Input
                id="usageWarning"
                type="number"
                min="0"
                max="100"
                value={settings.alertThresholds.usageWarning}
                onChange={(e) => 
                  handleSettingChange('alertThresholds', 'usageWarning', parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageCritical">Usage Critical (%)</Label>
              <Input
                id="usageCritical"
                type="number"
                min="0"
                max="100"
                value={settings.alertThresholds.usageCritical}
                onChange={(e) => 
                  handleSettingChange('alertThresholds', 'usageCritical', parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingDueDays">Billing Due Alert (days)</Label>
              <Input
                id="billingDueDays"
                type="number"
                min="1"
                max="30"
                value={settings.alertThresholds.billingDueDays}
                onChange={(e) => 
                  handleSettingChange('alertThresholds', 'billingDueDays', parseInt(e.target.value))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Notification Timing
          </CardTitle>
          <CardDescription>
            Configure quiet hours and timezone preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietHoursStart">Quiet Hours Start</Label>
              <Input
                id="quietHoursStart"
                type="time"
                value={settings.notificationTiming.quietHoursStart}
                onChange={(e) => 
                  handleSettingChange('notificationTiming', 'quietHoursStart', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietHoursEnd">Quiet Hours End</Label>
              <Input
                id="quietHoursEnd"
                type="time"
                value={settings.notificationTiming.quietHoursEnd}
                onChange={(e) => 
                  handleSettingChange('notificationTiming', 'quietHoursEnd', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.notificationTiming.timezone}
                onValueChange={(value) => 
                  handleSettingChange('notificationTiming', 'timezone', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Quiet Hours
                </p>
                <p className="text-blue-700 dark:text-blue-200 mt-1">
                  Non-critical notifications will be suppressed during quiet hours. 
                  Critical alerts will still be sent immediately.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}