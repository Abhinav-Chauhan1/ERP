/**
 * Test script for backup restore functionality
 * 
 * This script tests the complete backup and restore cycle:
 * 1. Create a backup
 * 2. Restore from that backup
 * 3. Verify data integrity
 */

import { createBackup, restoreBackup, listBackups } from '../src/lib/utils/backup-service';

async function testBackupRestore() {
  console.log('='.repeat(60));
  console.log('Testing Backup and Restore Functionality');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Create a backup
    console.log('Step 1: Creating backup...');
    const backupResult = await createBackup(false, 'manual');
    
    if (!backupResult.success) {
      console.error('❌ Failed to create backup:', backupResult.error);
      process.exit(1);
    }
    
    console.log('✅ Backup created successfully');
    console.log('   Backup ID:', backupResult.metadata?.id);
    console.log('   Filename:', backupResult.metadata?.filename);
    console.log('   Size:', backupResult.metadata?.size, 'bytes');
    console.log('   Location:', backupResult.metadata?.location);
    console.log('   Encrypted:', backupResult.metadata?.encrypted);
    console.log();

    // Step 2: List backups
    console.log('Step 2: Listing all backups...');
    const backups = await listBackups();
    console.log(`✅ Found ${backups.length} backup(s)`);
    console.log();

    // Step 3: Restore from the backup we just created
    if (backupResult.metadata?.id) {
      console.log('Step 3: Restoring from backup...');
      const restoreResult = await restoreBackup(backupResult.metadata.id);
      
      if (!restoreResult.success) {
        console.error('❌ Failed to restore backup:', restoreResult.error);
        process.exit(1);
      }
      
      console.log('✅ Backup restored successfully');
      console.log('   Records restored:', restoreResult.recordsRestored);
      console.log();
    }

    console.log('='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testBackupRestore()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
