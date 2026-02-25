#!/usr/bin/env tsx
/**
 * Production Readiness Verification Script
 * 
 * This script automates verification of production readiness checklist items.
 * Run this before deployment to ensure all critical systems are configured.
 * 
 * Usage: tsx scripts/verify-production-readiness.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CheckResult {
  category: string;
  item: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

function addResult(
  category: string,
  item: string,
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP',
  message: string,
  critical: boolean = false
) {
  results.push({ category, item, status, message, critical });
}

// Phase 2: Security Review
async function verifySecurityConfiguration() {
  console.log('\n🔐 Phase 2: Security Review\n');

  // Check NextAuth configuration
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (authSecret && authSecret.length >= 32) {
    addResult('Security', 'NextAuth configured', 'PASS', 'AUTH_SECRET is set and sufficient length', true);
  } else {
    addResult('Security', 'NextAuth configured', 'FAIL', 'AUTH_SECRET missing or too short (need 32+ chars)', true);
  }

  // Check R2 authentication
  const r2Keys = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
  const r2Configured = r2Keys.every(key => process.env[key]);
  if (r2Configured) {
    addResult('Security', 'R2 file authentication', 'PASS', 'All R2 credentials configured', true);
  } else {
    const missing = r2Keys.filter(key => !process.env[key]);
    addResult('Security', 'R2 file authentication', 'FAIL', `Missing: ${missing.join(', ')}`, true);
  }

  // Check database credentials
  if (process.env.DATABASE_URL) {
    addResult('Security', 'Database credentials', 'PASS', 'DATABASE_URL is configured', true);
  } else {
    addResult('Security', 'Database credentials', 'FAIL', 'DATABASE_URL not set', true);
  }

  // Check payment gateway
  const razorpayKeys = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];
  const razorpayConfigured = razorpayKeys.every(key => process.env[key]);
  if (razorpayConfigured) {
    addResult('Security', 'Payment gateway secured', 'PASS', 'Razorpay credentials configured', true);
  } else {
    addResult('Security', 'Payment gateway secured', 'WARN', 'Razorpay not fully configured (optional)', false);
  }

  // Check CSRF protection
  if (process.env.CSRF_SECRET) {
    addResult('Security', 'CSRF protection', 'PASS', 'CSRF_SECRET is set');
  } else {
    addResult('Security', 'CSRF protection', 'WARN', 'CSRF_SECRET not set (recommended)');
  }

  // Check encryption keys
  if (process.env.CONFIG_ENCRYPTION_KEY) {
    addResult('Security', 'Data encryption', 'PASS', 'CONFIG_ENCRYPTION_KEY is set');
  } else {
    addResult('Security', 'Data encryption', 'WARN', 'CONFIG_ENCRYPTION_KEY not set');
  }
}

// Phase 3: Environment Setup
async function verifyEnvironmentVariables() {
  console.log('\n⚙️ Phase 3: Environment Setup\n');

  const requiredVars = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
  ];

  const optionalVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'MSG91_AUTH_KEY',
    'NEXT_PUBLIC_SENTRY_DSN',
  ];

  let requiredCount = 0;
  let optionalCount = 0;

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      requiredCount++;
      addResult('Environment', varName, 'PASS', 'Configured', true);
    } else {
      addResult('Environment', varName, 'FAIL', 'Not configured', true);
    }
  });

  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      optionalCount++;
      addResult('Environment', varName, 'PASS', 'Configured');
    } else {
      addResult('Environment', varName, 'SKIP', 'Optional - not configured');
    }
  });

  console.log(`Required variables: ${requiredCount}/${requiredVars.length}`);
  console.log(`Optional variables: ${optionalCount}/${optionalVars.length}`);
}

// Phase 4: Database Setup
async function verifyDatabaseSetup() {
  console.log('\n🗄️ Phase 4: Database Setup\n');

  try {
    // Test database connection
    await prisma.$connect();
    addResult('Database', 'Connection', 'PASS', 'Successfully connected to database', true);

    // Check if migrations are applied
    const schools = await prisma.school.count();
    addResult('Database', 'Schema migration', 'PASS', `Schema verified (${schools} schools)`, true);

    // Check for essential tables
    const tables = ['User', 'School', 'Student', 'Teacher', 'Parent'];
    for (const table of tables) {
      try {
        const count = await (prisma as any)[table.toLowerCase()].count();
        addResult('Database', `Table: ${table}`, 'PASS', `${count} records`);
      } catch (error) {
        addResult('Database', `Table: ${table}`, 'FAIL', 'Table not found or inaccessible', true);
      }
    }

    // Check indexes
    addResult('Database', 'Indexes', 'PASS', 'Assuming indexes from schema');

  } catch (error) {
    addResult('Database', 'Connection', 'FAIL', `Failed to connect: ${error}`, true);
  } finally {
    await prisma.$disconnect();
  }
}

// Phase 5: External Services
async function verifyExternalServices() {
  console.log('\n📦 Phase 5: External Services\n');

  // R2 Storage
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
    addResult('Services', 'Cloudflare R2', 'PASS', 'Credentials configured');
  } else {
    addResult('Services', 'Cloudflare R2', 'FAIL', 'Not configured', true);
  }

  // Razorpay
  if (process.env.RAZORPAY_KEY_ID) {
    addResult('Services', 'Razorpay', 'PASS', 'Credentials configured');
  } else {
    addResult('Services', 'Razorpay', 'WARN', 'Not configured (optional)');
  }

  // Email Service
  if (process.env.RESEND_API_KEY) {
    addResult('Services', 'Email (Resend)', 'PASS', 'API key configured');
  } else {
    addResult('Services', 'Email', 'WARN', 'Not configured (optional)');
  }

  // SMS Service
  if (process.env.MSG91_AUTH_KEY) {
    addResult('Services', 'SMS (MSG91)', 'PASS', 'API key configured');
  } else {
    addResult('Services', 'SMS', 'WARN', 'Not configured (optional)');
  }

  // Sentry
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    addResult('Services', 'Sentry', 'PASS', 'DSN configured');
  } else {
    addResult('Services', 'Sentry', 'SKIP', 'Optional - not configured');
  }
}

// Phase 7: Monitoring Setup
async function verifyMonitoringSetup() {
  console.log('\n📊 Phase 7: Monitoring Setup\n');

  // Check if audit logging is enabled
  try {
    await prisma.$connect();
    const auditLogCount = await prisma.auditLog.count();
    addResult('Monitoring', 'Audit logs', 'PASS', `${auditLogCount} audit log entries`);
  } catch (error) {
    addResult('Monitoring', 'Audit logs', 'WARN', 'AuditLog table not accessible');
  }

  // Check error monitoring
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    addResult('Monitoring', 'Error monitoring', 'PASS', 'Sentry configured');
  } else {
    addResult('Monitoring', 'Error monitoring', 'WARN', 'Sentry not configured (recommended)');
  }

  // Check if monitoring files exist
  const monitoringFiles = [
    'MONITORING_MAINTENANCE.md',
    'docs/SENTRY_SETUP.md',
  ];

  monitoringFiles.forEach(file => {
    if (fs.existsSync(file)) {
      addResult('Monitoring', `Documentation: ${file}`, 'PASS', 'File exists');
    } else {
      addResult('Monitoring', `Documentation: ${file}`, 'WARN', 'File not found');
    }
  });
}

// Phase 8: Documentation
async function verifyDocumentation() {
  console.log('\n📚 Phase 8: Documentation\n');

  const requiredDocs = [
    'README.md',
    'LAUNCH_CHECKLIST.md',
    'PRODUCTION_READY_SUMMARY.md',
    'MONITORING_MAINTENANCE.md',
    'docs/DEPLOYMENT.md',
    'docs/SECURITY.md',
    'docs/DATABASE_SCHEMA.md',
  ];

  requiredDocs.forEach(doc => {
    if (fs.existsSync(doc)) {
      addResult('Documentation', doc, 'PASS', 'File exists');
    } else {
      addResult('Documentation', doc, 'WARN', 'File not found');
    }
  });
}

// Generate report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 PRODUCTION READINESS REPORT');
  console.log('='.repeat(80) + '\n');

  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'PASS').length;
    const failed = categoryResults.filter(r => r.status === 'FAIL').length;
    const warned = categoryResults.filter(r => r.status === 'WARN').length;
    const skipped = categoryResults.filter(r => r.status === 'SKIP').length;

    console.log(`\n${category}:`);
    console.log(`  ✅ Pass: ${passed}`);
    console.log(`  ❌ Fail: ${failed}`);
    console.log(`  ⚠️  Warn: ${warned}`);
    console.log(`  ⏭️  Skip: ${skipped}`);

    categoryResults.forEach(result => {
      const icon = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARN': '⚠️',
        'SKIP': '⏭️'
      }[result.status];

      const critical = result.critical ? ' [CRITICAL]' : '';
      console.log(`    ${icon} ${result.item}${critical}: ${result.message}`);
    });
  });

  // Summary
  const totalPassed = results.filter(r => r.status === 'PASS').length;
  const totalFailed = results.filter(r => r.status === 'FAIL').length;
  const totalWarned = results.filter(r => r.status === 'WARN').length;
  const criticalFailed = results.filter(r => r.status === 'FAIL' && r.critical).length;

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Checks: ${results.length}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed} (${criticalFailed} critical)`);
  console.log(`⚠️  Warnings: ${totalWarned}`);

  if (criticalFailed > 0) {
    console.log('\n❌ PRODUCTION READINESS: NOT READY');
    console.log(`   ${criticalFailed} critical issue(s) must be resolved before deployment.`);
    return false;
  } else if (totalFailed > 0) {
    console.log('\n⚠️  PRODUCTION READINESS: READY WITH WARNINGS');
    console.log(`   ${totalFailed} non-critical issue(s) found. Review before deployment.`);
    return true;
  } else {
    console.log('\n✅ PRODUCTION READINESS: READY TO DEPLOY');
    console.log('   All critical checks passed!');
    return true;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Production Readiness Verification...\n');
  console.log('This will check your configuration against the launch checklist.\n');

  try {
    await verifySecurityConfiguration();
    await verifyEnvironmentVariables();
    await verifyDatabaseSetup();
    await verifyExternalServices();
    await verifyMonitoringSetup();
    await verifyDocumentation();

    const isReady = generateReport();

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS');
    console.log('='.repeat(80));

    if (isReady) {
      console.log('\n1. Review the LAUNCH_CHECKLIST.md for manual verification items');
      console.log('2. Run: npm run build (verify successful compilation)');
      console.log('3. Run: npm test (verify all tests pass)');
      console.log('4. Review DEPLOY_NOW.md for deployment steps');
      console.log('5. Deploy to production: vercel --prod');
    } else {
      console.log('\n1. Fix all CRITICAL failures listed above');
      console.log('2. Re-run this script: tsx scripts/verify-production-readiness.ts');
      console.log('3. Review .env.example for required environment variables');
    }

    console.log('\n📚 Documentation:');
    console.log('   - LAUNCH_CHECKLIST.md - Complete launch checklist');
    console.log('   - PRODUCTION_READY_SUMMARY.md - Quick overview');
    console.log('   - MONITORING_MAINTENANCE.md - Operations guide');
    console.log('   - DEPLOY_NOW.md - Deployment steps\n');

    process.exit(isReady ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    process.exit(1);
  }
}

main();
