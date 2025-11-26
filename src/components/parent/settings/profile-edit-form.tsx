"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, User, Briefcase, Users, AlertCircle } from "lucide-react";
import { updateProfile } from "@/lib/actions/parent-settings-actions";
import { toast } from "react-hot-toast";

interface ProfileEditFormProps {
  profile: {
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      avatar: string | null;
    };
    occupation: string | null;
    alternatePhone: string | null;
    relation: string | null;
  };
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  occupation?: string;
  relation?: string;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    firstName: profile.user.firstName || "",
    lastName: profile.user.lastName || "",
    email: profile.user.email || "",
    phone: profile.user.phone || "",
    alternatePhone: profile.alternatePhone || "",
    occupation: profile.occupation || "",
    relation: profile.relation || ""
  });

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        if (value.length > 50) return "First name must be less than 50 characters";
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return "First name can only contain letters, spaces, hyphens, and apostrophes";
        break;
      case "lastName":
        if (!value.trim()) return "Last name is required";
        if (value.length > 50) return "Last name must be less than 50 characters";
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Last name can only contain letters, spaces, hyphens, and apostrophes";
        break;
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
        break;
      case "phone":
        if (value && !/^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s()-]/g, ""))) {
          return "Please enter a valid phone number (e.g., +1234567890)";
        }
        break;
      case "alternatePhone":
        if (value && !/^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s()-]/g, ""))) {
          return "Please enter a valid alternate phone number";
        }
        break;
      case "occupation":
        if (value && value.length > 100) return "Occupation must be less than 100 characters";
        break;
      case "relation":
        if (value && value.length > 50) return "Relation must be less than 50 characters";
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate required fields
    const firstNameError = validateField("firstName", formData.firstName);
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateField("lastName", formData.lastName);
    if (lastNameError) newErrors.lastName = lastNameError;
    
    const emailError = validateField("email", formData.email);
    if (emailError) newErrors.email = emailError;
    
    // Validate optional fields if they have values
    if (formData.phone) {
      const phoneError = validateField("phone", formData.phone);
      if (phoneError) newErrors.phone = phoneError;
    }
    
    if (formData.alternatePhone) {
      const alternatePhoneError = validateField("alternatePhone", formData.alternatePhone);
      if (alternatePhoneError) newErrors.alternatePhone = alternatePhoneError;
    }
    
    if (formData.occupation) {
      const occupationError = validateField("occupation", formData.occupation);
      if (occupationError) newErrors.occupation = occupationError;
    }
    
    if (formData.relation) {
      const relationError = validateField("relation", formData.relation);
      if (relationError) newErrors.relation = relationError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (name: string, value: string) => {
    // Update form data
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleBlur = (name: string, value: string) => {
    // Validate field on blur
    const error = validateField(name, value);
    if (error) {
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the errors in the form before submitting");
      return;
    }
    
    setLoading(true);

    try {
      // Clean phone numbers (remove formatting characters)
      const cleanedData = {
        ...formData,
        phone: formData.phone ? formData.phone.replace(/[\s()-]/g, "") : "",
        alternatePhone: formData.alternatePhone ? formData.alternatePhone.replace(/[\s()-]/g, "") : "",
      };
      
      const result = await updateProfile(cleanedData);

      if (result.success) {
        toast.success(result.message || "Your profile has been updated successfully");
        setErrors({}); // Clear all errors on success
      } else {
        toast.error(result.message || "Unable to update your profile. Please try again.");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An unexpected error occurred. Please try again or contact support if the problem persists.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Update your personal and contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFieldChange("firstName", e.target.value)}
                  onBlur={(e) => handleBlur("firstName", e.target.value)}
                  className={`pl-10 ${errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="First name"
                  disabled={loading}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                />
              </div>
              {errors.firstName && (
                <div className="flex items-center gap-1 text-sm text-destructive" id="firstName-error" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{errors.firstName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleFieldChange("lastName", e.target.value)}
                  onBlur={(e) => handleBlur("lastName", e.target.value)}
                  className={`pl-10 ${errors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="Last name"
                  disabled={loading}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                />
              </div>
              {errors.lastName && (
                <div className="flex items-center gap-1 text-sm text-destructive" id="lastName-error" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{errors.lastName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                onBlur={(e) => handleBlur("email", e.target.value)}
                className={`pl-10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                placeholder="your.email@example.com"
                disabled={loading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && (
              <div className="flex items-center gap-1 text-sm text-destructive" id="email-error" role="alert">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Primary Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  onBlur={(e) => handleBlur("phone", e.target.value)}
                  className={`pl-10 ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="+1 (555) 000-0000"
                  disabled={loading}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
              </div>
              {errors.phone && (
                <div className="flex items-center gap-1 text-sm text-destructive" id="phone-error" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternatePhone">Alternate Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="alternatePhone"
                  type="tel"
                  value={formData.alternatePhone}
                  onChange={(e) => handleFieldChange("alternatePhone", e.target.value)}
                  onBlur={(e) => handleBlur("alternatePhone", e.target.value)}
                  className={`pl-10 ${errors.alternatePhone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="+1 (555) 000-0000"
                  disabled={loading}
                  aria-invalid={!!errors.alternatePhone}
                  aria-describedby={errors.alternatePhone ? "alternatePhone-error" : undefined}
                />
              </div>
              {errors.alternatePhone && (
                <div className="flex items-center gap-1 text-sm text-destructive" id="alternatePhone-error" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{errors.alternatePhone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleFieldChange("occupation", e.target.value)}
                  onBlur={(e) => handleBlur("occupation", e.target.value)}
                  className={`pl-10 ${errors.occupation ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="Your occupation"
                  disabled={loading}
                  aria-invalid={!!errors.occupation}
                  aria-describedby={errors.occupation ? "occupation-error" : undefined}
                />
              </div>
              {errors.occupation && (
                <div className="flex items-center gap-1 text-sm text-destructive" id="occupation-error" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{errors.occupation}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="relation">Relation to Student</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="relation"
                  value={formData.relation}
                  onChange={(e) => handleFieldChange("relation", e.target.value)}
                  onBlur={(e) => handleBlur("relation", e.target.value)}
                  className={`pl-10 ${errors.relation ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="e.g., Father, Mother, Guardian"
                  disabled={loading}
                  aria-invalid={!!errors.relation}
                  aria-describedby={errors.relation ? "relation-error" : undefined}
                />
              </div>
              {errors.relation && (
                <div className="flex items-center gap-1 text-sm text-destructive" id="relation-error" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{errors.relation}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
