/**
 * Backup Management Page
 * 
 * Allows administrators to manage database backups and scheduled backups
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  getScheduledBackupStatusAction,
  startScheduledBackupsAction,
  stopScheduledBackupsAction,
  triggerManualBackupAction
} from '@/lib/actions/scheduledBackupActions';
import { listBackupsAction } from '@/lib/actions/backupActions';
import { ScheduledBackupControls } from '@/components/admin/settings/scheduled-backup-controls';
import { BackupList } from '@/components/admin/settings/backup-list';

export default async function BackupsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backup Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage database backups and configure scheduled backups
        </p>
      </div>

      <Suspense fallback={<ScheduledBackupSkeleton />}>
        <ScheduledBackupSection />
      </Suspense>

      <Suspense fallback={<BackupListSkeleton />}>
        <BackupListSection />
      </Suspense>
    </div>
  );
}

async function ScheduledBackupSection() {
  const statusResult = await getScheduledBackupStatusAction();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Backups</CardTitle>
        <CardDescription>
          Automatic daily backups at 2:00 AM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScheduledBackupControls 
          initialStatus={statusResult.data}
        />
      </CardContent>
    </Card>
  );
}

async function BackupListSection() {
  const backupsResult = await listBackupsAction();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup History</CardTitle>
        <CardDescription>
          View and manage existing backups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BackupList 
          backups={backupsResult.data || []}
        />
      </CardContent>
    </Card>
  );
}

function ScheduledBackupSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function BackupListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
