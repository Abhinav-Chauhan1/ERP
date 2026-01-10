"use client";

import { useState } from "react";
import Image from "next/image";
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
import { ArrowLeft, ArrowRight, Building2, Upload, Loader2, X } from "lucide-react";
import type { WizardData } from "../setup-wizard";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface SchoolDetailsStepProps {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

const TIMEZONES = [
    { value: "Asia/Kolkata", label: "India (IST - UTC+5:30)" },
    { value: "Asia/Dubai", label: "UAE (GST - UTC+4)" },
    { value: "Asia/Singapore", label: "Singapore (SGT - UTC+8)" },
    { value: "America/New_York", label: "US Eastern (EST/EDT)" },
    { value: "America/Los_Angeles", label: "US Pacific (PST/PDT)" },
    { value: "Europe/London", label: "UK (GMT/BST)" },
    { value: "UTC", label: "UTC" },
];

export function SchoolDetailsStep({ data, updateData, onNext, onPrev }: SchoolDetailsStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const { toast } = useToast();

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image file",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Image size should be less than 5MB",
                variant: "destructive",
            });
            return;
        }

        setUploadingLogo(true);
        try {
            const result = await uploadToCloudinary(file, {
                folder: 'school-logos',
                resource_type: 'image',
            });

            updateData({ schoolLogo: result.secure_url });
            toast({
                title: "Success",
                description: "Logo uploaded successfully",
            });
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast({
                title: "Upload failed",
                description: "Failed to upload logo. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleRemoveLogo = () => {
        updateData({ schoolLogo: "" });
        toast({
            title: "Logo removed",
            description: "You can upload a new logo anytime",
        });
    };

    const validateAndNext = () => {
        const newErrors: Record<string, string> = {};

        if (!data.schoolName.trim()) {
            newErrors.schoolName = "School name is required";
        }

        if (!data.schoolEmail.trim()) {
            newErrors.schoolEmail = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.schoolEmail)) {
            newErrors.schoolEmail = "Please enter a valid email";
        }

        if (!data.schoolPhone.trim()) {
            newErrors.schoolPhone = "Phone number is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({
                title: "Please fix the errors",
                description: "Some required fields are missing or invalid",
                variant: "destructive",
            });
            return;
        }

        setErrors({});
        onNext();
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">School Details</h2>
                <p className="text-muted-foreground">
                    Enter your school&apos;s basic information
                </p>
            </div>

            <div className="space-y-4">
                {/* School Name */}
                <div className="space-y-2">
                    <Label htmlFor="schoolName">
                        School Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="schoolName"
                        placeholder="e.g., Springfield High School"
                        value={data.schoolName}
                        onChange={(e) => updateData({ schoolName: e.target.value })}
                        className={errors.schoolName ? "border-red-500" : ""}
                    />
                    {errors.schoolName && (
                        <p className="text-sm text-red-500">{errors.schoolName}</p>
                    )}
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="schoolEmail">
                            Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="schoolEmail"
                            type="email"
                            placeholder="info@school.edu"
                            value={data.schoolEmail}
                            onChange={(e) => updateData({ schoolEmail: e.target.value })}
                            className={errors.schoolEmail ? "border-red-500" : ""}
                        />
                        {errors.schoolEmail && (
                            <p className="text-sm text-red-500">{errors.schoolEmail}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="schoolPhone">
                            Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="schoolPhone"
                            placeholder="+91 9876543210"
                            value={data.schoolPhone}
                            onChange={(e) => updateData({ schoolPhone: e.target.value })}
                            className={errors.schoolPhone ? "border-red-500" : ""}
                        />
                        {errors.schoolPhone && (
                            <p className="text-sm text-red-500">{errors.schoolPhone}</p>
                        )}
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                    <Label htmlFor="schoolAddress">Address</Label>
                    <Textarea
                        id="schoolAddress"
                        placeholder="Full school address..."
                        value={data.schoolAddress}
                        onChange={(e) => updateData({ schoolAddress: e.target.value })}
                        rows={2}
                    />
                </div>

                {/* Website & Timezone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="schoolWebsite">Website</Label>
                        <Input
                            id="schoolWebsite"
                            placeholder="https://school.edu"
                            value={data.schoolWebsite}
                            onChange={(e) => updateData({ schoolWebsite: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                            value={data.timezone}
                            onValueChange={(value) => updateData({ timezone: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONES.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tagline */}
                <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline / Motto</Label>
                    <Input
                        id="tagline"
                        placeholder="e.g., Excellence in Education"
                        value={data.tagline}
                        onChange={(e) => updateData({ tagline: e.target.value })}
                    />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                    <Label>School Logo</Label>

                    {/* Logo Preview */}
                    {data.schoolLogo && (
                        <div className="relative inline-block">
                            <div className="p-4 border rounded-md bg-muted/50">
                                <div className="relative h-24 w-24">
                                    <Image
                                        src={data.schoolLogo}
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
                                disabled={uploadingLogo}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Upload Area */}
                    {!data.schoolLogo && (
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${uploadingLogo
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-primary/50 cursor-pointer"
                                }`}
                            onClick={() => !uploadingLogo && document.getElementById('logoUpload')?.click()}
                        >
                            {uploadingLogo ? (
                                <>
                                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                                    <p className="text-sm text-primary">Uploading logo...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm text-muted-foreground">
                                        Click to upload your school logo
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Max 5MB • JPG, PNG, SVG
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Hidden file input */}
                    <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                    />

                    {/* Manual URL option */}
                    {data.schoolLogo && (
                        <p className="text-xs text-muted-foreground">
                            Logo uploaded successfully. You can change it anytime in Settings.
                        </p>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onPrev}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={validateAndNext} disabled={uploadingLogo}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
