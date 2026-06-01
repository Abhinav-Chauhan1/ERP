"use server";

import { db } from "@/lib/db";
import { ReceiptStatus } from "@prisma/client";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * Get receipt verification widget data for admin dashboard
 */
export async function getReceiptWidgetData() {
  try {
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const yesterdayEnd = endOfDay(subDays(now, 1));
    const sevenDaysAgo = subDays(now, 7);

    // Run all 4 independent queries in parallel instead of 8 sequential ones
    const [
      pendingReceipts,
      todayByStatus,
      yesterdayByStatus,
      recentVerified,
    ] = await Promise.all([
      // 1. Pending receipts (for count + oldest-pending age)
      db.paymentReceipt.findMany({
        where: { schoolId, status: ReceiptStatus.PENDING_VERIFICATION },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // 2. Today's verified/rejected — one groupBy replaces two count queries
      db.paymentReceipt.groupBy({
        by: ["status"],
        where: {
          schoolId,
          status: { in: [ReceiptStatus.VERIFIED, ReceiptStatus.REJECTED] },
          verifiedAt: { gte: todayStart, lte: todayEnd },
        },
        _count: { id: true },
      }),
      // 3. Yesterday's verified/rejected — one groupBy replaces two count queries
      db.paymentReceipt.groupBy({
        by: ["status"],
        where: {
          schoolId,
          status: { in: [ReceiptStatus.VERIFIED, ReceiptStatus.REJECTED] },
          verifiedAt: { gte: yesterdayStart, lte: yesterdayEnd },
        },
        _count: { id: true },
      }),
      // 4. Last-7-days receipts for avg verification time + rejection rate
      db.paymentReceipt.findMany({
        where: {
          schoolId,
          status: { in: [ReceiptStatus.VERIFIED, ReceiptStatus.REJECTED] },
          verifiedAt: { gte: sevenDaysAgo, lte: now },
        },
        select: { createdAt: true, verifiedAt: true, status: true },
      }),
    ]);

    // Derive all values in memory — no extra queries needed
    const pendingCount = pendingReceipts.length;
    const oldestPendingDays = pendingReceipts.length > 0
      ? Math.floor((now.getTime() - pendingReceipts[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const verifiedToday = todayByStatus.find(r => r.status === ReceiptStatus.VERIFIED)?._count.id ?? 0;
    const rejectedToday = todayByStatus.find(r => r.status === ReceiptStatus.REJECTED)?._count.id ?? 0;

    const yesterdayTotal = yesterdayByStatus.reduce((s, r) => s + r._count.id, 0);
    const yesterdayRejected = yesterdayByStatus.find(r => r.status === ReceiptStatus.REJECTED)?._count.id ?? 0;
    const yesterdayRejectionRate = yesterdayTotal > 0 ? (yesterdayRejected / yesterdayTotal) * 100 : 0;

    const recentTotal = recentVerified.length;
    const recentRejectedCount = recentVerified.filter(r => r.status === ReceiptStatus.REJECTED).length;
    const totalVerificationTime = recentVerified.reduce((sum, r) => {
      if (r.verifiedAt) return sum + (r.verifiedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
      return sum;
    }, 0);
    const averageVerificationTime = recentTotal > 0 ? totalVerificationTime / recentTotal : 0;
    const rejectionRate = recentTotal > 0 ? (recentRejectedCount / recentTotal) * 100 : 0;

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
    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const now = new Date();
    const todayStart = startOfDay(now);
    const thirtyDaysAgo = subDays(now, 30);
    const sixMonthsAgo = subDays(now, 180);

    // 1. Key Stats
    // Average Turnaround Time
    const verifiedReceipts = await db.paymentReceipt.findMany({
      where: {
        schoolId, // CRITICAL: Filter by current school
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
      where: { 
        schoolId, // CRITICAL: Filter by current school
        status: ReceiptStatus.PENDING_VERIFICATION 
      },
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
        schoolId, // CRITICAL: Filter by current school
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
          schoolId, // CRITICAL: Filter by current school
          status: ReceiptStatus.VERIFIED,
          updatedAt: { gte: monthStart, lte: monthEnd }
        }
      });
      const rejected = await db.paymentReceipt.count({
        where: {
          schoolId, // CRITICAL: Filter by current school
          status: ReceiptStatus.REJECTED,
          updatedAt: { gte: monthStart, lte: monthEnd }
        }
      });
      const pending = await db.paymentReceipt.count({
        where: {
          schoolId, // CRITICAL: Filter by current school
          status: ReceiptStatus.PENDING_VERIFICATION,
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      });

      monthlyTrends.push({ month: monthLabel, verified, rejected, pending });
    }

    // 5. Aging Data
    const pendingAll = await db.paymentReceipt.findMany({
      where: { 
        schoolId, // CRITICAL: Filter by current school
        status: ReceiptStatus.PENDING_VERIFICATION 
      },
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
