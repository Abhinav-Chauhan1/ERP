/**
 * Scheduled Backup Service
 * 
 * Provides functionality to schedule automatic database backups
 * using node-cron for daily backups at 2 AM
 * 
 * Requirements: 9.1
 */

import cron, { ScheduledTask } from 'node-cron';
import { createBackup } from './backup-service';
import { db as prisma } from '@/lib/db';
import { AuditAction } from '@prisma/client';

// Track the scheduled task
let scheduledTask: ScheduledTask | null = null;

/**
 * Log backup execution to audit log
 */
async function logBackupExecution(
  success: boolean,
  backupId?: string,
  error?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM',
        action: success ? AuditAction.CREATE : AuditAction.CREATE,
        resource: 'scheduled_backup',
        resourceId: backupId || 'failed',
        changes: {
          success,
          error: error || null,
          timestamp: new Date().toISOString(),
          type: 'scheduled'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Scheduled Backup Service'
      }
    });
  } catch (logError) {
    console.error('Failed to log backup execution:', logError);
  }
}

/**
 * Get all administrator emails
 */
async function getAdministratorEmails(): Promise<string[]> {
  try {
    const admins = await prisma.administrator.findMany({
      include: {
        user: {
          select: {
            email: true,
            active: true
          }
        }
      }
    });
    
    // Filter active admins and extract emails
    return admins
      .filter(admin => admin.user.active)
      .map(admin => admin.user.email);
  } catch (error) {
    console.error('Failed to fetch administrator emails:', error);
    return [];
  }
}

/**
 * Send notification email on backup failure
 * Requirements: 9.5
 */
async function notifyBackupFailure(error: string): Promise<void> {
  try {
    console.error('BACKUP FAILURE NOTIFICATION:', {
      timestamp: new Date().toISOString(),
      error,
      message: 'Scheduled backup failed. Please check the system immediately.'
    });
    
    // Get administrator emails
    const adminEmails = await getAdministratorEmails();
    
    if (adminEmails.length === 0) {
      console.warn('No administrator emails found. Cannot send backup failure notification.');
      return;
    }
    
    // Import sendEmail dynamically to avoid circular dependencies
    const { sendEmail } = await import('./email-service');
    
    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
    
    const subject = '🚨 URGENT: Scheduled Database Backup Failed';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Backup Failure Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #fff; margin: 0 0 10px 0;">🚨 Backup Failure Alert</h1>
            <p style="margin: 0; color: #fee2e2; font-weight: bold;">IMMEDIATE ACTION REQUIRED</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 2px solid #dc2626; border-radius: 8px;">
            <p><strong>Dear Administrator,</strong></p>
            
            <p>The scheduled database backup has <strong style="color: #dc2626;">FAILED</strong>. This is a critical issue that requires immediate attention to ensure data protection.</p>
            
            <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #991b1b;">Failure Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; vertical-align: top;">Timestamp:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Error Message:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-family: monospace; word-break: break-word;">${error}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Backup Type:</td>
                  <td style="padding: 8px 0;">Scheduled (Daily 2:00 AM)</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">Recommended Actions</h3>
              <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
                <li style="margin-bottom: 8px;">Check the backup service logs for detailed error information</li>
                <li style="margin-bottom: 8px;">Verify database connectivity and permissions</li>
                <li style="margin-bottom: 8px;">Ensure sufficient disk space is available for backups</li>
                <li style="margin-bottom: 8px;">Check encryption key configuration (BACKUP_ENCRYPTION_KEY)</li>
                <li style="margin-bottom: 8px;">Verify cloud storage credentials if applicable</li>
                <li style="margin-bottom: 8px;">Attempt a manual backup to diagnose the issue</li>
                <li style="margin-bottom: 8px;">Review system resources (CPU, memory, disk I/O)</li>
              </ol>
            </div>
            
            <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">Important Reminders</h3>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af;">
                <li style="margin-bottom: 8px;">Regular backups are critical for data protection and disaster recovery</li>
                <li style="margin-bottom: 8px;">Failed backups leave your data vulnerable to loss</li>
                <li style="margin-bottom: 8px;">Resolve this issue as soon as possible to maintain data integrity</li>
                <li style="margin-bottom: 8px;">Consider triggering a manual backup once the issue is resolved</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <strong>System Information:</strong><br>
              Environment: ${process.env.NODE_ENV || 'production'}<br>
              Application: ${process.env.NEXT_PUBLIC_APP_NAME || 'School ERP'}<br>
              Timestamp (ISO): ${timestamp}
            </p>
            
            <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">
              ⚠️ This is an automated critical alert. Please take immediate action.
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">This is an automated system alert from the backup service.</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_APP_NAME || 'School ERP'}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
    
    // Send email to all administrators
    const result = await sendEmail({
      to: adminEmails,
      subject,
      html
    });
    
    if (result.success) {
      console.log(`✓ Backup failure notification sent to ${adminEmails.length} administrator(s)`);
      console.log(`  Recipients: ${adminEmails.join(', ')}`);
      console.log(`  Message ID: ${result.messageId}`);
    } else {
      console.error('✗ Failed to send backup failure notification:', result.error);
    }
  } catch (error) {
    console.error('Error sending backup failure notification:', error);
  }
}

/**
 * Execute scheduled backup
 */
async function executeScheduledBackup(): Promise<void> {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log(`Starting scheduled backup at ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  
  try {
    // Pass notifyOnFailure=true and backupType='scheduled' for scheduled backups
    const result = await createBackup(true, 'scheduled');
    
    if (result.success && result.metadata) {
      const duration = Date.now() - startTime;
      console.log('✓ Scheduled backup completed successfully');
      console.log(`  Backup ID: ${result.metadata.id}`);
      console.log(`  Filename: ${result.metadata.filename}`);
      console.log(`  Size: ${(result.metadata.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Duration: ${(duration / 1000).toFixed(2)} seconds`);
      console.log(`  Location: ${result.metadata.location}`);
      
      // Log successful backup
      await logBackupExecution(true, result.metadata.id);
    } else {
      const error = result.error || 'Unknown error';
      console.error('✗ Scheduled backup failed:', error);
      
      // Log failed backup
      await logBackupExecution(false, undefined, error);
      
      // Note: Email notification is already sent by createBackup when notifyOnFailure=true
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Scheduled backup failed with exception:', errorMessage);
    
    // Log failed backup
    await logBackupExecution(false, undefined, errorMessage);
    
    // Send failure notification for unexpected exceptions
    await notifyBackupFailure(errorMessage);
  }
  
  console.log('='.repeat(60));
}

/**
 * Start scheduled backups
 * 
 * Schedule: Daily at 2:00 AM
 * Cron expression: '0 2 * * *'
 * - Minute: 0
 * - Hour: 2
 * - Day of month: * (every day)
 * - Month: * (every month)
 * - Day of week: * (every day of week)
 * 
 * Requirements: 9.1
 */
export function startScheduledBackups(): void {
  // Stop existing task if running
  if (scheduledTask) {
    console.log('Stopping existing scheduled backup task...');
    scheduledTask.stop();
  }
  
  // Schedule daily backup at 2 AM
  // Cron expression: '0 2 * * *' = At 02:00 every day
  scheduledTask = cron.schedule('0 2 * * *', async () => {
    await executeScheduledBackup();
  }, {
    timezone: process.env.TZ || 'UTC'
  });
  
  console.log('✓ Scheduled backups started');
  console.log(`  Schedule: Daily at 2:00 AM (${process.env.TZ || 'UTC'})`);
}

/**
 * Stop scheduled backups
 */
export function stopScheduledBackups(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('✓ Scheduled backups stopped');
  } else {
    console.log('No scheduled backup task is running');
  }
}

/**
 * Get scheduled backup status
 */
export function getScheduledBackupStatus(): {
  isRunning: boolean;
  nextRun: string | null;
  schedule: string;
} {
  return {
    isRunning: scheduledTask !== null,
    nextRun: null,
    schedule: 'Daily at 2:00 AM'
  };
}

/**
 * Manually trigger a scheduled backup (for testing)
 */
export async function triggerManualBackup(): Promise<void> {
  console.log('Manually triggering scheduled backup...');
  await executeScheduledBackup();
}
