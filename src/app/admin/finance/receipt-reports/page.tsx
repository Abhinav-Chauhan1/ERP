"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Send,
  Download,
  Calendar,
  Mail,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ReceiptReportsPage() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [recipients, setRecipients] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Generate report
  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setReportData(null);

      const response = await fetch("/api/admin/receipt-reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: reportType,
          date: reportDate,
          format: "json",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReportData(data.report);
        toast.success("Report generated successfully");
      } else {
        toast.error(data.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download report as HTML
  const handleDownloadHTML = async () => {
    try {
      const response = await fetch("/api/admin/receipt-reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: reportType,
          date: reportDate,
          format: "html",
        }),
      });

      const html = await response.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-report-${reportType}-${reportDate}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    }
  };

  // Send report via email
  const handleSendReport = async () => {
    if (!recipients.trim()) {
      toast.error("Please enter at least one recipient email address");
      return;
    }

    const emailList = recipients
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emailList.length === 0) {
      toast.error("Please enter valid email addresses");
      return;
    }

    try {
      setIsSending(true);

      const response = await fetch("/api/admin/receipt-reports/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: reportType,
          recipients: emailList,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setRecipients("");
      } else {
        toast.error(data.error || "Failed to send report");
      }
    } catch (error) {
      console.error("Error sending report:", error);
      toast.error("Failed to send report");
    } finally {
      setIsSending(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/admin/finance" className="hover:text-gray-900">
          Finance
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Receipt Reports</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Receipt Reports</h1>
        <p className="text-muted-foreground mt-2">
          Generate and send automated reports for receipt verification activities
        </p>
      </div>

      {/* Report Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Report
            </CardTitle>
            <CardDescription>
              Configure and generate receipt verification reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report Type */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Report Date */}
            <div className="space-y-2">
              <Label>Report Date</Label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {reportType === "daily" && "Report for this specific day"}
                {reportType === "weekly" && "Report for the week containing this date"}
                {reportType === "monthly" && "Report for the month containing this date"}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownloadHTML}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download HTML
              </Button>
            </div>

            <Separator />

            {/* Email Recipients */}
            <div className="space-y-2">
              <Label>Email Recipients</Label>
              <Input
                type="text"
                placeholder="email1@example.com, email2@example.com"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas
              </p>
            </div>

            <Button
              onClick={handleSendReport}
              disabled={isSending || !recipients.trim()}
              variant="secondary"
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send via Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              {reportData
                ? `${reportData.period} report from ${new Date(reportData.startDate).toLocaleDateString()} to ${new Date(reportData.endDate).toLocaleDateString()}`
                : "Generate a report to see the preview"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!reportData ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select report type and date, then click "Generate Report"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Statistics */}
                <div>
                  <h3 className="font-semibold mb-3">Summary Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Uploaded</p>
                      <p className="text-2xl font-bold">{reportData.stats.totalUploaded}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Verified</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reportData.stats.totalVerified}
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">
                        {reportData.stats.totalRejected}
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {reportData.stats.totalPending}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Financial Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(reportData.stats.totalAmount)}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Verified</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(reportData.stats.verifiedAmount)}
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Rejected</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(reportData.stats.rejectedAmount)}
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(reportData.stats.pendingAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="font-semibold mb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Avg. Verification Time</p>
                      <p className="text-xl font-bold text-blue-600">
                        {reportData.stats.averageVerificationTime.toFixed(1)} hours
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        reportData.stats.rejectionRate > 30
                          ? "bg-red-50 dark:bg-red-950/20"
                          : reportData.stats.rejectionRate > 15
                          ? "bg-amber-50 dark:bg-amber-950/20"
                          : "bg-green-50 dark:bg-green-950/20"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">Rejection Rate</p>
                      <p
                        className={`text-xl font-bold ${
                          reportData.stats.rejectionRate > 30
                            ? "text-red-600"
                            : reportData.stats.rejectionRate > 15
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        {reportData.stats.rejectionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Rejection Reasons */}
                {reportData.topRejectionReasons.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Top Rejection Reasons</h3>
                    <div className="space-y-2">
                      {reportData.topRejectionReasons.map((reason: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded"
                        >
                          <span className="text-sm">{reason.reason}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{reason.count}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {reason.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Receipts Alert */}
                {reportData.pendingReceipts.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                          {reportData.pendingReceipts.length} Pending Receipts
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          Oldest receipt has been waiting for{" "}
                          {reportData.pendingReceipts[0].daysWaiting} days
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automated Report Scheduling
          </CardTitle>
          <CardDescription>
            Configure automated report delivery schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Daily Report</h4>
                <Badge variant="outline">9:00 AM</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Sent every day at 9:00 AM with previous day's statistics
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Mail className="mr-2 h-4 w-4" />
                Configure Recipients
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Weekly Report</h4>
                <Badge variant="outline">Mon 9:00 AM</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Sent every Monday with previous week's summary
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Mail className="mr-2 h-4 w-4" />
                Configure Recipients
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Monthly Report</h4>
                <Badge variant="outline">1st 9:00 AM</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Sent on 1st of each month with previous month's data
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Mail className="mr-2 h-4 w-4" />
                Configure Recipients
              </Button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Automated Scheduling Coming Soon
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Automated report scheduling will be available in a future update. For now, you
                  can generate and send reports manually using the form above.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
