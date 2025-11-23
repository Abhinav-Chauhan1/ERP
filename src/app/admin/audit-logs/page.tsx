export const dynamic = 'force-dynamic';

/**
 * Audit Logs Admin Page
 * 
 * Displays audit logs for administrators to review system activity.
 * 
 * Requirements: 6.2
 */

import { queryAuditLogs, getAuditStats } from '@/lib/utils/audit-log';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuditAction } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    resource?: string;
    userId?: string;
  }>;
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  // Query audit logs
  const result = await queryAuditLogs({
    action: params.action as AuditAction | undefined,
    resource: params.resource,
    userId: params.userId,
    limit,
    offset,
  });

  // Get statistics
  const stats = await getAuditStats();

  // Action color mapping
  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500';
      case 'UPDATE':
        return 'bg-blue-500';
      case 'DELETE':
        return 'bg-red-500';
      case 'READ':
        return 'bg-gray-500';
      case 'LOGIN':
        return 'bg-purple-500';
      case 'LOGOUT':
        return 'bg-orange-500';
      case 'EXPORT':
        return 'bg-yellow-500';
      case 'IMPORT':
        return 'bg-teal-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          View and monitor all system activity
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Logs</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLogs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions by Type</CardTitle>
            <CardDescription>Distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.actionCounts.slice(0, 3).map((item) => (
                <div key={item.action} className="flex justify-between text-sm">
                  <span>{item.action}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Resources</CardTitle>
            <CardDescription>Most accessed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topResources.slice(0, 3).map((item) => (
                <div key={item.resource} className="flex justify-between text-sm">
                  <span className="capitalize">{item.resource}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing {result.logs.length} of {result.total} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Action</th>
                  <th className="text-left p-2">Resource</th>
                  <th className="text-left p-2">Resource ID</th>
                  <th className="text-left p-2">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {result.logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-sm">
                      <div>{log.timestamp.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm font-medium">
                        {log.user.firstName} {log.user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.user.email}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm capitalize">{log.resource}</td>
                    <td className="p-2 text-sm font-mono text-xs">
                      {log.resourceId ? (
                        <span className="truncate max-w-[100px] inline-block">
                          {log.resourceId}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2 text-sm">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {result.total > limit && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(result.total / limit)}
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`?page=${page - 1}`}
                    className="px-4 py-2 border rounded hover:bg-muted"
                  >
                    Previous
                  </a>
                )}
                {page < Math.ceil(result.total / limit) && (
                  <a
                    href={`?page=${page + 1}`}
                    className="px-4 py-2 border rounded hover:bg-muted"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
