# Database Schema

Complete database schema documentation for SikshaMitra ERP.

## Core Models

### User
Central user model for all system users.

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String?
  name              String?
  role              UserRole  @default(STUDENT)
  phone             String?
  active            Boolean   @default(true)
  twoFactorEnabled  Boolean   @default(false)
  
  administrator     Administrator?
  teacher           Teacher?
  student           Student?
  parent            Parent?
}
```

**Roles**: SUPER_ADMIN, ADMIN, TEACHER, STUDENT, PARENT

### Student
```prisma
model Student {
  id                String    @id @default(cuid())
  userId            String    @unique
  admissionNumber   String?   @unique
  rollNumber        String?
  aadhaarNumber     String?   @unique
  abcId             String?   @unique
  caste             String?
  category          Category?
  
  user              User      @relation(fields: [userId], references: [id])
  enrollments       ClassEnrollment[]
  attendance        StudentAttendance[]
  examResults       ExamResult[]
}
```

### Teacher
```prisma
model Teacher {
  id              String    @id @default(cuid())
  userId          String    @unique
  employeeId      String?   @unique
  qualification   String?
  salary          Decimal?
  
  user            User      @relation(fields: [userId], references: [id])
  subjects        SubjectTeacher[]
  classes         ClassTeacher[]
}
```

## Academic Models

### Class & Section
```prisma
model Class {
  id              String       @id @default(cuid())
  name            String
  academicYearId  String
  
  sections        ClassSection[]
  subjects        SubjectClass[]
}

model ClassSection {
  id          String   @id @default(cuid())
  classId     String
  name        String
  capacity    Int?
  
  enrollments ClassEnrollment[]
}
```

### Subject
```prisma
model Subject {
  id            String   @id @default(cuid())
  name          String
  code          String   @unique
  
  teachers      SubjectTeacher[]
  classes       SubjectClass[]
  syllabus      Syllabus[]
}
```

## Assessment Models

### Exam & Results
```prisma
model Exam {
  id          String    @id @default(cuid())
  name        String
  subjectId   String
  classId     String
  date        DateTime
  totalMarks  Decimal
  
  results     ExamResult[]
}

model ExamResult {
  id              String    @id @default(cuid())
  examId          String
  studentId       String
  marksObtained   Decimal
  grade           String?
  
  exam            Exam      @relation(fields: [examId], references: [id])
  student         Student   @relation(fields: [studentId], references: [id])
}
```

## Attendance Models

### Student Attendance
```prisma
model StudentAttendance {
  id          String           @id @default(cuid())
  studentId   String
  sectionId   String
  date        DateTime
  status      AttendanceStatus
  
  @@unique([studentId, date])
  @@index([sectionId, date])
}
```

**Status**: PRESENT, ABSENT, LATE, HALF_DAY, LEAVE

## Finance Models

### Fee Structure & Payments
```prisma
model FeeStructure {
  id                  String    @id @default(cuid())
  name                String
  academicYearId      String
  validFrom           DateTime
  isActive            Boolean   @default(true)
  
  items               FeeStructureItem[]
}

model FeePayment {
  id              String        @id @default(cuid())
  studentId       String
  amount          Decimal
  paymentMethod   PaymentMethod
  status          PaymentStatus @default(PENDING)
  
  @@index([studentId, status])
}
```

## Communication Models

### Messages & Announcements
```prisma
model Message {
  id          String    @id @default(cuid())
  senderId    String
  recipientId String
  content     String
  read        Boolean   @default(false)
  
  @@index([recipientId, read])
}

model Announcement {
  id              String           @id @default(cuid())
  title           String
  content         String
  targetAudience  TargetAudience[]
  active          Boolean          @default(true)
}
```

## Library Models

### Books
```prisma
model Book {
  id              String    @id @default(cuid())
  title           String
  author          String
  isbn            String?   @unique
  quantity        Int       @default(1)
  available       Int       @default(1)
  
  issues          BookIssue[]
}

model BookIssue {
  id          String      @id @default(cuid())
  bookId      String
  studentId   String
  issueDate   DateTime    @default(now())
  dueDate     DateTime
  returnDate  DateTime?
  status      IssueStatus @default(ISSUED)
}
```

## Transport Models

### Routes & Vehicles
```prisma
model Route {
  id          String      @id @default(cuid())
  name        String
  vehicleId   String?
  fee         Decimal?
  
  stops       RouteStop[]
  students    StudentRoute[]
}

model Vehicle {
  id              String        @id @default(cuid())
  registrationNo  String        @unique
  type            VehicleType
  capacity        Int
  status          VehicleStatus @default(ACTIVE)
}
```

## Hostel Models

### Hostel & Rooms
```prisma
model Hostel {
  id          String      @id @default(cuid())
  name        String
  type        HostelType
  capacity    Int
  
  rooms       HostelRoom[]
}

model HostelRoom {
  id          String          @id @default(cuid())
  hostelId    String
  roomNumber  String
  capacity    Int
  monthlyFee  Decimal?
  status      RoomStatus      @default(AVAILABLE)
  
  allocations HostelRoomAllocation[]
}
```

## Security Models

### Permissions & Audit
```prisma
model Permission {
  id          String   @id @default(cuid())
  resource    String
  action      String
  
  userPermissions UserPermission[]
  
  @@unique([resource, action])
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String
  resource    String?
  details     Json?
  timestamp   DateTime @default(now())
  
  @@index([userId, timestamp])
}
```

## Indexes

Key indexes for performance:
- User: email, role, active
- Student: admissionNumber, aadhaarNumber
- Attendance: [studentId, date], [sectionId, date]
- ExamResult: examId, studentId
- FeePayment: [studentId, status]
- Message: [recipientId, read]
- AuditLog: [userId, timestamp]

---

**Last Updated**: February 2026  
**Version**: 2.0.0
