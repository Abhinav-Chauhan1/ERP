"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, UserPlus, Eye, EyeOff, AlertCircle } from "lucide-react";
import type { WizardData } from "../setup-wizard";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminCreationStepProps {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
    onNext: () => void;
    onPrev: () => void;
    skipStep?: () => void;
}

export function AdminCreationStep({
    data,
    updateData,
    onNext,
    onPrev,
    skipStep
}: AdminCreationStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { toast } = useToast();

    const validatePassword = (password: string) => {
        const issues: string[] = [];
        if (password.length < 8) issues.push("at least 8 characters");
        if (!/[A-Z]/.test(password)) issues.push("one uppercase letter");
        if (!/[0-9]/.test(password)) issues.push("one number");
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) issues.push("one special character");
        return issues;
    };

    const validateAndNext = () => {
        const newErrors: Record<string, string> = {};

        if (!data.adminFirstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        if (!data.adminLastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        if (!data.adminEmail.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail)) {
            newErrors.email = "Please enter a valid email";
        }

        const passwordIssues = validatePassword(data.adminPassword);
        if (passwordIssues.length > 0) {
            newErrors.password = `Password must have ${passwordIssues.join(", ")}`;
        }

        if (data.adminPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-green-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">Create Administrator</h2>
                <p className="text-muted-foreground">
                    Set up the primary admin account for your school
                </p>
            </div>

            {skipStep && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        An admin account already exists. You can skip this step or create another admin.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">
                            First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="firstName"
                            placeholder="John"
                            value={data.adminFirstName}
                            onChange={(e) => updateData({ adminFirstName: e.target.value })}
                            className={errors.firstName ? "border-red-500" : ""}
                        />
                        {errors.firstName && (
                            <p className="text-sm text-red-500">{errors.firstName}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">
                            Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="lastName"
                            placeholder="Smith"
                            value={data.adminLastName}
                            onChange={(e) => updateData({ adminLastName: e.target.value })}
                            className={errors.lastName ? "border-red-500" : ""}
                        />
                        {errors.lastName && (
                            <p className="text-sm text-red-500">{errors.lastName}</p>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@school.edu"
                        value={data.adminEmail}
                        onChange={(e) => updateData({ adminEmail: e.target.value })}
                        className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        This will be used to login to the admin dashboard
                    </p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password">
                        Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter a strong password"
                            value={data.adminPassword}
                            onChange={(e) => updateData({ adminPassword: e.target.value })}
                            className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters with uppercase, number, and special character
                    </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                        Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                </div>

                {/* Position & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                            id="position"
                            placeholder="Principal"
                            value={data.adminPosition}
                            onChange={(e) => updateData({ adminPosition: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="adminPhone">Phone</Label>
                        <Input
                            id="adminPhone"
                            placeholder="+91 9876543210"
                            value={data.adminPhone}
                            onChange={(e) => updateData({ adminPhone: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onPrev}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex gap-2">
                    {skipStep && (
                        <Button variant="ghost" onClick={skipStep}>
                            Skip
                        </Button>
                    )}
                    <Button onClick={validateAndNext}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
