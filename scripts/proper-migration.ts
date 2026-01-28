#!/usr/bin/env tsx

/**
 * Proper migration approach for multi-school setup
 */

import { execSync } from 'child_process';
import fs from 'fs';

async function runProperMigration() {
  console.log('🔄 Running proper multi-school migration...\n');

  const schemaPath = './prisma/schema.prisma';
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Step 1: Make schoolId and school relation optional for existing models
  console.log('1️⃣  Making schoolId fields optional for migration...');

  const optionalModels = [
    'Administrator',
    'Teacher',
    'Student',
    'Parent',
    'AcademicYear',
    'Term',
    'Class',
    'ClassSection',
    'StudentAttendance'
  ];

  for (const model of optionalModels) {
    // Make schoolId optional
    schema = schema.replace(
      new RegExp(`(model ${model} \\{[^}]*schoolId\\s+String)`, 's'),
      '$1?'
    );

    // Make school relation optional
    schema = schema.replace(
      new RegExp(`(model ${model} \\{[^}]*school\\s+School\\s+@relation)`, 's'),
      '$1?'
    );
  }

  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Made schoolId and relations optional');

  // Step 2: Push schema changes
  console.log('\n2️⃣  Applying schema with optional fields...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Schema applied');
  } catch (error) {
    console.error('❌ Schema push failed:', error);
    return;
  }

  // Step 3: Run data migration
  console.log('\n3️⃣  Migrating existing data...');
  try {
    execSync('npx tsx scripts/setup-multi-school-migration.ts', { stdio: 'inherit' });
    console.log('✅ Data migrated');
  } catch (error) {
    console.error('❌ Data migration failed:', error);
    return;
  }

  // Step 4: Make fields required again
  console.log('\n4️⃣  Making schoolId fields required...');
  schema = fs.readFileSync(schemaPath, 'utf8');

  for (const model of optionalModels) {
    // Make schoolId required
    schema = schema.replace(
      new RegExp(`(model ${model} \\{[^}]*schoolId\\s+String\\?)`, 's'),
      '$1'
    );

    // Make school relation required
    schema = schema.replace(
      new RegExp(`(model ${model} \\{[^}]*school\\s+School\\?\\s+@relation)`, 's'),
      '$1'
    );
  }

  fs.writeFileSync(schemaPath, schema);

  // Step 5: Final schema push with required fields
  console.log('\n5️⃣  Applying final schema with required fields...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Final schema applied');
  } catch (error) {
    console.error('❌ Final schema push failed:', error);
    return;
  }

  console.log('\n🎉 Migration completed successfully!');
  console.log('Run: npx tsx scripts/final-security-verification.ts');
}

runProperMigration().catch(console.error);