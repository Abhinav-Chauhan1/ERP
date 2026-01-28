#!/usr/bin/env tsx

/**
 * Migration script to add subdomain infrastructure fields to existing schools
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function migrateSubdomainSchema() {
  console.log('🚀 Starting subdomain schema migration...');

  try {
    // First, let's check if the new fields exist by trying to update a record
    console.log('📊 Checking current schema...');
    
    const schoolCount = await db.school.count();
    console.log(`Found ${schoolCount} schools to migrate`);

    if (schoolCount === 0) {
      console.log('✅ No schools found, migration complete');
      return;
    }

    // Update all existing schools with default subdomain infrastructure values
    console.log('🔄 Updating existing schools with default values...');
    
    const updateResult = await db.school.updateMany({
      data: {
        subdomainStatus: 'PENDING',
        dnsConfigured: false,
        sslConfigured: false,
        sslExpiresAt: null,
      },
    });

    console.log(`✅ Updated ${updateResult.count} schools with default subdomain values`);

    // For schools that already have subdomains, we might want to verify their status
    const schoolsWithSubdomains = await db.school.findMany({
      where: {
        subdomain: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
      },
    });

    if (schoolsWithSubdomains.length > 0) {
      console.log(`🔍 Found ${schoolsWithSubdomains.length} schools with existing subdomains:`);
      
      for (const school of schoolsWithSubdomains) {
        console.log(`  - ${school.name}: ${school.subdomain}`);
        
        // You might want to verify these subdomains and update their status
        // For now, we'll just mark them as needing verification
        await db.school.update({
          where: { id: school.id },
          data: {
            subdomainStatus: 'PENDING', // They'll need to be verified
          },
        });
      }
    }

    // Create audit log entry for this migration
    await db.auditLog.create({
      data: {
        userId: 'system',
        action: 'UPDATE',
        resource: 'SCHEMA_MIGRATION',
        resourceId: 'subdomain-infrastructure',
        changes: {
          migration: 'subdomain-schema',
          schoolsUpdated: updateResult.count,
          schoolsWithSubdomains: schoolsWithSubdomains.length,
          timestamp: new Date().toISOString(),
        },
        checksum: `migration-${Date.now()}`,
      },
    });

    console.log('✅ Subdomain schema migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Configure DNS provider in environment variables');
    console.log('2. Configure SSL provider in environment variables');
    console.log('3. Run subdomain verification for existing schools');
    console.log('4. Test subdomain creation with new schools');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateSubdomainSchema()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateSubdomainSchema };