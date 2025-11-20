"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { AnnouncementList } from "@/components/teacher/communication";
import { getAnnouncements } from "@/lib/actions/teacher-communication-actions";
import { toast } from "sonner";

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<{
    isActive?: boolean;
    search?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAnnouncements({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      if (result.success && result.data) {
        setAnnouncements(result.data.announcements);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to fetch announcements");
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("An error occurred while fetching announcements");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Initial load
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (newFilters: { isActive?: boolean; search?: string }) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDownloadAttachment = (url: string, fileName: string) => {
    // Open in new tab for download
    window.open(url, "_blank");
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground mt-1">
            View school-wide announcements and important updates
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AnnouncementList
          announcements={announcements}
          pagination={pagination}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          onDownloadAttachment={handleDownloadAttachment}
        />
      )}
    </div>
  );
}
