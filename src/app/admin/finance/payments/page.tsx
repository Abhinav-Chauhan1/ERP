"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Search, Filter, DollarSign, 
  CheckCircle, XCircle, Clock, MessageSquare, 
  Eye, Edit, Download, Printer, AlertCircle
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
  DialogTrigger,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data for students
const students = [
  { id: "s1", name: "John Smith", grade: "Grade 9-A", admissionId: "ADM001" },
  { id: "s2", name: "Emily Johnson", grade: "Grade 9-A", admissionId: "ADM002" },
  { id: "s3", name: "Michael Brown", grade: "Grade 9-A", admissionId: "ADM003" },
  { id: "s4", name: "Sarah Davis", grade: "Grade 9-A", admissionId: "ADM004" },
  { id: "s5", name: "James Wilson", grade: "Grade 9-A", admissionId: "ADM005" },
];

// Mock data for payments
const payments = [
  {
    id: "p1",
    studentId: "s1",
    studentName: "John Smith",
    grade: "Grade 9-A",
    paymentDate: "2023-11-29",
    receiptNumber: "R12345",
    amount: 1250,
    paidAmount: 1250,
    balance: 0,
    paymentMethod: "CASH",
    status: "COMPLETED",
    feeStructure: "Tuition",
  },
  {
    id: "p2",
    studentId: "s2",
    studentName: "Emily Johnson",
    grade: "Grade 9-A",
    paymentDate: "2023-11-28",
    receiptNumber: "R12346",
    amount: 1250,
    paidAmount: 1000,
    balance: 250,
    paymentMethod: "BANK_TRANSFER",
    status: "PARTIAL",
    feeStructure: "Tuition",
  },
];

// Mock data for pending fees
const pendingFees = [
  {
    id: "f1",
    studentName: "James Wilson",
    grade: "Grade 9-A",
    dueDate: "2023-12-05",
    amount: 1250,
    status: "OVERDUE",
    daysPast: 3,
  },
  {
    id: "f2",
    studentName: "Sarah Davis",
    grade: "Grade 9-A",
    dueDate: "2023-12-10",
    amount: 1250,
    status: "UNPAID",
    daysPast: 0,
  },
];

// Mock payment methods
const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ONLINE_PAYMENT", label: "Online Payment" },
];

const paymentSchema = z.object({
  studentId: z.string(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.string(),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

export default function PaymentsPage() {
  const [createPaymentDialog, setCreatePaymentDialog] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: "",
      amount: 0,
      paymentMethod: "",
      transactionId: "",
      remarks: "",
    },
  });

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleCreatePayment() {
    form.reset();
    setCreatePaymentDialog(true);
  }

// Define interfaces for the data structures
interface Student {
    id: string;
    name: string;
    grade: string;
    admissionId: string;
}

interface Payment {
    id: string;
    studentId: string;
    studentName: string;
    grade: string;
    paymentDate: string;
    receiptNumber: string;
    amount: number;
    paidAmount: number;
    balance: number;
    paymentMethod: string;
    status: string;
    feeStructure: string;
}

interface PendingFee {
    id: string;
    studentName: string;
    grade: string;
    dueDate: string;
    amount: number;
    status: string;
    daysPast: number;
}

interface PaymentMethod {
    value: string;
    label: string;
}

    function handleViewReceipt(paymentId: string): void {
        const payment = payments.find((p) => p.id === paymentId);
        setSelectedPayment(payment as Payment | null);
        setReceiptDialog(true);
    }

function onSubmit(values: z.infer<typeof paymentSchema>): void {
    console.log("Payment recorded:", values);
    setCreatePaymentDialog(false);
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
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        </div>
        <Dialog open={createPaymentDialog} onOpenChange={setCreatePaymentDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleCreatePayment}>
              <DollarSign className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a fee payment for a student
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.grade})
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
                        <Input type="number" {...field} />
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
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID/Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Receipt number, cheque number, etc." 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional notes about this payment" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreatePaymentDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Payment</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-base">Quick Payment</CardTitle>
              <CardDescription>Quickly record a student fee payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-2">
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreatePayment} className="whitespace-nowrap">
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-base">Payment Statistics</CardTitle>
              <CardDescription>Today's fee collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded-md p-2 text-center">
                  <div className="text-2xl font-bold text-green-600">$5,280</div>
                  <div className="text-xs text-gray-500">Collected Today</div>
                </div>
                <div className="border rounded-md p-2 text-center">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-gray-500">Transactions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending Fees</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Fee Payments</CardTitle>
                  <CardDescription>
                    Recent fee payments from students
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search student or receipt..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Receipt</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Method</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{payment.receiptNumber}</td>
                        <td className="py-3 px-4 align-middle">
                          <div>{payment.studentName}</div>
                          <div className="text-xs text-gray-500">{payment.grade}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="font-medium">${payment.paidAmount.toLocaleString()}</div>
                          {payment.balance > 0 && (
                            <div className="text-xs text-red-600">
                              Balance: ${payment.balance.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {paymentMethods.find(m => m.value === payment.paymentMethod)?.label || payment.paymentMethod}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={
                            payment.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                            payment.status === "PARTIAL" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                          }>
                            {payment.status === "COMPLETED" ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </>
                            ) : payment.status === "PARTIAL" ? (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Partial
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewReceipt(payment.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                          {payment.status === "PARTIAL" && (
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Add Payment
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Fee Payments</CardTitle>
              <CardDescription>Students with pending fee payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Due Date</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingFees.map((fee) => (
                      <tr key={fee.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{fee.studentName}</td>
                        <td className="py-3 px-4 align-middle">{fee.grade}</td>
                        <td className="py-3 px-4 align-middle">{new Date(fee.dueDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 align-middle">${fee.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={
                            fee.status === "UNPAID" ? "bg-gray-100 text-gray-800" :
                            fee.status === "PARTIAL" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                          }>
                            {fee.status}
                            {fee.status === "OVERDUE" && fee.daysPast > 0 && ` (${fee.daysPast} days)`}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm" onClick={handleCreatePayment}>
                            <DollarSign className="h-4 w-4 mr-1" />
                            Collect
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Remind
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Payments</CardTitle>
              <CardDescription>Payments past their due date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-10 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-red-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Overdue Payments</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  View and manage all payments that are currently past their due date
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Reminders
                  </Button>
                  <Button>Generate Report</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>
              Receipt #{selectedPayment?.receiptNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="font-bold text-xl">School Name</div>
                  <div className="text-right">
                    <div className="font-bold">RECEIPT</div>
                    <div className="text-sm text-gray-500">#{selectedPayment.receiptNumber}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Student Information</div>
                    <div className="font-medium">{selectedPayment.studentName}</div>
                    <div>{selectedPayment.grade}</div>
                    <div>ID: {students.find(s => s.id === selectedPayment.studentId)?.admissionId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 mb-1">Receipt Details</div>
                    <div>Date: {new Date(selectedPayment.paymentDate).toLocaleDateString()}</div>
                    <div>Payment Method: {paymentMethods.find(m => m.value === selectedPayment.paymentMethod)?.label}</div>
                    <div>Status: {selectedPayment.status}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-gray-500 font-medium">Payment Details</div>
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
                        <td className="py-3 px-4">{selectedPayment.feeStructure} Fee</td>
                        <td className="py-3 px-4 text-right">${selectedPayment.amount.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">Total Amount</td>
                        <td className="py-3 px-4 text-right font-medium">${selectedPayment.amount.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4 font-medium">Amount Paid</td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">${selectedPayment.paidAmount.toLocaleString()}</td>
                      </tr>
                      {selectedPayment.balance > 0 && (
                        <tr className="bg-gray-50">
                          <td className="py-3 px-4 font-medium">Balance Due</td>
                          <td className="py-3 px-4 text-right font-medium text-red-600">${selectedPayment.balance.toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="text-center text-xs text-gray-500 pt-4 border-t">
                  <p>This is a computer generated receipt and does not require a signature.</p>
                  <p>Thank you for your payment!</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialog(false)}>
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