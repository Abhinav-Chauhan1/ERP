"use client";


import { useState, useEffect } from "react";
import { AnnouncementList } from "@/components/student/communication";
import { getAnnouncements } from "@/lib/actions/student-communication-actions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Fetch announcements
  const fetchAnnouncements = async (page: number = 1, newFilters: any = {}) => {
    setLoading(true);
    try {
      const result = await getAnnouncements({
        page,
        limit: 50,
        ...newFilters,
      });

      if (result.success && result.data) {
        setAnnouncements(result.data.announcements);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to fetch announcements");
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  // Load announcements on mount
  useEffect(() => {
    fetchAnnouncements(1, filters);
  }, []);

  const handlePageChange = (page: number) => {
    fetchAnnouncements(page, filters);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    fetchAnnouncements(1, newFilters);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with important announcements
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <AnnouncementList
          announcements={announcements}
          pagination={pagination}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
        />
      )}
    </div>
  );
}

