"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateAcademicSettings } from "@/lib/actions/settingsActions";

interface AcademicSettingsFormProps {
  initialData: {
    currentAcademicYear?: string | null;
    currentTerm?: string | null;
    defaultGradingScale: string;
    passingGrade: number;
    autoAttendance: boolean;
    lateArrivalMinutes: number;
    attendanceThreshold: number;
  };
}

export function AcademicSettingsForm({ initialData }: AcademicSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState(initialData.currentAcademicYear || "");
  const [currentTerm, setCurrentTerm] = useState(initialData.currentTerm || "");
  const [gradingSystem, setGradingSystem] = useState(initialData.defaultGradingScale || "PERCENTAGE");
  const [passingGrade, setPassingGrade] = useState(initialData.passingGrade || 50);
  const [autoAttendance, setAutoAttendance] = useState(initialData.autoAttendance || false);
  const [lateArrivalThreshold, setLateArrivalThreshold] = useState(initialData.lateArrivalMinutes || 15);
  const [attendanceThreshold, setAttendanceThreshold] = useState(initialData.attendanceThreshold || 75);

  const handleSave = async () => {
    // Validation
    if (passingGrade < 0 || passingGrade > 100) {
      toast.error("Passing grade must be between 0 and 100");
      return;
    }

    if (lateArrivalThreshold < 0 || lateArrivalThreshold > 60) {
      toast.error("Late arrival threshold must be between 0 and 60 minutes");
      return;
    }

    if (attendanceThreshold < 0 || attendanceThreshold > 100) {
      toast.error("Attendance threshold must be between 0 and 100");
      return;
    }

    setLoading(true);
    try {
      const result = await updateAcademicSettings({
        currentAcademicYear: academicYear || undefined,
        currentTerm: currentTerm || undefined,
        defaultGradingScale: gradingSystem,
        passingGrade,
        autoAttendance,
        lateArrivalMinutes: lateArrivalThreshold,
        attendanceThreshold,
      });
      
      if (result.success) {
        toast.success("Academic settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving academic settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Academic Configuration</CardTitle>
          <CardDescription>
            Configure academic year, terms, and grading system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Current Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger id="academicYear">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentTerm">Current Term</Label>
              <Select value={currentTerm} onValueChange={setCurrentTerm}>
                <SelectTrigger id="currentTerm">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradingSystem">Grading System</Label>
              <Select value={gradingSystem} onValueChange={setGradingSystem}>
                <SelectTrigger id="gradingSystem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (0-100)</SelectItem>
                  <SelectItem value="GPA">GPA (0-4.0)</SelectItem>
                  <SelectItem value="LETTER">Letter Grades (A-F)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passingGrade">Passing Grade (%)</Label>
              <Input
                id="passingGrade"
                type="number"
                value={passingGrade}
                onChange={(e) => setPassingGrade(parseInt(e.target.value) || 50)}
                placeholder="50"
                min="0"
                max="100"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Settings</CardTitle>
          <CardDescription>
            Configure attendance tracking and policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatic Attendance Marking</Label>
              <p className="text-sm text-muted-foreground">
                Automatically mark students as absent if not marked present
              </p>
            </div>
            <Switch checked={autoAttendance} onCheckedChange={setAutoAttendance} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lateArrival">Late Arrival Threshold (minutes)</Label>
              <Input 
                id="lateArrival"
                type="number" 
                value={lateArrivalThreshold} 
                onChange={(e) => setLateArrivalThreshold(parseInt(e.target.value) || 15)}
                min="0"
                max="60"
              />
              <p className="text-sm text-muted-foreground">
                Minutes after class start to mark as late
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendanceThreshold">Minimum Attendance (%)</Label>
              <Input 
                id="attendanceThreshold"
                type="number" 
                value={attendanceThreshold} 
                onChange={(e) => setAttendanceThreshold(parseInt(e.target.value) || 75)}
                min="0"
                max="100"
              />
              <p className="text-sm text-muted-foreground">
                Required attendance percentage for students
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
