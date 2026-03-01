import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubdomainManagement } from "@/components/super-admin/schools/subdomain-management";
import Link from "next/link";
import { 
  ArrowLeft, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Activity,
  FileText,
  Database,
  Bell,
  Key,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface SchoolOverviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function SchoolOverviewPage({ params }: SchoolOverviewPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    await requireSuperAdminAccess();
  } catch (error) {
    redirect("/");
  }

  const school = await db.school.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      schoolCode: true,
      email: true,
      phone: true,
      address: true,
      domain: true,
      subdomain: true,
      subdomainStatus: true,
      dnsConfigured: true,
      sslConfigured: true,
      sslExpiresAt: true,
      status: true,
      plan: true,
      isOnboarded: true,
      tagline: true,
      logo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          teachers: true,
          students: true,
          administrators: true,
          classes: true,
          Subject: true,
          parents: true,
        },
      },
    },
  });

  if (!school) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">School Not Found</h1>
        <p className="text-gray-500 mb-6">The school you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/super-admin/schools">Return to Schools List</Link>
        </Button>
      </div>
    );
  }

  // Mock subscription data for demonstration
  const currentSubscription = {
    id: "sub_1",
    status: "ACTIVE",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    plan: {
      name: school.plan,
      amount: 2999, // $29.99
      currency: "usd",
      interval: "month",
    },
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/super-admin/schools">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {school.logo && (
              <img 
                src={school.logo} 
                alt={`${school.name} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{school.name}</h1>
              <p className="text-muted-foreground">
                {school.schoolCode} • {school.tagline || "No tagline set"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
            {school.status}
          </Badge>
          <Badge variant={school.isOnboarded ? "default" : "secondary"}>
            {school.isOnboarded ? "Onboarded" : "Pending"}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{school._count.students}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{school._count.teachers}</p>
                <p className="text-xs text-muted-foreground">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-2xl font-bold">{school._count.classes}</p>
                <p className="text-xs text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{school._count.Subject}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Information & Subdomain Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              School Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
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
              {school.domain && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{school.domain}</span>
                </div>
              )}
              {school.subdomain && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{school.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}</span>
                </div>
              )}
              {school.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{school.address}</span>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{school.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{school.updatedAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentSubscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{currentSubscription.plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${(currentSubscription.plan.amount / 100).toFixed(2)}/{currentSubscription.plan.interval}
                    </p>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Next billing date</p>
                  <p className="font-medium">{currentSubscription.currentPeriodEnd.toLocaleDateString()}</p>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/super-admin/schools/${school.id}/billing`}>
                    View Billing Details
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No active subscription</p>
                <Button size="sm">Create Subscription</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subdomain Management */}
      <SubdomainManagement
        schoolId={school.id}
        schoolName={school.name}
        subdomain={school.subdomain}
        subdomainStatus={school.subdomainStatus}
        dnsConfigured={school.dnsConfigured}
        sslConfigured={school.sslConfigured}
        sslExpiresAt={school.sslExpiresAt?.toISOString()}
      />

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage students, teachers, and administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Students</span>
                <span className="font-medium">{school._count.students}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Teachers</span>
                <span className="font-medium">{school._count.teachers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Administrators</span>
                <span className="font-medium">{school._count.administrators}</span>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href={`/super-admin/schools/${school.id}/users`}>
                Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              View usage analytics and reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>Growth trending up</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-3 w-3 text-blue-500" />
                <span>Active usage patterns</span>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href={`/super-admin/schools/${school.id}/analytics`}>
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>
              Configure permissions, limits, and security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/super-admin/schools/${school.id}/settings`}>
                  <Shield className="h-3 w-3 mr-1" />
                  Permissions
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/super-admin/schools/${school.id}/settings`}>
                  <Key className="h-3 w-3 mr-1" />
                  Security
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/super-admin/schools/${school.id}/settings`}>
                  <Bell className="h-3 w-3 mr-1" />
                  Notifications
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/super-admin/schools/${school.id}/settings`}>
                  <Database className="h-3 w-3 mr-1" />
                  Data
                </Link>
              </Button>
            </div>
            <Button asChild className="w-full">
              <Link href={`/super-admin/schools/${school.id}/settings`}>
                All Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity & Monitoring
            </CardTitle>
            <CardDescription>
              View audit logs and system activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/super-admin/schools/${school.id}/activity`}>
                <Activity className="h-4 w-4 mr-2" />
                View Activity Logs
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href={`/super-admin/schools/${school.id}/edit`}>
                Edit School Information
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href={`/super-admin/schools/${school.id}/subscription`}>
                Manage Subscription
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href={`/super-admin/schools/${school.id}/launch-setup`}>
                Launch Setup Wizard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}