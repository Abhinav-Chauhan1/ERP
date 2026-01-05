/**
 * Database Backup Service
 * 
 * Provides functionality to create encrypted, compressed database backups
 * and store them locally and in cloud storage.
 * 
 * Requirements: 9.2, 9.3
 */

import { db as prisma } from '@/lib/db';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Backup configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || generateDefaultKey();

interface BackupMetadata {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  location: 'LOCAL' | 'CLOUD' | 'BOTH';
  encrypted: boolean;
  compressed: boolean;
  checksum: string;
  status: string;
}

interface BackupResult {
  success: boolean;
  metadata?: BackupMetadata;
  error?: string;
  localPath?: string;
  cloudPath?: string;
}

interface RestoreResult {
  success: boolean;
  error?: string;
  recordsRestored?: number;
}

/**
 * Generate a default encryption key (for development only)
 * In production, this should be set via environment variable
 * 
 * Note: This uses a fixed key for development to allow testing.
 * NEVER use this in production!
 */
function generateDefaultKey(): string {
  console.warn('WARNING: Using default encryption key. Set BACKUP_ENCRYPTION_KEY in production!');
  // Use a fixed key for development/testing (64 hex characters = 32 bytes)
  // In production, this MUST be set via BACKUP_ENCRYPTION_KEY environment variable
  return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
}

/**
 * Get encryption key as Buffer
 */
function getEncryptionKey(): Buffer {
  const key = ENCRYPTION_KEY;
  if (key.length !== ENCRYPTION_KEY_LENGTH * 2) { // hex string is 2x length
    throw new Error(`Encryption key must be ${ENCRYPTION_KEY_LENGTH * 2} hex characters`);
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt data using AES-256-GCM
 */
function encryptData(data: Buffer): { encrypted: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return { encrypted, iv, authTag };
}

/**
 * Decrypt data using AES-256-GCM
 */
function decryptData(encrypted: Buffer, iv: Buffer, authTag: Buffer): Buffer {
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Calculate SHA-256 checksum of data
 */
function calculateChecksum(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Export all database data to JSON
 */
async function exportDatabaseData(): Promise<any> {
  console.log('Exporting database data...');

  // Export all models
  // Note: This is a simplified approach. In production, you might want to
  // use pg_dump or a more sophisticated approach
  const data: any = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    tables: {}
  };

  try {
    // Check if prisma is initialized
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    // Helper function to safely export a table
    const safeExport = async (tableName: string, exportFn: () => Promise<any[]>) => {
      try {
        console.log(`Exporting ${tableName}...`);
        const records = await exportFn();
        console.log(`  ✓ Exported ${records.length} ${tableName}`);
        return records;
      } catch (error) {
        console.warn(`  ⚠ Failed to export ${tableName}:`, error instanceof Error ? error.message : error);
        return [];
      }
    };

    // Export all tables with error handling
    data.tables.users = await safeExport('users', () => prisma.user.findMany());
    data.tables.administrators = await safeExport('administrators', () => prisma.administrator.findMany());
    data.tables.teachers = await safeExport('teachers', () => prisma.teacher.findMany());
    data.tables.students = await safeExport('students', () => prisma.student.findMany());
    data.tables.parents = await safeExport('parents', () => prisma.parent.findMany());
    data.tables.academicYears = await safeExport('academicYears', () => prisma.academicYear.findMany());
    data.tables.terms = await safeExport('terms', () => prisma.term.findMany());
    data.tables.classes = await safeExport('classes', () => prisma.class.findMany());
    data.tables.sections = await safeExport('sections', () => prisma.classSection.findMany());
    data.tables.subjects = await safeExport('subjects', () => prisma.subject.findMany());
    data.tables.studentAttendance = await safeExport('studentAttendance', () => prisma.studentAttendance.findMany());
    data.tables.exams = await safeExport('exams', () => prisma.exam.findMany());
    data.tables.examResults = await safeExport('examResults', () => prisma.examResult.findMany());
    data.tables.assignments = await safeExport('assignments', () => prisma.assignment.findMany());
    data.tables.feeStructures = await safeExport('feeStructures', () => prisma.feeStructure.findMany());
    data.tables.feePayments = await safeExport('feePayments', () => prisma.feePayment.findMany());
    data.tables.announcements = await safeExport('announcements', () => prisma.announcement.findMany());
    data.tables.messages = await safeExport('messages', () => prisma.message.findMany());
    data.tables.notifications = await safeExport('notifications', () => prisma.notification.findMany());
    data.tables.documents = await safeExport('documents', () => prisma.document.findMany());
    data.tables.events = await safeExport('events', () => prisma.event.findMany());
    data.tables.auditLogs = await safeExport('auditLogs', () => prisma.auditLog.findMany());

    console.log('Database export completed successfully');
    return data;
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
}

/**
 * Get all administrator emails for notifications
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
 * Send backup failure notification to administrators
 * Requirements: 9.5
 */
async function sendBackupFailureNotification(error: string, backupType: 'manual' | 'scheduled' = 'manual'): Promise<void> {
  try {
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

    const subject = `🚨 URGENT: ${backupType === 'manual' ? 'Manual' : 'Scheduled'} Database Backup Failed`;

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
            
            <p>A ${backupType} database backup has <strong style="color: #dc2626;">FAILED</strong>. This is a critical issue that requires immediate attention to ensure data protection.</p>
            
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
                  <td style="padding: 8px 0;">${backupType === 'manual' ? 'Manual (User-triggered)' : 'Scheduled (Daily 2:00 AM)'}</td>
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
              Application: ${process.env.NEXT_PUBLIC_APP_NAME || 'SikshaMitra'}<br>
              Timestamp (ISO): ${timestamp}
            </p>
            
            <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">
              ⚠️ This is an automated critical alert. Please take immediate action.
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">This is an automated system alert from the backup service.</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_APP_NAME || 'SikshaMitra'}. All rights reserved.</p>
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
 * Upload backup file to cloud storage (Cloudinary)
 */
async function uploadToCloudStorage(filePath: string, backupId: string): Promise<string> {
  try {
    const { uploadToServerCloudinary } = await import("@/lib/cloudinary-server");

    // Upload as raw file with private access
    const result = await uploadToServerCloudinary(filePath, {
      folder: 'backups',
      resource_type: 'raw',
      public_id: `backup-${backupId}`,
      type: 'private', // restricted access
      format: 'enc'
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloud upload failed:', error);
    throw error;
  }
}

/**
 * Create a database backup
 * 
 * Process:
 * 1. Export database data to JSON
 * 2. Compress with gzip
 * 3. Encrypt with AES-256-GCM
 * 4. Store locally
 * 5. Optionally upload to cloud storage
 * 6. Send notification on failure (Requirements: 9.5)
 */
export async function createBackup(notifyOnFailure: boolean = false, backupType: 'manual' | 'scheduled' = 'manual'): Promise<BackupResult> {
  try {
    console.log('Starting backup process...');

    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Generate backup ID and filename
    const backupId = crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}-${backupId}.enc`;
    const localPath = path.join(BACKUP_DIR, filename);

    // Step 1: Export database data
    const data = await exportDatabaseData();
    const jsonData = JSON.stringify(data);
    const dataBuffer = Buffer.from(jsonData, 'utf-8');

    // Calculate checksum of original data
    const checksum = calculateChecksum(dataBuffer);

    // Step 2: Compress with gzip
    console.log('Compressing backup...');
    const compressed = await gzip(dataBuffer);
    console.log(`Compression: ${dataBuffer.length} -> ${compressed.length} bytes (${Math.round((1 - compressed.length / dataBuffer.length) * 100)}% reduction)`);

    // Step 3: Encrypt
    console.log('Encrypting backup...');
    const { encrypted, iv, authTag } = encryptData(compressed);

    // Combine IV, auth tag, and encrypted data
    const finalData = Buffer.concat([
      iv,
      authTag,
      encrypted
    ]);

    // Step 4: Store locally
    console.log(`Saving backup to ${localPath}...`);
    await fs.writeFile(localPath, finalData);

    const stats = await fs.stat(localPath);
    let cloudPath: string | undefined;
    let location: 'LOCAL' | 'CLOUD' | 'BOTH' = 'LOCAL';

    // Step 5: Upload to cloud (if configured)
    if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      try {
        console.log('Uploading backup to cloud storage...');
        cloudPath = await uploadToCloudStorage(localPath, backupId);
        location = 'BOTH';
        console.log('Cloud upload successful');
      } catch (cloudError) {
        console.error('Cloud upload failed, continuing with local backup only:', cloudError);
        // We do not fail the entire process if cloud upload fails, but we verify local success
      }
    }

    // Create metadata
    const metadata: BackupMetadata = {
      id: backupId,
      filename,
      size: stats.size,
      createdAt: new Date(),
      location,
      encrypted: true,
      compressed: true,
      checksum,
      status: 'COMPLETED'
    };

    // Step 6: Store backup record in database - SKIPPED (Model missing)
    // In a future update, we should add the Backup model to schema.prisma
    /*
    await prisma.backup.create({
      data: {
        id: backupId,
        filename,
        size: BigInt(stats.size),
        location,
        encrypted: true,
        status: 'COMPLETED',
        createdAt: metadata.createdAt,
        cloudUrl: cloudPath
      }
    });
    */

    // For now, we rely on the file system and audit logs

    console.log('Backup completed successfully');

    return {
      success: true,
      metadata,
      localPath,
      cloudPath
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backup failed:', errorMessage);

    // Send failure notification if requested (Requirements: 9.5)
    if (notifyOnFailure) {
      await sendBackupFailureNotification(errorMessage, backupType);
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Import data into database tables
 * This function restores data from a backup into the database
 */
async function importDatabaseData(data: any): Promise<number> {
  console.log('Starting database import...');
  let totalRecords = 0;

  // Helper function to safely import records
  const safeImport = async (tableName: string, records: any[], importFn: (record: any) => Promise<any>) => {
    if (!records || records.length === 0) {
      console.log(`  ⊘ Skipping ${tableName} (no records)`);
      return 0;
    }

    try {
      console.log(`  Importing ${records.length} ${tableName}...`);
      let imported = 0;

      for (const record of records) {
        try {
          await importFn(record);
          imported++;
        } catch (error) {
          console.warn(`    ⚠ Failed to import ${tableName} record:`, error instanceof Error ? error.message : error);
        }
      }

      console.log(`  ✓ Imported ${imported}/${records.length} ${tableName}`);
      return imported;
    } catch (error) {
      console.error(`  ✗ Failed to import ${tableName}:`, error instanceof Error ? error.message : error);
      return 0;
    }
  };

  // Import in order of dependencies (parent tables first)
  // Note: This uses upsert to handle existing records

  if (data.tables.users) {
    totalRecords += await safeImport('users', data.tables.users, (record) =>
      prisma.user.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.academicYears) {
    totalRecords += await safeImport('academicYears', data.tables.academicYears, (record) =>
      prisma.academicYear.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.terms) {
    totalRecords += await safeImport('terms', data.tables.terms, (record) =>
      prisma.term.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.classes) {
    totalRecords += await safeImport('classes', data.tables.classes, (record) =>
      prisma.class.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.sections) {
    totalRecords += await safeImport('sections', data.tables.sections, (record) =>
      prisma.classSection.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.subjects) {
    totalRecords += await safeImport('subjects', data.tables.subjects, (record) =>
      prisma.subject.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.administrators) {
    totalRecords += await safeImport('administrators', data.tables.administrators, (record) =>
      prisma.administrator.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.teachers) {
    totalRecords += await safeImport('teachers', data.tables.teachers, (record) =>
      prisma.teacher.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.students) {
    totalRecords += await safeImport('students', data.tables.students, (record) =>
      prisma.student.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.parents) {
    totalRecords += await safeImport('parents', data.tables.parents, (record) =>
      prisma.parent.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.studentAttendance) {
    totalRecords += await safeImport('studentAttendance', data.tables.studentAttendance, (record) =>
      prisma.studentAttendance.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.exams) {
    totalRecords += await safeImport('exams', data.tables.exams, (record) =>
      prisma.exam.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.examResults) {
    totalRecords += await safeImport('examResults', data.tables.examResults, (record) =>
      prisma.examResult.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.assignments) {
    totalRecords += await safeImport('assignments', data.tables.assignments, (record) =>
      prisma.assignment.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.feeStructures) {
    totalRecords += await safeImport('feeStructures', data.tables.feeStructures, (record) =>
      prisma.feeStructure.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.feePayments) {
    totalRecords += await safeImport('feePayments', data.tables.feePayments, (record) =>
      prisma.feePayment.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.announcements) {
    totalRecords += await safeImport('announcements', data.tables.announcements, (record) =>
      prisma.announcement.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.messages) {
    totalRecords += await safeImport('messages', data.tables.messages, (record) =>
      prisma.message.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.notifications) {
    totalRecords += await safeImport('notifications', data.tables.notifications, (record) =>
      prisma.notification.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.documents) {
    totalRecords += await safeImport('documents', data.tables.documents, (record) =>
      prisma.document.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.events) {
    totalRecords += await safeImport('events', data.tables.events, (record) =>
      prisma.event.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  if (data.tables.auditLogs) {
    totalRecords += await safeImport('auditLogs', data.tables.auditLogs, (record) =>
      prisma.auditLog.upsert({
        where: { id: record.id },
        update: record,
        create: record
      })
    );
  }

  console.log(`Database import completed. Total records imported: ${totalRecords}`);
  return totalRecords;
}

/**
 * Restore database from backup
 * 
 * Process:
 * 1. Read encrypted backup file
 * 2. Decrypt with AES-256-GCM
 * 3. Decompress with gzip
 * 4. Parse JSON data
 * 5. Restore data to database using pg_restore approach (upsert)
 * 
 * Requirements: 9.4
 */
export async function restoreBackup(backupId: string): Promise<RestoreResult> {
  try {
    console.log(`Starting restore process for backup ${backupId}...`);

    // In FS-only mode, backupId is the filename
    const filename = backupId;

    /*
    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });
    */

    const backupPath = path.join(BACKUP_DIR, filename);

    // Check if file exists
    try {
      await fs.access(backupPath);
    } catch {
      return {
        success: false,
        error: 'Backup file not found on disk'
      };
    }

    // Step 1: Read encrypted file
    console.log('Reading backup file...');
    const fileData = await fs.readFile(backupPath);

    // Extract IV, auth tag, and encrypted data
    const iv = fileData.subarray(0, IV_LENGTH);
    const authTag = fileData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = fileData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    // Step 2: Decrypt
    console.log('Decrypting backup...');
    const compressed = decryptData(encrypted, iv, authTag);

    // Step 3: Decompress
    console.log('Decompressing backup...');
    const decompressed = await gunzip(compressed);

    // Step 4: Parse JSON
    console.log('Parsing backup data...');
    const jsonData = decompressed.toString('utf-8');
    const data = JSON.parse(jsonData);

    // Verify backup version
    if (!data.version || !data.timestamp || !data.tables) {
      return {
        success: false,
        error: 'Invalid backup format'
      };
    }

    console.log(`Backup version: ${data.version}`);
    console.log(`Backup timestamp: ${data.timestamp}`);
    console.log(`Tables in backup: ${Object.keys(data.tables).length}`);

    // Step 5: Restore data to database
    console.log('Restoring data to database...');
    const recordsRestored = await importDatabaseData(data);

    console.log(`✓ Backup restored successfully. ${recordsRestored} records restored.`);

    return {
      success: true,
      recordsRestored
    };
  } catch (error) {
    console.error('Restore failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<BackupMetadata[]> {
  try {
    // Since Backup model is missing, we list files from the backup directory
    // Filename format: backup-{timestamp}-{backupId}.enc

    // Ensure backup directory exists
    try {
      await fs.access(BACKUP_DIR);
    } catch {
      return [];
    }

    const files = await fs.readdir(BACKUP_DIR);
    const backups: BackupMetadata[] = [];

    for (const file of files) {
      if (!file.endsWith('.enc')) continue;

      try {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);

        // Parse filename
        // backup-2023-01-01T12-00-00-000Z-id123.enc
        const parts = file.replace('.enc', '').split('-');
        // This parsing is brittle, better to rely on stats

        backups.push({
          id: file, // Use filename as ID if ID parsing is hard
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          location: 'LOCAL', // Assume local
          encrypted: true,
          compressed: true,
          checksum: '', // Unknown without reading
          status: 'COMPLETED'
        });
      } catch (err) {
        console.warn(`Error processing backup file ${file}:`, err);
      }
    }

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}


/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // backupId is the filename in our FS implementation
    const filename = backupId;

    // Check if file exists/is safe
    if (!filename.includes('backup-') || !filename.endsWith('.enc')) {
      return { success: false, error: 'Invalid backup ID' };
    }

    const backupPath = path.join(BACKUP_DIR, filename);

    // Delete file from disk
    try {
      await fs.unlink(backupPath);
      console.log(`Deleted backup file: ${filename}`);
    } catch (error) {
      console.warn('Could not delete backup file from disk:', error);
      return { success: false, error: 'File not found or could not be deleted' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get backup file for download
 * Returns the backup file buffer and metadata for downloading to local storage
 * 
 * @param backupId - The ID of the backup to download
 * @returns Object containing file buffer, filename, and size for download
 */
export async function getBackupForDownload(backupId: string): Promise<{
  success: boolean;
  data?: {
    buffer: Buffer;
    filename: string;
    size: number;
    createdAt: Date;
  };
  error?: string;
}> {
  try {
    // backupId is the filename
    const filename = backupId;

    // Safety check
    if (!filename || !filename.endsWith('.enc')) {
      return { success: false, error: 'Invalid backup ID' };
    }

    const backupPath = path.join(BACKUP_DIR, filename);

    // Check if file exists
    try {
      await fs.access(backupPath);
    } catch {
      return {
        success: false,
        error: 'Backup file not found on disk'
      };
    }

    // Get stats for size
    const stats = await fs.stat(backupPath);

    // Read the backup file
    const buffer = await fs.readFile(backupPath);

    return {
      success: true,
      data: {
        buffer,
        filename: filename,
        size: stats.size,
        createdAt: stats.birthtime
      }
    };
  } catch (error) {
    console.error('Error preparing backup for download:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Upload backup to cloud storage
 * NOTE: Cloud storage upload has been disabled. 
 * Use getBackupForDownload() to download the backup file to local storage.
 * 
 * @deprecated Use getBackupForDownload for local downloads instead
 */
export async function uploadToCloud(localPath: string): Promise<{ success: boolean; cloudPath?: string; error?: string }> {
  console.log('Cloud upload is not available. Use getBackupForDownload() for local downloads.');
  return {
    success: false,
    error: 'Cloud storage upload has been removed. Please use the download option to save backups locally.'
  };
}

