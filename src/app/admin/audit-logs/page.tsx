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
import { AuditAction } from '@prisma/client';
import { AuditLogsTable } from '@/components/admin/audit-logs-table';

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
          <AuditLogsTable
            logs={result.logs}
            emptyMessage="No audit logs found"
          />

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
