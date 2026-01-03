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
    const recentRejected = recentVerified.filter((r) => {
      return db.paymentReceipt.findFirst({
        where: {
          id: r.createdAt.toISOString(), // This is a placeholder, we need to track status
          status: ReceiptStatus.REJECTED,
        },
      });
    });

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
