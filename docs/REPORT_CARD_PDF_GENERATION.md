# Report Card PDF Generation Implementation

## Overview

This document describes the implementation of the Report Card PDF Generation system for the School ERP. The system supports generating print-ready PDF report cards with multiple customizable templates.

## Features Implemented

### 1. PDF Generation Service
- **Location**: `src/lib/services/report-card-pdf-generation.ts`
- **Features**:
  - Support for multiple template types (CBSE, State Board, Custom)
  - Customizable page size (A4, Letter, Legal) and orientation (Portrait, Landscape)
  - School branding (logo, header, footer images)
  - Dynamic data rendering from report card data
  - Automatic table generation for marks and grades
  - Co-scholastic activities section
  - Attendance tracking with low attendance highlighting
  - Teacher and principal remarks
  - Print-ready PDF output

### 2. Server Actions
- **Location**: `src/lib/actions/report-card-generation.ts`
- **Actions**:
  - `generateSingleReportCard`: Generate report card for a single student
  - `generateBatchReportCards`: Generate report cards for entire class
  - `getReportCardTemplates`: Fetch available templates
  - `previewReportCard`: Preview report card data before generation
  - PDF storage integration with Cloudinary

### 3. UI Components

#### Generate Report Card Dialog
- **Location**: `src/components/admin/report-cards/generate-report-card-dialog.tsx`
- **Features**:
  - Template selection dropdown
  - Preview data functionality
  - Generate and download PDF
  - Real-time status updates

#### Batch Generate Report Cards Dialog
- **Location**: `src/components/admin/report-cards/batch-generate-report-cards-dialog.tsx`
- **Features**:
  - Class and section selection
  - Template selection
  - Progress indicator during generation
  - Download batch PDF with all report cards
  - Each report card starts on a new page

### 4. Cloudinary Integration
- **Updated**: `src/lib/cloudinary.ts`
- **Enhancements**:
  - Support for data URI uploads (base64 strings)
  - PDF format support
  - Custom public_id and format parameters

## Technical Stack

- **PDF Library**: jsPDF v3.0.4
- **Table Generation**: jspdf-autotable v5.0.2
- **Storage**: Cloudinary (for PDF storage)
- **Framework**: Next.js 15 with Server Actions
- **Database**: PostgreSQL with Prisma ORM

## Database Schema

### ReportCardTemplate Model
```prisma
model ReportCardTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  type        String   // "CBSE", "STATE_BOARD", "CUSTOM"
  
  // Page settings
  pageSize    String   @default("A4")
  orientation String   @default("PORTRAIT")
  
  // Template configuration (JSON)
  sections    Json     // Array of section configs
  styling     Json     // CSS/styling configuration
  
  // Branding assets
  headerImage String?
  footerImage String?
  schoolLogo  String?
  
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  reportCards ReportCard[]
}
```

### ReportCard Model (Extended)
```prisma
model ReportCard {
  // ... existing fields ...
  
  template         ReportCardTemplate?  @relation(fields: [templateId], references: [id])
  templateId       String?
  
  // Co-scholastic section
  coScholasticData Json?
  
  // Generated PDF
  pdfUrl           String?
  
  // ... rest of fields ...
}
```

## Usage Examples

### Single Report Card Generation

```typescript
import { generateSingleReportCard } from '@/lib/actions/report-card-generation';

const result = await generateSingleReportCard(
  studentId,
  termId,
  templateId
);

if (result.success) {
  console.log('PDF URL:', result.data.pdfUrl);
  console.log('Report Card ID:', result.data.reportCardId);
}
```

### Batch Report Card Generation

```typescript
import { generateBatchReportCards } from '@/lib/actions/report-card-generation';

const result = await generateBatchReportCards(
  classId,
  sectionId,
  termId,
  templateId
);

if (result.success) {
  console.log('Batch PDF URL:', result.data.pdfUrl);
  console.log('Total Generated:', result.data.totalGenerated);
}
```

### Using UI Components

```tsx
import { GenerateReportCardDialog } from '@/components/admin/report-cards';

<GenerateReportCardDialog
  studentId="student-id"
  studentName="John Doe"
  termId="term-id"
  termName="First Term"
/>
```

```tsx
import { BatchGenerateReportCardsDialog } from '@/components/admin/report-cards';

<BatchGenerateReportCardsDialog
  classes={classes}
  sections={sections}
  termId="term-id"
  termName="First Term"
/>
```

## Template Configuration

### Template Sections
Templates support the following configurable sections:

1. **Student Information**
   - Name, Admission ID, Class, Section
   - Roll Number, Date of Birth
   - Rank (if calculated)

2. **Academic Performance**
   - Subject-wise marks breakdown
   - Theory, Practical, Internal marks
   - Total marks, percentage, grade
   - Overall performance summary

3. **Co-Scholastic Activities**
   - Activity name and assessment
   - Grade or marks-based evaluation
   - Remarks

4. **Attendance**
   - Total days, days present, days absent
   - Attendance percentage
   - Low attendance highlighting (< 75%)

5. **Remarks**
   - Class teacher remarks
   - Principal remarks

### Template Styling
Templates support customizable styling:

```typescript
{
  primaryColor: '#4A90E2',      // Header and section titles
  secondaryColor: '#6C757D',    // Co-scholastic section
  fontFamily: 'helvetica',      // Font family
  fontSize: 10,                 // Base font size
  headerHeight: 30,             // Header image height
  footerHeight: 20,             // Footer height
  borderColor: '#000000',       // Border color
  tableBorderColor: '#CCCCCC'   // Table border color
}
```

## PDF Generation Flow

1. **Data Aggregation**
   - Fetch student information
   - Fetch exam results with marks breakdown
   - Calculate overall performance
   - Fetch co-scholastic grades
   - Calculate attendance
   - Fetch remarks

2. **Template Selection**
   - User selects template
   - Template configuration loaded from database

3. **PDF Generation**
   - Create jsPDF document with template settings
   - Render header with school branding
   - Render student information section
   - Render academic performance table
   - Render co-scholastic section (if enabled)
   - Render attendance section (if enabled)
   - Render remarks section (if enabled)
   - Render footer with signatures

4. **Storage**
   - Convert PDF to buffer
   - Upload to Cloudinary as raw resource
   - Store PDF URL in database

5. **Download**
   - Provide download link to user
   - PDF opens in new tab for printing

## Testing

### Unit Tests
- **Location**: `src/lib/services/__tests__/report-card-pdf-generation.test.ts`
- **Coverage**:
  - PDF generation with valid data
  - Error handling for non-existent templates
  - Absent student handling
  - Co-scholastic section inclusion
  - Low attendance highlighting

### Test Results
```
✓ should generate PDF successfully with valid data
✓ should return error for non-existent template
✓ should handle absent students correctly
✓ should include co-scholastic section when data is present
✓ should handle low attendance highlighting
```

## Requirements Validation

### Requirement 5.4: Print-Ready PDF Generation
✅ **Implemented**
- PDF documents generated with proper dimensions
- Support for A4, Letter, and Legal page sizes
- Portrait and landscape orientations
- Print-ready formatting

### Requirement 5.5: Template Rendering with Dynamic Data
✅ **Implemented**
- Dynamic data population from report card data
- School branding (logo, header, footer)
- Customizable sections and styling
- Multiple template types (CBSE, State Board, Custom)

## Performance Considerations

1. **Batch Generation**
   - Generates all report cards in a single PDF
   - Efficient memory usage with streaming
   - Progress indication for user feedback

2. **PDF Storage**
   - PDFs stored in Cloudinary for CDN delivery
   - Reduces server storage requirements
   - Fast download speeds

3. **Caching**
   - Template configurations cached
   - Report card data aggregated efficiently
   - Parallel data fetching where possible

## Security

1. **Authentication**
   - All actions require authentication
   - Only ADMIN and TEACHER roles can generate report cards

2. **Authorization**
   - Users can only generate report cards for their assigned classes
   - PDF URLs are secure Cloudinary URLs

3. **Data Validation**
   - Input validation on all parameters
   - Template existence verification
   - Student and term validation

## Future Enhancements

1. **Additional Template Types**
   - ICSE format
   - International Baccalaureate (IB) format
   - Custom regional formats

2. **Advanced Customization**
   - Drag-and-drop template builder
   - Custom field addition
   - Conditional section display

3. **Bulk Operations**
   - Schedule batch generation
   - Email report cards to parents
   - Print queue management

4. **Analytics**
   - Track report card generation
   - Popular template usage
   - Generation time metrics

## Troubleshooting

### PDF Generation Fails
- Check template exists and is active
- Verify student has exam results for the term
- Check Cloudinary configuration
- Review server logs for detailed errors

### PDF Not Displaying Correctly
- Verify template styling configuration
- Check image URLs are accessible
- Ensure fonts are properly loaded
- Test with different page sizes

### Batch Generation Timeout
- Reduce batch size
- Increase server timeout settings
- Consider background job processing
- Monitor server resources

## Related Documentation

- [Report Card Data Aggregation](./REPORT_CARD_DATA_AGGREGATION.md)
- [Marks Entry System](./MARKS_ENTRY_SYSTEM.md)
- [Grade Calculation](./GRADE_CALCULATION.md)
- [Cloudinary Integration](./CLOUDINARY_INTEGRATION.md)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test cases for examples
3. Consult the API documentation
4. Contact the development team
