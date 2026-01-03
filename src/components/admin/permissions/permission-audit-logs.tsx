/**
 * Permission Audit Logs Component
 * Displays permission check and denial logs for administrators
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  changes: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface PermissionAuditLogsProps {
  userId?: string;
  resource?: string;
  limit?: number;
}

export function PermissionAuditLogs({
  userId: initialUserId,
  resource: initialResource,
  limit = 50
}: PermissionAuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState(initialUserId || '');
  const [resource, setResource] = useState(initialResource || '');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (resource) params.append('resource', resource);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/permissions/audit-logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      } else {
        setError(data.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId, resource, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilter = () => {
    fetchLogs();
  };

  const handleReset = () => {
    setUserId('');
    setResource('');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Audit Logs</CardTitle>
          <CardDescription>Loading audit logs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Audit Logs</CardTitle>
        <CardDescription>
          View all permission checks and denials for security monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Filter by user ID"
            />
          </div>
          <div>
            <Label htmlFor="resource">Resource</Label>
            <Input
              id="resource"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              placeholder="Filter by resource"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleFilter} className="flex-1">
              Apply Filters
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Logs Display */}
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit logs found
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const changes = log.changes as any;
              const isGranted = changes?.granted === true;
              const isDenied = log.resource === 'PERMISSION_DENIED';

              return (
                <div
                  key={log.id}
                  className={`border rounded-lg p-4 ${isDenied ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isGranted ? 'default' : 'destructive'}>
                        {isGranted ? 'GRANTED' : 'DENIED'}
                      </Badge>
                      <span className="font-medium">
                        {changes?.resource || 'Unknown'} - {changes?.action || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.timestamp), 'PPpp')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">User:</span>{' '}
                      {log.user.firstName} {log.user.lastName} ({log.user.email})
                    </div>
                    <div>
                      <span className="font-medium">Role:</span> {log.user.role}
                    </div>
                    <div>
                      <span className="font-medium">IP Address:</span> {log.ipAddress}
                    </div>
                    {changes?.grantType && (
                      <div>
                        <span className="font-medium">Grant Type:</span> {changes.grantType}
                      </div>
                    )}
                    {changes?.reason && (
                      <div className="col-span-2">
                        <span className="font-medium">Reason:</span>{' '}
                        <span className="text-red-600">{changes.reason}</span>
                      </div>
                    )}
                  </div>

                  {changes?.metadata && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(changes, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {logs.length >= limit && (
          <div className="mt-4 text-center">
            <Button onClick={fetchLogs} variant="outline">
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Permission Denial Statistics Component
 * Displays aggregated statistics about permission denials
 */
export function PermissionDenialStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/permissions/audit-logs?stats=true');

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.error || 'Failed to fetch statistics');
        }
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Denial Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Denial Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Denial Statistics</CardTitle>
        <CardDescription>Overview of permission denials</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Total Denials</h3>
            <p className="text-3xl font-bold">{stats?.totalDenials || 0}</p>
          </div>

          {stats?.denialsByResource && Object.keys(stats.denialsByResource).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Denials by Resource</h3>
              <div className="space-y-1">
                {Object.entries(stats.denialsByResource).map(([resource, count]) => (
                  <div key={resource} className="flex justify-between">
                    <span>{resource}</span>
                    <Badge variant="secondary">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.denialsByAction && Object.keys(stats.denialsByAction).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Denials by Action</h3>
              <div className="space-y-1">
                {Object.entries(stats.denialsByAction).map(([action, count]) => (
                  <div key={action} className="flex justify-between">
                    <span>{action}</span>
                    <Badge variant="secondary">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
