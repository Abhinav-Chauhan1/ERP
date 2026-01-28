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
    // Get subscription data
    const [
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      pendingSubscriptions,
      subscriptionsInPeriod,
      allSubscriptions
    ] = await Promise.all([
      db.subscription.count(),
      db.subscription.count({ where: { isActive: true } }),
      db.subscription.count({ 
        where: { 
          isActive: false,
          endDate: { lt: now }
        } 
      }),
      db.subscription.count({ 
        where: { 
          paymentStatus: "PENDING" 
        } 
      }),
      db.subscription.findMany({
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
      }),
      db.subscription.findMany({
        include: {
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
      })
    ]);

    // Calculate revenue metrics
    const planPricing = {
      STARTER: 2900, // ₹29 in paise
      GROWTH: 4900,  // ₹49 in paise
      DOMINATE: 9900, // ₹99 in paise
    };

    let totalRevenue = 0;
    let monthlyRecurringRevenue = 0;
    let revenueInPeriod = 0;

    // Calculate total revenue and MRR
    allSubscriptions.forEach((sub) => {
      const planPrice = planPricing[sub.school.plan as keyof typeof planPricing] || 0;
      totalRevenue += planPrice;
      if (sub.isActive) {
        monthlyRecurringRevenue += planPrice;
      }
    });

    // Calculate revenue for the selected period
    subscriptionsInPeriod.forEach((sub) => {
      const planPrice = planPricing[sub.school.plan as keyof typeof planPricing] || 0;
      revenueInPeriod += planPrice;
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

    // Get monthly revenue data for the last 12 months
    const monthlyRevenueData = [];
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

      monthlyRevenueData.push({
        month: format(monthStart, "MMM yyyy"),
        revenue: monthlyRevenue,
        subscriptions: monthlySubscriptions.length,
      });
    }

    // Get recent payments/invoices (mock data since we don't have payment records yet)
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