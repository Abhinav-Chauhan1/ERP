# Certificate Generation Implementation Guide

## Current Status

⚠️ **Not Implemented** - Certificate generation is currently a stub function

## Overview

The graduation system includes a `generateGraduationCertificates()` function that is called when students graduate, but it doesn't actually generate certificates. This document provides guidance on implementing this feature.

## Implementation Options

### Option 1: React-PDF (Recommended for Simple Certificates)

**Pros:**
- Pure React components
- Good for simple, text-based certificates
- Easy to style with familiar React/CSS syntax
- Lightweight

**Cons:**
- Limited design flexibility
- May struggle with complex layouts

**Installation:**
```bash
npm install @react-pdf/renderer
```

**Example Implementation:**
```typescript
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Define certificate template
const CertificateDocument = ({ student, school, date }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>{school.name}</Text>
        <Text style={styles.subtitle}>Certificate of Graduation</Text>
        <Text style={styles.body}>
          This is to certify that
        </Text>
        <Text style={styles.studentName}>{student.name}</Text>
        <Text style={styles.body}>
          has successfully completed all requirements
          for graduation from {student.class}
        </Text>
        <Text style={styles.date}>Date: {date}</Text>
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: { padding: 50 },
  section: { textAlign: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
  subtitle: { fontSize: 18, marginBottom: 30 },
  studentName: { fontSize: 20, fontWeight: 'bold', margin: 20 },
  date: { marginTop: 50 }
});

// Generate PDF
async function generateCertificate(student: any, school: any, date: Date) {
  const doc = <CertificateDocument student={student} school={school} date={date} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}
```

### Option 2: Puppeteer (Best for Complex Designs)

**Pros:**
- Full HTML/CSS support
- Can render any web design
- Great for complex, styled certificates
- Can use existing HTML templates

**Cons:**
- Requires Chromium (larger deployment)
- More resource-intensive
- Slower generation

**Installation:**
```bash
npm install puppeteer
```

**Example Implementation:**
```typescript
import puppeteer from 'puppeteer';

async function generateCertificate(student: any, school: any, date: Date) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // Set HTML content
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Georgia', serif;
            padding: 50px;
            text-align: center;
          }
          h1 { font-size: 36px; margin-bottom: 20px; }
          .student-name { font-size: 28px; font-weight: bold; margin: 30px 0; }
        </style>
      </head>
      <body>
        <h1>${school.name}</h1>
        <h2>Certificate of Graduation</h2>
        <p>This is to certify that</p>
        <div class="student-name">${student.name}</div>
        <p>has successfully completed all requirements</p>
        <p>Date: ${date.toLocaleDateString()}</p>
      </body>
    </html>
  `);

  // Generate PDF
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  return pdf;
}
```

### Option 3: PDFKit (Low-Level Control)

**Pros:**
- Full control over PDF generation
- Good performance
- No browser required
- Can add signatures, watermarks, etc.

**Cons:**
- More complex API
- Manual positioning required
- Steeper learning curve

**Installation:**
```bash
npm install pdfkit
```

## Complete Implementation Steps

### 1. Choose PDF Library

Select one of the options above based on your needs.

### 2. Create Certificate Templates

Add to database or file system:

```typescript
// Example template structure
interface CertificateTemplate {
  id: string;
  name: string;
  type: 'graduation' | 'achievement' | 'participation';
  layout: 'portrait' | 'landscape';
  headerText: string;
  bodyTemplate: string; // HTML or template string
  footerText: string;
  schoolLogo: boolean;
  signatureFields: string[];
  createdAt: Date;
}
```

### 3. Implement Generation Logic

Update `graduationActions.ts`:

```typescript
import { uploadToR2 } from '@/lib/services/r2-service';

async function generateGraduationCertificates(
  studentIds: string[],
  graduationDate: Date
): Promise<number> {
  try {
    let successCount = 0;

    for (const studentId of studentIds) {
      // Fetch student details
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { class: true }
          }
        }
      });

      if (!student) continue;

      // Fetch school details
      const school = await db.school.findUnique({
        where: { id: student.schoolId },
        select: { name: true, logo: true }
      });

      // Generate certificate PDF
      const pdfBuffer = await generateCertificatePDF(student, school, graduationDate);

      // Upload to R2 storage
      const fileName = `certificates/graduation/${student.id}-${Date.now()}.pdf`;
      const url = await uploadToR2(fileName, pdfBuffer, 'application/pdf');

      // Store certificate record (if model exists)
      // await db.generatedCertificate.create({
      //   data: {
      //     studentId: student.id,
      //     schoolId: student.schoolId,
      //     type: 'GRADUATION',
      //     certificateUrl: url,
      //     issuedDate: graduationDate,
      //   }
      // });

      successCount++;
    }

    return successCount;
  } catch (error) {
    console.error('Error generating certificates:', error);
    throw error;
  }
}
```

### 4. Add Email Delivery

```typescript
import { sendEmail } from '@/lib/services/email-service';

async function emailCertificate(studentId: string, certificateUrl: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { user: true }
  });

  if (!student?.user.email) return;

  await sendEmail({
    to: student.user.email,
    subject: 'Your Graduation Certificate',
    html: `
      <p>Dear ${student.user.name},</p>
      <p>Congratulations on your graduation! Your certificate is ready.</p>
      <p><a href="${certificateUrl}">Download Certificate</a></p>
    `
  });
}
```

### 5. Add Download Endpoint

Create `src/app/api/certificates/[id]/download/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch certificate
  const certificate = await db.generatedCertificate.findUnique({
    where: { id: params.id }
  });

  if (!certificate) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  // Verify access (student or admin)
  if (
    certificate.studentId !== session.user.id &&
    session.user.role !== 'ADMIN'
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Redirect to R2 signed URL
  return NextResponse.redirect(certificate.certificateUrl);
}
```

## Database Schema

Add models if not present:

```prisma
model CertificateTemplate {
  id             String   @id @default(cuid())
  schoolId       String
  name           String
  type           String
  layout         String
  headerText     String
  bodyTemplate   String
  footerText     String?
  schoolLogo     Boolean  @default(true)
  signatureFields Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  school School @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@index([schoolId])
}

model GeneratedCertificate {
  id              String   @id @default(cuid())
  schoolId        String
  studentId       String
  templateId      String?
  type            String
  certificateUrl  String
  issuedDate      DateTime
  createdAt       DateTime @default(now())

  school   School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student  Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([schoolId])
  @@index([studentId])
}
```

## Testing

```typescript
// Test certificate generation
describe('Certificate Generation', () => {
  it('should generate certificate for student', async () => {
    const pdf = await generateCertificatePDF(mockStudent, mockSchool, new Date());
    expect(pdf).toBeDefined();
    expect(pdf.length).toBeGreaterThan(0);
  });

  it('should upload certificate to R2', async () => {
    const url = await uploadCertificate(mockPdfBuffer, 'test.pdf');
    expect(url).toMatch(/^https:\/\//);
  });
});
```

## Performance Considerations

- **Batch Processing**: Generate certificates in batches to avoid timeout
- **Queue System**: Use a job queue for large classes (50+ students)
- **Caching**: Cache school logos and templates
- **Async Processing**: Generate certificates in background job

## Cost Estimate

- **Storage**: ~50KB per certificate, $0.015/GB/month on R2
- **Bandwidth**: ~50KB download per view
- **Generation**: CPU-intensive, ~1-2 seconds per certificate

For 100 students graduating:
- Storage: ~5MB = $0.00008/month
- Generation time: ~2-3 minutes
- Cost: Negligible

## Alternative Solutions

If implementation is complex:
1. Use external service (DocuSign, HelloSign)
2. Manual certificate generation (template + mail merge)
3. Integrate with school's existing certificate system

## Resources

- React-PDF: https://react-pdf.org/
- Puppeteer: https://pptr.dev/
- PDFKit: https://pdfkit.org/
- R2 Upload: See `src/lib/services/r2-service.ts`

## Support

For questions or assistance:
- Check existing PDF generation in report cards
- Review R2 upload service implementation
- Contact development team lead
