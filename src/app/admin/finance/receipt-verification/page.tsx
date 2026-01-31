"use client";

import { useState, useEffect } from "react";
import { ReceiptStatus } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Clock,
  TrendingUp,
  ArrowLeft,
  Download,
  BarChart3,
  History,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PendingReceiptsTable } from "@/components/admin/pending-receipts-table";
import { ReceiptsHistoryTable } from "@/components/admin/receipts-history-table";
import { ReceiptVerificationDialog } from "@/components/admin/receipt-verification-dialog";
import { ReceiptRejectionDialog } from "@/components/admin/receipt-rejection-dialog";
import {
  getVerifiedReceipts,
  getRejectedReceipts,
  getVerificationStats,
} from "@/lib/actions/receiptVerificationActions";
import { getReceiptById } from "@/lib/actions/paymentReceiptActions";
import { exportReceipts } from "@/lib/utils/receipt-export";
import toast from "react-hot-toast";

interface Receipt {
  id: string;
  referenceNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  status: ReceiptStatus;
  transactionRef?: string | null;
  remarks?: string | null;
  createdAt: Date;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  receiptImageUrl: string;
  student: {
    id: string;
    admissionNumber?: string | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    };
    enrollments: Array<{
      class: {
        name: string;
      };
      section: {
        name: string;
      };
    }>;
  };
  feeStructure: {
    id: string;
    name: string;
    items: Array<{
      amount: number;
    }>;
  };
  feePayment?: {
    id: string;
    status: string;
    paidAmount: number;
  } | null;
}

export default function ReceiptVerificationPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [verifiedReceipts, setVerifiedReceipts] = useState<Receipt[]>([]);
  const [rejectedReceipts, setRejectedReceipts] = useState<Receipt[]>([]);
  const [isLoadingVerified, setIsLoadingVerified] = useState(false);
  const [isLoadingRejected, setIsLoadingRejected] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Dialog states
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  // Load verified receipts when tab changes
  useEffect(() => {
    if (activeTab === "verified") {
      loadVerifiedReceipts();
    }
  }, [activeTab, refreshKey]);

  // Load rejected receipts when tab changes
  useEffect(() => {
    if (activeTab === "rejected") {
      loadRejectedReceipts();
    }
  }, [activeTab, refreshKey]);

  const loadStats = async () => {
    setIsLoadingStats(true);
    const result = await getVerificationStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
    setIsLoadingStats(false);
  };

  const loadVerifiedReceipts = async () => {
    setIsLoadingVerified(true);
    const result = await getVerifiedReceipts({ limit: 50 });
    if (result.success && result.data) {
      setVerifiedReceipts(result.data);
    } else {
      toast.error(result.error || "Failed to load verified receipts");
    }
    setIsLoadingVerified(false);
  };

  const loadRejectedReceipts = async () => {
    setIsLoadingRejected(true);
    const result = await getRejectedReceipts({ limit: 50 });
    if (result.success && result.data) {
      setRejectedReceipts(result.data);
    } else {
      toast.error(result.error || "Failed to load rejected receipts");
    }
    setIsLoadingRejected(false);
  };

  const handleVerifyClick = async (receiptId: string) => {
    const result = await getReceiptById(receiptId);
    if (result.success && result.data) {
      setSelectedReceipt(result.data);
      setShowVerificationDialog(true);
    } else {
      toast.error(result.error || "Failed to load receipt details");
    }
  };

  const handleRejectClick = async (receiptId: string) => {
    const result = await getReceiptById(receiptId);
    if (result.success && result.data) {
      setSelectedReceipt(result.data);
      setShowRejectionDialog(true);
    } else {
      toast.error(result.error || "Failed to load receipt details");
    }
  };

  const handleVerified = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success("Receipt verified successfully!");
  };

  const handleRejected = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success("Receipt rejected successfully!");
  };

  const handleViewDetails = async (receiptId: string) => {
    const result = await getReceiptById(receiptId);
    if (result.success && result.data) {
      setSelectedReceipt(result.data);
      setShowVerificationDialog(true);
    } else {
      toast.error(result.error || "Failed to load receipt details");
    }
  };

  // Export handlers
  const handleExportVerified = () => {
    if (verifiedReceipts.length === 0) {
      toast.error("No verified receipts to export");
      return;
    }

    const exportData = verifiedReceipts.map((receipt) => ({
      referenceNumber: receipt.referenceNumber,
      status: receipt.status,
      studentName: `${receipt.student.user.firstName} ${receipt.student.user.lastName}`,
      studentEmail: receipt.student.user.email,
      admissionNumber: receipt.student.admissionNumber,
      class: receipt.student.enrollments[0]?.class.name || "N/A",
      section: receipt.student.enrollments[0]?.section.name || "N/A",
      feeStructure: receipt.feeStructure.name,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod as any,
      paymentDate: receipt.paymentDate,
      submittedDate: receipt.createdAt,
      verifiedDate: receipt.verifiedAt,
      verifiedBy: receipt.verifiedBy || undefined,
      rejectionReason: receipt.rejectionReason,
      transactionRef: receipt.transactionRef,
      remarks: receipt.remarks,
    }));

    exportReceipts(exportData, "verified");
    toast.success("Verified receipts exported successfully");
  };

  const handleExportRejected = () => {
    if (rejectedReceipts.length === 0) {
      toast.error("No rejected receipts to export");
      return;
    }

    const exportData = rejectedReceipts.map((receipt) => ({
      referenceNumber: receipt.referenceNumber,
      status: receipt.status,
      studentName: `${receipt.student.user.firstName} ${receipt.student.user.lastName}`,
      studentEmail: receipt.student.user.email,
      admissionNumber: receipt.student.admissionNumber,
      class: receipt.student.enrollments[0]?.class.name || "N/A",
      section: receipt.student.enrollments[0]?.section.name || "N/A",
      feeStructure: receipt.feeStructure.name,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod as any,
      paymentDate: receipt.paymentDate,
      submittedDate: receipt.createdAt,
      verifiedDate: receipt.verifiedAt,
      verifiedBy: receipt.verifiedBy || undefined,
      rejectionReason: receipt.rejectionReason,
      transactionRef: receipt.transactionRef,
      remarks: receipt.remarks,
    }));

    exportReceipts(exportData, "rejected");
    toast.success("Rejected receipts exported successfully");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Receipt Verification</h1>
            <p className="text-muted-foreground">
              Review and verify offline payment receipts submitted by students
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/finance/receipt-reports">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/finance/receipt-audit-logs">
              <History className="mr-2 h-4 w-4" />
              Audit Logs
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/finance/receipt-analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <CardDescription>Pending Verification</CardDescription>
            </div>
            <CardTitle className="text-3xl text-amber-600">
              {isLoadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                stats?.pendingCount || 0
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Awaiting review
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardDescription>Total Pending Amount</CardDescription>
            </div>
            <CardTitle className="text-3xl text-primary">
              {isLoadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                `₹${((stats?.totalAmount || 0) / 1000).toFixed(1)}k`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Unverified payments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <CardDescription>Verified</CardDescription>
            </div>
            <CardTitle className="text-3xl text-green-600">
              {isLoadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                stats?.verifiedCount || 0
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Approved receipts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <CardDescription>Rejected</CardDescription>
            </div>
            <CardTitle className="text-3xl text-red-600">
              {isLoadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                stats?.rejectedCount || 0
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Declined receipts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Verification
            {stats?.pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Verified
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Receipts</CardTitle>
              <CardDescription>
                Review and verify payment receipts submitted by students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingReceiptsTable
                key={refreshKey}
                onVerify={handleVerifyClick}
                onReject={handleRejectClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verified Tab */}
        <TabsContent value="verified" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Verified Receipts</CardTitle>
                  <CardDescription>
                    History of verified payment receipts
                  </CardDescription>
                </div>
                <Button
                  onClick={handleExportVerified}
                  variant="outline"
                  size="sm"
                  disabled={verifiedReceipts.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingVerified ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : verifiedReceipts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No verified receipts found.
                  </AlertDescription>
                </Alert>
              ) : (
                <ReceiptsHistoryTable
                  data={verifiedReceipts}
                  type="verified"
                  onView={handleViewDetails}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Rejected Receipts</CardTitle>
                  <CardDescription>
                    History of rejected payment receipts with reasons
                  </CardDescription>
                </div>
                <Button
                  onClick={handleExportRejected}
                  variant="outline"
                  size="sm"
                  disabled={rejectedReceipts.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRejected ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : rejectedReceipts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No rejected receipts found.
                  </AlertDescription>
                </Alert>
              ) : (
                <ReceiptsHistoryTable
                  data={rejectedReceipts}
                  type="rejected"
                  onView={handleViewDetails}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ReceiptVerificationDialog
        receipt={selectedReceipt}
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        onVerified={handleVerified}
        onReject={() => {
          setShowVerificationDialog(false);
          setShowRejectionDialog(true);
        }}
      />

      <ReceiptRejectionDialog
        receipt={selectedReceipt}
        open={showRejectionDialog}
        onOpenChange={setShowRejectionDialog}
        onRejected={handleRejected}
      />
    </div>
  );
}
