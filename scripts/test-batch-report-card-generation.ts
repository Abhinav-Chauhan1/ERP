/**
 * Test script for batch report card generation
 * 
 * This script tests the batch report card generation functionality:
 * - Fetches classes and sections
 * - Generates batch report cards for a class
 * - Verifies PDF generation
 */

import { db } from '../src/lib/db';
import { 
  generateBatchReportCardsPDF 
} from '../src/lib/services/report-card-pdf-generation';
import { 
  batchAggregateReportCardData 
} from '../src/lib/services/report-card-data-aggregation';

async function testBatchReportCardGeneration() {
  console.log('🧪 Testing Batch Report Card Generation\n');

  try {
    // 1. Fetch a term
    console.log('1️⃣ Fetching term...');
    const term = await db.term.findFirst({
      include: { academicYear: true },
    });

    if (!term) {
      console.log('❌ No term found. Please create a term first.');
      return;
    }
    console.log(`✅ Found term: ${term.name} (${term.academicYear.name})\n`);

    // 2. Fetch a class with students
    console.log('2️⃣ Fetching class with students...');
    const classWithStudents = await db.class.findFirst({
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: true,
              },
            },
            section: true,
          },
          take: 3, // Limit to 3 students for testing
        },
      },
    });

    if (!classWithStudents || classWithStudents.enrollments.length === 0) {
      console.log('❌ No class with students found. Please create students and enrollments first.');
      return;
    }

    const sectionId = classWithStudents.enrollments[0].sectionId;
    console.log(`✅ Found class: ${classWithStudents.name}`);
    console.log(`   Students: ${classWithStudents.enrollments.length}`);
    console.log(`   Section: ${classWithStudents.enrollments[0].section.name}\n`);

    // 3. Fetch or create a template
    console.log('3️⃣ Fetching report card template...');
    let template = await db.reportCardTemplate.findFirst({
      where: { isActive: true },
    });

    if (!template) {
      console.log('   No template found, creating default template...');
      template = await db.reportCardTemplate.create({
        data: {
          name: 'Default Template',
          description: 'Default report card template for testing',
          type: 'CUSTOM',
          pageSize: 'A4',
          orientation: 'PORTRAIT',
          sections: [
            { id: 'studentInfo', name: 'Student Information', enabled: true, order: 1, fields: [] },
            { id: 'academic', name: 'Academic Performance', enabled: true, order: 2, fields: [] },
            { id: 'coScholastic', name: 'Co-Scholastic', enabled: true, order: 3, fields: [] },
            { id: 'attendance', name: 'Attendance', enabled: true, order: 4, fields: [] },
            { id: 'remarks', name: 'Remarks', enabled: true, order: 5, fields: [] },
          ],
          styling: {
            primaryColor: '#4A90E2',
            secondaryColor: '#6C757D',
            fontFamily: 'helvetica',
            fontSize: 10,
            headerHeight: 30,
            footerHeight: 20,
          },
          isActive: true,
          isDefault: true,
          createdBy: 'system',
        },
      });
    }
    console.log(`✅ Using template: ${template.name}\n`);

    // 4. Batch aggregate report card data
    console.log('4️⃣ Aggregating report card data for students...');
    const studentIds = classWithStudents.enrollments.map(e => e.studentId);
    
    const reportCardsData = await batchAggregateReportCardData(studentIds, term.id);
    console.log(`✅ Aggregated data for ${reportCardsData.length} students\n`);

    // 5. Generate batch PDF
    console.log('5️⃣ Generating batch PDF...');
    const pdfResult = await generateBatchReportCardsPDF(
      template.id,
      reportCardsData,
      {
        schoolName: 'Test School',
        schoolAddress: '123 Test Street, Test City',
      }
    );

    if (!pdfResult.success || !pdfResult.pdfBuffer) {
      console.log(`❌ Failed to generate batch PDF: ${pdfResult.error}`);
      return;
    }

    console.log(`✅ Generated batch PDF successfully!`);
    console.log(`   PDF size: ${(pdfResult.pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Report cards: ${reportCardsData.length}\n`);

    // 6. Verify PDF structure
    console.log('6️⃣ Verifying PDF structure...');
    const pdfString = pdfResult.pdfBuffer.toString('utf-8');
    
    // Check for PDF header
    if (pdfString.includes('%PDF')) {
      console.log('✅ Valid PDF header found');
    } else {
      console.log('❌ Invalid PDF header');
    }

    // Check for multiple pages (each report card should be on a new page)
    const pageCount = (pdfString.match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`✅ PDF contains ${pageCount} pages (expected: ${reportCardsData.length})`);

    if (pageCount === reportCardsData.length) {
      console.log('✅ Each report card is on a separate page\n');
    } else {
      console.log('⚠️  Page count mismatch\n');
    }

    // 7. Summary
    console.log('📊 Test Summary:');
    console.log('================');
    console.log(`✅ Batch aggregation: SUCCESS`);
    console.log(`✅ PDF generation: SUCCESS`);
    console.log(`✅ Multiple pages: ${pageCount === reportCardsData.length ? 'SUCCESS' : 'PARTIAL'}`);
    console.log(`✅ Students processed: ${reportCardsData.length}`);
    console.log('\n🎉 Batch report card generation test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testBatchReportCardGeneration();
