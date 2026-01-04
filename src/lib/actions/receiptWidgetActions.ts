"use server";

import { db } from "@/lib/db";
import { ReceiptStatus } from "@prisma/client";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * Get receipt verification widget data for admin dashboard
 */
export async function getReceiptWidgetData() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const yesterdayEnd = endOfDay(subDays(now, 1));

    // Get pending receipts count
    const pendingReceipts = await db.paymentReceipt.findMany({
      where: {
        status: ReceiptStatus.PENDING_VERIFICATION,
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const pendingCount = pendingReceipts.length;

    // Calculate oldest pending receipt days
    const oldestPendingDays = pendingReceipts.length > 0
      ? Math.floor((now.getTime() - pendingReceipts[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Get today's verified receipts
    const verifiedToday = await db.paymentReceipt.count({
      where: {
        status: ReceiptStatus.VERIFIED,
        verifiedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Get today's rejected receipts
    const rejectedToday = await db.paymentReceipt.count({
      where: {
        status: ReceiptStatus.REJECTED,
        verifiedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Get yesterday's rejection rate for trend
    const yesterdayTotal = await db.paymentReceipt.count({
      where: {
        verifiedAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
        status: {
          in: [ReceiptStatus.VERIFIED, ReceiptStatus.REJECTED],
        },
      },
    });

    const yesterdayRejected = await db.paymentReceipt.count({
      where: {
        status: ReceiptStatus.REJECTED,
        verifiedAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
    });

    const yesterdayRejectionRate = yesterdayTotal > 0
      ? (yesterdayRejected / yesterdayTotal) * 100
      : 0;

    // Calculate average verification time (last 7 days)
    const sevenDaysAgo = subDays(now, 7);
    const recentVerified = await db.paymentReceipt.findMany({
      where: {
        status: {
          in: [ReceiptStatus.VERIFIED, ReceiptStatus.REJECTED],
        },
        verifiedAt: {
          gte: sevenDaysAgo,
          lte: now,
        },
      },
      select: {
        createdAt: true,
        verifiedAt: true,
      },
    });

    const totalVerificationTime = recentVerified.reduce((sum, receipt) => {
      if (receipt.verifiedAt) {
        const diff = receipt.verifiedAt.getTime() - receipt.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60); // Convert to hours
      }
      return sum;
    }, 0);

    const averageVerificationTime = recentVerified.length > 0
      ? totalVerificationTime / recentVerified.length
      : 0;

    // Calculate current rejection rate (last 7 days)
    const recentTotal = recentVerified.length;


    // Simpler approach: get rejection rate from last 7 days
    const recentRejectedCount = await db.paymentReceipt.count({
      where: {
        status: ReceiptStatus.REJECTED,
        verifiedAt: {
          gte: sevenDaysAgo,
          lte: now,
        },
      },
    });

    const rejectionRate = recentTotal > 0
      ? (recentRejectedCount / recentTotal) * 100
      : 0;

    // Determine trend
    let trend: "up" | "down" | "stable" = "stable";
    if (rejectionRate > yesterdayRejectionRate + 5) {
      trend = "up";
    } else if (rejectionRate < yesterdayRejectionRate - 5) {
      trend = "down";
    }

    return {
      success: true,
      data: {
        pendingCount,
        verifiedToday,
        rejectedToday,
        oldestPendingDays,
        averageVerificationTime,
        rejectionRate,
        trend,
      },
    };
  } catch (error) {
    console.error("Error fetching receipt widget data:", error);
    return {
      success: false,
      error: "Failed to fetch receipt widget data",
      data: {
        pendingCount: 0,
        verifiedToday: 0,
        rejectedToday: 0,
        oldestPendingDays: 0,
        averageVerificationTime: 0,
        rejectionRate: 0,
        trend: "stable" as const,
      },
    };
  }
}

/**
 * Get comprehensive analytics for receipt dashboard
 */
export async function getReceiptAnalytics() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const thirtyDaysAgo = subDays(now, 30);
    const sixMonthsAgo = subDays(now, 180);

    // 1. Key Stats
    // Average Turnaround Time
    const verifiedReceipts = await db.paymentReceipt.findMany({
      where: {
        status: { in: [ReceiptStatus.VERIFIED, ReceiptStatus.REJECTED] },
        verifiedAt: { not: null },
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { createdAt: true, verifiedAt: true, status: true, rejectionReason: true }
    });

    const totalTimeHours = verifiedReceipts.reduce((acc, r) => {
      if (r.verifiedAt) {
        return acc + (r.verifiedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
      }
      return acc;
    }, 0);

    const avgTurnaroundTime = verifiedReceipts.length > 0
      ? (totalTimeHours / verifiedReceipts.length / 24).toFixed(1) // in days
      : "0";

    // Rejection Rate
    const totalProcessed = verifiedReceipts.length;
    const rejectedCount = verifiedReceipts.filter(r => r.status === ReceiptStatus.REJECTED).length;

    const rejectionRate = totalProcessed > 0
      ? ((rejectedCount / totalProcessed) * 100).toFixed(1)
      : "0";

    // Oldest Pending
    const oldestPending = await db.paymentReceipt.findFirst({
      where: { status: ReceiptStatus.PENDING_VERIFICATION },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });

    const pendingOldest = oldestPending
      ? Math.floor((now.getTime() - oldestPending.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;


    // 2. Turnaround Time Distribution
    const turnaroundData = [
      { range: "< 1 day", count: 0 },
      { range: "1-2 days", count: 0 },
      { range: "2-3 days", count: 0 },
      { range: "3-5 days", count: 0 },
      { range: "> 5 days", count: 0 },
    ];

    verifiedReceipts.forEach(r => {
      if (r.verifiedAt) {
        const days = (r.verifiedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (days < 1) turnaroundData[0].count++;
        else if (days < 2) turnaroundData[1].count++;
        else if (days < 3) turnaroundData[2].count++;
        else if (days < 5) turnaroundData[3].count++;
        else turnaroundData[4].count++;
      }
    });

    // 3. Rejection Reasons
    const rejections = await db.paymentReceipt.groupBy({
      by: ['rejectionReason'],
      where: {
        status: ReceiptStatus.REJECTED,
        createdAt: { gte: thirtyDaysAgo },
        rejectionReason: { not: null }
      },
      _count: { id: true }
    });

    // Filter out null rejection reasons locally if group by didn't catch them (Prisma sometimes includes null key)
    const normalizedRejections = rejections.filter(r => r.rejectionReason !== null);

    const rejectionReasons = normalizedRejections.map(r => ({
      reason: r.rejectionReason || "Unspecified",
      count: r._count.id,
      percentage: totalProcessed > 0 ? Math.round((r._count.id / totalProcessed) * 100) : 0
    })).sort((a, b) => b.count - a.count).slice(0, 5);


    // 4. Monthly Trends (Last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = subDays(now, i * 30);
      const monthStart = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
      const monthEnd = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
      const monthLabel = date.toLocaleString('default', { month: 'short' });

      // We need separate queries for historical data unfortunately, or fetch all and aggregate in JS
      // For performance on small-medium datasets, fetches are fine.
      // Optimization: Fetch all stats for last 6 months in one go and aggregate locally?
      // Let's stick to simple queries for now given readability.

      const verified = await db.paymentReceipt.count({
        where: {
          status: ReceiptStatus.VERIFIED,
          updatedAt: { gte: monthStart, lte: monthEnd }
        }
      });
      const rejected = await db.paymentReceipt.count({
        where: {
          status: ReceiptStatus.REJECTED,
          updatedAt: { gte: monthStart, lte: monthEnd }
        }
      });
      const pending = await db.paymentReceipt.count({
        where: {
          status: ReceiptStatus.PENDING_VERIFICATION,
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      });

      monthlyTrends.push({ month: monthLabel, verified, rejected, pending });
    }

    // 5. Aging Data
    const pendingAll = await db.paymentReceipt.findMany({
      where: { status: ReceiptStatus.PENDING_VERIFICATION },
      select: { createdAt: true }
    });

    const agingData = [
      { days: "0-1", count: 0 },
      { days: "1-2", count: 0 },
      { days: "2-3", count: 0 },
      { days: "3-5", count: 0 },
      { days: "> 5", count: 0 },
    ];

    pendingAll.forEach(p => {
      const days = (now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (days < 1) agingData[0].count++;
      else if (days < 2) agingData[1].count++;
      else if (days < 3) agingData[2].count++;
      else if (days < 5) agingData[3].count++;
      else agingData[4].count++;
    });

    return {
      success: true,
      data: {
        stats: {
          avgTurnaroundTime,
          rejectionRate,
          totalProcessed,
          pendingOldest
        },
        turnaroundData,
        rejectionReasons,
        monthlyTrends,
        agingData
      }
    };

  } catch (error) {
    console.error("Error fetching receipt analytics:", error);
    return { success: false, error: "Failed to fetch analytics" };
  }
}
