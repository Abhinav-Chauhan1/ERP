"use client";

import { useState, useEffect, useTransition } from "react";
import { TeachersTable } from "@/components/users/teachers-table";
import { AdvancedFilters, FilterConfig, FilterValue } from "@/components/shared/advanced-filters";
import { useFilterPresets } from "@/hooks/use-filter-presets";
import { getFilteredTeachers } from "@/lib/actions/teachers-filters";
import { DateRange } from "react-day-picker";
import { Loader2 } from "lucide-react";

interface TeachersWithFiltersProps {
  initialTeachers: any[];
  subjects: { id: string; name: string }[];

}

export function TeachersWithFilters({
  initialTeachers,
  subjects,

}: TeachersWithFiltersProps) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [filters, setFilters] = useState<FilterValue>({});
  const [isPending, startTransition] = useTransition();

  const { presets, savePreset, deletePreset, loadPreset } = useFilterPresets(
    "teacher-filter-presets"
  );

  const filterConfigs: FilterConfig[] = [
    {
      id: "subjectId",
      label: "Subject",
      type: "select",
      placeholder: "All Subjects",
      options: [
        { value: "all", label: "All Subjects" },
        ...subjects.map((s) => ({ value: s.id, label: s.name })),
      ],
    },

    {
      id: "joiningDate",
      label: "Joining Date Range",
      type: "date-range",
      placeholder: "Select date range",
    },
    {
      id: "search",
      label: "Search",
      type: "text",
      placeholder: "Search by name, employee ID, or department",
    },
  ];

  useEffect(() => {
    const applyFilters = async () => {
      startTransition(async () => {
        const dateRange = filters.joiningDate as DateRange | undefined;

        const result = await getFilteredTeachers({
          subjectId: filters.subjectId as string,

          joiningDateFrom: dateRange?.from,
          joiningDateTo: dateRange?.to,
          search: filters.search as string,
        });

        if (result.success) {
          setTeachers(result.teachers);
        }
      });
    };

    applyFilters();
  }, [filters]);

  const handleFilterChange = (newFilters: FilterValue) => {
    setFilters(newFilters);
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
        Showing {teachers.length} teacher{teachers.length !== 1 ? "s" : ""}
      </div>

      <TeachersTable teachers={teachers} />
    </div>
  );
}
