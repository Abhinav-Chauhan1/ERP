"use client";

import { useState } from "react";
import Image from "next/image";
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
import { School, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateSchoolInfo } from "@/lib/actions/settingsActions";
import { R2UploadWidget, type UploadResult } from "@/components/upload/r2-upload-widget";

interface SchoolInfoFormProps {
  initialData: {
    schoolName: string;
    schoolEmail?: string | null;
    schoolPhone?: string | null;
    schoolAddress?: string | null;
    schoolWebsite?: string | null;
    schoolFax?: string | null;
    timezone: string;
    schoolLogo?: string | null;
    tagline?: string | null;
    facebookUrl?: string | null;
    twitterUrl?: string | null;
    linkedinUrl?: string | null;
    instagramUrl?: string | null;
    affiliationNumber?: string | null;
    schoolCode?: string | null;
    board?: string | null;
  };
}

export function SchoolInfoForm({ initialData }: SchoolInfoFormProps) {
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState(initialData.schoolName || "");
  const [schoolEmail, setSchoolEmail] = useState(initialData.schoolEmail || "");
  const [schoolPhone, setSchoolPhone] = useState(initialData.schoolPhone || "");
  const [schoolAddress, setSchoolAddress] = useState(initialData.schoolAddress || "");
  const [schoolWebsite, setSchoolWebsite] = useState(initialData.schoolWebsite || "");
  const [schoolFax, setSchoolFax] = useState(initialData.schoolFax || "");
  const [timezone, setTimezone] = useState(initialData.timezone || "UTC");
  const [schoolLogo, setSchoolLogo] = useState(initialData.schoolLogo || "");
  const [tagline, setTagline] = useState(initialData.tagline || "");
  const [facebookUrl, setFacebookUrl] = useState(initialData.facebookUrl || "");
  const [twitterUrl, setTwitterUrl] = useState(initialData.twitterUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialData.linkedinUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(initialData.instagramUrl || "");
  const [affiliationNumber, setAffiliationNumber] = useState(initialData.affiliationNumber || "");
  const [schoolCode, setSchoolCode] = useState(initialData.schoolCode || "");
  const [board, setBoard] = useState(initialData.board || "CBSE");

  const handleLogoUpload = async (result: UploadResult) => {
    if (result.success && result.url) {
      setSchoolLogo(result.url);
      toast.success("Logo uploaded successfully");
    } else {
      toast.error(result.error || "Failed to upload logo");
    }
  };

  const handleLogoError = (error: string) => {
    console.error("Error uploading logo:", error);
    toast.error(`Failed to upload logo: ${error}`);
  };

  const handleRemoveLogo = () => {
    setSchoolLogo("");
    toast.success("Logo removed");
  };

  const handleSave = async () => {
    // Validation
    if (!schoolName.trim()) {
      toast.error("School name is required");
      return;
    }

    if (schoolEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const result = await updateSchoolInfo({
        schoolName: schoolName.trim(),
        schoolEmail: schoolEmail || undefined,
        schoolPhone: schoolPhone || undefined,
        schoolAddress: schoolAddress || undefined,
        schoolWebsite: schoolWebsite || undefined,
        schoolFax: schoolFax || undefined,
        timezone,
        schoolLogo: schoolLogo || undefined,
        tagline: tagline || undefined,
        facebookUrl: facebookUrl || undefined,
        twitterUrl: twitterUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        instagramUrl: instagramUrl || undefined,
        affiliationNumber: affiliationNumber || undefined,
        schoolCode: schoolCode || undefined,
        board: board || undefined,
      });

      if (result.success) {
        toast.success("School information saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving school info:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>
            Basic information about your educational institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name *</Label>
              <Input
                id="schoolName"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter school name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline / Motto</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Enter school tagline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolEmail">Email Address</Label>
              <Input
                id="schoolEmail"
                type="email"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                placeholder="school@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolPhone">Phone Number</Label>
              <Input
                id="schoolPhone"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolAddress">Address</Label>
            <Textarea
              id="schoolAddress"
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
              placeholder="Enter school address"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
          <CardDescription>
            Board affiliation and school codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="board">School Board</Label>
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger id="board">
                  <SelectValue placeholder="Select Board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBSE">CBSE</SelectItem>
                  <SelectItem value="ICSE">ICSE</SelectItem>
                  <SelectItem value="STATE">State Board</SelectItem>
                  <SelectItem value="IB">IB</SelectItem>
                  <SelectItem value="CAMBRIDGE">Cambridge</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliationNumber">Affiliation Number</Label>
              <Input
                id="affiliationNumber"
                value={affiliationNumber}
                onChange={(e) => setAffiliationNumber(e.target.value)}
                placeholder="e.g. 1030123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolCode">School Code</Label>
              <Input
                id="schoolCode"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                placeholder="e.g. 50123"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Additional contact details for communication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={schoolWebsite}
                onChange={(e) => setSchoolWebsite(e.target.value)}
                placeholder="https://www.school.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fax">Fax Number</Label>
              <Input
                id="fax"
                value={schoolFax}
                onChange={(e) => setSchoolFax(e.target.value)}
                placeholder="+1 234 567 8901"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo & Branding</CardTitle>
          <CardDescription>
            Upload your school logo or provide a URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>School Logo</Label>

            {/* Logo Preview */}
            {schoolLogo && (
              <div className="relative inline-block">
                <div className="p-4 border rounded-md bg-muted/50">
                  <div className="relative h-32 w-32">
                    <Image
                      src={schoolLogo}
                      alt="School logo"
                      fill
                      className="object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveLogo}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* R2 Upload Widget */}
            <R2UploadWidget
              onSuccess={handleLogoUpload}
              onError={handleLogoError}
              maxFiles={1}
              accept={['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']}
              maxSize={5 * 1024 * 1024} // 5MB
              folder="logos"
              category="image"
              generateThumbnails={true}
              disabled={loading}
              multiple={false}
              uploadText="Upload School Logo"
              descriptionText="Click or drag and drop your school logo here"
              showPreviews={true}
            />

            {/* Manual URL Input */}
            <div className="space-y-2">
              <Label htmlFor="schoolLogo" className="text-sm text-muted-foreground">
                Or enter logo URL manually
              </Label>
              <Input
                id="schoolLogo"
                value={schoolLogo}
                onChange={(e) => setSchoolLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                disabled={loading}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Recommended size: 200x200px. Max file size: 5MB. Supported formats: JPG, PNG, SVG, WebP
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            Connect your school's social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input
                id="facebookUrl"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/yourschool"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitterUrl">Twitter URL</Label>
              <Input
                id="twitterUrl"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://twitter.com/yourschool"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/company/yourschool"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourschool"
              />
            </div>
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
