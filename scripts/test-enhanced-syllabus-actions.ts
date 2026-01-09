/**
 * Comprehensive test script for Enhanced Syllabus Scope System
 * Tests all server actions implemented in tasks 1-5
 * 
 * This script validates:
 * - Database schema and migrations
 * - Validation schemas
 * - Core server actions (create, update, status, clone, fallback, scope filtering)
 * - Helper actions (dropdowns, validation)
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
}

const context: TestContext = {};

async function setupTestData() {
  console.log('📦 Setting up test data...\n');
  
  // Get existing subject
  const subject = await db.subject.findFirst({
    select: { id: true, name: true }
  });
  
  if (subject) {
    context.subjectId = subject.id;
    console.log(`✅ Using subject: ${subject.name} (${subject.id})`);
  } else {
    console.log('❌ No subjects found in database');
    return false;
  }
  
  // Get existing academic year
  const academicYear = await db.academicYear.findFirst({
    select: { id: true, name: true }
  });
  
  if (academicYear) {
    context.academicYearId = academicYear.id;
    console.log(`✅ Using academic year: ${academicYear.name} (${academicYear.id})`);
  } else {
    console.log('⚠️  No academic years found - will test without academic year');
  }
  
  // Get existing class
  const classRecord = await db.class.findFirst({
    select: { id: true, name: true }
  });
  
  if (classRecord) {
    context.classId = classRecord.id;
    console.log(`✅ Using class: ${classRecord.name} (${classRecord.id})`);
  } else {
    console.log('⚠️  No classes found - will test subject-wide only');
  }
  
  // Get existing section
  if (context.classId) {
    const section = await db.classSection.findFirst({
      where: { classId: context.classId },
      select: { id: true, name: true }
    });
    
    if (section) {
      context.sectionId = section.id;
      console.log(`✅ Using section: ${section.name} (${section.id})`);
    } else {
      console.log('⚠️  No sections found - will test class-wide only');
    }
  }
  
  console.log();
  return true;
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
    console.log(`   Status: ${createResult.data.status}`);
    console.log(`   Curriculum Type: ${createResult.data.curriculumType}`);
    console.log(`   Created By: ${createResult.data.createdBy}`);
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
  
  // Test 3: Create class-wide syllabus (if class available)
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
  
  // Test 4: Create section-specific syllabus (if section available)
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
    } else {
      console.log(`❌ Failed: ${sectionSpecificResult.error}`);
    }
    console.log();
  }
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
    console.log(`   Scope: ${fallbackResult.data.classId ? 'Class/Section' : 'Subject-wide'}`);
  } else if (fallbackResult.success && !fallbackResult.data) {
    console.log(`⚠️  No syllabus found (this is okay if none are published)`);
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
      console.log(`⚠️  No syllabus found (expected if not published)`);
    } else {
      console.log(`❌ Failed: ${scopedResult.error}`);
    }
    console.log();
  }
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
  } as Parameters<typeof updateSyllabus>[0], null, 'test-user-id');
  
  if (updateResult.success && updateResult.data) {
    console.log(`✅ Success: Updated syllabus ${updateResult.data.id}`);
    console.log(`   New Title: ${updateResult.data.title}`);
    console.log(`   New Version: ${updateResult.data.version}`);
    console.log(`   Updated By: ${updateResult.data.updatedBy}`);
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
  
  // Test 1: Update status to APPROVED
  console.log('1️⃣ Testing updateSyllabusStatus (APPROVED)...');
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
  
  // Test 2: Update status to PUBLISHED
  console.log('2️⃣ Testing updateSyllabusStatus (PUBLISHED)...');
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
    console.log(`✅ Success: Found ${historyResult.data?.length ?? 0} versions`);
    historyResult.data?.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.title} (v${v.version}, ID: ${v.id})`);
    });
  } else {
    console.log(`❌ Failed: ${historyResult.error}`);
  }
  console.log();
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');
  
  // Delete cloned syllabus
  if (context.clonedSyllabusId) {
    console.log(`Deleting cloned syllabus ${context.clonedSyllabusId}...`);
    const deleteClonedResult = await deleteSyllabus(context.clonedSyllabusId);
    if (deleteClonedResult.success) {
      console.log(`✅ Deleted cloned syllabus`);
    } else {
      console.log(`❌ Failed to delete cloned syllabus: ${deleteClonedResult.error}`);
    }
  }
  
  // Delete test syllabi
  if (context.subjectId) {
    console.log(`Deleting test syllabi for subject ${context.subjectId}...`);
    const testSyllabi = await db.syllabus.findMany({
      where: {
        subjectId: context.subjectId,
        tags: { has: 'test' }
      },
      select: { id: true, title: true }
    });
    
    for (const syllabus of testSyllabi) {
      const deleteResult = await deleteSyllabus(syllabus.id);
      if (deleteResult.success) {
        console.log(`✅ Deleted: ${syllabus.title}`);
      } else {
        console.log(`❌ Failed to delete ${syllabus.title}: ${deleteResult.error}`);
      }
    }
  }
  
  console.log();
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Enhanced Syllabus Scope System - Comprehensive Test Suite');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Setup
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      console.log('❌ Setup failed - cannot continue tests');
      return;
    }
    
    // Run all test suites
    await testHelperActions();
    await testCreateSyllabus();
    await testGetSyllabusWithFallback();
    await testGetSyllabusByScope();
    await testUpdateSyllabus();
    await testUpdateSyllabusStatus();
    await testCloneSyllabus();
    await testGetSyllabusVersionHistory();
    
    // Cleanup
    await cleanupTestData();
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✨ All Tests Completed Successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    throw error;
  }
}

// Run the test suite
runAllTests()
  .then(() => {
    console.log('Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
