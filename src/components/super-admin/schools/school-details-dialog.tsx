"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Activity,
  Settings,
  BarChart3,
  MessageSquare,
  Smartphone,
  HardDrive,
  School,
  Shield,
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { EnhancedOnboardingManagement } from "./enhanced-onboarding-management";
import { 
  getSchoolAnalytics,
  getSchoolUsageMetrics,
  getSchoolActivityLog,
  getSchoolSecurityStatus
} from "@/lib/actions/school-management-actions";

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
  domain?: string | null;
  subdomain?: string | null;
  tagline?: string | null;
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  _count: {
    administrators: number;
    teachers: number;
    students: number;
    subscriptions: number;
  };
  subscriptions: Array<{
    id: string;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    paymentStatus: string;
  }>;
  primaryAdmin?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface SchoolAnalytics {
  school: {
    id: string;
    name: string;
    createdAt: Date;
    _count: {
      administrators: number;
      teachers: number;
      students: number;
      announcements: number;
      events: number;
      courses: number;
      classes: number;
    };
  };
  metrics: {
    totalUsers: number;
    administrators: number;
    teachers: number;
    students: number;
    announcements: number;
    events: number;
    courses: number;
    classes: number;
  };
  usageMetrics: Array<{
    id: string;
    month: string;
    whatsappUsed: number;
    smsUsed: number;
    storageUsedMB: number;
    whatsappLimit: number;
    smsLimit: number;
    storageLimitMB: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    createdAt: Date;
    changes: any;
  }>;
  subscriptions: Array<{
    id: string;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    paymentStatus: string;
    createdAt: Date;
  }>;
}

interface SchoolUsageMetrics {
  school: {
    id: string;
    name: string;
  };
  currentUsage: {
    whatsappUsed: number;
    smsUsed: number;
    storageUsedMB: number;
  };
  limits: {
    whatsappLimit: number;
    smsLimit: number;
    storageLimitMB: number;
  };
  usageHistory: Array<{
    id: string;
    month: string;
    whatsappUsed: number;
    smsUsed: number;
    storageUsedMB: number;
    whatsappLimit: number;
    smsLimit: number;
    storageLimitMB: number;
  }>;
}

interface SchoolActivityLog {
  school: {
    id: string;
    name: string;
  };
  activities: Array<{
    id: string;
    userId: string | null;
    action: string;
    resource: string;
    resourceId: string;
    changes: any;
    createdAt: Date;
    user: {
      name: string | null;
      email: string | null;
    } | null;
  }>;
}

interface SchoolSecurityStatus {
  school: {
    id: string;
    name: string;
  };
  securityScore: number;
  maxScore: number;
  settings: {
    twoFactorRequired?: boolean;
    sessionTimeoutMinutes?: number;
    passwordPolicy?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    };
    ipWhitelist?: string[];
    allowedDomains?: string[];
  };
  infrastructure: {
    sslConfigured: boolean;
    dnsConfigured: boolean;
  };
  recentSecurityLogs: Array<{
    id: string;
    action: string;
    resource: string;
    createdAt: Date;
    changes: any;
  }>;
}

interface SchoolDetailsDialogProps {
  school: School | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchoolUpdate?: () => void;
}

export function SchoolDetailsDialog({ school, open, onOpenChange, onSchoolUpdate }: SchoolDetailsDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<SchoolUsageMetrics | null>(null);
  const [activityLog, setActivityLog] = useState<SchoolActivityLog | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SchoolSecurityStatus | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  // Load data based on active tab
  useEffect(() => {
    if (!open || !school) return;

    const loadTabData = async () => {
      try {
        setLoading(prev => ({ ...prev, [activeTab]: true }));

        switch (activeTab) {
          case "analytics":
            if (!analytics) {
              const result = await getSchoolAnalytics(school.id);
              if (result.success && result.data) {
                setAnalytics(result.data as unknown as SchoolAnalytics);
              } else {
                toast.error("Failed to load school analytics");
              }
            }
            break;

          case "usage":
            if (!usageMetrics) {
              const result = await getSchoolUsageMetrics(school.id);
              if (result.success && result.data) {
                setUsageMetrics(result.data);
              } else {
                toast.error("Failed to load usage metrics");
              }
            }
            break;

          case "activity":
            if (!activityLog) {
              const result = await getSchoolActivityLog(school.id, 20);
              if (result.success && result.data) {
                setActivityLog(result.data as unknown as SchoolActivityLog);
              } else {
                toast.error("Failed to load activity log");
              }
            }
            break;

          case "security":
            if (!securityStatus) {
              const result = await getSchoolSecurityStatus(school.id);
              if (result.success && result.data) {
                setSecurityStatus(result.data as unknown as SchoolSecurityStatus);
              } else {
                toast.error("Failed to load security status");
              }
            }
            break;
        }
      } catch (error) {
        console.error(`Error loading ${activeTab} data:`, error);
        toast.error(`Failed to load ${activeTab} data`);
      } finally {
        setLoading(prev => ({ ...prev, [activeTab]: false }));
      }
    };

    loadTabData();
  }, [activeTab, open, school, analytics, usageMetrics, activityLog, securityStatus]);

  // Reset data when dialog closes
  useEffect(() => {
    if (!open) {
      setAnalytics(null);
      setUsageMetrics(null);
      setActivityLog(null);
      setSecurityStatus(null);
      setActiveTab("overview");
    }
  }, [open]);

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
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
                  <Users className="h-4 w-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{school._count.administrators}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {loading.analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
                <Skeleton className="h-48 w-full" />
              </div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.metrics.totalUsers}</div>
                      <p className="text-xs text-muted-foreground">
                        Active user accounts
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Courses</CardTitle>
                      <School className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.metrics.courses}</div>
                      <p className="text-xs text-muted-foreground">
                        Active courses
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Classes</CardTitle>
                      <Building className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.metrics.classes}</div>
                      <p className="text-xs text-muted-foreground">
                        Class sections
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.metrics.announcements}</div>
                      <p className="text-xs text-muted-foreground">
                        Total announcements
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Distribution</CardTitle>
                      <CardDescription>Breakdown of user roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Students</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(analytics.metrics.students / analytics.metrics.totalUsers) * 100} 
                              className="w-20"
                            />
                            <span className="text-sm font-medium">{analytics.metrics.students}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Teachers</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(analytics.metrics.teachers / analytics.metrics.totalUsers) * 100} 
                              className="w-20"
                            />
                            <span className="text-sm font-medium">{analytics.metrics.teachers}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Administrators</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(analytics.metrics.administrators / analytics.metrics.totalUsers) * 100} 
                              className="w-20"
                            />
                            <span className="text-sm font-medium">{analytics.metrics.administrators}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Overview</CardTitle>
                      <CardDescription>Content and engagement metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Events</span>
                          <span className="text-sm font-medium">{analytics.metrics.events}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Announcements</span>
                          <span className="text-sm font-medium">{analytics.metrics.announcements}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Active Courses</span>
                          <span className="text-sm font-medium">{analytics.metrics.courses}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Class Sections</span>
                          <span className="text-sm font-medium">{analytics.metrics.classes}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {analytics.usageMetrics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage Trends</CardTitle>
                      <CardDescription>Monthly usage patterns over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.usageMetrics.slice(0, 6).map((usage, index) => (
                          <div key={usage.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{usage.month}</span>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>WhatsApp: {usage.whatsappUsed}/{usage.whatsappLimit}</span>
                              <span>SMS: {usage.smsUsed}/{usage.smsLimit}</span>
                              <span>Storage: {Math.round(usage.storageUsedMB / 1024 * 100) / 100}GB</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analytics.recentActivity.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity Summary</CardTitle>
                      <CardDescription>Latest system activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.recentActivity.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between text-sm border-b pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {activity.action}
                              </Badge>
                              <span>{activity.resource}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {activity.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Analytics Actions</CardTitle>
                    <CardDescription>Export and analyze school data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Detailed Analytics
                      </Button>
                      <Button variant="outline" size="sm">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Growth Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        onOpenChange(false);
                        router.push(`/super-admin/schools/${school.id}/analytics`);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Full Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No analytics data available</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("analytics")}
                  >
                    Retry Loading
                  </Button>
                </CardContent>
              </Card>
            )}
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
                    <Users className="h-5 w-5 text-teal-600" />
                    Administrators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-teal-600">{school._count.administrators}</div>
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
            {loading.usage ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-full mb-2" />
                        <Skeleton className="h-2 w-full mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : usageMetrics ? (
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
                          <span>Used: {usageMetrics.currentUsage.whatsappUsed}</span>
                          <span>Limit: {usageMetrics.limits.whatsappLimit}</span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(usageMetrics.currentUsage.whatsappUsed, usageMetrics.limits.whatsappLimit)} 
                        />
                        <p className={`text-xs ${getUsageColor(getUsagePercentage(usageMetrics.currentUsage.whatsappUsed, usageMetrics.limits.whatsappLimit))}`}>
                          {getUsagePercentage(usageMetrics.currentUsage.whatsappUsed, usageMetrics.limits.whatsappLimit)}% used
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
                          <span>Used: {usageMetrics.currentUsage.smsUsed}</span>
                          <span>Limit: {usageMetrics.limits.smsLimit}</span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(usageMetrics.currentUsage.smsUsed, usageMetrics.limits.smsLimit)} 
                        />
                        <p className={`text-xs ${getUsageColor(getUsagePercentage(usageMetrics.currentUsage.smsUsed, usageMetrics.limits.smsLimit))}`}>
                          {getUsagePercentage(usageMetrics.currentUsage.smsUsed, usageMetrics.limits.smsLimit)}% used
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Storage Space</CardTitle>
                      <HardDrive className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Used: {Math.round(usageMetrics.currentUsage.storageUsedMB / 1024 * 100) / 100}GB</span>
                          <span>Limit: {Math.round(usageMetrics.limits.storageLimitMB / 1024 * 100) / 100}GB</span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(usageMetrics.currentUsage.storageUsedMB, usageMetrics.limits.storageLimitMB)} 
                        />
                        <p className={`text-xs ${getUsageColor(getUsagePercentage(usageMetrics.currentUsage.storageUsedMB, usageMetrics.limits.storageLimitMB))}`}>
                          {getUsagePercentage(usageMetrics.currentUsage.storageUsedMB, usageMetrics.limits.storageLimitMB)}% used
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {usageMetrics.usageHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage History</CardTitle>
                      <CardDescription>Monthly usage trends for the past year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {usageMetrics.usageHistory.slice(0, 6).map((usage, index) => (
                          <div key={usage.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{usage.month}</span>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>WhatsApp: {usage.whatsappUsed}</span>
                              <span>SMS: {usage.smsUsed}</span>
                              <span>Storage: {Math.round(usage.storageUsedMB / 1024 * 100) / 100}GB</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No usage data available</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("usage")}
                  >
                    Retry Loading
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {loading.activity ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activityLog ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest actions and changes for {activityLog.school.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activityLog.activities.length > 0 ? (
                        activityLog.activities.map((activity) => (
                          <div key={activity.id} className="border-l-2 border-muted pl-4 pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {activity.action}
                                </Badge>
                                <span className="text-sm font-medium">{activity.resource}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {activity.createdAt.toLocaleString()}
                              </span>
                            </div>
                            {activity.user && (
                              <p className="text-sm text-muted-foreground mt-1">
                                by {activity.user.name || activity.user.email}
                              </p>
                            )}
                            {activity.changes && typeof activity.changes === 'object' && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <details className="cursor-pointer">
                                  <summary>View changes</summary>
                                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                    {JSON.stringify(activity.changes, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No activity logs found
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity Management</CardTitle>
                    <CardDescription>Export and manage activity logs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Activity Log
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Log
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Log Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No activity data available</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("activity")}
                  >
                    Retry Loading
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            {loading.security ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : securityStatus ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Security Score:</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(securityStatus.securityScore / securityStatus.maxScore) * 100} 
                          className="w-32"
                        />
                        <span className="text-sm font-bold">
                          {securityStatus.securityScore}/{securityStatus.maxScore}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Infrastructure</h4>
                        <div className="flex items-center gap-2">
                          {securityStatus.infrastructure.sslConfigured ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">SSL Certificate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {securityStatus.infrastructure.dnsConfigured ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">DNS Configuration</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Authentication</h4>
                        <div className="flex items-center gap-2">
                          {securityStatus.settings?.twoFactorRequired ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-sm">Two-Factor Authentication</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {securityStatus.settings?.sessionTimeoutMinutes && 
                           securityStatus.settings?.sessionTimeoutMinutes <= 60 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-sm">Session Timeout</span>
                        </div>
                      </div>
                    </div>

                    {securityStatus.settings?.passwordPolicy && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Password Policy</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            {securityStatus.settings?.passwordPolicy.minLength && 
                             securityStatus.settings?.passwordPolicy.minLength >= 8 ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-600" />
                            )}
                            <span>Minimum Length (8+)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {securityStatus.settings?.passwordPolicy.requireUppercase ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-yellow-600" />
                            )}
                            <span>Uppercase Required</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {securityStatus.settings?.passwordPolicy.requireNumbers ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-yellow-600" />
                            )}
                            <span>Numbers Required</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {securityStatus.settings?.passwordPolicy.requireSpecialChars ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-yellow-600" />
                            )}
                            <span>Special Characters</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {securityStatus.recentSecurityLogs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Security Events</CardTitle>
                      <CardDescription>Latest security-related activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {securityStatus.recentSecurityLogs.slice(0, 10).map((log) => (
                          <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {log.action}
                              </Badge>
                              <span>{log.resource}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {log.createdAt.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Security Management</CardTitle>
                    <CardDescription>Configure security settings and policies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        onOpenChange(false);
                        router.push(`/super-admin/schools/${school.id}/settings?tab=security`);
                      }}>
                        <Shield className="h-4 w-4 mr-2" />
                        Security Settings
                      </Button>
                      <Button variant="outline" size="sm">
                        <Activity className="h-4 w-4 mr-2" />
                        Security Audit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Security Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Database className="h-4 w-4 mr-2" />
                        Backup Security
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No security data available</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("security")}
                  >
                    Retry Loading
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