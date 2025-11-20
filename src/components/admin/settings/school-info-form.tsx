"use client";

import { useState } from "react";
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
import { School, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateSchoolInfo } from "@/lib/actions/settingsActions";

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
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo & Branding</CardTitle>
          <CardDescription>
            Upload your school logo and customize branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>School Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
                <School className="h-8 w-8 text-gray-400" />
              </div>
              <Button variant="outline">Upload Logo</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Recommended size: 200x200px. Max file size: 2MB
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
