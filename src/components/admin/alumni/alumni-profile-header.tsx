"use client";

/**
 * Alumni Profile Header Component
 * 
 * Displays profile photo, basic information, and graduation details.
 * Includes edit mode toggle for administrators.
 * 
 * Requirements: 5.1
 */

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin,
  Edit,
  X,
  Save
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface AlumniProfileHeaderData {
  id: string;
  student: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
  };
  admissionId: string;
  graduationDate: Date;
  finalClass: string;
  finalSection: string;
  finalAcademicYear: string;
  profilePhoto?: string;
  currentOccupation?: string;
  currentEmployer?: string;
  currentCity?: string;
  currentEmail?: string;
  currentPhone?: string;
}

interface AlumniProfileHeaderProps {
  alumni: AlumniProfileHeaderData;
  isEditable?: boolean;
  isEditMode?: boolean;
  onEditToggle?: (isEditing: boolean) => void;
}

export function AlumniProfileHeader({
  alumni,
  isEditable = false,
  isEditMode = false,
  onEditToggle,
}: AlumniProfileHeaderProps) {
  const [editMode, setEditMode] = useState(isEditMode);

  const fullName = `${alumni.student.firstName} ${alumni.student.lastName}`;
  const initials = `${alumni.student.firstName[0]}${alumni.student.lastName[0]}`.toUpperCase();
  const graduationYear = new Date(alumni.graduationDate).getFullYear();

  const handleEditToggle = () => {
    const newEditMode = !editMode;
    setEditMode(newEditMode);
    onEditToggle?.(newEditMode);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32 md:h-40 md:w-40">
              <AvatarImage src={alumni.profilePhoto} alt={fullName} />
              <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
            </Avatar>
            <Badge variant="secondary" className="text-sm">
              Alumni
            </Badge>
          </div>

          {/* Basic Information */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
                <p className="text-muted-foreground mt-1">
                  Admission ID: {alumni.admissionId}
                </p>
              </div>
              {isEditable && (
                <Button
                  variant={editMode ? "outline" : "default"}
                  size="sm"
                  onClick={handleEditToggle}
                >
                  {editMode ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Graduation Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Graduation Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Class:</span>
                    <span>
                      {alumni.finalClass} - {alumni.finalSection}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Graduated:</span>
                    <span>{formatDate(alumni.graduationDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Academic Year:</span>
                    <span>{alumni.finalAcademicYear}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Contact Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <a 
                      href={`mailto:${alumni.currentEmail || alumni.student.email}`}
                      className="text-primary hover:underline"
                    >
                      {alumni.currentEmail || alumni.student.email}
                    </a>
                  </div>
                  {(alumni.currentPhone || alumni.student.phone) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{alumni.currentPhone || alumni.student.phone}</span>
                    </div>
                  )}
                  {alumni.currentCity && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Location:</span>
                      <span>{alumni.currentCity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Occupation */}
            {(alumni.currentOccupation || alumni.currentEmployer) && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Current Position
                </h3>
                <div className="space-y-1">
                  {alumni.currentOccupation && (
                    <p className="text-lg font-medium">{alumni.currentOccupation}</p>
                  )}
                  {alumni.currentEmployer && (
                    <p className="text-sm text-muted-foreground">
                      at {alumni.currentEmployer}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
