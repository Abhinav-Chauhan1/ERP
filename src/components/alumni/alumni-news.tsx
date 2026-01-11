"use client";

/**
 * Alumni News Component
 * 
 * Displays school news and events for alumni with filtering by category
 * and pagination support.
 * 
 * Requirements: 12.5
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Award,
  Users,
  Newspaper,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  date: Date;
  category: string;
  author?: string;
  imageUrl?: string;
  tags?: string[];
  readMoreUrl?: string;
}

export interface AlumniNewsProps {
  news: NewsItem[];
  categories?: string[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes("achievement") || categoryLower.includes("award")) {
    return Award;
  }
  if (categoryLower.includes("event") || categoryLower.includes("reunion")) {
    return Calendar;
  }
  if (categoryLower.includes("alumni") || categoryLower.includes("network")) {
    return Users;
  }
  if (categoryLower.includes("academic") || categoryLower.includes("research")) {
    return BookOpen;
  }
  if (categoryLower.includes("career") || categoryLower.includes("job")) {
    return TrendingUp;
  }
  
  return Newspaper;
};

const getCategoryColor = (category: string): "default" | "secondary" | "destructive" | "outline" => {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes("achievement") || categoryLower.includes("award")) {
    return "default";
  }
  if (categoryLower.includes("event") || categoryLower.includes("reunion")) {
    return "secondary";
  }
  
  return "outline";
};

// ============================================================================
// Component
// ============================================================================

export function AlumniNews({
  news,
  categories = [],
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: AlumniNewsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter news based on search and category
  const filteredNews = news.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Paginate filtered news
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNews = filteredNews.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  // Get unique categories from news if not provided
  const availableCategories = categories.length > 0
    ? categories
    : Array.from(new Set(news.map((item) => item.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">School News & Updates</h1>
        <p className="text-muted-foreground mt-2">
          Stay connected with the latest happenings at your alma mater
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-64">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedCategory !== "all") && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary">
                  Search: {searchQuery}
                  <button
                    onClick={() => handleSearchChange("")}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary">
                  Category: {selectedCategory}
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedNews.length} of {filteredNews.length} news items
        </p>
      </div>

      {/* News Grid */}
      {paginatedNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedNews.map((item) => {
            const CategoryIcon = getCategoryIcon(item.category);
            
            return (
              <Card key={item.id} className="flex flex-col hover:shadow-lg transition-shadow">
                {item.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getCategoryColor(item.category)} className="text-xs">
                      <CategoryIcon className="mr-1 h-3 w-3" />
                      {item.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-tight line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 mt-2">
                    {item.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {item.author && (
                    <p className="text-xs text-muted-foreground mb-3">
                      By {item.author}
                    </p>
                  )}
                  {item.readMoreUrl && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <a href={item.readMoreUrl} target="_blank" rel="noopener noreferrer">
                        Read More
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No news found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your filters to see more results"
                : "There are no news items available at the moment"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filteredNews.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1);

              if (!showPage) {
                // Show ellipsis
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Load More (for infinite scroll scenarios) */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More News"}
          </Button>
        </div>
      )}
    </div>
  );
}
