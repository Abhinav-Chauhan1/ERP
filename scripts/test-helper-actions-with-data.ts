/**
 * Comprehensive test script for syllabus helper actions with database setup
 * Creates test data and validates all helper functions
 */

import { db } from '../src/lib/db';
import { 
  getAcademicYearsForDropdown,
  getClassesForDropdown,
  getSectionsForDropdown,
  validateSyllabusScope,
  getSubjectsForDropdown
} from '../src/lib/actions/syllabusActions';

async function setupTestData() {
  console.log('📦 Setting up test data...\n');
  
  // Create academic year
  const academicYear = await db.academicYear.create({
    data: {
      name: '2024-25',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isCurrent: true,
    }
  });
  console.log(`✅ Created academic year: ${academicYear.name}`);
  
  // Create class
  const classRecord = await db.class.create({
    data: {
      name: 'Grade 10',
      academicYearId: academicYear.id,
    }
  });
  console.log(`✅ Created class: ${classRecord.name}`);
  
  // Create sections
  const sectionA = await db.classSection.create({
    data: {
      name: 'Section A',
      classId: classRecord.id,
      capacity: 40,
    }
  });
  console.log(`✅ Created section: ${sectionA.name}`);
  
  const sectionB = await db.classSection.create({
    data: {
      name: 'Section B',
      classId: classRecord.id,
      capacity: 40,
    }
  });
  console.log(`✅ Created section: ${sectionB.name}`);
  
  // Create department
  const department = await db.department.create({
    data: {
      name: 'Science',
      description: 'Science Department',
    }
  });
  
  // Create subject
  const subject = await db.subject.create({
    data: {
      name: 'Mathematics',
      code: 'MATH101',
      departmentId: department.id,
    }
  });
  console.log(`✅ Created subject: ${subject.name}`);
  
  console.log('\n✨ Test data setup complete!\n');
  
  return {
    academicYear,
    classRecord,
    sectionA,
    sectionB,
    subject,
  };
}

async function cleanupTestData(testData: any) {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order of dependencies
    if (testData.sectionA) {
      await db.classSection.delete({ where: { id: testData.sectionA.id } });
    }
    if (testData.sectionB) {
      await db.classSection.delete({ where: { id: testData.sectionB.id } });
    }
    if (testData.classRecord) {
      await db.class.delete({ where: { id: testData.classRecord.id } });
    }
    if (testData.academicYear) {
      await db.academicYear.delete({ where: { id: testData.academicYear.id } });
    }
    if (testData.subject) {
      await db.subject.delete({ where: { id: testData.subject.id } });
      await db.department.deleteMany({ where: { name: 'Science' } });
    }
    
    console.log('✅ Test data cleaned up successfully\n');
  } catch (error) {
    console.error('⚠️  Error during cleanup:', error);
  }
}

async function runTests() {
  console.log('🧪 Testing Syllabus Helper Actions with Real Data\n');
  console.log('='.repeat(60) + '\n');
  
  let testData: any = null;
  
  try {
    // Setup test data
    testData = await setupTestData();
    
    // Test 1: Get Academic Years for Dropdown
    console.log('TEST 1: getAcademicYearsForDropdown');
    console.log('-'.repeat(60));
    const academicYearsResult = await getAcademicYearsForDropdown();
    if (academicYearsResult.success) {
      console.log(`✅ Success: Found ${academicYearsResult.data?.length ?? 0} academic years`);
      const found = academicYearsResult.data?.find(ay => ay.id === testData.academicYear.id);
      if (found) {
        console.log(`✅ Test academic year found: ${found.name}`);
      } else {
        console.log(`❌ Test academic year not found in results`);
      }
    } else {
      console.log(`❌ Failed: ${academicYearsResult.error}`);
    }
    console.log();
    
    // Test 2: Get Classes for Dropdown (without filter)
    console.log('TEST 2: getClassesForDropdown (no filter)');
    console.log('-'.repeat(60));
    const classesResult = await getClassesForDropdown();
    if (classesResult.success) {
      console.log(`✅ Success: Found ${classesResult.data?.length ?? 0} classes`);
      const found = classesResult.data?.find(c => c.id === testData.classRecord.id);
      if (found) {
        console.log(`✅ Test class found: ${found.name}`);
      } else {
        console.log(`❌ Test class not found in results`);
      }
    } else {
      console.log(`❌ Failed: ${classesResult.error}`);
    }
    console.log();
    
    // Test 3: Get Classes for Dropdown (with academic year filter)
    console.log('TEST 3: getClassesForDropdown (filtered by academic year)');
    console.log('-'.repeat(60));
    const filteredClassesResult = await getClassesForDropdown(testData.academicYear.id);
    if (filteredClassesResult.success) {
      console.log(`✅ Success: Found ${filteredClassesResult.data?.length ?? 0} classes for academic year ${testData.academicYear.name}`);
      const found = filteredClassesResult.data?.find(c => c.id === testData.classRecord.id);
      if (found) {
        console.log(`✅ Test class found in filtered results: ${found.name}`);
      } else {
        console.log(`❌ Test class not found in filtered results`);
      }
    } else {
      console.log(`❌ Failed: ${filteredClassesResult.error}`);
    }
    console.log();
    
    // Test 4: Get Sections for Dropdown
    console.log('TEST 4: getSectionsForDropdown');
    console.log('-'.repeat(60));
    const sectionsResult = await getSectionsForDropdown(testData.classRecord.id);
    if (sectionsResult.success) {
      console.log(`✅ Success: Found ${sectionsResult.data?.length ?? 0} sections for class ${testData.classRecord.name}`);
      const foundA = sectionsResult.data?.find(s => s.id === testData.sectionA.id);
      const foundB = sectionsResult.data?.find(s => s.id === testData.sectionB.id);
      if (foundA && foundB) {
        console.log(`✅ Both test sections found: ${foundA.name}, ${foundB.name}`);
      } else {
        console.log(`❌ Not all test sections found`);
      }
    } else {
      console.log(`❌ Failed: ${sectionsResult.error}`);
    }
    console.log();
    
    // Test 5: Validate valid subject-wide scope
    console.log('TEST 5: validateSyllabusScope (valid: subject-wide)');
    console.log('-'.repeat(60));
    const validScope1 = await validateSyllabusScope({
      subjectId: testData.subject.id,
      scopeType: 'SUBJECT_WIDE',
    });
    if (validScope1.isValid) {
      console.log(`✅ Valid scope accepted correctly`);
    } else {
      console.log(`❌ Valid scope rejected: ${validScope1.error}`);
    }
    console.log();
    
    // Test 6: Validate valid class-wide scope
    console.log('TEST 6: validateSyllabusScope (valid: class-wide)');
    console.log('-'.repeat(60));
    const validScope2 = await validateSyllabusScope({
      subjectId: testData.subject.id,
      academicYearId: testData.academicYear.id,
      classId: testData.classRecord.id,
      scopeType: 'CLASS_WIDE',
    });
    if (validScope2.isValid) {
      console.log(`✅ Valid scope accepted correctly`);
    } else {
      console.log(`❌ Valid scope rejected: ${validScope2.error}`);
    }
    console.log();
    
    // Test 7: Validate valid section-specific scope
    console.log('TEST 7: validateSyllabusScope (valid: section-specific)');
    console.log('-'.repeat(60));
    const validScope3 = await validateSyllabusScope({
      subjectId: testData.subject.id,
      academicYearId: testData.academicYear.id,
      classId: testData.classRecord.id,
      sectionId: testData.sectionA.id,
      scopeType: 'SECTION_SPECIFIC',
    });
    if (validScope3.isValid) {
      console.log(`✅ Valid scope accepted correctly`);
    } else {
      console.log(`❌ Valid scope rejected: ${validScope3.error}`);
    }
    console.log();
    
    // Test 8: Validate invalid scope (section doesn't belong to class)
    console.log('TEST 8: validateSyllabusScope (invalid: section from different class)');
    console.log('-'.repeat(60));
    // Create another class
    const otherClass = await db.class.create({
      data: {
        name: 'Grade 11',
        academicYearId: testData.academicYear.id,
      }
    });
    const invalidScope = await validateSyllabusScope({
      subjectId: testData.subject.id,
      classId: otherClass.id,
      sectionId: testData.sectionA.id, // This section belongs to Grade 10, not Grade 11
      scopeType: 'SECTION_SPECIFIC',
    });
    if (!invalidScope.isValid) {
      console.log(`✅ Invalid scope rejected correctly: ${invalidScope.error}`);
    } else {
      console.log(`❌ Invalid scope accepted (should have been rejected)`);
    }
    // Cleanup other class
    await db.class.delete({ where: { id: otherClass.id } });
    console.log();
    
    // Test 9: Validate invalid scope (non-existent academic year)
    console.log('TEST 9: validateSyllabusScope (invalid: non-existent academic year)');
    console.log('-'.repeat(60));
    const invalidScope2 = await validateSyllabusScope({
      subjectId: testData.subject.id,
      academicYearId: 'non-existent-id',
      scopeType: 'SUBJECT_WIDE',
    });
    if (!invalidScope2.isValid) {
      console.log(`✅ Invalid scope rejected correctly: ${invalidScope2.error}`);
    } else {
      console.log(`❌ Invalid scope accepted (should have been rejected)`);
    }
    console.log();
    
    console.log('='.repeat(60));
    console.log('✨ All tests completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  } finally {
    // Cleanup test data
    if (testData) {
      await cleanupTestData(testData);
    }
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
