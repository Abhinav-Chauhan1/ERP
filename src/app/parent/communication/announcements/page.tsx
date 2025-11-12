"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, Filter, Calendar } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnnouncementCard } from "@/components/parent/communication/announcement-card";
import { getAnnouncements } from "@/lib/actions/parent-communication-actions";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  hasAttachments: boolean;
  publisher: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  createdAt: Date;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementData | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Load announcements
  const loadAnnouncements = async (
    page: number = 1,
    search: string = "",
    dateStart?: string,
    dateEnd?: string
  ) => {
    setIsLoading(true);
    try {
      const filters: any = {
        page,
        limit: pagination.limit,
        isActive: true,
      };

      if (search) {
        filters.search = search;
      }

      if (dateStart) {
        filters.startDate = new Date(dateStart);
      }

      if (dateEnd) {
        filters.endDate = new Date(dateEnd);
      }

      const result = await getAnnouncements(filters);

      if (result.success && result.data) {
        setAnnouncements(result.data.announcements as AnnouncementData[]);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to load announcements");
      }
    } catch (error) {
      console.error("Error loading announcements:", error);
      toast.error("An error occurred while loading announcements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAnnouncements(1, value, startDate, endDate);
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAnnouncements(1, searchQuery, startDate, endDate);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAnnouncements(1);
    setIsFilterOpen(false);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    loadAnnouncements(page, searchQuery, startDate, endDate);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnnouncementClick = (announcement: AnnouncementData) => {
    setSelectedAnnouncement(announcement);
  };

  const handleCloseDetail = () => {
    setSelectedAnnouncement(null);
  };

  return (
    <div className="h-full p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-gray-600 mt-1">
            Stay updated with school announcements and news
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(startDate || endDate) && (
                  <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    Active
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Announcements</SheetTitle>
                <SheetDescription>
                  Filter announcements by date range
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Date Range */}
                <div className="space-y-4">
                  <Label>Date Range</Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm text-gray-600">
                        From
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm text-gray-600">
                        To
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleApplyFilters} className="flex-1">
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No announcements found</p>
            {(searchQuery || startDate || endDate) && (
              <Button
                variant="link"
                onClick={handleClearFilters}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                onClick={() => handleAnnouncementClick(announcement)}
                className="cursor-pointer"
              >
                <AnnouncementCard
                  announcement={announcement}
                  category="GENERAL"
                  defaultExpanded={false}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
              {pagination.totalCount} announcements
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Announcement Detail Modal */}
        <Dialog open={!!selectedAnnouncement} onOpenChange={handleCloseDetail}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedAnnouncement && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedAnnouncement.title}</DialogTitle>
                  <DialogDescription>
                    Published on{" "}
                    {format(new Date(selectedAnnouncement.startDate), "MMMM d, yyyy")}
                    {selectedAnnouncement.endDate &&
                      ` - ${format(new Date(selectedAnnouncement.endDate), "MMMM d, yyyy")}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Published by:</span>
                    <span>
                      {selectedAnnouncement.publisher.firstName}{" "}
                      {selectedAnnouncement.publisher.lastName}
                    </span>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedAnnouncement.content}
                    </p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
