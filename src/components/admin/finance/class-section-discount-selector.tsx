"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { getClasses } from "@/lib/actions/classesActions";
import { getStudentsForBulkDiscount } from "@/lib/actions/miscFeeActions";
import { ClassSectionDiscountGrid } from "./class-section-discount-grid";
import { useToast } from "@/hooks/use-toast";

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Section {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
  sections: Section[];
}

type StudentsData = Awaited<ReturnType<typeof getStudentsForBulkDiscount>>;

export function ClassSectionDiscountSelector() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsData, setStudentsData] = useState<StudentsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingOptions(true);
      try {
        const yearsResult = await getAcademicYears();
        if (cancelled) return;
        if (yearsResult.success) {
          const years = (yearsResult.data || []) as AcademicYear[];
          setAcademicYears(years);
          const current = years.find((y) => y.isCurrent);
          if (current) setAcademicYearId(current.id);
        } else {
          setError(yearsResult.error || "Failed to load academic years");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading academic years:", err);
        setError("Failed to load academic years");
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setClassId("");
    setSectionId("");
    setClasses([]);
    setStudentsData(null);
    if (!academicYearId) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await getClasses(academicYearId);
        if (cancelled) return;
        if (result.success) {
          setClasses((result.data || []) as ClassOption[]);
        } else {
          setError(result.error || "Failed to load classes");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading classes:", err);
        setError("Failed to load classes");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [academicYearId]);

  useEffect(() => {
    setSectionId("");
    setStudentsData(null);
  }, [classId]);

  const selectedClass = classes.find((c) => c.id === classId);

  const handleLoadStudents = async () => {
    if (!academicYearId || !classId || !sectionId) return;

    setIsLoadingStudents(true);
    setError(null);
    setStudentsData(null);

    const result = await getStudentsForBulkDiscount(academicYearId, classId, sectionId);
    setIsLoadingStudents(false);

    if (!result.success || !result.data) {
      setError(!result.success ? result.error || "Failed to load students" : "Failed to load students");
      return;
    }

    if (result.data.rows.length === 0) {
      setError("No students found for the selected class and section");
      return;
    }

    setStudentsData(result);
  };

  const handleSaved = () => {
    toast({ title: "Discounts saved", description: "Reloading the roster to reflect the latest values." });
    handleLoadStudents();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Academic Year</Label>
              <Select value={academicYearId} onValueChange={setAcademicYearId} disabled={loadingOptions}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.isCurrent ? "(Current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Class</Label>
              <Select value={classId} onValueChange={setClassId} disabled={!academicYearId || classes.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={academicYearId ? "Select class" : "Select academic year first"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Section</Label>
              <Select
                value={sectionId}
                onValueChange={setSectionId}
                disabled={!classId || (selectedClass?.sections.length ?? 0) === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={classId ? "Select section" : "Select class first"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedClass?.sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleLoadStudents}
              disabled={!academicYearId || !classId || !sectionId || isLoadingStudents}
            >
              {isLoadingStudents ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Students...
                </>
              ) : (
                "Load Students"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {studentsData?.success && studentsData.data && studentsData.data.rows.length > 0 && (
        <ClassSectionDiscountGrid
          academicYearId={academicYearId}
          classId={classId}
          sectionId={sectionId}
          feeStructure={studentsData.data.feeStructure}
          initialRows={studentsData.data.rows}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
