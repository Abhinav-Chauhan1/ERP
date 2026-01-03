/**
 * Report Card PDF Generation Service
 * 
 * Handles PDF generation for report cards with support for multiple templates:
 * - CBSE format
 * - State Board format
 * - Custom format
 * 
 * Features:
 * - Customizable page size and orientation
 * - School branding (logo, header, footer)
 * - Dynamic data rendering
 * - Print-ready PDF output
 * 
 * Requirements: 5.4, 5.5
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '@/lib/db';
import type { ReportCardData } from './report-card-data-aggregation';

/**
 * Template configuration interfaces
 */
export interface TemplateSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  fields: string[];
}

export interface TemplateStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  headerHeight: number;
  footerHeight: number;

  // Advanced styling
  tableHeaderBg?: string; // Background for table headers
  tableHeaderText?: string; // Text color for table headers
  tableBorderColor?: string; // Color for table borders
  sectionTitleColor?: string; // Color for section titles
  textColor?: string; // General text color
  alternateRowColor?: string; // Background for alternate rows

  // Layout options
  headerStyle?: 'classic' | 'modern' | 'minimal';
  studentInfoStyle?: 'list' | 'grid' | 'boxed';
}

export interface ReportCardTemplate {
  id: string;
  name: string;
  type: 'CBSE' | 'STATE_BOARD' | 'CUSTOM';
  pageSize: 'A4' | 'LETTER' | 'LEGAL';
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  sections: TemplateSectionConfig[];
  styling: TemplateStyles;
  headerImage?: string | null;
  footerImage?: string | null;
  schoolLogo?: string | null;
}

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  templateId: string;
  data: ReportCardData;
  schoolName?: string;
  schoolAddress?: string;
}

/**
 * PDF generation result
 */
export interface PDFGenerationResult {
  success: boolean;
  pdfBuffer?: Buffer;
  error?: string;
}

/**
 * Generate report card PDF
 * 
 * @param options - PDF generation options
 * @returns PDF generation result with buffer
 */
export async function generateReportCardPDF(
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  try {
    // Fetch template from database
    const template = await fetchTemplate(options.templateId);

    if (!template) {
      return {
        success: false,
        error: `Template with ID ${options.templateId} not found`,
      };
    }

    // Generate PDF based on template type
    const pdfBuffer = await generatePDFByType(template, options.data, options);

    return {
      success: true,
      pdfBuffer,
    };
  } catch (error) {
    console.error('Error generating report card PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate batch report cards PDF
 * 
 * @param templateId - Template ID to use
 * @param reportCardsData - Array of report card data
 * @param options - Additional options
 * @returns PDF buffer with all report cards
 */
export async function generateBatchReportCardsPDF(
  templateId: string,
  reportCardsData: ReportCardData[],
  options?: { schoolName?: string; schoolAddress?: string }
): Promise<PDFGenerationResult> {
  try {
    // Fetch template from database
    const template = await fetchTemplate(templateId);

    if (!template) {
      return {
        success: false,
        error: `Template with ID ${templateId} not found`,
      };
    }

    // Create PDF document
    const doc = createPDFDocument(template);

    // Generate each report card on a new page
    for (let i = 0; i < reportCardsData.length; i++) {
      if (i > 0) {
        doc.addPage();
      }

      // Render report card on current page
      await renderReportCard(doc, template, reportCardsData[i], options);
    }

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return {
      success: true,
      pdfBuffer,
    };
  } catch (error) {
    console.error('Error generating batch report cards PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch template from database
 */
async function fetchTemplate(templateId: string): Promise<ReportCardTemplate | null> {
  const template = await db.reportCardTemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      name: true,
      type: true,
      pageSize: true,
      orientation: true,
      sections: true,
      styling: true,
      headerImage: true,
      footerImage: true,
      schoolLogo: true,
    },
  });

  if (!template) {
    return null;
  }

  return {
    ...template,
    type: template.type as 'CBSE' | 'STATE_BOARD' | 'CUSTOM',
    pageSize: template.pageSize as 'A4' | 'LETTER' | 'LEGAL',
    orientation: template.orientation as 'PORTRAIT' | 'LANDSCAPE',
    sections: template.sections as unknown as TemplateSectionConfig[],
    styling: template.styling as unknown as TemplateStyles,
  };
}

/**
 * Generate PDF based on template type
 */
async function generatePDFByType(
  template: ReportCardTemplate,
  data: ReportCardData,
  options: PDFGenerationOptions
): Promise<Buffer> {
  const doc = createPDFDocument(template);

  // Render report card based on type
  await renderReportCard(doc, template, data, options);

  // Convert to buffer
  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Create PDF document with template settings
 */
function createPDFDocument(template: ReportCardTemplate): jsPDF {
  const pageSize = template.pageSize.toLowerCase() as 'a4' | 'letter' | 'legal';
  const orientation = template.orientation.toLowerCase() as 'portrait' | 'landscape';

  return new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
    compress: true,
  });
}

/**
 * Render report card on PDF document
 */
async function renderReportCard(
  doc: jsPDF,
  template: ReportCardTemplate,
  data: ReportCardData,
  options?: { schoolName?: string; schoolAddress?: string }
): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const styling = template.styling;

  let currentY = 10;

  // Render header
  currentY = await renderHeader(doc, template, data, options, currentY, pageWidth);

  // Render student information
  currentY = renderStudentInfo(doc, template, data, currentY, pageWidth, styling);

  // Render academic performance section
  currentY = renderAcademicPerformance(doc, template, data, currentY, pageWidth, styling);

  // Render co-scholastic section if enabled
  const coScholasticSection = template.sections.find(s => s.id === 'coScholastic');
  if (coScholasticSection?.enabled && data.coScholastic.length > 0) {
    currentY = renderCoScholastic(doc, template, data, currentY, pageWidth, styling);
  }

  // Render attendance section if enabled
  const attendanceSection = template.sections.find(s => s.id === 'attendance');
  if (attendanceSection?.enabled) {
    currentY = renderAttendance(doc, template, data, currentY, pageWidth, styling);
  }

  // Render remarks section if enabled
  const remarksSection = template.sections.find(s => s.id === 'remarks');
  if (remarksSection?.enabled) {
    currentY = renderRemarks(doc, template, data, currentY, pageWidth, styling);
  }

  // Render footer
  renderFooter(doc, template, pageWidth, pageHeight, styling);
}

/**
 * Render header with school branding
 */
async function renderHeader(
  doc: jsPDF,
  template: ReportCardTemplate,
  data: ReportCardData,
  options: { schoolName?: string; schoolAddress?: string } | undefined,
  startY: number,
  pageWidth: number
): Promise<number> {
  let currentY = startY;
  const styling = template.styling;
  const headerStyle = styling.headerStyle || 'classic';
  const primaryColor = styling.primaryColor || '#000000';

  if (headerStyle === 'modern') {
    // Modern Style: Colored bar with logo and school details
    const headerHeight = Math.max(styling.headerHeight || 40, 40);

    // Background bar
    doc.setFillColor(primaryColor);
    doc.rect(0, currentY, pageWidth, headerHeight, 'F');

    // Logo (Left)
    let textStartX = 15;
    if (template.schoolLogo) {
      try {
        doc.addImage(template.schoolLogo, 'PNG', 15, currentY + 5, 30, 30);
        textStartX += 40;
      } catch (e) { console.warn('Logo error', e); }
    }

    // School Name (White text)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(options?.schoolName || 'School Name', textStartX, currentY + 12);

    // Address
    if (options?.schoolAddress) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(options.schoolAddress, textStartX, currentY + 18);
    }

    // Term Info (Right side)
    doc.setFontSize(10);
    doc.text(`Academic Year: ${data.academicYear}`, pageWidth - 15, currentY + 12, { align: 'right' });
    doc.text(`Term: ${data.term.name}`, pageWidth - 15, currentY + 18, { align: 'right' });

    currentY += headerHeight + 5;

  } else if (headerStyle === 'minimal') {
    // Minimal Style: Clean line with school name and details
    const headerHeight = Math.max(styling.headerHeight || 30, 30);

    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);

    // School Name (Left)
    doc.setTextColor(primaryColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(options?.schoolName || 'School Name', 15, currentY + 10);

    // Term Info (Right)
    doc.setTextColor(100, 100, 100); // Gray
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.academicYear} | ${data.term.name}`, pageWidth - 15, currentY + 10, { align: 'right' });

    // Line below
    doc.line(15, currentY + 15, pageWidth - 15, currentY + 15);

    currentY += headerHeight;

  } else {
    // Classic Style (Centered)
    // Add header image if provided
    if (template.headerImage) {
      try {
        const headerHeight = styling.headerHeight || 30;
        doc.addImage(
          template.headerImage,
          'PNG',
          10,
          currentY,
          pageWidth - 20,
          headerHeight
        );
        currentY += headerHeight + 5;
      } catch (error) {
        console.warn('Failed to add header image:', error);
      }
    }

    // Add school logo if provided
    if (template.schoolLogo) {
      try {
        doc.addImage(
          template.schoolLogo,
          'PNG',
          pageWidth / 2 - 15,
          currentY,
          30,
          30
        );
        currentY += 35;
      } catch (error) {
        console.warn('Failed to add school logo:', error);
      }
    }

    // School name and address
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    const schoolName = options?.schoolName || 'School Name';
    doc.text(schoolName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    if (options?.schoolAddress) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(options.schoolAddress, pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
    }

    // Report card title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT CARD', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Academic year and term
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Academic Year: ${data.academicYear} | Term: ${data.term.name}`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );
    currentY += 10;
  }

  return currentY;
}

/**
 * Render student information section
 */
function renderStudentInfo(
  doc: jsPDF,
  template: ReportCardTemplate,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  styling: TemplateStyles
): number {
  let currentY = startY;
  const sectionTitleColor = styling.sectionTitleColor || styling.primaryColor || '#4A90E2';
  const textColor = styling.textColor || '#000000';
  const style = styling.studentInfoStyle || 'list';

  // Section title
  if (style !== 'boxed') {
    doc.setTextColor(sectionTitleColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT INFORMATION', 12, currentY);
    // Underline
    doc.setDrawColor(sectionTitleColor);
    doc.setLineWidth(0.5);
    doc.line(12, currentY + 2, 70, currentY + 2);
    currentY += 8;
  }

  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (style === 'grid') {
    // Grid Layout
    const boxWidth = (pageWidth - 30) / 2;
    const boxHeight = 15;

    const fields = [
      { label: 'Name', value: data.student.name },
      { label: 'Roll Number', value: data.student.rollNumber || 'N/A' },
      { label: 'Class & Section', value: `${data.student.class} - ${data.student.section}` },
      { label: 'Admission ID', value: data.student.admissionId },
      { label: 'Date of Birth', value: new Date(data.student.dateOfBirth).toLocaleDateString() },
      { label: 'Rank', value: data.overallPerformance.rank?.toString() || 'N/A' }
    ];

    let xPos = 12;
    let yPos = currentY;

    fields.forEach((field, index) => {
      // Draw box background
      doc.setFillColor(245, 245, 245); // Light gray bg
      doc.rect(xPos, yPos, boxWidth, boxHeight, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.rect(xPos, yPos, boxWidth, boxHeight, 'S');

      // Label
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(field.label, xPos + 2, yPos + 4);

      // Value
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(field.value, xPos + 2, yPos + 10);

      if (index % 2 === 1) {
        xPos = 12;
        yPos += boxHeight + 4;
      } else {
        xPos += boxWidth + 6;
      }
    });

    currentY = yPos + (fields.length % 2 === 0 ? 0 : boxHeight + 4) + 5;

  } else if (style === 'boxed') {
    // Boxed Layout
    const boxWidth = pageWidth - 24;
    const startX = 12;

    // Header
    doc.setFillColor(sectionTitleColor);
    doc.rect(startX, currentY, boxWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT PROFILE', startX + 5, currentY + 5.5);

    // Border
    doc.setDrawColor(styling.tableBorderColor || '#e2e8f0');
    doc.rect(startX, currentY, boxWidth, 25, 'S'); // Approximate height

    currentY += 14;
    doc.setTextColor(0, 0, 0);

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', startX + 5, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student.name, startX + 35, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Roll No:', startX + 90, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student.rollNumber || 'N/A', startX + 115, currentY);

    currentY += 7;

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('Class:', startX + 5, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.student.class} - ${data.student.section}`, startX + 35, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Adm No:', startX + 90, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student.admissionId, startX + 115, currentY);

    currentY += 15;

  } else {
    // Standard List Style
    const leftCol = 12;
    const rightCol = pageWidth / 2 + 5;
    const lineHeight = 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Name:', leftCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student.name, leftCol + 30, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Admission ID:', rightCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student.admissionId, rightCol + 30, currentY);
    currentY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Class:', leftCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.student.class} - ${data.student.section}`, leftCol + 30, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Roll Number:', rightCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student.rollNumber || 'N/A', rightCol + 30, currentY);
    currentY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Date of Birth:', leftCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(data.student.dateOfBirth).toLocaleDateString(), leftCol + 30, currentY);

    if (data.overallPerformance.rank) {
      doc.setFont('helvetica', 'bold');
      doc.text('Rank:', rightCol, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.overallPerformance.rank.toString(), rightCol + 30, currentY);
    }
    currentY += 10;
  }

  return currentY;
}

/**
 * Render academic performance section with marks table
 */
function renderAcademicPerformance(
  doc: jsPDF,
  template: ReportCardTemplate,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  styling: TemplateStyles
): number {
  let currentY = startY;
  const sectionTitleColor = styling.sectionTitleColor || styling.primaryColor || '#4A90E2';

  // Section title
  doc.setFillColor(sectionTitleColor);
  doc.rect(10, currentY, pageWidth - 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ACADEMIC PERFORMANCE', 12, currentY + 5.5);
  currentY += 10;

  // Prepare table data
  const tableHeaders = ['Subject'];
  const hasTheory = data.subjects.some(s => s.theoryMaxMarks !== null);
  const hasPractical = data.subjects.some(s => s.practicalMaxMarks !== null);
  const hasInternal = data.subjects.some(s => s.internalMaxMarks !== null);

  if (hasTheory) tableHeaders.push('Theory');
  if (hasPractical) tableHeaders.push('Practical');
  if (hasInternal) tableHeaders.push('Internal');
  tableHeaders.push('Total', 'Max', 'Percentage', 'Grade');

  const tableData: (string | number | { content: string; styles: any })[][] = data.subjects.map(subject => {
    const row: (string | number)[] = [subject.subjectName];

    if (subject.isAbsent) {
      // Fill with "AB" for absent
      if (hasTheory) row.push('AB');
      if (hasPractical) row.push('AB');
      if (hasInternal) row.push('AB');
      row.push('AB', subject.maxMarks, 'AB', 'AB');
    } else {
      if (hasTheory) {
        row.push(
          subject.theoryMarks !== null
            ? `${subject.theoryMarks}/${subject.theoryMaxMarks}`
            : '-'
        );
      }
      if (hasPractical) {
        row.push(
          subject.practicalMarks !== null
            ? `${subject.practicalMarks}/${subject.practicalMaxMarks}`
            : '-'
        );
      }
      if (hasInternal) {
        row.push(
          subject.internalMarks !== null
            ? `${subject.internalMarks}/${subject.internalMaxMarks}`
            : '-'
        );
      }
      row.push(
        subject.totalMarks,
        subject.maxMarks,
        `${subject.percentage.toFixed(2)}%`,
        subject.grade || '-'
      );
    }

    return row;
  });

  // Add overall performance row
  tableData.push([
    { content: 'OVERALL', styles: { fontStyle: 'bold' } },
    ...(hasTheory ? [''] : []),
    ...(hasPractical ? [''] : []),
    ...(hasInternal ? [''] : []),
    { content: data.overallPerformance.obtainedMarks.toString(), styles: { fontStyle: 'bold' } },
    { content: data.overallPerformance.maxMarks.toString(), styles: { fontStyle: 'bold' } },
    { content: `${data.overallPerformance.percentage.toFixed(2)}%`, styles: { fontStyle: 'bold' } },
    { content: data.overallPerformance.grade || '-', styles: { fontStyle: 'bold' } },
  ]);

  // Render table
  // Render table
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: styling.tableHeaderBg || styling.primaryColor || '#4A90E2',
      textColor: styling.tableHeaderText || '#FFFFFF',
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: styling.textColor || '#000000',
    },
    alternateRowStyles: {
      fillColor: styling.alternateRowColor || '#f8f9fa',
    },
    styles: {
      lineColor: styling.tableBorderColor || '#dee2e6',
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 40 },
    },
    margin: { left: 10, right: 10 },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Render co-scholastic activities section
 */
function renderCoScholastic(
  doc: jsPDF,
  template: ReportCardTemplate,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  styling: TemplateStyles
): number {
  let currentY = startY;

  // Section title
  doc.setFillColor(styling.primaryColor || '#4A90E2');
  doc.rect(10, currentY, pageWidth - 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CO-SCHOLASTIC ACTIVITIES', 12, currentY + 5.5);
  currentY += 10;

  // Prepare table data
  const tableHeaders = ['Activity', 'Assessment', 'Remarks'];
  const tableData = data.coScholastic.map(activity => {
    const assessment =
      activity.assessmentType === 'GRADE'
        ? activity.grade || '-'
        : activity.marks !== null
          ? `${activity.marks}/${activity.maxMarks}`
          : '-';

    return [activity.activityName, assessment, activity.remarks || '-'];
  });

  // Render table
  // Render table
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: styling.tableHeaderBg ? styling.secondaryColor : (styling.secondaryColor || '#6C757D'),
      textColor: styling.tableHeaderText || '#FFFFFF',
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: styling.textColor || '#000000',
    },
    alternateRowStyles: {
      fillColor: styling.alternateRowColor || '#f8f9fa',
    },
    styles: {
      lineColor: styling.tableBorderColor || '#dee2e6',
      lineWidth: 0.1,
    },
    margin: { left: 10, right: 10 },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Render attendance section
 */
function renderAttendance(
  doc: jsPDF,
  template: ReportCardTemplate,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  styling: TemplateStyles
): number {
  let currentY = startY;
  const sectionTitleColor = styling.sectionTitleColor || styling.primaryColor || '#4A90E2';

  // Section title
  doc.setFillColor(sectionTitleColor);
  doc.rect(10, currentY, pageWidth - 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ATTENDANCE', 12, currentY + 5.5);
  currentY += 10;

  // Attendance details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const leftCol = 12;
  const lineHeight = 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Days:', leftCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.attendance.totalDays.toString(), leftCol + 40, currentY);
  currentY += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Days Present:', leftCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.attendance.daysPresent.toString(), leftCol + 40, currentY);
  currentY += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Days Absent:', leftCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.attendance.daysAbsent.toString(), leftCol + 40, currentY);
  currentY += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Attendance %:', leftCol, currentY);
  doc.setFont('helvetica', 'normal');

  // Highlight low attendance
  const attendancePercentage = data.attendance.percentage;
  if (attendancePercentage < 75) {
    doc.setTextColor(255, 0, 0); // Red for low attendance
  }
  doc.text(`${attendancePercentage.toFixed(2)}%`, leftCol + 40, currentY);
  doc.setTextColor(0, 0, 0); // Reset color
  currentY += 10;

  return currentY;
}

/**
 * Render remarks section
 */
function renderRemarks(
  doc: jsPDF,
  template: ReportCardTemplate,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  styling: TemplateStyles
): number {
  let currentY = startY;
  const sectionTitleColor = styling.sectionTitleColor || styling.primaryColor || '#4A90E2';

  // Section title
  doc.setFillColor(sectionTitleColor);
  doc.rect(10, currentY, pageWidth - 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REMARKS', 12, currentY + 5.5);
  currentY += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Teacher remarks
  if (data.remarks.teacherRemarks) {
    doc.setFont('helvetica', 'bold');
    doc.text('Class Teacher Remarks:', 12, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    const teacherRemarksLines = doc.splitTextToSize(
      data.remarks.teacherRemarks,
      pageWidth - 24
    );
    doc.text(teacherRemarksLines, 12, currentY);
    currentY += teacherRemarksLines.length * 5 + 5;
  }

  // Principal remarks
  if (data.remarks.principalRemarks) {
    doc.setFont('helvetica', 'bold');
    doc.text('Principal Remarks:', 12, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    const principalRemarksLines = doc.splitTextToSize(
      data.remarks.principalRemarks,
      pageWidth - 24
    );
    doc.text(principalRemarksLines, 12, currentY);
    currentY += principalRemarksLines.length * 5 + 5;
  }

  currentY += 5;
  return currentY;
}

/**
 * Render footer
 */
function renderFooter(
  doc: jsPDF,
  template: ReportCardTemplate,
  pageWidth: number,
  pageHeight: number,
  styling: TemplateStyles
): void {
  const footerY = pageHeight - (styling.footerHeight || 20);

  // Add footer image if provided
  if (template.footerImage) {
    try {
      const footerHeight = styling.footerHeight || 15;
      doc.addImage(
        template.footerImage,
        'PNG',
        10,
        footerY,
        pageWidth - 20,
        footerHeight
      );
    } catch (error) {
      console.warn('Failed to add footer image:', error);
    }
  } else {
    // Default footer with signatures
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const signatureY = footerY + 10;
    const leftSignature = 30;
    const rightSignature = pageWidth - 50;

    doc.text('_________________', leftSignature, signatureY);
    doc.text('Class Teacher', leftSignature + 5, signatureY + 5);

    doc.text('_________________', rightSignature, signatureY);
    doc.text('Principal', rightSignature + 10, signatureY + 5);
  }
}


/**
 * CBSE-specific report card template
 * Follows CBSE guidelines for report card format
 */
export async function generateCBSEReportCard(
  template: ReportCardTemplate,
  data: ReportCardData,
  options?: { schoolName?: string; schoolAddress?: string }
): Promise<Buffer> {
  const doc = createPDFDocument(template);

  // CBSE format has specific requirements
  // - School logo and name at top
  // - Student details in a box
  // - Scholastic areas (subjects) with detailed marks
  // - Co-scholastic areas with grades
  // - Attendance and discipline
  // - Teacher and principal signatures

  await renderReportCard(doc, template, data, options);

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * State Board-specific report card template
 * Follows state board guidelines
 */
export async function generateStateBoardReportCard(
  template: ReportCardTemplate,
  data: ReportCardData,
  options?: { schoolName?: string; schoolAddress?: string }
): Promise<Buffer> {
  const doc = createPDFDocument(template);

  // State board format may have different requirements
  // - Simpler layout
  // - Focus on marks and grades
  // - May include additional local language content

  await renderReportCard(doc, template, data, options);

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Custom report card template
 * Fully customizable based on template configuration
 */
export async function generateCustomReportCard(
  template: ReportCardTemplate,
  data: ReportCardData,
  options?: { schoolName?: string; schoolAddress?: string }
): Promise<Buffer> {
  const doc = createPDFDocument(template);

  // Custom format uses all template configurations
  // - Fully customizable sections
  // - Custom styling and branding
  // - Flexible layout

  await renderReportCard(doc, template, data, options);

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Helper function to convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Apply color from hex string to PDF document
 */
function applyColor(doc: jsPDF, hexColor: string, type: 'fill' | 'text' = 'fill'): void {
  const rgb = hexToRgb(hexColor);

  if (type === 'fill') {
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
  } else {
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
  }
}
