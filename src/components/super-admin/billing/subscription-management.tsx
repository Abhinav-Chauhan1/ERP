"use client";

import { useState } from "react";
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

export function SubscriptionManagement({ schoolId, showAllSchools = true }: SubscriptionManagementProps) {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real implementation, this would come from API
  const subscriptions: Subscription[] = [
    {
      id: "sub_1",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      trialEnd: null,
      school: {
        id: "school_1",
        name: "Delhi Public School",
        schoolCode: "DPS001"
      },
      plan: {
        id: "plan_growth",
        name: "Growth Plan",
        amount: 2500,
        currency: "INR",
        interval: "month",
        features: {
          students: 500,
          teachers: 50,
          storage: "10GB",
          whatsapp: 1000,
          sms: 500
        }
      },
      lifecycle: {
        isInTrial: false,
        trialDaysRemaining: 0,
        daysUntilExpiry: 30,
        isExpired: false,
        canUpgrade: true,
        canDowngrade: true,
        canCancel: true,
        nextAction: "active"
      }
    },
    {
      id: "sub_2",
      status: "PAST_DUE",
      currentPeriodStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      trialEnd: null,
      school: {
        id: "school_2",
        name: "St. Mary's School",
        schoolCode: "SMS002"
      },
      plan: {
        id: "plan_starter",
        name: "Starter Plan",
        amount: 1500,
        currency: "INR",
        interval: "month",
        features: {
          students: 200,
          teachers: 20,
          storage: "5GB",
          whatsapp: 500,
          sms: 250
        }
      },
      lifecycle: {
        isInTrial: false,
        trialDaysRemaining: 0,
        daysUntilExpiry: -5,
        isExpired: true,
        canUpgrade: false,
        canDowngrade: false,
        canCancel: false,
        nextAction: "payment_failed_retry_needed"
      }
    }
  ];

  const availablePlans: SubscriptionPlan[] = [
    {
      id: "plan_starter",
      name: "Starter Plan",
      description: "Perfect for small schools",
      amount: 1500,
      currency: "INR",
      interval: "month",
      features: {
        students: 200,
        teachers: 20,
        storage: "5GB",
        whatsapp: 500,
        sms: 250
      },
      isActive: true
    },
    {
      id: "plan_growth",
      name: "Growth Plan",
      description: "Ideal for growing schools",
      amount: 2500,
      currency: "INR",
      interval: "month",
      features: {
        students: 500,
        teachers: 50,
        storage: "10GB",
        whatsapp: 1000,
        sms: 500
      },
      isActive: true
    },
    {
      id: "plan_enterprise",
      name: "Enterprise Plan",
      description: "For large educational institutions",
      amount: 5000,
      currency: "INR",
      interval: "month",
      features: {
        students: "Unlimited",
        teachers: "Unlimited",
        storage: "50GB",
        whatsapp: 5000,
        sms: 2500
      },
      isActive: true
    }
  ];

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

  const handleUpgradeSubscription = async (subscriptionId: string, newPlanId: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In real implementation, this would call the subscription service
  };

  const handleDowngradeSubscription = async (subscriptionId: string, newPlanId: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In real implementation, this would call the subscription service
  };

  const handleCancelSubscription = async (subscriptionId: string, immediate: boolean = false) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In real implementation, this would call the subscription service
  };

  const handlePauseSubscription = async (subscriptionId: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In real implementation, this would call the subscription service
  };

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
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Due</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">8</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Subscriptions</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">15 expiring soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹3,45,000</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
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