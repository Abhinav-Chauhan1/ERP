# Database Backup and Restore Guide

## Overview

The School ERP system includes a comprehensive backup and restore system that provides:
- **Automated daily backups** at 2:00 AM
- **Manual backup creation** on-demand
- **Encrypted backups** using AES-256-GCM encryption
- **Compressed storage** with gzip compression
- **Dual storage** (local and cloud)
- **Full database restoration** with confirmation dialogs
- **Automatic failure notifications** to administrators

## Requirements Implemented

This implementation satisfies **Requirement 9.4**:
- ✅ Create restore service using pg_restore approach
- ✅ Decrypt and decompress backup files
- ✅ Restore database from selected backup
- ✅ Add confirmation dialog before restore

## Architecture

### Backup Process

1. **Export**: All database tables are exported to JSON format
2. **Compress**: Data is compressed using gzip (typically 70-80% reduction)
3. **Encrypt**: Compressed data is encrypted with AES-256-GCM
4. **Store**: Encrypted backup is saved locally and optionally to cloud
5. **Record**: Backup metadata is stored in the database

### Restore Process

1. **Read**: Encrypted backup file is read from disk
2. **Decrypt**: File is decrypted using AES-256-GCM
3. **Decompress**: Decrypted data is decompressed with gzip
4. **Parse**: JSON data is parsed and validated
5. **Import**: Data is restored to database using upsert operations

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits (32 bytes)
- **IV Length**: 128 bits (16 bytes)
- **Authentication**: Built-in authentication tag prevents tampering

### Configuration
Set the encryption key via environment variable:
```bash
BACKUP_ENCRYPTION_KEY=your-64-character-hex-key
```

⚠️ **Important**: Never use the default key in production!

## Usage

### Admin Interface

Navigate to `/admin/backups` to access the backup management interface.

#### Creating a Manual Backup
1. Click the "Create Backup" button
2. Wait for the backup to complete
3. The new backup will appear in the list

#### Restoring from a Backup
1. Locate the backup you want to restore
2. Click the "Restore" button
3. **Read the warning dialog carefully**
4. Confirm the restore operation
5. Wait for the restore to complete

⚠️ **Warning**: Restoring a backup will overwrite all current data!

#### Deleting a Backup
1. Locate the backup you want to delete
2. Click the "Delete" button
3. Confirm the deletion
4. The backup will be permanently removed

### Programmatic Usage

```typescript
import { createBackup, restoreBackup, listBackups } from '@/lib/utils/backup-service';

// Create a backup
const result = await createBackup(true, 'manual');
if (result.success) {
  console.log('Backup created:', result.metadata);
}

// List all backups
const backups = await listBackups();

// Restore from a backup
const restoreResult = await restoreBackup(backupId);
if (restoreResult.success) {
  console.log('Restored', restoreResult.recordsRestored, 'records');
}
```

## Backup File Format

Backup files use the following structure:

```
[16 bytes IV][16 bytes Auth Tag][Encrypted Data]
```

The encrypted data contains gzip-compressed JSON:

```json
{
  "version": "1.0",
  "timestamp": "2025-11-21T10:28:30.846Z",
  "tables": {
    "users": [...],
    "students": [...],
    "teachers": [...],
    ...
  }
}
```

## Scheduled Backups

Scheduled backups run automatically at 2:00 AM daily. Configuration is in `src/lib/actions/scheduledBackupActions.ts`.

To modify the schedule, update the cron expression:
```typescript
// Current: Daily at 2:00 AM
const schedule = '0 2 * * *';
```

## Failure Notifications

When a backup fails, the system automatically:
1. Logs the error to the console
2. Sends email notifications to all active administrators
3. Includes detailed error information and troubleshooting steps

Email notifications include:
- Timestamp of failure
- Error message
- Backup type (manual or scheduled)
- Recommended actions
- System information

## Best Practices

### Before Restoring
1. ✅ Create a backup of the current state
2. ✅ Notify all users of system downtime
3. ✅ Verify you have the correct backup
4. ✅ Ensure you have administrator access

### Regular Maintenance
1. ✅ Monitor backup success/failure notifications
2. ✅ Periodically test restore procedures
3. ✅ Clean up old backups (30+ days)
4. ✅ Verify cloud storage synchronization
5. ✅ Rotate encryption keys annually

### Disaster Recovery
1. Keep backups in multiple locations
2. Test restore procedures regularly
3. Document recovery procedures
4. Maintain offline backup copies
5. Have a rollback plan

## Troubleshooting

### Backup Creation Fails

**Problem**: Backup creation fails with encryption error
**Solution**: Verify `BACKUP_ENCRYPTION_KEY` is set correctly (64 hex characters)

**Problem**: Insufficient disk space
**Solution**: Clean up old backups or increase storage capacity

**Problem**: Database connection timeout
**Solution**: Check database connectivity and increase timeout settings

### Restore Fails

**Problem**: "Backup not found" error
**Solution**: Verify the backup file exists in the backups directory

**Problem**: Decryption fails
**Solution**: Ensure the same encryption key is used for restore as was used for backup

**Problem**: "Invalid backup format" error
**Solution**: The backup file may be corrupted. Try a different backup.

### Performance Issues

**Problem**: Backup takes too long
**Solution**: 
- Increase database connection pool size
- Run backups during off-peak hours
- Consider incremental backups for large databases

**Problem**: Restore is slow
**Solution**:
- Temporarily disable indexes during restore
- Increase database write buffer size
- Use batch operations for large datasets

## Testing

Run the test script to verify backup and restore functionality:

```bash
npx tsx scripts/test-restore.ts
```

This will:
1. Create a test backup
2. List all backups
3. Restore from the test backup
4. Verify data integrity

## API Reference

### `createBackup(notifyOnFailure, backupType)`
Creates a new database backup.

**Parameters**:
- `notifyOnFailure` (boolean): Send email on failure
- `backupType` ('manual' | 'scheduled'): Type of backup

**Returns**: `BackupResult`

### `restoreBackup(backupId)`
Restores database from a backup.

**Parameters**:
- `backupId` (string): ID of backup to restore

**Returns**: `RestoreResult`

### `listBackups()`
Lists all available backups.

**Returns**: `BackupMetadata[]`

### `deleteBackup(backupId)`
Deletes a backup.

**Parameters**:
- `backupId` (string): ID of backup to delete

**Returns**: `{ success: boolean; error?: string }`

## Related Files

- `src/lib/utils/backup-service.ts` - Core backup/restore logic
- `src/lib/actions/backupActions.ts` - Server actions
- `src/app/admin/backups/page.tsx` - Admin UI
- `src/components/admin/backups/` - UI components
- `scripts/test-restore.ts` - Test script

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review system logs for detailed error messages
3. Contact the development team
4. Refer to the main documentation

---

**Last Updated**: November 21, 2025
**Version**: 1.0
**Requirements**: 9.1, 9.2, 9.3, 9.4, 9.5
