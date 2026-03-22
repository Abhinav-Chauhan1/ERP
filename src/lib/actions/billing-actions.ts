"use server";

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { subDays, startOfMonth, endOfMonth, format } from "date-fns";
import { calcMonthlyBill, PlanType } from "@/lib/config/plan-features";

export async function getBillingDashboardData(timeRange: string = "30d") {
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
      subscriptionCounts,
      allSubscriptions,
      monthlySubscriptions,
      // Real collected revenue from Payment table
      totalPaymentsAgg,
      periodPaymentsAgg,
      // Active schools with student counts for projected MRR
      activeSchoolsForMRR,
      // Monthly payment breakdown for trend chart
      recentPayments,
    ] = await Promise.all([
      db.enhancedSubscription.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      db.enhancedSubscription.findMany({
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
          createdAt: true,
          school: {
            select: { name: true, plan: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.enhancedSubscription.findMany({
        where: {
          createdAt: {
            gte: startOfMonth(subDays(now, 11 * 30)),
            lte: now,
          },
        },
        select: {
          createdAt: true,
          school: { select: { plan: true } },
        },
      }),
      // All-time collected revenue (paise)
      db.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      // Period collected revenue (paise)
      db.payment.aggregate({
        where: {
          status: "COMPLETED",
          processedAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      // Active schools with student counts for calcMonthlyBill
      db.school.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          plan: true,
          _count: { select: { students: true } },
        },
      }),
      // Recent actual payments for the payments list
      db.payment.findMany({
        where: { status: "COMPLETED" },
        orderBy: { processedAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          processedAt: true,
          paymentMethod: true,
          subscription: {
            select: {
              school: { select: { name: true, plan: true } },
            },
          },
        },
      }),
    ]);

    // Subscription counts
    const totalSubscriptions = subscriptionCounts.reduce((sum, s) => sum + s._count.id, 0);
    const activeSubscriptions = subscriptionCounts
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => sum + s._count.id, 0);
    const expiredSubscriptions = subscriptionCounts
      .filter((s) => s.status !== "ACTIVE")
      .reduce((sum, s) => sum + s._count.id, 0);
    const pendingSubscriptions = subscriptionCounts
      .filter((s) => s.status === "TRIALING")
      .reduce((sum, s) => sum + s._count.id, 0);

    // --- Real collected revenue (from Payment table, in paise) ---
    const totalCollectedPaise = totalPaymentsAgg._sum.amount ?? 0;
    const periodCollectedPaise = periodPaymentsAgg._sum.amount ?? 0;

    // --- Projected MRR via calcMonthlyBill (in INR) ---
    // calcMonthlyBill returns INR; multiply by 100 to keep everything in paise
    const projectedMRRPaise = activeSchoolsForMRR.reduce((sum, school) => {
      const bill = calcMonthlyBill(school.plan as PlanType, school._count.students);
      return sum + bill * 100; // INR → paise
    }, 0);
    const projectedARRPaise = projectedMRRPaise * 12;

    // Revenue by plan (projected, based on active schools)
    const planGroups: Record<string, { revenue: number; subscriptions: number }> = {};
    for (const school of activeSchoolsForMRR) {
      const bill = calcMonthlyBill(school.plan as PlanType, school._count.students) * 100;
      if (!planGroups[school.plan]) planGroups[school.plan] = { revenue: 0, subscriptions: 0 };
      planGroups[school.plan].revenue += bill;
      planGroups[school.plan].subscriptions += 1;
    }
    const revenueByPlan = Object.entries(planGroups).map(([plan, data]) => ({
      plan,
      revenue: data.revenue,
      subscriptions: data.subscriptions,
      percentage:
        projectedMRRPaise > 0
          ? ((data.revenue / projectedMRRPaise) * 100).toFixed(1)
          : "0",
    }));

    // Monthly subscription trend (count only — no fake revenue)
    const monthlyRevenueData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(now, i * 30));
      const monthEnd = endOfMonth(monthStart);
      const monthSubs = monthlySubscriptions.filter(
        (s) => s.createdAt >= monthStart && s.createdAt <= monthEnd
      );
      monthlyRevenueData.push({
        month: format(monthStart, "MMM yyyy"),
        subscriptions: monthSubs.length,
        // No fake revenue — only show if real payment data exists
        revenue: 0,
      });
    }

    // Recent payments list from real Payment records
    const recentPaymentsList = recentPayments.map((p) => ({
      id: p.id,
      schoolName: p.subscription?.school?.name ?? "Unknown",
      amount: p.amount, // paise
      status: p.status,
      date: p.processedAt ?? new Date(),
      plan: p.subscription?.school?.plan ?? "UNKNOWN",
      paymentMethod: p.paymentMethod,
    }));

    // Churn: subscriptions that ended in period
    const churnedCount = allSubscriptions.filter(
      (s) =>
        s.status !== "ACTIVE" &&
        s.currentPeriodEnd &&
        s.currentPeriodEnd >= startDate &&
        s.currentPeriodEnd <= endDate
    ).length;
    const churnRate =
      totalSubscriptions > 0
        ? Number(((churnedCount / totalSubscriptions) * 100).toFixed(2))
        : 0;

    const subscriptionsByStatus = [
      { status: "Active", count: activeSubscriptions, color: "green" },
      { status: "Expired", count: expiredSubscriptions, color: "red" },
      { status: "Pending", count: pendingSubscriptions, color: "yellow" },
    ];

    return {
      success: true,
      data: {
        metrics: {
          // Collected (real payments)
          totalCollected: totalCollectedPaise,       // paise
          periodCollected: periodCollectedPaise,     // paise
          // Projected (calcMonthlyBill)
          projectedMRR: projectedMRRPaise,           // paise
          projectedARR: projectedARRPaise,           // paise
          // Legacy keys kept so existing UI doesn't break — mapped to real values
          totalRevenue: totalCollectedPaise,
          monthlyRecurringRevenue: projectedMRRPaise,
          revenueInPeriod: periodCollectedPaise,
          // Subscription counts
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          pendingSubscriptions,
          churnRate,
          averageRevenuePerSubscription:
            activeSubscriptions > 0
              ? Math.round(projectedMRRPaise / activeSubscriptions)
              : 0,
          hasPaymentData: totalCollectedPaise > 0,
        },
        revenueByPlan,
        monthlyRevenueData,
        recentPayments: recentPaymentsList,
        subscriptionsByStatus,
        timeRange: { startDate, endDate, label: timeRange },
      },
    };
  } catch (error) {
    console.error("Error fetching billing dashboard data:", error);
    return { success: false, error: "Failed to fetch billing data" };
  }
}

export async function getPaymentHistory(limit: number = 50) {
  await requireSuperAdminAccess();

  try {
    const payments = await db.payment.findMany({
      where: { status: "COMPLETED" },
      orderBy: { processedAt: "desc" },
      take: limit,
      select: {
        id: true,
        amount: true,
        status: true,
        processedAt: true,
        paymentMethod: true,
        subscription: {
          select: {
            school: { select: { name: true, plan: true } },
          },
        },
      },
    });

    const paymentHistory = payments.map((p) => ({
      id: p.id,
      schoolName: p.subscription?.school?.name ?? "Unknown",
      amount: p.amount, // paise — real value from Payment table
      status: p.status,
      date: p.processedAt ?? new Date(),
      plan: p.subscription?.school?.plan ?? "UNKNOWN",
      paymentMethod: p.paymentMethod,
      subscriptionId: p.id,
    }));

    return { success: true, data: paymentHistory };
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return { success: false, error: "Failed to fetch payment history" };
  }
}
