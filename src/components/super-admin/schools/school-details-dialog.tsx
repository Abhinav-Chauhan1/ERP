"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Building, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard,
  Activity,
  Settings,
  BarChart3,
  MessageSquare,
  Smartphone,
  HardDrive,
  School
} from "lucide-react";
import { OnboardingManagement } from "./onboarding-management";
import { EnhancedOnboardingManagement } from "./enhanced-onboarding-management";

interface School {
  id: string;
  name: string;
  schoolCode: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  plan: 'STARTER' | 'GROWTH' | 'DOMINATE';
  isOnboarded: boolean;
  onboardingStep?: number;
  onboardingCompletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    administrators: number;
    teachers: number;
    students: number;
    subscriptions: number;
  };
  subscriptions: Array<{
    endDate: Date;
    paymentStatus: string;
  }>;
  primaryAdmin?: {
    id: string;
    name: string;
    email: string;
  } | null;
  usage?: {
    whatsappUsed: number;
    whatsappLimit: number;
    smsUsed: number;
    smsLimit: number;
    storageUsed: number;
    storageLimit: number;
  };
}

interface SchoolDetailsDialogProps {
  school: School | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchoolUpdate?: () => void;
}

export function SchoolDetailsDialog({ school, open, onOpenChange, onSchoolUpdate }: SchoolDetailsDialogProps) {
  const router = useRouter();
  
  if (!school) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'SUSPENDED':
        return 'destructive';
      case 'INACTIVE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'STARTER':
        return 'outline';
      case 'GROWTH':
        return 'default';
      case 'DOMINATE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {school.name}
          </DialogTitle>
          <DialogDescription>
            School Code: {school.schoolCode} • Created {school.createdAt.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{school.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Code:</span>
                    <span className="font-mono">{school.schoolCode}</span>
                  </div>
                  {school.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{school.email}</span>
                    </div>
                  )}
                  {school.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{school.phone}</span>
                    </div>
                  )}
                  {school.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{school.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status and Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status & Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={getStatusColor(school.status) as any}>
                      {school.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Plan:</span>
                    <Badge variant={getPlanColor(school.plan) as any}>
                      {school.plan}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Onboarded:</span>
                    <Badge variant={school.isOnboarded ? "default" : "destructive"}>
                      {school.isOnboarded ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Created:</span>
                    <span className="text-sm">{school.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Updated:</span>
                    <span className="text-sm">{school.updatedAt.toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{school._count.students}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{school._count.teachers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{school._count.administrators}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-4">
            <EnhancedOnboardingManagement 
              school={{
                id: school.id,
                name: school.name,
                isOnboarded: school.isOnboarded,
                onboardingStep: school.onboardingStep,
                onboardingCompletedAt: school.onboardingCompletedAt,
                createdAt: school.createdAt,
                primaryAdmin: school.primaryAdmin,
              }}
              onUpdate={() => {
                onSchoolUpdate?.();
              }}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{school._count.students}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Active student accounts
                  </p>
                  <Button variant="outline" size="sm" onClick={() => {
                    onOpenChange(false);
                    router.push(`/super-admin/schools/${school.id}/settings`);
                  }}>
                    Manage Students
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Teachers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{school._count.teachers}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Teaching staff members
                  </p>
                  <Button variant="outline" size="sm" onClick={() => {
                    onOpenChange(false);
                    router.push(`/super-admin/schools/${school.id}/settings`);
                  }}>
                    Manage Teachers
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Administrators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{school._count.administrators}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Administrative users
                  </p>
                  <Button variant="outline" size="sm" onClick={() => {
                    onOpenChange(false);
                    router.push(`/super-admin/schools/${school.id}/settings`);
                  }}>
                    Manage Admins
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Management Actions</CardTitle>
                <CardDescription>Quick actions for user management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Add Users
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    User Permissions
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    User Analytics
                  </Button>
                  <Button variant="outline" size="sm">
                    <Activity className="h-4 w-4 mr-2" />
                    Activity Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            {school.usage ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">WhatsApp Messages</CardTitle>
                      <MessageSquare className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Used: {school.usage.whatsappUsed}</span>
                          <span>Limit: {school.usage.whatsappLimit}</span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(school.usage.whatsappUsed, school.usage.whatsappLimit)} 
                        />
                        <p className={`text-xs ${getUsageColor(getUsagePercentage(school.usage.whatsappUsed, school.usage.whatsappLimit))}`}>
                          {getUsagePercentage(school.usage.whatsappUsed, school.usage.whatsappLimit)}% used
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">SMS Messages</CardTitle>
                      <Smartphone className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Used: {school.usage.smsUsed}</span>
                          <span>Limit: {school.usage.smsLimit}</span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(school.usage.smsUsed, school.usage.smsLimit)} 
                        />
                        <p className={`text-xs ${getUsageColor(getUsagePercentage(school.usage.smsUsed, school.usage.smsLimit))}`}>
                          {getUsagePercentage(school.usage.smsUsed, school.usage.smsLimit)}% used
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Storage Space</CardTitle>
                      <HardDrive className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Used: {school.usage.storageUsed}GB</span>
                          <span>Limit: {school.usage.storageLimit}GB</span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(school.usage.storageUsed, school.usage.storageLimit)} 
                        />
                        <p className={`text-xs ${getUsageColor(getUsagePercentage(school.usage.storageUsed, school.usage.storageLimit))}`}>
                          {getUsagePercentage(school.usage.storageUsed, school.usage.storageLimit)}% used
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Usage Management</CardTitle>
                    <CardDescription>Manage usage limits and monitoring</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        onOpenChange(false);
                        router.push(`/super-admin/schools/${school.id}/settings?tab=limits`);
                      }}>
                        <Settings className="h-4 w-4 mr-2" />
                        Adjust Limits
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Usage History
                      </Button>
                      <Button variant="outline" size="sm">
                        <Activity className="h-4 w-4 mr-2" />
                        Set Alerts
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No usage data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            {school.subscriptions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Plan:</span>
                      <div className="mt-1">
                        <Badge variant={getPlanColor(school.plan) as any}>
                          {school.plan}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Payment Status:</span>
                      <div className="mt-1">
                        <Badge variant={school.subscriptions[0].paymentStatus === "PAID" ? "default" : "destructive"}>
                          {school.subscriptions[0].paymentStatus}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">End Date:</span>
                      <p className="text-sm mt-1">{school.subscriptions[0].endDate.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Days Remaining:</span>
                      <p className="text-sm mt-1">
                        {Math.ceil((school.subscriptions[0].endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => {
                      onOpenChange(false);
                      router.push(`/super-admin/billing?school=${school.id}`);
                    }}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      onOpenChange(false);
                      router.push(`/super-admin/billing?school=${school.id}`);
                    }}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Billing History
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Payment Methods
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No active subscription</p>
                  <Button className="mt-4">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Create Subscription
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => {
            onOpenChange(false);
            router.push(`/super-admin/schools/${school.id}`);
          }}>
            <Settings className="h-4 w-4 mr-2" />
            Manage School
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}