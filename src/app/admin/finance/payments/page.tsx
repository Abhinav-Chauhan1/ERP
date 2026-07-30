"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, DollarSign, PlusCircle,
  CheckCircle, XCircle, Clock, Eye, Edit, Download, Loader2, AlertCircle,
  ChevronsUpDown, Check,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
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
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { cn, formatFullName } from "@/lib/utils";

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
import { getAcademicYears } from "@/lib/actions/academicyearsActions";

// Import validation schemas
import {
  recordPaymentSchema,
  RecordPaymentFormValues,
  paymentUpdateSchema,
  PaymentUpdateFormValues,
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
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("payments");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [feeStructuresLoading, setFeeStructuresLoading] = useState(false);

  // Record Payment (create) flow state
  const [createStage, setCreateStage] = useState<"search" | "review" | "success">("search");
  const [paymentMode, setPaymentMode] = useState<"full" | "partial">("full");
  const [createdPayment, setCreatedPayment] = useState<any>(null);
  const [studentComboboxOpen, setStudentComboboxOpen] = useState(false);

  // Record Payment form (guided create flow — no amount/status fields, both
  // derived server-side)
  const createForm = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      studentId: "",
      feeStructureId: "",
      paidAmount: 0,
      paymentDate: new Date(),
      paymentMethod: "CASH",
      transactionId: "",
      receiptNumber: "",
      remarks: "",
    },
  });

  // Edit Payment form (manual correction flow — keeps full control over
  // amount/paidAmount/status)
  const editForm = useForm<PaymentUpdateFormValues>({
    resolver: zodResolver(paymentUpdateSchema),
    defaultValues: {
      id: "",
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

  const selectedStructure = feeStructures.find(
    (fs) => fs.id === createForm.watch("feeStructureId")
  );

  // Load academic years and students once on mount, defaulting the year
  // filter to the current session so this page doesn't fetch data twice.
  useEffect(() => {
    (async () => {
      const [yearsResult, studentsResult] = await Promise.all([
        getAcademicYears(),
        getStudentsForPayment(),
      ]);
      if (yearsResult.success) {
        const years = yearsResult.data || [];
        setAcademicYears(years);
        const currentYear = years.find((y: any) => y.isCurrent);
        setAcademicYearFilter(currentYear?.id ?? "all");
      } else {
        setAcademicYearFilter("all");
      }
      if (studentsResult.success) setStudents(studentsResult.data || []);
    })();
  }, []);

  // Fetch payments/pending fees/stats whenever the session filter changes
  useEffect(() => {
    if (!academicYearFilter) return; // not yet resolved from mount effect
    fetchFinanceData(academicYearFilter);
  }, [academicYearFilter]);

  // Fetch fee structures when student is selected
  useEffect(() => {
    if (selectedStudentId) {
      fetchFeeStructuresForStudent(selectedStudentId);
    }
  }, [selectedStudentId]);

  // Auto-resolve the fee structure once it's loaded: pick it automatically
  // when there's exactly one applicable structure (the common case), or
  // preserve a prefilled selection (e.g. from "Collect") if it's still valid.
  useEffect(() => {
    if (!createDialogOpen || createStage !== "review" || feeStructuresLoading) return;
    const currentId = createForm.getValues("feeStructureId");
    if (currentId && feeStructures.some((fs) => fs.id === currentId)) return;
    if (feeStructures.length === 1) {
      createForm.setValue("feeStructureId", feeStructures[0].id);
    }
  }, [feeStructures, feeStructuresLoading, createDialogOpen, createStage]);

  // Keep "Amount to Collect Now" synced to what's actually due today (accrual-
  // based, matching Pending Fees/dashboards elsewhere) while in "due" mode. If
  // nothing has accrued yet but a full-year balance remains, default to the
  // custom-amount path instead, since collecting ₹0 isn't a meaningful default.
  useEffect(() => {
    if (createStage !== "review" || !selectedStructure) return;
    if (selectedStructure.dueNow <= 0 && selectedStructure.fullRemainingBalance > 0) {
      if (paymentMode === "full") setPaymentMode("partial");
      return;
    }
    if (paymentMode === "full" && selectedStructure.dueNow > 0) {
      createForm.setValue("paidAmount", selectedStructure.dueNow);
    }
  }, [selectedStructure?.id, selectedStructure?.dueNow, selectedStructure?.fullRemainingBalance, paymentMode, createStage]);

  async function fetchFinanceData(academicYearId: string) {
    setLoading(true);
    try {
      const yearFilter = academicYearId === "all" ? undefined : academicYearId;
      const [paymentsResult, pendingResult, statsResult] =
        await Promise.all([
          getFeePayments({ limit: 100, academicYearId: yearFilter }),
          getPendingFees({ limit: 50, academicYearId: yearFilter }),
          getPaymentStats({ academicYearId: yearFilter }),
        ]);

      if (paymentsResult.success) setPayments(paymentsResult.data || []);
      if (pendingResult.success) setPendingFees(pendingResult.data || []);
      if (statsResult.success) setStats(statsResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch everything after a payment is created/updated/deleted
  async function fetchAllData() {
    await fetchFinanceData(academicYearFilter || "all");
  }

  async function fetchFeeStructuresForStudent(studentId: string) {
    setFeeStructuresLoading(true);
    try {
      const result = await getFeeStructuresForStudent(studentId);
      if (result.success) {
        setFeeStructures(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch fee structures");
        setFeeStructures([]);
      }
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      toast.error("Failed to fetch fee structures");
      setFeeStructures([]);
    } finally {
      setFeeStructuresLoading(false);
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

  // Open the guided Record Payment dialog, optionally prefilled with a
  // student/fee structure (e.g. from the "Collect" action on Pending Fees).
  async function openRecordPaymentDialog(prefill?: { studentId: string; feeStructureId?: string }) {
    const receiptResult = await generateReceiptNumber();

    createForm.reset({
      studentId: prefill?.studentId || "",
      feeStructureId: prefill?.feeStructureId || "",
      paidAmount: 0,
      paymentDate: new Date(),
      paymentMethod: "CASH",
      transactionId: "",
      receiptNumber: receiptResult.success ? receiptResult.data : "",
      remarks: "",
    });
    setCreatedPayment(null);
    setPaymentMode("full");
    setSelectedPaymentId(null);

    if (prefill?.studentId) {
      setSelectedStudentId(prefill.studentId);
      setFeeStructures([]);
      setCreateStage("review");
      fetchFeeStructuresForStudent(prefill.studentId);
    } else {
      setSelectedStudentId("");
      setFeeStructures([]);
      setCreateStage("search");
    }
    setCreateDialogOpen(true);
  }

  // Student selected from the search combobox — advance straight to the
  // balance-due review step while fee structures load in the background.
  function handleSelectStudentForPayment(studentId: string) {
    setSelectedStudentId(studentId);
    createForm.setValue("studentId", studentId);
    createForm.setValue("feeStructureId", "");
    setStudentComboboxOpen(false);
    setCreateStage("review");
  }

  function closeCreateDialog() {
    setCreateDialogOpen(false);
    createForm.reset({
      studentId: "",
      feeStructureId: "",
      paidAmount: 0,
      paymentDate: new Date(),
      paymentMethod: "CASH",
      transactionId: "",
      receiptNumber: "",
      remarks: "",
    });
    setSelectedStudentId("");
    setFeeStructures([]);
    setCreateStage("search");
    setPaymentMode("full");
    setCreatedPayment(null);
  }

  // Handle edit payment
  function handleEditPayment(payment: any) {
    setSelectedPaymentId(payment.id);
    setSelectedStudentId(payment.studentId);
    editForm.reset({
      id: payment.id,
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

  // Submit the Record Payment form
  async function onSubmitCreatePayment(values: RecordPaymentFormValues) {
    try {
      const result = await recordPayment(values);
      if (result.success) {
        toast.success("Payment recorded successfully");
        setCreatedPayment(result.data);
        setCreateStage("success");
        fetchAllData();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Submit the Edit Payment form
  async function onSubmitEditPayment(values: PaymentUpdateFormValues) {
    if (!selectedPaymentId) return;
    try {
      const result = await updatePayment(selectedPaymentId, values);
      if (result.success) {
        toast.success("Payment updated successfully");
        setEditDialogOpen(false);
        editForm.reset();
        setSelectedPaymentId(null);
        setSelectedStudentId("");
        setFeeStructures([]);
        fetchAllData();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
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

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                  {year.isCurrent ? " (Current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => openRecordPaymentDialog()} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
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
                <DollarSign className="h-8 w-8 text-teal-500" />
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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                  <Button onClick={() => openRecordPaymentDialog()}>
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
                    openRecordPaymentDialog({
                      studentId: fee.studentId,
                      feeStructureId: fee.feeStructureId,
                    });
                  }}
                  emptyMessage="No pending fees found"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog — guided flow: search student, review resolved
          balance, pay full or partial, submit, then a receipt step. */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => (open ? setCreateDialogOpen(true) : closeCreateDialog())}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {createStage === "success"
                ? "Payment recorded"
                : "Search for a student to collect a fee payment"}
            </DialogDescription>
          </DialogHeader>

          {createStage === "search" && (
            <div className="space-y-2">
              <Label>Student</Label>
              <Popover open={studentComboboxOpen} onOpenChange={setStudentComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentComboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    Search by name, admission ID, or class...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0 w-[var(--radix-popover-trigger-width)]"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search students..." />
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {students.map((student) => (
                        <CommandItem
                          key={student.id}
                          value={`${student.name} ${student.admissionId} ${student.class} ${student.section}`}
                          onSelect={() => handleSelectStudentForPayment(student.id)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {student.admissionId} • {student.class}-{student.section}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {createStage === "review" && (
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onSubmitCreatePayment)} className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-medium">
                      {students.find((s) => s.id === selectedStudentId)?.name || "—"}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCreateStage("search")}>
                    Change
                  </Button>
                </div>

                {feeStructuresLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading fee details...
                  </div>
                ) : feeStructures.length === 0 ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    No applicable fee structure found for this student's class.
                  </div>
                ) : (
                  <>
                    {feeStructures.length > 1 ? (
                      <FormField
                        control={createForm.control}
                        name="feeStructureId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fee Structure</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                    ) : (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Fee Structure: </span>
                        <span className="font-medium">{feeStructures[0]?.name}</span>
                      </p>
                    )}

                    {selectedStructure && (
                      selectedStructure.fullRemainingBalance <= 0 ? (
                        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                          This student has no outstanding balance for this fee structure.
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3 rounded-md border p-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total Fee (after discount)</p>
                              <p className="font-semibold">
                                ₹{selectedStructure.netPayableAmount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Already Paid</p>
                              <p className="font-semibold">
                                ₹{(selectedStructure.netPayableAmount - selectedStructure.fullRemainingBalance).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Due Now</p>
                              <p className="font-semibold text-orange-600">
                                ₹{selectedStructure.dueNow.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {selectedStructure.dueNow < selectedStructure.fullRemainingBalance && (
                            <p className="text-xs text-muted-foreground">
                              Full year remaining: ₹{selectedStructure.fullRemainingBalance.toLocaleString()}
                              {" "}(includes fees not yet due — e.g. future months of a monthly fee)
                            </p>
                          )}

                          <div className="flex gap-2">
                            {selectedStructure.dueNow > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant={paymentMode === "full" ? "default" : "outline"}
                                onClick={() => {
                                  setPaymentMode("full");
                                  createForm.setValue("paidAmount", selectedStructure.dueNow);
                                }}
                              >
                                Pay Amount Due
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant={paymentMode === "partial" ? "default" : "outline"}
                              onClick={() => setPaymentMode("partial")}
                            >
                              Custom Amount
                            </Button>
                          </div>

                          <FormField
                            control={createForm.control}
                            name="paidAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount to Collect Now</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    max={selectedStructure.fullRemainingBalance}
                                    disabled={paymentMode === "full"}
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={createForm.control}
                              name="paymentDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Date</FormLabel>
                                  <DatePicker date={field.value} onSelect={field.onChange} />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={createForm.control}
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
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={createForm.control}
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
                              control={createForm.control}
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
                            control={createForm.control}
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
                            <Button type="button" variant="outline" onClick={closeCreateDialog}>
                              Cancel
                            </Button>
                            <Button type="submit">Record Payment</Button>
                          </DialogFooter>
                        </>
                      )
                    )}
                  </>
                )}
              </form>
            </Form>
          )}

          {createStage === "success" && createdPayment && (
            <div className="space-y-4 text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <p className="text-lg font-semibold">
                  ₹{createdPayment.paidAmount.toLocaleString()} collected from{" "}
                  {formatFullName(
                    createdPayment.student.user.firstName,
                    createdPayment.student.user.lastName
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  Receipt #{createdPayment.receiptNumber}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" onClick={() => handleDownloadReceipt(createdPayment.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Print / Download Receipt
                </Button>
                <Button variant="outline" onClick={() => openRecordPaymentDialog()}>
                  Record Another Payment
                </Button>
                <Button onClick={closeCreateDialog}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog — manual correction flow, keeps full control
          over amount/paidAmount/status. */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update payment details</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEditPayment)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled>
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
                  control={editForm.control}
                  name="feeStructureId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Structure</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled>
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <DatePicker date={field.value} onSelect={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                control={editForm.control}
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
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Payment</Button>
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

