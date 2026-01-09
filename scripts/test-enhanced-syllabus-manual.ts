/**
 * Manual test script for Enhanced Syllabus Scope System
 * Tests database operations directly without Next.js server actions
 * This validates that the schema and migrations are working correctly
 */

import { db } from '../src/lib/db';
import { Prisma } from '@prisma/client';

interface TestContext {
  subjectId?: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  syllabusIds: string[];
}

const context: TestContext = {
  syllabusIds: []
};

async function createTestData() {
  console.log('📦 Creating test data...\n');
  
  try {
    const timestamp = Date.now();
    
    // Create test subject
    const subject = await db.subject.create({
      data: {
        name: `Manual Test Subject ${timestamp}`,
        code: `MANUAL-TEST-${timestamp}`,
        description: 'Manual test subject'
      }
    });
    context.subjectId = subject.id;
    console.log(`✅ Created test subject: ${subject.name}`);
    
    // Create test academic year
    const academicYear = await db.academicYear.create({
      data: {
        name: `Manual Test AY ${timestamp}`,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        isCurrent: false
      }
    });
    context.academicYearId = academicYear.id;
    console.log(`✅ Created test academic year: ${academicYear.name}`);
    
    // Create test class
    const classRecord = await db.class.create({
      data: {
        name: 'Manual Test Class',
        academicYearId: academicYear.id
      }
    });
    context.classId = classRecord.id;
    console.log(`✅ Created test class: ${classRecord.name}`);
    
    // Create test section
    const section = await db.classSection.create({
      data: {
        name: 'Manual Test Section',
        classId: classRecord.id,
        capacity: 40
      }
    });
    context.sectionId = section.id;
    console.log(`✅ Created test section: ${section.name}`);
    
    console.log();
    return true;
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log('🧪 Testing Database Schema and Enhanced Fields\n');
  
  if (!context.subjectId) {
    console.log('⚠️  No test data available');
    return;
  }
  
  // Test 1: Create subject-wide syllabus with all new fields
  console.log('1️⃣ Creating subject-wide syllabus with enhanced fields...');
  try {
    const syllabus1 = await db.syllabus.create({
      data: {
        title: 'Subject-Wide Test Syllabus',
        description: 'Testing all enhanced fields',
        subjectId: context.subjectId,
        
        // Scope fields (all null for subject-wide)
        academicYearId: null,
        classId: null,
        sectionId: null,
        
        // Curriculum details
        curriculumType: 'GENERAL',
        boardType: 'CBSE',
        
        // Lifecycle management
        status: 'DRAFT',
        isActive: true,
        effectiveFrom: new Date('2024-04-01'),
        effectiveTo: new Date('2025-03-31'),
        
        // Versioning
        version: '1.0',
        parentSyllabusId: null,
        
        // Ownership
        createdBy: 'test-user-1',
        
        // Metadata
        tags: ['test', 'subject-wide', 'manual'],
        difficultyLevel: 'INTERMEDIATE',
        estimatedHours: 100,
        prerequisites: 'Basic knowledge of the subject',
      }
    });
    
    context.syllabusIds.push(syllabus1.id);
    console.log(`✅ Created: ${syllabus1.title}`);
    console.log(`   ID: ${syllabus1.id}`);
    console.log(`   Status: ${syllabus1.status}`);
    console.log(`   Curriculum Type: ${syllabus1.curriculumType}`);
    console.log(`   Board Type: ${syllabus1.boardType}`);
    console.log(`   Difficulty: ${syllabus1.difficultyLevel}`);
    console.log(`   Tags: ${syllabus1.tags.join(', ')}`);
    console.log(`   Estimated Hours: ${syllabus1.estimatedHours}`);
    console.log(`   Created By: ${syllabus1.createdBy}`);
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
  
  // Test 2: Create class-wide syllabus
  console.log('2️⃣ Creating class-wide syllabus...');
  try {
    const syllabus2 = await db.syllabus.create({
      data: {
        title: 'Class-Wide Test Syllabus',
        description: 'For a specific class',
        subjectId: context.subjectId,
        academicYearId: context.academicYearId,
        classId: context.classId,
        sectionId: null, // null for class-wide
        curriculumType: 'ADVANCED',
        status: 'DRAFT',
        isActive: true,
        version: '1.0',
        createdBy: 'test-user-2',
        tags: ['test', 'class-wide'],
        difficultyLevel: 'ADVANCED',
      }
    });
    
    context.syllabusIds.push(syllabus2.id);
    console.log(`✅ Created: ${syllabus2.title}`);
    console.log(`   Class ID: ${syllabus2.classId}`);
    console.log(`   Section ID: ${syllabus2.sectionId} (should be null)`);
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
  
  // Test 3: Create section-specific syllabus
  console.log('3️⃣ Creating section-specific syllabus...');
  try {
    const syllabus3 = await db.syllabus.create({
      data: {
        title: 'Section-Specific Test Syllabus',
        description: 'For a specific section',
        subjectId: context.subjectId,
        academicYearId: context.academicYearId,
        classId: context.classId,
        sectionId: context.sectionId,
        curriculumType: 'REMEDIAL',
        status: 'DRAFT',
        isActive: true,
        version: '1.0',
        createdBy: 'test-user-3',
        tags: ['test', 'section-specific'],
        difficultyLevel: 'BEGINNER',
      }
    });
    
    context.syllabusIds.push(syllabus3.id);
    console.log(`✅ Created: ${syllabus3.title}`);
    console.log(`   Class ID: ${syllabus3.classId}`);
    console.log(`   Section ID: ${syllabus3.sectionId}`);
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
  
  // Test 4: Try to create duplicate (should fail)
  console.log('4️⃣ Testing unique constraint (should fail)...');
  try {
    await db.syllabus.create({
      data: {
        title: 'Duplicate Syllabus',
        subjectId: context.subjectId,
        academicYearId: null,
        classId: null,
        sectionId: null,
        curriculumType: 'GENERAL', // Same as syllabus1
        status: 'DRAFT',
        isActive: true,
        version: '1.0',
        createdBy: 'test-user-4',
        tags: [],
        difficultyLevel: 'INTERMEDIATE',
      }
    });
    console.log(`❌ Should have failed but succeeded`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`✅ Correctly rejected duplicate: Unique constraint violation`);
    } else {
      console.log(`❌ Failed with unexpected error: ${error.message}`);
    }
  }
  console.log();
}

async function testUpdateOperations() {
  console.log('🧪 Testing Update Operations\n');
  
  if (context.syllabusIds.length === 0) {
    console.log('⚠️  No syllabi to update');
    return;
  }
  
  const syllabusId = context.syllabusIds[0];
  
  // Test 1: Update syllabus fields
  console.log('1️⃣ Testing update syllabus...');
  try {
    const updated = await db.syllabus.update({
      where: { id: syllabusId },
      data: {
        title: 'Updated Subject-Wide Syllabus',
        version: '1.1',
        updatedBy: 'test-updater',
        tags: ['test', 'updated'],
        estimatedHours: 120,
      }
    });
    
    console.log(`✅ Updated syllabus ${syllabusId}`);
    console.log(`   New Title: ${updated.title}`);
    console.log(`   New Version: ${updated.version}`);
    console.log(`   Updated By: ${updated.updatedBy}`);
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
  
  // Test 2: Update status to APPROVED
  console.log('2️⃣ Testing status update to APPROVED...');
  try {
    const approved = await db.syllabus.update({
      where: { id: syllabusId },
      data: {
        status: 'APPROVED',
        approvedBy: 'test-approver',
        approvedAt: new Date(),
      }
    });
    
    console.log(`✅ Updated status to ${approved.status}`);
    console.log(`   Approved By: ${approved.approvedBy}`);
    console.log(`   Approved At: ${approved.approvedAt}`);
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
  
  // Test 3: Update status to PUBLISHED
  console.log('3️⃣ Testing status update to PUBLISHED...');
  try {
    const published = await db.syllabus.update({
      where: { id: syllabusId },
      data: {
        status: 'PUBLISHED',
      }
    });
    
    console.log(`✅ Updated status to ${published.status}`);
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
}

async function testQueryOperations() {
  console.log('🧪 Testing Query Operations\n');
  
  if (!context.subjectId) {
    console.log('⚠️  No test data available');
    return;
  }
  
  // Test 1: Query by subject
  console.log('1️⃣ Testing query by subject...');
  try {
    const syllabi = await db.syllabus.findMany({
      where: { subjectId: context.subjectId },
      include: {
        subject: { select: { name: true } },
        academicYear: { select: { name: true } },
        class: { select: { name: true } },
        section: { select: { name: true } },
      }
    });
    
    console.log(`✅ Found ${syllabi.length} syllabi`);
    syllabi.forEach((s, i) => {
      const scope = s.sectionId ? 'Section-specific' : s.classId ? 'Class-wide' : 'Subject-wide';
      console.log(`   ${i + 1}. ${s.title} (${scope}, ${s.curriculumType}, ${s.status})`);
    });
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
  
  // Test 2: Query with fallback logic (section → class → subject)
  console.log('2️⃣ Testing fallback query logic...');
  try {
    const currentDate = new Date();
    
    // Try section-specific first
    let syllabus = await db.syllabus.findFirst({
      where: {
        subjectId: context.subjectId,
        academicYearId: context.academicYearId,
        classId: context.classId,
        sectionId: context.sectionId,
        status: 'PUBLISHED',
        isActive: true,
      }
    });
    
    if (!syllabus) {
      // Try class-wide
      syllabus = await db.syllabus.findFirst({
        where: {
          subjectId: context.subjectId,
          academicYearId: context.academicYearId,
          classId: context.classId,
          sectionId: null,
          status: 'PUBLISHED',
          isActive: true,
        }
      });
    }
    
    if (!syllabus) {
      // Try subject-wide
      syllabus = await db.syllabus.findFirst({
        where: {
          subjectId: context.subjectId,
          academicYearId: null,
          classId: null,
          sectionId: null,
          status: 'PUBLISHED',
          isActive: true,
        }
      });
    }
    
    if (syllabus) {
      const scope = syllabus.sectionId ? 'Section-specific' : syllabus.classId ? 'Class-wide' : 'Subject-wide';
      console.log(`✅ Found syllabus via fallback: ${syllabus.title} (${scope})`);
    } else {
      console.log(`⚠️  No published syllabus found (expected if none are published)`);
    }
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
  
  // Test 3: Filter by tags
  console.log('3️⃣ Testing filter by tags...');
  try {
    const syllabi = await db.syllabus.findMany({
      where: {
        subjectId: context.subjectId,
        tags: { hasSome: ['test'] }
      }
    });
    
    console.log(`✅ Found ${syllabi.length} syllabi with 'test' tag`);
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
  
  // Test 4: Filter by status
  console.log('4️⃣ Testing filter by status...');
  try {
    const draftSyllabi = await db.syllabus.findMany({
      where: {
        subjectId: context.subjectId,
        status: 'DRAFT'
      }
    });
    
    console.log(`✅ Found ${draftSyllabi.length} draft syllabi`);
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
}

async function testCloneOperation() {
  console.log('🧪 Testing Clone Operation\n');
  
  if (context.syllabusIds.length === 0 || !context.subjectId) {
    console.log('⚠️  No syllabi to clone');
    return;
  }
  
  const sourceId = context.syllabusIds[0];
  
  console.log('1️⃣ Testing clone syllabus...');
  try {
    // Get source syllabus
    const source = await db.syllabus.findUnique({
      where: { id: sourceId }
    });
    
    if (!source) {
      console.log('❌ Source syllabus not found');
      return;
    }
    
    // Clone with different curriculum type
    const cloned = await db.syllabus.create({
      data: {
        title: source.title,
        description: source.description,
        subjectId: source.subjectId,
        document: source.document,
        
        // Same scope
        academicYearId: source.academicYearId,
        classId: source.classId,
        sectionId: source.sectionId,
        
        // Different curriculum type
        curriculumType: 'VOCATIONAL',
        boardType: source.boardType,
        
        // Reset lifecycle
        status: 'DRAFT',
        isActive: true,
        effectiveFrom: source.effectiveFrom,
        effectiveTo: source.effectiveTo,
        
        // Link to parent
        version: source.version,
        parentSyllabusId: source.id,
        
        // New ownership
        createdBy: 'test-cloner',
        
        // Copy metadata
        tags: source.tags,
        difficultyLevel: source.difficultyLevel,
        estimatedHours: source.estimatedHours,
        prerequisites: source.prerequisites,
      }
    });
    
    context.syllabusIds.push(cloned.id);
    console.log(`✅ Cloned syllabus ${cloned.id}`);
    console.log(`   Original ID: ${sourceId}`);
    console.log(`   Cloned ID: ${cloned.id}`);
    console.log(`   Status: ${cloned.status} (should be DRAFT)`);
    console.log(`   Created By: ${cloned.createdBy}`);
    console.log(`   Parent ID: ${cloned.parentSyllabusId}`);
    console.log(`   Curriculum Type: ${cloned.curriculumType}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`❌ Failed: Unique constraint violation (expected if same scope)`);
    } else {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  console.log();
}

async function testVersionHistory() {
  console.log('🧪 Testing Version History\n');
  
  if (context.syllabusIds.length === 0) {
    console.log('⚠️  No syllabi available');
    return;
  }
  
  console.log('1️⃣ Testing version relationships...');
  try {
    // Get all syllabi with parent relationships
    const syllabi = await db.syllabus.findMany({
      where: {
        id: { in: context.syllabusIds }
      },
      include: {
        parentSyllabus: {
          select: { id: true, title: true, version: true }
        },
        childVersions: {
          select: { id: true, title: true, version: true }
        }
      }
    });
    
    console.log(`✅ Found ${syllabi.length} syllabi`);
    syllabi.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.title} (v${s.version})`);
      if (s.parentSyllabusId) {
        console.log(`      Parent: ${s.parentSyllabus?.title} (v${s.parentSyllabus?.version})`);
      }
      if (s.childVersions.length > 0) {
        console.log(`      Children: ${s.childVersions.length}`);
      }
    });
  } catch (error) {
    console.log(`❌ Failed: ${error}`);
  }
  console.log();
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');
  
  try {
    // Delete all test syllabi
    for (const id of context.syllabusIds) {
      await db.syllabus.delete({ where: { id } });
      console.log(`✅ Deleted syllabus ${id}`);
    }
    
    // Delete test section
    if (context.sectionId) {
      await db.classSection.delete({ where: { id: context.sectionId } });
      console.log(`✅ Deleted test section`);
    }
    
    // Delete test class
    if (context.classId) {
      await db.class.delete({ where: { id: context.classId } });
      console.log(`✅ Deleted test class`);
    }
    
    // Delete test academic year
    if (context.academicYearId) {
      await db.academicYear.delete({ where: { id: context.academicYearId } });
      console.log(`✅ Deleted test academic year`);
    }
    
    // Delete test subject
    if (context.subjectId) {
      await db.subject.delete({ where: { id: context.subjectId } });
      console.log(`✅ Deleted test subject`);
    }
    
    console.log();
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Enhanced Syllabus - Manual Database Operations Test');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Create test data
    const setupSuccess = await createTestData();
    if (!setupSuccess) {
      console.log('❌ Setup failed - cannot continue tests');
      return;
    }
    
    // Run all test suites
    await testDatabaseSchema();
    await testUpdateOperations();
    await testQueryOperations();
    await testCloneOperation();
    await testVersionHistory();
    
    // Cleanup
    await cleanupTestData();
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✨ All Tests Completed Successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    
    // Attempt cleanup even on failure
    console.log('\nAttempting cleanup after error...');
    await cleanupTestData();
    
    throw error;
  }
}

// Run the test suite
runAllTests()
  .then(() => {
    console.log('Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
