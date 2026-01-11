"use client";

/**
 * Alumni Directory View Component
 * 
 * Displays other alumni with privacy controls for the alumni portal.
 * Respects privacy settings and provides search functionality.
 * 
 * Requirements: 12.7
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Users,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface AlumniProfile {
  id: string;
  studentName: string;
  admissionId: string;
  graduationDate: Date;
  finalClass: string;
  finalSection: string;
  currentOccupation?: string;
  currentEmployer?: string;
  currentCity?: string;
  currentState?: string;
  currentEmail?: string;
  collegeName?: string;
  higherEducation?: string;
  profilePhoto?: string;
  allowCommunication: boolean;
  // Privacy settings
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  showOccupation: boolean;
}

export interface AlumniDirectoryViewProps {
  alumni: AlumniProfile[];
  currentAlumniId: string; // The logged-in alumni's ID
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: DirectoryFilters) => void;
  isLoading?: boolean;
}

export interface DirectoryFilters {
  graduationYear?: string;
  finalClass?: string;
  currentCity?: string;
  occupation?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getInitials = (name: string): string => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatGraduationYear = (date: Date): string => {
  return new Date(date).getFullYear().toString();
};

// ============================================================================
// Component
// ============================================================================

export function AlumniDirectoryView({
  alumni,
  currentAlumniId,
  onSearch,
  onFilterChange,
  isLoading = false,
}: AlumniDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGraduationYear, setSelectedGraduationYear] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const itemsPerPage = 12;

  // Filter alumni based on search and filters
  const filteredAlumni = alumni.filter((profile) => {
    // Don't show the current user in the directory
    if (profile.id === currentAlumniId) {
      return false;
    }

    const matchesSearch =
      searchQuery === "" ||
      profile.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.admissionId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear =
      selectedGraduationYear === "all" ||
      formatGraduationYear(profile.graduationDate) === selectedGraduationYear;

    const matchesClass =
      selectedClass === "all" || profile.finalClass === selectedClass;

    const matchesCity =
      selectedCity === "all" || profile.currentCity === selectedCity;

    return matchesSearch && matchesYear && matchesClass && matchesCity;
  });

  // Paginate filtered alumni
  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlumni = filteredAlumni.slice(startIndex, endIndex);

  // Get unique values for filters
  const graduationYears = Array.from(
    new Set(alumni.map((a) => formatGraduationYear(a.graduationDate)))
  ).sort((a, b) => b.localeCompare(a));

  const classes = Array.from(new Set(alumni.map((a) => a.finalClass))).sort();

  const cities = Array.from(
    new Set(alumni.map((a) => a.currentCity).filter(Boolean) as string[])
  ).sort();

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle filter changes
  const handleFilterChange = (
    type: keyof DirectoryFilters,
    value: string
  ) => {
    setCurrentPage(1);

    const filters: DirectoryFilters = {};
    
    if (type === "graduationYear") {
      setSelectedGraduationYear(value);
      if (value !== "all") filters.graduationYear = value;
    } else if (type === "finalClass") {
      setSelectedClass(value);
      if (value !== "all") filters.finalClass = value;
    } else if (type === "currentCity") {
      setSelectedCity(value);
      if (value !== "all") filters.currentCity = value;
    }

    if (onFilterChange) {
      onFilterChange(filters);
    }
  };

  // Handle profile view
  const handleViewProfile = (profile: AlumniProfile) => {
    setSelectedAlumni(profile);
    setShowProfileDialog(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGraduationYear("all");
    setSelectedClass("all");
    setSelectedCity("all");
    setCurrentPage(1);
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedGraduationYear !== "all" ||
    selectedClass !== "all" ||
    selectedCity !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alumni Directory</h1>
        <p className="text-muted-foreground mt-2">
          Connect with fellow alumni from your alma mater
        </p>
      </div>

      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Privacy Protected
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Only alumni who have opted to share their information are visible in this directory.
                Contact information is shown based on individual privacy preferences.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission ID..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Graduation Year Filter */}
              <Select
                value={selectedGraduationYear}
                onValueChange={(value) => handleFilterChange("graduationYear", value)}
              >
                <SelectTrigger>
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Graduation Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {graduationYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Class Filter */}
              <Select
                value={selectedClass}
                onValueChange={(value) => handleFilterChange("finalClass", value)}
              >
                <SelectTrigger>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Final Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* City Filter */}
              <Select
                value={selectedCity}
                onValueChange={(value) => handleFilterChange("currentCity", value)}
              >
                <SelectTrigger>
                  <MapPin className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Current City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters & Clear Button */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary">Search: {searchQuery}</Badge>
                  )}
                  {selectedGraduationYear !== "all" && (
                    <Badge variant="secondary">Year: {selectedGraduationYear}</Badge>
                  )}
                  {selectedClass !== "all" && (
                    <Badge variant="secondary">Class: {selectedClass}</Badge>
                  )}
                  {selectedCity !== "all" && (
                    <Badge variant="secondary">City: {selectedCity}</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedAlumni.length} of {filteredAlumni.length} alumni
        </p>
      </div>

      {/* Alumni Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-3">
                  <div className="h-20 w-20 rounded-full bg-muted" />
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginatedAlumni.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedAlumni.map((profile) => (
            <Card
              key={profile.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewProfile(profile)}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  {/* Avatar */}
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.profilePhoto} alt={profile.studentName} />
                    <AvatarFallback className="text-lg">
                      {getInitials(profile.studentName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">
                      {profile.studentName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {profile.admissionId}
                    </p>
                  </div>

                  {/* Graduation Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">
                      {profile.finalClass} • {formatGraduationYear(profile.graduationDate)}
                    </Badge>
                  </div>

                  {/* Current Info (if visible) */}
                  <div className="w-full space-y-2 text-sm">
                    {profile.showOccupation && profile.currentOccupation && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{profile.currentOccupation}</span>
                      </div>
                    )}
                    {profile.currentCity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{profile.currentCity}</span>
                      </div>
                    )}
                    {profile.collegeName && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{profile.collegeName}</span>
                      </div>
                    )}
                  </div>

                  {/* View Profile Button */}
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No alumni found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results"
                : "There are no alumni profiles available at the moment"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filteredAlumni.length > itemsPerPage && (
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
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1);

              if (!showPage) {
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

      {/* Profile Detail Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedAlumni && (
            <>
              <DialogHeader>
                <DialogTitle>Alumni Profile</DialogTitle>
                <DialogDescription>
                  Information shared by this alumni member
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={selectedAlumni.profilePhoto}
                      alt={selectedAlumni.studentName}
                    />
                    <AvatarFallback className="text-2xl">
                      {getInitials(selectedAlumni.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedAlumni.studentName}</h2>
                    <p className="text-muted-foreground">{selectedAlumni.admissionId}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge>
                        {selectedAlumni.finalClass} • {selectedAlumni.finalSection}
                      </Badge>
                      <Badge variant="outline">
                        Graduated {formatGraduationYear(selectedAlumni.graduationDate)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="space-y-4">
                  {/* Current Occupation */}
                  {selectedAlumni.showOccupation && selectedAlumni.currentOccupation && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Current Occupation
                      </h3>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{selectedAlumni.currentOccupation}</p>
                          {selectedAlumni.currentEmployer && (
                            <p className="text-sm text-muted-foreground">
                              at {selectedAlumni.currentEmployer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {selectedAlumni.currentCity && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Current Location
                      </h3>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p>
                          {selectedAlumni.currentCity}
                          {selectedAlumni.currentState && `, ${selectedAlumni.currentState}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Higher Education */}
                  {selectedAlumni.higherEducation && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Higher Education
                      </h3>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{selectedAlumni.higherEducation}</p>
                          {selectedAlumni.collegeName && (
                            <p className="text-sm text-muted-foreground">
                              {selectedAlumni.collegeName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {selectedAlumni.allowCommunication && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Contact Information
                      </h3>
                      {selectedAlumni.showEmail && selectedAlumni.currentEmail ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${selectedAlumni.currentEmail}`}
                            className="text-blue-600 hover:underline"
                          >
                            {selectedAlumni.currentEmail}
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <EyeOff className="h-4 w-4" />
                          <p className="text-sm">Contact information is private</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Privacy Notice */}
                {!selectedAlumni.allowCommunication && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        This alumni has chosen to limit their contact information visibility.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
