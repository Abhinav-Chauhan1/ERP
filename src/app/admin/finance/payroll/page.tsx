"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft, PlusCircle, Search, Filter, Calendar, Download,
  Printer, Wallet, User, CheckCircle, XCircle, AlertCircle,
  FileText, ArrowUpDown, Edit, Eye
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getPayrolls,
  generatePayroll,
  updatePayroll,
  processPayment,
  deletePayroll,
  getTeachersForPayroll,
  getPayrollStats,
  bulkGeneratePayrolls,
} from "@/lib/actions/payrollActions";
import { PayrollTable } from "@/components/admin/payroll-table";

// Months for dropdown
const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

// Payment methods
const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ONLINE_PAYMENT", label: "Online Payment" },
];

// Schema for creating payroll
const payrollSchema = z.object({
  staffId: z.string({
    required_error: "Please select a staff member",
  }),
  month: z.number({
    required_error: "Month is required",
  }),
  year: z.number({
    required_error: "Year is required",
  }),
  basicSalary: z.number({
    required_error: "Basic salary is required",
  }).min(0),
  allowances: z.number().default(0),
  deductions: z.number().default(0),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

// Schema for making a payroll payment
const paymentSchema = z.object({
  paymentMethod: z.string({
    required_error: "Payment method is required",
  }),
  transactionId: z.string().optional(),
  paymentDate: z.string({
    required_error: "Payment date is required",
  }),
  remarks: z.string().optional(),
});

export default function PayrollPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const loadPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {
        month: currentMonth,
        year: currentYear,
      };
      if (statusFilter !== "all") filters.status = statusFilter.toUpperCase();

      const result = await getPayrolls(filters);
      if (result.success && result.data) {
        setSalaryPayments(result.data);
      } else {
        toast.error(result.error || "Failed to load payrolls");
      }
    } catch (error) {
      console.error("Error loading payrolls:", error);
      toast.error("Failed to load payrolls");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, statusFilter]);

  const loadTeachers = useCallback(async () => {
    try {
      const result = await getTeachersForPayroll();
      if (result.success && result.data) {
        setStaff(result.data);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const result = await getPayrollStats(currentMonth, currentYear);
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [currentMonth, currentYear]);

  // Load data on mount
  useEffect(() => {
    loadPayrolls();
    loadTeachers();
    loadStats();
  }, [loadPayrolls, loadTeachers, loadStats]);

  const handleGeneratePayroll = async (data: any) => {
    try {
      const result = await generatePayroll(data);
      if (result.success) {
        toast.success("Payroll generated successfully");
        setCreateDialogOpen(false);
        payrollForm.reset();
        loadPayrolls();
        loadStats();
      } else {
        toast.error(result.error || "Failed to generate payroll");
      }
    } catch (error) {
      console.error("Error generating payroll:", error);
      toast.error("Failed to generate payroll");
    }
  };

  const handleProcessPayment = async (id: string) => {
    try {
      const result = await processPayment(id);
      if (result.success) {
        toast.success("Payment processed successfully");
        setPaymentDialogOpen(false);
        loadPayrolls();
        loadStats();
      } else {
        toast.error(result.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    }
  };

  const handleDeletePayroll = async (id: string) => {
    try {
      const result = await deletePayroll(id);
      if (result.success) {
        toast.success("Payroll deleted successfully");
        loadPayrolls();
        loadStats();
      } else {
        toast.error(result.error || "Failed to delete payroll");
      }
    } catch (error) {
      console.error("Error deleting payroll:", error);
      toast.error("Failed to delete payroll");
    }
  };

  const handleBulkGenerate = async () => {
    try {
      const result = await bulkGeneratePayrolls(currentMonth, currentYear, 50000);
      if (result.success && result.data) {
        toast.success(`Generated ${result.data.generated} payrolls successfully`);
        if (result.data.errors > 0) {
          toast.error(`${result.data.errors} payrolls failed to generate`);
        }
        loadPayrolls();
        loadStats();
      } else {
        toast.error(result.error || "Failed to bulk generate payrolls");
      }
    } catch (error) {
      console.error("Error bulk generating payrolls:", error);
      toast.error("Failed to bulk generate payrolls");
    }
  };

  // Initialize form for payroll
  const payrollForm = useForm<z.infer<typeof payrollSchema>>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      month: currentMonth,
      year: currentYear,
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
    },
  });

  // Initialize form for payment
  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "BANK_TRANSFER",
    },
  });

  // Filter payments based on search and status
  const filteredPayments = salaryPayments.filter(payment => {
    const teacherName = `${payment.teacher?.user?.firstName || ""} ${payment.teacher?.user?.lastName || ""}`;
    const matchesSearch =
      teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.teacher?.user?.email && payment.teacher.user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  function handleCreatePayroll() {
    payrollForm.reset({
      month: currentMonth,
      year: currentYear,
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
    });
    setSelectedStaff(null);
    setCreateDialogOpen(true);
  }

  function handleMakePayment(payment: any) {
    setSelectedPayment(payment);
    paymentForm.reset({
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "BANK_TRANSFER",
    });
    setPaymentDialogOpen(true);
  }

  function handleViewPayslip(payment: any) {
    setSelectedPayment(payment);
    setPayslipDialogOpen(true);
  }

  function onStaffChange(staffId: string) {
    const staffMember = staff.find(s => s.id === staffId);
    if (staffMember) {
      setSelectedStaff(staffMember);
      payrollForm.setValue("staffId", staffId);
      payrollForm.setValue("basicSalary", staffMember.salary / 12);
    }
  }

  function onSubmitPayroll(values: z.infer<typeof payrollSchema>) {
    // Map staffId to teacherId as expected by the server action
    const payrollData = {
      teacherId: values.staffId,
      month: values.month,
      year: values.year,
      basicSalary: values.basicSalary,
      allowances: values.allowances || 0,
      deductions: values.deductions || 0,
      remarks: values.remarks,
    };
    handleGeneratePayroll(payrollData);
  }

  function onSubmitPayment(values: z.infer<typeof paymentSchema>) {
    console.log("Processing payment:", values, "for payroll:", selectedPayment?.id);
    // Here you would submit the payment data to your backend
    setPaymentDialogOpen(false);
  }

  function getMonthName(monthNumber: number) {
    return months.find(m => m.value === monthNumber)?.label || "Unknown";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreatePayroll}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create New Payroll</DialogTitle>
              <DialogDescription>
                Set up payroll for a staff member
              </DialogDescription>
            </DialogHeader>
            <Form {...payrollForm}>
              <form onSubmit={payrollForm.handleSubmit(onSubmitPayroll)} className="space-y-4">
                <FormField
                  control={payrollForm.control}
                  name="staffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff Member</FormLabel>
                      <Select onValueChange={onStaffChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staff.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.position})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedStaff && (
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 text-primary">Staff Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Employee ID:</span> {selectedStaff.employeeId}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Department:</span> {selectedStaff.department}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Position:</span> {selectedStaff.position}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Annual Salary:</span> ₹{selectedStaff.salary.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={payrollForm.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={payrollForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
                            <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                            <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-4">Salary Details</h3>
                  <div className="space-y-4">
                    <FormField
                      control={payrollForm.control}
                      name="basicSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basic Salary</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={payrollForm.control}
                      name="allowances"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allowances</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={payrollForm.control}
                      name="deductions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deductions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-accent p-4 rounded-lg mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Net Salary:</span>
                        <span className="font-bold">₹{(
                          payrollForm.getValues().basicSalary +
                          (payrollForm.getValues().allowances || 0) -
                          (payrollForm.getValues().deductions || 0)
                        ).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <FormField
                  control={payrollForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any notes about this payroll"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Payroll</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="md:w-2/3">
          <Card>
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Payroll Overview</CardTitle>
                  <CardDescription>Salary payment summary</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={currentMonth.toString()} onValueChange={v => setCurrentMonth(parseInt(v))}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={currentYear.toString()} onValueChange={v => setCurrentYear(parseInt(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
                      <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                      <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border rounded-md p-3 text-center bg-primary/10">
                  <div className="text-sm text-primary font-medium mb-1">Total Payrolls</div>
                  <div className="text-2xl font-bold text-primary">{stats?.totalPayrolls || 0}</div>
                </div>
                <div className="border rounded-md p-3 text-center bg-green-50">
                  <div className="text-sm text-green-700 font-medium mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-800">{stats?.paidPayrolls || 0}</div>
                </div>
                <div className="border rounded-md p-3 text-center bg-amber-50">
                  <div className="text-sm text-amber-700 font-medium mb-1">Pending</div>
                  <div className="text-2xl font-bold text-amber-800">{stats?.pendingPayrolls || 0}</div>
                </div>
                <div className="border rounded-md p-3 text-center bg-purple-50">
                  <div className="text-sm text-purple-700 font-medium mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-purple-800">₹{stats?.totalPaid?._sum?.netSalary?.toLocaleString() || '0'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-1/3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Common payroll operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="justify-start" onClick={handleCreatePayroll}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Payroll
                </Button>
                <Button variant="outline" className="justify-start">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Bulk Process Payroll
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Payroll Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Salary Payments</CardTitle>
              <CardDescription>
                Manage staff salary payments
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search staff or ID..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Languages">Languages</SelectItem>
                  <SelectItem value="Social Studies">Social Studies</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PayrollTable
            payments={filteredPayments}
            onViewPayslip={handleViewPayslip}
            onMakePayment={handleMakePayment}
            onEdit={(payment) => {
              // Edit logic not explicitly defined in original component's state, but button existed.
              // Assuming it opens create dialog with pre-filled? 
              // The original "Edit" button didn't have onClick handler in the view I saw (lines 783-786).
              // Checked: <Button variant="ghost" size="sm"><Edit .../> Edit</Button> had NO onClick.
              // So I'll pass a no-op or handle it if I missed it.
              console.log("Edit clicked", payment);
            }}
            months={months}
          />
        </CardContent>
      </Card>

      {/* Process Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Salary Payment</DialogTitle>
            <DialogDescription>
              Process payment for {selectedPayment?.staffName}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-lg mb-4">
                  <div className="font-medium mb-2">Payment Details</div>
                  <div className="flex justify-between mb-1">
                    <span>Staff:</span>
                    <span className="font-medium">{selectedPayment.staffName}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Employee ID:</span>
                    <span>{selectedPayment.employeeId}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Month:</span>
                    <span>{getMonthName(selectedPayment.month)} {selectedPayment.year}</span>
                  </div>
                  <div className="flex justify-between font-medium text-green-800">
                    <span>Amount:</span>
                    <span>₹{selectedPayment.netSalary.toLocaleString()}</span>
                  </div>
                </div>

                <FormField
                  control={paymentForm.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
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
                          {paymentMethods.map((method) => (
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

                <FormField
                  control={paymentForm.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Transaction ID, check number"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Process Payment</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Payslip Dialog */}
      <Dialog open={payslipDialogOpen} onOpenChange={setPayslipDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Salary Slip</DialogTitle>
            <DialogDescription>
              {selectedPayment && `${getMonthName(selectedPayment.month)} ${selectedPayment.year}`}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="font-bold text-xl">School Name</div>
                  <div className="text-right">
                    <div className="font-bold">SALARY SLIP</div>
                    <div className="text-sm text-muted-foreground">
                      {getMonthName(selectedPayment.month)} {selectedPayment.year}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Employee Information</div>
                    <div className="font-medium">{selectedPayment.staffName}</div>
                    <div>ID: {selectedPayment.employeeId}</div>
                    <div>Department: {selectedPayment.department}</div>
                    <div>Position: {selectedPayment.position}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground mb-1">Payment Details</div>
                    <div>Date: {selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString() : "Pending"}</div>
                    <div>Mode: {paymentMethods.find(m => m.value === selectedPayment.paymentMethod)?.label || "N/A"}</div>
                    <div>Reference: {selectedPayment.transactionId || "N/A"}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-muted-foreground font-medium">Earnings & Deductions</div>
                <div className="border rounded-md">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-2 px-4 text-left font-medium">Description</th>
                        <th className="py-2 px-4 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">Basic Salary</td>
                        <td className="py-3 px-4 text-right">₹{selectedPayment.basicSalary.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Allowances</td>
                        <td className="py-3 px-4 text-right">₹{selectedPayment.allowances.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Deductions</td>
                        <td className="py-3 px-4 text-right">-₹{selectedPayment.deductions.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-accent font-bold">
                        <td className="py-3 px-4">Net Salary</td>
                        <td className="py-3 px-4 text-right">₹{selectedPayment.netSalary.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                  <p>This is a computer generated payslip and does not require a signature.</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayslipDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download
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

