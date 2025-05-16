"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, PlusCircle, Search, Filter, Calendar, Download,
  Receipt, DollarSign, ArrowUp, ArrowDown, Printer, Tag, Edit, Trash2, Eye, Clock
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

// Mock data for expense categories
const expenseCategories = [
  { id: "utilities", name: "Utilities", color: "bg-blue-100 text-blue-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "supplies", name: "School Supplies", color: "bg-green-100 text-green-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "maintenance", name: "Maintenance", color: "bg-amber-100 text-amber-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "salary", name: "Staff Salary", color: "bg-purple-100 text-purple-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "events", name: "Events", color: "bg-pink-100 text-pink-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "transport", name: "Transportation", color: "bg-indigo-100 text-indigo-800", icon: <Receipt className="h-4 w-4" /> },
  { id: "other", name: "Other", color: "bg-gray-100 text-gray-800", icon: <Receipt className="h-4 w-4" /> },
];

// Mock data for expenses
const expenses = [
  {
    id: "e1",
    title: "Electricity Bill",
    category: "utilities",
    amount: 1250,
    date: "2023-11-25",
    paymentMethod: "BANK_TRANSFER",
    paidTo: "Power Company",
    status: "COMPLETED",
    description: "Monthly electricity bill for the main building",
    receiptNumber: "UTIL-2311-01",
    attachments: ["receipt1.pdf"],
    createdBy: "Admin",
  },
  {
    id: "e2",
    title: "Science Lab Equipment",
    category: "supplies",
    amount: 3500,
    date: "2023-11-23",
    paymentMethod: "CREDIT_CARD",
    paidTo: "Science Supplies Inc.",
    status: "COMPLETED",
    description: "New microscopes and lab equipment for the science department",
    receiptNumber: "SUP-2311-02",
    attachments: ["receipt2.pdf", "invoice2.pdf"],
    createdBy: "Admin",
  },
  {
    id: "e3",
    title: "Staff Salaries - November",
    category: "salary",
    amount: 45000,
    date: "2023-11-28",
    paymentMethod: "BANK_TRANSFER",
    paidTo: "Multiple Staff",
    status: "PENDING",
    description: "Monthly salaries for teaching and non-teaching staff",
    receiptNumber: "SAL-2311-01",
    attachments: [],
    createdBy: "Admin",
  },
  {
    id: "e4",
    title: "Building Maintenance",
    category: "maintenance",
    amount: 2800,
    date: "2023-11-20",
    paymentMethod: "CASH",
    paidTo: "City Maintenance Services",
    status: "COMPLETED",
    description: "Repairs to plumbing system in the east wing",
    receiptNumber: "MAIN-2311-01",
    attachments: ["receipt4.pdf", "work_order.pdf"],
    createdBy: "Admin",
  },
  {
    id: "e5",
    title: "Annual Sports Day",
    category: "events",
    amount: 5000,
    date: "2023-11-18",
    paymentMethod: "CREDIT_CARD",
    paidTo: "Various Vendors",
    status: "COMPLETED",
    description: "Expenses for annual school sports day including equipment, refreshments, and prizes",
    receiptNumber: "EVT-2311-01",
    attachments: ["expense_summary.pdf"],
    createdBy: "Admin",
  },
];

// Mock data for payment methods
const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ONLINE_PAYMENT", label: "Online Payment" },
];

// Mock data for expense summary
const expenseSummaryByCategory = [
  { category: "Utilities", amount: 4250 },
  { category: "Supplies", amount: 7800 },
  { category: "Maintenance", amount: 5600 },
  { category: "Salary", amount: 45000 },
  { category: "Events", amount: 8500 },
  { category: "Transport", amount: 3200 },
  { category: "Other", amount: 1500 },
];

const monthlyExpenseData = [
  { month: 'Jul', amount: 65000 },
  { month: 'Aug', amount: 72000 },
  { month: 'Sep', amount: 68000 },
  { month: 'Oct', amount: 73500 },
  { month: 'Nov', amount: 75800 },
  { month: 'Dec', amount: 0 },
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
  const [editExpenseDialog, setEditExpenseDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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

  // Filter expenses based on search, category, and date range
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expense.paidTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expense.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    
    // Simple date range filtering
    let matchesDateRange = true;
    const expenseDate = new Date(expense.date);
    const now = new Date();
    
    if (dateRangeFilter === "today") {
      const today = new Date();
      matchesDateRange = expenseDate.toDateString() === today.toDateString();
    } else if (dateRangeFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      matchesDateRange = expenseDate >= weekAgo;
    } else if (dateRangeFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      matchesDateRange = expenseDate >= monthAgo;
    }
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  function handleCreateExpense() {
    form.reset({
      title: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: "",
      receiptNumber: "",
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
        date: expense.date,
        paymentMethod: expense.paymentMethod,
        paidTo: expense.paidTo,
        description: expense.description,
        receiptNumber: expense.receiptNumber,
      });
      setSelectedExpense(expense);
      setEditExpenseDialog(true);
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
    console.log("Expense submitted:", values);
    // Here you would submit the data to your backend
    setCreateExpenseDialog(false);
    setEditExpenseDialog(false);
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
    return expenseCategories.find(cat => cat.id === categoryId)?.color || "bg-gray-100 text-gray-800";
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
            <Button onClick={handleCreateExpense}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new expense in the system
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
                  <Button variant="outline" onClick={() => setCreateExpenseDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Expense</Button>
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
            <CardDescription>Current month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">$75,800</div>
                <div className="text-sm text-gray-500 flex items-center">
                  <ArrowUp className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500 mr-1">3.2%</span>
                  <span>vs last month</span>
                </div>
              </div>
              <div className="p-2 bg-red-50 rounded-md text-red-700">
                <ArrowUp className="h-6 w-6" />
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
                <div className="text-3xl font-bold">$45,000</div>
                <div className="text-sm text-gray-500">3 pending expenses</div>
              </div>
              <div className="p-2 bg-amber-50 rounded-md text-amber-700">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget Usage</CardTitle>
            <CardDescription>Monthly allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">75.8%</div>
                <div className="text-sm text-gray-500">of monthly budget</div>
              </div>
              <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                <DollarSign className="h-6 w-6" />
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
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
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
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500 w-[40px]">
                        <Checkbox 
                          checked={selectedItems.length === filteredExpenses.length && filteredExpenses.length > 0}
                          onCheckedChange={handleCheckAllItems}
                        />
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Title</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Category</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
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
                          <div className="text-xs text-gray-500">{expense.receiptNumber}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={getCategoryColor(expense.category)}>
                            {getCategoryLabel(expense.category)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle font-medium">
                          ${expense.amount.toLocaleString()}
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
                        <td colSpan={7} className="py-6 text-center text-gray-500">
                          No expenses found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {selectedItems.length > 0 && (
                <div className="flex items-center justify-between mt-4 p-2 bg-gray-50 rounded-md">
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
                <Chart
                  title=""
                  data={monthlyExpenseData}
                  type="bar"
                  xKey="month"
                  yKey="amount"
                  categories={["amount"]}
                  colors={["#ef4444"]}
                />
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
                <Chart
                  title=""
                  data={expenseSummaryByCategory}
                  type="pie"
                  xKey="category"
                  yKey="amount"
                  colors={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1", "#6b7280"]}
                />
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
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Category</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">% of Total</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseSummaryByCategory.map((category) => (
                      <tr key={category.category} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">
                          {category.category}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          ${category.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {(category.amount / 75800 * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(category.amount / 75800 * 100).toFixed(1)}%` }}
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
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">${selectedExpense.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">
                    {paymentMethods.find(m => m.value === selectedExpense.paymentMethod)?.label || selectedExpense.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paid To</p>
                  <p className="font-medium">{selectedExpense.paidTo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Receipt/Reference</p>
                  <p className="font-medium">{selectedExpense.receiptNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
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
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p>{selectedExpense.description || "No description provided."}</p>
              </div>
              
              {selectedExpense.attachments && selectedExpense.attachments.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpense.attachments.map((attachment: string, index: number) => (
                      <div key={index} className="border rounded-md p-2 flex items-center">
                        <Receipt className="h-4 w-4 mr-2 text-blue-500" />
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

      {/* Edit Expense Dialog - Using the same form as Create, just different state */}
      <Dialog open={editExpenseDialog} onOpenChange={setEditExpenseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update expense information
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitExpense)} className="space-y-4">
              {/* Same form fields as Create Expense Dialog */}
              {/* ...existing code... */}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditExpenseDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Expense</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}