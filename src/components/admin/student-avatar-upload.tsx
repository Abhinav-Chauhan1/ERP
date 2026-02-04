"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, Trash2, Loader2 } from "lucide-react";
import { uploadStudentAvatar, removeStudentAvatar } from "@/lib/actions/studentActions";
import toast from "react-hot-toast";

interface StudentAvatarUploadProps {
    studentId: string;
    currentAvatar: string | null;
    studentName: string;
    onSuccess?: (avatarUrl: string | null) => void;
}

export function StudentAvatarUpload({
    studentId,
    currentAvatar,
    studentName,
    onSuccess,
}: StudentAvatarUploadProps) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentAvatar);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getInitials = (name: string) => {
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            toast.error(`File size (${sizeMB}MB) exceeds the 5MB limit.`);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            const fileExtension = file.name.split('.').pop()?.toUpperCase() || "unknown";
            toast.error(`File type ${fileExtension} is not supported. Please upload a JPEG, PNG, or WebP image.`);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.onerror = () => {
            toast.error("Unable to read the selected file.");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };
        reader.readAsDataURL(file);

        // Upload file
        handleUpload(file);
    };

    const handleUpload = async (file: File) => {
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("studentId", studentId);
            formData.append("avatar", file);

            const result = await uploadStudentAvatar(formData);

            if (result.success && result.data && result.data.avatar) {
                toast.success(result.message || "Student photo updated successfully");
                setPreview(result.data.avatar);
                onSuccess?.(result.data.avatar);
            } else {
                toast.error(result.message || "Failed to upload photo");
                setPreview(currentAvatar);
            }
        } catch (error) {
            console.error("Avatar upload error:", error);
            toast.error("An unexpected error occurred while uploading the photo.");
            setPreview(currentAvatar);
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        try {
            const result = await removeStudentAvatar(studentId);

            if (result.success) {
                setPreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                toast.success("Student photo removed successfully");
                onSuccess?.(null);
            } else {
                toast.error(result.message || "Failed to remove photo");
            }
        } catch (error) {
            console.error("Avatar removal error:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            {/* Avatar Display */}
            <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage
                        src={preview || undefined}
                        alt={`${studentName}'s profile photo`}
                    />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {getInitials(studentName)}
                    </AvatarFallback>
                </Avatar>
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                )}
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-primary rounded-full shadow-md">
                    <Camera className="h-4 w-4 text-primary-foreground" />
                </div>
            </div>

            {/* File Input (Hidden) */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload student photo"
            />

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleButtonClick}
                    disabled={loading}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    {preview ? "Change Photo" : "Upload Photo"}
                </Button>

                {preview && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemove}
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                    </Button>
                )}
            </div>

            {/* Info Text */}
            <p className="text-xs text-center text-muted-foreground">
                Max 5MB, JPEG/PNG/WebP
            </p>
        </div>
    );
}
