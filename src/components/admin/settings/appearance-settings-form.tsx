"use client";


import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useColorTheme } from "@/lib/contexts/theme-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { updateAppearanceSettings } from "@/lib/actions/settingsActions";
import { R2UploadWidget } from "@/components/upload/r2-upload-widget";

interface AppearanceSettingsFormProps {
  initialData: {
    defaultTheme: string;
    defaultColorTheme: string;
    primaryColor: string;
    secondaryColor?: string | null;
    accentColor?: string | null;
    language: string;
    dateFormat: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    emailLogo?: string | null;
    emailFooter?: string | null;
    emailSignature?: string | null;
    letterheadLogo?: string | null;
    letterheadText?: string | null;
    documentFooter?: string | null;
  };
}

export function AppearanceSettingsForm({ initialData }: AppearanceSettingsFormProps) {
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme();
  const { colorTheme: currentColorTheme, setColorTheme: setCurrentColorTheme } = useColorTheme();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingEmailLogo, setUploadingEmailLogo] = useState(false);
  const [uploadingLetterheadLogo, setUploadingLetterheadLogo] = useState(false);
  const [theme, setTheme] = useState(initialData.defaultTheme || "LIGHT");
  const [colorTheme, setColorTheme] = useState(initialData.defaultColorTheme || "blue");
  const [primaryColor, setPrimaryColor] = useState(initialData.primaryColor || "#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState(initialData.secondaryColor || "#8b5cf6");
  const [accentColor, setAccentColor] = useState(initialData.accentColor || "");
  const [language, setLanguage] = useState(initialData.language || "en");
  const [dateFormat, setDateFormat] = useState(initialData.dateFormat || "mdy");
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(initialData.faviconUrl || "");
  const [emailLogo, setEmailLogo] = useState(initialData.emailLogo || "");
  const [emailFooter, setEmailFooter] = useState(initialData.emailFooter || "");
  const [emailSignature, setEmailSignature] = useState(initialData.emailSignature || "");
  const [letterheadLogo, setLetterheadLogo] = useState(initialData.letterheadLogo || "");
  const [letterheadText, setLetterheadText] = useState(initialData.letterheadText || "");
  const [documentFooter, setDocumentFooter] = useState(initialData.documentFooter || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageUpload = async (
    file: File,
    folder: string,
    setter: (url: string) => void,
    loadingSetter: (loading: boolean) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    loadingSetter(true);
    try {
      // Upload image to R2 storage using R2 upload widget
      // This has been integrated with the R2 storage service
      console.warn("Image upload temporarily disabled during migration to R2 storage");
      toast.error("Image upload temporarily disabled during migration to R2 storage");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      loadingSetter(false);
    }
  };

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
        secondaryColor,
        accentColor: accentColor || undefined,
        language,
        dateFormat,
        logoUrl: logoUrl || undefined,
        faviconUrl: faviconUrl || undefined,
        emailLogo: emailLogo || undefined,
        emailFooter: emailFooter || undefined,
        emailSignature: emailSignature || undefined,
        letterheadLogo: letterheadLogo || undefined,
        letterheadText: letterheadText || undefined,
        documentFooter: documentFooter || undefined,
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
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors ${colorTheme === ct.value
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>
            Customize your school's brand colors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={accentColor || "#000000"}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logos & Icons</CardTitle>
          <CardDescription>
            Upload or configure logos and icons for different contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Logo */}
          <div className="space-y-2">
            <Label>Main Logo</Label>
            {logoUrl && (
              <div className="relative inline-block">
                <div className="p-4 border rounded-md bg-muted/50">
                  <div className="relative h-20 w-48">
                    <Image src={logoUrl} alt="Logo" fill className="object-contain" sizes="192px" />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setLogoUrl("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="logoUpload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'logos', setLogoUrl, setUploadingLogo);
                }}
                disabled={uploadingLogo || loading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('logoUpload')?.click()}
                disabled={uploadingLogo || loading}
              >
                {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload
              </Button>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or enter URL"
                disabled={uploadingLogo || loading}
              />
            </div>
          </div>

          {/* Favicon */}
          <div className="space-y-2">
            <Label>Favicon</Label>
            {faviconUrl && (
              <div className="relative inline-block">
                <div className="p-4 border rounded-md bg-muted/50">
                  <div className="relative h-8 w-8">
                    <Image src={faviconUrl} alt="Favicon" fill className="object-contain" sizes="32px" />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setFaviconUrl("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="faviconUpload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'favicons', setFaviconUrl, setUploadingFavicon);
                }}
                disabled={uploadingFavicon || loading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('faviconUpload')?.click()}
                disabled={uploadingFavicon || loading}
              >
                {uploadingFavicon ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload
              </Button>
              <Input
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="Or enter URL"
                disabled={uploadingFavicon || loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Branding</CardTitle>
          <CardDescription>
            Customize how your emails appear
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Logo</Label>
            {emailLogo && (
              <div className="relative inline-block">
                <div className="p-4 border rounded-md bg-muted/50">
                  <div className="relative h-16 w-40">
                    <Image src={emailLogo} alt="Email Logo" fill className="object-contain" sizes="160px" />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setEmailLogo("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="emailLogoUpload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'email-logos', setEmailLogo, setUploadingEmailLogo);
                }}
                disabled={uploadingEmailLogo || loading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('emailLogoUpload')?.click()}
                disabled={uploadingEmailLogo || loading}
              >
                {uploadingEmailLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload
              </Button>
              <Input
                value={emailLogo}
                onChange={(e) => setEmailLogo(e.target.value)}
                placeholder="Or enter URL"
                disabled={uploadingEmailLogo || loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailFooter">Email Footer</Label>
            <Textarea
              id="emailFooter"
              value={emailFooter}
              onChange={(e) => setEmailFooter(e.target.value)}
              placeholder="Footer text for all emails"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailSignature">Email Signature</Label>
            <Textarea
              id="emailSignature"
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
              placeholder="Email signature"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Branding</CardTitle>
          <CardDescription>
            Customize letterheads and document footers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Letterhead Logo</Label>
            {letterheadLogo && (
              <div className="relative inline-block">
                <div className="p-4 border rounded-md bg-muted/50">
                  <div className="relative h-16 w-40">
                    <Image src={letterheadLogo} alt="Letterhead Logo" fill className="object-contain" sizes="160px" />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setLetterheadLogo("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="letterheadLogoUpload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'letterhead-logos', setLetterheadLogo, setUploadingLetterheadLogo);
                }}
                disabled={uploadingLetterheadLogo || loading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('letterheadLogoUpload')?.click()}
                disabled={uploadingLetterheadLogo || loading}
              >
                {uploadingLetterheadLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload
              </Button>
              <Input
                value={letterheadLogo}
                onChange={(e) => setLetterheadLogo(e.target.value)}
                placeholder="Or enter URL"
                disabled={uploadingLetterheadLogo || loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="letterheadText">Letterhead Text</Label>
            <Textarea
              id="letterheadText"
              value={letterheadText}
              onChange={(e) => setLetterheadText(e.target.value)}
              placeholder="Text to appear on letterhead"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentFooter">Document Footer</Label>
            <Textarea
              id="documentFooter"
              value={documentFooter}
              onChange={(e) => setDocumentFooter(e.target.value)}
              placeholder="Footer text for all documents"
              rows={3}
            />
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
