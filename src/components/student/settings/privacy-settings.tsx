"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { updatePrivacySettings } from "@/lib/actions/student-settings-actions";
import { toast } from "react-hot-toast";

interface PrivacySettingsProps {
  studentId: string;
  settings: any;
}

export function PrivacySettings({ studentId, settings }: PrivacySettingsProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    profileVisibility: settings?.profileVisibility || "PRIVATE",
    showEmail: settings?.showEmail ?? false,
    showPhone: settings?.showPhone ?? false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updatePrivacySettings({
        studentId,
        ...formData
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update privacy settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control who can see your information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profileVisibility">Profile Visibility</Label>
              <Select
                value={formData.profileVisibility}
                onValueChange={(value) => 
                  setFormData({ ...formData, profileVisibility: value as any })
                }
              >
                <SelectTrigger id="profileVisibility" className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Public</div>
                        <div className="text-xs text-muted-foreground">Everyone can see your profile</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="CLASSMATES_ONLY">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Classmates Only</div>
                        <div className="text-xs text-muted-foreground">Only your classmates can see</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Private</div>
                        <div className="text-xs text-muted-foreground">Only you and teachers can see</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose who can view your profile information
              </p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Contact Information Visibility</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="showEmail">Show Email Address</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your email address
                    </p>
                  </div>
                  <Switch
                    id="showEmail"
                    checked={formData.showEmail}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, showEmail: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="showPhone">Show Phone Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your phone number
                    </p>
                  </div>
                  <Switch
                    id="showPhone"
                    checked={formData.showPhone}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, showPhone: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-blue-900">Privacy Notice</h4>
                    <p className="text-xs text-blue-700">
                      Your personal information is protected and will only be shared according to your preferences. 
                      Teachers and administrators always have access to necessary information for academic purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="min-h-[44px]">
              {loading ? "Saving..." : "Save Privacy Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
