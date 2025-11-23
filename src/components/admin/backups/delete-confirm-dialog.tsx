/**
 * Delete Confirmation Dialog
 * 
 * Displays a confirmation dialog before deleting a backup
 */

'use client';

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
import { Trash2 } from 'lucide-react';

interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  location: 'LOCAL' | 'CLOUD' | 'BOTH';
  encrypted: boolean;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  backup: Backup | null;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  backup,
}: DeleteConfirmDialogProps) {
  if (!backup) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm text-muted-foreground">
            You are about to permanently delete the following backup:
          </p>

          <div className="rounded-lg border bg-muted/50 p-3">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Filename:</dt>
                <dd className="font-mono text-xs">{backup.filename}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created:</dt>
                <dd>{new Date(backup.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          <p className="text-sm text-red-600 dark:text-red-400">
            Once deleted, this backup cannot be recovered and you will not be able to restore from it.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Backup
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
