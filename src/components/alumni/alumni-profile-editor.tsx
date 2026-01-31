"use client";

/**
 * Alumni Profile Editor Component
 * 
 * Self-service profile editor for alumni users to update their information.
 * Includes form validation, photo upload, and restricts editing to allowed fields.
 * 
 * Requirements: 12.3, 12.4
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, User, AlertCircle, CheckCircle2 } from "lucide-react";

// ============================================================================
// Validation Schema
// ============================================================================

const alumniProfileEditorSchema = z.object({
  // Current Employment
  currentOccupation: z.string().optional(),
  currentEmployer: z.string().optional(),
  currentJobTitle: z.string().optional(),

  // Contact Information
  currentPhone: z.string().optional(),
  currentEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  
  // Address
  currentAddress: z.string().optional(),
  currentCity: z.string().optional(),
  currentState: z.string().optional(),
  currentCountry: z.string().optional(),

  // Higher Education
  higherEducation: z.string().optional(),
  collegeName: z.string().optional(),
  collegeLocation: z.string().optional(),
  graduationYearCollege: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal("")),

  // Professional
  linkedInProfile: z.string().url("Invalid URL").optional().or(z.literal("")),
  
  // Achievements (as comma-separated string, will be converted to array)
  achievements: z.string().optional(),

  // Communication Preferences
  allowCommunication: z.boolean().default(true),
  communicationEmail: z.string().email("Invalid email address").optional().or(z.literal("")),

  // Profile Photo URL (uploaded separately)
  profilePhoto: z.string().optional(),
});

type AlumniProfileEditorFormData = z.infer<typeof alumniProfileEditorSchema>;

// ============================================================================
// Types
// ============================================================================

export interface AlumniProfileEditorProps {
  alumniId: string;
  initialData: {
    studentName: string;
    admissionId: string;
    graduationDate: Date;
    finalClass: string;
    finalSection: string;
    currentOccupation?: string;
    currentEmployer?: string;
    currentJobTitle?: string;
    currentPhone?: string;
    currentEmail?: string | null;
    currentAddress?: string;
    currentCity?: string;
    currentState?: string;
    currentCountry?: string;
    higherEducation?: string;
    collegeName?: string;
    collegeLocation?: string;
    graduationYearCollege?: number;
    achievements?: string[];
    linkedInProfile?: string;
    profilePhoto?: string;
    allowCommunication: boolean;
    communicationEmail?: string;
  };
  onSave: (data: AlumniProfileEditorFormData) => Promise<{ success: boolean; error?: string }>;
  onPhotoUpload?: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
}

// ============================================================================
// Component
// ============================================================================

export function AlumniProfileEditor({
  alumniId,
  initialData,
  onSave,
  onPhotoUpload,
}: AlumniProfileEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(initialData.profilePhoto);

  // Initialize form with default values
  const form = useForm<AlumniProfileEditorFormData>({
    resolver: zodResolver(alumniProfileEditorSchema),
    defaultValues: {
      currentOccupation: initialData.currentOccupation || "",
      currentEmployer: initialData.currentEmployer || "",
      currentJobTitle: initialData.currentJobTitle || "",
      currentPhone: initialData.currentPhone || "",
      currentEmail: initialData.currentEmail || "",
      currentAddress: initialData.currentAddress || "",
      currentCity: initialData.currentCity || "",
      currentState: initialData.currentState || "",
      currentCountry: initialData.currentCountry || "India",
      higherEducation: initialData.higherEducation || "",
      collegeName: initialData.collegeName || "",
      collegeLocation: initialData.collegeLocation || "",
      graduationYearCollege: initialData.graduationYearCollege || ("" as any),
      linkedInProfile: initialData.linkedInProfile || "",
      achievements: initialData.achievements?.join(", ") || "",
      allowCommunication: initialData.allowCommunication,
      communicationEmail: initialData.communicationEmail || "",
      profilePhoto: initialData.profilePhoto || "",
    },
  });

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onPhotoUpload) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSubmitStatus({
        type: "error",
        message: "Please upload an image file",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSubmitStatus({
        type: "error",
        message: "Image size must be less than 5MB",
      });
      return;
    }

    setIsUploadingPhoto(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const result = await onPhotoUpload(file);
      
      if (result.success && result.url) {
        setPhotoPreview(result.url);
        form.setValue("profilePhoto", result.url);
        setSubmitStatus({
          type: "success",
          message: "Photo uploaded successfully",
        });
      } else {
        setSubmitStatus({
          type: "error",
          message: result.error || "Failed to upload photo",
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "An error occurred while uploading photo",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: AlumniProfileEditorFormData) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Convert achievements string to array
      const formattedData = {
        ...data,
        achievements: data.achievements
          ? data.achievements.split(",").map((a) => a.trim()).filter(Boolean)
          : undefined,
      };

      const result = await onSave(formattedData as any);

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message: "Profile updated successfully!",
        });
      } else {
        setSubmitStatus({
          type: "error",
          message: result.error || "Failed to update profile",
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "An error occurred while updating profile",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {submitStatus.type && (
        <Alert variant={submitStatus.type === "error" ? "destructive" : "default"}>
          {submitStatus.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{submitStatus.message}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Photo Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>
                Upload a professional photo to help classmates recognize you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoPreview} alt={initialData.studentName} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(initialData.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingPhoto || !onPhotoUpload}
                        asChild
                      >
                        <span>
                          {isUploadingPhoto ? (
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
                        </span>
                      </Button>
                    </div>
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto || !onPhotoUpload}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Read-Only Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                This information cannot be changed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{initialData.studentName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Admission ID</Label>
                  <p className="font-medium">{initialData.admissionId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Graduation Date</Label>
                  <p className="font-medium">
                    {new Date(initialData.graduationDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Final Class</Label>
                  <p className="font-medium">
                    {initialData.finalClass} {initialData.finalSection}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Employment */}
          <Card>
            <CardHeader>
              <CardTitle>Current Employment</CardTitle>
              <CardDescription>
                Share your current professional information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="currentOccupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Software Engineer, Teacher, Doctor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentEmployer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentJobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Your position" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="linkedInProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update your contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currentAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Your current address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="currentCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Higher Education */}
          <Card>
            <CardHeader>
              <CardTitle>Higher Education</CardTitle>
              <CardDescription>
                Share your college and university details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="higherEducation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree/Program</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bachelor of Engineering, MBA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="collegeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College/University Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Institution name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collegeLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="graduationYearCollege"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Graduation Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="YYYY"
                        min="1950"
                        max="2100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements & Awards</CardTitle>
              <CardDescription>
                Share your accomplishments and recognitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="achievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Achievements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter achievements separated by commas (e.g., Best Employee 2023, Published Research Paper, Marathon Finisher)"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Separate multiple achievements with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Communication Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Communication Preferences</CardTitle>
              <CardDescription>
                Manage how the school can contact you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="allowCommunication"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Allow Communications
                      </FormLabel>
                      <FormDescription>
                        Receive updates, newsletters, and event invitations from the school
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="communicationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Email for Communications</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="preferred.email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave blank to use your primary email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
