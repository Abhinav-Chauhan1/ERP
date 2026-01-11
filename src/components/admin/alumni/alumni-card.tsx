"use client";

/**
 * Alumni Card Component
 * 
 * Displays alumni information in a card format with photo, name,
 * graduation year, current occupation, and location.
 * 
 * Requirements: 6.4
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, GraduationCap, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface AlumniCardData {
  id: string;
  studentName: string;
  admissionId: string;
  graduationDate: Date;
  finalClass: string;
  finalSection: string;
  currentOccupation?: string;
  currentCity?: string;
  currentEmail?: string;
  profilePhoto?: string;
}

interface AlumniCardProps {
  alumni: AlumniCardData;
  onClick?: (alumniId: string) => void;
}

export function AlumniCard({ alumni, onClick }: AlumniCardProps) {
  const initials = alumni.studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const graduationYear = new Date(alumni.graduationDate).getFullYear();

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick?.(alumni.id)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Profile Photo */}
          <Avatar className="h-24 w-24">
            <AvatarImage src={alumni.profilePhoto} alt={alumni.studentName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>

          {/* Name and Admission ID */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{alumni.studentName}</h3>
            <p className="text-sm text-muted-foreground">{alumni.admissionId}</p>
          </div>

          {/* Graduation Info */}
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span>
              {alumni.finalClass} - {alumni.finalSection}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Graduated {graduationYear}</span>
          </div>

          {/* Current Info */}
          <div className="w-full space-y-2 pt-2 border-t">
            {alumni.currentOccupation && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{alumni.currentOccupation}</span>
              </div>
            )}

            {alumni.currentCity && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{alumni.currentCity}</span>
              </div>
            )}

            {!alumni.currentOccupation && !alumni.currentCity && (
              <p className="text-sm text-muted-foreground italic">
                No current information available
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
