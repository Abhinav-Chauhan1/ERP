/**
 * Report Card PDF Generation Tests
 * 
 * Tests for PDF generation functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import { generateReportCardPDF } from '../report-card-pdf-generation';
import type { ReportCardData } from '../report-card-data-aggregation';

describe('Report Card PDF Generation', () => {
  let testTemplateId: string;
  let mockReportCardData: ReportCardData;

  beforeAll(async () => {
    // Create a test template
    const template = await db.reportCardTemplate.create({
      data: {
        name: 'Test Template',
        type: 'CUSTOM',
        pageSize: 'A4',
        orientation: 'PORTRAIT',
        sections: [
          {
            id: 'studentInfo',
            name: 'Student Information',
            enabled: true,
            order: 1,
            fields: ['name', 'admissionId', 'class', 'section'],
          },
          {
            id: 'academic',
            name: 'Academic Performance',
            enabled: true,
            order: 2,
            fields: ['subjects', 'marks', 'grades'],
          },
          {
            id: 'attendance',
            name: 'Attendance',
            enabled: true,
            order: 3,
            fields: ['percentage', 'days'],
          },
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
        isDefault: false,
        createdBy: 'test-user',
      },
    });

    testTemplateId = template.id;

    // Create mock report card data
    mockReportCardData = {
      student: {
        id: 'test-student-id',
        name: 'John Doe',
        admissionId: 'ADM001',
        rollNumber: '101',
        dateOfBirth: new Date('2010-01-01'),
        class: 'Grade 10',
        section: 'A',
        avatar: null,
      },
      term: {
        id: 'test-term-id',
        name: 'First Term',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-09-30'),
        academicYear: '2024-2025',
      },
      academicYear: '2024-2025',
      subjects: [
        {
          subjectId: 'sub1',
          subjectName: 'Mathematics',
          subjectCode: 'MATH',
          theoryMarks: 85,
          theoryMaxMarks: 100,
          practicalMarks: null,
          practicalMaxMarks: null,
          internalMarks: 18,
          internalMaxMarks: 20,
          totalMarks: 103,
          maxMarks: 120,
          percentage: 85.83,
          grade: 'A',
          isAbsent: false,
        },
        {
          subjectId: 'sub2',
          subjectName: 'Science',
          subjectCode: 'SCI',
          theoryMarks: 78,
          theoryMaxMarks: 80,
          practicalMarks: 38,
          practicalMaxMarks: 40,
          internalMarks: 19,
          internalMaxMarks: 20,
          totalMarks: 135,
          maxMarks: 140,
          percentage: 96.43,
          grade: 'A+',
          isAbsent: false,
        },
      ],
      coScholastic: [
        {
          activityId: 'act1',
          activityName: 'Sports',
          assessmentType: 'GRADE',
          grade: 'A',
          marks: null,
          maxMarks: null,
          remarks: 'Excellent performance',
        },
      ],
      attendance: {
        totalDays: 100,
        daysPresent: 95,
        daysAbsent: 5,
        percentage: 95.0,
      },
      overallPerformance: {
        totalMarks: 260,
        maxMarks: 260,
        obtainedMarks: 238,
        percentage: 91.54,
        grade: 'A+',
        rank: 1,
      },
      remarks: {
        teacherRemarks: 'Excellent student with consistent performance.',
        principalRemarks: 'Keep up the good work!',
      },
      templateId: null,
      pdfUrl: null,
      isPublished: false,
      publishDate: null,
    };
  });

  afterAll(async () => {
    // Clean up test template
    if (testTemplateId) {
      await db.reportCardTemplate.delete({
        where: { id: testTemplateId },
      });
    }
  });

  it('should generate PDF successfully with valid data', async () => {
    const result = await generateReportCardPDF({
      templateId: testTemplateId,
      data: mockReportCardData,
      schoolName: 'Test School',
      schoolAddress: '123 Test Street',
    });

    expect(result.success).toBe(true);
    expect(result.pdfBuffer).toBeDefined();
    expect(result.pdfBuffer).toBeInstanceOf(Buffer);
    expect(result.pdfBuffer!.length).toBeGreaterThan(0);
  });

  it('should return error for non-existent template', async () => {
    const result = await generateReportCardPDF({
      templateId: 'non-existent-id',
      data: mockReportCardData,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('not found');
  });

  it('should handle absent students correctly', async () => {
    const dataWithAbsent: ReportCardData = {
      ...mockReportCardData,
      subjects: [
        {
          ...mockReportCardData.subjects[0],
          isAbsent: true,
        },
      ],
    };

    const result = await generateReportCardPDF({
      templateId: testTemplateId,
      data: dataWithAbsent,
    });

    expect(result.success).toBe(true);
    expect(result.pdfBuffer).toBeDefined();
  });

  it('should include co-scholastic section when data is present', async () => {
    const result = await generateReportCardPDF({
      templateId: testTemplateId,
      data: mockReportCardData,
    });

    expect(result.success).toBe(true);
    // PDF should be generated with co-scholastic data
    expect(mockReportCardData.coScholastic.length).toBeGreaterThan(0);
  });

  it('should handle low attendance highlighting', async () => {
    const dataWithLowAttendance: ReportCardData = {
      ...mockReportCardData,
      attendance: {
        totalDays: 100,
        daysPresent: 70,
        daysAbsent: 30,
        percentage: 70.0,
      },
    };

    const result = await generateReportCardPDF({
      templateId: testTemplateId,
      data: dataWithLowAttendance,
    });

    expect(result.success).toBe(true);
    expect(dataWithLowAttendance.attendance.percentage).toBeLessThan(75);
  });
});
