'use client';

/**
 * Backup List Component
 * 
 * Displays a list of existing backups with actions
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  createBackupAction,
  deleteBackupAction,
  restoreBackupAction
} from '@/lib/actions/backupActions';
import toast from 'react-hot-toast';
import { Download, Trash2, RotateCcw, Plus, Database, HardDrive, Cloud } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  location: 'LOCAL' | 'CLOUD' | 'BOTH';
  encrypted: boolean;
  status: string;
}

interface BackupListProps {
  backups: Backup[];
}

export function BackupList({ backups: initialBackups }: BackupListProps) {
  const [backups, setBackups] = useState(initialBackups);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const result = await createBackupAction();
      if (result.success) {
        toast.success('Backup created successfully');
        // Refresh the page to show new backup
        window.location.reload();
      } else {
        toast.error(('error' in result ? result.error : 'message' in result ? result.message : 'Failed to create backup') || 'Failed to create backup');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackupId) return;
    
    setIsLoading(true);
    try {
      const result = await deleteBackupAction(selectedBackupId);
      if (result.success) {
        toast.success('Backup deleted successfully');
        setBackups(backups.filter(b => b.id !== selectedBackupId));
        setDeleteDialogOpen(false);
      } else {
        toast.error(('error' in result ? result.error : 'message' in result ? result.message : 'Failed to delete backup') || 'Failed to delete backup');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
      setSelectedBackupId(null);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackupId) return;
    
    setIsLoading(true);
    try {
      const result = await restoreBackupAction(selectedBackupId);
      if (result.success) {
        toast.success('Backup restored successfully');
        setRestoreDialogOpen(false);
      } else {
        toast.error(('error' in result ? result.error : 'message' in result ? result.message : 'Failed to restore backup') || 'Failed to restore backup');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
      setSelectedBackupId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'LOCAL':
        return <HardDrive className="w-4 h-4" />;
      case 'CLOUD':
        return <Cloud className="w-4 h-4" />;
      case 'BOTH':
        return (
          <div className="flex gap-1">
            <HardDrive className="w-4 h-4" />
            <Cloud className="w-4 h-4" />
          </div>
        );
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Backup Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleCreateBackup}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Backup
        </Button>
      </div>

      {/* Backup List */}
      {backups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No backups found</p>
          <p className="text-sm mt-2">Create your first backup to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{backup.filename}</span>
                  {backup.encrypted && (
                    <Badge variant="secondary" className="text-xs">
                      Encrypted
                    </Badge>
                  )}
                  <Badge 
                    variant={
                      backup.status === 'COMPLETED' ? 'default' : 
                      backup.status === 'FAILED' ? 'destructive' : 
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {backup.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatFileSize(backup.size)}</span>
                  <span>•</span>
                  <span>{new Date(backup.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {getLocationIcon(backup.location)}
                    <span>{backup.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedBackupId(backup.id);
                    setRestoreDialogOpen(true);
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedBackupId(backup.id);
                    setDeleteDialogOpen(true);
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBackup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this backup? This will replace the current database state.
              Make sure to create a backup of the current state before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreBackup}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
