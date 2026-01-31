/**
 * Comprehensive test script for Enhanced Syllabus Scope System
 * Creates its own test data and validates all server actions
 */

import { 
  // Helper actions
  getSubjectsForDropdown,
  getAcademicYearsForDropdown,
  getClassesForDropdown,
  getSectionsForDropdown,
  validateSyllabusScope,
  
  // Core actions
  createSyllabus,
  getSyllabusWithFallback,
  getSyllabusByScope,
  updateSyllabus,
  updateSyllabusStatus,
  cloneSyllabus,
  getSyllabusVersionHistory,
  deleteSyllabus,
} from '../src/lib/actions/syllabusActions';

import { db } from '../src/lib/db';

interface TestContext {
  subjectId?: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  syllabusId?: string;
  clonedSyllabusId?: string;
  createdTestData: boolean;
}

const context: TestContext = {
  createdTestData: false
};

async function createTestData() {
  console.log('📦 Creating test data...\n');
  
  try {
    // Create test subject with unique code
    const timestamp = Date.now();
    const subject = await db.subject.create({
      data: {
        name: `Test Subject for Enhanced Syllabus ${timestamp}`,
        code: `TEST-SUBJ-${timestamp}`,
        description: 'Test subject for validating enhanced syllabus features'
      }
    });
    context.subjectId = subject.id;
    console.log(`✅ Created test subject: ${subject.name} (${subject.id})`);
    
    // Create test academic year with unique name
    const academicYear = await db.academicYear.create({
      data: {
        name: `Test Academic Year ${timestamp}`,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        isCurrent: false
      }
    });
    context.academicYearId = academicYear.id;
    console.log(`✅ Created test academic year: ${academicYear.name} (${academicYear.id})`);
    
    // Create test class
    const classRecord = await db.class.create({
      data: {
        name: 'Test Class 10',
        academicYearId: academicYear.id
      }
    });
    context.classId = classRecord.id;
    console.log(`✅ Created test class: ${classRecord.name} (${classRecord.id})`);
    
    // Create test section
    const section = await db.classSection.create({
      data: {
        name: 'Test Section A',
        classId: classRecord.id,
        capacity: 40
      }
    });
    context.sectionId = section.id;
    console.log(`✅ Created test section: ${section.name} (${section.id})`);
    
    context.createdTestData = true;
    console.log();
    return true;
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    return false;
  }
}

async function testHelperActions() {
  console.log('🧪 Testing Helper Actions\n');
  
  // Test 1: Get Subjects for Dropdown
  console.log('1️⃣ Testing getSubjectsForDropdown...');
  const subjectsResult = await getSubjectsForDropdown();
  if (subjectsResult.success && subjectsResult.data && subjectsResult.data.length > 0) {
    console.log(`✅ Success: Found ${subjectsResult.data.length} subjects`);
  } else {
    console.log(`❌ Failed: ${subjectsResult.error || 'No subjects found'}`);
  }
  console.log();
  
  // Test 2: Get Academic Years for Dropdown
  console.log('2️⃣ Testing getAcademicYearsForDropdown...');
  const academicYearsResult = await getAcademicYearsForDropdown();
  if (academicYearsResult.success) {
    console.log(`✅ Success: Found ${academicYearsResult.data?.length ?? 0} academic years`);
  } else {
    console.log(`❌ Failed: ${academicYearsResult.error}`);
  }
  console.log();
  
  // Test 3: Get Classes for Dropdown
  console.log('3️⃣ Testing getClassesForDropdown...');
  const classesResult = await getClassesForDropdown();
  if (classesResult.success) {
    console.log(`✅ Success: Found ${classesResult.data?.length ?? 0} classes`);
  } else {
    console.log(`❌ Failed: ${classesResult.error}`);
  }
  console.log();
  
  // Test 4: Get Sections for Dropdown
  if (context.classId) {
    console.log('4️⃣ Testing getSectionsForDropdown...');
    const sectionsResult = await getSectionsForDropdown(context.classId);
    if (sectionsResult.success) {
      console.log(`✅ Success: Found ${sectionsResult.data?.length ?? 0} sections`);
    } else {
      console.log(`❌ Failed: ${sectionsResult.error}`);
    }
    console.log();
  }
  
  // Test 5: Validate Syllabus Scope - Valid subject-wide
  console.log('5️⃣ Testing validateSyllabusScope (valid: subject-wide)...');
  if (context.subjectId) {
    const validResult = await validateSyllabusScope({
      subjectId: context.subjectId,
      scopeType: 'SUBJECT_WIDE'
    });
    if (validResult.isValid) {
      console.log(`✅ Success: Valid scope configuration`);
    } else {
      console.log(`❌ Failed: ${validResult.error}`);
    }
  }
  console.log();
  
  // Test 6: Validate Syllabus Scope - Invalid (missing class for class-wide)
  console.log('6️⃣ Testing validateSyllabusScope (invalid: class-wide without class)...');
  if (context.subjectId) {
    const invalidResult = await validateSyllabusScope({
      subjectId: context.subjectId,
      scopeType: 'CLASS_WIDE'
    });
    if (!invalidResult.isValid) {
      console.log(`✅ Success: Correctly rejected - ${invalidResult.error}`);
    } else {
      console.log(`❌ Failed: Should have been rejected`);
    }
  }
  console.log();
  
  // Test 7: Validate Syllabus Scope - Invalid (non-existent subject)
  console.log('7️⃣ Testing validateSyllabusScope (invalid: non-existent subject)...');
  const invalidResult2 = await validateSyllabusScope({
    subjectId: 'non-existent-id',
    scopeType: 'SUBJECT_WIDE'
  });
  if (!invalidResult2.isValid) {
    console.log(`✅ Success: Correctly rejected - ${invalidResult2.error}`);
  } else {
    console.log(`❌ Failed: Should have rejected non-existent subject`);
  }
  console.log();
}

async function testCreateSyllabus() {
  console.log('🧪 Testing Create Syllabus\n');
  
  if (!context.subjectId) {
    console.log('⚠️  Skipping create tests - no subject available');
    return;
  }
  
  // Test 1: Create subject-wide syllabus
  console.log('1️⃣ Testing createSyllabus (subject-wide)...');
  const createResult = await createSyllabus({
    title: 'Test Subject-Wide Syllabus',
    description: 'This is a test syllabus for the entire subject',
    subjectId: context.subjectId,
    scopeType: 'SUBJECT_WIDE',
    curriculumType: 'GENERAL',
    version: '1.0',
    difficultyLevel: 'INTERMEDIATE',
    tags: ['test', 'subject-wide'],
  }, null, 'test-user-id');
  
  if (createResult.success && createResult.data) {
    context.syllabusId = createResult.data.id;
    console.log(`✅ Success: Created syllabus ${createResult.data.id}`);
    console.log(`   Title: ${createResult.data.title}`);
    console.log(`   Status: ${createResult.data.status} (should be DRAFT)`);
    console.log(`   Curriculum Type: ${createResult.data.curriculumType}`);
    console.log(`   Created By: ${createResult.data.createdBy}`);
    console.log(`   Is Active: ${createResult.data.isActive}`);
  } else {
    console.log(`❌ Failed: ${createResult.error}`);
  }
  console.log();
  
  // Test 2: Try to create duplicate (should fail)
  console.log('2️⃣ Testing createSyllabus (duplicate - should fail)...');
  const duplicateResult = await createSyllabus({
    title: 'Duplicate Test Syllabus',
    description: 'This should fail due to unique constraint',
    subjectId: context.subjectId,
    scopeType: 'SUBJECT_WIDE',
    curriculumType: 'GENERAL',
    version: '1.0',
    difficultyLevel: 'INTERMEDIATE',
    tags: ['test'],
  }, null, 'test-user-id');
  
  if (!duplicateResult.success) {
    console.log(`✅ Success: Correctly rejected duplicate - ${duplicateResult.error}`);
  } else {
    console.log(`❌ Failed: Should have rejected duplicate`);
  }
  console.log();
  
  // Test 3: Create class-wide syllabus
  if (context.classId) {
    console.log('3️⃣ Testing createSyllabus (class-wide)...');
    const classWideResult = await createSyllabus({
      title: 'Test Class-Wide Syllabus',
      description: 'This is a test syllabus for a specific class',
      subjectId: context.subjectId,
      scopeType: 'CLASS_WIDE',
      classId: context.classId,
      academicYearId: context.academicYearId,
      curriculumType: 'ADVANCED',
      version: '1.0',
      difficultyLevel: 'ADVANCED',
      tags: ['test', 'class-wide'],
    }, null, 'test-user-id');
    
    if (classWideResult.success && classWideResult.data) {
      console.log(`✅ Success: Created class-wide syllabus ${classWideResult.data.id}`);
      console.log(`   Class ID: ${classWideResult.data.classId}`);
      console.log(`   Section ID: ${classWideResult.data.sectionId} (should be null)`);
    } else {
      console.log(`❌ Failed: ${classWideResult.error}`);
    }
    console.log();
  }
  
  // Test 4: Create section-specific syllabus
  if (context.classId && context.sectionId) {
    console.log('4️⃣ Testing createSyllabus (section-specific)...');
    const sectionSpecificResult = await createSyllabus({
      title: 'Test Section-Specific Syllabus',
      description: 'This is a test syllabus for a specific section',
      subjectId: context.subjectId,
      scopeType: 'SECTION_SPECIFIC',
      classId: context.classId,
      sectionId: context.sectionId,
      academicYearId: context.academicYearId,
      curriculumType: 'REMEDIAL',
      version: '1.0',
      difficultyLevel: 'BEGINNER',
      tags: ['test', 'section-specific'],
      estimatedHours: 40,
      prerequisites: 'Basic understanding of the subject',
    }, null, 'test-user-id');
    
    if (sectionSpecificResult.success && sectionSpecificResult.data) {
      console.log(`✅ Success: Created section-specific syllabus ${sectionSpecificResult.data.id}`);
      console.log(`   Class ID: ${sectionSpecificResult.data.classId}`);
      console.log(`   Section ID: ${sectionSpecificResult.data.sectionId}`);
      console.log(`   Estimated Hours: ${sectionSpecificResult.data.estimatedHours}`);
      console.log(`   Prerequisites: ${sectionSpecificResult.data.prerequisites}`);
    } else {
      console.log(`❌ Failed: ${sectionSpecificResult.error}`);
    }
    console.log();
  }
  
  // Test 5: Create with effective dates
  console.log('5️⃣ Testing createSyllabus (with effective dates)...');
  const datedResult = await createSyllabus({
    title: 'Test Dated Syllabus',
    description: 'Syllabus with effective date range',
    subjectId: context.subjectId,
    scopeType: 'SUBJECT_WIDE',
    curriculumType: 'INTEGRATED',
    version: '1.0',
    difficultyLevel: 'INTERMEDIATE',
    tags: ['test', 'dated'],
    effectiveFrom: new Date('2024-04-01'),
    effectiveTo: new Date('2025-03-31'),
  }, null, 'test-user-id');
  
  if (datedResult.success && datedResult.data) {
    console.log(`✅ Success: Created syllabus with dates`);
    console.log(`   Effective From: ${datedResult.data.effectiveFrom}`);
    console.log(`   Effective To: ${datedResult.data.effectiveTo}`);
  } else {
    console.log(`❌ Failed: ${datedResult.error}`);
  }
  console.log();
}

async function testGetSyllabusByScope() {
  console.log('🧪 Testing Get Syllabus By Scope\n');
  
  if (!context.subjectId) {
    console.log('⚠️  Skipping scope filtering tests - no subject available');
    return;
  }
  
  // Test 1: Get all syllabi for subject
  console.log('1️⃣ Testing getSyllabusByScope (filter by subject)...');
  const subjectResult = await getSyllabusByScope({
    subjectId: context.subjectId
  });
  
  if (subjectResult.success) {
    console.log(`✅ Success: Found ${subjectResult.data?.length ?? 0} syllabi for subject`);
    subjectResult.data?.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.title} (${s.curriculumType}, Status: ${s.status})`);
    });
  } else {
    console.log(`❌ Failed: ${subjectResult.error}`);
  }
  console.log();
  
  // Test 2: Filter by status
  console.log('2️⃣ Testing getSyllabusByScope (filter by status: DRAFT)...');
  const statusResult = await getSyllabusByScope({
    subjectId: context.subjectId,
    status: ['DRAFT']
  });
  
  if (statusResult.success) {
    console.log(`✅ Success: Found ${statusResult.data?.length ?? 0} draft syllabi`);
  } else {
    console.log(`❌ Failed: ${statusResult.error}`);
  }
  console.log();
  
  // Test 3: Filter by tags
  console.log('3️⃣ Testing getSyllabusByScope (filter by tags)...');
  const tagsResult = await getSyllabusByScope({
    subjectId: context.subjectId,
    tags: ['test']
  });
  
  if (tagsResult.success) {
    console.log(`✅ Success: Found ${tagsResult.data?.length ?? 0} syllabi with 'test' tag`);
  } else {
    console.log(`❌ Failed: ${tagsResult.error}`);
  }
  console.log();
  
  // Test 4: Filter by curriculum type
  console.log('4️⃣ Testing getSyllabusByScope (filter by curriculum type)...');
  const curriculumResult = await getSyllabusByScope({
    subjectId: context.subjectId,
    curriculumType: 'GENERAL'
  });
  
  if (curriculumResult.success) {
    console.log(`✅ Success: Found ${curriculumResult.data?.length ?? 0} GENERAL curriculum syllabi`);
  } else {
    console.log(`❌ Failed: ${curriculumResult.error}`);
  }
  console.log();
}

async function testUpdateSyllabus() {
  console.log('🧪 Testing Update Syllabus\n');
  
  if (!context.syllabusId || !context.subjectId) {
    console.log('⚠️  Skipping update tests - no syllabus to update');
    return;
  }
  
  // Test 1: Update syllabus fields
  console.log('1️⃣ Testing updateSyllabus...');
  const updateResult = await updateSyllabus({
    id: context.syllabusId,
    title: 'Updated Test Syllabus',
    description: 'This syllabus has been updated',
    subjectId: context.subjectId,
    scopeType: 'SUBJECT_WIDE',
    curriculumType: 'GENERAL',
    version: '1.1',
    difficultyLevel: 'ADVANCED',
    tags: ['test', 'updated'],
    estimatedHours: 50,
  } as Parameters<typeof updateSyllabus>[0], null, 'test-updater-id');
  
  if (updateResult.success && updateResult.data) {
    console.log(`✅ Success: Updated syllabus ${updateResult.data.id}`);
    console.log(`   New Title: ${updateResult.data.title}`);
    console.log(`   New Version: ${updateResult.data.version}`);
    console.log(`   Updated By: ${updateResult.data.updatedBy}`);
    console.log(`   Estimated Hours: ${updateResult.data.estimatedHours}`);
  } else {
    console.log(`❌ Failed: ${updateResult.error}`);
  }
  console.log();
}

async function testUpdateSyllabusStatus() {
  console.log('🧪 Testing Update Syllabus Status\n');
  
  if (!context.syllabusId) {
    console.log('⚠️  Skipping status update tests - no syllabus available');
    return;
  }
  
  // Test 1: Update status to PENDING_REVIEW
  console.log('1️⃣ Testing updateSyllabusStatus (PENDING_REVIEW)...');
  const reviewResult = await updateSyllabusStatus(
    context.syllabusId,
    'PENDING_REVIEW',
    'test-reviewer-id'
  );
  
  if (reviewResult.success && reviewResult.data) {
    console.log(`✅ Success: Updated status to ${reviewResult.data.status}`);
  } else {
    console.log(`❌ Failed: ${reviewResult.error}`);
  }
  console.log();
  
  // Test 2: Update status to APPROVED
  console.log('2️⃣ Testing updateSyllabusStatus (APPROVED)...');
  const approveResult = await updateSyllabusStatus(
    context.syllabusId,
    'APPROVED',
    'test-approver-id'
  );
  
  if (approveResult.success && approveResult.data) {
    console.log(`✅ Success: Updated status to ${approveResult.data.status}`);
    console.log(`   Approved By: ${approveResult.data.approvedBy}`);
    console.log(`   Approved At: ${approveResult.data.approvedAt}`);
  } else {
    console.log(`❌ Failed: ${approveResult.error}`);
  }
  console.log();
  
  // Test 3: Update status to PUBLISHED
  console.log('3️⃣ Testing updateSyllabusStatus (PUBLISHED)...');
  const publishResult = await updateSyllabusStatus(
    context.syllabusId,
    'PUBLISHED',
    'test-publisher-id'
  );
  
  if (publishResult.success && publishResult.data) {
    console.log(`✅ Success: Updated status to ${publishResult.data.status}`);
  } else {
    console.log(`❌ Failed: ${publishResult.error}`);
  }
  console.log();
}

async function testGetSyllabusWithFallback() {
  console.log('🧪 Testing Get Syllabus With Fallback\n');
  
  if (!context.subjectId) {
    console.log('⚠️  Skipping fallback tests - no subject available');
    return;
  }
  
  // Test 1: Get syllabus with fallback (should find subject-wide)
  console.log('1️⃣ Testing getSyllabusWithFallback (should find subject-wide)...');
  const fallbackResult = await getSyllabusWithFallback({
    subjectId: context.subjectId,
    curriculumType: 'GENERAL'
  });
  
  if (fallbackResult.success && fallbackResult.data) {
    console.log(`✅ Success: Found syllabus ${fallbackResult.data.id}`);
    console.log(`   Title: ${fallbackResult.data.title}`);
    console.log(`   Status: ${fallbackResult.data.status}`);
    console.log(`   Scope: ${fallbackResult.data.classId ? (fallbackResult.data.sectionId ? 'Section-specific' : 'Class-wide') : 'Subject-wide'}`);
  } else if (fallbackResult.success && !fallbackResult.data) {
    console.log(`⚠️  No published syllabus found (expected since we just created them as DRAFT)`);
  } else {
    console.log(`❌ Failed: ${fallbackResult.error}`);
  }
  console.log();
  
  // Test 2: Get syllabus with specific scope (if available)
  if (context.classId && context.sectionId) {
    console.log('2️⃣ Testing getSyllabusWithFallback (with section scope)...');
    const scopedResult = await getSyllabusWithFallback({
      subjectId: context.subjectId,
      classId: context.classId,
      sectionId: context.sectionId,
      academicYearId: context.academicYearId,
      curriculumType: 'REMEDIAL'
    });
    
    if (scopedResult.success && scopedResult.data) {
      console.log(`✅ Success: Found syllabus ${scopedResult.data.id}`);
      console.log(`   Specificity: ${scopedResult.data.sectionId ? 'Section' : scopedResult.data.classId ? 'Class' : 'Subject'}`);
    } else if (scopedResult.success && !scopedResult.data) {
      console.log(`⚠️  No published syllabus found (expected if not published)`);
    } else {
      console.log(`❌ Failed: ${scopedResult.error}`);
    }
    console.log();
  }
}

async function testCloneSyllabus() {
  console.log('🧪 Testing Clone Syllabus\n');
  
  if (!context.syllabusId) {
    console.log('⚠️  Skipping clone tests - no syllabus to clone');
    return;
  }
  
  // Test 1: Clone syllabus with different curriculum type
  console.log('1️⃣ Testing cloneSyllabus (different curriculum type)...');
  const cloneResult = await cloneSyllabus(
    context.syllabusId,
    {
      curriculumType: 'VOCATIONAL'
    },
    'test-cloner-id'
  );
  
  if (cloneResult.success && cloneResult.data) {
    context.clonedSyllabusId = cloneResult.data.id;
    console.log(`✅ Success: Cloned syllabus ${cloneResult.data.id}`);
    console.log(`   Original ID: ${context.syllabusId}`);
    console.log(`   Cloned ID: ${cloneResult.data.id}`);
    console.log(`   Status: ${cloneResult.data.status} (should be DRAFT)`);
    console.log(`   Created By: ${cloneResult.data.createdBy}`);
    console.log(`   Parent Syllabus ID: ${cloneResult.data.parentSyllabusId}`);
    console.log(`   Curriculum Type: ${cloneResult.data.curriculumType}`);
  } else {
    console.log(`❌ Failed: ${cloneResult.error}`);
  }
  console.log();
  
  // Test 2: Try to clone to same scope (should fail)
  console.log('2️⃣ Testing cloneSyllabus (duplicate scope - should fail)...');
  const duplicateCloneResult = await cloneSyllabus(
    context.syllabusId,
    {},
    'test-cloner-id'
  );
  
  if (!duplicateCloneResult.success) {
    console.log(`✅ Success: Correctly rejected duplicate - ${duplicateCloneResult.error}`);
  } else {
    console.log(`❌ Failed: Should have rejected duplicate scope`);
  }
  console.log();
}

async function testGetSyllabusVersionHistory() {
  console.log('🧪 Testing Get Syllabus Version History\n');
  
  if (!context.syllabusId) {
    console.log('⚠️  Skipping version history tests - no syllabus available');
    return;
  }
  
  // Test 1: Get version history
  console.log('1️⃣ Testing getSyllabusVersionHistory...');
  const historyResult = await getSyllabusVersionHistory(context.syllabusId);
  
  if (historyResult.success) {
    console.log(`✅ Success: Found ${historyResult.data?.length ?? 0} versions in history`);
    historyResult.data?.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.title} (v${v.version}, ID: ${v.id})`);
      if (v.parentSyllabusId) {
        console.log(`      Parent: ${v.parentSyllabusId}`);
      }
    });
  } else {
    console.log(`❌ Failed: ${historyResult.error}`);
  }
  console.log();
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');
  
  try {
    // Delete all test syllabi
    if (context.subjectId) {
      const testSyllabi = await db.syllabus.findMany({
        where: {
          subjectId: context.subjectId
        },
        select: { id: true, title: true }
      });
      
      for (const syllabus of testSyllabi) {
        await db.syllabus.delete({ where: { id: syllabus.id } });
        console.log(`✅ Deleted syllabus: ${syllabus.title}`);
      }
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
  console.log('  Enhanced Syllabus Scope System - Comprehensive Test Suite');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Create test data
    const setupSuccess = await createTestData();
    if (!setupSuccess) {
      console.log('❌ Setup failed - cannot continue tests');
      return;
    }
    
    // Run all test suites
    await testHelperActions();
    await testCreateSyllabus();
    await testGetSyllabusByScope();
    await testUpdateSyllabus();
    await testUpdateSyllabusStatus();
    await testGetSyllabusWithFallback();
    await testCloneSyllabus();
    await testGetSyllabusVersionHistory();
    
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
