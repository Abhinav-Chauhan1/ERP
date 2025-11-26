 # Design Document

## Overview

This design document outlines the implementation strategy for completing the Teacher Dashboard in the School ERP system. The solution addresses missing pages (Documents, Events, Achievements), UI inconsistencies (hardcoded colors, missing SchoolLogo component, missing chevron icons), and structural improvements (Suspense boundaries, skeleton loaders, modular dashboard sections).

The implementation follows the existing patterns established in the Admin and Student dashboards while maintaining consistency with the current Teacher Dashboard architecture. The design prioritizes server-side rendering, proper loading states, theme-aware styling, and accessibility compliance.

## Architecture

### High-Level Architecture

The Teacher Dashboard follows a Next.js App Router architecture with:

1. **Layout Layer**: Shared layout with sidebar and header components
2. **Page Layer**: Individual route pages using server components where possible
3. **Component Layer**: Reusable UI components organized by feature
4. **Data Layer**: Prisma ORM for database access with proper type safety
5. **State Management**: React Server Components for data fetching, client components for interactivity

### Technology Stack

- **Framework**: Next.js 14+ with App Router
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **File Storage**: Cloudinary (for document uploads)
- **Type Safety**: TypeScript throughout

### Architectural Patterns

1. **Server-First Rendering**: Use React Server Components by default
2. **Progressive Enhancement**: Add client-side interactivity only where needed
3. **Suspense Boundaries**: Wrap async components for better loading UX
4. **Modular Components**: Separate concerns into focused, reusable components
5. **Theme-Aware Styling**: Use CSS variables instead of hardcoded colors

## Components and Interfaces

### Database Models

#### Document Model (New)

```prisma
model Document {
  id          String       @id @default(cuid())
  title       String
  description String?
  fileUrl     String
  fileType    String
  fileSize    Int
  category    DocumentCategory
  uploadedBy  User         @relation(fields: [uploadedById], references: [id])
  uploadedById String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@index([uploadedById])
  @@index([category])
}

enum DocumentCategory {
  CERTIFICATE
  ID_PROOF
  TEACHING_MATERIAL
  LESSON_PLAN
  CURRICULUM
  POLICY
  OTHER
}
```

#### Event Model (New)

```prisma
model Event {
  id          String      @id @default(cuid())
  title       String
  description String?     @db.Text
  startDate   DateTime
  endDate     DateTime
  location    String?
  category    EventCategory
  createdBy   User        @relation(fields: [createdById], references: [id])
  createdById String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  rsvps       EventRSVP[]
  
  @@index([createdById])
  @@index([category])
  @@index([startDate])
}

enum EventCategory {
  SCHOOL_EVENT
  TEACHER_MEETING
  PARENT_TEACHER_CONFERENCE
  PROFESSIONAL_DEVELOPMENT
  HOLIDAY
  EXAM
  OTHER
}

model EventRSVP {
  id        String      @id @default(cuid())
  event     Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId   String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  status    RSVPStatus  @default(PENDING)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  @@unique([eventId, userId])
  @@index([userId])
}

enum RSVPStatus {
  PENDING
  ACCEPTED
  DECLINED
  MAYBE
}
```

#### Achievement Model (New)

```prisma
model Achievement {
  id          String            @id @default(cuid())
  title       String
  description String?           @db.Text
  category    AchievementCategory
  date        DateTime
  teacher     Teacher           @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  teacherId   String
  documents   String[]          // Array of document URLs
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  @@index([teacherId])
  @@index([category])
}

enum AchievementCategory {
  AWARD
  CERTIFICATION
  PROFESSIONAL_DEVELOPMENT
  PUBLICATION
  RECOGNITION
  OTHER
}
```

### Page Components

#### Documents Page Structure

```
/teacher/documents/
├── page.tsx                    # Main documents list page
├── upload/
│   └── page.tsx               # Document upload page
└── [id]/
    └── page.tsx               # Document detail/view page
```

#### Events Page Structure

```
/teacher/events/
├── page.tsx                    # Events calendar view
└── [id]/
    └── page.tsx               # Event detail page with RSVP
```

#### Achievements Page Structure

```
/teacher/achievements/
├── page.tsx                    # Achievements list page
└── new/
    └── page.tsx               # Add new achievement page
```

#### Overview Pages Structure

```
/teacher/teaching/
└── page.tsx                    # Teaching overview page

/teacher/assessments/
└── page.tsx                    # Assessments overview page
```

### UI Components

#### Dashboard Components

```typescript
// src/app/teacher/dashboard-sections.tsx
export async function StatsSection() {
  // Fetch and display key statistics
}

export async function UpcomingClassesSection() {
  // Display today's and upcoming classes
}

export async function RecentActivitySection() {
  // Show recent assignments, exams, attendance
}

export async function QuickActionsSection() {
  // Display quick action cards
}
```

```typescript
// src/app/teacher/dashboard-skeletons.tsx
export function StatsSkeleton() {
  // Skeleton loader for stats cards
}

export function UpcomingClassesSkeleton() {
  // Skeleton loader for classes section
}

export function RecentActivitySkeleton() {
  // Skeleton loader for activity feed
}

export function QuickActionsSkeleton() {
  // Skeleton loader for quick actions
}
```

#### Feature-Specific Components

```typescript
// src/components/teacher/documents/
- document-list.tsx          # List of documents with filters
- document-card.tsx          # Individual document card
- document-upload-form.tsx   # Upload form with validation
- document-viewer.tsx        # Document preview/viewer

// src/components/teacher/events/
- event-calendar.tsx         # Calendar view of events
- event-card.tsx             # Individual event card
- event-rsvp-button.tsx      # RSVP action button
- event-filters.tsx          # Filter events by category/date

// src/components/teacher/achievements/
- achievement-list.tsx       # List of achievements
- achievement-card.tsx       # Individual achievement card
- achievement-form.tsx       # Add/edit achievement form
- achievement-export.tsx     # Export achievements to PDF
```

### API Routes

```typescript
// src/app/api/teacher/documents/route.ts
GET    /api/teacher/documents          # List documents
POST   /api/teacher/documents          # Upload document
DELETE /api/teacher/documents/[id]     # Delete document

// src/app/api/teacher/events/route.ts
GET    /api/teacher/events             # List events
POST   /api/teacher/events/[id]/rsvp   # RSVP to event

// src/app/api/teacher/achievements/route.ts
GET    /api/teacher/achievements       # List achievements
POST   /api/teacher/achievements       # Create achievement
PUT    /api/teacher/achievements/[id]  # Update achievement
DELETE /api/teacher/achievements/[id]  # Delete achievement
```

## Data Models

### Document Data Flow

1. Teacher uploads document via form
2. File is validated (type, size)
3. File is uploaded to Cloudinary
4. Document record is created in database with file URL
5. Document appears in teacher's document list

### Event Data Flow

1. Admin creates event in system
2. Event is visible to all teachers
3. Teacher views event details
4. Teacher submits RSVP (Accepted/Declined/Maybe)
5. RSVP status is stored and displayed

### Achievement Data Flow

1. Teacher creates achievement record
2. Teacher optionally uploads supporting documents
3. Achievement is stored with category and date
4. Teacher can view, edit, or export achievements

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Document Category Organization

*For any* set of documents with various categories, when displayed in the documents section, all documents should be grouped by their category and each document should appear in exactly one category group.

**Validates: Requirements 1.1**

### Property 2: Document Upload Validation

*For any* file upload attempt, the system should reject files that exceed the maximum size limit or have disallowed file types, and accept files that meet both criteria.

**Validates: Requirements 1.2**

### Property 3: Document Search Filtering

*For any* search query and document collection, the filtered results should only include documents where the query matches the document name, category, or upload date.

**Validates: Requirements 1.3**

### Property 4: Document Deletion Completeness

*For any* document, after deletion, the document should not appear in any subsequent document list queries and the associated file should be removed from storage.

**Validates: Requirements 1.4**

### Property 5: Document Download Headers

*For any* document download request, the HTTP response should include Content-Type and Content-Disposition headers that match the document's file type.

**Validates: Requirements 1.5**

### Property 6: Event Calendar Completeness

*For any* set of events, when the calendar view is rendered, all events should be visible in the calendar on their respective dates.

**Validates: Requirements 2.1**

### Property 7: Event Detail Completeness

*For any* event, when the event detail page is rendered, the output should contain the event name, date, time, location, and description.

**Validates: Requirements 2.2**

### Property 8: RSVP Persistence

*For any* event and RSVP status, after a teacher submits an RSVP, querying the event should return the teacher's RSVP status.

**Validates: Requirements 2.3**

### Property 9: Event Filtering Accuracy

*For any* event filter (category or date range) and event collection, the filtered results should only include events that match the filter criteria.

**Validates: Requirements 2.4**

### Property 10: Achievement Display Completeness

*For any* set of achievements, when the achievements section is rendered, all achievements should be displayed with their dates and descriptions.

**Validates: Requirements 3.1**

### Property 11: Achievement Validation and Persistence

*For any* achievement submission, if all required fields are present, the achievement should be stored and retrievable; if required fields are missing, the submission should be rejected with validation errors.

**Validates: Requirements 3.2**

### Property 12: Achievement Document Association

*For any* achievement and uploaded documents, after associating documents with the achievement, querying the achievement should return all associated document references.

**Validates: Requirements 3.3**

### Property 13: Achievement Category Organization

*For any* set of achievements with various categories, when displayed, achievements should be grouped by category (awards, certifications, professional development).

**Validates: Requirements 3.4**

### Property 14: Achievement Export Completeness

*For any* set of achievements, the exported document should contain all achievement records with their complete information.

**Validates: Requirements 3.5**

### Property 15: Submenu Icon State Consistency

*For any* submenu in the sidebar, when the menu is open, a ChevronDown icon should be displayed; when closed, a ChevronRight icon should be displayed.

**Validates: Requirements 4.4**

### Property 16: Accessibility Label Presence

*For any* interactive element (button, link, input), the rendered HTML should include an aria-label or aria-labelledby attribute.

**Validates: Requirements 5.4, 8.1**

### Property 17: Teaching Statistics Accuracy

*For any* set of teaching activities, the overview statistics should accurately reflect counts and summaries of subjects, classes, lessons, and timetable entries.

**Validates: Requirements 7.1**

### Property 18: Assessment Statistics Accuracy

*For any* set of assessment activities, the overview statistics should accurately reflect counts and summaries of assignments, exams, and results.

**Validates: Requirements 7.2**

### Property 19: Keyboard Navigation Support

*For any* interactive element, pressing the Tab key should move focus to the element, and pressing Enter or Space should activate it.

**Validates: Requirements 8.2**

### Property 20: Form Label Association

*For any* form input element, the rendered HTML should have an associated label element linked via htmlFor/id or aria-labelledby.

**Validates: Requirements 8.3**

### Property 21: Form Validation Completeness

*For any* form submission with missing required fields, the validation should fail and prevent submission.

**Validates: Requirements 9.1**

### Property 22: Validation Error Message Clarity

*For any* validation error, the system should display an error message that identifies the specific field and the validation rule that failed.

**Validates: Requirements 9.2**

### Property 23: Data Persistence Round Trip

*For any* valid data submission, after saving, querying the database should return the same data that was submitted.

**Validates: Requirements 9.3**

### Property 24: Error State Input Preservation

*For any* form submission that results in an error, the form should retain all user-entered values for retry.

**Validates: Requirements 9.4**

### Property 25: File Upload Validation

*For any* file upload, files with invalid types or sizes should be rejected, and files meeting all criteria should be accepted.

**Validates: Requirements 9.5**

## Error Handling

### Client-Side Error Handling

1. **Form Validation Errors**
   - Display inline error messages next to invalid fields
   - Highlight invalid fields with red borders
   - Prevent form submission until all errors are resolved
   - Preserve user input during validation

2. **File Upload Errors**
   - Validate file type and size before upload
   - Display clear error messages for invalid files
   - Show upload progress and handle network errors
   - Provide retry mechanism for failed uploads

3. **Network Errors**
   - Display toast notifications for API failures
   - Implement retry logic with exponential backoff
   - Show loading states during operations
   - Provide fallback UI for failed data fetches

### Server-Side Error Handling

1. **Database Errors**
   - Log errors with context for debugging
   - Return user-friendly error messages
   - Handle unique constraint violations gracefully
   - Implement transaction rollback for data integrity

2. **Authentication Errors**
   - Redirect to login for unauthenticated requests
   - Return 403 for unauthorized access attempts
   - Validate user roles before data access
   - Handle expired sessions gracefully

3. **File Storage Errors**
   - Handle Cloudinary upload failures
   - Implement cleanup for partial uploads
   - Validate file integrity after upload
   - Provide fallback for storage service outages

### Error Logging

- Use structured logging with context
- Include user ID, timestamp, and error details
- Log to console in development
- Send to monitoring service in production
- Track error rates and patterns

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality of individual components and functions:

1. **Component Tests**
   - Document card rendering with various props
   - Event calendar date calculations
   - Achievement form validation logic
   - Filter and search functions

2. **Utility Function Tests**
   - File type validation
   - Date formatting and parsing
   - Category grouping logic
   - Statistics calculation functions

3. **API Route Tests**
   - Request validation
   - Response formatting
   - Error handling
   - Authentication checks

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript/TypeScript property testing library).

Each property test will:
- Run a minimum of 100 iterations with random inputs
- Be tagged with the format: `**Feature: teacher-dashboard-completion, Property {number}: {property_text}**`
- Reference the specific correctness property from the design document
- Use smart generators that constrain inputs to valid ranges

**Testing Framework**: Vitest with fast-check integration

**Example Property Test Structure**:

```typescript
import { test } from 'vitest';
import * as fc from 'fast-check';

test('Property 1: Document Category Organization', () => {
  /**
   * Feature: teacher-dashboard-completion, Property 1: Document Category Organization
   * Validates: Requirements 1.1
   */
  fc.assert(
    fc.property(
      fc.array(documentArbitrary()),
      (documents) => {
        const grouped = groupDocumentsByCategory(documents);
        // Verify all documents appear exactly once
        // Verify grouping is correct
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Document Management Flow**
   - Upload document → View in list → Download → Delete
   - Search and filter documents
   - Category organization

2. **Event Management Flow**
   - View events → Filter by category → View details → RSVP
   - Calendar navigation
   - RSVP status updates

3. **Achievement Management Flow**
   - Create achievement → Upload documents → View list → Export
   - Category filtering
   - Edit and delete operations

### Accessibility Testing

1. **Automated Testing**
   - Run axe-core on all pages
   - Verify ARIA attributes
   - Check color contrast ratios
   - Validate keyboard navigation

2. **Manual Testing**
   - Screen reader testing (NVDA/JAWS)
   - Keyboard-only navigation
   - Focus management verification
   - Mobile accessibility testing

### Visual Regression Testing

1. **Theme Consistency**
   - Verify no hardcoded colors remain
   - Test light and dark mode rendering
   - Check color theme variations
   - Validate responsive layouts

2. **Component Consistency**
   - Compare with Admin/Student dashboards
   - Verify SchoolLogo usage
   - Check icon consistency
   - Validate spacing and typography

## Implementation Notes

### Theme Migration Strategy

1. **Identify Hardcoded Colors**
   - Search for `bg-emerald`, `bg-blue`, `bg-amber`, `bg-red`, `bg-purple`
   - Search for `text-emerald`, `text-blue`, etc.
   - Document all occurrences

2. **Replace with Theme Variables**
   - `bg-emerald-50` → `bg-primary/10`
   - `text-emerald-600` → `text-primary`
   - `bg-blue-100` → `bg-accent/20`
   - `text-red-700` → `text-destructive`

3. **Test Theme Switching**
   - Verify light mode appearance
   - Verify dark mode appearance
   - Test all color theme options
   - Check hover and active states

### Component Migration Strategy

1. **Update Sidebar**
   - Replace hardcoded "School ERP" with `<SchoolLogo showName={true} />`
   - Add ChevronRight icon for closed submenus
   - Update icon toggle logic
   - Add missing aria-labels

2. **Update Header**
   - Replace hardcoded text in mobile view with SchoolLogo
   - Add missing aria-labels
   - Verify responsive behavior

3. **Refactor Dashboard**
   - Extract sections to dashboard-sections.tsx
   - Create skeleton loaders in dashboard-skeletons.tsx
   - Wrap sections in Suspense boundaries
   - Update main page.tsx to use new structure

### Database Migration Strategy

1. **Create New Models**
   - Add Document model with relations
   - Add Event and EventRSVP models
   - Add Achievement model
   - Update Teacher model with relations

2. **Run Migrations**
   - Generate Prisma migration
   - Test migration on development database
   - Verify relations and indexes
   - Update Prisma client

3. **Seed Data**
   - Add sample documents for testing
   - Add sample events
   - Add sample achievements
   - Verify data integrity

### File Upload Strategy

1. **Cloudinary Configuration**
   - Set up upload presets
   - Configure folder structure
   - Set file size limits
   - Configure allowed file types

2. **Upload Flow**
   - Client-side validation
   - Progress tracking
   - Server-side validation
   - Database record creation
   - Error handling and cleanup

3. **Security Considerations**
   - Validate file types on server
   - Scan for malware (if applicable)
   - Limit file sizes
   - Implement rate limiting
   - Verify user permissions

## Performance Considerations

### Data Fetching Optimization

1. **Server Components**
   - Use React Server Components for data fetching
   - Implement parallel data fetching where possible
   - Use Suspense boundaries to prevent waterfalls
   - Cache data with appropriate revalidation

2. **Database Queries**
   - Use Prisma select to fetch only needed fields
   - Implement pagination for large lists
   - Add database indexes for common queries
   - Use connection pooling

3. **File Operations**
   - Stream large files instead of loading into memory
   - Implement lazy loading for document previews
   - Use CDN for file delivery
   - Compress images before upload

### Caching Strategy

1. **Server-Side Caching**
   - Use Next.js revalidation for static data
   - Implement Redis caching for frequently accessed data
   - Cache document metadata
   - Cache event lists with short TTL

2. **Client-Side Caching**
   - Use React Query for API responses
   - Implement optimistic updates
   - Cache user preferences locally
   - Prefetch likely next pages

### Bundle Size Optimization

1. **Code Splitting**
   - Lazy load document viewer
   - Lazy load calendar component
   - Split by route
   - Use dynamic imports for heavy components

2. **Dependency Optimization**
   - Use tree-shaking for unused code
   - Replace heavy libraries with lighter alternatives
   - Implement virtual scrolling for long lists
   - Optimize icon imports

## Security Considerations

### Authentication and Authorization

1. **Route Protection**
   - Verify Clerk authentication on all teacher routes
   - Check user role matches TEACHER
   - Validate teacher record exists
   - Implement middleware for route protection

2. **Data Access Control**
   - Teachers can only access their own documents
   - Teachers can view all events but only RSVP for themselves
   - Teachers can only manage their own achievements
   - Implement row-level security checks

### Input Validation

1. **Client-Side Validation**
   - Validate form inputs before submission
   - Sanitize user input
   - Validate file types and sizes
   - Implement rate limiting on forms

2. **Server-Side Validation**
   - Re-validate all inputs on server
   - Use Zod schemas for type safety
   - Sanitize database queries
   - Validate file contents

### File Upload Security

1. **File Validation**
   - Whitelist allowed file types
   - Verify file signatures (magic numbers)
   - Limit file sizes
   - Scan for malicious content

2. **Storage Security**
   - Use signed URLs for file access
   - Implement access control on storage
   - Set appropriate CORS policies
   - Use HTTPS for all file transfers

## Deployment Considerations

### Database Migrations

1. **Migration Process**
   - Test migrations on staging environment
   - Create backup before production migration
   - Run migrations during low-traffic periods
   - Monitor for migration errors

2. **Rollback Plan**
   - Keep previous migration files
   - Document rollback procedures
   - Test rollback on staging
   - Have database backup ready

### Environment Configuration

1. **Environment Variables**
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

2. **Feature Flags**
   - Enable documents feature gradually
   - Enable events feature gradually
   - Enable achievements feature gradually
   - Monitor for issues

### Monitoring and Observability

1. **Metrics to Track**
   - Document upload success/failure rates
   - Event RSVP rates
   - Page load times
   - Error rates by feature

2. **Logging**
   - Log all file uploads
   - Log authentication failures
   - Log database errors
   - Log API response times

3. **Alerts**
   - Alert on high error rates
   - Alert on slow database queries
   - Alert on file upload failures
   - Alert on authentication issues
