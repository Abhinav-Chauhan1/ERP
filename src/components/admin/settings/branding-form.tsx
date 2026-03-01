"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SchoolSettings } from "@prisma/client";
import Image from "next/image";
import { updateSchoolInfo, updateAppearanceSettings } from "@/lib/actions/settingsActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ColorThemeToggle } from "@/components/ui/color-theme-toggle";

interface BrandingFormProps {
  initialData: SchoolSettings | null;
}

export default function BrandingForm({ initialData }: BrandingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: initialData?.schoolName || "",
    tagline: initialData?.tagline || "",
    logo: initialData?.schoolLogo || "",
    favicon: initialData?.faviconUrl || "",
    primaryColor: initialData?.primaryColor || "#3b82f6",
    secondaryColor: initialData?.secondaryColor || "#14b8a6",
    accentColor: initialData?.accentColor || "",
    emailLogo: initialData?.emailLogo || "",
    emailFooter: initialData?.emailFooter || "",
    emailSignature: initialData?.emailSignature || "",
    letterheadLogo: initialData?.letterheadLogo || "",
    letterheadText: initialData?.letterheadText || "",
    documentFooter: initialData?.documentFooter || "",
    address: initialData?.schoolAddress || "",
    phone: initialData?.schoolPhone || "",
    email: initialData?.schoolEmail || "",
    website: initialData?.schoolWebsite || "",
    facebookUrl: initialData?.facebookUrl || "",
    twitterUrl: initialData?.twitterUrl || "",
    linkedinUrl: initialData?.linkedinUrl || "",
    instagramUrl: initialData?.instagramUrl || "",
    fax: initialData?.schoolFax || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update school info
      const schoolInfoResult = await updateSchoolInfo({
        schoolName: formData.schoolName,
        schoolEmail: formData.email || undefined,
        schoolPhone: formData.phone || undefined,
        schoolAddress: formData.address || undefined,
        schoolWebsite: formData.website || undefined,
        schoolLogo: formData.logo || undefined,
        schoolFax: formData.fax || undefined,
        tagline: formData.tagline || undefined,
        timezone: initialData?.timezone || "UTC",
        facebookUrl: formData.facebookUrl || undefined,
        twitterUrl: formData.twitterUrl || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        instagramUrl: formData.instagramUrl || undefined,
      });

      // Update appearance settings
      const appearanceResult = await updateAppearanceSettings({
        defaultTheme: initialData?.defaultTheme || "LIGHT",
        defaultColorTheme: initialData?.defaultColorTheme || "blue",
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor || undefined,
        language: initialData?.language || "en",
        dateFormat: initialData?.dateFormat || "mdy",
        logoUrl: formData.logo || undefined,
        faviconUrl: formData.favicon || undefined,
        emailLogo: formData.emailLogo || undefined,
        emailFooter: formData.emailFooter || undefined,
        emailSignature: formData.emailSignature || undefined,
        letterheadLogo: formData.letterheadLogo || undefined,
        letterheadText: formData.letterheadText || undefined,
        documentFooter: formData.documentFooter || undefined,
      });

      if (schoolInfoResult.success && appearanceResult.success) {
        toast({
          title: "Success",
          description: "School branding updated successfully",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: schoolInfoResult.error || appearanceResult.error || "Failed to update branding",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name *</Label>
            <Input
              id="schoolName"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              required
              placeholder="Enter school name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              placeholder="Enter school tagline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <div className="flex gap-2">
              <Input
                id="logo"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {formData.logo && (
              <div className="relative mt-2 h-16 w-48">
                <Image
                  src={formData.logo}
                  alt="Logo preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon">Favicon URL</Label>
            <div className="flex gap-2">
              <Input
                id="favicon"
                name="favicon"
                value={formData.favicon}
                onChange={handleChange}
                placeholder="https://example.com/favicon.ico"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4 mt-4">
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Theme Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose your preferred theme mode and color scheme
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label>Theme Mode:</Label>
                  <ThemeToggle />
                </div>
                <div className="flex items-center gap-2">
                  <Label>Color Theme:</Label>
                  <ColorThemeToggle />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                name="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={handleChange}
                className="w-20 h-10"
              />
              <Input
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                name="secondaryColor"
                type="color"
                value={formData.secondaryColor}
                onChange={handleChange}
                className="w-20 h-10"
              />
              <Input
                value={formData.secondaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))
                }
                placeholder="#14b8a6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="accentColor"
                name="accentColor"
                type="color"
                value={formData.accentColor || "#000000"}
                onChange={handleChange}
                className="w-20 h-10"
              />
              <Input
                value={formData.accentColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                placeholder="#000000"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="emailLogo">Email Logo URL</Label>
            <Input
              id="emailLogo"
              name="emailLogo"
              value={formData.emailLogo}
              onChange={handleChange}
              placeholder="https://example.com/email-logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailFooter">Email Footer</Label>
            <Textarea
              id="emailFooter"
              name="emailFooter"
              value={formData.emailFooter}
              onChange={handleChange}
              placeholder="Footer text for all emails"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailSignature">Email Signature</Label>
            <Textarea
              id="emailSignature"
              name="emailSignature"
              value={formData.emailSignature}
              onChange={handleChange}
              placeholder="Email signature"
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="letterheadLogo">Letterhead Logo URL</Label>
            <Input
              id="letterheadLogo"
              name="letterheadLogo"
              value={formData.letterheadLogo}
              onChange={handleChange}
              placeholder="https://example.com/letterhead-logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="letterheadText">Letterhead Text</Label>
            <Textarea
              id="letterheadText"
              name="letterheadText"
              value={formData.letterheadText}
              onChange={handleChange}
              placeholder="Text to appear on letterhead"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentFooter">Document Footer</Label>
            <Textarea
              id="documentFooter"
              name="documentFooter"
              value={formData.documentFooter}
              onChange={handleChange}
              placeholder="Footer text for all documents"
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="School address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">Fax</Label>
              <Input
                id="fax"
                name="fax"
                value={formData.fax}
                onChange={handleChange}
                placeholder="+1 234 567 8901"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="info@school.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://www.school.com"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Social Media</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook</Label>
                <Input
                  id="facebookUrl"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleChange}
                  placeholder="https://facebook.com/school"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitterUrl">Twitter</Label>
                <Input
                  id="twitterUrl"
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleChange}
                  placeholder="https://twitter.com/school"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/company/school"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram</Label>
                <Input
                  id="instagramUrl"
                  name="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={handleChange}
                  placeholder="https://instagram.com/school"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
