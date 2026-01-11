"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ChevronLeft, PlusCircle, Search, Filter, Calendar, Download,
  Receipt, DollarSign, ArrowUp, ArrowDown, Printer, Tag, Edit, Trash2, Eye, Clock,
  CheckCircle
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Chart } from "@/components/dashboard/chart";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getExpensesByCategory,
} from "@/lib/actions/expenseActions";

// Mock data for expense categories
const expenseCategories = [
  { id: "utilities", name: "Utilities", color: "bg-primary/10 text-primary", icon: <Receipt className="h-4 w-4" /> },
  { id: "supplies", name: "School Supplies", color: "bg-green-100 text-green-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "maintenance", name: "Maintenance", color: "bg-amber-100 text-amber-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "salary", name: "Staff Salary", color: "bg-purple-100 text-purple-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "events", name: "Events", color: "bg-pink-100 text-pink-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "transport", name: "Transportation", color: "bg-indigo-100 text-indigo-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "other", name: "Other", color: "bg-muted text-gray-800", icon: <Receipt className="h-4 w-4" /> },
];

// Payment methods
const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ONLINE_PAYMENT", label: "Online Payment" },
];

// Schema for expense form
const expenseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  category: z.string({
    required_error: "Please select a category",
  }),
  amount: z.number({
    required_error: "Amount is required",
  }).min(0, "Amount must be positive"),
  date: z.string({
    required_error: "Date is required",
  }),
  paymentMethod: z.string({
    required_error: "Payment method is required",
  }),
  paidTo: z.string().min(2, "Paid to must be at least 2 characters long"),
  description: z.string().optional(),
  receiptNumber: z.string().optional(),
  attachmentFiles: z.any().optional(),
});

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [createExpenseDialog, setCreateExpenseDialog] = useState(false);
  const [viewExpenseDialog, setViewExpenseDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};

      if (categoryFilter !== "all") {
        filters.category = categoryFilter.toUpperCase();
      }

      // Calculate date range
      if (dateRangeFilter !== "all") {
        const now = new Date();
        if (dateRangeFilter === "today") {
          filters.dateFrom = new Date(now.setHours(0, 0, 0, 0));
          filters.dateTo = new Date(now.setHours(23, 59, 59, 999));
        } else if (dateRangeFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          filters.dateFrom = weekAgo;
          filters.dateTo = now;
        } else if (dateRangeFilter === "month") {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          filters.dateFrom = monthAgo;
          filters.dateTo = now;
        }
      }

      const result = await getExpenses(filters);
      if (result.success && result.data) {
        setExpenses(result.data);
      } else {
        toast.error(result.error || "Failed to load expenses");
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, dateRangeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const result = await getExpenseStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadExpenses();
    loadStats();
  }, [loadExpenses, loadStats]);

  const handleCreateExpense = async (data: any) => {
    try {
      const result = await createExpense(data);
      if (result.success) {
        toast.success("Expense created successfully");
        setCreateExpenseDialog(false);
        form.reset();
        loadExpenses();
        loadStats();
      } else {
        toast.error(result.error || "Failed to create expense");
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error("Failed to create expense");
    }
  };

  const handleUpdateExpense = async (id: string, data: any) => {
    try {
      const result = await updateExpense(id, data);
      if (result.success) {
        toast.success("Expense updated successfully");
        setCreateExpenseDialog(false);
        loadExpenses();
        loadStats();
      } else {
        toast.error(result.error || "Failed to update expense");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const result = await deleteExpense(id);
      if (result.success) {
        toast.success("Expense deleted successfully");
        loadExpenses();
        loadStats();
      } else {
        toast.error(result.error || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  // Initialize form for creating/editing expense
  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: "",
      receiptNumber: "",
    },
  });

  // Filter expenses based on search logic (kept separate from API filters for search)
  // Note: For large datasets, search should also be server-side.
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.vendor && expense.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (expense.receiptNumber && expense.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  function handleOpenCreateDialog() {
    setSelectedExpense(null);
    form.reset({
      title: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: "",
      receiptNumber: "",
      attachmentFiles: undefined,
      category: undefined,
      paymentMethod: undefined,
      paidTo: "",
    });
    setCreateExpenseDialog(true);
  }

  function handleEditExpense(expenseId: string) {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      form.reset({
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        date: new Date(expense.date).toISOString().split('T')[0],
        paymentMethod: expense.paymentMethod,
        paidTo: expense.paidTo || "",
        description: expense.description || "",
        receiptNumber: expense.receiptNumber || "",
      });
      setSelectedExpense(expense);
      setCreateExpenseDialog(true);
    }
  }

  function handleViewExpense(expenseId: string) {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      setSelectedExpense(expense);
      setViewExpenseDialog(true);
    }
  }

  function onSubmitExpense(values: z.infer<typeof expenseFormSchema>) {
    if (selectedExpense) {
      handleUpdateExpense(selectedExpense.id, values);
    } else {
      handleCreateExpense(values);
    }
  }

  function handleCheckAllItems() {
    if (selectedItems.length === filteredExpenses.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredExpenses.map(e => e.id));
    }
  }

  function handleItemChecked(itemId: string) {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  }

  function getCategoryLabel(categoryId: string) {
    return expenseCategories.find(cat => cat.id === categoryId)?.name || categoryId;
  }

  function getCategoryColor(categoryId: string) {
    return expenseCategories.find(cat => cat.id === categoryId)?.color || "bg-muted text-gray-800";
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
          <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
        </div>
        <Dialog open={createExpenseDialog} onOpenChange={setCreateExpenseDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreateDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
              <DialogDescription>
                {selectedExpense ? "Update expense details" : "Record a new expense in the system"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitExpense)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Electricity Bill, Office Supplies" {...field} />
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
                            {expenseCategories.map(category => (
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map(method => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
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
                  name="paidTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid To</FormLabel>
                      <FormControl>
                        <Input placeholder="Vendor/Person/Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional details about this expense"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="receiptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt/Reference Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., INV-12345" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attachmentFiles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attachments (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            multiple
                            onChange={(e) => field.onChange(e.target.files)}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload receipts, invoices, or other supporting documents.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateExpenseDialog(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit">{selectedExpense ? "Update Expense" : "Save Expense"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Expenses</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">₹{stats?.totalAmount?.toLocaleString() || '0'}</div>
                <div className="text-sm text-muted-foreground">
                  {stats?.totalExpenses || 0} expenses recorded
                </div>
              </div>
              <div className="p-2 bg-red-50 rounded-md text-red-700">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending Payments</CardTitle>
            <CardDescription>Awaiting processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">₹{stats?.pendingAmount?.toLocaleString() || '0'}</div>
                <div className="text-sm text-muted-foreground">{stats?.pendingExpenses || 0} pending expenses</div>
              </div>
              <div className="p-2 bg-amber-50 rounded-md text-amber-700">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Completed Payments</CardTitle>
            <CardDescription>Successfully processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">₹{stats?.completedAmount?.toLocaleString() || '0'}</div>
                <div className="text-sm text-muted-foreground">{stats?.completedExpenses || 0} completed</div>
              </div>
              <div className="p-2 bg-green-50 rounded-md text-green-700">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Expense Records</CardTitle>
                  <CardDescription>
                    Manage and track all expenses
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search expenses..."
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
                      {expenseCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground w-[40px]">
                        <Checkbox
                          checked={selectedItems.length === filteredExpenses.length && filteredExpenses.length > 0}
                          onCheckedChange={handleCheckAllItems}
                        />
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Title</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Category</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b">
                        <td className="py-3 px-4 align-middle">
                          <Checkbox
                            checked={selectedItems.includes(expense.id)}
                            onCheckedChange={() => handleItemChecked(expense.id)}
                          />
                        </td>
                        <td className="py-3 px-4 align-middle font-medium">
                          {expense.title}
                          <div className="text-xs text-muted-foreground">{expense.receiptNumber}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={getCategoryColor(expense.category)}>
                            {getCategoryLabel(expense.category)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle font-medium">
                          ₹{expense.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={
                            expense.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                              expense.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                                "bg-red-100 text-red-800"
                          }>
                            {expense.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewExpense(expense.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(expense.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted-foreground">
                          No expenses found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedItems.length > 0 && (
                <div className="flex items-center justify-between mt-4 p-2 bg-accent rounded-md">
                  <div className="text-sm">
                    {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense Trend</CardTitle>
                <CardDescription>
                  Expense distribution over the past 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.monthlyTrend && stats.monthlyTrend.length > 0 ? (
                  <Chart
                    title=""
                    data={stats.monthlyTrend}
                    type="bar"
                    xKey="month"
                    yKey="amount"
                    categories={["amount"]}
                    colors={["#ef4444"]}
                  />
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No monthly trend data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense by Category</CardTitle>
                <CardDescription>
                  Distribution of expenses across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.byCategory && stats.byCategory.length > 0 ? (
                  <Chart
                    title=""
                    data={stats.byCategory}
                    type="pie"
                    xKey="category"
                    yKey="amount"
                    colors={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1", "#6b7280"]}
                  />
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No expense data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Category-wise Expense Report</CardTitle>
              <CardDescription>
                Breakdown of expenses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.byCategory && stats.byCategory.length > 0 ? (
                <>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-accent border-b">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Category</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Amount</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">% of Total</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.byCategory.map((category: any) => (
                          <tr key={category.category} className="border-b">
                            <td className="py-3 px-4 align-middle font-medium">
                              {category.category}
                            </td>
                            <td className="py-3 px-4 align-middle">
                              ₹{category.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 align-middle">
                              {stats.totalAmount > 0 ? ((category.amount / stats.totalAmount) * 100).toFixed(1) : 0}%
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <div className="flex items-center">
                                <div className="w-full bg-muted rounded-full h-2 mr-2">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${stats.totalAmount > 0 ? ((category.amount / stats.totalAmount) * 100).toFixed(1) : 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export Report
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Expense Dialog */}
      <Dialog open={viewExpenseDialog} onOpenChange={setViewExpenseDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              View complete information about this expense
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedExpense.title}</h3>
                <Badge className={getCategoryColor(selectedExpense.category)}>
                  {getCategoryLabel(selectedExpense.category)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">₹{selectedExpense.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">
                    {paymentMethods.find(m => m.value === selectedExpense.paymentMethod)?.label || selectedExpense.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid To</p>
                  <p className="font-medium">{selectedExpense.paidTo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receipt/Reference</p>
                  <p className="font-medium">{selectedExpense.receiptNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={
                    selectedExpense.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                      selectedExpense.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                  }>
                    {selectedExpense.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p>{selectedExpense.description || "No description provided."}</p>
              </div>

              {selectedExpense.attachments && selectedExpense.attachments.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpense.attachments.map((attachment: string, index: number) => (
                      <div key={index} className="border rounded-md p-2 flex items-center">
                        <Receipt className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm">{attachment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewExpenseDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewExpenseDialog(false);
              selectedExpense && handleEditExpense(selectedExpense.id);
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
    </div>
  );
}

