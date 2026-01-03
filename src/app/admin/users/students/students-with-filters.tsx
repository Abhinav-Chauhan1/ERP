"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { StudentsTable } from "@/components/users/students-table";
import { AdvancedFilters, FilterConfig, FilterValue } from "@/components/shared/advanced-filters";
import { useFilterPresets } from "@/hooks/use-filter-presets";
import { getFilteredStudents } from "@/lib/actions/students-filters";
import { DateRange } from "react-day-picker";
import { Loader2 } from "lucide-react";

interface StudentsWithFiltersProps {
  initialStudents: any[];
  classes: { id: string; name: string }[];
  sections: { id: string; name: string; classId: string }[];
}

export function StudentsWithFilters({
  initialStudents,
  classes,
  sections,
}: StudentsWithFiltersProps) {
  const [students, setStudents] = useState(initialStudents);
  const [filters, setFilters] = useState<FilterValue>({});
  const [isPending, startTransition] = useTransition();

  const { presets, savePreset, deletePreset, loadPreset } = useFilterPresets(
    "student-filter-presets"
  );

  // Filter sections based on selected class
  const filteredSections = useMemo(() => {
    const selectedClassId = filters.classId as string;
    if (!selectedClassId || selectedClassId === "all") {
      return sections;
    }
    return sections.filter((section) => section.classId === selectedClassId);
  }, [filters.classId, sections]);

  const filterConfigs: FilterConfig[] = [
    {
      id: "classId",
      label: "Class",
      type: "select",
      placeholder: "All Classes",
      options: [
        { value: "all", label: "All Classes" },
        ...classes.map((c) => ({ value: c.id, label: c.name })),
      ],
    },
    {
      id: "sectionId",
      label: "Section",
      type: "select",
      placeholder: filters.classId && filters.classId !== "all" ? "All Sections" : "Select class first",
      disabled: !filters.classId || filters.classId === "all",
      options: [
        { value: "all", label: "All Sections" },
        ...filteredSections.map((s) => ({ value: s.id, label: s.name })),
      ],
    },
    {
      id: "gender",
      label: "Gender",
      type: "select",
      placeholder: "All Genders",
      options: [
        { value: "all", label: "All Genders" },
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" },
        { value: "OTHER", label: "Other" },
      ],
    },
    {
      id: "enrollmentStatus",
      label: "Enrollment Status",
      type: "select",
      placeholder: "All Statuses",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "TRANSFERRED", label: "Transferred" },
      ],
    },
    {
      id: "admissionDate",
      label: "Admission Date Range",
      type: "date-range",
      placeholder: "Select date range",
    },
    {
      id: "search",
      label: "Search",
      type: "text",
      placeholder: "Search by name, admission ID, or roll number",
    },
  ];

  useEffect(() => {
    const applyFilters = async () => {
      startTransition(async () => {
        const dateRange = filters.admissionDate as DateRange | undefined;
        
        const result = await getFilteredStudents({
          classId: filters.classId as string,
          sectionId: filters.sectionId as string,
          gender: filters.gender as string,
          enrollmentStatus: filters.enrollmentStatus as string,
          admissionDateFrom: dateRange?.from,
          admissionDateTo: dateRange?.to,
          search: filters.search as string,
        });

        if (result.success) {
          setStudents(result.students);
        }
      });
    };

    applyFilters();
  }, [filters]);

  const handleFilterChange = (newFilters: FilterValue) => {
    // If class changes, reset section filter
    if (newFilters.classId !== filters.classId) {
      const { sectionId, ...rest } = newFilters;
      setFilters(rest);
    } else {
      setFilters(newFilters);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleLoadPreset = (preset: any) => {
    const loadedFilters = loadPreset(preset);
    setFilters(loadedFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <AdvancedFilters
          filters={filterConfigs}
          value={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          presets={presets}
          onSavePreset={savePreset}
          onDeletePreset={deletePreset}
          onLoadPreset={handleLoadPreset}
        />
        {isPending && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Applying filters...
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {students.length} student{students.length !== 1 ? "s" : ""}
      </div>

      <StudentsTable students={students} />
    </div>
  );
}
