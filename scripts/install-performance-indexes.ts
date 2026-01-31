#!/usr/bin/env tsx

/**
 * Database Index Installation Script
 * Installs performance indexes to optimize query performance
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function installPerformanceIndexes() {
  console.log('🔧 Installing performance indexes...');
  
  const indexes = [
    // Audit Logs Performance Indexes
    {
      name: 'idx_audit_logs_created_at_action',
      sql: `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_action ON "audit_logs" ("createdAt", "action") WHERE "createdAt" IS NOT NULL;`
    },
    {
      name: 'idx_audit_logs_school_date',
      sql: `CREATE INDEX IF NOT EXISTS idx_audit_logs_school_date ON "audit_logs" ("schoolId", "createdAt") WHERE "schoolId" IS NOT NULL AND "createdAt" IS NOT NULL;`
    },
    {
      name: 'idx_audit_logs_user_date',
      sql: `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON "audit_logs" ("userId", "createdAt") WHERE "userId" IS NOT NULL;`
    },
    
    // User Statistics Indexes
    {
      name: 'idx_users_role_created',
      sql: `CREATE INDEX IF NOT EXISTS idx_users_role_created ON "User" ("role", "createdAt");`
    },
    {
      name: 'idx_users_created_at',
      sql: `CREATE INDEX IF NOT EXISTS idx_users_created_at ON "User" ("createdAt") WHERE "createdAt" IS NOT NULL;`
    },
    
    // School Statistics Indexes
    {
      name: 'idx_schools_status_created',
      sql: `CREATE INDEX IF NOT EXISTS idx_schools_status_created ON "schools" ("status", "createdAt");`
    },
    {
      name: 'idx_schools_plan_status',
      sql: `CREATE INDEX IF NOT EXISTS idx_schools_plan_status ON "schools" ("plan", "status");`
    },
    
    // Subscription Analytics Indexes
    {
      name: 'idx_subscriptions_active_created',
      sql: `CREATE INDEX IF NOT EXISTS idx_subscriptions_active_created ON "subscriptions" ("isActive", "createdAt");`
    },
    {
      name: 'idx_subscriptions_school_active',
      sql: `CREATE INDEX IF NOT EXISTS idx_subscriptions_school_active ON "subscriptions" ("schoolId", "isActive") WHERE "schoolId" IS NOT NULL;`
    },
    
    // Authentication Session Indexes
    {
      name: 'idx_auth_sessions_created_at',
      sql: `CREATE INDEX IF NOT EXISTS idx_auth_sessions_created_at ON "auth_sessions" ("createdAt") WHERE "createdAt" IS NOT NULL;`
    },
    {
      name: 'idx_auth_sessions_user_active',
      sql: `CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active ON "auth_sessions" ("userId", "expiresAt") WHERE "userId" IS NOT NULL;`
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const index of indexes) {
    try {
      console.log(`Creating index: ${index.name}...`);
      await db.$executeRawUnsafe(index.sql);
      console.log(`✅ Created index: ${index.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to create index ${index.name}:`, error);
      errorCount++;
    }
  }

  // Update table statistics
  console.log('\n📊 Updating table statistics...');
  const tables = ['audit_logs', 'User', 'schools', 'subscriptions', 'auth_sessions', 'analytics_events'];
  
  for (const table of tables) {
    try {
      await db.$executeRawUnsafe(`ANALYZE "${table}";`);
      console.log(`✅ Analyzed table: ${table}`);
    } catch (error) {
      console.error(`❌ Failed to analyze table ${table}:`, error);
    }
  }

  console.log('\n🎯 INDEX INSTALLATION SUMMARY:');
  console.log(`✅ Successfully created: ${successCount} indexes`);
  console.log(`❌ Failed to create: ${errorCount} indexes`);
  console.log(`📊 Analyzed ${tables.length} tables`);

  if (successCount > 0) {
    console.log('\n🚀 Performance indexes installed successfully!');
    console.log('Your database queries should now be significantly faster.');
  }

  await db.$disconnect();
}

if (require.main === module) {
  installPerformanceIndexes()
    .then(() => {
      console.log('✅ Index installation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Index installation failed:', error);
      process.exit(1);
    });
}

export { installPerformanceIndexes };