"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Pause, 
  Play, 
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  MoreHorizontal
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlanComparisonDialog } from "./plan-comparison-dialog";

interface SubscriptionManagementProps {
  schoolId?: string;
  showAllSchools?: boolean;
}

interface Subscription {
  id: string;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE' | 'PAUSED';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
  school: {
    id: string;
    name: string;
    schoolCode: string;
  };
  plan: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: string;
    features: Record<string, any>;
  };
  lifecycle: {
    isInTrial: boolean;
    trialDaysRemaining: number;
    daysUntilExpiry: number;
    isExpired: boolean;
    canUpgrade: boolean;
    canDowngrade: boolean;
    canCancel: boolean;
    nextAction: string;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  features: Record<string, any>;
  isActive: boolean;
}

function computeLifecycle(sub: { status: string; currentPeriodEnd: Date; trialEnd: Date | null; cancelAtPeriodEnd: boolean }) {
  const now = new Date();
  const daysUntilExpiry = Math.floor((sub.currentPeriodEnd.getTime() - now.getTime()) / 86400000);
  const isInTrial = !!sub.trialEnd && sub.trialEnd > now;
  const trialDaysRemaining = isInTrial ? Math.floor((sub.trialEnd!.getTime() - now.getTime()) / 86400000) : 0;
  const isExpired = daysUntilExpiry < 0;
  return {
    isInTrial,
    trialDaysRemaining,
    daysUntilExpiry,
    isExpired,
    canUpgrade: sub.status === 'ACTIVE',
    canDowngrade: sub.status === 'ACTIVE',
    canCancel: sub.status === 'ACTIVE' && !sub.cancelAtPeriodEnd,
    nextAction: isExpired ? 'renewal_required' : sub.cancelAtPeriodEnd ? 'cancels_at_period_end' : 'active',
  };
}

export function SubscriptionManagement({ schoolId, showAllSchools = true }: SubscriptionManagementProps) {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (schoolId) params.set("schoolId", schoolId);
        const [subRes, planRes] = await Promise.all([
          fetch(`/api/super-admin/billing/subscriptions?${params}`),
          fetch("/api/super-admin/plans"),
        ]);
        if (subRes.ok) {
          const json = await subRes.json();
          const raw: any[] = json.data ?? [];
          setSubscriptions(raw.map(s => ({
            id: s.id,
            status: s.status,
            currentPeriodStart: new Date(s.currentPeriodStart),
            currentPeriodEnd: new Date(s.currentPeriodEnd),
            cancelAtPeriodEnd: s.cancelAtPeriodEnd,
            trialEnd: s.trialEnd ? new Date(s.trialEnd) : null,
            school: { id: s.school?.id ?? "", name: s.school?.name ?? "Unknown", schoolCode: s.school?.schoolCode ?? "" },
            plan: { id: s.plan?.id ?? "", name: s.plan?.name ?? "Unknown", amount: s.plan?.amount ?? 0, currency: s.plan?.currency ?? "INR", interval: s.plan?.interval ?? "month", features: s.plan?.features ?? {} },
            lifecycle: computeLifecycle({ status: s.status, currentPeriodEnd: new Date(s.currentPeriodEnd), trialEnd: s.trialEnd ? new Date(s.trialEnd) : null, cancelAtPeriodEnd: s.cancelAtPeriodEnd }),
          })));
        }
        if (planRes.ok) {
          const plans: any[] = await planRes.json();
          setAvailablePlans(plans.filter(p => p.isActive).map(p => ({
            id: p.id, name: p.name, description: p.description ?? "", amount: p.amount, currency: p.currency ?? "INR", interval: p.interval ?? "month", features: p.features ?? {}, isActive: p.isActive,
          })));
        }
      } catch (e) {
        console.error("Failed to load subscription data", e);
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [schoolId]);

  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const pastDueCount = subscriptions.filter(s => s.status === 'PAST_DUE').length;
  const trialCount = subscriptions.filter(s => s.lifecycle.isInTrial).length;
  const monthlyRevenue = subscriptions.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + s.plan.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PAST_DUE':
        return 'destructive';
      case 'CANCELED':
        return 'secondary';
      case 'INCOMPLETE':
        return 'outline';
      case 'PAUSED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PAST_DUE':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'CANCELED':
        return <X className="h-4 w-4 text-gray-600" />;
      case 'INCOMPLETE':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'PAUSED':
        return <Pause className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const mutateSubscription = async (subscriptionId: string, body: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      await fetch(`/api/super-admin/billing/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // Refresh list
      const res = await fetch(`/api/super-admin/billing/subscriptions?limit=100${schoolId ? `&schoolId=${schoolId}` : ""}`);
      if (res.ok) {
        const json = await res.json();
        const raw: any[] = json.data ?? [];
        setSubscriptions(raw.map(s => ({
          id: s.id, status: s.status,
          currentPeriodStart: new Date(s.currentPeriodStart), currentPeriodEnd: new Date(s.currentPeriodEnd),
          cancelAtPeriodEnd: s.cancelAtPeriodEnd, trialEnd: s.trialEnd ? new Date(s.trialEnd) : null,
          school: { id: s.school?.id ?? "", name: s.school?.name ?? "Unknown", schoolCode: s.school?.schoolCode ?? "" },
          plan: { id: s.plan?.id ?? "", name: s.plan?.name ?? "Unknown", amount: s.plan?.amount ?? 0, currency: s.plan?.currency ?? "INR", interval: s.plan?.interval ?? "month", features: s.plan?.features ?? {} },
          lifecycle: computeLifecycle({ status: s.status, currentPeriodEnd: new Date(s.currentPeriodEnd), trialEnd: s.trialEnd ? new Date(s.trialEnd) : null, cancelAtPeriodEnd: s.cancelAtPeriodEnd }),
        })));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeSubscription = (subscriptionId: string, newPlanId: string) =>
    mutateSubscription(subscriptionId, { action: "upgrade", planId: newPlanId });

  const handleDowngradeSubscription = (subscriptionId: string, newPlanId: string) =>
    mutateSubscription(subscriptionId, { action: "downgrade", planId: newPlanId });

  const handleCancelSubscription = (subscriptionId: string, immediate = false) =>
    mutateSubscription(subscriptionId, { action: "cancel", immediate });

  const handlePauseSubscription = (subscriptionId: string) =>
    mutateSubscription(subscriptionId, { action: "pause" });

  if (isFetching) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground">Loading subscriptions…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-muted-foreground">
            {showAllSchools ? "Manage subscriptions across all schools" : "School subscription overview"}
          </p>
        </div>
        <Button onClick={() => setShowPlanComparison(true)}>
          <CreditCard className="h-4 w-4 mr-2" />
          Compare Plans
        </Button>
      </div>

      {/* Subscription Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">{subscriptions.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Due</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pastDueCount}</div>
            <p className="text-xs text-muted-foreground">{pastDueCount > 0 ? "Requires attention" : "All good"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Subscriptions</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialCount}</div>
            <p className="text-xs text-muted-foreground">Currently in trial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">From active subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>Manage subscription plans and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Period</TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.school.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.school.schoolCode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline">{subscription.plan.name}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {subscription.plan.features.students} students
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(subscription.status)}
                      <Badge variant={getStatusColor(subscription.status) as any}>
                        {subscription.status}
                      </Badge>
                    </div>
                    {subscription.lifecycle.isInTrial && (
                      <div className="text-xs text-blue-600 mt-1">
                        Trial: {subscription.lifecycle.trialDaysRemaining} days left
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {subscription.lifecycle.daysUntilExpiry > 0 
                          ? `${subscription.lifecycle.daysUntilExpiry} days left`
                          : `Expired ${Math.abs(subscription.lifecycle.daysUntilExpiry)} days ago`
                        }
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {subscription.lifecycle.nextAction.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(subscription.plan.amount)}
                    <div className="text-xs text-muted-foreground">
                      per {subscription.plan.interval}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {subscription.lifecycle.canUpgrade && (
                          <DropdownMenuItem>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Upgrade Plan
                          </DropdownMenuItem>
                        )}
                        {subscription.lifecycle.canDowngrade && (
                          <DropdownMenuItem>
                            <TrendingDown className="h-4 w-4 mr-2" />
                            Downgrade Plan
                          </DropdownMenuItem>
                        )}
                        {subscription.status === 'ACTIVE' && (
                          <DropdownMenuItem>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Subscription
                          </DropdownMenuItem>
                        )}
                        {subscription.status === 'PAUSED' && (
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Resume Subscription
                          </DropdownMenuItem>
                        )}
                        {subscription.lifecycle.canCancel && (
                          <DropdownMenuItem className="text-red-600">
                            <X className="h-4 w-4 mr-2" />
                            Cancel Subscription
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Plan Comparison Dialog */}
      <PlanComparisonDialog
        open={showPlanComparison}
        onOpenChange={setShowPlanComparison}
        plans={availablePlans}
      />
    </div>
  );
}