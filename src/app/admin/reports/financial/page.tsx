"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, Download, FileText, DollarSign, TrendingDown,
  CreditCard, PieChart, Receipt, Wallet, Loader2
} from "lucide-react";
import {
  getFeeCollectionReport,
  getExpenseAnalysis,
  getOutstandingPayments,
  getBudgetVsActualReport,
  getIncomeStatement,
} from "@/lib/actions/financialReportActions";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";

export default function FinancialReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const loadAcademicYears = async () => {
    try {
      const result = await getAcademicYears();
      if (result.success) {
        setAcademicYears(result.data || []);
      }
    } catch (error) {
      console.error("Error loading academic years:", error);
    }
  };

  const generateReport = async (reportType: string) => {
    setLoading(true);
    try {
      const filters: any = {
        academicYearId: selectedAcademicYear && selectedAcademicYear !== "all" ? selectedAcademicYear : undefined,
        category: selectedCategory && selectedCategory !== "all" ? selectedCategory : undefined,
      };

      // Add date filters based on period
      if (selectedPeriod === "month") {
        const now = new Date();
        filters.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filters.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (selectedPeriod === "quarter") {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        filters.startDate = new Date(now.getFullYear(), quarter * 3, 1);
        filters.endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      } else if (selectedPeriod === "year") {
        const now = new Date();
        filters.startDate = new Date(now.getFullYear(), 0, 1);
        filters.endDate = new Date(now.getFullYear(), 11, 31);
      }

      let result;
      switch (reportType) {
        case "collection":
          result = await getFeeCollectionReport(filters);
          break;
        case "expenses":
          result = await getExpenseAnalysis(filters);
          break;
        case "outstanding":
          result = await getOutstandingPayments(filters);
          break;
        case "budget":
          result = await getBudgetVsActualReport(filters);
          break;
        case "income":
          result = await getIncomeStatement(filters);
          break;
        default:
          throw new Error("Invalid report type");
      }

      if (result.success) {
        setReportData({ type: reportType, data: result.data });
        toast.success("Report generated successfully");
      } else {
        toast.error(result.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      title: "Fee Collection Report",
      description: "Detailed analysis of fee collection and outstanding payments",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Expense Analysis",
      description: "Breakdown of institutional expenses by category",
      icon: TrendingDown,
      color: "bg-red-500",
    },
    {
      title: "Outstanding Payments",
      description: "List of pending fee payments and defaulters",
      icon: CreditCard,
      color: "bg-orange-500",
    },
    {
      title: "Budget vs Actual",
      description: "Comparison of budgeted vs actual expenses",
      icon: PieChart,
      color: "bg-blue-500",
    },
    {
      title: "Income Statement",
      description: "Comprehensive income and expenditure statement",
      icon: Receipt,
      color: "bg-purple-500",
    },
    {
      title: "Cash Flow Report",
      description: "Analysis of cash inflows and outflows",
      icon: Wallet,
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/reports">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate financial reports and analyze revenue & expenses
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select time period and criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="TUITION">Tuition</SelectItem>
                  <SelectItem value="TRANSPORT">Transport</SelectItem>
                  <SelectItem value="LIBRARY">Library</SelectItem>
                  <SelectItem value="LABORATORY">Laboratory</SelectItem>
                  <SelectItem value="SPORTS">Sports</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          const reportKey = ["collection", "expenses", "outstanding", "budget", "income", "cashflow"][index];
          return (
            <Card key={report.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`${report.color} p-2 rounded-lg text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1" 
                    onClick={() => generateReport(reportKey)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-1" />
                    )}
                    Generate
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Report Results</CardTitle>
            <CardDescription>
              Generated report data for {reportData.type}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.type === "collection" && (
                <div>
                  <h3 className="font-semibold mb-2">Fee Collection Summary</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm text-blue-600">Total Amount</div>
                      <div className="text-xl font-bold">₹{reportData.data.summary?.totalAmount?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-sm text-green-600">Paid Amount</div>
                      <div className="text-xl font-bold">₹{reportData.data.summary?.paidAmount?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-sm text-orange-600">Pending Amount</div>
                      <div className="text-xl font-bold">₹{reportData.data.summary?.pendingAmount?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-sm text-purple-600">Collection Rate</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.collectionRate?.toFixed(1) || 0}%</div>
                    </div>
                  </div>
                </div>
              )}
              
              {reportData.type === "expenses" && (
                <div>
                  <h3 className="font-semibold mb-2">Expense Analysis</h3>
                  <div className="grid gap-4 md:grid-cols-3 mb-4">
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-sm text-red-600">Total Expenses</div>
                      <div className="text-xl font-bold">₹{reportData.data.summary?.totalExpenses?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm text-blue-600">Total Count</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.totalCount || 0}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-sm text-purple-600">Average Expense</div>
                      <div className="text-xl font-bold">₹{reportData.data.summary?.averageExpense?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">By Category</h4>
                    {reportData.data.byCategory?.map((category: any) => (
                      <div key={category.category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{category.category}</span>
                        <div className="text-right">
                          <div className="font-bold">₹{category.totalAmount.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{category.count} expenses</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {reportData.type === "outstanding" && (
                <div>
                  <h3 className="font-semibold mb-2">Outstanding Payments</h3>
                  <div className="grid gap-4 md:grid-cols-4 mb-4">
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-sm text-orange-600">Total Outstanding</div>
                      <div className="text-xl font-bold">₹{reportData.data.summary?.totalOutstanding?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-sm text-red-600">Overdue Amount</div>
                      <div className="text-xl font-bold">₹{reportData.data.summary?.overdueAmount?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm text-blue-600">Total Count</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.totalCount || 0}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-sm text-purple-600">Overdue Count</div>
                      <div className="text-xl font-bold">{reportData.data.summary?.overdueCount || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
