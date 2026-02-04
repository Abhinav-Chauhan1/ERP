"use server";

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { subDays, startOfMonth, endOfMonth, format } from "date-fns";

export async function getBillingDashboardData(timeRange: string = "30d") {
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
    // OPTIMIZED: Single comprehensive query to get all subscription data
    const [
      subscriptionCounts,
      allSubscriptions,
      monthlySubscriptions
    ] = await Promise.all([
      // Get all subscription counts in a single query
      db.subscription.groupBy({
        by: ['isActive', 'paymentStatus'],
        _count: { id: true },
      }),
      // Get all subscriptions with school data for calculations
      db.subscription.findMany({
        select: {
          id: true,
          isActive: true,
          paymentStatus: true,
          createdAt: true,
          endDate: true,
          school: {
            select: {
              name: true,
              plan: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100, // Limit for performance
      }),
      // Get subscriptions for the last 12 months for trend analysis
      db.subscription.findMany({
        where: {
          createdAt: {
            gte: startOfMonth(subDays(now, 11 * 30)),
            lte: now,
          },
        },
        select: {
          createdAt: true,
          school: {
            select: {
              plan: true,
            },
          },
        },
      })
    ]);

    // Process subscription counts
    const totalSubscriptions = subscriptionCounts.reduce((sum, stat) => sum + stat._count.id, 0);
    const activeSubscriptions = subscriptionCounts
      .filter(s => s.isActive === true)
      .reduce((sum, stat) => sum + stat._count.id, 0);
    const expiredSubscriptions = subscriptionCounts
      .filter(s => s.isActive === false)
      .reduce((sum, stat) => sum + stat._count.id, 0);
    const pendingSubscriptions = subscriptionCounts
      .filter(s => s.paymentStatus === "PENDING")
      .reduce((sum, stat) => sum + stat._count.id, 0);

    // Calculate revenue metrics
    const planPricing = {
      STARTER: 2900, // ₹29 in paise
      GROWTH: 4900,  // ₹49 in paise
      DOMINATE: 9900, // ₹99 in paise
    };

    let totalRevenue = 0;
    let monthlyRecurringRevenue = 0;
    let revenueInPeriod = 0;

    // Calculate total revenue and MRR from all subscriptions
    allSubscriptions.forEach((sub) => {
      const planPrice = planPricing[sub.school.plan as keyof typeof planPricing] || 0;
      totalRevenue += planPrice;
      if (sub.isActive) {
        monthlyRecurringRevenue += planPrice;
      }
      // Calculate revenue for the selected period
      if (sub.createdAt >= startDate && sub.createdAt <= endDate) {
        revenueInPeriod += planPrice;
      }
    });

    // Get revenue by plan
    const revenueByPlan = Object.entries(planPricing).map(([plan, price]) => {
      const planSubscriptions = allSubscriptions.filter(sub => 
        sub.school.plan === plan && sub.isActive
      );
      return {
        plan,
        revenue: planSubscriptions.length * price,
        subscriptions: planSubscriptions.length,
        percentage: totalRevenue > 0 ? ((planSubscriptions.length * price / totalRevenue) * 100).toFixed(1) : "0",
      };
    });

    // Calculate monthly revenue data in memory (much faster than 12 DB queries)
    const monthlyRevenueData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(now, i * 30));
      const monthEnd = endOfMonth(monthStart);

      // Filter in memory instead of querying database
      const monthlySubscriptionsFiltered = monthlySubscriptions.filter(sub => 
        sub.createdAt >= monthStart && sub.createdAt <= monthEnd
      );

      let monthlyRevenue = 0;
      monthlySubscriptionsFiltered.forEach((sub) => {
        const planPrice = planPricing[sub.school.plan as keyof typeof planPricing] || 0;
        monthlyRevenue += planPrice;
      });

      monthlyRevenueData.push({
        month: format(monthStart, "MMM yyyy"),
        revenue: monthlyRevenue,
        subscriptions: monthlySubscriptionsFiltered.length,
      });
    }

    // Get recent payments/invoices (using subscription data)
    const recentPayments = allSubscriptions
      .filter(sub => sub.isActive)
      .slice(0, 10)
      .map(sub => ({
        id: sub.id,
        schoolName: sub.school.name,
        amount: planPricing[sub.school.plan as keyof typeof planPricing] || 0,
        status: sub.paymentStatus,
        date: sub.createdAt,
        plan: sub.school.plan,
      }));

    // Calculate churn metrics
    const churnedSubscriptions = allSubscriptions.filter(sub => 
      !sub.isActive && 
      sub.endDate && 
      sub.endDate >= startDate && 
      sub.endDate <= endDate
    );

    const churnRate = totalSubscriptions > 0 ? 
      ((churnedSubscriptions.length / totalSubscriptions) * 100) : 0;

    // Get subscription status distribution
    const subscriptionsByStatus = [
      { status: "Active", count: activeSubscriptions, color: "green" },
      { status: "Expired", count: expiredSubscriptions, color: "red" },
      { status: "Pending", count: pendingSubscriptions, color: "yellow" },
    ];

    return {
      success: true,
      data: {
        metrics: {
          totalRevenue,
          monthlyRecurringRevenue,
          revenueInPeriod,
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          pendingSubscriptions,
          churnRate: Number(churnRate.toFixed(2)),
          averageRevenuePerSubscription: totalSubscriptions > 0 ? 
            Math.round(totalRevenue / totalSubscriptions) : 0,
        },
        revenueByPlan,
        monthlyRevenueData,
        recentPayments,
        subscriptionsByStatus,
        timeRange: {
          startDate,
          endDate,
          label: timeRange,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching billing dashboard data:", error);
    return {
      success: false,
      error: "Failed to fetch billing data",
    };
  }
}

export async function getPaymentHistory(limit: number = 50) {
  await requireSuperAdminAccess();

  try {
    // Since we don't have actual payment records yet, we'll use subscription data
    const subscriptions = await db.subscription.findMany({
      include: {
        school: {
          select: {
            name: true,
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const planPricing = {
      STARTER: 2900,
      GROWTH: 4900,
      DOMINATE: 9900,
    };

    const paymentHistory = subscriptions.map(sub => ({
      id: sub.id,
      schoolName: sub.school.name,
      amount: planPricing[sub.school.plan as keyof typeof planPricing] || 0,
      status: sub.paymentStatus,
      date: sub.createdAt,
      plan: sub.school.plan,
      subscriptionId: sub.id,
    }));

    return {
      success: true,
      data: paymentHistory,
    };
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return {
      success: false,
      error: "Failed to fetch payment history",
    };
  }
}