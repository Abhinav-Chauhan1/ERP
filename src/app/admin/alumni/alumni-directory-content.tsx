"use client";

/**
 * Alumni Directory Content Component
 * 
 * Client component that handles alumni directory interactions.
 * Integrates with server actions for data fetching and export.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 14.2
 */

import { useState, useEffect, useCallback } from "react";
import { AlumniDirectory, AlumniFiltersState } from "@/components/admin/alumni";
import { searchAlumni, getAlumniStatistics } from "@/lib/actions/alumniActions";
import { toast } from "react-hot-toast";
import type { AlumniCardData } from "@/components/admin/alumni/alumni-card";
import type { AlumniStatisticsData } from "@/components/admin/alumni/alumni-stats";

export function AlumniDirectoryContent() {
  const [initialData, setInitialData] = useState<{
    alumni: AlumniCardData[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
    statistics?: AlumniStatisticsData;
    availableClasses: string[];
    availableCities: string[];
    availableOccupations: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setIsLoading(true);

        // Fetch initial alumni list
        const alumniResult = await searchAlumni({
          page: 1,
          pageSize: 12,
          sortBy: "graduationDate",
          sortOrder: "desc",
        });

        if (!alumniResult.success || !alumniResult.data) {
          toast.error(alumniResult.error || "Failed to load alumni");
          return;
        }

        // Fetch statistics
        const statsResult = await getAlumniStatistics();
        const statistics = statsResult.success ? statsResult.data : undefined;

        // Extract unique values for filters
        const classes = new Set<string>();
        const cities = new Set<string>();
        const occupations = new Set<string>();

        alumniResult.data.alumni.forEach((alumnus) => {
          if (alumnus.finalClass) classes.add(alumnus.finalClass);
          if (alumnus.currentCity) cities.add(alumnus.currentCity);
          if (alumnus.currentOccupation) occupations.add(alumnus.currentOccupation);
        });

        setInitialData({
          alumni: alumniResult.data.alumni,
          pagination: alumniResult.data.pagination,
          statistics,
          availableClasses: Array.from(classes).sort(),
          availableCities: Array.from(cities).sort(),
          availableOccupations: Array.from(occupations).sort(),
        });
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load alumni directory");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // Handle search with filters
  const handleSearch = useCallback(
    async (
      searchTerm: string,
      filters: AlumniFiltersState,
      page: number,
      pageSize: number
    ) => {
      try {
        const result = await searchAlumni({
          searchTerm: searchTerm || undefined,
          graduationYearFrom: filters.graduationYearFrom,
          graduationYearTo: filters.graduationYearTo,
          finalClass: filters.finalClass,
          currentCity: filters.currentCity,
          currentOccupation: filters.currentOccupation,
          collegeName: filters.collegeName,
          page,
          pageSize,
          sortBy: "graduationDate",
          sortOrder: "desc",
        });

        if (!result.success || !result.data) {
          toast.error(result.error || "Failed to search alumni");
          return {
            alumni: [],
            pagination: {
              total: 0,
              page: 1,
              pageSize: 12,
              totalPages: 0,
            },
          };
        }

        return {
          alumni: result.data.alumni,
          pagination: result.data.pagination,
        };
      } catch (error) {
        console.error("Error searching alumni:", error);
        toast.error("Failed to search alumni");
        return {
          alumni: [],
          pagination: {
            total: 0,
            page: 1,
            pageSize: 12,
            totalPages: 0,
          },
        };
      }
    },
    []
  );

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      toast.loading("Preparing export...", { id: "export" });

      // Fetch all alumni for export
      const result = await searchAlumni({
        page: 1,
        pageSize: 10000, // Large number to get all alumni
        sortBy: "graduationDate",
        sortOrder: "desc",
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to export alumni", { id: "export" });
        return;
      }

      // Convert to CSV
      const headers = [
        "Admission ID",
        "Name",
        "Graduation Date",
        "Final Class",
        "Final Section",
        "Current Occupation",
        "Current City",
        "Email",
      ];

      const rows = result.data.alumni.map((alumnus) => [
        alumnus.admissionId,
        alumnus.studentName,
        new Date(alumnus.graduationDate).toLocaleDateString(),
        alumnus.finalClass,
        alumnus.finalSection,
        alumnus.currentOccupation || "",
        alumnus.currentCity || "",
        alumnus.currentEmail || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `alumni-directory-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Alumni directory exported successfully", { id: "export" });
    } catch (error) {
      console.error("Error exporting alumni:", error);
      toast.error("Failed to export alumni directory", { id: "export" });
    }
  }, []);

  if (isLoading || !initialData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading alumni directory...</p>
        </div>
      </div>
    );
  }

  return (
    <AlumniDirectory
      initialAlumni={initialData.alumni}
      initialPagination={initialData.pagination}
      statistics={initialData.statistics}
      availableClasses={initialData.availableClasses}
      availableCities={initialData.availableCities}
      availableOccupations={initialData.availableOccupations}
      onSearch={handleSearch}
      onExport={handleExport}
    />
  );
}
