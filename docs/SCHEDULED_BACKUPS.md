# Scheduled Backups Documentation

## Overview

The ERP system includes an automated backup system that creates daily database backups at 2:00 AM. All backups are compressed with gzip and encrypted using AES-256-GCM encryption.

## Features

- **Automatic Daily Backups**: Runs every day at 2:00 AM
- **Compression**: Uses gzip to reduce backup file size
- **Encryption**: AES-256-GCM encryption for security
- **Audit Logging**: All backup operations are logged
- **Failure Notifications**: Administrators are notified when backups fail
- **Manual Triggers**: Backups can be triggered manually at any time

## Configuration

### Environment Variables

```bash
# Enable or disable scheduled backups (default: true)
ENABLE_SCHEDULED_BACKUPS=true

# Backup directory (default: ./backups)
BACKUP_DIR=/path/to/backups

# Encryption key (REQUIRED in production - 64 hex characters)
BACKUP_ENCRYPTION_KEY=your-64-character-hex-key-here

# Timezone for scheduled backups (default: UTC)
TZ=America/New_York
```

### Generating an Encryption Key

For production, you MUST set a secure encryption key:

```bash
# Generate a secure 256-bit key (64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add this to your `.env` file:

```bash
BACKUP_ENCRYPTION_KEY=<generated-key-here>
```

## Usage

### Automatic Startup

The scheduled backup system starts automatically when the application starts. This is configured in `src/instrumentation.ts`.

### Admin Interface

Administrators can manage backups through the admin panel:

1. Navigate to **Settings > Backups**
2. View scheduled backup status
3. Start/Stop scheduled backups
4. Trigger manual backups
5. View backup history
6. Restore from backups
7. Delete old backups

### API Endpoints

#### Get Scheduled Backup Status

```bash
GET /api/admin/scheduled-backups
```

Response:
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "nextRun": "2025-01-01T02:00:00.000Z",
    "schedule": "Daily at 2:00 AM"
  }
}
```

#### Start Scheduled Backups

```bash
POST /api/admin/scheduled-backups
Content-Type: application/json

{
  "action": "start"
}
```

#### Trigger Manual Backup

```bash
POST /api/admin/scheduled-backups
Content-Type: application/json

{
  "action": "trigger"
}
```

#### Stop Scheduled Backups

```bash
DELETE /api/admin/scheduled-backups
```

### Server Actions

You can also use server actions in your React components:

```typescript
import {
  getScheduledBackupStatusAction,
  startScheduledBackupsAction,
  stopScheduledBackupsAction,
  triggerManualBackupAction
} from '@/lib/actions/scheduledBackupActions';

// Get status
const status = await getScheduledBackupStatusAction();

// Start scheduled backups
await startScheduledBackupsAction();

// Stop scheduled backups
await stopScheduledBackupsAction();

// Trigger manual backup
await triggerManualBackupAction();
```

## Backup File Format

Backup files are stored with the following naming convention:

```
backup-YYYY-MM-DDTHH-MM-SS-sss-<backup-id>.enc
```

Example: `backup-2025-01-01T02-00-00-000Z-a1b2c3d4e5f6.enc`

### File Structure

Each backup file contains:
1. **IV (16 bytes)**: Initialization vector for encryption
2. **Auth Tag (16 bytes)**: Authentication tag for GCM mode
3. **Encrypted Data**: Compressed and encrypted database dump

## Backup Process

1. **Export**: All database tables are exported to JSON
2. **Compress**: Data is compressed using gzip
3. **Encrypt**: Compressed data is encrypted with AES-256-GCM
4. **Store**: Backup file is saved locally
5. **Log**: Operation is logged to audit log
6. **Record**: Backup metadata is stored in database

## Restore Process

1. **Read**: Encrypted backup file is read from disk
2. **Decrypt**: File is decrypted using the encryption key
3. **Decompress**: Decrypted data is decompressed
4. **Parse**: JSON data is parsed
5. **Restore**: Data is restored to database (with confirmation)

## Monitoring

### Audit Logs

All backup operations are logged to the audit log:

- Scheduled backup executions (success/failure)
- Manual backup triggers
- Backup restorations
- Backup deletions

### Failure Notifications

When a scheduled backup fails:

1. Error is logged to console
2. Failure is recorded in audit log
3. Email notification is sent to administrators (if configured)

## Best Practices

### Security

1. **Always set a secure encryption key in production**
2. Store encryption key securely (use environment variables)
3. Never commit encryption keys to version control
4. Restrict access to backup files
5. Use IP whitelisting for backup management endpoints

### Storage

1. Store backups on a separate disk/volume
2. Implement backup rotation (delete old backups)
3. Consider cloud storage for off-site backups
4. Monitor disk space usage
5. Test restore procedures regularly

### Scheduling

1. Schedule backups during low-traffic periods (default: 2 AM)
2. Adjust timezone based on your location
3. Monitor backup execution times
4. Set up alerts for backup failures

## Troubleshooting

### Backup Fails to Start

Check:
- `ENABLE_SCHEDULED_BACKUPS` is not set to `false`
- Application has write permissions to backup directory
- Encryption key is properly configured

### Backup Files Too Large

Solutions:
- Implement backup rotation
- Archive old backups to cloud storage
- Consider incremental backups (future enhancement)

### Restore Fails

Check:
- Backup file exists and is not corrupted
- Encryption key matches the one used for backup
- Database has sufficient space
- User has proper permissions

## Future Enhancements

- Cloud storage integration (S3, Azure Blob, etc.)
- Incremental backups
- Backup compression level configuration
- Backup retention policies
- Email notifications for backup status
- Backup verification and integrity checks

## Requirements

This implementation satisfies:
- **Requirement 9.1**: Scheduled daily backups at 2 AM
- **Requirement 9.2**: Compression and encryption
- **Requirement 9.3**: Local storage (cloud storage ready)
- **Requirement 9.4**: Restore functionality
- **Requirement 9.5**: Failure notifications (logging implemented)

## Support

For issues or questions about the backup system, please contact the system administrator or refer to the main documentation.
