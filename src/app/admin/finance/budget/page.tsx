"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, PlusCircle, Search, Filter, 
  Building, Wallet, ArrowUp, ArrowDown, 
  Edit, Trash2, Eye, DollarSign, 
  BarChart4, Download, Printer, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Chart } from "@/components/dashboard/chart";

// Mock data for academic years
const academicYears = [
  { id: "1", name: "2023-2024", startDate: "2023-08-15", endDate: "2024-05-31", isActive: true },
  { id: "2", name: "2022-2023", startDate: "2022-08-16", endDate: "2023-06-01", isActive: false },
  { id: "3", name: "2024-2025", startDate: "2024-08-14", endDate: "2025-05-30", isActive: false },
];

// Mock data for budget categories
const budgetCategories = [
  { id: "salaries", name: "Staff Salaries", color: "bg-blue-100 text-blue-800" },
  { id: "infrastructure", name: "Infrastructure", color: "bg-purple-100 text-purple-800" },
  { id: "utilities", name: "Utilities", color: "bg-green-100 text-green-800" },
  { id: "supplies", name: "Educational Supplies", color: "bg-amber-100 text-amber-800" },
  { id: "events", name: "School Events", color: "bg-pink-100 text-pink-800" },
  { id: "maintenance", name: "Maintenance", color: "bg-indigo-100 text-indigo-800" },
  { id: "technology", name: "Technology", color: "bg-red-100 text-red-800" },
  { id: "miscellaneous", name: "Miscellaneous", color: "bg-gray-100 text-gray-800" },
];

// Mock data for budget items
const budgets = [
  {
    id: "b1",
    title: "Staff Salaries",
    category: "salaries",
    academicYear: "2023-2024",
    allocatedAmount: 450000,
    usedAmount: 225000,
    remainingAmount: 225000,
    status: "ACTIVE",
    startDate: "2023-08-15",
    endDate: "2024-05-31",
    description: "Budget allocation for teaching and non-teaching staff salaries",
  },
  {
    id: "b2",
    title: "School Supplies",
    category: "supplies",
    academicYear: "2023-2024",
    allocatedAmount: 75000,
    usedAmount: 45000,
    remainingAmount: 30000,
    status: "ACTIVE",
    startDate: "2023-08-15",
    endDate: "2024-05-31",
    description: "Budget for classroom materials, books, and other educational supplies",
  },
  {
    id: "b3",
    title: "Facility Maintenance",
    category: "maintenance",
    academicYear: "2023-2024",
    allocatedAmount: 120000,
    usedAmount: 72000,
    remainingAmount: 48000,
    status: "ACTIVE",
    startDate: "2023-08-15",
    endDate: "2024-05-31",
    description: "Funds for ongoing building maintenance, repairs, and cleaning services",
  },
  {
    id: "b4",
    title: "IT Infrastructure",
    category: "technology",
    academicYear: "2023-2024",
    allocatedAmount: 85000,
    usedAmount: 65000,
    remainingAmount: 20000,
    status: "ACTIVE",
    startDate: "2023-08-15",
    endDate: "2024-05-31",
    description: "Budget for computer labs, internet services, and educational software",
  },
  {
    id: "b5",
    title: "Sports Programs",
    category: "events",
    academicYear: "2023-2024",
    allocatedAmount: 50000,
    usedAmount: 28000,
    remainingAmount: 22000,
    status: "ACTIVE",
    startDate: "2023-08-15",
    endDate: "2024-05-31",
    description: "Funding for sports equipment, competitions, and physical education activities",
  },
];

// Monthly summary data
const budgetSummaryData = [
  { month: 'Aug', income: 125000, expenses: 92000 },
  { month: 'Sep', income: 118000, expenses: 102000 },
  { month: 'Oct', income: 122000, expenses: 95000 },
  { month: 'Nov', income: 130000, expenses: 112000 },
  { month: 'Dec', income: 125000, expenses: 105000 },
  { month: 'Jan', income: 128000, estimates: 110000 },
  { month: 'Feb', income: 130000, estimates: 115000 },
  { month: 'Mar', income: 135000, estimates: 120000 },
  { month: 'Apr', income: 132000, estimates: 118000 },
  { month: 'May', income: 125000, estimates: 108000 },
];

// Budget allocation by category
const budgetAllocationData = [
  { category: 'Staff Salaries', amount: 450000 },
  { category: 'Infrastructure', amount: 120000 },
  { category: 'Educational Supplies', amount: 75000 },
  { category: 'Technology', amount: 85000 },
  { category: 'Sports Programs', amount: 50000 },
  { category: 'Maintenance', amount: 120000 },
  { category: 'Utilities', amount: 60000 },
  { category: 'Miscellaneous', amount: 40000 },
];

// Schema for budget form
const budgetFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  category: z.string({
    required_error: "Please select a category",
  }),
  academicYearId: z.string({
    required_error: "Please select an academic year",
  }),
  allocatedAmount: z.number({
    required_error: "Amount is required",
  }).min(1, "Amount must be positive"),
  startDate: z.string({
    required_error: "Start date is required",
  }),
  endDate: z.string({
    required_error: "End date is required",
  }),
  description: z.string().optional(),
});

export default function BudgetPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [createBudgetDialog, setCreateBudgetDialog] = useState(false);
  const [viewBudgetDialog, setViewBudgetDialog] = useState(false);
  const [editBudgetDialog, setEditBudgetDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  // Initialize form for creating/editing budget
  const form = useForm<z.infer<typeof budgetFormSchema>>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      title: "",
      allocatedAmount: 0,
      startDate: "",
      endDate: "",
      description: "",
    },
  });

  // Filter budgets based on search, category, and academic year
  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          budget.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || budget.category === categoryFilter;
    
    const matchesAcademicYear = academicYearFilter === "all" || budget.academicYear === 
      academicYears.find(y => y.id === academicYearFilter)?.name;
    
    return matchesSearch && matchesCategory && matchesAcademicYear;
  });

  function handleCreateBudget() {
    form.reset({
      title: "",
      allocatedAmount: 0,
      startDate: "",
      endDate: "",
      description: "",
    });
    setCreateBudgetDialog(true);
  }

  function handleEditBudget(budgetId: string) {
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      const academicYear = academicYears.find(y => y.name === budget.academicYear);
      
      form.reset({
        title: budget.title,
        category: budget.category,
        academicYearId: academicYear?.id || "",
        allocatedAmount: budget.allocatedAmount,
        startDate: budget.startDate,
        endDate: budget.endDate,
        description: budget.description,
      });
      setSelectedBudget(budget);
      setEditBudgetDialog(true);
    }
  }

  function handleViewBudget(budgetId: string) {
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      setSelectedBudget(budget);
      setViewBudgetDialog(true);
    }
  }

  function onSubmitBudget(values: z.infer<typeof budgetFormSchema>) {
    console.log("Budget submitted:", values);
    // Here you would submit the data to your backend
    setCreateBudgetDialog(false);
    setEditBudgetDialog(false);
  }

  function getCategoryLabel(categoryId: string) {
    return budgetCategories.find(cat => cat.id === categoryId)?.name || categoryId;
  }

  function getCategoryColor(categoryId: string) {
    return budgetCategories.find(cat => cat.id === categoryId)?.color || "bg-gray-100 text-gray-800";
  }

  // Calculate percent used for a budget
  function getPercentUsed(budget: any) {
    return Math.round((budget.usedAmount / budget.allocatedAmount) * 100);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Budget Management</h1>
        </div>
        <Dialog open={createBudgetDialog} onOpenChange={setCreateBudgetDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateBudget}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Allocate a new budget for the school
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitBudget)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Staff Salaries, Educational Supplies" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {budgetCategories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="academicYearId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.map(year => (
                              <SelectItem key={year.id} value={year.id}>
                                {year.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="allocatedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocated Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional details about this budget" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateBudgetDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Budget</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Budget</CardTitle>
            <CardDescription>Academic Year 2023-2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">$1,000,000</div>
                <div className="text-sm text-gray-500 flex items-center">
                  <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500 mr-1">8.2%</span>
                  <span>vs last year</span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Used Budget</CardTitle>
            <CardDescription>Current usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">$435,000</div>
                <div className="text-sm text-gray-500">43.5% of total</div>
              </div>
              <div className="p-2 bg-green-50 rounded-md text-green-700">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Remaining</CardTitle>
            <CardDescription>Available funds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">$565,000</div>
                <div className="text-sm text-gray-500">56.5% of total</div>
              </div>
              <div className="p-2 bg-amber-50 rounded-md text-amber-700">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget Categories</CardTitle>
            <CardDescription>Active allocations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">8</div>
                <div className="text-sm text-gray-500">Different categories</div>
              </div>
              <div className="p-2 bg-purple-50 rounded-md text-purple-700">
                <BarChart4 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budgets">
        <TabsList>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="budgets">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Budget Allocations</CardTitle>
                  <CardDescription>
                    Manage and track all budget allocations
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search budgets..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {budgetCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Academic Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {academicYears.map(year => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Budget</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Category</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Used</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Remaining</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Usage</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.map((budget) => (
                      <tr key={budget.id} className="border-b">
                        <td className="py-3 px-4 align-middle">
                          <div className="font-medium">{budget.title}</div>
                          <div className="text-xs text-gray-500">{budget.academicYear}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={getCategoryColor(budget.category)}>
                            {getCategoryLabel(budget.category)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle font-medium">
                          ${budget.allocatedAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          ${budget.usedAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          ${budget.remainingAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={getPercentUsed(budget)} 
                              className="h-2" 
                              style={{
                                "--progress-foreground": getPercentUsed(budget) > 90 ? "rgb(239, 68, 68)" :
                                getPercentUsed(budget) > 70 ? "rgb(245, 158, 11)" :
                                "rgb(34, 197, 94)"
                              } as React.CSSProperties}
                            />
                            <span className="text-xs font-medium">
                              {getPercentUsed(budget)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewBudget(budget.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditBudget(budget.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredBudgets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-gray-500">
                          No budgets found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs. Expenses</CardTitle>
                <CardDescription>
                  Comparing monthly budget and actual expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Chart
                  title=""
                  data={budgetSummaryData}
                  type="bar"
                  xKey="month"
                  yKey="income"
                  categories={["income", "expenses"]}
                  colors={["#3b82f6", "#ef4444"]}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Budget Allocation</CardTitle>
                <CardDescription>
                  Distribution across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Chart
                  title=""
                  data={budgetAllocationData}
                  type="pie"
                  xKey="category"
                  yKey="amount"
                  colors={["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6", "#6b7280"]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Budget Reports</CardTitle>
              <CardDescription>
                Generate financial reports for your institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                      <BarChart4 className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium">Budget Summary Report</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Overview of all budget allocations, including used and remaining amounts
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-50 rounded-md text-green-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium">Expenses Breakdown</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Detailed breakdown of all expenses by category and date
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-50 rounded-md text-purple-600">
                      <Building className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium">Department Budget Report</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Budget allocation and utilization by department
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Set up automatic report generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-10 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Scheduled Reports</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  You haven't set up any scheduled reports yet. Create one to automatically receive reports via email.
                </p>
                <Button>Schedule New Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Budget Dialog */}
      <Dialog open={viewBudgetDialog} onOpenChange={setViewBudgetDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Budget Details</DialogTitle>
            <DialogDescription>
              View complete information about this budget allocation
            </DialogDescription>
          </DialogHeader>
          
          {selectedBudget && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedBudget.title}</h3>
                <Badge className={getCategoryColor(selectedBudget.category)}>
                  {getCategoryLabel(selectedBudget.category)}
                </Badge>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-700 font-medium mb-1">Allocated Budget</div>
                  <div className="text-2xl font-bold text-green-800">${selectedBudget.allocatedAmount.toLocaleString()}</div>
                </div>
                <div className="flex-1 bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-700 font-medium mb-1">Used Amount</div>
                  <div className="text-2xl font-bold text-blue-800">${selectedBudget.usedAmount.toLocaleString()}</div>
                </div>
                <div className="flex-1 bg-amber-50 p-4 rounded-lg">
                  <div className="text-sm text-amber-700 font-medium mb-1">Remaining</div>
                  <div className="text-2xl font-bold text-amber-800">${selectedBudget.remainingAmount.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget Utilization</label>
                <div className="flex items-center gap-3">
                  <Progress 
                    value={getPercentUsed(selectedBudget)} 
                    className="h-3 flex-1" 
                    style={{
                      "--progress-foreground": getPercentUsed(selectedBudget) > 90 ? "rgb(239, 68, 68)" :
                      getPercentUsed(selectedBudget) > 70 ? "rgb(245, 158, 11)" :
                      "rgb(34, 197, 94)"
                    } as React.CSSProperties}
                  />
                  <span className="font-medium">{getPercentUsed(selectedBudget)}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <p className="text-sm text-gray-500">Academic Year</p>
                  <p className="font-medium">{selectedBudget.academicYear}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className="bg-green-100 text-green-800">
                    {selectedBudget.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{new Date(selectedBudget.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{new Date(selectedBudget.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p>{selectedBudget.description || "No description provided."}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewBudgetDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewBudgetDialog(false);
              selectedBudget && handleEditBudget(selectedBudget.id);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog - Using the same form as Create, just different state */}
      <Dialog open={editBudgetDialog} onOpenChange={setEditBudgetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>
              Update budget allocation information
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitBudget)} className="space-y-4">
              {/* Same form fields as Create Budget Dialog */}
              {/* ...existing code... */}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditBudgetDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Budget</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}