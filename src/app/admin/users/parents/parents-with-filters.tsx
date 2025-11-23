"use client";

import { useState, useEffect, useTransition } from "react";
import { ParentsTable } from "@/components/users/parents-table";
import { AdvancedFilters, FilterConfig, FilterValue } from "@/components/shared/advanced-filters";
import { useFilterPresets } from "@/hooks/use-filter-presets";
import { getFilteredParents } from "@/lib/actions/parents-filters";
import { Loader2 } from "lucide-react";

interface ParentsWithFiltersProps {
  initialParents: any[];
  occupations: string[];
}

export function ParentsWithFilters({
  initialParents,
  occupations,
}: ParentsWithFiltersProps) {
  const [parents, setParents] = useState(initialParents);
  const [filters, setFilters] = useState<FilterValue>({});
  const [isPending, startTransition] = useTransition();

  const { presets, savePreset, deletePreset, loadPreset } = useFilterPresets(
    "parent-filter-presets"
  );

  const filterConfigs: FilterConfig[] = [
    {
      id: "occupation",
      label: "Occupation",
      type: "select",
      placeholder: "All Occupations",
      options: [
        { value: "all", label: "All Occupations" },
        ...occupations.map((o) => ({ value: o, label: o })),
      ],
    },
    {
      id: "hasChildren",
      label: "Has Children",
      type: "select",
      placeholder: "All",
      options: [
        { value: "all", label: "All" },
        { value: "true", label: "Has Children" },
        { value: "false", label: "No Children" },
      ],
    },
    {
      id: "search",
      label: "Search",
      type: "text",
      placeholder: "Search by name, email, or occupation",
    },
  ];

  useEffect(() => {
    const applyFilters = async () => {
      startTransition(async () => {
        const hasChildren =
          filters.hasChildren === "true"
            ? true
            : filters.hasChildren === "false"
            ? false
            : undefined;

        const result = await getFilteredParents({
          occupation: filters.occupation as string,
          hasChildren,
          search: filters.search as string,
        });

        if (result.success) {
          setParents(result.parents);
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
        Showing {parents.length} parent{parents.length !== 1 ? "s" : ""}
      </div>

      <ParentsTable parents={parents} />
    </div>
  );
}
