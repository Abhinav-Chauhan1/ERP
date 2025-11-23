/**
 * Create Backup Button Component
 * 
 * Allows administrators to manually trigger a backup
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createBackupAction } from '@/lib/actions/backupActions';
import { Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function CreateBackupButton() {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreateBackup() {
    setCreating(true);

    try {
      const result = await createBackupAction(true);

      if (result.success) {
        toast.success('Backup created successfully');
        // Refresh the page to show the new backup
        router.refresh();
      } else {
        toast.error(('error' in result ? result.error : 'message' in result ? result.message : 'Failed to create backup') || 'Failed to create backup');
      }
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Button onClick={handleCreateBackup} disabled={creating}>
      {creating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Creating Backup...
        </>
      ) : (
        <>
          <Database className="h-4 w-4 mr-2" />
          Create Backup
        </>
      )}
    </Button>
  );
}
