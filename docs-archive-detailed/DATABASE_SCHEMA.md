# Database Schema Documentation

## Overview

The SikshaMitra ERP database schema is designed to support comprehensive school management with multi-tenancy, covering academic, administrative, financial, and communication needs.

## Core Models

### User Management

#### User
Central user model for all system users.

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     DateTime?
  password          String?
  name              String?
  image             String?
  role              UserRole  @default(STUDENT)
  phone             String?
  address           String?
  dateOfBirth       DateTime?
  gender            Gender?
  active            Boolean   @default(true)
  twoFactorEnabled  Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  administrator     Administrator?
  teacher           Teacher?
  student           Student?
  parent            Parent?
  accounts          Account[]
  sessions          Session[]
  twoFactorConfirmation TwoFactorConfirmation?
}
```

**Roles**: SUPER_ADMIN, ADMIN, TEACHER, STUDENT, PARENT

#### Administrator
School administrator details.

```prisma
model Administrator {
  id          String   @id @default(cuid())
  userId      String   @unique
  employeeId  String?  @unique
  department  String?
  position    String?
  joinDate    DateTime?
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### Teacher
Teacher-specific information.

```prisma
model Teacher {
  id              String    @id @default(cuid())
  userId          String    @unique
  employeeId      String?   @unique
  qualification   String?
  experience      Int?
  specialization  String?
  salary          Decimal?
  joinDate        DateTime?
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  subjects        SubjectTeacher[]
  classes         ClassTeacher[]
  attendance      TeacherAttendance[]
}
```

#### Student
Student information with Indian-specific fields.

```prisma
model Student {
  id                String    @id @default(cuid())
  userId            String    @unique
  admissionNumber   String?   @unique
  admissionDate     DateTime?
  rollNumber        String?
  
  // Indian-specific fields
  aadhaarNumber     String?   @unique
  abcId             String?   @unique
  caste             String?
  category          Category?
  religion          String?
  motherTongue      String?
  birthPlace        String?
  tcNumber          String?
  
  // Academic
  currentClassId    String?
  currentSectionId  String?
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  enrollments       ClassEnrollment[]
  attendance        StudentAttendance[]
  examResults       ExamResult[]
  parents           StudentParent[]
}
```

**Categories**: GENERAL, OBC, SC, ST, EWS

#### Parent
Parent/guardian information.

```prisma
model Parent {
  id              String   @id @default(cuid())
  userId          String   @unique
  occupation      String?
  annualIncome    Decimal?
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  children        StudentParent[]
}
```

## Academic Models

### AcademicYear
Academic year configuration.

```prisma
model AcademicYear {
  id          String    @id @default(cuid())
  name        String
  startDate   DateTime
  endDate     DateTime
  isCurrent   Boolean   @default(false)
  
  classes     Class[]
  terms       Term[]
}
```

### Term
Academic terms/semesters.

```prisma
model Term {
  id              String       @id @default(cuid())
  name            String
  academicYearId  String
  startDate       DateTime
  endDate         DateTime
  
  academicYear    AcademicYear @relation(fields: [academicYearId], references: [id])
  exams           Exam[]
}
```

### Class & Section
Class and section management.

```prisma
model Class {
  id              String       @id @default(cuid())
  name            String
  academicYearId  String
  
  academicYear    AcademicYear @relation(fields: [academicYearId], references: [id])
  sections        ClassSection[]
  subjects        SubjectClass[]
}

model ClassSection {
  id          String   @id @default(cuid())
  classId     String
  name        String
  capacity    Int?
  
  class       Class    @relation(fields: [classId], references: [id])
  enrollments ClassEnrollment[]
  attendance  StudentAttendance[]
}
```

### Subject
Subject management.

```prisma
model Subject {
  id            String   @id @default(cuid())
  name          String
  code          String   @unique
  description   String?
  departmentId  String?
  
  department    Department? @relation(fields: [departmentId], references: [id])
  teachers      SubjectTeacher[]
  classes       SubjectClass[]
  syllabus      Syllabus[]
}
```

### Syllabus & Lessons
Curriculum management.

```prisma
model Syllabus {
  id          String   @id @default(cuid())
  subjectId   String
  title       String
  description String?
  
  subject     Subject  @relation(fields: [subjectId], references: [id])
  units       SyllabusUnit[]
}

model SyllabusUnit {
  id          String   @id @default(cuid())
  syllabusId  String
  title       String
  description String?
  sequence    Int
  
  syllabus    Syllabus @relation(fields: [syllabusId], references: [id])
  lessons     Lesson[]
}

model Lesson {
  id          String       @id @default(cuid())
  unitId      String
  title       String
  content     String?
  duration    Int?
  
  unit        SyllabusUnit @relation(fields: [unitId], references: [id])
}
```

## Assessment Models

### Exam & Results
Examination system.

```prisma
model ExamType {
  id          String   @id @default(cuid())
  name        String
  weight      Decimal?
  
  exams       Exam[]
}

model Exam {
  id          String    @id @default(cuid())
  name        String
  examTypeId  String
  termId      String?
  subjectId   String
  classId     String
  date        DateTime
  totalMarks  Decimal
  passingMarks Decimal?
  
  examType    ExamType  @relation(fields: [examTypeId], references: [id])
  term        Term?     @relation(fields: [termId], references: [id])
  results     ExamResult[]
}

model ExamResult {
  id              String    @id @default(cuid())
  examId          String
  studentId       String
  marksObtained   Decimal
  grade           String?
  remarks         String?
  absent          Boolean   @default(false)
  
  exam            Exam      @relation(fields: [examId], references: [id])
  student         Student   @relation(fields: [studentId], references: [id])
}
```

### Online Examination
Digital exam system.

```prisma
model QuestionBank {
  id              String       @id @default(cuid())
  subjectId       String
  question        String
  questionType    QuestionType
  options         Json?
  correctAnswer   String?
  marks           Decimal
  difficulty      Difficulty
  
  onlineExams     OnlineExam[]
}

model OnlineExam {
  id              String    @id @default(cuid())
  title           String
  subjectId       String
  classId         String
  duration        Int
  totalMarks      Decimal
  startTime       DateTime
  endTime         DateTime
  instructions    String?
  
  questions       QuestionBank[]
  attempts        ExamAttempt[]
}

model ExamAttempt {
  id              String       @id @default(cuid())
  onlineExamId    String
  studentId       String
  startedAt       DateTime     @default(now())
  submittedAt     DateTime?
  score           Decimal?
  status          AttemptStatus @default(IN_PROGRESS)
  answers         Json
  
  onlineExam      OnlineExam   @relation(fields: [onlineExamId], references: [id])
}
```

### Assignments
Assignment management.

```prisma
model Assignment {
  id              String    @id @default(cuid())
  title           String
  description     String?
  subjectId       String
  dueDate         DateTime
  totalMarks      Decimal
  attachments     String?
  
  classes         AssignmentClass[]
  submissions     AssignmentSubmission[]
}

model AssignmentSubmission {
  id              String    @id @default(cuid())
  assignmentId    String
  studentId       String
  submittedAt     DateTime  @default(now())
  content         String?
  attachments     String?
  marksObtained   Decimal?
  feedback        String?
  
  assignment      Assignment @relation(fields: [assignmentId], references: [id])
}
```

## Attendance Models

### Student Attendance
Daily attendance tracking.

```prisma
model StudentAttendance {
  id          String           @id @default(cuid())
  studentId   String
  sectionId   String
  date        DateTime
  status      AttendanceStatus
  remarks     String?
  
  student     Student          @relation(fields: [studentId], references: [id])
  section     ClassSection     @relation(fields: [sectionId], references: [id])
  
  @@unique([studentId, date])
  @@index([sectionId, date])
}
```

**Status**: PRESENT, ABSENT, LATE, HALF_DAY, LEAVE

### Teacher Attendance
Teacher attendance tracking.

```prisma
model TeacherAttendance {
  id          String           @id @default(cuid())
  teacherId   String
  date        DateTime
  status      AttendanceStatus
  remarks     String?
  
  teacher     Teacher          @relation(fields: [teacherId], references: [id])
  
  @@unique([teacherId, date])
}
```

### Leave Applications
Leave request management.

```prisma
model LeaveApplication {
  id          String      @id @default(cuid())
  userId      String
  startDate   DateTime
  endDate     DateTime
  reason      String
  status      LeaveStatus @default(PENDING)
  approvedBy  String?
  approvedAt  DateTime?
  
  @@index([userId, status])
}
```

**Status**: PENDING, APPROVED, REJECTED, CANCELLED

## Finance Models

### Fee Structure
Fee configuration.

```prisma
model FeeType {
  id          String   @id @default(cuid())
  name        String
  description String?
  
  items       FeeStructureItem[]
}

model FeeStructure {
  id                  String    @id @default(cuid())
  name                String
  academicYearId      String
  applicableClasses   String?
  validFrom           DateTime
  validTo             DateTime?
  isActive            Boolean   @default(true)
  
  items               FeeStructureItem[]
}

model FeeStructureItem {
  id              String       @id @default(cuid())
  feeStructureId  String
  feeTypeId       String
  amount          Decimal
  dueDate         DateTime?
  
  feeStructure    FeeStructure @relation(fields: [feeStructureId], references: [id])
  feeType         FeeType      @relation(fields: [feeTypeId], references: [id])
}
```

### Payments
Payment tracking.

```prisma
model FeePayment {
  id              String        @id @default(cuid())
  studentId       String
  amount          Decimal
  paymentDate     DateTime      @default(now())
  paymentMethod   PaymentMethod
  transactionId   String?
  status          PaymentStatus @default(PENDING)
  receiptNumber   String?       @unique
  
  @@index([studentId, status])
}
```

**Payment Methods**: CASH, CHEQUE, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, ONLINE, SCHOLARSHIP

**Payment Status**: PENDING, COMPLETED, FAILED, REFUNDED

### Scholarships
Scholarship management.

```prisma
model Scholarship {
  id              String    @id @default(cuid())
  name            String
  description     String?
  amount          Decimal?
  percentage      Decimal?
  criteria        String?
  validFrom       DateTime
  validTo         DateTime?
  
  recipients      ScholarshipRecipient[]
}

model ScholarshipRecipient {
  id              String      @id @default(cuid())
  scholarshipId   String
  studentId       String
  awardedDate     DateTime    @default(now())
  amount          Decimal
  
  scholarship     Scholarship @relation(fields: [scholarshipId], references: [id])
}
```

## Communication Models

### Messaging
Internal messaging system.

```prisma
model Message {
  id          String    @id @default(cuid())
  senderId    String
  recipientId String
  subject     String?
  content     String
  attachments String?
  read        Boolean   @default(false)
  readAt      DateTime?
  createdAt   DateTime  @default(now())
  
  @@index([recipientId, read])
}
```

### Announcements
School-wide announcements.

```prisma
model Announcement {
  id              String           @id @default(cuid())
  title           String
  content         String
  targetAudience  TargetAudience[]
  startDate       DateTime
  endDate         DateTime?
  attachments     String?
  active          Boolean          @default(true)
  createdAt       DateTime         @default(now())
}
```

**Target Audience**: ALL, STUDENTS, TEACHERS, PARENTS, ADMINS

### Notifications
User notifications.

```prisma
model Notification {
  id              String           @id @default(cuid())
  userId          String
  title           String
  message         String
  type            NotificationType @default(INFO)
  read            Boolean          @default(false)
  link            String?
  createdAt       DateTime         @default(now())
  
  @@index([userId, read])
}
```

**Types**: INFO, WARNING, ERROR, SUCCESS

### Message Templates
Reusable message templates.

```prisma
model MessageTemplate {
  id          String   @id @default(cuid())
  name        String
  category    String
  subject     String?
  body        String
  variables   Json?
  
  history     MessageHistory[]
}

model MessageHistory {
  id              String          @id @default(cuid())
  templateId      String?
  recipients      Json
  subject         String?
  body            String
  channel         MessageChannel
  status          String
  sentAt          DateTime        @default(now())
  deliveredCount  Int             @default(0)
  failedCount     Int             @default(0)
  cost            Decimal?
  
  template        MessageTemplate? @relation(fields: [templateId], references: [id])
}
```

**Channels**: EMAIL, SMS, WHATSAPP, PUSH

## Library Models

### Books
Library book management.

```prisma
model Book {
  id              String    @id @default(cuid())
  title           String
  author          String
  isbn            String?   @unique
  publisher       String?
  category        String?
  quantity        Int       @default(1)
  available       Int       @default(1)
  location        String?
  coverImage      String?
  
  issues          BookIssue[]
  reservations    BookReservation[]
}

model BookIssue {
  id          String      @id @default(cuid())
  bookId      String
  studentId   String
  issueDate   DateTime    @default(now())
  dueDate     DateTime
  returnDate  DateTime?
  fine        Decimal?    @default(0)
  status      IssueStatus @default(ISSUED)
  
  book        Book        @relation(fields: [bookId], references: [id])
}
```

**Issue Status**: ISSUED, RETURNED, OVERDUE, LOST

## Transport Models

### Vehicles & Routes
Transport management.

```prisma
model Vehicle {
  id              String        @id @default(cuid())
  registrationNo  String        @unique
  type            VehicleType
  capacity        Int
  driverId        String?
  status          VehicleStatus @default(ACTIVE)
  
  driver          Driver?       @relation(fields: [driverId], references: [id])
  routes          Route[]
}

model Route {
  id          String      @id @default(cuid())
  name        String
  vehicleId   String?
  fee         Decimal?
  
  vehicle     Vehicle?    @relation(fields: [vehicleId], references: [id])
  stops       RouteStop[]
  students    StudentRoute[]
}

model RouteStop {
  id          String   @id @default(cuid())
  routeId     String
  name        String
  sequence    Int
  arrivalTime String?
  
  route       Route    @relation(fields: [routeId], references: [id])
}

model StudentRoute {
  id              String    @id @default(cuid())
  studentId       String
  routeId         String
  pickupStopId    String
  dropStopId      String
  
  route           Route     @relation(fields: [routeId], references: [id])
}
```

## Hostel Models

### Hostel & Rooms
Hostel management.

```prisma
model Hostel {
  id          String      @id @default(cuid())
  name        String
  type        HostelType
  wardenId    String?
  capacity    Int
  
  rooms       HostelRoom[]
}

model HostelRoom {
  id          String          @id @default(cuid())
  hostelId    String
  roomNumber  String
  floor       Int?
  type        RoomType
  capacity    Int
  occupancy   Int             @default(0)
  amenities   String?
  monthlyFee  Decimal?
  status      RoomStatus      @default(AVAILABLE)
  
  hostel      Hostel          @relation(fields: [hostelId], references: [id])
  allocations HostelRoomAllocation[]
}

model HostelRoomAllocation {
  id              String     @id @default(cuid())
  roomId          String
  studentId       String
  bedNumber       String?
  allocationDate  DateTime   @default(now())
  vacatedDate     DateTime?
  status          String     @default("ACTIVE")
  
  room            HostelRoom @relation(fields: [roomId], references: [id])
}
```

## LMS Models

### Courses & Lessons
Learning management system.

```prisma
model Course {
  id              String          @id @default(cuid())
  title           String
  description     String?
  subjectId       String?
  classId         String?
  level           CourseLevel?
  duration        Int?
  thumbnail       String?
  status          CourseStatus    @default(DRAFT)
  
  modules         CourseModule[]
  enrollments     CourseEnrollment[]
}

model CourseModule {
  id          String         @id @default(cuid())
  courseId    String
  title       String
  description String?
  sequence    Int
  
  course      Course         @relation(fields: [courseId], references: [id])
  lessons     CourseLesson[]
}

model CourseLesson {
  id          String       @id @default(cuid())
  moduleId    String
  title       String
  lessonType  LessonType
  content     String?
  duration    Int?
  sequence    Int
  
  module      CourseModule @relation(fields: [moduleId], references: [id])
  progress    LessonProgress[]
}

model CourseEnrollment {
  id              String    @id @default(cuid())
  courseId        String
  studentId       String
  enrolledAt      DateTime  @default(now())
  completedAt     DateTime?
  progress        Decimal   @default(0)
  
  course          Course    @relation(fields: [courseId], references: [id])
}
```

## Admission Models

### Applications & Merit Lists
Admission portal.

```prisma
model AdmissionApplication {
  id                  String            @id @default(cuid())
  applicationNumber   String            @unique
  firstName           String
  lastName            String
  dateOfBirth         DateTime
  gender              Gender
  email               String
  phone               String
  address             String?
  classAppliedFor     String
  status              ApplicationStatus @default(SUBMITTED)
  submittedAt         DateTime          @default(now())
  reviewedBy          String?
  reviewedAt          DateTime?
  remarks             String?
  
  documents           ApplicationDocument[]
  meritEntries        MeritListEntry[]
}

model MeritList {
  id              String           @id @default(cuid())
  name            String
  classId         String
  academicYearId  String
  publishedAt     DateTime?
  
  entries         MeritListEntry[]
}

model MeritListEntry {
  id              String                @id @default(cuid())
  meritListId     String
  applicationId   String
  rank            Int
  score           Decimal
  
  meritList       MeritList             @relation(fields: [meritListId], references: [id])
  application     AdmissionApplication  @relation(fields: [applicationId], references: [id])
}
```

## Certificate Models

### Templates & Generated Certificates
Certificate system.

```prisma
model CertificateTemplate {
  id              String          @id @default(cuid())
  name            String
  type            CertificateType
  category        String?
  layout          Json
  content         String
  
  certificates    GeneratedCertificate[]
}

model GeneratedCertificate {
  id              String            @id @default(cuid())
  templateId      String
  certificateNumber String          @unique
  recipientId     String
  recipientName   String
  data            Json
  verificationCode String          @unique
  issuedAt        DateTime          @default(now())
  status          CertificateStatus @default(ACTIVE)
  
  template        CertificateTemplate @relation(fields: [templateId], references: [id])
}
```

## Security Models

### Permissions & Audit
Security and compliance.

```prisma
model Permission {
  id          String   @id @default(cuid())
  resource    String
  action      String
  description String?
  category    String?
  
  userPermissions UserPermission[]
  rolePermissions RolePermission[]
  
  @@unique([resource, action])
}

model UserPermission {
  id              String    @id @default(cuid())
  userId          String
  permissionId    String
  grantedBy       String?
  grantedAt       DateTime  @default(now())
  expiresAt       DateTime?
  
  permission      Permission @relation(fields: [permissionId], references: [id])
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String
  resource    String?
  resourceId  String?
  details     Json?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  
  @@index([userId, timestamp])
  @@index([resource, resourceId])
}
```

## System Models

### Settings & Configuration
System configuration.

```prisma
model SystemSettings {
  id                      String   @id @default(cuid())
  schoolName              String
  schoolAddress           String?
  schoolPhone             String?
  schoolEmail             String?
  schoolWebsite           String?
  logo                    String?
  timezone                String   @default("Asia/Kolkata")
  academicYearId          String?
  currentTermId           String?
  theme                   String   @default("light")
  primaryColor            String   @default("#3b82f6")
  enableEmailNotifications Boolean @default(true)
  enableSmsNotifications  Boolean  @default(false)
  sessionTimeout          Int      @default(30)
  passwordExpiryDays      Int?
  twoFactorRequired       Boolean  @default(false)
  
  updatedAt               DateTime @updatedAt
}
```

### Backups
Backup management.

```prisma
model Backup {
  id          String   @id @default(cuid())
  filename    String
  size        BigInt
  encrypted   Boolean  @default(true)
  status      String   @default("COMPLETED")
  createdBy   String?
  createdAt   DateTime @default(now())
}
```

## Indexes & Performance

### Key Indexes
- User: email, role, active
- Student: admissionNumber, aadhaarNumber, currentClassId
- Attendance: studentId+date, sectionId+date
- ExamResult: examId, studentId
- FeePayment: studentId+status
- Message: recipientId+read
- Notification: userId+read
- AuditLog: userId+timestamp, resource+resourceId

### Composite Indexes
- StudentAttendance: [studentId, date], [sectionId, date]
- ExamResult: [examId, studentId]
- FeePayment: [studentId, status]

---

**Last Updated**: February 2026  
**Version**: 2.0.0
