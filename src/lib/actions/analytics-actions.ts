"use server";

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { subDays, startOfMonth, endOfMonth, format } from "date-fns";
import { calcMonthlyBill, PlanType } from "@/lib/config/plan-features";
import {
  getCachedAuthAnalyticsDashboard,
  getCachedAuthenticationMetrics,
  getCachedSecurityMetrics,
  getCachedUserActivityMetrics,
} from "@/lib/utils/cached-auth-analytics";

export async function getDashboardAnalytics(timeRange: string = "30d") {
  await requireSuperAdminAccess();

  const now = new Date();
  let startDate: Date;
  const endDate = now;

  switch (timeRange) {
    case "7d":  startDate = subDays(now, 7);   break;
    case "30d": startDate = subDays(now, 30);  break;
    case "90d": startDate = subDays(now, 90);  break;
    case "1y":  startDate = subDays(now, 365); break;
    case "mtd": startDate = startOfMonth(now); break;
    default:    startDate = subDays(now, 30);
  }

  try {
    const [
      schoolStats,
      userStats,
      subscriptionStats,
      recentSchools,
      recentActivity,
      userGrowthData,
      schoolsByPlan,
      // Active schools with student counts for real MRR via calcMonthlyBill
      activeSchoolsForMRR,
      // Real collected revenue from Payment table
      totalPaymentsAgg,
    ] = await Promise.all([
      db.school.groupBy({ by: ["status"], _count: { id: true } }),
      db.user.groupBy({ by: ["role"], _count: { id: true } }),
      db.enhancedSubscription.groupBy({ by: ["status"], _count: { id: true } }),
      db.school.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      db.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          createdAt: true,
          changes: true,
          ipAddress: true,
          user: { select: { name: true, email: true, role: true } },
          school: { select: { name: true, schoolCode: true } },
        },
      }),
      db.user.findMany({
        where: {
          createdAt: {
            gte: startOfMonth(subDays(now, 11 * 30)),
            lte: now,
          },
        },
        select: { createdAt: true },
      }),
      db.school.groupBy({ by: ["plan"], _count: { id: true } }),
      // Real MRR: active schools + student counts
      db.school.findMany({
        where: { status: "ACTIVE" },
        select: {
          plan: true,
          _count: { select: { students: true } },
        },
      }),
      // Real collected revenue (all-time, paise)
      db.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    // School stats
    const totalSchools = schoolStats.reduce((sum, s) => sum + s._count.id, 0);
    const activeSchools = schoolStats.find((s) => s.status === "ACTIVE")?._count.id ?? 0;
    const suspendedSchools = schoolStats.find((s) => s.status === "SUSPENDED")?._count.id ?? 0;

    // User stats
    const totalUsers = userStats.reduce((sum, s) => sum + s._count.id, 0);
    const totalStudents = userStats.find((u) => u.role === "STUDENT")?._count.id ?? 0;
    const totalTeachers = userStats.find((u) => u.role === "TEACHER")?._count.id ?? 0;
    const totalAdmins = userStats.find((u) => u.role === "ADMIN")?._count.id ?? 0;

    // Subscription stats
    const totalSubscriptions = subscriptionStats.reduce((sum, s) => sum + s._count.id, 0);
    const activeSubscriptions =
      subscriptionStats.find((s) => s.status === "ACTIVE")?._count.id ?? 0;

    // --- Projected MRR via calcMonthlyBill (INR → paise) ---
    const projectedMRRPaise = activeSchoolsForMRR.reduce((sum, school) => {
      const bill = calcMonthlyBill(school.plan as PlanType, school._count.students);
      return sum + bill * 100;
    }, 0);

    // --- Real collected revenue (paise) ---
    const totalCollectedPaise = totalPaymentsAgg._sum.amount ?? 0;

    // User growth (cumulative, in-memory)
    const userGrowthDataProcessed = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(now, i * 30));
      const monthEnd = endOfMonth(monthStart);
      const count = userGrowthData.filter((u) => u.createdAt <= monthEnd).length;
      userGrowthDataProcessed.push({
        month: format(monthStart, "MMM yyyy"),
        users: count,
      });
    }

    // School distribution by plan
    const schoolDistribution = schoolsByPlan.map((item) => ({
      plan: item.plan,
      count: item._count.id,
      percentage:
        totalSchools > 0
          ? ((item._count.id / totalSchools) * 100).toFixed(1)
          : "0",
    }));

    // Auth analytics (non-blocking)
    const authAnalytics = await getCachedAuthAnalyticsDashboard(
      { startDate, endDate },
      {}
    ).catch((err) => {
      console.warn("Failed to get auth analytics:", err);
      return null;
    });

    return {
      success: true,
      data: {
        kpiData: {
          // Collected revenue (real Payment records, paise)
          totalCollected: totalCollectedPaise,
          hasPaymentData: totalCollectedPaise > 0,
          // Projected MRR (calcMonthlyBill, paise)
          projectedMRR: projectedMRRPaise,
          projectedARR: projectedMRRPaise * 12,
          // Legacy keys — mapped to real values so existing UI doesn't break
          totalRevenue: totalCollectedPaise,
          monthlyRecurringRevenue: projectedMRRPaise,
          // School/user counts (real)
          totalSchools,
          activeSchools,
          suspendedSchools,
          totalUsers,
          totalStudents,
          totalTeachers,
          totalAdmins,
          recentSchools,
          activeSubscriptions,
          totalSubscriptions,
          // Churn: not enough data to compute reliably — omit fake value
          churnRate: null,
          averageRevenuePerUser:
            activeSchools > 0
              ? Math.round(projectedMRRPaise / activeSchools)
              : 0,
        },
        userGrowthData: userGrowthDataProcessed,
        schoolDistribution,
        recentActivity: recentActivity.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.resource ?? "UNKNOWN",
          entityId: log.resourceId ?? "",
          userName: log.user?.name ?? "System",
          userEmail: log.user?.email ?? "",
          userRole: log.user?.role ?? null,
          schoolName: log.school?.name ?? null,
          schoolCode: log.school?.schoolCode ?? null,
          createdAt: log.createdAt,
          metadata: log.changes,
          ipAddress: log.ipAddress,
          isAuthEvent: ["LOGIN", "LOGOUT", "CREATE", "UPDATE"].includes(log.action),
        })),
        authenticationAnalytics: authAnalytics
          ? {
              overview: authAnalytics.overview,
              totalAuthEvents: authAnalytics.overview.totalSessions,
              authSuccessRate: authAnalytics.overview.successRate,
              securityAlerts: authAnalytics.overview.securityAlerts,
              insights: authAnalytics.insights.slice(0, 3),
            }
          : null,
        timeRange: { startDate, endDate, label: timeRange },
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return { success: false, error: "Failed to fetch analytics data" };
  }
}

export async function getRevenueAnalytics(timeRange: string = "30d") {
  await requireSuperAdminAccess();

  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "7d":  startDate = subDays(now, 7);   break;
    case "30d": startDate = subDays(now, 30);  break;
    case "90d": startDate = subDays(now, 90);  break;
    case "1y":  startDate = subDays(now, 365); break;
    default:    startDate = subDays(now, 30);
  }

  try {
    // Real collected payments in the period
    const payments = await db.payment.findMany({
      where: {
        status: "COMPLETED",
        processedAt: { gte: startDate, lte: now },
      },
      select: { amount: true, processedAt: true },
      orderBy: { processedAt: "asc" },
    });

    // Group by month in memory
    const revenueData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(now, i * 30));
      const monthEnd = endOfMonth(monthStart);
      const monthPayments = payments.filter(
        (p) => p.processedAt && p.processedAt >= monthStart && p.processedAt <= monthEnd
      );
      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      revenueData.push({
        month: format(monthStart, "MMM yyyy"),
        revenue, // paise — real collected
        payments: monthPayments.length,
      });
    }

    return { success: true, data: revenueData };
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return { success: false, error: "Failed to fetch revenue data" };
  }
}

export async function getAuthenticationAnalytics(
  timeRange: string = "30d",
  schoolId?: string
) {
  await requireSuperAdminAccess();

  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "7d":  startDate = subDays(now, 7);   break;
    case "30d": startDate = subDays(now, 30);  break;
    case "90d": startDate = subDays(now, 90);  break;
    case "1y":  startDate = subDays(now, 365); break;
    default:    startDate = subDays(now, 30);
  }

  try {
    const timeRangeObj = { startDate, endDate: now };
    const filters = schoolId ? { schoolId } : {};

    const [dashboardData, authMetrics, securityMetrics, activityMetrics] =
      await Promise.all([
        getCachedAuthAnalyticsDashboard(timeRangeObj, filters),
        getCachedAuthenticationMetrics(timeRangeObj, filters),
        getCachedSecurityMetrics(timeRangeObj, filters),
        getCachedUserActivityMetrics(timeRangeObj, filters),
      ]);

    return {
      success: true,
      data: {
        dashboard: dashboardData,
        authentication: authMetrics,
        security: securityMetrics,
        activity: activityMetrics,
        timeRange: { startDate, endDate: now, label: timeRange },
      },
    };
  } catch (error) {
    console.error("Error fetching authentication analytics:", error);
    return { success: false, error: "Failed to fetch authentication analytics" };
  }
}
