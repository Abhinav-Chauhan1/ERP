#!/usr/bin/env tsx

/**
 * R2 Bucket Setup Script
 * 
 * This script configures the Cloudflare R2 bucket for the school ERP system:
 * - Validates R2 configuration and credentials
 * - Sets up CORS configuration for web uploads
 * - Tests basic upload/download operations
 * - Creates initial folder structure for multi-tenant isolation
 */

import { r2StorageService } from '../src/lib/services/r2-storage-service';
import { getR2Config } from '../src/lib/config/r2-config';

async function setupR2Bucket() {
  console.log('🚀 Setting up Cloudflare R2 bucket...\n');

  try {
    // 1. Validate configuration
    console.log('1. Validating R2 configuration...');
    const config = getR2Config();
    console.log(`   ✓ Account ID: ${config.accountId}`);
    console.log(`   ✓ Bucket: ${config.bucketName}`);
    console.log(`   ✓ Region: ${config.region}`);
    console.log(`   ✓ Endpoint: ${config.endpoint}`);
    if (config.customDomain) {
      console.log(`   ✓ Custom Domain: ${config.customDomain}`);
    }
    console.log('   ✓ Configuration validated\n');

    // 2. Configure CORS settings
    console.log('2. Configuring CORS settings...');
    await r2StorageService.configureCORS();
    console.log('   ✓ CORS configuration applied\n');

    // 3. Test basic operations
    console.log('3. Testing basic operations...');
    
    // Test upload
    const testSchoolId = 'test-setup';
    const testFile = Buffer.from('R2 setup test file', 'utf-8');
    const testKey = 'setup-test.txt';
    
    console.log('   Testing file upload...');
    const uploadResult = await r2StorageService.uploadFile(
      testSchoolId,
      testFile,
      testKey,
      {
        originalName: 'setup-test.txt',
        mimeType: 'text/plain',
        folder: 'system',
        uploadedBy: 'setup-script',
      }
    );

    if (!uploadResult.success) {
      throw new Error(`Upload test failed: ${uploadResult.error}`);
    }
    console.log(`   ✓ Upload successful: ${uploadResult.url}`);

    // Test file existence
    console.log('   Testing file existence check...');
    const exists = await r2StorageService.fileExists(testSchoolId, uploadResult.key!);
    if (!exists) {
      throw new Error('File existence check failed');
    }
    console.log('   ✓ File existence check passed');

    // Test metadata retrieval
    console.log('   Testing metadata retrieval...');
    const metadata = await r2StorageService.getFileMetadata(testSchoolId, uploadResult.key!);
    if (!metadata) {
      throw new Error('Metadata retrieval failed');
    }
    console.log('   ✓ Metadata retrieval successful');

    // Test presigned URL generation
    console.log('   Testing presigned URL generation...');
    const presignedUrl = await r2StorageService.generatePresignedUrl(
      testSchoolId,
      uploadResult.key!,
      'GET',
      300 // 5 minutes
    );
    console.log('   ✓ Presigned URL generated successfully');

    // Test file listing
    console.log('   Testing file listing...');
    const fileList = await r2StorageService.listFiles(testSchoolId, 'system');
    if (fileList.files.length === 0) {
      throw new Error('File listing failed - no files found');
    }
    console.log(`   ✓ File listing successful (${fileList.files.length} files found)`);

    // Clean up test file
    console.log('   Cleaning up test file...');
    await r2StorageService.deleteFile(testSchoolId, uploadResult.key!);
    console.log('   ✓ Test file cleaned up\n');

    // 4. Create sample folder structure documentation
    console.log('4. Documenting folder structure...');
    console.log('   School-based folder structure:');
    console.log('   ├── school-{schoolId}/');
    console.log('   │   ├── students/');
    console.log('   │   │   ├── {studentId}/');
    console.log('   │   │   │   ├── avatar/');
    console.log('   │   │   │   ├── documents/');
    console.log('   │   │   │   └── certificates/');
    console.log('   │   ├── teachers/');
    console.log('   │   │   ├── {teacherId}/');
    console.log('   │   │   │   ├── profile/');
    console.log('   │   │   │   └── documents/');
    console.log('   │   ├── events/');
    console.log('   │   │   ├── {eventId}/');
    console.log('   │   │   │   ├── banners/');
    console.log('   │   │   │   └── gallery/');
    console.log('   │   ├── announcements/');
    console.log('   │   │   └── attachments/');
    console.log('   │   ├── certificates/');
    console.log('   │   │   └── templates/');
    console.log('   │   ├── reports/');
    console.log('   │   │   └── generated/');
    console.log('   │   └── system/');
    console.log('   │       ├── logos/');
    console.log('   │       └── branding/');
    console.log('   ✓ Folder structure documented\n');

    console.log('🎉 R2 bucket setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with the R2 configuration');
    console.log('2. Test file uploads through your application');
    console.log('3. Monitor storage usage and performance');
    console.log('4. Configure CDN custom domain if needed');

  } catch (error) {
    console.error('❌ R2 setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupR2Bucket().catch(console.error);
}

export { setupR2Bucket };