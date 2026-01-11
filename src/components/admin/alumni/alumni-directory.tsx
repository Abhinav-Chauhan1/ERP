"use client";

/**
 * Alumni Directory Component
 * 
 * Main directory layout with search, filters, view toggle, and pagination.
 * Integrates all alumni directory sub-components.
 * 
 * Requirements: 6.1, 6.7
 */

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Download, TrendingUp, MessageSquare } from "lucide-react";
import { AlumniSearchBar } from "./alumni-search-bar";
import { AlumniFilters, AlumniFiltersState } from "./alumni-filters";
import { AlumniCard, AlumniCardData } from "./alumni-card";
import { AlumniTable } from "./alumni-table";
import { AlumniStats, AlumniStatisticsData } from "./alumni-stats";
import { Pagination } from "@/components/shared/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AlumniDirectoryProps {
  initialAlumni: AlumniCardData[];
  initialPagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  statistics?: AlumniStatisticsData;
  availableClasses?: string[];
  availableCities?: string[];
  availableOccupations?: string[];
  onSearch?: (searchTerm: string, filters: AlumniFiltersState, page: number, pageSize: number) => Promise<{
    alumni: AlumniCardData[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }>;
  onExport?: () => void;
}

type ViewMode = "card" | "table";

export function AlumniDirectory({
  initialAlumni,
  initialPagination,
  statistics,
  availableClasses = [],
  availableCities = [],
  availableOccupations = [],
  onSearch,
  onExport,
}: AlumniDirectoryProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<AlumniFiltersState>({});
  const [alumni, setAlumni] = useState<AlumniCardData[]>(initialAlumni);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [itemsPerPage, setItemsPerPage] = useState(initialPagination.pageSize);

  // Fetch alumni data
  const fetchAlumni = useCallback(async () => {
    if (!onSearch) return;

    setIsLoading(true);
    try {
      const result = await onSearch(searchTerm, filters, currentPage, itemsPerPage);
      setAlumni(result.alumni);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Error fetching alumni:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filters, currentPage, itemsPerPage, onSearch]);

  // Fetch alumni when search/filter/pagination changes
  useEffect(() => {
    if (onSearch) {
      fetchAlumni();
    }
  }, [fetchAlumni, onSearch]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

  const handleFiltersChange = useCallback((newFilters: AlumniFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleAlumniClick = useCallback((alumniId: string) => {
    router.push(`/admin/alumni/${alumniId}`);
  }, [router]);

  const handleSort = useCallback((sortBy: "name" | "graduationDate" | "class", order: "asc" | "desc") => {
    // Sorting would typically be handled server-side
    // For now, we'll just log it
    console.log("Sort by:", sortBy, order);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alumni Directory</h1>
          <p className="text-muted-foreground">
            Browse and manage alumni profiles
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/alumni/communication">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </Link>
          {onExport && (
            <Button onClick={onExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Directory
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Directory and Statistics */}
      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="directory">
            <List className="mr-2 h-4 w-4" />
            Directory
          </TabsTrigger>
          {statistics && (
            <TabsTrigger value="statistics">
              <TrendingUp className="mr-2 h-4 w-4" />
              Statistics
            </TabsTrigger>
          )}
        </TabsList>

        {/* Directory Tab */}
        <TabsContent value="directory" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search Alumni</CardTitle>
              <CardDescription>
                Find alumni by name, admission ID, occupation, or other criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <AlumniSearchBar onSearch={handleSearch} />
                <div className="flex gap-2">
                  <AlumniFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    availableClasses={availableClasses}
                    availableCities={availableCities}
                    availableOccupations={availableOccupations}
                  />
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "card" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("card")}
                      className="rounded-r-none"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="sr-only">Card view</span>
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                      <span className="sr-only">Table view</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  Showing {alumni.length} of {pagination.total} alumni
                </>
              )}
            </p>
          </div>

          {/* Alumni Display */}
          {isLoading ? (
            <div className="space-y-4">
              {viewMode === "card" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center space-y-4">
                          <Skeleton className="h-24 w-24 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : alumni.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-lg font-medium">No alumni found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search or filters
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === "card" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {alumni.map((alumnus) => (
                <AlumniCard
                  key={alumnus.id}
                  alumni={alumnus}
                  onClick={handleAlumniClick}
                />
              ))}
            </div>
          ) : (
            <AlumniTable
              alumni={alumni}
              onRowClick={handleAlumniClick}
              onSort={handleSort}
            />
          )}

          {/* Pagination */}
          {!isLoading && alumni.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              showItemsPerPage={true}
              itemsPerPageOptions={[12, 24, 48, 96]}
            />
          )}
        </TabsContent>

        {/* Statistics Tab */}
        {statistics && (
          <TabsContent value="statistics">
            <AlumniStats statistics={statistics} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
