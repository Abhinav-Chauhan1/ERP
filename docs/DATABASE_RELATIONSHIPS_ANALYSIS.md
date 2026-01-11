# Database Relationships Analysis

## Department, Syllabus, Curriculum, Classes, and Sections

### Overview
This document analyzes the relationships between Department, Syllabus (Curriculum), Classes, and Sections in the database schema.

---

## Entity Relationships

### 1. **Department**
```prisma
model Department {
  id          String   @id @default(cuid())
  name        String
  description String?
  
  // Relationships
  subjects Subject[]
  teachers Teacher[] @relation("DepartmentTeachers")
}
```

**Relationships:**
- **Has Many** → `Subject` (One department can have multiple subjects)
- **Has Many** → `Teacher` (One department can have multiple teachers)
- **No Direct Relationship** with Class, ClassSection, or Syllabus

---

### 2. **Syllabus (Curriculum)**
```prisma
model Syllabus {
  id          String   @id @default(cuid())
  title       String
  description String?
  subject     Subject  @relation(fields: [subjectId], references: [id])
  subjectId   String
  
  // Relationships
  units   SyllabusUnit[]
  modules Module[]
}
```

**Relationships:**
- **Belongs To** → `Subject` (Each syllabus is for one subject)
- **Has Many** → `SyllabusUnit` (Syllabus contains multiple units)
- **Has Many** → `Module` (Syllabus contains multiple modules/chapters)
- **No Direct Relationship** with Department, Class, or ClassSection

**Indirect Relationships:**
- Through `Subject` → Can connect to `Department`
- Through `Subject` → Can connect to `Class` (via SubjectClass)

---

### 3. **Class**
```prisma
model Class {
  id             String       @id @default(cuid())
  name           String       // e.g., "Grade 10", "Class 12"
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  academicYearId String
  
  // Relationships
  sections       ClassSection[]
  teachers       ClassTeacher[]
  subjects       SubjectClass[]
  enrollments    ClassEnrollment[]
  timetableSlots TimetableSlot[]
  assignments    AssignmentClass[]
  onlineExams    OnlineExam[]
  courses        Course[]
  feeStructures  FeeStructureClass[]
}
```

**Relationships:**
- **Belongs To** → `AcademicYear` (Each class belongs to an academic year)
- **Has Many** → `ClassSection` (One class can have multiple sections like A, B, C)
- **Has Many** → `ClassTeacher` (Multiple teachers can teach a class)
- **Has Many Through** → `Subject` (via SubjectClass junction table)
- **Has Many** → `ClassEnrollment` (Students enrolled in this class)
- **No Direct Relationship** with Department or Syllabus

**Indirect Relationships:**
- Through `SubjectClass` → Can connect to `Subject`
- Through `Subject` → Can connect to `Syllabus`
- Through `Subject` → Can connect to `Department`

---

### 4. **ClassSection**
```prisma
model ClassSection {
  id        String   @id @default(cuid())
  name      String   // e.g., "A", "B", "Science", "Commerce"
  class     Class    @relation(fields: [classId], references: [id])
  classId   String
  capacity  Int?
  
  // Relationships
  enrollments       ClassEnrollment[]
  timetableSlots    TimetableSlot[]
  attendanceRecords StudentAttendance[]
  teachers          ClassTeacher[]
  homeRoom          ClassRoom?
}
```

**Relationships:**
- **Belongs To** → `Class` (Each section belongs to one class)
- **Has Many** → `ClassEnrollment` (Students enrolled in this section)
- **Has Many** → `ClassTeacher` (Teachers assigned to this section)
- **Has Many** → `TimetableSlot` (Timetable for this section)
- **Has Many** → `StudentAttendance` (Attendance records for this section)
- **Has One** → `ClassRoom` (Optional home room)
- **No Direct Relationship** with Department or Syllabus

---

## Relationship Chain

### Complete Connection Path

```
Department
    ↓ (has many)
Subject ←──────────────┐
    ↓ (has many)       │
Syllabus               │
    ↓ (has many)       │
Module/SyllabusUnit    │
                       │
                       │ (many-to-many via SubjectClass)
                       │
AcademicYear           │
    ↓ (has many)       │
Class ─────────────────┘
    ↓ (has many)
ClassSection
    ↓ (has many)
ClassEnrollment
    ↓ (belongs to)
Student
```

---

## Key Junction Tables

### 1. **SubjectClass** (Many-to-Many)
```prisma
model SubjectClass {
  id        String   @id @default(cuid())
  subject   Subject  @relation(fields: [subjectId], references: [id])
  subjectId String
  class     Class    @relation(fields: [classId], references: [id])
  classId   String
  
  @@unique([subjectId, classId])
}
```
**Purpose:** Links subjects to classes (e.g., "Mathematics" is taught in "Grade 10")

### 2. **ClassEnrollment**
```prisma
model ClassEnrollment {
  id         String           @id @default(cuid())
  student    Student          @relation(fields: [studentId], references: [id])
  studentId  String
  class      Class            @relation(fields: [classId], references: [id])
  classId    String
  section    ClassSection     @relation(fields: [sectionId], references: [id])
  sectionId  String
  rollNumber String?
  status     EnrollmentStatus @default(ACTIVE)
  
  @@unique([studentId, classId, sectionId])
}
```
**Purpose:** Links students to specific class sections

### 3. **ClassTeacher**
```prisma
model ClassTeacher {
  id          String        @id @default(cuid())
  class       Class         @relation(fields: [classId], references: [id])
  classId     String
  section     ClassSection? @relation(fields: [sectionId], references: [id])
  sectionId   String?       // Optional: if null, teacher is assigned to all sections
  teacher     Teacher       @relation(fields: [teacherId], references: [id])
  teacherId   String
  isClassHead Boolean       @default(false)
  
  @@unique([classId, sectionId, teacherId])
}
```
**Purpose:** Links teachers to classes and sections

---

## Summary of Relationships

| Entity | Direct Relations | Indirect Relations |
|--------|-----------------|-------------------|
| **Department** | Subject, Teacher | Class (via Subject → SubjectClass) |
| **Syllabus** | Subject, Module, SyllabusUnit | Department (via Subject), Class (via Subject → SubjectClass) |
| **Class** | AcademicYear, ClassSection, Subject (via SubjectClass) | Department (via Subject), Syllabus (via Subject) |
| **ClassSection** | Class, ClassEnrollment, ClassTeacher | All of Class's relations |

---

## Important Notes

1. **No Direct Department-Class Link**: Department and Class are connected only through Subject
2. **No Direct Syllabus-Class Link**: Syllabus and Class are connected only through Subject
3. **Curriculum = Syllabus**: In this schema, "Syllabus" represents the curriculum
4. **Subject is the Central Hub**: Subject connects Department, Syllabus, and Class
5. **Section is a Subdivision**: ClassSection is always a child of Class

---

## Query Examples

### Get all subjects for a class:
```typescript
const classSubjects = await prisma.subjectClass.findMany({
  where: { classId: "class-id" },
  include: { subject: true }
});
```

### Get syllabus for a class's subjects:
```typescript
const classSyllabus = await prisma.class.findUnique({
  where: { id: "class-id" },
  include: {
    subjects: {
      include: {
        subject: {
          include: {
            syllabus: {
              include: {
                modules: true,
                units: true
              }
            }
          }
        }
      }
    }
  }
});
```

### Get department for a class:
```typescript
const classDepartments = await prisma.class.findUnique({
  where: { id: "class-id" },
  include: {
    subjects: {
      include: {
        subject: {
          include: {
            department: true
          }
        }
      }
    }
  }
});
```

### Get all sections of a class:
```typescript
const sections = await prisma.classSection.findMany({
  where: { classId: "class-id" }
});
```

---

## Conclusion

The relationships follow this hierarchy:
1. **Department** organizes subjects and teachers
2. **Subject** is the central connector between department, syllabus, and classes
3. **Syllabus** (curriculum) defines the content for each subject
4. **Class** represents a grade level and connects to subjects via SubjectClass
5. **ClassSection** divides classes into manageable groups (A, B, C, etc.)

All relationships are **indirect** except for the Class → ClassSection relationship, which is direct.
