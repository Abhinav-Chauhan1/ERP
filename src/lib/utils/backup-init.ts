/**
 * Backup System Initialization
 * 
 * Automatically starts scheduled backups when the application starts
 * 
 * Requirements: 9.1
 */

import { startScheduledBackups } from './scheduled-backup';

// Flag to ensure we only initialize once
let initialized = false;

/**
 * Initialize the backup system
 * This should be called when the application starts
 */
export function initializeBackupSystem(): void {
  if (initialized) {
    console.log('Backup system already initialized');
    return;
  }
  
  // Check if scheduled backups are enabled
  const scheduledBackupsEnabled = process.env.ENABLE_SCHEDULED_BACKUPS !== 'false';
  
  if (scheduledBackupsEnabled) {
    console.log('Initializing backup system...');
    startScheduledBackups();
    initialized = true;
  } else {
    console.log('Scheduled backups are disabled (ENABLE_SCHEDULED_BACKUPS=false)');
  }
}

/**
 * Check if backup system is initialized
 */
export function isBackupSystemInitialized(): boolean {
  return initialized;
}
