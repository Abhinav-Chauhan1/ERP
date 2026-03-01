"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useColorTheme } from "@/lib/contexts/theme-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Check } from "lucide-react";

const colorThemes = [
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "purple", label: "Purple", color: "bg-teal-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
  { value: "teal", label: "Teal", color: "bg-teal-500" },
] as const;

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese" },
] as const;

interface AppearanceSettingsProps {
  onSave?: (settings: { theme: string; colorTheme: string; language: string }) => Promise<void>;
}

export function AppearanceSettings({ onSave }: AppearanceSettingsProps) {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();
  const [selectedTheme, setSelectedTheme] = useState<string>("system");
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>("blue");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSelectedTheme(theme || "system");
    setSelectedColorTheme(colorTheme);
    
    // Load language from localStorage
    const savedLanguage = localStorage.getItem("language") || "en";
    setSelectedLanguage(savedLanguage);
  }, [theme, colorTheme]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Apply theme changes
      setTheme(selectedTheme);
      setColorTheme(selectedColorTheme as any);
      
      // Save language to localStorage
      localStorage.setItem("language", selectedLanguage);

      // Call optional onSave callback for server-side persistence
      if (onSave) {
        await onSave({
          theme: selectedTheme,
          colorTheme: selectedColorTheme,
          language: selectedLanguage,
        });
      }

      toast.success("Appearance settings saved successfully");
    } catch (error) {
      console.error("Failed to save appearance settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the application looks for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="h-32 animate-pulse bg-muted rounded" />
            <div className="h-32 animate-pulse bg-muted rounded" />
            <div className="h-20 animate-pulse bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the application looks for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Mode Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Theme Mode</Label>
          <RadioGroup
            value={selectedTheme}
            onValueChange={setSelectedTheme}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem
                value="light"
                id="light"
                className="peer sr-only"
              />
              <Label
                htmlFor="light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-3 h-6 w-6"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
                Light
              </Label>
            </div>
            <div>
              <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
              <Label
                htmlFor="dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-3 h-6 w-6"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
                Dark
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="system"
                id="system"
                className="peer sr-only"
              />
              <Label
                htmlFor="system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-3 h-6 w-6"
                >
                  <rect width="20" height="14" x="2" y="3" rx="2" />
                  <line x1="8" x2="16" y1="21" y2="21" />
                  <line x1="12" x2="12" y1="17" y2="21" />
                </svg>
                System
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Color Theme Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Color Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {colorThemes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setSelectedColorTheme(theme.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors hover:bg-accent ${
                  selectedColorTheme === theme.value
                    ? "border-primary"
                    : "border-muted"
                }`}
              >
                <div className="relative">
                  <div className={`h-12 w-12 rounded-full ${theme.color}`} />
                  {selectedColorTheme === theme.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <Label htmlFor="language" className="text-base font-semibold">
            Language
          </Label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
