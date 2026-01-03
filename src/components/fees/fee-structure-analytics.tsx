"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, TrendingUp, Users, DollarSign, FileText, Download } from "lucide-react";
import { getFeeStructureAnalytics } from "@/lib/actions/feeStructureActions";
import type { FeeStructureAnalytics, AnalyticsFilters } from "@/lib/services/fee-structure-analytics-service";
import toast from "react-hot-toast";

interface FeeStructureAnalyticsProps {
  academicYears?: Array<{ id: string; name: string }>;
  classes?: Array<{ id: string; name: string }>;
  onExport?: (format: "csv" | "excel") => void;
}

export function FeeStructureAnalyticsComponent({
  academicYears = [],
  classes = [],
  onExport,
}: FeeStructureAnalyticsProps) {
  const [analytics, setAnalytics] = useState<FeeStructureAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const fetchAnalytics = useCallback(async function () {
    setLoading(true);
    try {
      const result = await getFeeStructureAnalytics(filters);
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        toast.error(result.error || "Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  function handleFilterChange(key: keyof AnalyticsFilters, value: string | boolean | undefined) {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter analytics by academic year, class, or status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select
                value={filters.academicYearId || ""}
                onValueChange={(value) => handleFilterChange("academicYearId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All academic years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All academic years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select
                value={filters.classId || ""}
                onValueChange={(value) => handleFilterChange("classId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.isActive === undefined ? "" : filters.isActive.toString()}
                onValueChange={(value) =>
                  handleFilterChange("isActive", value === "" ? undefined : value === "true")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Structures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStructures}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.activeStructures} active, {analytics.templateStructures} templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Affected</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.structuresByAcademicYear.reduce(
                (sum, year) => sum + year.totalStudentsAffected,
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all academic years
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Projection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                analytics.structuresByAcademicYear.reduce(
                  (sum, year) => sum + year.totalRevenueProjection,
                  0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total projected revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Academic Year Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Academic Year Breakdown</CardTitle>
            <CardDescription>
              Fee structure statistics by academic year
            </CardDescription>
          </div>
          {onExport && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport("csv")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport("excel")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Academic Year</TableHead>
                <TableHead className="text-right">Total Structures</TableHead>
                <TableHead className="text-right">Active Structures</TableHead>
                <TableHead className="text-right">Students Affected</TableHead>
                <TableHead className="text-right">Revenue Projection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.structuresByAcademicYear.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                analytics.structuresByAcademicYear.map((year) => (
                  <TableRow key={year.academicYearId}>
                    <TableCell className="font-medium">{year.academicYearName}</TableCell>
                    <TableCell className="text-right">{year.totalStructures}</TableCell>
                    <TableCell className="text-right">{year.activeStructures}</TableCell>
                    <TableCell className="text-right">{year.totalStudentsAffected}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(year.totalRevenueProjection)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Structure List */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Structure Details</CardTitle>
          <CardDescription>
            Detailed breakdown of each fee structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.structureDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No fee structures found
                  </TableCell>
                </TableRow>
              ) : (
                analytics.structureDetails.map((structure) => (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">{structure.name}</TableCell>
                    <TableCell>{structure.academicYearName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {structure.classNames.slice(0, 3).map((className, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {className}
                          </Badge>
                        ))}
                        {structure.classNames.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{structure.classNames.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {structure.isActive && (
                          <Badge variant="default" className="w-fit">
                            Active
                          </Badge>
                        )}
                        {structure.isTemplate && (
                          <Badge variant="outline" className="w-fit">
                            Template
                          </Badge>
                        )}
                        {!structure.isActive && !structure.isTemplate && (
                          <Badge variant="secondary" className="w-fit">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{structure.studentsAffected}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(structure.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(structure.revenueProjection)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
