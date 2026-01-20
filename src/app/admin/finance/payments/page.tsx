"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, Search, DollarSign, PlusCircle,
  CheckCircle, XCircle, Clock, Eye, Edit, Download, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format } from "date-fns";

// Import server actions
import {
  getFeePayments,
  recordPayment,
  updatePayment,
  deletePayment,
  getPendingFees,
  getPaymentStats,
  getStudentsForPayment,
  getFeeStructuresForStudent,
  generateReceiptNumber,
  getPaymentReceiptHTML,
  getConsolidatedReceiptHTML,
} from "@/lib/actions/feePaymentActions";

// Import validation schema
import {
  paymentSchema,
  PaymentFormValues,
} from "@/lib/schemaValidation/feePaymentSchemaValidation";
import { PaymentsTable, PendingFeesTable } from "@/components/admin/finance-tables";

// Payment method options
const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ONLINE_PAYMENT", label: "Online Payment" },
  { value: "SCHOLARSHIP", label: "Scholarship" },
];

// Payment status options
const paymentStatuses = [
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PARTIAL", label: "Partial" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function PaymentsPage() {
  // State management
  const [payments, setPayments] = useState<any[]>([]);
  const [pendingFees, setPendingFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("payments");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Initialize form
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: "",
      feeStructureId: "",
      amount: 0,
      paidAmount: 0,
      paymentDate: new Date(),
      paymentMethod: "CASH",
      transactionId: "",
      receiptNumber: "",
      status: "COMPLETED",
      remarks: "",
    },
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch fee structures when student is selected
  useEffect(() => {
    if (selectedStudentId) {
      fetchFeeStructuresForStudent(selectedStudentId);
    }
  }, [selectedStudentId]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [paymentsResult, pendingResult, studentsResult, statsResult] =
        await Promise.all([
          getFeePayments({ limit: 100 }),
          getPendingFees({ limit: 50 }),
          getStudentsForPayment(),
          getPaymentStats(),
        ]);

      if (paymentsResult.success) setPayments(paymentsResult.data || []);
      if (pendingResult.success) setPendingFees(pendingResult.data || []);
      if (studentsResult.success) setStudents(studentsResult.data || []);
      if (statsResult.success) setStats(statsResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchFeeStructuresForStudent(studentId: string) {
    try {
      const result = await getFeeStructuresForStudent(studentId);
      if (result.success) {
        setFeeStructures(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch fee structures");
      }
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      toast.error("Failed to fetch fee structures");
    }
  }

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.student?.user?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.student?.user?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle create payment
  async function handleCreatePayment() {
    // Generate receipt number
    const receiptResult = await generateReceiptNumber();
    if (receiptResult.success) {
      form.setValue("receiptNumber", receiptResult.data);
    }

    form.reset({
      studentId: "",
      feeStructureId: "",
      amount: 0,
      paidAmount: 0,
      paymentDate: new Date(),
      paymentMethod: "CASH",
      transactionId: "",
      receiptNumber: receiptResult.data || "",
      status: "COMPLETED",
      remarks: "",
    });
    setSelectedPaymentId(null);
    setSelectedStudentId("");
    setFeeStructures([]);
    setCreateDialogOpen(true);
  }

  // Handle edit payment
  function handleEditPayment(payment: any) {
    setSelectedPaymentId(payment.id);
    setSelectedStudentId(payment.studentId);
    form.reset({
      studentId: payment.studentId,
      feeStructureId: payment.feeStructureId,
      amount: payment.amount,
      paidAmount: payment.paidAmount,
      paymentDate: new Date(payment.paymentDate),
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId || "",
      receiptNumber: payment.receiptNumber || "",
      status: payment.status,
      remarks: payment.remarks || "",
    });
    setEditDialogOpen(true);
  }

  // Handle view payment
  function handleViewPayment(payment: any) {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  }

  // Handle delete payment
  function handleDeletePayment(id: string) {
    setSelectedPaymentId(id);
    setDeleteDialogOpen(true);
  }

  // Submit payment form
  async function onSubmitPayment(values: PaymentFormValues) {
    try {
      let result;
      if (selectedPaymentId) {
        result = await updatePayment(selectedPaymentId, values);
      } else {
        result = await recordPayment(values);
      }

      if (result.success) {
        toast.success(
          `Payment ${selectedPaymentId ? "updated" : "recorded"} successfully`
        );
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        form.reset();
        setSelectedPaymentId(null);
        setSelectedStudentId("");
        setFeeStructures([]);
        fetchAllData();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Confirm delete payment
  async function confirmDeletePayment() {
    if (!selectedPaymentId) return;

    try {
      const result = await deletePayment(selectedPaymentId);

      if (result.success) {
        toast.success("Payment deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedPaymentId(null);
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to delete payment");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Handle student selection
  function handleStudentChange(studentId: string) {
    setSelectedStudentId(studentId);
    form.setValue("studentId", studentId);
    form.setValue("feeStructureId", "");
    form.setValue("amount", 0);
  }

  // Handle fee structure selection
  function handleFeeStructureChange(feeStructureId: string) {
    form.setValue("feeStructureId", feeStructureId);
    const selectedStructure = feeStructures.find((fs) => fs.id === feeStructureId);
    if (selectedStructure) {
      const totalAmount = selectedStructure.items.reduce(
        (sum: number, item: any) => sum + item.amount,
        0
      );
      form.setValue("amount", totalAmount);
      form.setValue("paidAmount", totalAmount);
    }
  }

  // Handle download receipt
  async function handleDownloadReceipt(paymentId: string) {
    try {
      const result = await getPaymentReceiptHTML(paymentId);

      if (result.success && result.data?.html) {
        // Open a new window with the receipt HTML for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.data.html);
          printWindow.document.close();
          // Trigger print dialog after a short delay to ensure content is loaded
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          toast.error("Please allow popups to download receipt");
        }
        toast.success("Receipt generated successfully");
      } else {
        toast.error(result.error || "Failed to generate receipt");
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    }
  }

  // Handle consolidated receipt for all payments on a date
  async function handleConsolidatedReceipt(studentId: string, paymentDate: Date) {
    try {
      const result = await getConsolidatedReceiptHTML(studentId, paymentDate);

      if (result.success && result.data?.html) {
        // Open a new window with the receipt HTML for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.data.html);
          printWindow.document.close();
          // Trigger print dialog after a short delay
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          toast.error("Please allow popups to download receipt");
        }
        toast.success(`Consolidated receipt generated (${result.data.paymentCount} payments)`);
      } else {
        toast.error(result.error || "Failed to generate consolidated receipt");
      }
    } catch (error) {
      console.error("Error generating consolidated receipt:", error);
      toast.error("Failed to generate consolidated receipt");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Finance
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
        </div>
        <Button onClick={handleCreatePayment}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold">
                    ₹{stats.totalPaid.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{stats.totalBalance.toLocaleString()}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.collectionRate.toFixed(1)}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold">{stats.totalPayments}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="pending">Pending Fees</TabsTrigger>
        </TabsList>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    View and manage all fee payments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by student name or receipt..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {paymentStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payments Table */}
              {filteredPayments.length === 0 ? (
                <div className="text-center py-10">
                  <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No payments found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Record your first payment to get started"}
                  </p>
                  <Button onClick={handleCreatePayment}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </div>
              ) : (
                <PaymentsTable
                  payments={filteredPayments}
                  onView={handleViewPayment}
                  onEdit={handleEditPayment}
                  onDelete={handleDeletePayment}
                  emptyMessage="No payments found"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Fees Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Fees</CardTitle>
              <CardDescription>
                Students with outstanding fee payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingFees.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">All fees collected!</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no pending fee payments at the moment
                  </p>
                </div>
              ) : (
                <PendingFeesTable
                  fees={pendingFees}
                  onCollect={(fee) => {
                    setSelectedStudentId(fee.studentId);
                    form.setValue("studentId", fee.studentId);
                    form.setValue("feeStructureId", fee.feeStructureId);
                    form.setValue("amount", fee.balance);
                    form.setValue("paidAmount", fee.balance);
                    handleCreatePayment();
                  }}
                  emptyMessage="No pending fees found"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Payment Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          setEditDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPaymentId ? "Edit Payment" : "Record Payment"}
            </DialogTitle>
            <DialogDescription>
              {selectedPaymentId
                ? "Update payment details"
                : "Record a new fee payment"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPayment)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select
                        onValueChange={handleStudentChange}
                        value={field.value}
                        disabled={!!selectedPaymentId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.admissionId})
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
                  name="feeStructureId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Structure</FormLabel>
                      <Select
                        onValueChange={handleFeeStructureChange}
                        value={field.value}
                        disabled={!selectedStudentId || !!selectedPaymentId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee structure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {feeStructures.map((structure) => (
                            <SelectItem key={structure.id} value={structure.id}>
                              {structure.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={format(field.value, "yyyy-MM-dd")}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receiptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setEditDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedPaymentId ? "Update Payment" : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Receipt Number</p>
                  <p className="font-medium">{selectedPayment.receiptNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedPayment.paymentDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Student</p>
                  <p className="font-medium">
                    {selectedPayment.student?.user?.firstName}{" "}
                    {selectedPayment.student?.user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">₹{selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid Amount</p>
                  <p className="font-medium">
                    ₹{selectedPayment.paidAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-medium">₹{selectedPayment.balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge>{selectedPayment.status}</Badge>
                </div>
              </div>
              {selectedPayment.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                  <p className="text-sm">{selectedPayment.remarks}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => selectedPayment && handleConsolidatedReceipt(
                selectedPayment.studentId,
                new Date(selectedPayment.paymentDate)
              )}
              disabled={!selectedPayment?.id || selectedPayment?.status !== "COMPLETED"}
            >
              <Download className="mr-2 h-4 w-4" />
              All Day Receipts
            </Button>
            <Button
              onClick={() => selectedPayment && handleDownloadReceipt(selectedPayment.id)}
              disabled={!selectedPayment?.id || selectedPayment?.status !== "COMPLETED"}
            >
              <Download className="mr-2 h-4 w-4" />
              This Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment record? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeletePayment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

