"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadToCloudinary } from "@/lib/cloudinary";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    folder?: string;
    label?: string;
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    disabled,
    folder = "events",
    label,
    className
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setIsUploading(true);
        try {
            const result = await uploadToCloudinary(file, {
                folder,
                resource_type: "image",
            });

            onChange(result.secure_url);
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const onRemove = () => {
        onChange("");
    };

    return (
        <div className={cn("space-y-4 w-full", className)}>
            {label && <Label>{label}</Label>}
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative w-[200px] h-[200px] rounded-md overflow-hidden border">
                        <div className="z-10 absolute top-2 right-2">
                            <Button
                                type="button"
                                onClick={onRemove}
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6"
                                disabled={disabled || isUploading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            fill
                            className="object-cover"
                            alt="Uploaded image"
                            src={value}
                            unoptimized
                        />
                    </div>
                ) : (
                    <div
                        className={cn(
                            "w-[200px] h-[200px] rounded-md border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 bg-muted/50 transition hover:bg-muted/80 cursor-pointer",
                            (disabled || isUploading) && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !disabled && !isUploading && document.getElementById("image-upload-input")?.click()}
                    >
                        {isUploading ? (
                            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <Upload className="h-10 w-10 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground font-medium">Click to upload</span>
                            </>
                        )}
                        <Input
                            id="image-upload-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={disabled || isUploading}
                        />
                    </div>
                )}
            </div>

            {/* Manual URL entry as fallback */}
            <div className="space-y-2">
                <Label htmlFor="image-url" className="text-xs text-muted-foreground">
                    Or paste image URL
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="image-url"
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled || isUploading}
                        placeholder="https://example.com/image.png"
                        className="text-sm"
                    />
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Recommended size: 800x400px. Max size: 5MB.
            </p>
        </div>
    );
}
