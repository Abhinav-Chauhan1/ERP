"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Sun, Moon, Monitor, Globe, Calendar, Clock } from "lucide-react";
import { updateAppearanceSettings } from "@/lib/actions/student-settings-actions";
import { toast } from "react-hot-toast";

interface AppearanceSettingsProps {
  studentId: string;
  settings: any;
}

export function AppearanceSettings({ studentId, settings }: AppearanceSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    theme: settings?.theme || "LIGHT",
    language: settings?.language || "en",
    dateFormat: settings?.dateFormat || "MM/DD/YYYY",
    timeFormat: settings?.timeFormat || "TWELVE_HOUR"
  });

  // Sync form data with current theme
  useEffect(() => {
    if (theme) {
      setFormData(prev => ({
        ...prev,
        theme: theme.toUpperCase()
      }));
    }
  }, [theme]);

  const handleThemeChange = (value: string) => {
    // Update local state
    setFormData({ ...formData, theme: value });
    // Apply theme immediately using next-themes
    setTheme(value.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateAppearanceSettings({
        studentId,
        ...formData
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update appearance settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance Settings
        </CardTitle>
        <CardDescription>
          Customize how the portal looks and feels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme" className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Theme
              </Label>
              <Select
                value={formData.theme}
                onValueChange={handleThemeChange}
              >
                <SelectTrigger id="theme" className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIGHT">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="DARK">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="SYSTEM">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System Default
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose your preferred color theme
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value) => 
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger id="language" className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select your preferred language
              </p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Date & Time Format</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Format
                  </Label>
                  <Select
                    value={formData.dateFormat}
                    onValueChange={(value) => 
                      setFormData({ ...formData, dateFormat: value })
                    }
                  >
                    <SelectTrigger id="dateFormat" className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">
                        MM/DD/YYYY (12/31/2024)
                      </SelectItem>
                      <SelectItem value="DD/MM/YYYY">
                        DD/MM/YYYY (31/12/2024)
                      </SelectItem>
                      <SelectItem value="YYYY-MM-DD">
                        YYYY-MM-DD (2024-12-31)
                      </SelectItem>
                      <SelectItem value="DD MMM YYYY">
                        DD MMM YYYY (31 Dec 2024)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeFormat" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Format
                  </Label>
                  <Select
                    value={formData.timeFormat}
                    onValueChange={(value) => 
                      setFormData({ ...formData, timeFormat: value as any })
                    }
                  >
                    <SelectTrigger id="timeFormat" className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TWELVE_HOUR">
                        12-hour (2:30 PM)
                      </SelectItem>
                      <SelectItem value="TWENTY_FOUR_HOUR">
                        24-hour (14:30)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Palette className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-amber-900">Preview Changes</h4>
                    <p className="text-xs text-amber-700">
                      Some appearance changes may require refreshing the page to take full effect.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="min-h-[44px]">
              {loading ? "Saving..." : "Save Appearance Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
