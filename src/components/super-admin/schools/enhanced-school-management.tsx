"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Users,
  Ban,
  AlertCircle,
  RefreshCw,
  PlayCircle,
  RotateCcw,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  getSchoolsWithFilters,
  resetSchoolOnboarding,
  launchSetupWizard,
  bulkResetOnboarding,
  bulkUpdateSchoolStatus
} from "@/lib/actions/school-management-actions";
import { useBreakpoint, mobileTableConfig, mobileClasses } from "@/lib/utils/mobile-responsive";
import { aria, focus, screenReader, formAccessibility, tableAccessibility } from "@/lib/utils/accessibility";
import { PLAN_LIMITS } from "@/lib/config/plan-features";

// Plan pricing — per-student INR from PLAN_LIMITS config
const getPlanPrice = (plan: string): string => {
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  if (!limits) return '0';
  return `₹${limits.pricePerStudent}/student`;
};

interface School {
  id: string;
  name: string;
  schoolCode: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  plan: 'STARTER' | 'GROWTH' | 'DOMINATE';
  isOnboarded: boolean;
  onboardingStep?: number;
  onboardingCompletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  domain?: string | null;
  subdomain?: string | null;
  tagline?: string | null;
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  userCounts: {
    administrators: number;
    teachers: number;
    students: number;
    total: number;
  };
  _count: {
    administrators: number;
    teachers: number;
    students: number;
    subscriptions: number;
  };
  subscription: {
    id: string;
    currentPeriodEnd: Date;
    status: string;
  } | null;
  subscriptions: Array<{
    id: string;
    isActive: boolean;
    startDate: Date;
    currentPeriodEnd: Date;
    status: string;
  }>;
  primaryAdmin?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface SchoolFilters {
  search?: string;
  status?: string;
  plan?: string;
  [key: string]: any;
}

interface EnhancedSchoolManagementProps {
  initialSchools?: School[];
}

export function EnhancedSchoolManagement({ initialSchools = [] }: EnhancedSchoolManagementProps) {
  const router = useRouter();
  const { isMobile, isTablet, breakpoint } = useBreakpoint();
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [onboardingFilter, setOnboardingFilter] = useState("ALL");
  const [filters, setFilters] = useState<SchoolFilters>({});

  // Mobile table configuration
  const tableClasses = mobileTableConfig.getTableClasses(isMobile);
  const columnVisibility = mobileTableConfig.getColumnVisibility(breakpoint);

  const fetchSchools = async (currentFilters: SchoolFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSchoolsWithFilters(currentFilters);

      if (result.success && result.data) {
        // Map the data to include missing fields for SchoolDetailsDialog
        const mappedSchools = result.data.map((school: any) => ({
          ...school,
          phone: school.phone || null,
          address: school.address || null,
          _count: {
            administrators: school.userCounts.administrators,
            teachers: school.userCounts.teachers,
            students: school.userCounts.students,
            subscriptions: school.subscription ? 1 : 0,
          },
          subscriptions: school.subscription ? [school.subscription] : [],
        }));
        setSchools(mappedSchools);
      } else {
        setError(result.error || "Failed to fetch schools");
        toast.error("Failed to load schools");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("Failed to load schools");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialSchools.length === 0) {
      fetchSchools(filters);
    }
  }, [filters, initialSchools.length]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, search: term }));
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setFilters(prev => ({
      ...prev,
      status: status === "ALL" ? undefined : status
    }));
  };

  const handlePlanFilter = (plan: string) => {
    setPlanFilter(plan);
    setFilters(prev => ({
      ...prev,
      plan: plan === "ALL" ? undefined : plan
    }));
  };

  const handleOnboardingFilter = (onboarding: string) => {
    setOnboardingFilter(onboarding);
    setFilters(prev => ({
      ...prev,
      isOnboarded: onboarding === "ALL" ? undefined : onboarding === "COMPLETED"
    }));
  };

  const handleAdvancedFilters = (advancedFilters: any) => {
    setFilters(prev => ({ ...prev, ...advancedFilters }));
  };

  const handleSchoolSelect = (schoolId: string, selected: boolean) => {
    if (selected) {
      setSelectedSchools(prev => [...prev, schoolId]);
    } else {
      setSelectedSchools(prev => prev.filter(id => id !== schoolId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedSchools(schools.map(school => school.id));
    } else {
      setSelectedSchools([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedSchools.length === 0) {
      toast.error("Please select schools first");
      return;
    }

    try {
      switch (action) {
        case "suspend":
          const suspendResult = await bulkUpdateSchoolStatus(selectedSchools, "SUSPENDED");
          if (suspendResult.success) {
            toast.success(suspendResult.message);
          } else {
            toast.error(suspendResult.error);
          }
          break;
        case "activate":
          const activateResult = await bulkUpdateSchoolStatus(selectedSchools, "ACTIVE");
          if (activateResult.success) {
            toast.success(activateResult.message);
          } else {
            toast.error(activateResult.error);
          }
          break;
        case "reset-onboarding":
          const result = await bulkResetOnboarding(selectedSchools);
          if (result.success) {
            toast.success(result.message);
          } else {
            toast.error(result.error);
          }
          break;
        default:
          toast.success(`${action} applied to ${selectedSchools.length} schools`);
      }
      setSelectedSchools([]);
      fetchSchools(filters);
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} schools`);
    }
  };

  const handleResetOnboarding = async (schoolId: string, schoolName: string) => {
    try {
      const result = await resetSchoolOnboarding(schoolId);
      if (result.success) {
        toast.success(result.data?.message || `Onboarding reset for ${schoolName}`);
        fetchSchools(filters);
      } else {
        toast.error(result.error || "Failed to reset onboarding");
      }
    } catch (error) {
      toast.error("Failed to reset onboarding");
    }
  };

  const handleLaunchSetupWizard = async (schoolId: string, schoolName: string) => {
    router.push(`/super-admin/schools/${schoolId}/setup`);
  };

  const handleSuspendSchool = async (schoolId: string, schoolName: string) => {
    try {
      const result = await bulkUpdateSchoolStatus([schoolId], "SUSPENDED");
      if (result.success) {
        toast.success(`${schoolName} has been suspended`);
        fetchSchools(filters);
      } else {
        toast.error(result.error || "Failed to suspend school");
      }
    } catch (error) {
      toast.error("Failed to suspend school");
    }
  };

  const handleActivateSchool = async (schoolId: string, schoolName: string) => {
    try {
      const result = await bulkUpdateSchoolStatus([schoolId], "ACTIVE");
      if (result.success) {
        toast.success(`${schoolName} has been activated`);
        fetchSchools(filters);
      } else {
        toast.error(result.error || "Failed to activate school");
      }
    } catch (error) {
      toast.error("Failed to activate school");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "default";
      case "SUSPENDED":
        return "destructive";
      case "INACTIVE":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan.toUpperCase()) {
      case "DOMINATE":
        return "default";
      case "GROWTH":
        return "secondary";
      case "STARTER":
        return "outline";
      default:
        return "outline";
    }
  };

  const getOnboardingStatusBadge = (school: School) => {
    if (school.isOnboarded) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    } else {
      const step = school.onboardingStep || 0;
      if (step === 0) {
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Step {step}/7
          </Badge>
        );
      }
    }
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading schools: {error}</span>
        </div>
        <Button onClick={() => fetchSchools(filters)} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={handlePlanFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Plans</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="GROWTH">Growth</SelectItem>
                <SelectItem value="DOMINATE">Dominate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={onboardingFilter} onValueChange={handleOnboardingFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Onboarding</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>

          {showAdvancedFilters && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Advanced filters will be implemented here
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowAdvancedFilters(false)}
              >
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedSchools.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedSchools.length} schools selected
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("suspend")}>
                  <Ban className="h-4 w-4 mr-1" />
                  Suspend
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("reset-onboarding")}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset Onboarding
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedSchools([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schools ({schools.length})</CardTitle>
          <CardDescription>
            Manage and monitor all schools in your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {schools.map((school) => (
                  <div
                    key={school.id}
                    className={`relative bg-white border rounded-xl p-4 hover:shadow-md transition-shadow ${
                      selectedSchools.includes(school.id) ? "ring-2 ring-blue-500 border-blue-300" : "border-gray-200"
                    }`}
                  >
                    {/* Select checkbox */}
                    <div className="absolute top-3 left-3">
                      <Checkbox
                        checked={selectedSchools.includes(school.id)}
                        onCheckedChange={(checked) => handleSchoolSelect(school.id, checked as boolean)}
                        {...aria.attributes.label(`Select ${school.name}`)}
                      />
                    </div>

                    {/* Actions menu */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/super-admin/schools/${school.id}/overview`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/super-admin/users?schoolId=${school.id}`)}>
                            <Users className="h-4 w-4 mr-2" />
                            Manage Users
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {school.isOnboarded ? (
                            <DropdownMenuItem onClick={() => handleResetOnboarding(school.id, school.name)} className="text-orange-600">
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset Onboarding
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleLaunchSetupWizard(school.id, school.name)} className="text-blue-600">
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Launch Setup Wizard
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {school.status === "ACTIVE" ? (
                            <DropdownMenuItem onClick={() => handleSuspendSchool(school.id, school.name)} className="text-red-600">
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivateSchool(school.id, school.name)} className="text-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* School avatar + name */}
                    <div className="flex items-center gap-3 pl-7 pr-6 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold text-base shrink-0">
                        {school.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => router.push(`/super-admin/schools/${school.id}`)}
                          className="font-semibold text-sm text-gray-900 hover:text-blue-600 truncate block text-left w-full"
                        >
                          {school.name}
                        </button>
                        <p className="text-xs text-gray-500 truncate">{school.email || school.schoolCode}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <Badge variant={getStatusBadgeVariant(school.status) as any} className="text-xs">
                        {school.status}
                      </Badge>
                      <Badge variant={getPlanBadgeVariant(school.plan) as any} className="text-xs">
                        {school.plan}
                      </Badge>
                      {getOnboardingStatusBadge(school)}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5 mt-2.5">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {school.userCounts.total} users · {school.userCounts.students} students
                      </span>
                      <span>
                        {new Date(school.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </span>
                    </div>

                    {school.subscription && (
                      <div className="text-xs text-gray-500 mt-1.5 flex items-center justify-between">
                        <span>{getPlanPrice(school.plan)}</span>
                        <span>Exp. {new Date(school.subscription.currentPeriodEnd).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}