#!/usr/bin/env tsx

/**
 * Verification script to check if the settings migration is ready to run
 * This performs pre-flight checks before applying database migrations
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

const checks: CheckResult[] = [];

function addCheck(name: string, passed: boolean, message: string, critical = false) {
  checks.push({ name, passed, message, critical });
}

function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    return '';
  }
}

console.log('🔍 Verifying Settings Migration Readiness...\n');
console.log('='.repeat(70));

// Check 1: Prisma schema validity
console.log('\n1️⃣  Checking Prisma schema...');
try {
  const output = runCommand('npx prisma validate');
  const isValid = output.includes('is valid');
  addCheck(
    'Prisma Schema Valid',
    isValid,
    isValid ? 'Schema is valid' : 'Schema has errors',
    true
  );
  console.log(isValid ? '   ✅ Schema is valid' : '   ❌ Schema has errors');
} catch (error) {
  addCheck('Prisma Schema Valid', false, 'Failed to validate schema', true);
  console.log('   ❌ Failed to validate schema');
}

// Check 2: SchoolSettings model exists in schema
console.log('\n2️⃣  Checking SchoolSettings model...');
const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf-8');
const hasSchoolSettings = schemaContent.includes('model SchoolSettings');
const hasOldModels = 
  schemaContent.includes('model SystemSettings') ||
  schemaContent.includes('model SchoolSecuritySettings') ||
  schemaContent.includes('model SchoolDataManagementSettings') ||
  schemaContent.includes('model SchoolNotificationSettings');

addCheck(
  'SchoolSettings Model Exists',
  hasSchoolSettings,
  hasSchoolSettings ? 'SchoolSettings model found' : 'SchoolSettings model missing',
  true
);
console.log(hasSchoolSettings ? '   ✅ SchoolSettings model found' : '   ❌ SchoolSettings model missing');

addCheck(
  'Old Models Removed',
  !hasOldModels,
  hasOldModels ? 'Old settings models still in schema' : 'Old models removed from schema',
  true
);
console.log(!hasOldModels ? '   ✅ Old models removed' : '   ⚠️  Old models still in schema');

// Check 3: Migration files exist
console.log('\n3️⃣  Checking migration files...');
const createMigrationExists = fs.existsSync('prisma/migrations/20260209144727_consolidate_school_settings/migration.sql');
const cleanupMigrationExists = fs.existsSync('prisma/migrations/20260209144728_drop_old_settings_tables/migration.sql');

addCheck(
  'Create Migration Exists',
  createMigrationExists,
  createMigrationExists ? 'Create migration file found' : 'Create migration file missing',
  true
);
console.log(createMigrationExists ? '   ✅ Create migration found' : '   ❌ Create migration missing');

addCheck(
  'Cleanup Migration Exists',
  cleanupMigrationExists,
  cleanupMigrationExists ? 'Cleanup migration file found' : 'Cleanup migration file missing',
  false
);
console.log(cleanupMigrationExists ? '   ✅ Cleanup migration found' : '   ⚠️  Cleanup migration missing');

// Check 4: Data migration script exists
console.log('\n4️⃣  Checking data migration script...');
const dataMigrationExists = fs.existsSync('scripts/migrate-school-settings-consolidation.ts');
addCheck(
  'Data Migration Script Exists',
  dataMigrationExists,
  dataMigrationExists ? 'Data migration script found' : 'Data migration script missing',
  true
);
console.log(dataMigrationExists ? '   ✅ Data migration script found' : '   ❌ Data migration script missing');

// Check 5: Code references updated
console.log('\n5️⃣  Checking for old model references in code...');
const oldReferences = runCommand('grep -r "db\\.systemSettings" src/ 2>/dev/null || true');
const hasOldReferences = oldReferences.trim().length > 0;
addCheck(
  'Code References Updated',
  !hasOldReferences,
  hasOldReferences ? 'Old model references found in code' : 'All code references updated',
  false
);
console.log(!hasOldReferences ? '   ✅ All code references updated' : '   ⚠️  Some old references remain');

// Check 6: Prisma client generated
console.log('\n6️⃣  Checking Prisma client...');
const clientExists = fs.existsSync('node_modules/@prisma/client');
addCheck(
  'Prisma Client Generated',
  clientExists,
  clientExists ? 'Prisma client is generated' : 'Prisma client needs generation',
  true
);
console.log(clientExists ? '   ✅ Prisma client generated' : '   ❌ Run: npx prisma generate');

// Check 7: TypeScript compilation
console.log('\n7️⃣  Checking TypeScript compilation...');
try {
  const tsOutput = runCommand('npx tsc --noEmit 2>&1');
  const hasErrors = tsOutput.includes('error TS');
  addCheck(
    'TypeScript Compiles',
    !hasErrors,
    hasErrors ? 'TypeScript has compilation errors' : 'TypeScript compiles successfully',
    false
  );
  console.log(!hasErrors ? '   ✅ TypeScript compiles' : '   ⚠️  TypeScript has errors (may be unrelated)');
} catch (error) {
  addCheck('TypeScript Compiles', false, 'Failed to check TypeScript', false);
  console.log('   ⚠️  Could not check TypeScript');
}

// Check 8: Documentation exists
console.log('\n8️⃣  Checking documentation...');
const docsExist = 
  fs.existsSync('docs/SCHOOL_SETTINGS_MIGRATION.md') &&
  fs.existsSync('docs/SCHOOL_SETTINGS_API.md') &&
  fs.existsSync('MIGRATION_CHECKLIST.md');
addCheck(
  'Documentation Complete',
  docsExist,
  docsExist ? 'All documentation files present' : 'Some documentation missing',
  false
);
console.log(docsExist ? '   ✅ Documentation complete' : '   ⚠️  Some documentation missing');

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(70));

const criticalChecks = checks.filter(c => c.critical);
const criticalPassed = criticalChecks.filter(c => c.passed).length;
const criticalFailed = criticalChecks.length - criticalPassed;

const nonCriticalChecks = checks.filter(c => !c.critical);
const nonCriticalPassed = nonCriticalChecks.filter(c => c.passed).length;
const nonCriticalFailed = nonCriticalChecks.length - nonCriticalPassed;

console.log(`\nCritical Checks:     ${criticalPassed}/${criticalChecks.length} passed`);
console.log(`Non-Critical Checks: ${nonCriticalPassed}/${nonCriticalChecks.length} passed`);
console.log(`Total:               ${criticalPassed + nonCriticalPassed}/${checks.length} passed`);

if (criticalFailed > 0) {
  console.log('\n❌ CRITICAL ISSUES FOUND:');
  checks.filter(c => c.critical && !c.passed).forEach(check => {
    console.log(`   ❌ ${check.name}: ${check.message}`);
  });
}

if (nonCriticalFailed > 0) {
  console.log('\n⚠️  NON-CRITICAL WARNINGS:');
  checks.filter(c => !c.critical && !c.passed).forEach(check => {
    console.log(`   ⚠️  ${check.name}: ${check.message}`);
  });
}

console.log('\n' + '='.repeat(70));

if (criticalFailed === 0) {
  console.log('✅ READY FOR MIGRATION!');
  console.log('\n📋 Next steps:');
  console.log('   1. Create database backup');
  console.log('   2. Run: npx prisma migrate deploy');
  console.log('   3. Run: npx tsx scripts/migrate-school-settings-consolidation.ts');
  console.log('   4. Verify data integrity');
  console.log('   5. Test application');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ NOT READY FOR MIGRATION');
  console.log('\n⚠️  Please fix critical issues before proceeding.');
  console.log('');
  process.exit(1);
}
