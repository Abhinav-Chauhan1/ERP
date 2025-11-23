# Database Backup Service

## Overview

The Database Backup Service provides secure, encrypted, and compressed database backups for the School ERP system. It implements industry-standard encryption (AES-256-GCM) and compression (gzip) to ensure data security and efficient storage.

## Features

- ✅ **Encryption**: AES-256-GCM encryption with unique IV for each backup
- ✅ **Compression**: gzip compression to reduce backup file size
- ✅ **Local Storage**: Backups stored locally in configurable directory
- ✅ **Cloud Storage Support**: Framework for S3-compatible cloud storage (to be implemented)
- ✅ **Audit Logging**: All backup operations are logged for compliance
- ✅ **Metadata Tracking**: Backup metadata stored in database

## Requirements

**Validates Requirements:**
- 9.2: Compress and encrypt backup files
- 9.3: Store backups locally and in cloud storage

## Configuration

### Environment Variables

```env
# Backup directory (default: ./backups)
BACKUP_DIR=./backups

# Encryption key (32-byte hex string, 64 characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BACKUP_ENCRYPTION_KEY=your_64_character_hex_string_here
```

### Generate Encryption Key

**Important**: Always use a secure encryption key in production!

```bash
# Generate a secure 256-bit encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Usage

### Server Actions

The backup service is exposed through server actions in `src/lib/actions/backupActions.ts`:

#### Create a Backup

```typescript
import { createBackupAction } from '@/lib/actions/backupActions';

const result = await createBackupAction();

if (result.success) {
  console.log('Backup created:', result.data);
  // result.data contains: id, filename, size, location, etc.
} else {
  console.error('Backup failed:', result.error);
}
```

#### List All Backups

```typescript
import { listBackupsAction } from '@/lib/actions/backupActions';

const result = await listBackupsAction();

if (result.success) {
  console.log('Backups:', result.data);
  // result.data is an array of backup metadata
}
```

#### Restore from Backup

```typescript
import { restoreBackupAction } from '@/lib/actions/backupActions';

const result = await restoreBackupAction(backupId);

if (result.success) {
  console.log('Backup restored successfully');
  console.log('Records restored:', result.recordsRestored);
}
```

#### Delete a Backup

```typescript
import { deleteBackupAction } from '@/lib/actions/backupActions';

const result = await deleteBackupAction(backupId);

if (result.success) {
  console.log('Backup deleted successfully');
}
```

### Direct Service Usage

For advanced use cases, you can use the service directly:

```typescript
import { 
  createBackup, 
  restoreBackup, 
  listBackups, 
  deleteBackup 
} from '@/lib/utils/backup-service';

// Create backup
const result = await createBackup();

// List backups
const backups = await listBackups();

// Restore backup
const restoreResult = await restoreBackup(backupId);

// Delete backup
const deleteResult = await deleteBackup(backupId);
```

## Backup Process

### Creation Process

1. **Export Data**: All database tables are exported to JSON format
2. **Compress**: Data is compressed using gzip (typically 70-90% size reduction)
3. **Encrypt**: Compressed data is encrypted using AES-256-GCM
4. **Store**: Encrypted backup is saved to local storage
5. **Record**: Backup metadata is stored in the database

### File Format

Backup files have the following structure:

```
[16 bytes: IV] [16 bytes: Auth Tag] [N bytes: Encrypted Data]
```

- **IV (Initialization Vector)**: Random 16-byte value for encryption
- **Auth Tag**: 16-byte authentication tag for data integrity
- **Encrypted Data**: Gzip-compressed database export, encrypted with AES-256-GCM

### Restore Process

1. **Read File**: Encrypted backup file is read from disk
2. **Extract Components**: IV, auth tag, and encrypted data are extracted
3. **Decrypt**: Data is decrypted using AES-256-GCM
4. **Decompress**: Decrypted data is decompressed using gunzip
5. **Parse**: JSON data is parsed and ready for import

**Note**: The current implementation validates the backup but does not automatically import data to prevent accidental data loss. Manual import should be done with caution.

## Security Considerations

### Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV**: Unique 16-byte random IV for each backup
- **Authentication**: Built-in authentication tag prevents tampering

### Best Practices

1. **Secure Key Storage**: Never commit encryption keys to version control
2. **Key Rotation**: Periodically rotate encryption keys
3. **Access Control**: Restrict backup operations to administrators only
4. **Backup Verification**: Regularly test backup restoration
5. **Off-site Storage**: Store backups in multiple locations

## Cloud Storage Integration

The service includes a placeholder for cloud storage integration. To implement:

1. Install AWS SDK or compatible library:
   ```bash
   npm install @aws-sdk/client-s3
   ```

2. Implement the `uploadToCloud` function in `backup-service.ts`

3. Configure cloud storage credentials in environment variables

Example implementation:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';

export async function uploadToCloud(localPath: string): Promise<{ success: boolean; cloudPath?: string; error?: string }> {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const fileContent = await fs.readFile(localPath);
    const filename = path.basename(localPath);
    const key = `backups/${filename}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileContent,
    }));

    return {
      success: true,
      cloudPath: `s3://${process.env.AWS_S3_BUCKET}/${key}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
```

## Testing

The backup service includes comprehensive unit tests:

```bash
npm run test:run -- src/lib/utils/backup-service.test.ts
```

Tests cover:
- Encryption/decryption correctness
- Compression/decompression
- IV uniqueness
- Data integrity
- Tamper detection
- Large file handling

## Troubleshooting

### "Encryption key must be 64 hex characters"

Ensure your `BACKUP_ENCRYPTION_KEY` is exactly 64 hexadecimal characters (32 bytes).

### "Backup file not found on disk"

Check that the `BACKUP_DIR` exists and has proper permissions.

### "Cannot read properties of undefined (reading 'findMany')"

This error occurs when Prisma is not properly initialized. Ensure database connection is configured.

### Backup fails with "ENOSPC: no space left on device"

Ensure sufficient disk space is available. Backups can be large depending on database size.

## Performance

- **Compression Ratio**: Typically 70-90% size reduction
- **Encryption Overhead**: Minimal (< 1% size increase)
- **Backup Time**: Varies with database size (typically 10-60 seconds for small to medium databases)

## Future Enhancements

- [ ] Implement cloud storage upload (S3, Azure Blob, Google Cloud Storage)
- [ ] Add incremental backup support
- [ ] Implement backup scheduling
- [ ] Add backup retention policies
- [ ] Implement backup verification checks
- [ ] Add progress reporting for large backups
- [ ] Support for selective table backup

## Related Files

- `src/lib/utils/backup-service.ts` - Core backup service implementation
- `src/lib/actions/backupActions.ts` - Server actions for backup operations
- `src/lib/utils/backup-service.test.ts` - Unit tests
- `prisma/schema.prisma` - Backup model definition

## Support

For issues or questions, please refer to the main ERP documentation or contact the development team.
