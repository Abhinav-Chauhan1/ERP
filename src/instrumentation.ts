/**
 * Next.js Instrumentation
 * 
 * This file is automatically loaded by Next.js when the server starts
 * It's the recommended place to initialize server-side services
 * 
 * Requirements: 9.1, 10.3, 19.3, 19.4
 */

export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeBackupSystem } = await import('./lib/utils/backup-init');
    const { initializeScheduledReportService } = await import('./lib/services/scheduled-report-service');
    const { initializeDefaultHandlers } = await import('./lib/services/whatsapp-button-handler');
    
    // Initialize the backup system
    initializeBackupSystem();
    
    // Initialize the scheduled report service
    initializeScheduledReportService();
    
    // Initialize WhatsApp button handlers
    initializeDefaultHandlers();
  }
}
