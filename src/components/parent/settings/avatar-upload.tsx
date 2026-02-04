"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, Trash2, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/lib/actions/parent-settings-actions";
import { toast } from "react-hot-toast";

interface AvatarUploadProps {
  currentAvatar: string | null;
  userName: string;
  onAvatarUpdate?: (avatarUrl: string) => void;
}

export function AvatarUpload({ currentAvatar, userName, onAvatarUpdate }: AvatarUploadProps) {
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
      toast.error(`File size (${sizeMB}MB) exceeds the 5MB limit. Please choose a smaller image.`);
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
      toast.error("Unable to read the selected file. Please try again.");
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
      formData.append("file", file);

      const result = await uploadAvatar(formData);

      if (result.success) {
        // This case should not happen currently as upload is disabled
        toast.success(result.message || "Your profile picture has been updated successfully");
        // Handle successful upload when it's re-enabled
        if ('data' in result && result.data && typeof result.data === 'object' && 'avatarUrl' in result.data) {
          const avatarUrl = (result.data as { avatarUrl: string }).avatarUrl;
          setPreview(avatarUrl);
          if (onAvatarUpdate) {
            onAvatarUpdate(avatarUrl);
          }
        }
      } else {
        // Provide specific error message from server or generic fallback
        toast.error(result.message || "Unable to upload your profile picture. Please try again or contact support if the problem persists.");
        // Revert preview on error
        setPreview(currentAvatar);
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("An unexpected error occurred while uploading your profile picture. Please try again.");
      // Revert preview on error
      setPreview(currentAvatar);
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      // Import removeAvatar action
      const { removeAvatar } = await import("@/lib/actions/parent-settings-actions");
      const result = await removeAvatar();
      
      if (result.success) {
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        toast.success("Your profile picture has been removed");
        
        // Call optional callback
        if (onAvatarUpdate) {
          onAvatarUpdate("");
        }
      } else {
        toast.error(result.message || "Unable to remove your profile picture. Please try again.");
      }
    } catch (error) {
      console.error("Avatar removal error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Profile Picture
        </CardTitle>
        <CardDescription>
          Upload a profile picture (Max 5MB, JPEG/PNG/WebP)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar Display */}
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage 
                src={preview || undefined} 
                alt={`${userName}'s profile picture`}
              />
              <AvatarFallback className="text-2xl">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full" aria-live="polite">
                <Loader2 className="h-8 w-8 text-white animate-spin" aria-hidden="true" />
                <span className="sr-only">Uploading avatar...</span>
              </div>
            )}
          </div>

          {/* File Input (Hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload profile picture"
          />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              disabled={loading}
              aria-label={preview ? "Change profile photo" : "Upload profile photo"}
            >
              <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
              {preview ? "Change Photo" : "Upload Photo"}
            </Button>
            
            {preview && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={loading}
                aria-label="Remove profile photo"
              >
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>

          {/* Info Text */}
          <p className="text-xs text-center text-muted-foreground max-w-xs">
            Recommended: Square image, at least 200x200 pixels. 
            Accepted formats: JPEG, PNG, WebP. Maximum size: 5MB.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
