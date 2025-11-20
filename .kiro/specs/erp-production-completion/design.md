# Design Document

## Overview

This design document outlines the technical architecture and implementation strategy to complete the School ERP system to 100% production readiness. The system currently operates at 85-95% completion with a solid foundation built on Next.js 15, TypeScript, PostgreSQL, Prisma ORM, and Clerk authentication. This design focuses on performance optimization, security hardening, and implementing critical missing features while maintaining the existing architecture patterns.

The design follows a phased approach prioritizing high-impact improvements that can be delivered incrementally without disrupting the existing production system.

## Architecture

### Current Architecture Assessment

The system follows a modern Next.js 15 App Router architecture with:
- **Frontend**: React Server Components with selective Client Components
- **Backend**: Next.js Server Actions for data mutations
- **Database**: PostgreSQL with Prisma ORM (55+ models)
- **Authentication**: Clerk with role-based access control
- **File Storage**: Cloudinary for media assets
- **Payments**: Razorpay integration
- **Styling**: Tailwind CSS with Radix UI components

### Architectural Enhancements

#### 1. Caching Layer Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼──────────────────────────────────┐
│     Next.js App Router                   │
│  ┌────────────────────────────────────┐ │
│  │   Server Components (RSC)          │ │
│  │   - Automatic Static Caching       │ │
│  │   - Request Memoization            │ │
│  └────────────┬───────────────────────┘ │
│               │                          │
│  ┌────────────▼───────────────────────┐ │
│  │   Server Actions                   │ │
│  │   - unstable_cache() for dynamic   │ │
│  │   - revalidateTag() for updates    │ │
│  └────────────┬───────────────────────┘ │
└───────────────┼──────────────────────────┘
                │
       ┌────────▼────────┐
       │   Prisma ORM    │
       └────────┬────────┘
                │
       ┌────────▼────────┐
       │   PostgreSQL    │
       └─────────────────┘
```

**Cache Strategy**:
- **Static Caching**: Next.js automatic caching for static data (academic years, terms, etc.)
- **Dynamic Caching**: `unstable_cache()` for frequently accessed dynamic data
- **Request Memoization**: Automatic deduplication of identical requests within a single render
- **Cache Tags**: Tag-based invalidation (e.g., `['students', 'class-1']`)
- **Revalidation**: Time-based (`revalidate: 3600`) and on-demand (`revalidateTag()`)
- **Invalidation**: Event-driven cache invalidation using `revalidateTag()` and `revalidatePath()`

#### 2. Database Optimization Architecture

**Connection Pooling**:
```
Application Instances (1-N)
        │
        ▼
┌───────────────────┐
│  Connection Pool  │
│  (10-20 conns)    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   PostgreSQL      │
│   (Max 100 conns) │
└───────────────────┘
```

**Index Strategy**:
- Composite indexes on frequently queried field combinations
- Covering indexes for common SELECT queries
- Partial indexes for filtered queries

#### 3. Security Architecture

```
┌──────────────────────────────────────┐
│         Security Layers              │
├──────────────────────────────────────┤
│  1. Edge Middleware                  │
│     - Rate Limiting                  │
│     - IP Whitelisting                │
│     - CSRF Protection                │
├──────────────────────────────────────┤
│  2. Authentication (Clerk)           │
│     - Session Management             │
│     - 2FA (Optional)                 │
├──────────────────────────────────────┤
│  3. Authorization                    │
│     - Role-Based Access Control      │
│     - Permission-Based Access        │
├──────────────────────────────────────┤
│  4. Audit Logging                    │
│     - Action Tracking                │
│     - Data Access Logs               │
└──────────────────────────────────────┘
```

## Components and Interfaces

### 1. Next.js Caching Utilities

```typescript
import { unstable_cache } from 'next/cache';
import { revalidateTag, revalidatePath } from 'next/cache';

// Cached data fetching with tags
export const getCachedAcademicYears = unstable_cache(
  async () => {
    return await prisma.academicYear.findMany();
  },
  ['academic-years'],
  {
    revalidate: 3600, // 1 hour
    tags: ['academic-years'],
  }
);

// Cache invalidation helper
export async function invalidateCache(tags: string[]) {
  for (const tag of tags) {
    revalidateTag(tag);
  }
}

// Path-based revalidation
export async function invalidatePath(path: string) {
  revalidatePath(path);
}

interface CacheConfig {
  revalidate?: number | false; // Time in seconds or false for no revalidation
  tags?: string[]; // Tags for cache invalidation
}
```

### 2. Performance Monitoring Service

```typescript
interface PerformanceMonitor {
  trackPageLoad(route: string, duration: number): void;
  trackQueryPerformance(query: string, duration: number): void;
  trackAPICall(endpoint: string, duration: number, status: number): void;
  reportWebVitals(metrics: WebVitals): void;
}

interface WebVitals {
  CLS: number;  // Cumulative Layout Shift
  FID: number;  // First Input Delay
  LCP: number;  // Largest Contentful Paint
  FCP: number;  // First Contentful Paint
  TTFB: number; // Time to First Byte
}
```

### 3. Audit Logging Service

```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
}

interface AuditService {
  log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;
  query(filters: AuditFilters): Promise<AuditLog[]>;
}
```

### 4. Library Management Interfaces

```typescript
interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  category: BookCategory;
  quantity: number;
  available: number;
  location?: string;
  coverImage?: string;
}

interface BookIssue {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  fine?: number;
  status: IssueStatus;
}

enum IssueStatus {
  ISSUED = 'ISSUED',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
  LOST = 'LOST',
}
```

### 5. Admission Portal Interfaces

```typescript
interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  studentName: string;
  dateOfBirth: Date;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  previousSchool?: string;
  appliedClass: string;
  documents: ApplicationDocument[];
  status: ApplicationStatus;
  submittedAt: Date;
}

enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WAITLISTED = 'WAITLISTED',
}

interface ApplicationDocument {
  type: DocumentType;
  url: string;
  uploadedAt: Date;
}
```

### 6. Backup Service Interface

```typescript
interface BackupService {
  createBackup(): Promise<BackupResult>;
  scheduleBackup(schedule: CronExpression): Promise<void>;
  restoreBackup(backupId: string): Promise<RestoreResult>;
  listBackups(): Promise<Backup[]>;
  deleteBackup(backupId: string): Promise<void>;
}

interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  location: BackupLocation;
  encrypted: boolean;
}

enum BackupLocation {
  LOCAL = 'LOCAL',
  CLOUD = 'CLOUD',
  BOTH = 'BOTH',
}
```

## Data Models

### New Database Models

#### 1. Library Management Models

```prisma
model Book {
  id          String      @id @default(cuid())
  isbn        String      @unique
  title       String
  author      String
  publisher   String?
  category    String
  quantity    Int
  available   Int
  location    String?
  coverImage  String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  issues      BookIssue[]
  reservations BookReservation[]
  
  @@index([category])
  @@index([title])
}

model BookIssue {
  id          String    @id @default(cuid())
  bookId      String
  book        Book      @relation(fields: [bookId], references: [id])
  studentId   String
  student     Student   @relation(fields: [studentId], references: [id])
  issueDate   DateTime  @default(now())
  dueDate     DateTime
  returnDate  DateTime?
  fine        Float     @default(0)
  status      String    @default("ISSUED")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([studentId, status])
  @@index([bookId, status])
  @@index([dueDate, status])
}

model BookReservation {
  id          String    @id @default(cuid())
  bookId      String
  book        Book      @relation(fields: [bookId], references: [id])
  studentId   String
  student     Student   @relation(fields: [studentId], references: [id])
  reservedAt  DateTime  @default(now())
  expiresAt   DateTime
  status      String    @default("ACTIVE")
  
  @@index([studentId, status])
  @@index([bookId, status])
}
```

#### 2. Admission Portal Models

```prisma
model AdmissionApplication {
  id                String    @id @default(cuid())
  applicationNumber String    @unique
  studentName       String
  dateOfBirth       DateTime
  gender            String
  parentName        String
  parentEmail       String
  parentPhone       String
  address           String
  previousSchool    String?
  appliedClassId    String
  appliedClass      Class     @relation(fields: [appliedClassId], references: [id])
  documents         ApplicationDocument[]
  status            String    @default("SUBMITTED")
  submittedAt       DateTime  @default(now())
  reviewedAt        DateTime?
  reviewedBy        String?
  remarks           String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([status])
  @@index([appliedClassId, status])
  @@index([submittedAt])
}

model ApplicationDocument {
  id            String              @id @default(cuid())
  applicationId String
  application   AdmissionApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  type          String
  url           String
  filename      String
  uploadedAt    DateTime            @default(now())
  
  @@index([applicationId])
}
```

#### 3. Audit Log Model

```prisma
model AuditLog {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  action      String
  resource    String
  resourceId  String?
  changes     Json?
  ipAddress   String
  userAgent   String
  timestamp   DateTime  @default(now())
  
  @@index([userId, timestamp])
  @@index([resource, resourceId])
  @@index([timestamp])
}
```

#### 4. Backup Model

```prisma
model Backup {
  id          String    @id @default(cuid())
  filename    String
  size        BigInt
  location    String
  encrypted   Boolean   @default(true)
  status      String    @default("COMPLETED")
  createdAt   DateTime  @default(now())
  createdBy   String?
  
  @@index([createdAt])
  @@index([status])
}
```

#### 5. Transport Management Models

```prisma
model Vehicle {
  id              String    @id @default(cuid())
  registrationNo  String    @unique
  vehicleType     String
  capacity        Int
  driverId        String?
  driver          Driver?   @relation(fields: [driverId], references: [id])
  status          String    @default("ACTIVE")
  routes          Route[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([status])
}

model Driver {
  id          String    @id @default(cuid())
  name        String
  phone       String
  licenseNo   String    @unique
  vehicles    Vehicle[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Route {
  id          String    @id @default(cuid())
  name        String
  vehicleId   String
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])
  stops       RouteStop[]
  students    StudentRoute[]
  fee         Float
  status      String    @default("ACTIVE")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([vehicleId])
  @@index([status])
}

model RouteStop {
  id          String    @id @default(cuid())
  routeId     String
  route       Route     @relation(fields: [routeId], references: [id], onDelete: Cascade)
  stopName    String
  arrivalTime String
  sequence    Int
  
  @@index([routeId, sequence])
}

model StudentRoute {
  id          String    @id @default(cuid())
  studentId   String
  student     Student   @relation(fields: [studentId], references: [id])
  routeId     String
  route       Route     @relation(fields: [routeId], references: [id])
  pickupStop  String
  dropStop    String
  createdAt   DateTime  @default(now())
  
  @@unique([studentId, routeId])
  @@index([routeId])
}
```

#### 6. Online Examination Models

```prisma
model QuestionBank {
  id          String    @id @default(cuid())
  question    String
  questionType String   // MCQ, TRUE_FALSE, ESSAY
  options     Json?     // For MCQ
  correctAnswer String?
  marks       Float
  subjectId   String
  subject     Subject   @relation(fields: [subjectId], references: [id])
  topic       String?
  difficulty  String    @default("MEDIUM")
  createdBy   String
  teacher     Teacher   @relation(fields: [createdBy], references: [id])
  usageCount  Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([subjectId, topic])
  @@index([difficulty])
}

model OnlineExam {
  id          String    @id @default(cuid())
  title       String
  subjectId   String
  subject     Subject   @relation(fields: [subjectId], references: [id])
  classId     String
  class       Class     @relation(fields: [classId], references: [id])
  duration    Int       // in minutes
  totalMarks  Float
  questions   Json      // Array of question IDs
  startTime   DateTime
  endTime     DateTime
  createdBy   String
  teacher     Teacher   @relation(fields: [createdBy], references: [id])
  attempts    ExamAttempt[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([classId, startTime])
  @@index([subjectId])
}

model ExamAttempt {
  id          String    @id @default(cuid())
  examId      String
  exam        OnlineExam @relation(fields: [examId], references: [id])
  studentId   String
  student     Student   @relation(fields: [studentId], references: [id])
  answers     Json
  score       Float?
  startedAt   DateTime  @default(now())
  submittedAt DateTime?
  status      String    @default("IN_PROGRESS")
  
  @@unique([examId, studentId])
  @@index([studentId, status])
}
```

#### 7. Inventory Management Models

```prisma
model Asset {
  id              String    @id @default(cuid())
  name            String
  category        String
  quantity        Int
  location        String?
  purchaseDate    DateTime
  purchasePrice   Float
  depreciationRate Float    @default(0)
  currentValue    Float
  status          String    @default("ACTIVE")
  allocations     AssetAllocation[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([category, status])
}

model AssetAllocation {
  id          String    @id @default(cuid())
  assetId     String
  asset       Asset     @relation(fields: [assetId], references: [id])
  allocatedTo String    // Department or person
  allocatedBy String
  allocatedAt DateTime  @default(now())
  returnedAt  DateTime?
  status      String    @default("ALLOCATED")
  
  @@index([assetId, status])
}

model PurchaseOrder {
  id          String    @id @default(cuid())
  orderNumber String    @unique
  vendorName  String
  vendorContact String?
  items       Json
  totalAmount Float
  status      String    @default("PENDING")
  orderedAt   DateTime  @default(now())
  deliveredAt DateTime?
  createdBy   String
  
  @@index([status])
  @@index([orderedAt])
}
```

### Database Indexes Enhancement

```prisma
// Enhanced indexes for existing models

model StudentAttendance {
  // ... existing fields
  
  @@index([studentId, date])
  @@index([sectionId, date, status])
  @@index([date, status])
}

model ExamResult {
  // ... existing fields
  
  @@index([studentId, examId])
  @@index([examId, marks])
  @@index([studentId, createdAt])
}

model FeePayment {
  // ... existing fields
  
  @@index([studentId, status, paymentDate])
  @@index([status, paymentDate])
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Performance Properties

**Property 1: Page Load Performance**
*For any* dashboard page, when accessed by a user, the page load time should be under 2 seconds
**Validates: Requirements 1.1**

**Property 2: Query Performance**
*For any* complex database query, the execution time should be under 500 milliseconds
**Validates: Requirements 1.2**

**Property 3: Cache Effectiveness**
*For any* static asset request, serving from cache should reduce load time by at least 50% compared to non-cached requests
**Validates: Requirements 1.3**

**Property 4: Concurrent User Performance**
*For any* system operation with 100+ concurrent users, response times should remain under 3 seconds
**Validates: Requirements 1.4**

**Property 5: Pagination Consistency**
*For any* list query returning large datasets, the system should implement pagination with maximum 50 records per page
**Validates: Requirements 1.5**

### Caching Properties

**Property 6: Cache-First Strategy**
*For any* cached data request, the system should serve from Redis cache before querying the database
**Validates: Requirements 2.2**

**Property 7: Cache Invalidation on Mutation**
*For any* data update operation, the system should invalidate related cache entries immediately
**Validates: Requirements 2.5**

**Property 8: Cache Fallback Resilience**
*For any* cache failure scenario, the system should fallback to database queries without throwing errors
**Validates: Requirements 2.4**

### Database Optimization Properties

**Property 9: N+1 Query Prevention**
*For any* query with relationships, the system should use Prisma include statements to prevent N+1 queries
**Validates: Requirements 3.1**

**Property 10: Report Generation Performance**
*For any* report generation request, the query should complete within 3 seconds
**Validates: Requirements 3.5**


### Mobile Responsiveness Properties

**Property 11: Mobile Layout Adaptation**
*For any* page accessed on a device with screen width below 768px, the system should display a responsive layout
**Validates: Requirements 4.1**

**Property 12: Mobile Table Transformation**
*For any* data table viewed on mobile, the system should transform it into a mobile-friendly card layout
**Validates: Requirements 4.2**

**Property 13: Touch Target Sizing**
*For any* form input on mobile, the tap target should be minimum 44px in height and width
**Validates: Requirements 4.4**

**Property 14: Responsive Chart Rendering**
*For any* chart viewed on mobile, the visualization should fit within the viewport without horizontal scrolling
**Validates: Requirements 4.5**

### Accessibility Properties

**Property 15: Focus Indicator Visibility**
*For any* interactive element, keyboard navigation should display visible focus indicators
**Validates: Requirements 5.1**

**Property 16: ARIA Label Completeness**
*For any* custom component, the system should provide ARIA labels for screen reader compatibility
**Validates: Requirements 5.2**

**Property 17: Color Contrast Compliance**
*For any* UI element, the color contrast ratio should meet or exceed WCAG 2.1 AA standard of 4.5:1
**Validates: Requirements 5.3**

**Property 18: Image Alt Text Presence**
*For any* meaningful image, the system should provide descriptive alt text
**Validates: Requirements 5.5**


### Security Properties

**Property 19: Audit Logging Completeness**
*For any* user action, the system should create an audit log entry with timestamp, user ID, and action type
**Validates: Requirements 6.2**

**Property 20: Rate Limiting Enforcement**
*For any* API endpoint, the system should enforce rate limiting of 100 requests per 10 seconds per IP address
**Validates: Requirements 6.3**

**Property 21: Session Timeout Enforcement**
*For any* user session exceeding 8 hours, the system should automatically terminate and require re-authentication
**Validates: Requirements 6.5**

### Library Management Properties

**Property 22: Book Issue Inventory Update**
*For any* book issue operation, the system should decrease available quantity and record issue date and due date
**Validates: Requirements 7.2**

**Property 23: Overdue Fine Calculation**
*For any* overdue book return, the system should calculate fines based on the number of days overdue multiplied by the daily rate
**Validates: Requirements 7.3**

**Property 24: Book Reservation Availability**
*For any* book with zero available copies, the system should allow students to create reservations
**Validates: Requirements 7.4**

### Admission Portal Properties

**Property 25: Application Number Uniqueness**
*For any* submitted admission application, the system should assign a unique application number
**Validates: Requirements 8.3**

**Property 26: Document Upload Acceptance**
*For any* admission application, the system should accept file uploads for birth certificates, report cards, and photographs
**Validates: Requirements 8.2**

**Property 27: Merit List Ranking**
*For any* merit list generation, the system should rank applications based on configured criteria
**Validates: Requirements 8.5**


### Backup and Restore Properties

**Property 28: Backup Encryption**
*For any* created backup, the system should compress and encrypt the backup file
**Validates: Requirements 9.2**

**Property 29: Backup Dual Storage**
*For any* completed backup, the system should store copies in both local and cloud storage
**Validates: Requirements 9.3**

**Property 30: Backup-Restore Round Trip**
*For any* database backup, restoring from that backup should recreate the database state at backup time
**Validates: Requirements 9.4**

**Property 31: Backup Failure Notification**
*For any* failed backup operation, the system should send email notifications to administrators
**Validates: Requirements 9.5**

### Reporting Properties

**Property 32: Multi-Format Export Support**
*For any* generated report, the system should support export to PDF, Excel, and CSV formats
**Validates: Requirements 10.2**

**Property 33: Scheduled Report Delivery**
*For any* scheduled report, the system should automatically generate and email the report at specified intervals
**Validates: Requirements 10.3**

### Communication Properties

**Property 34: SMS Delivery Tracking**
*For any* bulk SMS sent, the system should track delivery status for each recipient
**Validates: Requirements 11.2**

**Property 35: Email Bounce Handling**
*For any* bulk email sent, the system should handle bounces and update delivery status
**Validates: Requirements 11.3**

**Property 36: Message Retry Logic**
*For any* failed message delivery, the system should retry up to 3 times before marking as failed
**Validates: Requirements 11.4**


### Certificate Generation Properties

**Property 37: Bulk Certificate Generation**
*For any* certificate generation request for multiple students, the system should generate all certificates in a single operation
**Validates: Requirements 12.2**

**Property 38: ID Card Element Completeness**
*For any* generated ID card, the system should include student photo, QR code, and barcode
**Validates: Requirements 12.3**

**Property 39: Certificate Verification**
*For any* generated certificate, the verification portal should validate the certificate using its unique number
**Validates: Requirements 12.5**

### Transport Management Properties

**Property 40: Route Stop Sequencing**
*For any* route with multiple stops, the system should maintain stop sequence and estimated arrival times
**Validates: Requirements 13.2**

**Property 41: Transport Fee Calculation**
*For any* student assigned to a route, the system should calculate transport fees based on route or distance
**Validates: Requirements 13.4**

### Online Examination Properties

**Property 42: Question Type Support**
*For any* question bank, the system should support MCQ, true/false, and essay question types
**Validates: Requirements 14.1**

**Property 43: Exam Auto-Submit**
*For any* online exam, when the timer expires, the system should automatically submit the student's answers
**Validates: Requirements 14.3**

**Property 44: Objective Question Auto-Grading**
*For any* MCQ or true/false question, the system should automatically calculate the score based on correct answers
**Validates: Requirements 14.4**

**Property 45: Question Randomization**
*For any* online exam, the system should randomize question order to prevent cheating
**Validates: Requirements 14.5**


### Testing Properties

**Property 46: Code Coverage Threshold**
*For any* code commit, the test suite should achieve minimum 80% code coverage
**Validates: Requirements 15.1**

**Property 47: CRUD Integration Test Coverage**
*For any* server action with CRUD operations, integration tests should exist for all operations
**Validates: Requirements 15.2**

**Property 48: Test Execution Performance**
*For any* test suite execution, the complete suite should finish in under 5 minutes
**Validates: Requirements 15.5**

**Property 49: Deployment Blocking on Test Failure**
*For any* failed test in the suite, the CI/CD pipeline should prevent deployment to production
**Validates: Requirements 15.4**

### Image Optimization Properties

**Property 50: Image Format Conversion**
*For any* served image, the system should convert to WebP or AVIF format automatically
**Validates: Requirements 16.1**

**Property 51: Image Lazy Loading**
*For any* image below the fold, the system should implement lazy loading
**Validates: Requirements 16.2**

**Property 52: Responsive Image Sizing**
*For any* image, the system should provide multiple sizes based on device viewport
**Validates: Requirements 16.4**

### Layout Stability Properties

**Property 53: Skeleton Loader Dimension Matching**
*For any* list page loading state, skeleton loaders should match the dimensions of final content
**Validates: Requirements 17.1**

**Property 54: Image Dimension Reservation**
*For any* image element, width and height attributes should be set to prevent layout shift
**Validates: Requirements 17.2**

**Property 55: CLS Score Compliance**
*For any* page, the Cumulative Layout Shift score should be below 0.1
**Validates: Requirements 17.4**


### Error Handling Properties

**Property 56: User-Friendly Error Messages**
*For any* error occurrence, the system should display helpful error messages with suggested actions
**Validates: Requirements 18.1**

**Property 57: Form Data Preservation on Error**
*For any* form submission failure, the system should preserve user input and highlight validation errors
**Validates: Requirements 18.3**

**Property 58: Error Logging with Context**
*For any* critical error, the system should log to monitoring service with full stack traces
**Validates: Requirements 18.5**

### Monitoring Properties

**Property 59: Error Reporting to Sentry**
*For any* production error, the system should send error reports to Sentry with full context
**Validates: Requirements 19.1**

**Property 60: Performance Metrics Tracking**
*For any* page load or API call, the system should track Core Web Vitals and response times
**Validates: Requirements 19.2**

**Property 61: Slow Query Logging**
*For any* database query exceeding 1 second, the system should log the query for analysis
**Validates: Requirements 19.5**

### Permission System Properties

**Property 62: Permission Validation at Multiple Layers**
*For any* permission check, the system should validate at both middleware and component levels
**Validates: Requirements 20.3**

**Property 63: Permission Audit Logging**
*For any* permission check or denial, the system should create an audit log entry
**Validates: Requirements 20.4**

**Property 64: Custom Permission Assignment**
*For any* user, the system should allow assignment of custom permission combinations
**Validates: Requirements 20.2**



## Error Handling

### Error Handling Strategy

The system will implement a comprehensive error handling strategy across all layers:

#### 1. Client-Side Error Handling

```typescript
// Error Boundary Component
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    Sentry.captureException(error, { extra: errorInfo });
    
    // Show user-friendly error UI
    this.setState({ hasError: true, error });
  }
}

// Network Error Handling
async function handleAPICall<T>(apiCall: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    if (error instanceof NetworkError) {
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.',
        retryable: true 
      };
    }
    return { 
      success: false, 
      error: 'An unexpected error occurred. Please try again.',
      retryable: false 
    };
  }
}
```

#### 2. Server-Side Error Handling

```typescript
// Server Action Error Handling
export async function createStudent(data: StudentInput) {
  try {
    // Validate input
    const validated = studentSchema.parse(data);
    
    // Perform operation
    const student = await prisma.student.create({ data: validated });
    
    // Log success
    await auditLog.log({
      userId: getCurrentUserId(),
      action: 'CREATE',
      resource: 'student',
      resourceId: student.id,
    });
    
    return { success: true, data: student };
  } catch (error) {
    // Log error
    Sentry.captureException(error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'A student with this email already exists.' };
      }
    }
    
    return { success: false, error: 'Failed to create student. Please try again.' };
  }
}
```

#### 3. Database Error Handling

```typescript
// Connection Error Handling
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    // Log slow queries
    if (params.runInTransaction && Date.now() - params.startTime > 1000) {
      logger.warn('Slow query detected', { params });
    }
    throw error;
  }
});
```

### Error Categories

1. **Validation Errors**: User input validation failures
2. **Authentication Errors**: Login, session, permission failures
3. **Database Errors**: Connection, query, constraint violations
4. **Network Errors**: API calls, external service failures
5. **Business Logic Errors**: Rule violations, state conflicts
6. **System Errors**: Unexpected runtime errors



## Testing Strategy

### Dual Testing Approach

The system will implement both unit testing and property-based testing for comprehensive coverage:

#### 1. Unit Testing

**Framework**: Vitest (for Next.js compatibility)

**Coverage Areas**:
- Utility functions (formatters, validators, calculators)
- React components (using React Testing Library)
- Server actions (mocked database calls)
- API routes
- Business logic functions

**Example Unit Test**:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateOverdueFine } from '@/lib/utils/library';

describe('calculateOverdueFine', () => {
  it('should calculate fine for overdue books', () => {
    const issueDate = new Date('2024-01-01');
    const returnDate = new Date('2024-01-15');
    const dueDate = new Date('2024-01-10');
    const dailyRate = 5;
    
    const fine = calculateOverdueFine(issueDate, returnDate, dueDate, dailyRate);
    
    expect(fine).toBe(25); // 5 days * 5 rupees
  });
  
  it('should return zero for on-time returns', () => {
    const issueDate = new Date('2024-01-01');
    const returnDate = new Date('2024-01-08');
    const dueDate = new Date('2024-01-10');
    const dailyRate = 5;
    
    const fine = calculateOverdueFine(issueDate, returnDate, dueDate, dailyRate);
    
    expect(fine).toBe(0);
  });
});
```

#### 2. Property-Based Testing

**Framework**: fast-check (TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Test Tagging**: Each property test must include a comment referencing the design document property

**Example Property Test**:
```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { issueBook, returnBook } from '@/lib/actions/libraryActions';

describe('Library Management Properties', () => {
  it('Property 22: Book Issue Inventory Update', async () => {
    /**
     * Feature: erp-production-completion, Property 22: Book Issue Inventory Update
     * For any book issue operation, the system should decrease available quantity
     * and record issue date and due date
     */
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bookId: fc.string(),
          studentId: fc.string(),
          initialAvailable: fc.integer({ min: 1, max: 100 }),
        }),
        async ({ bookId, studentId, initialAvailable }) => {
          // Setup: Create book with initial quantity
          const book = await createTestBook({ id: bookId, available: initialAvailable });
          
          // Action: Issue book
          const issue = await issueBook({ bookId, studentId });
          
          // Verify: Available quantity decreased
          const updatedBook = await getBook(bookId);
          expect(updatedBook.available).toBe(initialAvailable - 1);
          
          // Verify: Issue record created with dates
          expect(issue.issueDate).toBeDefined();
          expect(issue.dueDate).toBeDefined();
          expect(issue.dueDate > issue.issueDate).toBe(true);
          
          // Cleanup
          await cleanupTestData();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### 3. Integration Testing

**Framework**: Vitest with test database

**Coverage Areas**:
- Server actions with database operations
- API routes end-to-end
- Authentication flows
- File upload workflows

**Example Integration Test**:
```typescript
describe('Student CRUD Operations', () => {
  it('should create, read, update, and delete student', async () => {
    // Create
    const created = await createStudent(testStudentData);
    expect(created.success).toBe(true);
    
    // Read
    const read = await getStudent(created.data.id);
    expect(read).toMatchObject(testStudentData);
    
    // Update
    const updated = await updateStudent(created.data.id, { name: 'Updated Name' });
    expect(updated.data.name).toBe('Updated Name');
    
    // Delete
    const deleted = await deleteStudent(created.data.id);
    expect(deleted.success).toBe(true);
    
    // Verify deletion
    const notFound = await getStudent(created.data.id);
    expect(notFound).toBeNull();
  });
});
```

#### 4. End-to-End Testing

**Framework**: Playwright

**Coverage Areas**:
- Critical user workflows
- Authentication and authorization
- Form submissions
- Multi-step processes

**Example E2E Test**:
```typescript
import { test, expect } from '@playwright/test';

test('student admission workflow', async ({ page }) => {
  // Navigate to admission portal
  await page.goto('/admission');
  
  // Fill application form
  await page.fill('[name="studentName"]', 'Test Student');
  await page.fill('[name="parentEmail"]', 'parent@test.com');
  await page.selectOption('[name="appliedClass"]', 'Grade 1');
  
  // Upload documents
  await page.setInputFiles('[name="birthCertificate"]', 'test-files/cert.pdf');
  
  // Submit application
  await page.click('button[type="submit"]');
  
  // Verify success message
  await expect(page.locator('.success-message')).toContainText('Application submitted');
  
  // Verify application number displayed
  await expect(page.locator('.application-number')).toBeVisible();
});
```

### Test Coverage Goals

- **Unit Tests**: 80% code coverage minimum
- **Integration Tests**: All CRUD operations covered
- **Property Tests**: All correctness properties implemented
- **E2E Tests**: All critical user workflows covered

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - name: Check coverage
        run: |
          if [ $(npm run test:coverage | grep "All files" | awk '{print $10}' | sed 's/%//') -lt 80 ]; then
            echo "Coverage below 80%"
            exit 1
          fi
```

