import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Link from "next/link";
import { 
  ArrowLeft, 
  Activity, 
  Shield, 
  FileText, 
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

interface SchoolActivityPageProps {
  params: Promise<{ id: string }>;
}

export default async function SchoolActivityPage({ params }: SchoolActivityPageProps) {
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
      status: true,
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

  // Mock data for demonstration - in real implementation, this would come from audit logs
  const mockAuditLogs = [
    {
      id: "1",
      action: "USER_LOGIN",
      resource: "authentication",
      userId: "user1",
      userName: "John Doe",
      details: { userAgent: "Chrome/91.0", ipAddress: "192.168.1.1" },
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      severity: "info"
    },
    {
      id: "2", 
      action: "STUDENT_CREATED",
      resource: "student",
      userId: "admin1",
      userName: "Admin User",
      details: { studentName: "Jane Smith", class: "Grade 10A" },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      severity: "info"
    },
    {
      id: "3",
      action: "PERMISSION_DENIED",
      resource: "grades",
      userId: "teacher1", 
      userName: "Teacher One",
      details: { attemptedAction: "DELETE_GRADE", reason: "Insufficient permissions" },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      severity: "warning"
    },
    {
      id: "4",
      action: "DATA_EXPORT",
      resource: "student_data",
      userId: "admin1",
      userName: "Admin User", 
      details: { exportType: "CSV", recordCount: 150 },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      severity: "info"
    },
    {
      id: "5",
      action: "FAILED_LOGIN",
      resource: "authentication",
      userId: "unknown",
      userName: "Unknown User",
      details: { email: "test@example.com", ipAddress: "192.168.1.100", attempts: 3 },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      severity: "error"
    }
  ];

  const mockSystemLogs = [
    {
      id: "1",
      event: "BACKUP_COMPLETED",
      status: "success",
      details: { size: "2.3 GB", duration: "45 minutes" },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
    },
    {
      id: "2",
      event: "SMS_QUOTA_WARNING", 
      status: "warning",
      details: { used: 850, limit: 1000, percentage: 85 },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    },
    {
      id: "3",
      event: "DATABASE_MAINTENANCE",
      status: "info",
      details: { operation: "INDEX_REBUILD", duration: "12 minutes" },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    }
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return <Badge variant="secondary">Warning</Badge>;
      case "info":
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge variant="default">Success</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/super-admin/schools/${school.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Activity & Logs</h1>
          <p className="text-muted-foreground">{school.name} • {school.schoolCode}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
            {school.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Events
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Audit Logs
                  </CardTitle>
                  <CardDescription>
                    Track user actions and security events
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search logs..." className="pl-8 w-64" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {getSeverityIcon(log.severity)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.action}</span>
                          {getSeverityBadge(log.severity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.resource}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {JSON.stringify(log.details)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {log.timestamp.toLocaleString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Events
                  </CardTitle>
                  <CardDescription>
                    Monitor system operations and automated processes
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSystemLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.event}</span>
                        <Badge 
                          variant={
                            log.status === "success" ? "default" :
                            log.status === "warning" ? "secondary" :
                            log.status === "error" ? "destructive" :
                            "outline"
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {log.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Activity Reports
              </CardTitle>
              <CardDescription>
                Generate and download activity reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Security Audit Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <User className="h-6 w-6 mb-2" />
                  <span>User Activity Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Activity className="h-6 w-6 mb-2" />
                  <span>System Events Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Compliance Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}