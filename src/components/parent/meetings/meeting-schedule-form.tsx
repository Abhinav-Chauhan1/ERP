"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Video, User } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { scheduleMeeting } from "@/lib/actions/parent-meeting-actions";

interface Teacher {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  };
}

interface MeetingScheduleFormProps {
  teachers: Teacher[];
  selectedTeacherId?: string;
  selectedDateTime?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MeetingScheduleForm({
  teachers,
  selectedTeacherId,
  selectedDateTime,
  onSuccess,
  onCancel,
}: MeetingScheduleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [formData, setFormData] = useState({
    teacherId: selectedTeacherId || "",
    scheduledDate: selectedDateTime || "",
    duration: "30",
    mode: "IN_PERSON" as "IN_PERSON" | "ONLINE",
    location: "",
    purpose: "",
    description: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.teacherId) {
      newErrors.teacherId = "Please select a teacher";
    }
    
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = "Please select a date and time";
    } else {
      const selectedDate = new Date(formData.scheduledDate);
      if (selectedDate < new Date()) {
        newErrors.scheduledDate = "Please select a future date and time";
      }
    }
    
    if (!formData.purpose.trim()) {
      newErrors.purpose = "Please provide a purpose for the meeting";
    }
    
    if (formData.mode === "IN_PERSON" && !formData.location.trim()) {
      newErrors.location = "Please provide a location for in-person meetings";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const formDataObj = new FormData();
        formDataObj.append("teacherId", formData.teacherId);
        formDataObj.append("scheduledDate", formData.scheduledDate);
        formDataObj.append("duration", formData.duration);
        formDataObj.append("mode", formData.mode);
        formDataObj.append("location", formData.location);
        formDataObj.append("purpose", formData.purpose);
        formDataObj.append("description", formData.description);

        const result = await scheduleMeeting(formDataObj);

        if (result.success) {
          toast({
            title: "Success",
            description: result.message || "Meeting scheduled successfully",
          });
          
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/parent/meetings/upcoming");
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to schedule meeting",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const selectedTeacher = teachers.find(t => t.id === formData.teacherId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Schedule Meeting
        </CardTitle>
        <CardDescription>
          Schedule a meeting with your child's teacher to discuss academic progress and concerns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label htmlFor="teacher" className="flex items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              Select Teacher *
            </Label>
            <Select
              value={formData.teacherId}
              onValueChange={(value) => {
                setFormData({ ...formData, teacherId: value });
                setErrors({ ...errors, teacherId: "" });
              }}
              disabled={isPending}
            >
              <SelectTrigger 
                id="teacher"
                className={errors.teacherId ? "border-destructive" : ""}
                aria-label="Select teacher for meeting"
                aria-invalid={!!errors.teacherId}
                aria-describedby={errors.teacherId ? "teacher-error" : undefined}
              >
                <SelectValue placeholder="Choose a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.user.firstName} {teacher.user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.teacherId && (
              <p id="teacher-error" className="text-sm text-destructive" role="alert">{errors.teacherId}</p>
            )}
            {selectedTeacher && (
              <p className="text-sm text-muted-foreground">
                {selectedTeacher.user.email}
              </p>
            )}
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Date and Time *
            </Label>
            <input
              id="scheduledDate"
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) => {
                setFormData({ ...formData, scheduledDate: e.target.value });
                setErrors({ ...errors, scheduledDate: "" });
              }}
              disabled={isPending}
              className={`flex h-10 w-full rounded-md border ${
                errors.scheduledDate ? "border-destructive" : "border-input"
              } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              aria-label="Select meeting date and time"
              aria-invalid={!!errors.scheduledDate}
              aria-describedby={errors.scheduledDate ? "scheduledDate-error" : undefined}
            />
            {errors.scheduledDate && (
              <p id="scheduledDate-error" className="text-sm text-destructive" role="alert">{errors.scheduledDate}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Meeting Duration</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value })}
              disabled={isPending}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Mode */}
          <div className="space-y-3">
            <Label>Meeting Mode *</Label>
            <RadioGroup
              value={formData.mode}
              onValueChange={(value: "IN_PERSON" | "ONLINE") => {
                setFormData({ ...formData, mode: value, location: value === "ONLINE" ? "Online Meeting" : "" });
                setErrors({ ...errors, location: "" });
              }}
              disabled={isPending}
              className="flex gap-4"
              aria-label="Select meeting mode"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="IN_PERSON" id="in-person" />
                <Label htmlFor="in-person" className="flex items-center gap-2 cursor-pointer font-normal">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  In Person
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ONLINE" id="online" />
                <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer font-normal">
                  <Video className="h-4 w-4" aria-hidden="true" />
                  Online
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Location (for in-person meetings) */}
          {formData.mode === "IN_PERSON" && (
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location *
              </Label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  setErrors({ ...errors, location: "" });
                }}
                disabled={isPending}
                placeholder="e.g., Teacher's Office, Room 201"
                className={`flex h-10 w-full rounded-md border ${
                  errors.location ? "border-destructive" : "border-input"
                } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>
          )}

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <input
              id="purpose"
              type="text"
              value={formData.purpose}
              onChange={(e) => {
                setFormData({ ...formData, purpose: e.target.value });
                setErrors({ ...errors, purpose: "" });
              }}
              disabled={isPending}
              placeholder="e.g., Discuss academic progress, behavior concerns"
              className={`flex h-10 w-full rounded-md border ${
                errors.purpose ? "border-destructive" : "border-input"
              } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            />
            {errors.purpose && (
              <p className="text-sm text-destructive">{errors.purpose}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isPending}
              placeholder="Provide any additional information about the meeting..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? "Scheduling..." : "Schedule Meeting"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
