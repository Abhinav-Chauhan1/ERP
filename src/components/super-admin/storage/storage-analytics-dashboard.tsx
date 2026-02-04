"use client";

/**
 * Storage Analytics Dashboard Component
 * 
 * Provides comprehensive storage analytics for super admin dashboard including:
 * - Overall storage usage statistics
 * - School-wise storage breakdown
 * - Usage trends and warnings
 * - Quota management controls
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  HardDrive, 
  AlertTriangle, 
  TrendingUp, 
  Settings, 
  RefreshCw,
  Download,
  Upload,
  Database,
  BarChart3,
  PieChart,
  Users,
  Building2,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StorageAnalytics {
  totalSchools: number;
  totalUsageMB: number;
  totalLimitMB: number;
  averageUsagePercentage: number;
  schoolsOverWarningThreshold: number;
  schoolsOverLimit: number;
  topUsageSchools: SchoolStorageUsage[];
}

interface SchoolStorageUsage {
  schoolId: string;
  schoolName: string;
  currentUsageMB: number;
  maxLimitMB: number;
  percentageUsed: number;
  planType: string;
  planStorageGB: number;
  isOverLimit: boolean;
  lastUpdated: Date;
}

interface StorageQuotaStatus {
  isWithinLimit: boolean;
  currentUsageMB: number;
  maxLimitMB: number;
  percentageUsed: number;
  warningThreshold: number;
  planStorageGB: number;
  isWarningTriggered: boolean;
  isHardLimitReached: boolean;
}

export function StorageAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<StorageAnalytics | null>(null);
  const [schoolsUsage, setSchoolsUsage] = useState<SchoolStorageUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolStorageUsage | null>(null);
  const [customQuotaDialog, setCustomQuotaDialog] = useState(false);
  const [customQuotaMB, setCustomQuotaMB] = useState("");
  const [sortBy, setSortBy] = useState("usage");
  const [sortOrder, setSortOrder] = useState("desc");
  const { toast } = useToast();

  // Fetch storage analytics data
  const fetchAnalytics = async () => {
    try {
      const [analyticsRes, schoolsRes] = await Promise.all([
        fetch("/api/storage/analytics"),
        fetch(`/api/storage/schools?sortBy=${sortBy}&order=${sortOrder}`)
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.data);
      }

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchoolsUsage(schoolsData.data.schools);
      }
    } catch (error) {
      console.error("Failed to fetch storage analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load storage analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  // Set custom quota for a school
  const handleSetCustomQuota = async () => {
    if (!selectedSchool || !customQuotaMB) return;

    try {
      const response = await fetch("/api/storage/quota", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId: selectedSchool.schoolId,
          limitMB: parseInt(customQuotaMB),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Storage quota updated for ${selectedSchool.schoolName}`,
        });
        setCustomQuotaDialog(false);
        setCustomQuotaMB("");
        setSelectedSchool(null);
        await fetchAnalytics();
      } else {
        throw new Error("Failed to update quota");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update storage quota",
        variant: "destructive",
      });
    }
  };

  // Sync quota from plan
  const handleSyncFromPlan = async (schoolId: string) => {
    try {
      const response = await fetch("/api/storage/quota/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schoolId }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Storage quota synced from subscription plan",
        });
        await fetchAnalytics();
      } else {
        throw new Error("Failed to sync quota");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync storage quota",
        variant: "destructive",
      });
    }
  };

  // Sync usage with R2
  const handleSyncWithR2 = async (schoolId: string) => {
    try {
      const response = await fetch("/api/storage/quota/sync", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schoolId }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Storage usage synced with R2",
        });
        await fetchAnalytics();
      } else {
        throw new Error("Failed to sync usage");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync storage usage",
        variant: "destructive",
      });
    }
  };

  // Format file size
  const formatFileSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  // Get usage status badge
  const getUsageBadge = (percentageUsed: number, isOverLimit: boolean) => {
    if (isOverLimit) {
      return <Badge variant="destructive">Over Limit</Badge>;
    }
    if (percentageUsed >= 80) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Warning</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>;
  };

  useEffect(() => {
    fetchAnalytics();
  }, [sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Storage Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage storage usage across all schools
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatFileSize(analytics.totalUsageMB)}
                  </p>
                  <p className="text-xs text-gray-500">
                    of {formatFileSize(analytics.totalLimitMB)} allocated
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Schools</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalSchools}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: {analytics.averageUsagePercentage.toFixed(1)}% usage
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Warning Alerts</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {analytics.schoolsOverWarningThreshold}
                  </p>
                  <p className="text-xs text-gray-500">
                    Schools over 80% usage
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Over Limit</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {analytics.schoolsOverLimit}
                  </p>
                  <p className="text-xs text-gray-500">
                    Schools exceeding quota
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Zap className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schools Usage Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>School Storage Usage</CardTitle>
              <CardDescription>
                Detailed storage usage breakdown by school
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schoolsUsage.map((school) => (
                <TableRow key={school.schoolId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{school.schoolName}</p>
                      <p className="text-xs text-gray-500">ID: {school.schoolId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{school.planType}</Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(school.currentUsageMB)}</TableCell>
                  <TableCell>{formatFileSize(school.maxLimitMB)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{school.percentageUsed.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={school.percentageUsed} 
                        className="h-2"
                        indicatorClassName={
                          school.isOverLimit 
                            ? "bg-red-500" 
                            : school.percentageUsed >= 80 
                            ? "bg-orange-500" 
                            : "bg-green-500"
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {getUsageBadge(school.percentageUsed, school.isOverLimit)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSchool(school);
                          setCustomQuotaMB(school.maxLimitMB.toString());
                          setCustomQuotaDialog(true);
                        }}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncFromPlan(school.schoolId)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncWithR2(school.schoolId)}
                      >
                        <Database className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Custom Quota Dialog */}
      <Dialog open={customQuotaDialog} onOpenChange={setCustomQuotaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Custom Storage Quota</DialogTitle>
            <DialogDescription>
              Set a custom storage quota for {selectedSchool?.schoolName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quota">Storage Limit (MB)</Label>
              <Input
                id="quota"
                type="number"
                value={customQuotaMB}
                onChange={(e) => setCustomQuotaMB(e.target.value)}
                placeholder="Enter storage limit in MB"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current plan limit: {selectedSchool?.planStorageGB} GB ({(selectedSchool?.planStorageGB || 0) * 1024} MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomQuotaDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetCustomQuota}>
              Update Quota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}