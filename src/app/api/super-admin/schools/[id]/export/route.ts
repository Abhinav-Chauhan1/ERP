import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { schoolDataManagementService } from '@/lib/services/school-data-management-service';

const exportDataSchema = z.object({
  format: z.enum(['CSV', 'JSON', 'PDF', 'XLSX']),
  dataTypes: z.array(z.enum(['students', 'teachers', 'parents', 'classes', 'subjects', 'attendance', 'fees', 'messages'])).default(['students']),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 5, // Limited exports
};

/**
 * POST /api/super-admin/schools/[id]/export
 * Export school data in specified format
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { format, dataTypes, dateRange } = exportDataSchema.parse(body);

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: (await params).id },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Use the data management service to handle the export
    const exportResult = await schoolDataManagementService.exportSchoolData(
      (await params).id,
      format,
      dataTypes,
      session.user.id
    );

    if (exportResult.requiresApproval) {
      return NextResponse.json({
        message: 'Export request submitted for approval',
        exportId: exportResult.exportId,
        status: 'PENDING_APPROVAL',
      });
    }

    // For immediate exports, generate the data
    const exportData = await generateExportData((await params).id, format, dataTypes, dateRange);
    const filename = `${school.name.replace(/\s+/g, '-').toLowerCase()}-export-${Date.now()}.${format.toLowerCase()}`;

    return new NextResponse(exportData.content as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': exportData.contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': exportData.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting school data:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Generate export data based on format and data types
 */
async function generateExportData(
  schoolId: string,
  format: string,
  dataTypes: string[],
  dateRange?: { from?: string; to?: string }
): Promise<{ content: Buffer | string; contentType: string; size: number }> {
  // Fetch actual data from database based on dataTypes
  const exportData: any = {
    school: await db.school.findUnique({ where: { id: schoolId } }),
    exportDate: new Date().toISOString(),
    dataTypes,
    dateRange,
  };

  // Add requested data types
  for (const dataType of dataTypes) {
    switch (dataType) {
      case 'students':
        exportData.students = await db.student.findMany({
          where: { schoolId },
          include: { user: { select: { name: true, email: true, mobile: true } } },
        });
        break;
      case 'teachers':
        exportData.teachers = await db.teacher.findMany({
          where: { schoolId },
          include: { user: { select: { name: true, email: true, mobile: true } } },
        });
        break;
      case 'parents':
        exportData.parents = await db.parent.findMany({
          where: { schoolId },
          include: { user: { select: { name: true, email: true, mobile: true } } },
        });
        break;
      case 'classes':
        exportData.classes = await db.class.findMany({
          where: { schoolId },
          include: { _count: { select: { enrollments: true } } },
        });
        break;
      // Add more data types as needed
    }
  }

  let content: Buffer | string;
  let contentType: string;

  switch (format) {
    case 'CSV':
      content = generateCSV(exportData);
      contentType = 'text/csv';
      break;
    case 'JSON':
      content = JSON.stringify(exportData, null, 2);
      contentType = 'application/json';
      break;
    case 'PDF':
      content = await generatePDF(exportData);
      contentType = 'application/pdf';
      break;
    case 'XLSX':
      content = await generateXLSX(exportData);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;
    default:
      throw new Error('Unsupported format');
  }

  const size = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content);

  return { content, contentType, size };
}

/**
 * Generate CSV format
 */
function generateCSV(data: any): string {
  let csv = '';
  
  // Add school info
  csv += `School: ${data.school?.name || 'Unknown'}\n`;
  csv += `Export Date: ${data.exportDate}\n\n`;

  // Add data for each type
  for (const dataType of data.dataTypes) {
    if (data[dataType] && Array.isArray(data[dataType])) {
      csv += `${dataType.toUpperCase()}\n`;
      
      if (data[dataType].length > 0) {
        // Get headers from first item
        const headers = Object.keys(data[dataType][0]);
        csv += headers.join(',') + '\n';
        
        // Add data rows
        for (const item of data[dataType]) {
          const row = headers.map(header => {
            const value = item[header];
            if (typeof value === 'object' && value !== null) {
              return JSON.stringify(value).replace(/"/g, '""');
            }
            return `"${String(value || '').replace(/"/g, '""')}"`;
          });
          csv += row.join(',') + '\n';
        }
      }
      csv += '\n';
    }
  }

  return csv;
}

/**
 * Generate PDF format (placeholder implementation)
 */
async function generatePDF(data: any): Promise<Buffer> {
  // In a real implementation, you would use a PDF library like puppeteer, jsPDF, or PDFKit
  // For now, return a mock PDF buffer
  return Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj');
}

/**
 * Generate XLSX format (placeholder implementation)
 */
async function generateXLSX(data: any): Promise<Buffer> {
  // In a real implementation, you would use a library like xlsx or exceljs
  // For now, return a mock XLSX buffer
  return Buffer.from('PK\x03\x04');
}