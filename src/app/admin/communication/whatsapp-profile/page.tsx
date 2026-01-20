"use client";

/**
 * WhatsApp Business Profile Configuration Page
 * 
 * Allows administrators to configure and manage the school's WhatsApp Business profile
 * including name, description, address, profile photo, business hours, and website URL.
 * 
 * Requirements: 20.1, 20.3, 20.4
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Upload, Image as ImageIcon, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
import {
  getWhatsAppBusinessProfile,
  updateWhatsAppBusinessProfile,
  uploadWhatsAppProfilePhoto,
  checkWhatsAppConfigurationAction,
} from "@/lib/actions/whatsappActions";

interface BusinessProfile {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
}

export default function WhatsAppBusinessProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile>({
    about: "",
    address: "",
    description: "",
    email: "",
    websites: [""],
    vertical: "",
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Check if WhatsApp is configured
      const configResult = await checkWhatsAppConfigurationAction();
      if (configResult.success && configResult.data) {
        setConfigured(configResult.data.configured);

        if (!configResult.data.configured) {
          toast.error("WhatsApp Business API is not configured. Please set up environment variables.");
          setLoading(false);
          return;
        }
      }

      // Load existing profile
      const result = await getWhatsAppBusinessProfile();
      if (result.success && result.data) {
        setProfile({
          about: result.data.about || "",
          address: result.data.address || "",
          description: result.data.description || "",
          email: result.data.email || "",
          websites: result.data.websites && result.data.websites.length > 0 ? result.data.websites : [""],
          vertical: result.data.vertical || "",
        });

        if (result.data.profile_picture_url) {
          setProfilePhotoPreview(result.data.profile_picture_url);
        }
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load WhatsApp Business profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BusinessProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWebsiteChange = (index: number, value: string) => {
    const newWebsites = [...(profile.websites || [""])];
    newWebsites[index] = value;
    setProfile(prev => ({
      ...prev,
      websites: newWebsites,
    }));
  };

  const addWebsite = () => {
    setProfile(prev => ({
      ...prev,
      websites: [...(prev.websites || []), ""],
    }));
  };

  const removeWebsite = (index: number) => {
    const newWebsites = [...(profile.websites || [])];
    newWebsites.splice(index, 1);
    setProfile(prev => ({
      ...prev,
      websites: newWebsites.length > 0 ? newWebsites : [""],
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG and PNG images are supported.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setProfilePhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!profilePhotoFile) {
      toast.error("Please select a photo to upload");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', profilePhotoFile);

      const result = await uploadWhatsAppProfilePhoto(formData);

      if (result.success) {
        toast.success("Profile photo uploaded successfully");
        setProfilePhotoFile(null);
        // Reload profile to get updated photo URL
        await loadProfile();
      } else {
        toast.error(result.error || "Failed to upload profile photo");
      }
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload profile photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty websites
      const websites = (profile.websites || []).filter(w => w.trim() !== "");

      const result = await updateWhatsAppBusinessProfile({
        about: profile.about,
        address: profile.address,
        description: profile.description,
        email: profile.email,
        websites: websites.length > 0 ? websites : undefined,
        vertical: profile.vertical,
      });

      if (result.success) {
        toast.success("WhatsApp Business profile updated successfully");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link href="/admin/communication">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Business Profile</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>WhatsApp Not Configured</AlertTitle>
          <AlertDescription>
            WhatsApp Business API is not configured. Please set up the following environment variables:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>WHATSAPP_ACCESS_TOKEN</li>
              <li>WHATSAPP_PHONE_NUMBER_ID</li>
              <li>WHATSAPP_BUSINESS_ACCOUNT_ID</li>
              <li>WHATSAPP_APP_SECRET</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/communication">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">WhatsApp Business Profile</h1>
            <p className="text-sm text-muted-foreground">
              Configure your school's WhatsApp Business profile information
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Configured
        </Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Changes to your WhatsApp Business profile may take a few minutes to reflect. Some fields may require approval from WhatsApp.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>
              Upload a profile photo for your WhatsApp Business account (JPEG or PNG, max 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {/* Photo Preview */}
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {profilePhotoPreview ? (
                  <Image
                    src={profilePhotoPreview}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              {/* File Input */}
              <div className="w-full">
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                    <Upload className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {profilePhotoFile ? profilePhotoFile.name : "Choose a photo"}
                    </span>
                  </div>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </Label>
              </div>

              {/* Upload Button */}
              {profilePhotoFile && (
                <Button
                  onClick={handleUploadPhoto}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              General information about your school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="about">About (Short Description)</Label>
              <Input
                id="about"
                placeholder="e.g., Premier educational institution"
                value={profile.about || ""}
                onChange={(e) => handleInputChange("about", e.target.value)}
                maxLength={139}
              />
              <p className="text-xs text-muted-foreground">
                {(profile.about || "").length}/139 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@school.com"
                value={profile.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vertical">Business Category</Label>
              <Input
                id="vertical"
                placeholder="e.g., Education"
                value={profile.vertical || ""}
                onChange={(e) => handleInputChange("vertical", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detailed Information</CardTitle>
            <CardDescription>
              Additional details about your school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of your school..."
                value={profile.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                maxLength={512}
              />
              <p className="text-xs text-muted-foreground">
                {(profile.description || "").length}/512 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="School address..."
                value={profile.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={3}
                maxLength={256}
              />
              <p className="text-xs text-muted-foreground">
                {(profile.address || "").length}/256 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Websites */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Websites</CardTitle>
            <CardDescription>
              Add up to 2 website URLs for your school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(profile.websites || [""]).map((website, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`website-${index}`}>Website {index + 1}</Label>
                  <Input
                    id={`website-${index}`}
                    type="url"
                    placeholder="https://www.school.com"
                    value={website}
                    onChange={(e) => handleWebsiteChange(index, e.target.value)}
                  />
                </div>
                {(profile.websites || []).length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeWebsite(index)}
                    className="mt-8"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}

            {(profile.websites || []).length < 2 && (
              <Button
                variant="outline"
                onClick={addWebsite}
                className="w-full"
              >
                Add Website
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/communication")}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
