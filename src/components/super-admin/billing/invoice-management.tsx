"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Download, 
  Send, 
  Eye, 
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceManagementProps {
  schoolId?: string;
  showAllSchools?: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  dueDate: Date;
  paidAt: Date | null;
  createdAt: Date;
  subscription: {
    id: string;
    school: {
      name: string;
      schoolCode: string;
      email: string;
    };
    plan: {
      name: string;
    };
  };
  metadata?: {
    razorpayInvoiceNumber?: string;
    razorpayShortUrl?: string;
    remindersSent?: number;
    lastReminderSent?: string;
  };
}

export function InvoiceManagement({ schoolId, showAllSchools = true }: InvoiceManagementProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Mock data - in real implementation, this would come from API
  const invoices: Invoice[] = [
    {
      id: "inv_1",
      invoiceNumber: "INV-2024-001",
      amount: 2500,
      currency: "INR",
      status: "PAID",
      dueDate: new Date(),
      paidAt: new Date(),
      createdAt: new Date(),
      subscription: {
        id: "sub_1",
        school: {
          name: "Delhi Public School",
          schoolCode: "DPS001",
          email: "admin@dps001.edu"
        },
        plan: {
          name: "Growth Plan"
        }
      },
      metadata: {
        razorpayInvoiceNumber: "RZP-INV-001",
        remindersSent: 0
      }
    },
    {
      id: "inv_2",
      invoiceNumber: "INV-2024-002",
      amount: 1500,
      currency: "INR",
      status: "OPEN",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      paidAt: null,
      createdAt: new Date(),
      subscription: {
        id: "sub_2",
        school: {
          name: "St. Mary's School",
          schoolCode: "SMS002",
          email: "admin@stmarys.edu"
        },
        plan: {
          name: "Starter Plan"
        }
      },
      metadata: {
        razorpayInvoiceNumber: "RZP-INV-002",
        remindersSent: 1,
        lastReminderSent: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: "inv_3",
      invoiceNumber: "INV-2024-003",
      amount: 1500,
      currency: "INR",
      status: "UNCOLLECTIBLE",
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      paidAt: null,
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      subscription: {
        id: "sub_3",
        school: {
          name: "Green Valley School",
          schoolCode: "GVS003",
          email: "admin@greenvalley.edu"
        },
        plan: {
          name: "Starter Plan"
        }
      },
      metadata: {
        razorpayInvoiceNumber: "RZP-INV-003",
        remindersSent: 3,
        lastReminderSent: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'OPEN':
        return 'secondary';
      case 'VOID':
        return 'destructive';
      case 'UNCOLLECTIBLE':
        return 'destructive';
      case 'DRAFT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'OPEN':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'VOID':
      case 'UNCOLLECTIBLE':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'DRAFT':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const getDaysOverdue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSendReminder = async (invoiceId: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In real implementation, this would send a payment reminder
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In real implementation, this would generate and download PDF
  };

  const handleVoidInvoice = async (invoiceId: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In real implementation, this would void the invoice
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === "" || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.subscription.school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.subscription.school.schoolCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const invoiceStats = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'PAID').length,
    open: invoices.filter(inv => inv.status === 'OPEN').length,
    overdue: invoices.filter(inv => inv.status === 'OPEN' && getDaysOverdue(inv.dueDate) > 0).length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paidAmount: invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-muted-foreground">
            {showAllSchools ? "Manage invoices across all schools" : "School invoice overview"}
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(invoiceStats.totalAmount)} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{invoiceStats.paid}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(invoiceStats.paidAmount)} collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Invoices</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{invoiceStats.open}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(invoiceStats.totalAmount - invoiceStats.paidAmount)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{invoiceStats.overdue}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="VOID">Void</SelectItem>
                <SelectItem value="UNCOLLECTIBLE">Uncollectible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
          <CardDescription>All invoices and their payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Reminders</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.metadata?.razorpayInvoiceNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.subscription.school.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.subscription.school.schoolCode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{invoice.subscription.plan.name}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invoice.status)}
                      <Badge variant={getStatusColor(invoice.status) as any}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{invoice.dueDate.toLocaleDateString()}</div>
                      {invoice.status === 'OPEN' && (
                        <div className={`text-xs ${getDaysOverdue(invoice.dueDate) > 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {getDaysOverdue(invoice.dueDate) > 0 
                            ? `${getDaysOverdue(invoice.dueDate)} days overdue`
                            : `${Math.abs(getDaysOverdue(invoice.dueDate))} days left`
                          }
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{invoice.metadata?.remindersSent || 0} sent</div>
                      {invoice.metadata?.lastReminderSent && (
                        <div className="text-xs text-muted-foreground">
                          Last: {new Date(invoice.metadata.lastReminderSent).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowInvoiceDetails(true);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        {invoice.status === 'OPEN' && (
                          <DropdownMenuItem onClick={() => handleSendReminder(invoice.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send Reminder
                          </DropdownMenuItem>
                        )}
                        {invoice.status === 'PAID' && (
                          <DropdownMenuItem onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowRefundDialog(true);
                          }}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Process Refund
                          </DropdownMenuItem>
                        )}
                        {(invoice.status === 'OPEN' || invoice.status === 'DRAFT') && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleVoidInvoice(invoice.id)}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Void Invoice
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDetails} onOpenChange={setShowInvoiceDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">School</Label>
                  <p>{selectedInvoice.subscription.school.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedInvoice.subscription.school.schoolCode}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <p>{selectedInvoice.subscription.plan.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedInvoice.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedInvoice.status)}
                    <Badge variant={getStatusColor(selectedInvoice.status) as any}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p>{selectedInvoice.dueDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p>{selectedInvoice.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedInvoice.paidAt && (
                <div>
                  <Label className="text-sm font-medium">Paid At</Label>
                  <p>{selectedInvoice.paidAt.toLocaleDateString()}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => handleDownloadInvoice(selectedInvoice.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {selectedInvoice.status === 'OPEN' && (
                  <Button variant="outline" onClick={() => handleSendReminder(selectedInvoice.id)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                placeholder={selectedInvoice ? (selectedInvoice.amount / 100).toString() : "0"}
                max={selectedInvoice ? selectedInvoice.amount / 100 : 0}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum: {selectedInvoice ? formatCurrency(selectedInvoice.amount) : "₹0"}
              </p>
            </div>
            <div>
              <Label htmlFor="refund-reason">Reason for Refund</Label>
              <Textarea
                id="refund-reason"
                placeholder="Enter reason for refund..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button>Process Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}