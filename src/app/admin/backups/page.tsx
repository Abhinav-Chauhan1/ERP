export const dynamic = 'force-dynamic';

/**
 * Admin Backup Management Page
 * 
 * Allows administrators to:
 * - View all backups
 * - Create manual backups
 * - Restore from backups (with confirmation)
 * - Delete old backups
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackupList } from '@/components/admin/backups/backup-list';
import { CreateBackupButton } from '@/components/admin/backups/create-backup-button';
import { Database, HardDrive, Shield, Clock } from 'lucide-react';

export default function BackupsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Backups</h1>
          <p className="text-muted-foreground mt-2">
            Manage database backups and restore points
          </p>
        </div>
        <CreateBackupButton />
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Automated daily backups at 2:00 AM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Local + Cloud</div>
            <p className="text-xs text-muted-foreground">
              Dual storage for redundancy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encryption</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AES-256</div>
            <p className="text-xs text-muted-foreground">
              Military-grade encryption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30 Days</div>
            <p className="text-xs text-muted-foreground">
              Automatic cleanup of old backups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Backups</CardTitle>
          <CardDescription>
            View, restore, or delete existing backups. Restoring a backup will overwrite current data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">Loading backups...</div>}>
            <BackupList />
          </Suspense>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle className="text-yellow-900 dark:text-yellow-100">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Backups are encrypted with AES-256-GCM encryption</li>
            <li>All backups are compressed with gzip for efficient storage</li>
            <li>Restoring a backup will overwrite existing data - use with caution</li>
            <li>Always create a manual backup before performing major operations</li>
            <li>Failed backups trigger automatic email notifications to administrators</li>
            <li>Backups are stored both locally and in cloud storage for redundancy</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
