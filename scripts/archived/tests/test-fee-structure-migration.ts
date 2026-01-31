#!/usr/bin/env ts-node

/**
 * Test script for Fee Structure Migration Service
 * 
 * This script tests the migration service functionality without modifying the database.
 * It verifies the parsing and matching logic.
 */

import { feeStructureMigrationService } from '../src/lib/services/fee-structure-migration-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testParseClassNames() {
  console.log('Testing parseClassNames...\n');

  const testCases = [
    {
      input: 'Grade 10, Grade 11, Grade 12',
      expected: ['Grade 10', 'Grade 11', 'Grade 12']
    },
    {
      input: 'Grade 10; Grade 11; Grade 12',
      expected: ['Grade 10', 'Grade 11', 'Grade 12']
    },
    {
      input: 'Grade 10\nGrade 11\nGrade 12',
      expected: ['Grade 10', 'Grade 11', 'Grade 12']
    },
    {
      input: 'Grade 10 | Grade 11 | Grade 12',
      expected: ['Grade 10', 'Grade 11', 'Grade 12']
    },
    {
      input: 'Grade 10, Grade 10, Grade 11',
      expected: ['Grade 10', 'Grade 11'] // Duplicates removed
    },
    {
      input: '',
      expected: []
    },
    {
      input: '  Grade 10  ,  Grade 11  ',
      expected: ['Grade 10', 'Grade 11'] // Trimmed
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    // Access private method through any type (for testing only)
    const service = feeStructureMigrationService as any;
    const result = service.parseClassNames(testCase.input);
    
    const isMatch = JSON.stringify(result) === JSON.stringify(testCase.expected);
    
    if (isMatch) {
      console.log(`✅ PASS: "${testCase.input}"`);
      passed++;
    } else {
      console.log(`❌ FAIL: "${testCase.input}"`);
      console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
      console.log(`   Got: ${JSON.stringify(result)}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testParseAndMatchClasses() {
  console.log('Testing parseAndMatchClasses...\n');

  try {
    // Get a sample academic year
    const academicYear = await prisma.academicYear.findFirst({
      include: {
        classes: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!academicYear) {
      console.log('⚠️  No academic year found in database. Skipping match test.');
      return true;
    }

    if (academicYear.classes.length === 0) {
      console.log('⚠️  No classes found in academic year. Skipping match test.');
      return true;
    }

    console.log(`Using academic year: ${academicYear.name}`);
    console.log(`Available classes: ${academicYear.classes.map(c => c.name).join(', ')}\n`);

    // Test with actual class names
    const testInput = academicYear.classes.slice(0, 2).map(c => c.name).join(', ');
    console.log(`Test input: "${testInput}"`);

    const result = await feeStructureMigrationService.parseAndMatchClasses(
      testInput,
      academicYear.id
    );

    console.log(`Matched: ${result.matched.length} classes`);
    console.log(`Unmatched: ${result.unmatched.length} classes`);

    if (result.matched.length === 2 && result.unmatched.length === 0) {
      console.log('✅ PASS: All classes matched correctly\n');
      return true;
    } else {
      console.log('❌ FAIL: Unexpected match results\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during match test:', error);
    return false;
  }
}

async function testUnmatchedClasses() {
  console.log('Testing unmatched classes...\n');

  try {
    // Get a sample academic year
    const academicYear = await prisma.academicYear.findFirst();

    if (!academicYear) {
      console.log('⚠️  No academic year found in database. Skipping test.');
      return true;
    }

    // Test with non-existent class names
    const testInput = 'NonExistent Class 1, NonExistent Class 2';
    console.log(`Test input: "${testInput}"`);

    const result = await feeStructureMigrationService.parseAndMatchClasses(
      testInput,
      academicYear.id
    );

    console.log(`Matched: ${result.matched.length} classes`);
    console.log(`Unmatched: ${result.unmatched.length} classes`);

    if (result.matched.length === 0 && result.unmatched.length === 2) {
      console.log('✅ PASS: Unmatched classes detected correctly\n');
      return true;
    } else {
      console.log('❌ FAIL: Unexpected match results\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during unmatched test:', error);
    return false;
  }
}

async function testValidation() {
  console.log('Testing validation...\n');

  try {
    const result = await feeStructureMigrationService.validateMigration();

    console.log(`Validation result: ${result.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`Issues found: ${result.issues.length}`);

    if (result.issues.length > 0) {
      console.log('\nIssues:');
      for (const issue of result.issues) {
        console.log(`  - ${issue.feeStructureName}: ${issue.issue}`);
      }
    }

    console.log('✅ Validation test completed\n');
    return true;
  } catch (error) {
    console.error('❌ Error during validation test:', error);
    return false;
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('FEE STRUCTURE MIGRATION SERVICE TEST');
  console.log('='.repeat(80));
  console.log('');

  const results = {
    parseClassNames: await testParseClassNames(),
    parseAndMatchClasses: await testParseAndMatchClasses(),
    unmatchedClasses: await testUnmatchedClasses(),
    validation: await testValidation()
  };

  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  let allPassed = true;
  for (const [testName, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${testName}`);
    if (!passed) allPassed = false;
  }

  console.log('');
  console.log('='.repeat(80));

  await prisma.$disconnect();

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
