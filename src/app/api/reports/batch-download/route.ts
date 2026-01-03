
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from "@/auth";
import { generateReportCardPDF } from '@/lib/services/report-card-pdf-generation';
import { aggregateReportCardData } from '@/lib/services/report-card-data-aggregation';
import JSZip from 'jszip';

// Helper for school info
async function getSchoolInfo() {
    // This should fetch from a SystemSettings or SchoolBranding table
    // For now, return default values matches the one in report-card-generation.ts
    return {
        name: 'School Name',
        address: 'School Address',
    };
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Verify user has permission (admin or teacher)
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
            return new NextResponse('Insufficient permissions', { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');
        const sectionId = searchParams.get('sectionId');
        const termId = searchParams.get('termId');
        const templateId = searchParams.get('templateId');

        if (!classId || !sectionId || !termId || !templateId) {
            return new NextResponse('Missing parameters', { status: 400 });
        }

        // Fetch class and section info for naming
        const classInfo = await db.class.findUnique({
            where: { id: classId },
            select: { name: true },
        });

        const sectionInfo = await db.classSection.findUnique({
            where: { id: sectionId },
            select: { name: true },
        });

        // Fetch all students in the class and section
        const enrollments = await db.classEnrollment.findMany({
            where: {
                classId,
                sectionId,
                status: 'ACTIVE',
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (enrollments.length === 0) {
            return new NextResponse('No students found', { status: 404 });
        }

        // Fetch school information for branding
        const schoolInfo = await getSchoolInfo();

        // Generate individual PDFs
        const pdfPromises = enrollments.map(async (enrollment) => {
            const studentId = enrollment.studentId;
            const student = enrollment.student;

            // Aggregate report card data
            const reportCardData = await aggregateReportCardData(studentId, termId);

            // Generate PDF
            const pdfResult = await generateReportCardPDF({
                templateId,
                data: reportCardData,
                schoolName: schoolInfo.name,
                schoolAddress: schoolInfo.address,
            });

            if (!pdfResult.success || !pdfResult.pdfBuffer) {
                console.error(`Failed to generate PDF for student ${studentId}`);
                return null;
            }

            // Create filename from student info
            const rollNo = student.rollNumber || 'NoRoll';
            const studentName = `${student.user.firstName}_${student.user.lastName}`.replace(/\s+/g, '_');
            const filename = `${rollNo}_${studentName}.pdf`;

            return {
                filename,
                buffer: pdfResult.pdfBuffer,
            };
        });

        const pdfResults = await Promise.all(pdfPromises);
        const validPdfs = pdfResults.filter((r): r is NonNullable<typeof r> => r !== null);

        if (validPdfs.length === 0) {
            return new NextResponse('Failed to generate any PDFs', { status: 500 });
        }

        // Create ZIP file using JSZip
        const zip = new JSZip();

        // Add each PDF to the ZIP
        for (const pdf of validPdfs) {
            zip.file(pdf.filename, pdf.buffer);
        }

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        });

        // Generate filename for download
        const className = classInfo?.name?.replace(/\s+/g, '-') || classId;
        const sectionName = sectionInfo?.name?.replace(/\s+/g, '-') || sectionId;
        const filename = `ReportCards_${className}_${sectionName}_${new Date().toISOString().split('T')[0]}.zip`;

        // Return the response with correct headers
        return new NextResponse(zipBuffer as unknown as BodyInit, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': zipBuffer.length.toString(),
            }
        });

    } catch (error) {
        console.error('Error in batch download API:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
