"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useColorTheme } from "@/lib/contexts/theme-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { updateAppearanceSettings } from "@/lib/actions/settingsActions";

interface AppearanceSettingsFormProps {
  initialData: {
    defaultTheme: string;
    defaultColorTheme: string;
    primaryColor: string;
    language: string;
    dateFormat: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
  };
}

export function AppearanceSettingsForm({ initialData }: AppearanceSettingsFormProps) {
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme();
  const { colorTheme: currentColorTheme, setColorTheme: setCurrentColorTheme } = useColorTheme();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState(initialData.defaultTheme || "LIGHT");
  const [colorTheme, setColorTheme] = useState(initialData.defaultColorTheme || "blue");
  const [primaryColor, setPrimaryColor] = useState(initialData.primaryColor || "#3b82f6");
  const [language, setLanguage] = useState(initialData.language || "en");
  const [dateFormat, setDateFormat] = useState(initialData.dateFormat || "mdy");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Apply theme changes immediately
      const themeMap: Record<string, string> = {
        'LIGHT': 'light',
        'DARK': 'dark',
        'SYSTEM': 'system'
      };
      setNextTheme(themeMap[theme] || 'light');
      setCurrentColorTheme(colorTheme as any);
      
      const result = await updateAppearanceSettings({
        defaultTheme: theme,
        defaultColorTheme: colorTheme,
        primaryColor,
        language,
        dateFormat,
      });
      
      if (result.success) {
        toast.success("Appearance settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const colorThemes = [
    { value: "blue", label: "Blue", color: "bg-blue-500" },
    { value: "red", label: "Red", color: "bg-red-500" },
    { value: "green", label: "Green", color: "bg-green-500" },
    { value: "purple", label: "Purple", color: "bg-purple-500" },
    { value: "orange", label: "Orange", color: "bg-orange-500" },
    { value: "teal", label: "Teal", color: "bg-teal-500" },
  ];

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Default Theme Settings</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 animate-pulse bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Default Theme Settings</CardTitle>
          <CardDescription>
            Set default theme preferences for all users (users can override in their settings)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Theme Mode</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LIGHT">Light</SelectItem>
                <SelectItem value="DARK">Dark</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the default theme mode for new users
            </p>
          </div>

          <div className="space-y-2">
            <Label>Default Color Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {colorThemes.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => {
                    setColorTheme(ct.value);
                    // Apply immediately for preview
                    setCurrentColorTheme(ct.value as any);
                  }}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                    colorTheme === ct.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:border-muted"
                  }`}
                >
                  <div className="relative">
                    <div className={`h-12 w-12 rounded-full ${ct.color}`} />
                    {colorTheme === ct.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{ct.label}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Choose the default color scheme for the application (changes apply immediately)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Localization</CardTitle>
          <CardDescription>
            Configure language and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mdy">MM/DD/YYYY (US)</SelectItem>
                <SelectItem value="dmy">DD/MM/YYYY (UK/EU)</SelectItem>
                <SelectItem value="ymd">YYYY-MM-DD (ISO)</SelectItem>
              </SelectContent>
            </Select>
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
