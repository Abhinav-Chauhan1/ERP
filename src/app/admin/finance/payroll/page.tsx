"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, PlusCircle, Search, Filter, Calendar, Download,
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

// Mock data for staff members
const staff = [
  { id: "t1", name: "John Smith", employeeId: "EMP001", department: "Science", position: "Senior Teacher", salary: 65000 },
  { id: "t2", name: "Emily Johnson", employeeId: "EMP002", department: "Mathematics", position: "Teacher", salary: 58000 },
  { id: "t3", name: "Michael Brown", employeeId: "EMP003", department: "Languages", position: "HOD", salary: 72000 },
  { id: "t4", name: "Sarah Davis", employeeId: "EMP004", department: "Science", position: "Teacher", salary: 56000 },
  { id: "t5", name: "Robert Wilson", employeeId: "EMP005", department: "Social Studies", position: "Teacher", salary: 55000 },
  { id: "t6", name: "Jessica Martinez", employeeId: "EMP006", department: "Mathematics", position: "Teacher", salary: 57000 },
  { id: "t7", name: "David Thompson", employeeId: "EMP007", department: "Arts", position: "Teacher", salary: 52000 },
  { id: "t8", name: "Lisa Anderson", employeeId: "EMP008", department: "Languages", position: "Teacher", salary: 54000 },
  { id: "t9", name: "James Lee", employeeId: "EMP009", department: "Science", position: "Lab Assistant", salary: 48000 },
  { id: "t10", name: "Sandra Harris", employeeId: "EMP010", department: "Social Studies", position: "Teacher", salary: 54000 },
];

// Mock data for salary payments
const salaryPayments = [
  {
    id: "sp1",
    staffId: "t1",
    staffName: "John Smith",
    employeeId: "EMP001",
    department: "Science",
    position: "Senior Teacher",
    month: 10,
    year: 2023,
    basicSalary: 65000 / 12,
    allowances: 1200,
    deductions: 850,
    netSalary: (65000 / 12) + 1200 - 850,
    paymentDate: "2023-11-01",
    status: "COMPLETED",
    paymentMethod: "BANK_TRANSFER",
    transactionId: "TRX123456"
  },
  {
    id: "sp2",
    staffId: "t2",
    staffName: "Emily Johnson",
    employeeId: "EMP002",
    department: "Mathematics",
    position: "Teacher",
    month: 10,
    year: 2023,
    basicSalary: 58000 / 12,
    allowances: 800,
    deductions: 720,
    netSalary: (58000 / 12) + 800 - 720,
    paymentDate: "2023-11-01",
    status: "COMPLETED",
    paymentMethod: "BANK_TRANSFER",
    transactionId: "TRX123457"
  },
  {
    id: "sp3",
    staffId: "t3",
    staffName: "Michael Brown",
    employeeId: "EMP003",
    department: "Languages",
    position: "HOD",
    month: 10,
    year: 2023,
    basicSalary: 72000 / 12,
    allowances: 1500,
    deductions: 920,
    netSalary: (72000 / 12) + 1500 - 920,
    paymentDate: "2023-11-01",
    status: "COMPLETED",
    paymentMethod: "BANK_TRANSFER",
    transactionId: "TRX123458"
  },
  {
    id: "sp4",
    staffId: "t4",
    staffName: "Sarah Davis",
    employeeId: "EMP004",
    department: "Science",
    position: "Teacher",
    month: 11,
    year: 2023,
    basicSalary: 56000 / 12,
    allowances: 750,
    deductions: 680,
    netSalary: (56000 / 12) + 750 - 680,
    paymentDate: null,
    status: "PENDING",
    paymentMethod: null,
    transactionId: null
  }
];

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

  // Filter payments based on search, department, and status
  const filteredPayments = salaryPayments.filter(payment => {
    const matchesSearch = 
      payment.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = 
      departmentFilter === "all" || payment.department === departmentFilter;
    
    const matchesStatus = 
      statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
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
    console.log("Creating payroll:", values);
    // Here you would submit the payroll data to your backend
    setCreateDialogOpen(false);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
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
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 text-blue-800">Staff Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Employee ID:</span> {selectedStaff.employeeId}
                      </div>
                      <div>
                        <span className="text-gray-500">Department:</span> {selectedStaff.department}
                      </div>
                      <div>
                        <span className="text-gray-500">Position:</span> {selectedStaff.position}
                      </div>
                      <div>
                        <span className="text-gray-500">Annual Salary:</span> ${selectedStaff.salary.toLocaleString()}
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
                    
                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Net Salary:</span>
                        <span className="font-bold">$
                          {(
                            payrollForm.getValues().basicSalary +
                            (payrollForm.getValues().allowances || 0) -
                            (payrollForm.getValues().deductions || 0)
                          ).toLocaleString()}
                        </span>
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
                <div className="border rounded-md p-3 text-center bg-blue-50">
                  <div className="text-sm text-blue-700 font-medium mb-1">Total Staff</div>
                  <div className="text-2xl font-bold text-blue-800">10</div>
                </div>
                <div className="border rounded-md p-3 text-center bg-green-50">
                  <div className="text-sm text-green-700 font-medium mb-1">Paid</div>
                  <div className="text-2xl font-bold text-green-800">3</div>
                </div>
                <div className="border rounded-md p-3 text-center bg-amber-50">
                  <div className="text-sm text-amber-700 font-medium mb-1">Pending</div>
                  <div className="text-2xl font-bold text-amber-800">1</div>
                </div>
                <div className="border rounded-md p-3 text-center bg-purple-50">
                  <div className="text-sm text-purple-700 font-medium mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-purple-800">$16,848</div>
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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search staff or ID..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[150px]">
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
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Staff</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Department</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Month</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                  <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-3 px-4 align-middle">
                      <div className="font-medium">{payment.staffName}</div>
                      <div className="text-xs text-gray-500">{payment.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 align-middle">{payment.department}</td>
                    <td className="py-3 px-4 align-middle">
                      {getMonthName(payment.month)} {payment.year}
                    </td>
                    <td className="py-3 px-4 align-middle font-medium">
                      ${payment.netSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <Badge className={
                        payment.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        payment.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {payment.status === "COMPLETED" ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </>
                        ) : payment.status === "PENDING" ? (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 align-middle text-right">
                      {payment.status === "COMPLETED" ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewPayslip(payment)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Payslip
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleMakePayment(payment)}
                        >
                          <Wallet className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
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
                    <span>${selectedPayment.netSalary.toLocaleString()}</span>
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
                    <div className="text-sm text-gray-500">
                      {getMonthName(selectedPayment.month)} {selectedPayment.year}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Employee Information</div>
                    <div className="font-medium">{selectedPayment.staffName}</div>
                    <div>ID: {selectedPayment.employeeId}</div>
                    <div>Department: {selectedPayment.department}</div>
                    <div>Position: {selectedPayment.position}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 mb-1">Payment Details</div>
                    <div>Date: {selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString() : "Pending"}</div>
                    <div>Mode: {paymentMethods.find(m => m.value === selectedPayment.paymentMethod)?.label || "N/A"}</div>
                    <div>Reference: {selectedPayment.transactionId || "N/A"}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-gray-500 font-medium">Earnings & Deductions</div>
                <div className="border rounded-md">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-2 px-4 text-left font-medium">Description</th>
                        <th className="py-2 px-4 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">Basic Salary</td>
                        <td className="py-3 px-4 text-right">${selectedPayment.basicSalary.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Allowances</td>
                        <td className="py-3 px-4 text-right">${selectedPayment.allowances.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Deductions</td>
                        <td className="py-3 px-4 text-right">-${selectedPayment.deductions.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-gray-50 font-bold">
                        <td className="py-3 px-4">Net Salary</td>
                        <td className="py-3 px-4 text-right">${selectedPayment.netSalary.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="text-center text-xs text-gray-500 pt-4 border-t">
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
