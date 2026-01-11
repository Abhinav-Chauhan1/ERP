"use client";

/**
 * Alumni Communication Preferences Component
 * 
 * Displays and manages communication settings for alumni.
 * Includes toggle switches for preferences and preferred contact method.
 * 
 * Requirements: 7.5
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageSquare, 
  Phone,
  Bell,
  BellOff,
  Save,
  X,
  Edit
} from "lucide-react";
import { toast } from "react-hot-toast";

export interface CommunicationPreferencesData {
  allowCommunication: boolean;
  communicationEmail?: string;
  preferredChannel?: "email" | "sms" | "whatsapp";
  receiveNewsletter?: boolean;
  receiveEventNotifications?: boolean;
  receiveAlumniUpdates?: boolean;
}

interface AlumniCommunicationPreferencesProps {
  data: CommunicationPreferencesData;
  defaultEmail: string;
  defaultPhone?: string;
  isEditable?: boolean;
  onSave?: (updatedData: Partial<CommunicationPreferencesData>) => Promise<void>;
}

export function AlumniCommunicationPreferences({
  data,
  defaultEmail,
  defaultPhone,
  isEditable = false,
  onSave,
}: AlumniCommunicationPreferencesProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<CommunicationPreferencesData>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEdit = () => {
    setIsEditMode(true);
    setFormData(data);
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setFormData(data);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate email if provided
    if (formData.communicationEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.communicationEmail)) {
        newErrors.communicationEmail = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(formData);
      setIsEditMode(false);
      toast.success("Communication preferences updated successfully");
    } catch (error) {
      console.error("Error saving communication preferences:", error);
      toast.error("Failed to update communication preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (field: keyof CommunicationPreferencesData, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof CommunicationPreferencesData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "whatsapp":
        return <Phone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case "email":
        return "Email";
      case "sms":
        return "SMS";
      case "whatsapp":
        return "WhatsApp";
      default:
        return channel;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {data.allowCommunication ? (
              <Bell className="h-5 w-5 text-muted-foreground" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle>Communication Preferences</CardTitle>
          </div>
          {isEditable && !isEditMode && (
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Manage how you want to receive communications from the institution
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditMode ? (
          <div className="space-y-6">
            {/* Master Communication Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="allowCommunication" className="text-base font-medium">
                  Allow Communications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive communications from the institution
                </p>
              </div>
              <Switch
                id="allowCommunication"
                checked={formData.allowCommunication}
                onCheckedChange={(checked) => handleToggle("allowCommunication", checked)}
              />
            </div>

            {formData.allowCommunication && (
              <>
                {/* Communication Email */}
                <div className="space-y-2">
                  <Label htmlFor="communicationEmail">
                    Preferred Email for Communications
                  </Label>
                  <Input
                    id="communicationEmail"
                    type="email"
                    value={formData.communicationEmail || ""}
                    onChange={(e) => handleInputChange("communicationEmail", e.target.value)}
                    placeholder={defaultEmail}
                  />
                  {errors.communicationEmail && (
                    <p className="text-sm text-destructive">{errors.communicationEmail}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Leave blank to use default email: {defaultEmail}
                  </p>
                </div>

                {/* Preferred Channel */}
                <div className="space-y-3">
                  <Label>Preferred Communication Channel</Label>
                  <RadioGroup
                    value={formData.preferredChannel || "email"}
                    onValueChange={(value) => handleInputChange("preferredChannel", value as any)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="channel-email" />
                      <Label htmlFor="channel-email" className="flex items-center gap-2 cursor-pointer">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                    </div>
                    {defaultPhone && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sms" id="channel-sms" />
                          <Label htmlFor="channel-sms" className="flex items-center gap-2 cursor-pointer">
                            <MessageSquare className="h-4 w-4" />
                            SMS
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="whatsapp" id="channel-whatsapp" />
                          <Label htmlFor="channel-whatsapp" className="flex items-center gap-2 cursor-pointer">
                            <Phone className="h-4 w-4" />
                            WhatsApp
                          </Label>
                        </div>
                      </>
                    )}
                  </RadioGroup>
                </div>

                {/* Specific Preferences */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium">Notification Types</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="receiveNewsletter">Newsletter</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive monthly newsletters and updates
                      </p>
                    </div>
                    <Switch
                      id="receiveNewsletter"
                      checked={formData.receiveNewsletter ?? true}
                      onCheckedChange={(checked) => handleToggle("receiveNewsletter", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="receiveEventNotifications">Event Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about upcoming events and reunions
                      </p>
                    </div>
                    <Switch
                      id="receiveEventNotifications"
                      checked={formData.receiveEventNotifications ?? true}
                      onCheckedChange={(checked) => handleToggle("receiveEventNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="receiveAlumniUpdates">Alumni Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about fellow alumni and achievements
                      </p>
                    </div>
                    <Switch
                      id="receiveAlumniUpdates"
                      checked={formData.receiveAlumniUpdates ?? true}
                      onCheckedChange={(checked) => handleToggle("receiveAlumniUpdates", checked)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Communication Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <p className="text-base font-medium">Communication Status</p>
                <p className="text-sm text-muted-foreground">
                  {data.allowCommunication
                    ? "Opted in to receive communications"
                    : "Opted out of communications"}
                </p>
              </div>
              <Badge variant={data.allowCommunication ? "secondary" : "outline"}>
                {data.allowCommunication ? "Active" : "Inactive"}
              </Badge>
            </div>

            {data.allowCommunication && (
              <>
                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span>{data.communicationEmail || defaultEmail}</span>
                    </div>
                    {data.preferredChannel && (
                      <div className="flex items-center gap-2 text-sm">
                        {getChannelIcon(data.preferredChannel)}
                        <span className="font-medium">Preferred Channel:</span>
                        <Badge variant="secondary">
                          {getChannelLabel(data.preferredChannel)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground">Notification Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Newsletter</span>
                      <Badge variant={data.receiveNewsletter !== false ? "secondary" : "outline"}>
                        {data.receiveNewsletter !== false ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Event Notifications</span>
                      <Badge variant={data.receiveEventNotifications !== false ? "secondary" : "outline"}>
                        {data.receiveEventNotifications !== false ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Alumni Updates</span>
                      <Badge variant={data.receiveAlumniUpdates !== false ? "secondary" : "outline"}>
                        {data.receiveAlumniUpdates !== false ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
