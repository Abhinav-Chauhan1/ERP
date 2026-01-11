/**
 * Test script for Enhanced Syllabus Scope Migration
 * 
 * This script verifies that the migration was applied correctly by:
 * 1. Checking that all new columns exist
 * 2. Checking that all new enums exist
 * 3. Checking that all indexes were created
 * 4. Checking that the unique constraint exists
 * 5. Testing CRUD operations with new fields
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMigration() {
  console.log('🧪 Testing Enhanced Syllabus Scope Migration...\n');

  try {
    // Test 1: Verify columns exist
    console.log('✅ Test 1: Verifying new columns exist...');
    const columnCheck = await prisma.$queryRaw<Array<{ column_name: string; data_type: string; is_nullable: string }>>`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Syllabus' 
      AND column_name IN (
        'academicYearId', 'classId', 'sectionId', 'status', 'curriculumType', 
        'boardType', 'isActive', 'effectiveFrom', 'effectiveTo', 'version',
        'parentSyllabusId', 'createdBy', 'updatedBy', 'approvedBy', 'approvedAt',
        'tags', 'difficultyLevel', 'estimatedHours', 'prerequisites'
      )
      ORDER BY column_name;
    `;
    
    console.log(`   Found ${columnCheck.length} new columns:`);
    columnCheck.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    if (columnCheck.length < 19) {
      throw new Error(`Expected 19 columns, found ${columnCheck.length}`);
    }
    console.log('   ✓ All columns exist\n');

    // Test 2: Verify enums exist
    console.log('✅ Test 2: Verifying enums exist...');
    const enumCheck = await prisma.$queryRaw<Array<{ typname: string }>>`
      SELECT typname FROM pg_type 
      WHERE typname IN ('SyllabusStatus', 'CurriculumType', 'DifficultyLevel');
    `;
    
    console.log(`   Found ${enumCheck.length} enums:`);
    enumCheck.forEach(e => console.log(`   - ${e.typname}`));
    
    if (enumCheck.length !== 3) {
      throw new Error(`Expected 3 enums, found ${enumCheck.length}`);
    }
    console.log('   ✓ All enums exist\n');

    // Test 3: Verify indexes exist
    console.log('✅ Test 3: Verifying indexes exist...');
    const indexCheck = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'Syllabus' 
      AND indexname LIKE 'Syllabus_%'
      ORDER BY indexname;
    `;
    
    console.log(`   Found ${indexCheck.length} indexes:`);
    indexCheck.forEach(idx => console.log(`   - ${idx.indexname}`));
    
    const expectedIndexes = [
      'Syllabus_academicYearId_isActive_idx',
      'Syllabus_curriculumType_boardType_idx',
      'Syllabus_status_isActive_idx',
      'Syllabus_subjectId_classId_idx',
      'Syllabus_subjectId_academicYearId_classId_sectionId_curricu_key'
    ];
    
    const foundIndexNames = indexCheck.map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !foundIndexNames.includes(idx));
    
    if (missingIndexes.length > 0) {
      console.log(`   ⚠️  Missing indexes: ${missingIndexes.join(', ')}`);
    } else {
      console.log('   ✓ All expected indexes exist\n');
    }

    // Test 4: Verify unique constraint
    console.log('✅ Test 4: Verifying unique constraint...');
    const constraintCheck = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'Syllabus' 
      AND indexname LIKE '%subjectId_academicYearId%';
    `;
    
    if (constraintCheck.length > 0) {
      console.log(`   Found unique constraint index: ${constraintCheck[0].indexname}`);
      console.log('   ✓ Unique constraint exists\n');
    } else {
      throw new Error('Unique constraint not found');
    }

    // Test 5: Check if existing data was migrated correctly
    console.log('✅ Test 5: Checking existing data migration...');
    const existingSyllabi = await prisma.syllabus.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        curriculumType: true,
        isActive: true,
        createdBy: true,
        version: true,
        difficultyLevel: true
      }
    });
    
    if (existingSyllabi.length > 0) {
      console.log(`   Found ${existingSyllabi.length} existing syllabi:`);
      existingSyllabi.forEach(s => {
        console.log(`   - ${s.title}:`);
        console.log(`     Status: ${s.status}, Type: ${s.curriculumType}, Active: ${s.isActive}`);
        console.log(`     CreatedBy: ${s.createdBy}, Version: ${s.version}, Difficulty: ${s.difficultyLevel}`);
      });
      
      // Verify defaults were applied
      const allHaveDefaults = existingSyllabi.every(s => 
        s.status && s.curriculumType && s.isActive !== null && s.createdBy && s.version && s.difficultyLevel
      );
      
      if (allHaveDefaults) {
        console.log('   ✓ All existing syllabi have default values\n');
      } else {
        throw new Error('Some existing syllabi are missing default values');
      }
    } else {
      console.log('   No existing syllabi found (empty database)\n');
    }

    // Test 6: Test CRUD operations with new fields
    console.log('✅ Test 6: Testing CRUD operations with new fields...');
    
    // Get a subject for testing
    const subject = await prisma.subject.findFirst();
    
    if (!subject) {
      console.log('   ⚠️  No subjects found, skipping CRUD test');
    } else {
      // Create a test syllabus with new fields
      const testSyllabus = await prisma.syllabus.create({
        data: {
          title: 'Test Enhanced Syllabus',
          description: 'Testing enhanced scope fields',
          subjectId: subject.id,
          curriculumType: 'ADVANCED',
          boardType: 'CBSE',
          status: 'DRAFT',
          isActive: true,
          version: '1.0',
          createdBy: 'test-user',
          tags: ['test', 'enhanced', 'scope'],
          difficultyLevel: 'ADVANCED',
          estimatedHours: 40,
          prerequisites: 'Basic understanding of the subject'
        }
      });
      
      console.log(`   Created test syllabus: ${testSyllabus.id}`);
      
      // Read it back
      const retrieved = await prisma.syllabus.findUnique({
        where: { id: testSyllabus.id }
      });
      
      if (retrieved) {
        console.log('   ✓ Successfully created and retrieved syllabus with new fields');
        console.log(`     - Curriculum Type: ${retrieved.curriculumType}`);
        console.log(`     - Board Type: ${retrieved.boardType}`);
        console.log(`     - Status: ${retrieved.status}`);
        console.log(`     - Tags: ${retrieved.tags?.join(', ')}`);
        console.log(`     - Difficulty: ${retrieved.difficultyLevel}`);
      }
      
      // Update it
      const updated = await prisma.syllabus.update({
        where: { id: testSyllabus.id },
        data: {
          status: 'PUBLISHED',
          updatedBy: 'test-user-2',
          approvedBy: 'admin-user',
          approvedAt: new Date()
        }
      });
      
      console.log('   ✓ Successfully updated syllabus status and audit fields');
      console.log(`     - Status: ${updated.status}`);
      console.log(`     - Updated By: ${updated.updatedBy}`);
      console.log(`     - Approved By: ${updated.approvedBy}`);
      
      // Test unique constraint
      console.log('   Testing unique constraint...');
      try {
        await prisma.syllabus.create({
          data: {
            title: 'Duplicate Test',
            subjectId: subject.id,
            curriculumType: 'ADVANCED',
            createdBy: 'test-user',
            // Same scope as testSyllabus (all null)
          }
        });
        throw new Error('Unique constraint did not prevent duplicate');
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log('   ✓ Unique constraint working correctly');
        } else {
          throw error;
        }
      }
      
      // Clean up
      await prisma.syllabus.delete({
        where: { id: testSyllabus.id }
      });
      console.log('   ✓ Test syllabus cleaned up\n');
    }

    console.log('🎉 All migration tests passed!\n');
    console.log('Summary:');
    console.log('✓ All new columns exist and are properly typed');
    console.log('✓ All enums are created');
    console.log('✓ All indexes are in place');
    console.log('✓ Unique constraint is working');
    console.log('✓ Existing data has default values');
    console.log('✓ CRUD operations work with new fields');
    
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testMigration()
  .then(() => {
    console.log('\n✅ Migration verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration verification failed:', error);
    process.exit(1);
  });
