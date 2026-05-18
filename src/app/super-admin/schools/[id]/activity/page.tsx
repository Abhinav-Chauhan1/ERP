import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw
} from "lucide-react";
import { getAuditLogs } from "@/lib/actions/audit-log-actions";

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

  const auditResult = await getAuditLogs({ schoolId: id, limit: 50 });
  const auditLogs = auditResult.success ? (auditResult.data ?? []) : [];

  const getSeverityFromAction = (action: string) => {
    const critical = ["DELETE", "BULK_REJECT"];
    const high = ["UPDATE", "APPROVE", "REJECT"];
    const medium = ["CREATE", "IMPORT", "EXPORT"];
    if (critical.includes(action)) return "error";
    if (high.includes(action)) return "warning";
    if (medium.includes(action)) return "info";
    return "success";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":   return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":    return <Info className="h-4 w-4 text-blue-500" />;
      default:        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":   return <Badge variant="destructive">Error</Badge>;
      case "warning": return <Badge variant="secondary">Warning</Badge>;
      case "info":    return <Badge variant="outline">Info</Badge>;
      default:        return <Badge variant="default">Success</Badge>;
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
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
            {school.status}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/super-admin/schools/${school.id}/activity`}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Audit Logs
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
                    {auditLogs.length > 0
                      ? `${auditLogs.length} events — showing most recent first`
                      : "No audit events recorded for this school yet"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No activity recorded for this school yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      const severity = getSeverityFromAction(log.action);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>{getSeverityIcon(severity)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{log.action}</span>
                              {getSeverityBadge(severity)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <div className="text-sm">{log.userName}</div>
                                <div className="text-xs text-muted-foreground">{log.userRole}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.resource || "—"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(log.timestamp).toLocaleString("en-IN")}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
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
                View audit reports for this school in the global audit log viewer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link href={`/super-admin/audit`}>
                    <Shield className="h-6 w-6 mb-2" />
                    <span>Global Audit Log</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link href={`/super-admin/schools/${school.id}/users`}>
                    <User className="h-6 w-6 mb-2" />
                    <span>User Management</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
