"use client";

/**
 * Storage Overview Component for Super Admin Dashboard
 * 
 * Provides a quick overview of storage usage across all schools
 * for integration into the main super admin dashboard
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  HardDrive,
  AlertTriangle,
  Building2,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface StorageAnalytics {
  totalSchools: number;
  totalUsageMB: number;
  totalLimitMB: number;
  averageUsagePercentage: number;
  schoolsOverWarningThreshold: number;
  schoolsOverLimit: number;
  topUsageSchools: Array<{
    schoolId: string;
    schoolName: string;
    currentUsageMB: number;
    maxLimitMB: number;
    percentageUsed: number;
    isOverLimit: boolean;
  }>;
}

interface StorageOverviewProps {
  storageData?: StorageAnalytics | null;
}

export function StorageOverview({ storageData }: StorageOverviewProps) {
  // Use the passed storage data or provide defaults
  const analytics = storageData || {
    totalSchools: 0,
    totalUsageMB: 0,
    totalLimitMB: 0,
    averageUsagePercentage: 0,
    schoolsOverWarningThreshold: 0,
    schoolsOverLimit: 0,
    topUsageSchools: []
  };

  // Format file size
  const formatFileSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  // Calculate overall usage percentage
  const overallUsagePercentage = analytics.totalLimitMB > 0
    ? (analytics.totalUsageMB / analytics.totalLimitMB) * 100
    : 0;

  // Show loading state if no data provided
  if (!storageData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if no analytics data
  if (!analytics || analytics.totalSchools === 0) {
    return (
      <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-[hsl(var(--border))]">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Unable to load storage analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Usage */}
        <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-[hsl(var(--border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <HardDrive className="h-4 w-4 mr-2" />
              Total Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Used</span>
                <span className="text-lg font-semibold text-foreground">
                  {formatFileSize(analytics.totalUsageMB)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Allocated</span>
                <span className="text-sm font-medium text-foreground">
                  {formatFileSize(analytics.totalLimitMB)}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Overall Usage</span>
                <span className="font-medium">{overallUsagePercentage.toFixed(1)}%</span>
              </div>
              <Progress
                value={overallUsagePercentage}
                className="h-2"
                indicatorClassName={
                  overallUsagePercentage >= 90
                    ? "bg-red-500"
                    : overallUsagePercentage >= 80
                      ? "bg-orange-500"
                      : "bg-green-500"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Schools Overview */}
        <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-[hsl(var(--border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Schools Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Schools</span>
                <span className="text-lg font-semibold text-foreground">
                  {analytics.totalSchools}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Usage</span>
                <span className="text-sm font-medium text-foreground">
                  {analytics.averageUsagePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Alerts */}
        <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-[hsl(var(--border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Usage Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Warning (80%+)</span>
                <span className={`text-lg font-semibold ${analytics.schoolsOverWarningThreshold > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                  {analytics.schoolsOverWarningThreshold}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Over Limit</span>
                <span className={`text-sm font-medium ${analytics.schoolsOverLimit > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                  {analytics.schoolsOverLimit}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-[hsl(var(--border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-[hsl(var(--card))]/80"
              asChild
            >
              <Link href="/super-admin/storage">
                <ExternalLink className="h-3 w-3 mr-2" />
                View Details
              </Link>
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Manage quotas & sync usage
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Usage Schools */}
      {analytics.topUsageSchools.length > 0 && (
        <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-[hsl(var(--border))]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Top Storage Usage Schools
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/super-admin/storage">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topUsageSchools.slice(0, 5).map((school) => (
                <div key={school.schoolId} className="flex items-center justify-between p-3 bg-[hsl(var(--muted))] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">
                        {school.schoolName}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(school.currentUsageMB)} / {formatFileSize(school.maxLimitMB)}
                        </span>
                        {school.isOverLimit ? (
                          <Badge variant="destructive">Over Limit</Badge>
                        ) : school.percentageUsed >= 80 ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Warning
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Normal
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Usage: {school.percentageUsed.toFixed(1)}%</span>
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}