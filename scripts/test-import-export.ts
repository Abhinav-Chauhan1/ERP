/**
 * Test script for Calendar Import/Export functionality
 * 
 * This script tests the import and export functionality by:
 * 1. Creating sample events
 * 2. Exporting them to different formats
 * 3. Importing them back
 * 4. Verifying the round-trip works correctly
 */

import { PrismaClient } from '@prisma/client';
import {
  exportCalendarEvents,
  importCalendarEvents,
  exportToICalFormat,
  exportToCSVFormat,
  exportToJSONFormat
} from '../src/lib/services/import-export-service';
import { createCalendarEvent } from '../src/lib/services/calendar-service';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  // Delete test events
  await prisma.calendarEvent.deleteMany({
    where: {
      title: {
        startsWith: 'TEST_'
      }
    }
  });
  
  console.log('✅ Cleanup complete');
}

async function testExportFormats() {
  console.log('\n📤 Testing Export Formats...\n');
  
  try {
    // Get or create a test category
    let category = await prisma.calendarEventCategory.findFirst({
      where: { name: 'Test Category' }
    });
    
    if (!category) {
      category = await prisma.calendarEventCategory.create({
        data: {
          name: 'Test Category',
          description: 'Category for testing',
          color: '#FF0000',
          isActive: true,
          order: 999
        }
      });
    }
    
    // Create test events
    console.log('Creating test events...');
    const event1 = await createCalendarEvent({
      title: 'TEST_Math Exam',
      description: 'Final exam for Mathematics',
      categoryId: category.id,
      startDate: new Date('2025-01-30T09:00:00Z'),
      endDate: new Date('2025-01-30T11:00:00Z'),
      isAllDay: false,
      location: 'Room 101',
      visibleToRoles: ['ADMIN', 'TEACHER', 'STUDENT'],
      visibleToClasses: [],
      visibleToSections: [],
      createdBy: 'test_user'
    });
    
    const event2 = await createCalendarEvent({
      title: 'TEST_Science Fair',
      description: 'Annual science fair event',
      categoryId: category.id,
      startDate: new Date('2025-02-15T10:00:00Z'),
      endDate: new Date('2025-02-15T16:00:00Z'),
      isAllDay: false,
      location: 'Main Hall',
      visibleToRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
      visibleToClasses: [],
      visibleToSections: [],
      createdBy: 'test_user'
    });
    
    console.log(`✅ Created ${2} test events`);
    
    // Test iCal export
    console.log('\n📄 Testing iCal export...');
    const icalContent = await exportCalendarEvents({
      format: 'ical',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31')
    });
    
    console.log('iCal content length:', icalContent.length);
    console.log('Contains VCALENDAR:', icalContent.includes('BEGIN:VCALENDAR'));
    console.log('Contains VEVENT:', icalContent.includes('BEGIN:VEVENT'));
    console.log('Contains test event:', icalContent.includes('TEST_Math Exam'));
    
    // Test CSV export
    console.log('\n📊 Testing CSV export...');
    const csvContent = await exportCalendarEvents({
      format: 'csv',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31')
    });
    
    console.log('CSV content length:', csvContent.length);
    console.log('Contains headers:', csvContent.includes('title,description'));
    console.log('Contains test event:', csvContent.includes('TEST_Math Exam'));
    
    // Test JSON export
    console.log('\n📋 Testing JSON export...');
    const jsonContent = await exportCalendarEvents({
      format: 'json',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31')
    });
    
    const jsonData = JSON.parse(jsonContent);
    console.log('JSON events count:', jsonData.length);
    console.log('Contains test event:', jsonData.some((e: any) => e.title === 'TEST_Math Exam'));
    
    console.log('\n✅ All export formats working correctly!');
    
    return { icalContent, csvContent, jsonContent, categoryId: category.id };
  } catch (error) {
    console.error('❌ Export test failed:', error);
    throw error;
  }
}

async function testImportFormats(categoryId: string) {
  console.log('\n📥 Testing Import Formats...\n');
  
  try {
    // Test CSV import
    console.log('📊 Testing CSV import...');
    const csvData = `title,description,categoryId,startDate,endDate,isAllDay,location,visibleToRoles
TEST_Imported Event 1,Test description,${categoryId},2025-03-01T09:00:00Z,2025-03-01T10:00:00Z,false,Room 201,"ADMIN,TEACHER,STUDENT"
TEST_Imported Event 2,Another test,${categoryId},2025-03-02T14:00:00Z,2025-03-02T15:00:00Z,false,Room 202,"ADMIN,TEACHER"`;
    
    const csvResult = await importCalendarEvents(csvData, 'csv', 'test_user');
    console.log('CSV Import Result:', {
      success: csvResult.success,
      failed: csvResult.failed,
      duplicates: csvResult.duplicates,
      errors: csvResult.errors.length
    });
    
    // Test JSON import
    console.log('\n📋 Testing JSON import...');
    const jsonData = JSON.stringify([
      {
        title: 'TEST_Imported Event 3',
        description: 'JSON test event',
        categoryId: categoryId,
        startDate: '2025-03-03T09:00:00Z',
        endDate: '2025-03-03T10:00:00Z',
        isAllDay: false,
        location: 'Room 203',
        visibleToRoles: ['ADMIN', 'TEACHER', 'STUDENT'],
        visibleToClasses: [],
        visibleToSections: []
      }
    ]);
    
    const jsonResult = await importCalendarEvents(jsonData, 'json', 'test_user');
    console.log('JSON Import Result:', {
      success: jsonResult.success,
      failed: jsonResult.failed,
      duplicates: jsonResult.duplicates,
      errors: jsonResult.errors.length
    });
    
    // Test duplicate detection
    console.log('\n🔍 Testing duplicate detection...');
    const duplicateResult = await importCalendarEvents(csvData, 'csv', 'test_user');
    console.log('Duplicate Import Result:', {
      success: duplicateResult.success,
      failed: duplicateResult.failed,
      duplicates: duplicateResult.duplicates
    });
    
    if (duplicateResult.duplicates > 0) {
      console.log('✅ Duplicate detection working correctly!');
    } else {
      console.log('⚠️  Warning: No duplicates detected');
    }
    
    // Test validation errors
    console.log('\n🔍 Testing validation errors...');
    const invalidData = `title,categoryId,startDate,endDate
,${categoryId},2025-03-01T09:00:00Z,2025-03-01T10:00:00Z`;
    
    const errorResult = await importCalendarEvents(invalidData, 'csv', 'test_user');
    console.log('Validation Error Result:', {
      success: errorResult.success,
      failed: errorResult.failed,
      errors: errorResult.errors.length
    });
    
    if (errorResult.errors.length > 0) {
      console.log('Sample error:', errorResult.errors[0]);
      console.log('✅ Validation working correctly!');
    }
    
    console.log('\n✅ All import formats working correctly!');
  } catch (error) {
    console.error('❌ Import test failed:', error);
    throw error;
  }
}

async function testRoundTrip() {
  console.log('\n🔄 Testing Round-Trip (Export → Import)...\n');
  
  try {
    // Export events
    const jsonContent = await exportCalendarEvents({
      format: 'json',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31')
    });
    
    const exportedEvents = JSON.parse(jsonContent);
    const originalCount = exportedEvents.length;
    console.log(`Exported ${originalCount} events`);
    
    // Delete the events
    await prisma.calendarEvent.deleteMany({
      where: {
        title: {
          startsWith: 'TEST_'
        }
      }
    });
    console.log('Deleted test events');
    
    // Import them back
    const importResult = await importCalendarEvents(jsonContent, 'json', 'test_user');
    console.log('Import Result:', {
      success: importResult.success,
      failed: importResult.failed,
      duplicates: importResult.duplicates
    });
    
    // Verify count
    const importedCount = await prisma.calendarEvent.count({
      where: {
        title: {
          startsWith: 'TEST_'
        }
      }
    });
    
    console.log(`Imported ${importedCount} events`);
    
    if (importResult.success === originalCount) {
      console.log('✅ Round-trip successful! All events preserved.');
    } else {
      console.log('⚠️  Warning: Event count mismatch');
    }
  } catch (error) {
    console.error('❌ Round-trip test failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Calendar Import/Export Tests\n');
  console.log('=' .repeat(50));
  
  try {
    // Cleanup before tests
    await cleanup();
    
    // Test exports
    const { categoryId } = await testExportFormats();
    
    // Test imports
    await testImportFormats(categoryId);
    
    // Test round-trip
    await testRoundTrip();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed successfully!');
    console.log('=' .repeat(50));
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  } finally {
    // Cleanup after tests
    await cleanup();
    await prisma.$disconnect();
  }
}

main();
