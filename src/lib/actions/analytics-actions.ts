"use server";

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { subDays, startOfMonth, endOfMonth, format } from "date-fns";
import { authAnalyticsService } from "@/lib/services/auth-analytics-service";

export async function getDashboardAnalytics(timeRange: string = "30d") {
  await requireSuperAdminAccess();

  const now = new Date();
  let startDate: Date;
  let endDate = now;

  // Calculate date range
  switch (timeRange) {
    case "7d":
      startDate = subDays(now, 7);
      break;
    case "30d":
      startDate = subDays(now, 30);
      break;
    case "90d":
      startDate = subDays(now, 90);
      break;
    case "1y":
      startDate = subDays(now, 365);
      break;
    case "mtd":
      startDate = startOfMonth(now);
      break;
    default:
      startDate = subDays(now, 30);
  }

  try {
    // Get basic counts
    const [
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      recentSchools,
      activeSubscriptions,
      totalSubscriptions
    ] = await Promise.all([
      db.school.count(),
      db.school.count({ where: { status: "ACTIVE" } }),
      db.school.count({ where: { status: "SUSPENDED" } }),
      db.user.count(),
      db.user.count({ where: { role: "STUDENT" } }),
      db.user.count({ where: { role: "TEACHER" } }),
      db.user.count({ where: { role: "ADMIN" } }),
      db.school.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      db.subscription.count({ where: { isActive: true } }),
      db.subscription.count(),
    ]);

    // Get subscription data for revenue calculations
    const subscriptions = await db.subscription.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        school: {
          select: {
            name: true,
            plan: true,
          },
        },
      },
    });

    // Calculate revenue metrics (mock calculation - in real app would use actual payment data)
    const planPricing = {
      STARTER: 2900, // ₹29 in paise
      GROWTH: 4900,  // ₹49 in paise
      DOMINATE: 9900, // ₹99 in paise
    };

    let totalRevenue = 0;
    let monthlyRecurringRevenue = 0;

    subscriptions.forEach((sub) => {
      const planPrice = planPricing[sub.school.plan as keyof typeof planPricing] || 0;
      totalRevenue += planPrice;
      if (sub.isActive) {
        monthlyRecurringRevenue += planPrice;
      }
    });

    // Get user growth data for the last 12 months
    const userGrowthData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(now, i * 30));
      const monthEnd = endOfMonth(monthStart);
      
      const monthlyUsers = await db.user.count({
        where: {
          createdAt: {
            lte: monthEnd,
          },
        },
      });

      userGrowthData.push({
        month: format(monthStart, "MMM yyyy"),
        users: monthlyUsers,
      });
    }

    // Get school distribution by plan
    const schoolsByPlan = await db.school.groupBy({
      by: ["plan"],
      _count: {
        id: true,
      },
    });

    const schoolDistribution = schoolsByPlan.map((item) => ({
      plan: item.plan,
      count: item._count.id,
      percentage: ((item._count.id / totalSchools) * 100).toFixed(1),
    }));

    // Calculate churn rate (simplified - schools that became inactive in the period)
    const churnedSchools = await db.school.count({
      where: {
        status: "SUSPENDED",
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const churnRate = totalSchools > 0 ? ((churnedSchools / totalSchools) * 100) : 0;

    // Calculate average revenue per user
    const averageRevenuePerUser = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;

    // Get recent activity (audit logs) - enhanced with authentication events
    const recentActivity = await db.auditLog.findMany({
      take: 15, // Increased to show more activity
      orderBy: { createdAt: "desc" },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        school: {
          select: {
            name: true,
            schoolCode: true,
          },
        },
      },
    });

    // Get authentication analytics summary
    const authAnalytics = await authAnalyticsService.getAuthAnalyticsDashboard(
      { startDate, endDate },
      {}
    ).catch(error => {
      console.warn('Failed to get auth analytics:', error);
      return null;
    });

    return {
      success: true,
      data: {
        kpiData: {
          totalRevenue,
          monthlyRecurringRevenue,
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
          churnRate: Number(churnRate.toFixed(2)),
          averageRevenuePerUser,
          customerLifetimeValue: averageRevenuePerUser * 12, // Simplified calculation
          conversionRate: totalSchools > 0 ? ((activeSubscriptions / totalSchools) * 100) : 0,
        },
        userGrowthData,
        schoolDistribution,
        recentActivity: recentActivity.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.resource || 'UNKNOWN',
          entityId: log.resourceId || "",
          userName: log.user?.name || "System",
          userEmail: log.user?.email || "",
          userRole: log.user?.role || null,
          schoolName: log.school?.name || null,
          schoolCode: log.school?.schoolCode || null,
          createdAt: log.createdAt,
          metadata: log.changes,
          ipAddress: log.ipAddress,
          isAuthEvent: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'AUTH_SUCCESS', 'AUTH_FAILED', 'SESSION_CREATED', 'SESSION_EXPIRED'].includes(log.action),
        })),
        authenticationAnalytics: authAnalytics ? {
          overview: authAnalytics.overview,
          totalAuthEvents: authAnalytics.overview.totalSessions,
          authSuccessRate: authAnalytics.overview.successRate,
          securityAlerts: authAnalytics.overview.securityAlerts,
          insights: authAnalytics.insights.slice(0, 3), // Top 3 insights
        } : null,
        timeRange: {
          startDate,
          endDate,
          label: timeRange,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return {
      success: false,
      error: "Failed to fetch analytics data",
    };
  }
}

export async function getRevenueAnalytics(timeRange: string = "30d") {
  await requireSuperAdminAccess();

  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "7d":
      startDate = subDays(now, 7);
      break;
    case "30d":
      startDate = subDays(now, 30);
      break;
    case "90d":
      startDate = subDays(now, 90);
      break;
    case "1y":
      startDate = subDays(now, 365);
      break;
    default:
      startDate = subDays(now, 30);
  }

  try {
    // Get revenue data by month for the last 12 months
    const revenueData = [];
    const planPricing = {
      STARTER: 2900,
      GROWTH: 4900,
      DOMINATE: 9900,
    };

    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(now, i * 30));
      const monthEnd = endOfMonth(monthStart);

      const monthlySubscriptions = await db.subscription.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          school: {
            select: {
              plan: true,
            },
          },
        },
      });

      let monthlyRevenue = 0;
      monthlySubscriptions.forEach((sub) => {
        const planPrice = planPricing[sub.school.plan as keyof typeof planPricing] || 0;
        monthlyRevenue += planPrice;
      });

      revenueData.push({
        month: format(monthStart, "MMM yyyy"),
        revenue: monthlyRevenue,
        subscriptions: monthlySubscriptions.length,
      });
    }

    return {
      success: true,
      data: revenueData,
    };
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return {
      success: false,
      error: "Failed to fetch revenue data",
    };
  }
}

export async function getAuthenticationAnalytics(timeRange: string = "30d", schoolId?: string) {
  await requireSuperAdminAccess();

  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "7d":
      startDate = subDays(now, 7);
      break;
    case "30d":
      startDate = subDays(now, 30);
      break;
    case "90d":
      startDate = subDays(now, 90);
      break;
    case "1y":
      startDate = subDays(now, 365);
      break;
    default:
      startDate = subDays(now, 30);
  }

  try {
    const timeRangeObj = { startDate, endDate: now };
    const filters = schoolId ? { schoolId } : {};

    // Get comprehensive authentication analytics
    const [
      dashboardData,
      authMetrics,
      securityMetrics,
      activityMetrics
    ] = await Promise.all([
      authAnalyticsService.getAuthAnalyticsDashboard(timeRangeObj, filters),
      authAnalyticsService.getAuthenticationMetrics(timeRangeObj, filters),
      authAnalyticsService.getSecurityMetrics(timeRangeObj, filters),
      authAnalyticsService.getUserActivityMetrics(timeRangeObj, filters)
    ]);

    return {
      success: true,
      data: {
        dashboard: dashboardData,
        authentication: authMetrics,
        security: securityMetrics,
        activity: activityMetrics,
        timeRange: {
          startDate,
          endDate: now,
          label: timeRange
        }
      },
    };
  } catch (error) {
    console.error("Error fetching authentication analytics:", error);
    return {
      success: false,
      error: "Failed to fetch authentication analytics",
    };
  }
}