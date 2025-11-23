/**
 * Backup List Component
 * 
 * Displays all available backups with actions to restore or delete
 * Includes confirmation dialog before restore operations
 * 
 * Requirements: 9.4
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RestoreConfirmDialog } from './restore-confirm-dialog';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { listBackupsAction, restoreBackupAction, deleteBackupAction } from '@/lib/actions/backupActions';
import { Download, Trash2, HardDrive, Cloud, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  location: 'LOCAL' | 'CLOUD' | 'BOTH';
  encrypted: boolean;
  status: string;
}

export function BackupList() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    setLoading(true);
    try {
      const result = await listBackupsAction();
      if (result.success) {
        setBackups(result.data);
      } else {
        toast.error(result.error || 'Failed to load backups');
      }
    } catch (error) {
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  }

  function handleRestoreClick(backup: Backup) {
    setSelectedBackup(backup);
    setShowRestoreDialog(true);
  }

  function handleDeleteClick(backup: Backup) {
    setSelectedBackup(backup);
    setShowDeleteDialog(true);
  }

  async function handleRestoreConfirm() {
    if (!selectedBackup) return;

    setRestoring(selectedBackup.id);
    setShowRestoreDialog(false);

    try {
      const result = await restoreBackupAction(selectedBackup.id);
      
      if (result.success) {
        toast.success(`Backup restored successfully. ${result.recordsRestored || 0} records restored.`);
      } else {
        toast.error(('error' in result ? result.error : 'message' in result ? result.message : 'Failed to restore backup') || 'Failed to restore backup');
      }
    } catch (error) {
      toast.error('Failed to restore backup');
    } finally {
      setRestoring(null);
      setSelectedBackup(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!selectedBackup) return;

    setDeleting(selectedBackup.id);
    setShowDeleteDialog(false);

    try {
      const result = await deleteBackupAction(selectedBackup.id);
      
      if (result.success) {
        toast.success('Backup deleted successfully');
        // Reload backups list
        await loadBackups();
      } else {
        toast.error(('error' in result ? result.error : 'message' in result ? result.message : 'Failed to delete backup') || 'Failed to delete backup');
      }
    } catch (error) {
      toast.error('Failed to delete backup');
    } finally {
      setDeleting(null);
      setSelectedBackup(null);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function getLocationIcon(location: string) {
    switch (location) {
      case 'LOCAL':
        return <HardDrive className="h-4 w-4" />;
      case 'CLOUD':
        return <Cloud className="h-4 w-4" />;
      case 'BOTH':
        return <Database className="h-4 w-4" />;
      default:
        return <HardDrive className="h-4 w-4" />;
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading backups...</p>
      </div>
    );
  }

  if (backups.length === 0) {
    return (
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No backups available</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first backup to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Encryption</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell className="font-mono text-sm">
                  {backup.filename}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {new Date(backup.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{formatBytes(backup.size)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getLocationIcon(backup.location)}
                    <span className="text-sm">{backup.location}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={backup.encrypted ? 'default' : 'secondary'}>
                    {backup.encrypted ? 'Encrypted' : 'Unencrypted'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      backup.status === 'COMPLETED' ? 'default' : 
                      backup.status === 'FAILED' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {backup.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreClick(backup)}
                      disabled={restoring === backup.id || deleting === backup.id}
                    >
                      {restoring === backup.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                          Restoring...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Restore
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(backup)}
                      disabled={restoring === backup.id || deleting === backup.id}
                    >
                      {deleting === backup.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Restore Confirmation Dialog */}
      <RestoreConfirmDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onConfirm={handleRestoreConfirm}
        backup={selectedBackup}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        backup={selectedBackup}
      />
    </>
  );
}
