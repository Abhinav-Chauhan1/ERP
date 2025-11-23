/**
 * Restore Confirmation Dialog
 * 
 * Displays a warning dialog before restoring a backup
 * Requires user confirmation to proceed with restore operation
 * 
 * Requirements: 9.4 - Add confirmation dialog before restore
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
import { AlertTriangle } from 'lucide-react';

interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  location: 'LOCAL' | 'CLOUD' | 'BOTH';
  encrypted: boolean;
}

interface RestoreConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  backup: Backup | null;
}

export function RestoreConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  backup,
}: RestoreConfirmDialogProps) {
  if (!backup) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl">
                Restore Database Backup?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-1">
                This action will overwrite your current database
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Backup Details */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-semibold mb-3">Backup Details</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Filename:</dt>
                <dd className="font-mono">{backup.filename}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created:</dt>
                <dd>{new Date(backup.createdAt).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Location:</dt>
                <dd>{backup.location}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Encryption:</dt>
                <dd>{backup.encrypted ? 'AES-256-GCM' : 'None'}</dd>
              </div>
            </dl>
          </div>

          {/* Warning Message */}
          <div className="rounded-lg border-2 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4">
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Warning
            </h4>
            <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  <strong>All current data will be overwritten</strong> with data from this backup
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  Any changes made after <strong>{new Date(backup.createdAt).toLocaleString()}</strong> will be lost
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  This operation <strong>cannot be undone</strong> unless you have another backup
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  It is <strong>highly recommended</strong> to create a backup of the current state before proceeding
                </span>
              </li>
            </ul>
          </div>

          {/* Recommendations */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 p-4">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Before You Proceed
            </h4>
            <ol className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200 list-decimal list-inside">
              <li>Create a backup of the current database state</li>
              <li>Notify all users that the system will be temporarily unavailable</li>
              <li>Verify this is the correct backup to restore</li>
              <li>Ensure you have administrator access to fix any issues</li>
            </ol>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Yes, Restore Backup
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
