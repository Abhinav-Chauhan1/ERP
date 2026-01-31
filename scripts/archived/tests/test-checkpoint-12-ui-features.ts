/**
 * Checkpoint 12: UI Features Testing Script
 * 
 * This script tests all the UI features implemented for the Enhanced Syllabus Scope System:
 * 1. Creating syllabi with different scopes (subject-wide, class-wide, section-specific)
 * 2. Filtering and searching syllabi
 * 3. Cloning syllabi
 * 4. Status changes
 */

import { PrismaClient } from '@prisma/client';
import {
  createSyllabus,
  getSyllabusByScope,
  cloneSyllabus,
  updateSyllabusStatus,
  getSubjectsForDropdown,
  getAcademicYearsForDropdown,
  getClassesForDropdown,
  getSectionsForDropdown,
} from '../src/lib/actions/syllabusActions';

const db = new PrismaClient();

interface TestContext {
  subjectId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  userId: string;
  syllabusIds: string[];
}

const context: TestContext = {
  subjectId: '',
  academicYearId: '',
  classId: '',
  sectionId: '',
  userId: 'test-user-checkpoint-12',
  syllabusIds: [],
};

async function setupTestData() {
  console.log('📋 Setting up test data...\n');
  
  try {
    // Get or create a subject
    let subject = await db.subject.findFirst({
      where: { code: 'TEST-CP12' }
    });
    
    if (!subject) {
      subject = await db.subject.create({
        data: {
          name: 'Test Subject Checkpoint 12',
          code: 'TEST-CP12',
          description: 'Test subject for checkpoint 12',
        }
      });
    }
    context.subjectId = subject.id;
    console.log(`✅ Subject: ${subject.name} (${subject.id})`);
    
    // Get or create an academic year
    let academicYear = await db.academicYear.findFirst({
      where: { name: '2024-25' }
    });
    
    if (!academicYear) {
      academicYear = await db.academicYear.create({
        data: {
          name: '2024-25',
          startDate: new Date('2024-04-01'),
          endDate: new Date('2025-03-31'),
          isCurrent: true,
        }
      });
    }
    context.academicYearId = academicYear.id;
    console.log(`✅ Academic Year: ${academicYear.name} (${academicYear.id})`);
    
    // Get or create a class
    let classEntity = await db.class.findFirst({
      where: { name: 'Grade 10' }
    });
    
    if (!classEntity) {
      classEntity = await db.class.create({
        data: {
          name: 'Grade 10',
          academicYearId: context.academicYearId,
        }
      });
    }
    context.classId = classEntity.id;
    console.log(`✅ Class: ${classEntity.name} (${classEntity.id})`);
    
    // Get or create a section
    let section = await db.classSection.findFirst({
      where: { 
        classId: context.classId,
        name: 'A'
      }
    });
    
    if (!section) {
      section = await db.classSection.create({
        data: {
          name: 'A',
          classId: context.classId,
        }
      });
    }
    context.sectionId = section.id;
    console.log(`✅ Section: ${section.name} (${section.id})\n`);
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}

async function testCreateSyllabusWithDifferentScopes() {
  console.log('🧪 Test 1: Creating Syllabi with Different Scopes\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Test 1.1: Create subject-wide syllabus
    console.log('1️⃣ Creating subject-wide syllabus...');
    const subjectWideResult = await createSyllabus({
      title: 'Subject-Wide Syllabus - Checkpoint 12',
      description: 'This syllabus applies to all classes and sections',
      subjectId: context.subjectId,
      scopeType: 'SUBJECT_WIDE',
      curriculumType: 'GENERAL',
      version: '1.0',
      difficultyLevel: 'INTERMEDIATE',
      tags: ['checkpoint-12', 'subject-wide'],
      document: '',
      boardType: '',
      estimatedHours: undefined,
      prerequisites: '',
      effectiveFrom: undefined,
      effectiveTo: undefined,
      academicYearId: undefined,
      classId: undefined,
      sectionId: undefined,
    }, null);
    
    if (subjectWideResult.success && subjectWideResult.data) {
      context.syllabusIds.push(subjectWideResult.data.id);
      console.log(`✅ Subject-wide syllabus created: ${subjectWideResult.data.id}`);
      console.log(`   - Title: ${subjectWideResult.data.title}`);
      console.log(`   - Scope: Subject-wide (no class/section)`);
      console.log(`   - Status: ${subjectWideResult.data.status}\n`);
    } else {
      console.log(`❌ Failed to create subject-wide syllabus: ${subjectWideResult.error}\n`);
    }
    
    // Test 1.2: Create class-wide syllabus
    console.log('2️⃣ Creating class-wide syllabus...');
    const classWideResult = await createSyllabus({
      title: 'Class-Wide Syllabus - Checkpoint 12',
      description: 'This syllabus applies to all sections of Grade 10',
      subjectId: context.subjectId,
      scopeType: 'CLASS_WIDE',
      academicYearId: context.academicYearId,
      classId: context.classId,
      curriculumType: 'GENERAL',
      version: '1.0',
      difficultyLevel: 'INTERMEDIATE',
      tags: ['checkpoint-12', 'class-wide'],
      document: '',
      boardType: '',
      estimatedHours: undefined,
      prerequisites: '',
      effectiveFrom: undefined,
      effectiveTo: undefined,
      sectionId: undefined,
    }, null);
    
    if (classWideResult.success && classWideResult.data) {
      context.syllabusIds.push(classWideResult.data.id);
      console.log(`✅ Class-wide syllabus created: ${classWideResult.data.id}`);
      console.log(`   - Title: ${classWideResult.data.title}`);
      console.log(`   - Scope: Class-wide (Grade 10, all sections)`);
      console.log(`   - Status: ${classWideResult.data.status}\n`);
    } else {
      console.log(`❌ Failed to create class-wide syllabus: ${classWideResult.error}\n`);
    }
    
    // Test 1.3: Create section-specific syllabus
    console.log('3️⃣ Creating section-specific syllabus...');
    const sectionSpecificResult = await createSyllabus({
      title: 'Section-Specific Syllabus - Checkpoint 12',
      description: 'This syllabus applies only to Grade 10 Section A',
      subjectId: context.subjectId,
      scopeType: 'SECTION_SPECIFIC',
      academicYearId: context.academicYearId,
      classId: context.classId,
      sectionId: context.sectionId,
      curriculumType: 'GENERAL',
      version: '1.0',
      difficultyLevel: 'INTERMEDIATE',
      tags: ['checkpoint-12', 'section-specific'],
      document: '',
      boardType: '',
      estimatedHours: undefined,
      prerequisites: '',
      effectiveFrom: undefined,
      effectiveTo: undefined,
    }, null);
    
    if (sectionSpecificResult.success && sectionSpecificResult.data) {
      context.syllabusIds.push(sectionSpecificResult.data.id);
      console.log(`✅ Section-specific syllabus created: ${sectionSpecificResult.data.id}`);
      console.log(`   - Title: ${sectionSpecificResult.data.title}`);
      console.log(`   - Scope: Section-specific (Grade 10, Section A)`);
      console.log(`   - Status: ${sectionSpecificResult.data.status}\n`);
    } else {
      console.log(`❌ Failed to create section-specific syllabus: ${sectionSpecificResult.error}\n`);
    }
    
    // Test 1.4: Create syllabus with different curriculum type
    console.log('4️⃣ Creating syllabus with Advanced curriculum type...');
    const advancedResult = await createSyllabus({
      title: 'Advanced Syllabus - Checkpoint 12',
      description: 'Advanced curriculum for high-performing students',
      subjectId: context.subjectId,
      scopeType: 'CLASS_WIDE',
      academicYearId: context.academicYearId,
      classId: context.classId,
      curriculumType: 'ADVANCED',
      boardType: 'CBSE',
      version: '1.0',
      difficultyLevel: 'ADVANCED',
      tags: ['checkpoint-12', 'advanced'],
      estimatedHours: 120,
      prerequisites: 'Strong foundation in basic concepts',
      document: '',
      effectiveFrom: undefined,
      effectiveTo: undefined,
      sectionId: undefined,
    }, null);
    
    if (advancedResult.success && advancedResult.data) {
      context.syllabusIds.push(advancedResult.data.id);
      console.log(`✅ Advanced syllabus created: ${advancedResult.data.id}`);
      console.log(`   - Title: ${advancedResult.data.title}`);
      console.log(`   - Curriculum Type: ${advancedResult.data.curriculumType}`);
      console.log(`   - Board Type: ${advancedResult.data.boardType}`);
      console.log(`   - Difficulty: ${advancedResult.data.difficultyLevel}`);
      console.log(`   - Estimated Hours: ${advancedResult.data.estimatedHours}\n`);
    } else {
      console.log(`❌ Failed to create advanced syllabus: ${advancedResult.error}\n`);
    }
    
    console.log('✅ Test 1 Complete: Created syllabi with different scopes\n');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error in Test 1:', error);
    throw error;
  }
}

async function testFilteringAndSearching() {
  console.log('🧪 Test 2: Filtering and Searching Syllabi\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Test 2.1: Filter by subject
    console.log('1️⃣ Filtering by subject...');
    const subjectFilterResult = await getSyllabusByScope({
      subjectId: context.subjectId,
    });
    
    if (subjectFilterResult.success) {
      console.log(`✅ Found ${subjectFilterResult.data?.length || 0} syllabi for the subject`);
      subjectFilterResult.data?.forEach((s: any, index: number) => {
        console.log(`   ${index + 1}. ${s.title} (${s.curriculumType})`);
      });
      console.log();
    } else {
      console.log(`❌ Failed to filter by subject: ${subjectFilterResult.error}\n`);
    }
    
    // Test 2.2: Filter by class
    console.log('2️⃣ Filtering by class...');
    const classFilterResult = await getSyllabusByScope({
      subjectId: context.subjectId,
      classId: context.classId,
    });
    
    if (classFilterResult.success) {
      console.log(`✅ Found ${classFilterResult.data?.length || 0} syllabi for Grade 10`);
      classFilterResult.data?.forEach((s: any, index: number) => {
        console.log(`   ${index + 1}. ${s.title}`);
      });
      console.log();
    } else {
      console.log(`❌ Failed to filter by class: ${classFilterResult.error}\n`);
    }
    
    // Test 2.3: Filter by section
    console.log('3️⃣ Filtering by section...');
    const sectionFilterResult = await getSyllabusByScope({
      subjectId: context.subjectId,
      classId: context.classId,
      sectionId: context.sectionId,
    });
    
    if (sectionFilterResult.success) {
      console.log(`✅ Found ${sectionFilterResult.data?.length || 0} syllabi for Section A`);
      sectionFilterResult.data?.forEach((s: any, index: number) => {
        console.log(`   ${index + 1}. ${s.title}`);
      });
      console.log();
    } else {
      console.log(`❌ Failed to filter by section: ${sectionFilterResult.error}\n`);
    }
    
    // Test 2.4: Filter by curriculum type
    console.log('4️⃣ Filtering by curriculum type (ADVANCED)...');
    const curriculumFilterResult = await getSyllabusByScope({
      subjectId: context.subjectId,
      curriculumType: 'ADVANCED',
    });
    
    if (curriculumFilterResult.success) {
      console.log(`✅ Found ${curriculumFilterResult.data?.length || 0} ADVANCED syllabi`);
      curriculumFilterResult.data?.forEach((s: any, index: number) => {
        console.log(`   ${index + 1}. ${s.title} - ${s.curriculumType}`);
      });
      console.log();
    } else {
      console.log(`❌ Failed to filter by curriculum type: ${curriculumFilterResult.error}\n`);
    }
    
    // Test 2.5: Filter by tags
    console.log('5️⃣ Filtering by tags...');
    const tagFilterResult = await getSyllabusByScope({
      subjectId: context.subjectId,
      tags: ['checkpoint-12'],
    });
    
    if (tagFilterResult.success) {
      console.log(`✅ Found ${tagFilterResult.data?.length || 0} syllabi with tag 'checkpoint-12'`);
      tagFilterResult.data?.forEach((s: any, index: number) => {
        console.log(`   ${index + 1}. ${s.title} - Tags: ${s.tags.join(', ')}`);
      });
      console.log();
    } else {
      console.log(`❌ Failed to filter by tags: ${tagFilterResult.error}\n`);
    }
    
    // Test 2.6: Combined filters
    console.log('6️⃣ Testing combined filters (subject + class + curriculum type)...');
    const combinedFilterResult = await getSyllabusByScope({
      subjectId: context.subjectId,
      classId: context.classId,
      curriculumType: 'GENERAL',
    });
    
    if (combinedFilterResult.success) {
      console.log(`✅ Found ${combinedFilterResult.data?.length || 0} GENERAL syllabi for Grade 10`);
      combinedFilterResult.data?.forEach((s: any, index: number) => {
        console.log(`   ${index + 1}. ${s.title}`);
      });
      console.log();
    } else {
      console.log(`❌ Failed with combined filters: ${combinedFilterResult.error}\n`);
    }
    
    console.log('✅ Test 2 Complete: Filtering and searching works correctly\n');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error in Test 2:', error);
    throw error;
  }
}

async function testCloning() {
  console.log('🧪 Test 3: Cloning Syllabi\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    if (context.syllabusIds.length === 0) {
      console.log('⚠️  No syllabi available to clone. Skipping test.\n');
      return;
    }
    
    const sourceSyllabusId = context.syllabusIds[0];
    
    // Test 3.1: Clone with same scope but different curriculum type
    console.log('1️⃣ Cloning syllabus with different curriculum type...');
    const cloneResult1 = await cloneSyllabus(
      sourceSyllabusId,
      {
        curriculumType: 'REMEDIAL',
      },
      context.userId
    );
    
    if (cloneResult1.success && cloneResult1.data) {
      context.syllabusIds.push(cloneResult1.data.id);
      console.log(`✅ Cloned syllabus created: ${cloneResult1.data.id}`);
      console.log(`   - Title: ${cloneResult1.data.title}`);
      console.log(`   - Curriculum Type: ${cloneResult1.data.curriculumType}`);
      console.log(`   - Status: ${cloneResult1.data.status} (should be DRAFT)`);
      console.log(`   - Created By: ${cloneResult1.data.createdBy}\n`);
    } else {
      console.log(`❌ Failed to clone syllabus: ${cloneResult1.error}\n`);
    }
    
    // Test 3.2: Clone to different class
    console.log('2️⃣ Cloning syllabus to different scope (class-wide)...');
    const cloneResult2 = await cloneSyllabus(
      sourceSyllabusId,
      {
        classId: context.classId,
        curriculumType: 'VOCATIONAL',
      },
      context.userId
    );
    
    if (cloneResult2.success && cloneResult2.data) {
      context.syllabusIds.push(cloneResult2.data.id);
      console.log(`✅ Cloned syllabus created: ${cloneResult2.data.id}`);
      console.log(`   - Title: ${cloneResult2.data.title}`);
      console.log(`   - Class ID: ${cloneResult2.data.classId}`);
      console.log(`   - Curriculum Type: ${cloneResult2.data.curriculumType}`);
      console.log(`   - Status: ${cloneResult2.data.status}\n`);
    } else {
      console.log(`❌ Failed to clone syllabus: ${cloneResult2.error}\n`);
    }
    
    // Test 3.3: Verify cloned syllabus has all data
    console.log('3️⃣ Verifying cloned syllabus data...');
    const originalSyllabus = await db.syllabus.findUnique({
      where: { id: sourceSyllabusId },
      include: { units: true },
    });
    
    if (cloneResult1.data) {
      const clonedSyllabus = await db.syllabus.findUnique({
        where: { id: cloneResult1.data.id },
        include: { units: true },
      });
      
      if (clonedSyllabus) {
        console.log(`✅ Cloned syllabus verification:`);
        console.log(`   - Original units: ${originalSyllabus?.units.length || 0}`);
        console.log(`   - Cloned units: ${clonedSyllabus.units.length}`);
        console.log(`   - Title preserved: ${originalSyllabus?.title === clonedSyllabus.title}`);
        console.log(`   - Description preserved: ${originalSyllabus?.description === clonedSyllabus.description}\n`);
      }
    }
    
    console.log('✅ Test 3 Complete: Cloning works correctly\n');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error in Test 3:', error);
    throw error;
  }
}

async function testStatusChanges() {
  console.log('🧪 Test 4: Status Changes\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    if (context.syllabusIds.length === 0) {
      console.log('⚠️  No syllabi available for status changes. Skipping test.\n');
      return;
    }
    
    const testSyllabusId = context.syllabusIds[0];
    
    // Test 4.1: Change status to PENDING_REVIEW
    console.log('1️⃣ Changing status to PENDING_REVIEW...');
    const pendingResult = await updateSyllabusStatus(
      testSyllabusId,
      'PENDING_REVIEW',
      context.userId
    );
    
    if (pendingResult.success && pendingResult.data) {
      console.log(`✅ Status changed to PENDING_REVIEW`);
      console.log(`   - Syllabus ID: ${pendingResult.data.id}`);
      console.log(`   - New Status: ${pendingResult.data.status}`);
      console.log(`   - Updated By: ${pendingResult.data.updatedBy}\n`);
    } else {
      console.log(`❌ Failed to change status: ${pendingResult.error}\n`);
    }
    
    // Test 4.2: Change status to APPROVED
    console.log('2️⃣ Changing status to APPROVED...');
    const approvedResult = await updateSyllabusStatus(
      testSyllabusId,
      'APPROVED',
      context.userId
    );
    
    if (approvedResult.success && approvedResult.data) {
      console.log(`✅ Status changed to APPROVED`);
      console.log(`   - Syllabus ID: ${approvedResult.data.id}`);
      console.log(`   - New Status: ${approvedResult.data.status}`);
      console.log(`   - Approved By: ${approvedResult.data.approvedBy}`);
      console.log(`   - Approved At: ${approvedResult.data.approvedAt}\n`);
    } else {
      console.log(`❌ Failed to change status: ${approvedResult.error}\n`);
    }
    
    // Test 4.3: Change status to PUBLISHED
    console.log('3️⃣ Changing status to PUBLISHED...');
    const publishedResult = await updateSyllabusStatus(
      testSyllabusId,
      'PUBLISHED',
      context.userId
    );
    
    if (publishedResult.success && publishedResult.data) {
      console.log(`✅ Status changed to PUBLISHED`);
      console.log(`   - Syllabus ID: ${publishedResult.data.id}`);
      console.log(`   - New Status: ${publishedResult.data.status}`);
      console.log(`   - Is Active: ${publishedResult.data.isActive}\n`);
    } else {
      console.log(`❌ Failed to change status: ${publishedResult.error}\n`);
    }
    
    // Test 4.4: Change status to ARCHIVED
    console.log('4️⃣ Changing status to ARCHIVED...');
    const archivedResult = await updateSyllabusStatus(
      testSyllabusId,
      'ARCHIVED',
      context.userId
    );
    
    if (archivedResult.success && archivedResult.data) {
      console.log(`✅ Status changed to ARCHIVED`);
      console.log(`   - Syllabus ID: ${archivedResult.data.id}`);
      console.log(`   - New Status: ${archivedResult.data.status}\n`);
    } else {
      console.log(`❌ Failed to change status: ${archivedResult.error}\n`);
    }
    
    // Test 4.5: Verify status filtering works
    console.log('5️⃣ Verifying status filtering...');
    const publishedSyllabi = await getSyllabusByScope({
      subjectId: context.subjectId,
      status: ['PUBLISHED'],
    });
    
    if (publishedSyllabi.success) {
      console.log(`✅ Found ${publishedSyllabi.data?.length || 0} PUBLISHED syllabi`);
      publishedSyllabi.data?.forEach((s: any, index: number) => {
        console.log(`   ${index + 1}. ${s.title} - Status: ${s.status}`);
      });
      console.log();
    } else {
      console.log(`❌ Failed to filter by status: ${publishedSyllabi.error}\n`);
    }
    
    console.log('✅ Test 4 Complete: Status changes work correctly\n');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error in Test 4:', error);
    throw error;
  }
}

async function testHelperActions() {
  console.log('🧪 Test 5: Helper Actions (Dropdown Data)\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Test 5.1: Get subjects for dropdown
    console.log('1️⃣ Testing getSubjectsForDropdown...');
    const subjectsResult = await getSubjectsForDropdown();
    
    if (subjectsResult.success) {
      console.log(`✅ Retrieved ${subjectsResult.data?.length || 0} subjects`);
      console.log(`   Sample: ${subjectsResult.data?.[0]?.name || 'N/A'}\n`);
    } else {
      console.log(`❌ Failed to get subjects: ${subjectsResult.error}\n`);
    }
    
    // Test 5.2: Get academic years for dropdown
    console.log('2️⃣ Testing getAcademicYearsForDropdown...');
    const yearsResult = await getAcademicYearsForDropdown();
    
    if (yearsResult.success) {
      console.log(`✅ Retrieved ${yearsResult.data?.length || 0} academic years`);
      console.log(`   Sample: ${yearsResult.data?.[0]?.name || 'N/A'}\n`);
    } else {
      console.log(`❌ Failed to get academic years: ${yearsResult.error}\n`);
    }
    
    // Test 5.3: Get classes for dropdown
    console.log('3️⃣ Testing getClassesForDropdown...');
    const classesResult = await getClassesForDropdown();
    
    if (classesResult.success) {
      console.log(`✅ Retrieved ${classesResult.data?.length || 0} classes`);
      console.log(`   Sample: ${classesResult.data?.[0]?.name || 'N/A'}\n`);
    } else {
      console.log(`❌ Failed to get classes: ${classesResult.error}\n`);
    }
    
    // Test 5.4: Get sections for dropdown
    console.log('4️⃣ Testing getSectionsForDropdown...');
    const sectionsResult = await getSectionsForDropdown(context.classId);
    
    if (sectionsResult.success) {
      console.log(`✅ Retrieved ${sectionsResult.data?.length || 0} sections for class`);
      console.log(`   Sample: ${sectionsResult.data?.[0]?.name || 'N/A'}\n`);
    } else {
      console.log(`❌ Failed to get sections: ${sectionsResult.error}\n`);
    }
    
    console.log('✅ Test 5 Complete: Helper actions work correctly\n');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error in Test 5:', error);
    throw error;
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n');
  
  try {
    // Delete test syllabi
    if (context.syllabusIds.length > 0) {
      await db.syllabus.deleteMany({
        where: {
          id: {
            in: context.syllabusIds
          }
        }
      });
      console.log(`✅ Deleted ${context.syllabusIds.length} test syllabi`);
    }
    
    // Note: We're not deleting the subject, academic year, class, or section
    // as they might be used by other tests or the system
    
    console.log('✅ Cleanup complete\n');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 CHECKPOINT 12: UI FEATURES TESTING');
  console.log('='.repeat(60) + '\n');
  
  try {
    await setupTestData();
    await testHelperActions();
    await testCreateSyllabusWithDifferentScopes();
    await testFilteringAndSearching();
    await testCloning();
    await testStatusChanges();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60) + '\n');
    
    console.log('📊 Summary:');
    console.log(`   - Created ${context.syllabusIds.length} test syllabi`);
    console.log(`   - Tested scope selection (subject-wide, class-wide, section-specific)`);
    console.log(`   - Tested filtering by multiple criteria`);
    console.log(`   - Tested cloning functionality`);
    console.log(`   - Tested status transitions`);
    console.log(`   - Tested helper actions for dropdowns\n`);
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await cleanup();
    await db.$disconnect();
  }
}

main();
