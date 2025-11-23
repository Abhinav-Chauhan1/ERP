'use client';

/**
 * Scheduled Backup Controls Component
 * 
 * Provides UI controls for managing scheduled backups
 * 
 * Requirements: 9.1
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  startScheduledBackupsAction,
  stopScheduledBackupsAction,
  triggerManualBackupAction
} from '@/lib/actions/scheduledBackupActions';
import toast from 'react-hot-toast';
import { Play, Square, Zap, Clock } from 'lucide-react';

interface ScheduledBackupControlsProps {
  initialStatus: {
    isRunning: boolean;
    nextRun: string | null;
    schedule: string;
  } | null;
}

export function ScheduledBackupControls({ initialStatus }: ScheduledBackupControlsProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const result = await startScheduledBackupsAction();
      if (result.success) {
        toast.success('Scheduled backups started');
        // Refresh status
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to start scheduled backups');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      const result = await stopScheduledBackupsAction();
      if (result.success) {
        toast.success('Scheduled backups stopped');
        // Refresh status
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to stop scheduled backups');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerManual = async () => {
    setIsLoading(true);
    try {
      const result = await triggerManualBackupAction();
      if (result.success) {
        toast.success('Manual backup triggered. Check the backup history in a few moments.');
      } else {
        toast.error(result.error || 'Failed to trigger manual backup');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Unable to load scheduled backup status
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Display */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            {status.isRunning ? (
              <Badge variant="default" className="bg-green-500">
                <Play className="w-3 h-3 mr-1" />
                Running
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Square className="w-3 h-3 mr-1" />
                Stopped
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <Clock className="w-4 h-4 inline mr-1" />
            Schedule: {status.schedule}
          </div>
          {status.nextRun && (
            <div className="text-sm text-muted-foreground">
              Next run: {new Date(status.nextRun).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3">
        {!status.isRunning ? (
          <Button
            onClick={handleStart}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Scheduled Backups
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            disabled={isLoading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Stop Scheduled Backups
          </Button>
        )}

        <Button
          onClick={handleTriggerManual}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Trigger Manual Backup Now
        </Button>
      </div>

      {/* Information */}
      <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
        <p className="font-medium">About Scheduled Backups:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Backups run automatically every day at 2:00 AM</li>
          <li>All backups are compressed and encrypted</li>
          <li>Backups are stored locally in the backups directory</li>
          <li>Failed backups trigger email notifications to administrators</li>
          <li>You can trigger a manual backup at any time</li>
        </ul>
      </div>
    </div>
  );
}
