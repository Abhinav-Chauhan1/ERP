/**
 * Receipt Report Service
 * 
 * Generates automated reports for receipt verification activities.
 * Supports daily, weekly, and monthly reports with email delivery.
 */

import { db } from "@/lib/db";
import { ReceiptStatus } from "@prisma/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";

interface ReportData {
  period: string;
  startDate: Date;
  endDate: Date;
  stats: {
    totalUploaded: number;
    totalVerified: number;
    totalRejected: number;
    totalPending: number;
    totalAmount: number;
    verifiedAmount: number;
    rejectedAmount: number;
    pendingAmount: number;
    averageVerificationTime: number; // in hours
    rejectionRate: number; // percentage
  };
  topRejectionReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  pendingReceipts: Array<{
    id: string;
    referenceNumber: string;
    studentName: string;
    amount: number;
    daysWaiting: number;
  }>;
  adminActivity: Array<{
    adminName: string;
    verified: number;
    rejected: number;
    total: number;
  }>;
}

/**
 * Generate daily verification summary report
 */
export async function generateDailyReport(date: Date = new Date()): Promise<ReportData> {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  return await generateReport("Daily", startDate, endDate);
}

/**
 * Generate weekly pending receipts reminder
 */
export async function generateWeeklyReport(date: Date = new Date()): Promise<ReportData> {
  const startDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(date, { weekStartsOn: 1 }); // Sunday

  return await generateReport("Weekly", startDate, endDate);
}

/**
 * Generate monthly collection report
 */
export async function generateMonthlyReport(date: Date = new Date()): Promise<ReportData> {
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);

  return await generateReport("Monthly", startDate, endDate);
}

/**
 * Core report generation function
 */
async function generateReport(
  period: string,
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  try {
    // Fetch all receipts in the period
    const receipts = await db.paymentReceipt.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Calculate statistics
    const totalUploaded = receipts.length;
    const verified = receipts.filter((r) => r.status === ReceiptStatus.VERIFIED);
    const rejected = receipts.filter((r) => r.status === ReceiptStatus.REJECTED);
    const pending = receipts.filter((r) => r.status === ReceiptStatus.PENDING_VERIFICATION);

    const totalVerified = verified.length;
    const totalRejected = rejected.length;
    const totalPending = pending.length;

    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
    const verifiedAmount = verified.reduce((sum, r) => sum + r.amount, 0);
    const rejectedAmount = rejected.reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = pending.reduce((sum, r) => sum + r.amount, 0);

    // Calculate average verification time
    const verifiedWithTime = verified.filter((r) => r.verifiedAt);
    const totalVerificationTime = verifiedWithTime.reduce((sum, r) => {
      if (r.verifiedAt) {
        const diff = r.verifiedAt.getTime() - r.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60); // Convert to hours
      }
      return sum;
    }, 0);
    const averageVerificationTime = verifiedWithTime.length > 0
      ? totalVerificationTime / verifiedWithTime.length
      : 0;

    // Calculate rejection rate
    const rejectionRate = totalUploaded > 0
      ? (totalRejected / totalUploaded) * 100
      : 0;

    // Get top rejection reasons
    const rejectionReasons = rejected
      .filter((r) => r.rejectionReason)
      .map((r) => r.rejectionReason!);

    const reasonCounts = rejectionReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topRejectionReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: (count / totalRejected) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get pending receipts with waiting time
    const now = new Date();
    const pendingReceipts = pending
      .map((r) => ({
        id: r.id,
        referenceNumber: r.referenceNumber,
        studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
        amount: r.amount,
        daysWaiting: Math.floor((now.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => b.daysWaiting - a.daysWaiting)
      .slice(0, 10);

    // Get admin activity
    // Get admin activity
    // First fetch relevant receipts
    const verifiedOrRejectedReceipts = await db.paymentReceipt.findMany({
      where: {
        verifiedAt: {
          gte: startDate,
          lte: endDate,
        },
        verifiedBy: {
          not: null,
        },
      },
      select: {
        verifiedBy: true,
        status: true,
      },
    });

    // Group by admin
    const adminStats = new Map<string, { verified: number; rejected: number }>();
    verifiedOrRejectedReceipts.forEach((r) => {
      const adminId = r.verifiedBy!;
      const stats = adminStats.get(adminId) || { verified: 0, rejected: 0 };
      if (r.status === ReceiptStatus.VERIFIED) stats.verified++;
      if (r.status === ReceiptStatus.REJECTED) stats.rejected++;
      adminStats.set(adminId, stats);
    });

    const adminIds = Array.from(adminStats.keys());
    const admins = await db.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const adminActivity = admins
      .map((admin) => {
        const stats = adminStats.get(admin.id) || { verified: 0, rejected: 0 };
        return {
          adminName: `${admin.firstName} ${admin.lastName}`,
          verified: stats.verified,
          rejected: stats.rejected,
          total: stats.verified + stats.rejected,
        };
      })
      .sort((a, b) => b.total - a.total);

    return {
      period,
      startDate,
      endDate,
      stats: {
        totalUploaded,
        totalVerified,
        totalRejected,
        totalPending,
        totalAmount,
        verifiedAmount,
        rejectedAmount,
        pendingAmount,
        averageVerificationTime,
        rejectionRate,
      },
      topRejectionReasons,
      pendingReceipts,
      adminActivity,
    };
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}

/**
 * Format report as HTML email
 */
export function formatReportAsHTML(report: ReportData): string {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const formatDate = (date: Date) => date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; }
    .section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .section h2 { margin-top: 0; color: #1f2937; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .stat-card { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
    .stat-value.success { color: #10b981; }
    .stat-value.danger { color: #ef4444; }
    .stat-value.warning { color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #374151; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge.success { background: #d1fae5; color: #065f46; }
    .badge.danger { background: #fee2e2; color: #991b1b; }
    .badge.warning { background: #fef3c7; color: #92400e; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${report.period} Receipt Verification Report</h1>
      <p>${formatDate(report.startDate)} - ${formatDate(report.endDate)}</p>
    </div>

    <div class="section">
      <h2>📊 Summary Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Uploaded</div>
          <div class="stat-value">${report.stats.totalUploaded}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Amount</div>
          <div class="stat-value">${formatCurrency(report.stats.totalAmount)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Verified</div>
          <div class="stat-value success">${report.stats.totalVerified}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Verified Amount</div>
          <div class="stat-value success">${formatCurrency(report.stats.verifiedAmount)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Rejected</div>
          <div class="stat-value danger">${report.stats.totalRejected}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Rejected Amount</div>
          <div class="stat-value danger">${formatCurrency(report.stats.rejectedAmount)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending</div>
          <div class="stat-value warning">${report.stats.totalPending}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Amount</div>
          <div class="stat-value warning">${formatCurrency(report.stats.pendingAmount)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>⏱️ Performance Metrics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Avg. Verification Time</div>
          <div class="stat-value">${report.stats.averageVerificationTime.toFixed(1)} hours</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Rejection Rate</div>
          <div class="stat-value ${report.stats.rejectionRate > 30 ? 'danger' : report.stats.rejectionRate > 15 ? 'warning' : 'success'}">
            ${report.stats.rejectionRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>

    ${report.topRejectionReasons.length > 0 ? `
    <div class="section">
      <h2>❌ Top Rejection Reasons</h2>
      <table>
        <thead>
          <tr>
            <th>Reason</th>
            <th style="text-align: center;">Count</th>
            <th style="text-align: center;">Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${report.topRejectionReasons.map(reason => `
            <tr>
              <td>${reason.reason}</td>
              <td style="text-align: center;">${reason.count}</td>
              <td style="text-align: center;">${reason.percentage.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${report.pendingReceipts.length > 0 ? `
    <div class="section">
      <h2>⏳ Pending Receipts (Oldest First)</h2>
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Student</th>
            <th style="text-align: right;">Amount</th>
            <th style="text-align: center;">Days Waiting</th>
          </tr>
        </thead>
        <tbody>
          ${report.pendingReceipts.map(receipt => `
            <tr>
              <td><code>${receipt.referenceNumber}</code></td>
              <td>${receipt.studentName}</td>
              <td style="text-align: right;">${formatCurrency(receipt.amount)}</td>
              <td style="text-align: center;">
                <span class="badge ${receipt.daysWaiting > 5 ? 'danger' : receipt.daysWaiting > 2 ? 'warning' : 'success'}">
                  ${receipt.daysWaiting} days
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${report.adminActivity.length > 0 ? `
    <div class="section">
      <h2>👥 Admin Activity</h2>
      <table>
        <thead>
          <tr>
            <th>Admin</th>
            <th style="text-align: center;">Verified</th>
            <th style="text-align: center;">Rejected</th>
            <th style="text-align: center;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${report.adminActivity.map(admin => `
            <tr>
              <td>${admin.adminName}</td>
              <td style="text-align: center;"><span class="badge success">${admin.verified}</span></td>
              <td style="text-align: center;"><span class="badge danger">${admin.rejected}</span></td>
              <td style="text-align: center;"><strong>${admin.total}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p>This is an automated report generated by the School Management System.</p>
      <p>For questions or issues, please contact the system administrator.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format report as plain text
 */
export function formatReportAsText(report: ReportData): string {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const formatDate = (date: Date) => date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  let text = `
${report.period} RECEIPT VERIFICATION REPORT
${formatDate(report.startDate)} - ${formatDate(report.endDate)}
${"=".repeat(60)}

SUMMARY STATISTICS
------------------
Total Uploaded:     ${report.stats.totalUploaded}
Total Amount:       ${formatCurrency(report.stats.totalAmount)}

Verified:           ${report.stats.totalVerified}
Verified Amount:    ${formatCurrency(report.stats.verifiedAmount)}

Rejected:           ${report.stats.totalRejected}
Rejected Amount:    ${formatCurrency(report.stats.rejectedAmount)}

Pending:            ${report.stats.totalPending}
Pending Amount:     ${formatCurrency(report.stats.pendingAmount)}

PERFORMANCE METRICS
-------------------
Avg. Verification Time: ${report.stats.averageVerificationTime.toFixed(1)} hours
Rejection Rate:         ${report.stats.rejectionRate.toFixed(1)}%
`;

  if (report.topRejectionReasons.length > 0) {
    text += `
TOP REJECTION REASONS
---------------------
`;
    report.topRejectionReasons.forEach((reason, index) => {
      text += `${index + 1}. ${reason.reason} (${reason.count} - ${reason.percentage.toFixed(1)}%)\n`;
    });
  }

  if (report.pendingReceipts.length > 0) {
    text += `
PENDING RECEIPTS (OLDEST FIRST)
--------------------------------
`;
    report.pendingReceipts.forEach((receipt) => {
      text += `${receipt.referenceNumber} | ${receipt.studentName} | ${formatCurrency(receipt.amount)} | ${receipt.daysWaiting} days\n`;
    });
  }

  if (report.adminActivity.length > 0) {
    text += `
ADMIN ACTIVITY
--------------
`;
    report.adminActivity.forEach((admin) => {
      text += `${admin.adminName}: ${admin.verified} verified, ${admin.rejected} rejected (Total: ${admin.total})\n`;
    });
  }

  text += `
${"=".repeat(60)}
This is an automated report generated by the School Management System.
`;

  return text;
}
