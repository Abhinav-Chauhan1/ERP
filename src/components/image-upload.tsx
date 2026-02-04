"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { R2ImageUpload } from "@/components/upload";
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
    return (
        <R2ImageUpload
            value={value}
            onChange={onChange}
            disabled={disabled}
            folder={folder}
            label={label}
            className={className}
            width={200}
            height={200}
            generateThumbnails={true}
            showUrlInput={true}
        />
    );
}
