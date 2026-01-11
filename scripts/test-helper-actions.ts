/**
 * Test script for syllabus helper actions
 * Tests the newly implemented helper functions for dropdowns and validation
 */

import { 
  getAcademicYearsForDropdown,
  getClassesForDropdown,
  getSectionsForDropdown,
  validateSyllabusScope
} from '../src/lib/actions/syllabusActions';

async function testHelperActions() {
  console.log('🧪 Testing Syllabus Helper Actions\n');
  
  // Test 1: Get Academic Years for Dropdown
  console.log('1️⃣ Testing getAcademicYearsForDropdown...');
  const academicYearsResult = await getAcademicYearsForDropdown();
  if (academicYearsResult.success) {
    console.log(`✅ Success: Found ${academicYearsResult.data?.length ?? 0} academic years`);
    if (academicYearsResult.data && academicYearsResult.data.length > 0) {
      console.log(`   Sample: ${academicYearsResult.data[0].name} (${academicYearsResult.data[0].id})`);
    }
  } else {
    console.log(`❌ Failed: ${academicYearsResult.error}`);
  }
  console.log();
  
  // Test 2: Get Classes for Dropdown (without filter)
  console.log('2️⃣ Testing getClassesForDropdown (no filter)...');
  const classesResult = await getClassesForDropdown();
  if (classesResult.success) {
    console.log(`✅ Success: Found ${classesResult.data?.length ?? 0} classes`);
    if (classesResult.data && classesResult.data.length > 0) {
      console.log(`   Sample: ${classesResult.data[0].name} (${classesResult.data[0].id})`);
    }
  } else {
    console.log(`❌ Failed: ${classesResult.error}`);
  }
  console.log();
  
  // Test 3: Get Classes for Dropdown (with academic year filter)
  if (academicYearsResult.success && academicYearsResult.data && academicYearsResult.data.length > 0) {
    const academicYearId = academicYearsResult.data[0].id;
    console.log(`3️⃣ Testing getClassesForDropdown (filtered by academic year: ${academicYearsResult.data[0].name})...`);
    const filteredClassesResult = await getClassesForDropdown(academicYearId);
    if (filteredClassesResult.success) {
      console.log(`✅ Success: Found ${filteredClassesResult.data?.length ?? 0} classes for this academic year`);
    } else {
      console.log(`❌ Failed: ${filteredClassesResult.error}`);
    }
    console.log();
  }
  
  // Test 4: Get Sections for Dropdown
  if (classesResult.success && classesResult.data && classesResult.data.length > 0) {
    const classId = classesResult.data[0].id;
    console.log(`4️⃣ Testing getSectionsForDropdown (for class: ${classesResult.data[0].name})...`);
    const sectionsResult = await getSectionsForDropdown(classId);
    if (sectionsResult.success) {
      console.log(`✅ Success: Found ${sectionsResult.data?.length ?? 0} sections`);
      if (sectionsResult.data && sectionsResult.data.length > 0) {
        console.log(`   Sample: ${sectionsResult.data[0].name} (${sectionsResult.data[0].id})`);
      }
    } else {
      console.log(`❌ Failed: ${sectionsResult.error}`);
    }
    console.log();
  }
  
  // Test 5: Validate Syllabus Scope - Invalid (section-specific without class)
  console.log('5️⃣ Testing validateSyllabusScope (invalid: section-specific without class)...');
  const invalidScopeResult1 = await validateSyllabusScope({
    subjectId: 'test-subject-id',
    scopeType: 'SECTION_SPECIFIC',
    sectionId: 'test-section-id'
  });
  if (!invalidScopeResult1.isValid) {
    console.log(`✅ Correctly rejected: ${invalidScopeResult1.error}`);
  } else {
    console.log(`❌ Should have been rejected but was accepted`);
  }
  console.log();
  
  // Test 6: Validate Syllabus Scope - Invalid (class-wide without class)
  console.log('6️⃣ Testing validateSyllabusScope (invalid: class-wide without class)...');
  const invalidScopeResult2 = await validateSyllabusScope({
    subjectId: 'test-subject-id',
    scopeType: 'CLASS_WIDE'
  });
  if (!invalidScopeResult2.isValid) {
    console.log(`✅ Correctly rejected: ${invalidScopeResult2.error}`);
  } else {
    console.log(`❌ Should have been rejected but was accepted`);
  }
  console.log();
  
  // Test 7: Validate Syllabus Scope - Invalid (non-existent subject)
  console.log('7️⃣ Testing validateSyllabusScope (invalid: non-existent subject)...');
  const invalidScopeResult3 = await validateSyllabusScope({
    subjectId: 'non-existent-subject-id',
    scopeType: 'SUBJECT_WIDE'
  });
  if (!invalidScopeResult3.isValid) {
    console.log(`✅ Correctly rejected: ${invalidScopeResult3.error}`);
  } else {
    console.log(`❌ Should have been rejected but was accepted`);
  }
  console.log();
  
  console.log('✨ Helper Actions Test Complete!\n');
}

// Run the tests
testHelperActions()
  .then(() => {
    console.log('All tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
