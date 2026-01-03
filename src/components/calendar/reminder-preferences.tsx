'use client';

/**
 * Reminder Preferences Component
 * 
 * Allows users to configure their calendar reminder preferences including:
 * - Default reminder time before events
 * - Reminder notification types (Email, SMS, Push, In-App)
 * 
 * Requirements: 5.1, 5.2
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Smartphone, Loader2 } from 'lucide-react';

interface ReminderPreferences {
  defaultReminderTime: number;
  reminderTypes: string[];
}

const REMINDER_TIME_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
  { value: 10080, label: '1 week before' },
];

const REMINDER_TYPES = [
  { value: 'IN_APP', label: 'In-App Notifications', icon: Bell, description: 'Receive notifications within the application' },
  { value: 'EMAIL', label: 'Email', icon: Mail, description: 'Receive email notifications' },
  { value: 'SMS', label: 'SMS', icon: MessageSquare, description: 'Receive text message notifications' },
  { value: 'PUSH', label: 'Push Notifications', icon: Smartphone, description: 'Receive push notifications on mobile devices' },
];

export function ReminderPreferences() {
  const [preferences, setPreferences] = useState<ReminderPreferences>({
    defaultReminderTime: 1440,
    reminderTypes: ['IN_APP']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');

      const data = await response.json();
      setPreferences({
        defaultReminderTime: data.defaultReminderTime,
        reminderTypes: data.reminderTypes
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reminder preferences',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/calendar/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preferences');
      }

      toast({
        title: 'Success',
        description: 'Reminder preferences saved successfully'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save preferences',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleReminderType = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      reminderTypes: prev.reminderTypes.includes(type)
        ? prev.reminderTypes.filter(t => t !== type)
        : [...prev.reminderTypes, type]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reminder Preferences</CardTitle>
          <CardDescription>Configure how you receive calendar event reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reminder Preferences</CardTitle>
        <CardDescription>Configure how you receive calendar event reminders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Reminder Time */}
        <div className="space-y-2">
          <Label htmlFor="reminder-time">Default Reminder Time</Label>
          <Select
            value={preferences.defaultReminderTime.toString()}
            onValueChange={(value) => setPreferences(prev => ({
              ...prev,
              defaultReminderTime: parseInt(value)
            }))}
          >
            <SelectTrigger id="reminder-time">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_TIME_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            How far in advance you want to be reminded about events
          </p>
        </div>

        {/* Reminder Types */}
        <div className="space-y-4">
          <Label>Notification Methods</Label>
          <div className="space-y-3">
            {REMINDER_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <div key={type.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={type.value}
                    checked={preferences.reminderTypes.includes(type.value)}
                    onCheckedChange={() => toggleReminderType(type.value)}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Label
                        htmlFor={type.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {type.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            Select one or more methods to receive reminders
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || preferences.reminderTypes.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>

        {preferences.reminderTypes.length === 0 && (
          <p className="text-sm text-destructive">
            Please select at least one notification method
          </p>
        )}
      </CardContent>
    </Card>
  );
}
