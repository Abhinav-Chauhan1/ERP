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
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            View and monitor all system activity
          </p>
        </div>
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Page {page} of {Math.ceil(result.total / limit)}
              </div>
              <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  asChild={page > 1}
                  className="flex-1 sm:flex-none"
                >
                  {page > 1 ? (
                    <Link href={`?page=${page - 1}`}>Previous</Link>
                  ) : (
                    <span>Previous</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(result.total / limit)}
                  asChild={page < Math.ceil(result.total / limit)}
                  className="flex-1 sm:flex-none"
                >
                  {page < Math.ceil(result.total / limit) ? (
                    <Link href={`?page=${page + 1}`}>Next</Link>
                  ) : (
                    <span>Next</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
