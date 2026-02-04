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
import { SchoolDetailsDialog } from "./school-details-dialog";
import { useBreakpoint, mobileTableConfig, mobileClasses } from "@/lib/utils/mobile-responsive";
import { aria, focus, screenReader, formAccessibility, tableAccessibility } from "@/lib/utils/accessibility";

// Plan pricing mapping
const getPlanPrice = (plan: string): string => {
  const planPricing = {
    STARTER: 29,
    GROWTH: 49,
    DOMINATE: 99,
  };
  const price = planPricing[plan as keyof typeof planPricing] || 0;
  return price.toLocaleString();
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
    endDate: Date;
    paymentStatus: string;
  } | null;
  subscriptions: Array<{
    endDate: Date;
    paymentStatus: string;
  }>;
  primaryAdmin: {
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
  const [selectedSchoolForDetails, setSelectedSchoolForDetails] = useState<School | null>(null);

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
    console.log("🚀 Launch Setup Wizard clicked for:", schoolName, schoolId);

    // Redirect to the existing setup wizard page
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
      case "ENTERPRISE":
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">School Management</h2>
          <p className="text-muted-foreground">
            Manage all schools in your platform
          </p>
        </div>
        <Button onClick={() => router.push('/super-admin/schools/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add School
        </Button>
      </div>

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
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
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
              {/* Desktop Table View */}
              <div className={tableClasses.table}>
                <Table {...tableAccessibility.getTableProps("Schools list")}>
                  <TableHeader>
                    <TableRow {...tableAccessibility.getRowProps()}>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedSchools.length === schools.length && schools.length > 0}
                          onCheckedChange={handleSelectAll}
                          {...aria.attributes.label("Select all schools")}
                        />
                      </TableHead>
                      <TableHead {...tableAccessibility.getHeaderProps()}>School</TableHead>
                      <TableHead {...tableAccessibility.getHeaderProps()} className={columnVisibility.hideOnMobile}>Status</TableHead>
                      <TableHead {...tableAccessibility.getHeaderProps()} className={columnVisibility.hideOnMobile}>Plan</TableHead>
                      <TableHead {...tableAccessibility.getHeaderProps()} className={columnVisibility.hideOnTablet}>Onboarding</TableHead>
                      <TableHead {...tableAccessibility.getHeaderProps()} className={columnVisibility.hideOnTablet}>Users</TableHead>
                      <TableHead {...tableAccessibility.getHeaderProps()} className={columnVisibility.hideOnTablet}>Subscription</TableHead>
                      <TableHead {...tableAccessibility.getHeaderProps()} className={columnVisibility.hideOnTablet}>Created</TableHead>
                      <TableHead {...tableAccessibility.getHeaderProps()}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school.id} {...tableAccessibility.getRowProps(selectedSchools.includes(school.id))}>
                        <TableCell {...tableAccessibility.getCellProps()}>
                          <Checkbox
                            checked={selectedSchools.includes(school.id)}
                            onCheckedChange={(checked) =>
                              handleSchoolSelect(school.id, checked as boolean)
                            }
                            {...aria.attributes.label(`Select ${school.name}`)}
                          />
                        </TableCell>
                        <TableCell {...tableAccessibility.getCellProps(true)}>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                              {school.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{school.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {school.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell {...tableAccessibility.getCellProps()} className={columnVisibility.hideOnMobile}>
                          <Badge variant={getStatusBadgeVariant(school.status) as any}>
                            {school.status}
                          </Badge>
                        </TableCell>
                        <TableCell {...tableAccessibility.getCellProps()} className={columnVisibility.hideOnMobile}>
                          <Badge variant={getPlanBadgeVariant(school.plan) as any}>
                            {school.plan}
                          </Badge>
                        </TableCell>
                        <TableCell {...tableAccessibility.getCellProps()} className={columnVisibility.hideOnTablet}>
                          {getOnboardingStatusBadge(school)}
                        </TableCell>
                        <TableCell {...tableAccessibility.getCellProps()} className={columnVisibility.hideOnTablet}>
                          <div className="text-sm">
                            <div>{school.userCounts.total} total</div>
                            <div className="text-muted-foreground">
                              {school.userCounts.students} students
                            </div>
                          </div>
                        </TableCell>
                        <TableCell {...tableAccessibility.getCellProps()} className={columnVisibility.hideOnTablet}>
                          {school.subscription ? (
                            <div className="text-sm">
                              <div>₹{getPlanPrice(school.plan)}</div>
                              <div className="text-muted-foreground">
                                Expires {new Date(school.subscription.endDate).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No subscription</span>
                          )}
                        </TableCell>
                        <TableCell {...tableAccessibility.getCellProps()} className={columnVisibility.hideOnTablet}>
                          {new Date(school.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell {...tableAccessibility.getCellProps()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={focus.classes.visible}
                                {...aria.attributes.label(`Actions for ${school.name}`)}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedSchoolForDetails(school)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/super-admin/users?schoolId=${school.id}`)}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Manage Users
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {school.isOnboarded ? (
                                <DropdownMenuItem
                                  onClick={() => handleResetOnboarding(school.id, school.name)}
                                  className="text-orange-600"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reset Onboarding
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleLaunchSetupWizard(school.id, school.name)}
                                  className="text-blue-600"
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Launch Setup Wizard
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {school.status === "ACTIVE" ? (
                                <DropdownMenuItem
                                  onClick={() => handleSuspendSchool(school.id, school.name)}
                                  className="text-red-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleActivateSchool(school.id, school.name)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className={tableClasses.cardContainer}>
                <div className="space-y-4">
                  {schools.map((school) => (
                    <Card key={school.id} className="relative">
                      <CardContent className={`${mobileClasses.card.mobile} ${selectedSchools.includes(school.id) ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <Checkbox
                              checked={selectedSchools.includes(school.id)}
                              onCheckedChange={(checked) =>
                                handleSchoolSelect(school.id, checked as boolean)
                              }
                              {...aria.attributes.label(`Select ${school.name}`)}
                            />
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                              {school.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-base truncate">{school.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">{school.email}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`${focus.classes.visible} min-h-[44px] min-w-[44px]`}
                                {...aria.attributes.label(`Actions for ${school.name}`)}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedSchoolForDetails(school)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/super-admin/users?schoolId=${school.id}`)}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Manage Users
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {school.isOnboarded ? (
                                <DropdownMenuItem
                                  onClick={() => handleResetOnboarding(school.id, school.name)}
                                  className="text-orange-600"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reset Onboarding
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleLaunchSetupWizard(school.id, school.name)}
                                  className="text-blue-600"
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Launch Setup Wizard
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {school.status === "ACTIVE" ? (
                                <DropdownMenuItem
                                  onClick={() => handleSuspendSchool(school.id, school.name)}
                                  className="text-red-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleActivateSchool(school.id, school.name)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="mt-1">
                              <Badge variant={getStatusBadgeVariant(school.status) as any}>
                                {school.status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Plan:</span>
                            <div className="mt-1">
                              <Badge variant={getPlanBadgeVariant(school.plan) as any}>
                                {school.plan}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Users:</span>
                            <div className="mt-1">
                              <div>{school.userCounts.total} total</div>
                              <div className="text-xs text-muted-foreground">
                                {school.userCounts.students} students
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Onboarding:</span>
                            <div className="mt-1">
                              {getOnboardingStatusBadge(school)}
                            </div>
                          </div>
                        </div>

                        {school.subscription && (
                          <div className="mt-3 pt-3 border-t text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Subscription:</span>
                              <div className="text-right">
                                <div>₹{getPlanPrice(school.plan)}</div>
                                <div className="text-xs text-muted-foreground">
                                  Expires {new Date(school.subscription.endDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* School Details Dialog */}
      <SchoolDetailsDialog
        school={selectedSchoolForDetails}
        open={!!selectedSchoolForDetails}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSchoolForDetails(null);
          }
        }}
        onSchoolUpdate={() => {
          fetchSchools(filters);
        }}
      />
    </div>
  );
}