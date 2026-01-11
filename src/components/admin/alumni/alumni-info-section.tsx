"use client";

/**
 * Alumni Info Section Component
 * 
 * Displays editable sections for different alumni information categories.
 * Supports inline editing with validation and save/cancel functionality.
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  GraduationCap, 
  Award,
  Linkedin,
  Save,
  X,
  Edit,
  Plus,
  Trash2
} from "lucide-react";
import { toast } from "react-hot-toast";

export interface AlumniInfoData {
  // Current Employment
  currentOccupation?: string;
  currentEmployer?: string;
  currentJobTitle?: string;
  currentAddress?: string;
  currentCity?: string;
  currentState?: string;
  currentCountry?: string;
  
  // Higher Education
  higherEducation?: string;
  collegeName?: string;
  collegeLocation?: string;
  graduationYearCollege?: number;
  
  // Additional
  achievements?: string[];
  linkedInProfile?: string;
}

interface AlumniInfoSectionProps {
  data: AlumniInfoData;
  isEditMode?: boolean;
  onSave?: (updatedData: Partial<AlumniInfoData>) => Promise<void>;
  onCancel?: () => void;
}

type SectionType = "employment" | "education" | "achievements" | "social";

export function AlumniInfoSection({
  data,
  isEditMode = false,
  onSave,
  onCancel,
}: AlumniInfoSectionProps) {
  const [editingSection, setEditingSection] = useState<SectionType | null>(
    isEditMode ? "employment" : null
  );
  const [formData, setFormData] = useState<AlumniInfoData>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newAchievement, setNewAchievement] = useState("");

  const handleEdit = (section: SectionType) => {
    setEditingSection(section);
    setFormData(data);
    setErrors({});
  };

  const handleCancel = () => {
    setEditingSection(null);
    setFormData(data);
    setErrors({});
    setNewAchievement("");
    onCancel?.();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate LinkedIn URL if provided
    if (formData.linkedInProfile && !formData.linkedInProfile.includes("linkedin.com")) {
      newErrors.linkedInProfile = "Please enter a valid LinkedIn URL";
    }

    // Validate graduation year if provided
    if (formData.graduationYearCollege) {
      const year = formData.graduationYearCollege;
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 10) {
        newErrors.graduationYearCollege = "Please enter a valid year";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    setIsSaving(true);
    try {
      // Prepare update data based on editing section
      let updateData: Partial<AlumniInfoData> = {};
      
      if (editingSection === "employment") {
        updateData = {
          currentOccupation: formData.currentOccupation,
          currentEmployer: formData.currentEmployer,
          currentJobTitle: formData.currentJobTitle,
          currentAddress: formData.currentAddress,
          currentCity: formData.currentCity,
          currentState: formData.currentState,
          currentCountry: formData.currentCountry,
        };
      } else if (editingSection === "education") {
        updateData = {
          higherEducation: formData.higherEducation,
          collegeName: formData.collegeName,
          collegeLocation: formData.collegeLocation,
          graduationYearCollege: formData.graduationYearCollege,
        };
      } else if (editingSection === "achievements") {
        updateData = {
          achievements: formData.achievements,
        };
      } else if (editingSection === "social") {
        updateData = {
          linkedInProfile: formData.linkedInProfile,
        };
      }

      await onSave?.(updateData);
      setEditingSection(null);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving alumni info:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof AlumniInfoData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddAchievement = () => {
    if (!newAchievement.trim()) return;
    
    const achievements = formData.achievements || [];
    setFormData((prev) => ({
      ...prev,
      achievements: [...achievements, newAchievement.trim()],
    }));
    setNewAchievement("");
  };

  const handleRemoveAchievement = (index: number) => {
    const achievements = formData.achievements || [];
    setFormData((prev) => ({
      ...prev,
      achievements: achievements.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Employment Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Current Employment</CardTitle>
            </div>
            {editingSection !== "employment" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit("employment")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            Current occupation and employment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingSection === "employment" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentOccupation">Occupation</Label>
                  <Input
                    id="currentOccupation"
                    value={formData.currentOccupation || ""}
                    onChange={(e) => handleInputChange("currentOccupation", e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentEmployer">Employer</Label>
                  <Input
                    id="currentEmployer"
                    value={formData.currentEmployer || ""}
                    onChange={(e) => handleInputChange("currentEmployer", e.target.value)}
                    placeholder="e.g., Tech Company Inc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentJobTitle">Job Title</Label>
                <Input
                  id="currentJobTitle"
                  value={formData.currentJobTitle || ""}
                  onChange={(e) => handleInputChange("currentJobTitle", e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAddress">Address</Label>
                <Textarea
                  id="currentAddress"
                  value={formData.currentAddress || ""}
                  onChange={(e) => handleInputChange("currentAddress", e.target.value)}
                  placeholder="Street address"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currentCity">City</Label>
                  <Input
                    id="currentCity"
                    value={formData.currentCity || ""}
                    onChange={(e) => handleInputChange("currentCity", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentState">State</Label>
                  <Input
                    id="currentState"
                    value={formData.currentState || ""}
                    onChange={(e) => handleInputChange("currentState", e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentCountry">Country</Label>
                  <Input
                    id="currentCountry"
                    value={formData.currentCountry || ""}
                    onChange={(e) => handleInputChange("currentCountry", e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.currentOccupation || data.currentEmployer || data.currentJobTitle ? (
                <>
                  {data.currentOccupation && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Occupation</p>
                      <p className="text-base">{data.currentOccupation}</p>
                    </div>
                  )}
                  {data.currentEmployer && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Employer</p>
                      <p className="text-base">{data.currentEmployer}</p>
                    </div>
                  )}
                  {data.currentJobTitle && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                      <p className="text-base">{data.currentJobTitle}</p>
                    </div>
                  )}
                  {(data.currentCity || data.currentState || data.currentCountry) && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-base">
                        {[data.currentCity, data.currentState, data.currentCountry]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No employment information available
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Higher Education Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Higher Education</CardTitle>
            </div>
            {editingSection !== "education" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit("education")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            College and university education details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingSection === "education" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="higherEducation">Degree/Program</Label>
                <Input
                  id="higherEducation"
                  value={formData.higherEducation || ""}
                  onChange={(e) => handleInputChange("higherEducation", e.target.value)}
                  placeholder="e.g., Bachelor of Engineering"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="collegeName">College/University</Label>
                  <Input
                    id="collegeName"
                    value={formData.collegeName || ""}
                    onChange={(e) => handleInputChange("collegeName", e.target.value)}
                    placeholder="Institution name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collegeLocation">Location</Label>
                  <Input
                    id="collegeLocation"
                    value={formData.collegeLocation || ""}
                    onChange={(e) => handleInputChange("collegeLocation", e.target.value)}
                    placeholder="City, State"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYearCollege">Graduation Year</Label>
                <Input
                  id="graduationYearCollege"
                  type="number"
                  value={formData.graduationYearCollege || ""}
                  onChange={(e) => handleInputChange("graduationYearCollege", parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 2024"
                  min="1900"
                  max={new Date().getFullYear() + 10}
                />
                {errors.graduationYearCollege && (
                  <p className="text-sm text-destructive">{errors.graduationYearCollege}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.higherEducation || data.collegeName ? (
                <>
                  {data.higherEducation && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Degree/Program</p>
                      <p className="text-base">{data.higherEducation}</p>
                    </div>
                  )}
                  {data.collegeName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Institution</p>
                      <p className="text-base">{data.collegeName}</p>
                      {data.collegeLocation && (
                        <p className="text-sm text-muted-foreground">{data.collegeLocation}</p>
                      )}
                    </div>
                  )}
                  {data.graduationYearCollege && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Graduation Year</p>
                      <p className="text-base">{data.graduationYearCollege}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No higher education information available
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Achievements & Awards</CardTitle>
            </div>
            {editingSection !== "achievements" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit("achievements")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            Notable achievements and awards received after graduation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingSection === "achievements" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Achievements</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder="Add an achievement"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAchievement();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAchievement}
                    disabled={!newAchievement.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {formData.achievements && formData.achievements.length > 0 && (
                <div className="space-y-2">
                  {formData.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <span className="text-sm">{achievement}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAchievement(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {data.achievements && data.achievements.length > 0 ? (
                <ul className="space-y-2">
                  {data.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5">
                        {index + 1}
                      </Badge>
                      <span className="text-sm">{achievement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No achievements recorded
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Links Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Social Links</CardTitle>
            </div>
            {editingSection !== "social" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit("social")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            Professional social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingSection === "social" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedInProfile">LinkedIn Profile</Label>
                <Input
                  id="linkedInProfile"
                  type="url"
                  value={formData.linkedInProfile || ""}
                  onChange={(e) => handleInputChange("linkedInProfile", e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
                {errors.linkedInProfile && (
                  <p className="text-sm text-destructive">{errors.linkedInProfile}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {data.linkedInProfile ? (
                <a
                  href={data.linkedInProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                  View LinkedIn Profile
                </a>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No social links available
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
