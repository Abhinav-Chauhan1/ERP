/**
 * Test script for database backup functionality
 * 
 * Usage:
 *   npx tsx scripts/test-backup.ts create
 *   npx tsx scripts/test-backup.ts list
 *   npx tsx scripts/test-backup.ts restore <backup-id>
 *   npx tsx scripts/test-backup.ts delete <backup-id>
 */

import { 
  createBackup, 
  listBackups, 
  restoreBackup, 
  deleteBackup 
} from '../src/lib/utils/backup-service';

async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  console.log('=== Database Backup Test Script ===\n');

  switch (command) {
    case 'create':
      console.log('Creating backup...\n');
      const createResult = await createBackup();
      if (createResult.success) {
        console.log('✅ Backup created successfully!');
        console.log('\nBackup Details:');
        console.log('  ID:', createResult.metadata?.id);
        console.log('  Filename:', createResult.metadata?.filename);
        console.log('  Size:', createResult.metadata?.size, 'bytes');
        console.log('  Location:', createResult.metadata?.location);
        console.log('  Encrypted:', createResult.metadata?.encrypted);
        console.log('  Compressed:', createResult.metadata?.compressed);
        console.log('  Local Path:', createResult.localPath);
      } else {
        console.error('❌ Backup failed:', createResult.error);
      }
      break;

    case 'list':
      console.log('Listing all backups...\n');
      const backups = await listBackups();
      if (backups.length === 0) {
        console.log('No backups found.');
      } else {
        console.log(`Found ${backups.length} backup(s):\n`);
        backups.forEach((backup, index) => {
          console.log(`${index + 1}. Backup ID: ${backup.id}`);
          console.log(`   Filename: ${backup.filename}`);
          console.log(`   Size: ${backup.size} bytes`);
          console.log(`   Created: ${backup.createdAt}`);
          console.log(`   Location: ${backup.location}`);
          console.log(`   Encrypted: ${backup.encrypted}`);
          console.log('');
        });
      }
      break;

    case 'restore':
      if (!arg) {
        console.error('❌ Please provide a backup ID');
        console.log('Usage: npx tsx scripts/test-backup.ts restore <backup-id>');
        process.exit(1);
      }
      console.log(`Restoring backup ${arg}...\n`);
      const restoreResult = await restoreBackup(arg);
      if (restoreResult.success) {
        console.log('✅ Backup restored successfully!');
        console.log('  Records restored:', restoreResult.recordsRestored);
      } else {
        console.error('❌ Restore failed:', restoreResult.error);
      }
      break;

    case 'delete':
      if (!arg) {
        console.error('❌ Please provide a backup ID');
        console.log('Usage: npx tsx scripts/test-backup.ts delete <backup-id>');
        process.exit(1);
      }
      console.log(`Deleting backup ${arg}...\n`);
      const deleteResult = await deleteBackup(arg);
      if (deleteResult.success) {
        console.log('✅ Backup deleted successfully!');
      } else {
        console.error('❌ Delete failed:', deleteResult.error);
      }
      break;

    default:
      console.log('Usage:');
      console.log('  npx tsx scripts/test-backup.ts create          - Create a new backup');
      console.log('  npx tsx scripts/test-backup.ts list            - List all backups');
      console.log('  npx tsx scripts/test-backup.ts restore <id>    - Restore a backup');
      console.log('  npx tsx scripts/test-backup.ts delete <id>     - Delete a backup');
      console.log('');
      console.log('Examples:');
      console.log('  npx tsx scripts/test-backup.ts create');
      console.log('  npx tsx scripts/test-backup.ts list');
      console.log('  npx tsx scripts/test-backup.ts restore abc123');
      console.log('  npx tsx scripts/test-backup.ts delete abc123');
      break;
  }
}

main().catch(console.error);
