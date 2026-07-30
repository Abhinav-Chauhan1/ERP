"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2 } from "lucide-react";
import { getNormalFeeAnalyticsByClass, type NormalFeeClassAnalytics } from "@/lib/actions/miscFeeActions";
import { formatCurrency } from "@/lib/utils/export-utils";
import toast from "react-hot-toast";

interface NormalFeeAnalyticsProps {
  academicYears?: Array<{ id: string; name: string }>;
}

export function NormalFeeAnalyticsComponent({ academicYears = [] }: NormalFeeAnalyticsProps) {
  const [rows, setRows] = useState<NormalFeeClassAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYearId, setAcademicYearId] = useState<string | undefined>(undefined);

  const fetchAnalytics = useCallback(async function () {
    setLoading(true);
    try {
      const result = await getNormalFeeAnalyticsByClass(academicYearId);
      if (result.success && result.data) {
        setRows(result.data);
      } else {
        toast.error(result.error || "Failed to fetch normal fee analytics");
      }
    } catch (error) {
      console.error("Error fetching normal fee analytics:", error);
      toast.error("Failed to fetch normal fee analytics");
    } finally {
      setLoading(false);
    }
  }, [academicYearId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const totals = rows.reduce(
    (acc, row) => ({
      studentsWithNormalFee: acc.studentsWithNormalFee + row.studentsWithNormalFee,
      totalAmount: acc.totalAmount + row.totalAmount,
      totalDiscount: acc.totalDiscount + row.totalDiscount,
      totalNetAmount: acc.totalNetAmount + row.totalNetAmount,
      totalPaid: acc.totalPaid + row.totalPaid,
      totalBalance: acc.totalBalance + row.totalBalance,
    }),
    {
      studentsWithNormalFee: 0,
      totalAmount: 0,
      totalDiscount: 0,
      totalNetAmount: 0,
      totalPaid: 0,
      totalBalance: 0,
    }
  );

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Class Wise Fees</CardTitle>
          <CardDescription>Class-wise breakdown of Normal Fee collections</CardDescription>
        </div>
        <div className="w-full sm:w-64 space-y-2">
          <Select
            value={academicYearId || "all"}
            onValueChange={(value) => setAcademicYearId(value === "all" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All academic years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All academic years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Net Payable</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No fee records found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {rows.map((row) => (
                    <TableRow key={row.classId}>
                      <TableCell className="font-medium">{row.className}</TableCell>
                      <TableCell className="text-right">{row.studentsWithNormalFee}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalAmount)}</TableCell>
                      <TableCell className="text-right">
                        {row.totalDiscount > 0 ? formatCurrency(row.totalDiscount) : "-"}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalNetAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalPaid)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalBalance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{totals.studentsWithNormalFee}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalAmount)}</TableCell>
                    <TableCell className="text-right">
                      {totals.totalDiscount > 0 ? formatCurrency(totals.totalDiscount) : "-"}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalNetAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalPaid)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalBalance)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
