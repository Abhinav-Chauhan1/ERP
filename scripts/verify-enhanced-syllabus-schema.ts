/**
 * Verification Script for Enhanced Syllabus System Schema
 * 
 * This script verifies that the new database models for the enhanced syllabus system
 * have been properly added to the Prisma schema and are accessible via the Prisma Client.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  console.log('🔍 Verifying Enhanced Syllabus System Schema...\n');

  const checks = {
    passed: 0,
    failed: 0,
    total: 0
  };

  function check(name: string, condition: boolean, details?: string) {
    checks.total++;
    if (condition) {
      checks.passed++;
      console.log(`✅ ${name}`);
      if (details) console.log(`   ${details}`);
    } else {
      checks.failed++;
      console.log(`❌ ${name}`);
      if (details) console.log(`   ${details}`);
    }
  }

  // Check 1: Verify Prisma Client has new models
  console.log('📦 Checking Prisma Client Models:\n');
  
  check(
    'Module model exists',
    typeof (prisma as any).module !== 'undefined',
    'Module model is available in Prisma Client'
  );

  check(
    'SubModule model exists',
    typeof (prisma as any).subModule !== 'undefined',
    'SubModule model is available in Prisma Client'
  );

  check(
    'SyllabusDocument model exists',
    typeof (prisma as any).syllabusDocument !== 'undefined',
    'SyllabusDocument model is available in Prisma Client'
  );

  check(
    'SubModuleProgress model exists',
    typeof (prisma as any).subModuleProgress !== 'undefined',
    'SubModuleProgress model is available in Prisma Client'
  );

  // Check 2: Verify model methods exist
  console.log('\n🔧 Checking Model Methods:\n');

  const moduleModel = (prisma as any).module;
  if (moduleModel) {
    check(
      'Module.create method exists',
      typeof moduleModel.create === 'function',
      'Can create new modules'
    );

    check(
      'Module.findMany method exists',
      typeof moduleModel.findMany === 'function',
      'Can query modules'
    );

    check(
      'Module.update method exists',
      typeof moduleModel.update === 'function',
      'Can update modules'
    );

    check(
      'Module.delete method exists',
      typeof moduleModel.delete === 'function',
      'Can delete modules'
    );
  }

  const subModuleModel = (prisma as any).subModule;
  if (subModuleModel) {
    check(
      'SubModule CRUD methods exist',
      typeof subModuleModel.create === 'function' &&
      typeof subModuleModel.findMany === 'function' &&
      typeof subModuleModel.update === 'function' &&
      typeof subModuleModel.delete === 'function',
      'All CRUD operations available for SubModule'
    );
  }

  const documentModel = (prisma as any).syllabusDocument;
  if (documentModel) {
    check(
      'SyllabusDocument CRUD methods exist',
      typeof documentModel.create === 'function' &&
      typeof documentModel.findMany === 'function' &&
      typeof documentModel.update === 'function' &&
      typeof documentModel.delete === 'function',
      'All CRUD operations available for SyllabusDocument'
    );
  }

  const progressModel = (prisma as any).subModuleProgress;
  if (progressModel) {
    check(
      'SubModuleProgress CRUD methods exist',
      typeof progressModel.create === 'function' &&
      typeof progressModel.findMany === 'function' &&
      typeof progressModel.update === 'function' &&
      typeof progressModel.delete === 'function',
      'All CRUD operations available for SubModuleProgress'
    );
  }

  // Check 3: Verify existing models still work
  console.log('\n🔄 Checking Backward Compatibility:\n');

  check(
    'Syllabus model still exists',
    typeof prisma.syllabus !== 'undefined',
    'Existing Syllabus model is preserved'
  );

  check(
    'SyllabusUnit model still exists',
    typeof prisma.syllabusUnit !== 'undefined',
    'Existing SyllabusUnit model is preserved'
  );

  check(
    'Lesson model still exists',
    typeof prisma.lesson !== 'undefined',
    'Existing Lesson model is preserved'
  );

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary:');
  console.log('='.repeat(60));
  console.log(`Total Checks: ${checks.total}`);
  console.log(`✅ Passed: ${checks.passed}`);
  console.log(`❌ Failed: ${checks.failed}`);
  console.log('='.repeat(60));

  if (checks.failed === 0) {
    console.log('\n🎉 All schema checks passed! The enhanced syllabus system models are properly configured.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Apply the migration when database is available: npx prisma migrate deploy');
    console.log('   2. Implement server actions for module management (Task 2)');
    console.log('   3. Implement server actions for sub-module management (Task 3)');
  } else {
    console.log('\n⚠️  Some checks failed. Please review the schema and regenerate Prisma Client.');
    console.log('   Run: npx prisma generate');
  }

  await prisma.$disconnect();
  process.exit(checks.failed > 0 ? 1 : 0);
}

// Run verification
verifySchema().catch((error) => {
  console.error('❌ Verification failed with error:', error);
  process.exit(1);
});
