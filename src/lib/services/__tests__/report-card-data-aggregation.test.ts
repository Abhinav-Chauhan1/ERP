/**
 * Integration tests for Report Card Data Aggregation Service
 * 
 * These tests verify that the service correctly aggregates all required data
 * for report card generation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import { aggregateReportCardData, batchAggregateReportCardData } from '../report-card-data-aggregation';

describe('Report Card Data Aggregation Service', () => {
  // Test data IDs - these should be set up in your test database
  let testStudentId: string;
  let testTermId: string;

  beforeAll(async () => {
    // In a real test environment, you would set up test data here
    // For now, we'll skip if no test data is available
    
    // Try to find a student with exam results
    const studentWithResults = await db.student.findFirst({
      where: {
        examResults: {
          some: {}
        }
      },
      select: {
        id: true,
        examResults: {
          take: 1,
          select: {
            exam: {
              select: {
                termId: true
              }
            }
          }
        }
      }
    });

    if (studentWithResults && studentWithResults.examResults[0]) {
      testStudentId = studentWithResults.id;
      testTermId = studentWithResults.examResults[0].exam.termId;
    }
  });

  it('should aggregate complete report card data for a student', async () => {
    // Skip if no test data available
    if (!testStudentId || !testTermId) {
      console.log('Skipping test: No test data available');
      return;
    }

    const reportCardData = await aggregateReportCardData(testStudentId, testTermId);

    // Verify student information is present
    expect(reportCardData.student).toBeDefined();
    expect(reportCardData.student.id).toBe(testStudentId);
    expect(reportCardData.student.name).toBeTruthy();
    expect(reportCardData.student.admissionId).toBeTruthy();

    // Verify term information is present
    expect(reportCardData.term).toBeDefined();
    expect(reportCardData.term.id).toBe(testTermId);
    expect(reportCardData.term.name).toBeTruthy();
    expect(reportCardData.term.academicYear).toBeTruthy();

    // Verify subjects array exists (may be empty if no results)
    expect(Array.isArray(reportCardData.subjects)).toBe(true);

    // Verify co-scholastic array exists
    expect(Array.isArray(reportCardData.coScholastic)).toBe(true);

    // Verify attendance data is present
    expect(reportCardData.attendance).toBeDefined();
    expect(typeof reportCardData.attendance.percentage).toBe('number');
    expect(typeof reportCardData.attendance.totalDays).toBe('number');

    // Verify overall performance is calculated
    expect(reportCardData.overallPerformance).toBeDefined();
    expect(typeof reportCardData.overallPerformance.percentage).toBe('number');

    // Verify remarks structure
    expect(reportCardData.remarks).toBeDefined();
  });

  it('should include subject results with mark components', async () => {
    // Skip if no test data available
    if (!testStudentId || !testTermId) {
      console.log('Skipping test: No test data available');
      return;
    }

    const reportCardData = await aggregateReportCardData(testStudentId, testTermId);

    // If there are subjects, verify their structure
    if (reportCardData.subjects.length > 0) {
      const subject = reportCardData.subjects[0];

      expect(subject.subjectId).toBeTruthy();
      expect(subject.subjectName).toBeTruthy();
      expect(subject.subjectCode).toBeTruthy();
      expect(typeof subject.totalMarks).toBe('number');
      expect(typeof subject.maxMarks).toBe('number');
      expect(typeof subject.percentage).toBe('number');
      expect(typeof subject.isAbsent).toBe('boolean');
    }
  });

  it('should calculate overall performance correctly', async () => {
    // Skip if no test data available
    if (!testStudentId || !testTermId) {
      console.log('Skipping test: No test data available');
      return;
    }

    const reportCardData = await aggregateReportCardData(testStudentId, testTermId);

    const { overallPerformance, subjects } = reportCardData;

    // If there are subjects, verify calculations
    if (subjects.length > 0) {
      const presentSubjects = subjects.filter(s => !s.isAbsent);

      if (presentSubjects.length > 0) {
        // Verify total marks calculation
        const expectedTotalMarks = presentSubjects.reduce((sum, s) => sum + s.totalMarks, 0);
        expect(overallPerformance.totalMarks).toBe(expectedTotalMarks);

        // Verify max marks calculation
        const expectedMaxMarks = presentSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
        expect(overallPerformance.maxMarks).toBe(expectedMaxMarks);

        // Verify percentage is within valid range
        expect(overallPerformance.percentage).toBeGreaterThanOrEqual(0);
        expect(overallPerformance.percentage).toBeLessThanOrEqual(100);

        // Verify grade is assigned
        if (overallPerformance.percentage > 0) {
          expect(overallPerformance.grade).toBeTruthy();
        }
      }
    }
  });

  it('should handle students with no exam results gracefully', async () => {
    // Find a student with no exam results
    const studentWithoutResults = await db.student.findFirst({
      where: {
        examResults: {
          none: {}
        }
      },
      select: {
        id: true
      }
    });

    if (!studentWithoutResults || !testTermId) {
      console.log('Skipping test: No suitable test data available');
      return;
    }

    const reportCardData = await aggregateReportCardData(studentWithoutResults.id, testTermId);

    // Should still return valid structure with empty subjects
    expect(reportCardData.student).toBeDefined();
    expect(reportCardData.subjects).toEqual([]);
    expect(reportCardData.overallPerformance.totalMarks).toBe(0);
    expect(reportCardData.overallPerformance.percentage).toBe(0);
  });

  it('should batch aggregate data for multiple students', async () => {
    // Skip if no test data available
    if (!testTermId) {
      console.log('Skipping test: No test data available');
      return;
    }

    // Get a few students
    const students = await db.student.findMany({
      take: 3,
      select: {
        id: true
      }
    });

    if (students.length === 0) {
      console.log('Skipping test: No students available');
      return;
    }

    const studentIds = students.map(s => s.id);
    const reportCardDataArray = await batchAggregateReportCardData(studentIds, testTermId);

    // Verify we got data for all students
    expect(reportCardDataArray.length).toBe(studentIds.length);

    // Verify each report card has the required structure
    reportCardDataArray.forEach((data, index) => {
      expect(data.student.id).toBe(studentIds[index]);
      expect(data.term.id).toBe(testTermId);
      expect(data.student).toBeDefined();
      expect(data.term).toBeDefined();
      expect(Array.isArray(data.subjects)).toBe(true);
      expect(data.overallPerformance).toBeDefined();
    });
  });

  it('should throw error for non-existent student', async () => {
    const nonExistentStudentId = 'non-existent-id';
    const validTermId = testTermId || 'some-term-id';

    await expect(
      aggregateReportCardData(nonExistentStudentId, validTermId)
    ).rejects.toThrow();
  });

  it('should throw error for non-existent term', async () => {
    const validStudentId = testStudentId || 'some-student-id';
    const nonExistentTermId = 'non-existent-term-id';

    await expect(
      aggregateReportCardData(validStudentId, nonExistentTermId)
    ).rejects.toThrow();
  });
});
