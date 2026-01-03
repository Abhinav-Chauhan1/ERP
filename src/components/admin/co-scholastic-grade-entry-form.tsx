"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getCoScholasticGradesByClass,
  saveCoScholasticGradesBulk,
  type CoScholasticGradeInput,
} from "@/lib/actions/coScholasticActions";
import { Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface CoScholasticGradeEntryFormProps {
  activities: any[];
  terms: any[];
  classes: any[];
}

export function CoScholasticGradeEntryForm({
  activities,
  terms,
  classes,
}: CoScholasticGradeEntryFormProps) {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [termId, setTermId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [grades, setGrades] = useState<Record<string, CoScholasticGradeInput>>({});

  const { toast } = useToast();

  const selectedClass = classes.find((c: any) => c.id === classId);
  const sections = selectedClass?.sections || [];
  const selectedActivity = activities.find((a: any) => a.id === activityId);

  const loadGrades = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCoScholasticGradesByClass(classId, sectionId, termId, activityId);

      if (result.success) {
        setData(result.data);

        // Initialize grades from existing data
        const initialGrades: Record<string, CoScholasticGradeInput> = {};
        result.data.enrollments.forEach((enrollment: any) => {
          const existingGrade = result.data.grades.find(
            (g: any) => g.studentId === enrollment.studentId && g.activityId === activityId
          );

          initialGrades[enrollment.studentId] = {
            activityId,
            studentId: enrollment.studentId,
            termId,
            grade: existingGrade?.grade || "",
            marks: existingGrade?.marks || undefined,
            remarks: existingGrade?.remarks || "",
          };
        });
        setGrades(initialGrades);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load grades",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [classId, sectionId, termId, activityId, toast]);

  useEffect(() => {
    if (classId && sectionId && termId && activityId) {
      loadGrades();
    } else {
      setData(null);
      setGrades({});
    }
  }, [classId, sectionId, termId, activityId, loadGrades]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty grades
      const gradesToSave = Object.values(grades).filter((g) => {
        if (selectedActivity?.assessmentType === "GRADE") {
          return g.grade && g.grade.trim() !== "";
        } else {
          return g.marks !== undefined && g.marks !== null;
        }
      });

      if (gradesToSave.length === 0) {
        toast({
          title: "Warning",
          description: "No grades to save",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const result = await saveCoScholasticGradesBulk(gradesToSave);

      if (result.success) {
        toast({
          title: "Success",
          description: `Saved ${result.data.saved} grade(s)${result.data.failed > 0 ? `, ${result.data.failed} failed` : ""
            }`,
        });

        if (result.data.failed > 0) {
          console.error("Failed grades:", result.data.errors);
        }

        // Reload grades
        await loadGrades();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save grades",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateGrade = (studentId: string, field: keyof CoScholasticGradeInput, value: any) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="class">Class *</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger id="class">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls.academicYear.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="section">Section *</Label>
          <Select
            value={sectionId}
            onValueChange={setSectionId}
            disabled={!classId}
          >
            <SelectTrigger id="section">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section: any) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="term">Term *</Label>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger id="term">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term: any) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} ({term.academicYear.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="activity">Activity *</Label>
          <Select value={activityId} onValueChange={setActivityId}>
            <SelectTrigger id="activity">
              <SelectValue placeholder="Select activity" />
            </SelectTrigger>
            <SelectContent>
              {activities.map((activity: any) => (
                <SelectItem key={activity.id} value={activity.id}>
                  {activity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && data && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {selectedActivity?.name}
              </h3>
              <div className="text-sm text-muted-foreground">
                Assessment Type:{" "}
                <Badge variant={selectedActivity?.assessmentType === "GRADE" ? "default" : "secondary"}>
                  {selectedActivity?.assessmentType}
                </Badge>
                {selectedActivity?.assessmentType === "MARKS" && selectedActivity?.maxMarks && (
                  <span className="ml-2">Max Marks: {selectedActivity.maxMarks}</span>
                )}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Grades
            </Button>
          </div>

          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-accent border-b">
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground w-12">
                      Roll No.
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                      Student Name
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground w-32">
                      {selectedActivity?.assessmentType === "GRADE" ? "Grade" : "Marks"}
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No students found in this class/section
                      </td>
                    </tr>
                  ) : (
                    data.enrollments.map((enrollment: any) => {
                      const studentGrade = grades[enrollment.studentId] || {};
                      return (
                        <tr key={enrollment.id} className="border-b hover:bg-accent/50">
                          <td className="py-3 px-4 align-middle">
                            {enrollment.rollNumber || "-"}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="font-medium">
                              {enrollment.student.user.firstName}{" "}
                              {enrollment.student.user.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {enrollment.student.admissionId}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {selectedActivity?.assessmentType === "GRADE" ? (
                              <Input
                                placeholder="A, B, C..."
                                value={studentGrade.grade || ""}
                                onChange={(e) =>
                                  updateGrade(enrollment.studentId, "grade", e.target.value)
                                }
                                className="w-24"
                              />
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                max={selectedActivity?.maxMarks || undefined}
                                step="0.5"
                                placeholder="0"
                                value={studentGrade.marks !== undefined ? studentGrade.marks : ""}
                                onChange={(e) =>
                                  updateGrade(
                                    enrollment.studentId,
                                    "marks",
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="w-24"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Input
                              placeholder="Optional remarks"
                              value={studentGrade.remarks || ""}
                              onChange={(e) =>
                                updateGrade(enrollment.studentId, "remarks", e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !data && classId && sectionId && termId && activityId && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            Select all filters to load students
          </p>
        </div>
      )}
    </div>
  );
}
