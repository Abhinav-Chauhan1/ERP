# Enhanced Syllabus Scope System - API Reference

## Overview

This document provides comprehensive API documentation for the Enhanced Syllabus Scope System server actions. All actions are implemented as Next.js Server Actions and return `ActionResult<T>` types.

## Table of Contents

- [Core Actions](#core-actions)
- [Helper Actions](#helper-actions)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

---

## Core Actions

### createSyllabus

Creates a new syllabus with enhanced scope support.

**Signature:**
```typescript
async function createSyllabus(
  data: SyllabusFormData,
  file?: File | null,
  userId: string
): Promise<ActionResult<Syllabus>>
```

**Parameters:**
- `data`: Syllabus form data including scope, curriculum, and metadata
- `file`: Optional document file to upload
- `userId`: ID of the user creating the syllabus

**Returns:**
- `ActionResult<Syllabus>`: Created syllabus or error

**Behavior:**
- Validates scope configuration (class-wide requires classId, section-specific requires both)
- Checks unique constraint on (subjectId, academicYearId, classId, sectionId, curriculumType)
- Sets default values: status=DRAFT, curriculumType=GENERAL, version="1.0"
- Sets createdBy to userId
- Uploads document to Cloudinary if provided

**Example:**
```typescript
const result = await createSyllabus(
  {
    title: "Advanced Mathematics",
    description: "Advanced curriculum for Grade 10",
    subjectId: "math-101",
    scopeType: "CLASS_WIDE",
    classId: "grade-10",
    academicYearId: "2024-25",
    curriculumType: "ADVANCED",
    boardType: "CBSE",
    tags: ["algebra", "geometry"],
    difficultyLevel: "ADVANCED",
    estimatedHours: 120
  },
  documentFile,
  currentUserId
);
```

**Validates Requirements:** 1.1-1.6, 2.1-2.5, 4.1-4.5, 7.1, 13.1-13.3

---

### getSyllabusWithFallback

Retrieves the most specific applicable syllabus using fallback logic.

**Signature:**
```typescript
async function getSyllabusWithFallback(
  scope: SyllabusScope
): Promise<ActionResult<SyllabusWithRelations | null>>
```

**Parameters:**
- `scope`: Scope criteria including subjectId, academicYearId, classId, sectionId, curriculumType

**Returns:**
- `ActionResult<SyllabusWithRelations | null>`: Most specific matching syllabus or null

**Behavior:**
- Searches in priority order: section-specific → class-wide → subject-wide
- Filters by status=PUBLISHED and isActive=true
- Filters by effective date range (current date within effectiveFrom/effectiveTo)
- Includes all relations (subject, academicYear, class, section, units, modules)

**Fallback Priority:**
1. Exact match: subjectId + academicYearId + classId + sectionId
2. Class-wide: subjectId + academicYearId + classId + (sectionId=null)
3. Subject-wide: subjectId + (academicYearId=null) + (classId=null) + (sectionId=null)

**Example:**
```typescript
const result = await getSyllabusWithFallback({
  subjectId: "math-101",
  academicYearId: "2024-25",
  classId: "grade-10",
  sectionId: "section-a",
  curriculumType: "GENERAL"
});
```

**Validates Requirements:** 10.1-10.5, 13.5, 13.6

---

### getSyllabusByScope

Retrieves all syllabi matching the specified scope filters.

**Signature:**
```typescript
async function getSyllabusByScope(
  scope: Partial<SyllabusScope>,
  filters?: {
    status?: SyllabusStatus[];
    isActive?: boolean;
    tags?: string[];
  }
): Promise<ActionResult<SyllabusWithRelations[]>>
```

**Parameters:**
- `scope`: Partial scope filters (any combination of subjectId, classId, sectionId, academicYearId, curriculumType, boardType)
- `filters`: Optional additional filters for status, isActive, and tags

**Returns:**
- `ActionResult<SyllabusWithRelations[]>`: Array of matching syllabi

**Behavior:**
- Supports partial scope matching (e.g., only subjectId, or subjectId + classId)
- Combines multiple filters with AND logic
- Returns all matching syllabi (no fallback logic)
- Includes all relations

**Example:**
```typescript
const result = await getSyllabusByScope(
  {
    subjectId: "math-101",
    classId: "grade-10"
  },
  {
    status: ["PUBLISHED", "APPROVED"],
    isActive: true,
    tags: ["algebra"]
  }
);
```

**Validates Requirements:** 13.7, 18.1-18.10

---

### updateSyllabus

Updates an existing syllabus.

**Signature:**
```typescript
async function updateSyllabus(
  id: string,
  data: Partial<SyllabusFormData>,
  file?: File | null,
  userId: string
): Promise<ActionResult<Syllabus>>
```

**Parameters:**
- `id`: Syllabus ID to update
- `data`: Partial syllabus data to update
- `file`: Optional new document file
- `userId`: ID of the user updating the syllabus

**Returns:**
- `ActionResult<Syllabus>`: Updated syllabus or error

**Behavior:**
- Accepts partial updates (only specified fields are updated)
- Sets updatedBy to userId
- Uploads new document if provided
- Validates scope configuration if scope fields are updated

**Example:**
```typescript
const result = await updateSyllabus(
  "syllabus-123",
  {
    title: "Updated Title",
    estimatedHours: 150,
    tags: ["algebra", "geometry", "trigonometry"]
  },
  null,
  currentUserId
);
```

**Validates Requirements:** 7.2, 13.1

---

### updateSyllabusStatus

Updates the status of a syllabus.

**Signature:**
```typescript
async function updateSyllabusStatus(
  id: string,
  status: SyllabusStatus,
  userId: string
): Promise<ActionResult<Syllabus>>
```

**Parameters:**
- `id`: Syllabus ID
- `status`: New status (DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED, ARCHIVED, DEPRECATED)
- `userId`: ID of the user changing the status

**Returns:**
- `ActionResult<Syllabus>`: Updated syllabus or error

**Behavior:**
- Sets approvedBy and approvedAt when status changes to APPROVED
- Sets updatedBy to userId
- Validates status transitions (implementation-specific)

**Example:**
```typescript
const result = await updateSyllabusStatus(
  "syllabus-123",
  "PUBLISHED",
  currentUserId
);
```

**Validates Requirements:** 7.3, 13.9

---

### cloneSyllabus

Creates a copy of an existing syllabus with optional scope modifications.

**Signature:**
```typescript
async function cloneSyllabus(
  sourceId: string,
  newScope: Partial<SyllabusScope>,
  userId: string
): Promise<ActionResult<Syllabus>>
```

**Parameters:**
- `sourceId`: ID of the syllabus to clone
- `newScope`: New scope parameters (classId, sectionId, academicYearId, etc.)
- `userId`: ID of the user cloning the syllabus

**Returns:**
- `ActionResult<Syllabus>`: Cloned syllabus or error

**Behavior:**
- Copies all fields except id, createdAt, updatedAt
- Applies new scope parameters
- Sets status to DRAFT
- Sets createdBy to userId
- Clones related units, modules, and documents
- Validates unique constraint with new scope

**Example:**
```typescript
const result = await cloneSyllabus(
  "syllabus-123",
  {
    classId: "grade-11",
    sectionId: "section-b",
    academicYearId: "2025-26"
  },
  currentUserId
);
```

**Validates Requirements:** 19.1-19.5, 13.8

---

### getSyllabusVersionHistory

Retrieves the version history of a syllabus.

**Signature:**
```typescript
async function getSyllabusVersionHistory(
  syllabusId: string
): Promise<ActionResult<Syllabus[]>>
```

**Parameters:**
- `syllabusId`: ID of the syllabus

**Returns:**
- `ActionResult<Syllabus[]>`: Array of syllabi in version chain

**Behavior:**
- Queries syllabus and all parent/child versions recursively
- Returns version chain ordered by creation date
- Includes all version relationships

**Example:**
```typescript
const result = await getSyllabusVersionHistory("syllabus-123");
// Returns: [v1.0, v1.1, v2.0, ...]
```

**Validates Requirements:** 8.4, 13.10

---

### deleteSyllabus

Deletes a syllabus (soft delete by setting isActive=false).

**Signature:**
```typescript
async function deleteSyllabus(
  id: string
): Promise<ActionResult<void>>
```

**Parameters:**
- `id`: Syllabus ID to delete

**Returns:**
- `ActionResult<void>`: Success or error

**Behavior:**
- Sets isActive to false (soft delete)
- Preserves data for historical reference
- Does not delete related units/modules

**Example:**
```typescript
const result = await deleteSyllabus("syllabus-123");
```

---

## Helper Actions

### getAcademicYearsForDropdown

Retrieves academic years for dropdown selection.

**Signature:**
```typescript
async function getAcademicYearsForDropdown(): Promise<ActionResult<AcademicYear[]>>
```

**Returns:**
- `ActionResult<AcademicYear[]>`: Array of academic years ordered by startDate desc

**Example:**
```typescript
const result = await getAcademicYearsForDropdown();
```

**Validates Requirements:** 14.6

---

### getClassesForDropdown

Retrieves classes for dropdown selection.

**Signature:**
```typescript
async function getClassesForDropdown(
  academicYearId?: string
): Promise<ActionResult<Class[]>>
```

**Parameters:**
- `academicYearId`: Optional filter by academic year

**Returns:**
- `ActionResult<Class[]>`: Array of classes ordered by name

**Example:**
```typescript
const result = await getClassesForDropdown("2024-25");
```

**Validates Requirements:** 14.2

---

### getSectionsForDropdown

Retrieves sections for a specific class.

**Signature:**
```typescript
async function getSectionsForDropdown(
  classId: string
): Promise<ActionResult<ClassSection[]>>
```

**Parameters:**
- `classId`: Class ID to get sections for

**Returns:**
- `ActionResult<ClassSection[]>`: Array of sections ordered by name

**Example:**
```typescript
const result = await getSectionsForDropdown("grade-10");
```

**Validates Requirements:** 14.3

---

### validateSyllabusScope

Validates a syllabus scope configuration.

**Signature:**
```typescript
async function validateSyllabusScope(
  scope: SyllabusScope
): Promise<{ isValid: boolean; error?: string }>
```

**Parameters:**
- `scope`: Scope configuration to validate

**Returns:**
- Validation result with error message if invalid

**Behavior:**
- Validates foreign key references exist
- Validates scope configuration (class-wide requires classId, etc.)
- Checks for duplicate scope combinations

**Example:**
```typescript
const validation = await validateSyllabusScope({
  subjectId: "math-101",
  classId: "grade-10",
  sectionId: null,
  academicYearId: "2024-25",
  curriculumType: "GENERAL"
});
```

**Validates Requirements:** 15.5

---

## Type Definitions

### SyllabusFormData

```typescript
interface SyllabusFormData {
  // Basic info
  title: string;
  description?: string;
  subjectId: string;
  
  // Scope selection
  scopeType: 'SUBJECT_WIDE' | 'CLASS_WIDE' | 'SECTION_SPECIFIC';
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  
  // Curriculum details
  curriculumType: CurriculumType;
  boardType?: string;
  
  // Metadata
  version: string;
  difficultyLevel: DifficultyLevel;
  estimatedHours?: number;
  tags: string[];
  prerequisites?: string;
  
  // Scheduling
  effectiveFrom?: Date;
  effectiveTo?: Date;
  
  // Document
  document?: string;
}
```

### SyllabusScope

```typescript
interface SyllabusScope {
  subjectId: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  curriculumType?: CurriculumType;
  boardType?: string;
}
```

### SyllabusWithRelations

```typescript
interface SyllabusWithRelations {
  id: string;
  title: string;
  description?: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
  curriculumType: CurriculumType;
  boardType?: string;
  status: SyllabusStatus;
  isActive: boolean;
  version: string;
  tags: string[];
  difficultyLevel: DifficultyLevel;
  estimatedHours?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  units: SyllabusUnit[];
  modules: Module[];
}
```

### Enums

```typescript
enum SyllabusStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
  DEPRECATED = "DEPRECATED"
}

enum CurriculumType {
  GENERAL = "GENERAL",
  ADVANCED = "ADVANCED",
  REMEDIAL = "REMEDIAL",
  INTEGRATED = "INTEGRATED",
  VOCATIONAL = "VOCATIONAL",
  SPECIAL_NEEDS = "SPECIAL_NEEDS"
}

enum DifficultyLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT"
}
```

### ActionResult

```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; field?: string; details?: any } }
```

---

## Error Handling

### Error Codes

```typescript
enum SyllabusErrorCode {
  DUPLICATE_SCOPE = 'DUPLICATE_SCOPE',
  INVALID_SCOPE = 'INVALID_SCOPE',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND'
}
```

### Error Scenarios

#### DUPLICATE_SCOPE
**Cause:** Attempting to create a syllabus with a scope combination that already exists

**Message:** "A syllabus already exists for this combination of subject, academic year, class, section, and curriculum type"

**Resolution:** Modify the scope parameters or update the existing syllabus

#### INVALID_SCOPE
**Cause:** Invalid scope configuration (e.g., section-specific without class)

**Message:** "Section-specific syllabus requires both class and section selection"

**Resolution:** Provide all required scope fields for the selected scope type

#### INVALID_DATE_RANGE
**Cause:** effectiveTo is before or equal to effectiveFrom

**Message:** "Effective end date must be after start date"

**Resolution:** Correct the date range

#### INVALID_REFERENCE
**Cause:** Foreign key reference does not exist (invalid subjectId, classId, etc.)

**Message:** "The selected {entity} does not exist"

**Resolution:** Verify the referenced entity exists and use a valid ID

#### MISSING_REQUIRED_FIELD
**Cause:** Required field is missing from the request

**Message:** "{Field name} is required"

**Resolution:** Provide the required field

---

## Usage Examples

### Example 1: Create Subject-Wide Syllabus

```typescript
// Create a general syllabus applicable to all classes
const result = await createSyllabus(
  {
    title: "General Mathematics Syllabus",
    description: "Standard mathematics curriculum",
    subjectId: "math-101",
    scopeType: "SUBJECT_WIDE",
    // No classId or sectionId - applies to all
    curriculumType: "GENERAL",
    version: "1.0",
    difficultyLevel: "INTERMEDIATE",
    tags: ["mathematics", "general"],
    estimatedHours: 100
  },
  null,
  currentUserId
);
```

### Example 2: Create Class-Wide Syllabus

```typescript
// Create a syllabus for all sections of Grade 10
const result = await createSyllabus(
  {
    title: "Grade 10 Mathematics",
    description: "Mathematics curriculum for Grade 10",
    subjectId: "math-101",
    scopeType: "CLASS_WIDE",
    classId: "grade-10",
    academicYearId: "2024-25",
    curriculumType: "GENERAL",
    boardType: "CBSE",
    version: "1.0",
    difficultyLevel: "INTERMEDIATE",
    tags: ["grade-10", "cbse"],
    estimatedHours: 120
  },
  null,
  currentUserId
);
```

### Example 3: Create Section-Specific Syllabus

```typescript
// Create an advanced syllabus for a specific section
const result = await createSyllabus(
  {
    title: "Advanced Mathematics - Section A",
    description: "Advanced curriculum for high-performing students",
    subjectId: "math-101",
    scopeType: "SECTION_SPECIFIC",
    classId: "grade-10",
    sectionId: "section-a",
    academicYearId: "2024-25",
    curriculumType: "ADVANCED",
    boardType: "CBSE",
    version: "1.0",
    difficultyLevel: "ADVANCED",
    tags: ["grade-10", "advanced", "section-a"],
    estimatedHours: 150,
    prerequisites: "Strong foundation in Grade 9 mathematics"
  },
  null,
  currentUserId
);
```

### Example 4: Query with Fallback

```typescript
// Student in Grade 10, Section A requests mathematics syllabus
const result = await getSyllabusWithFallback({
  subjectId: "math-101",
  academicYearId: "2024-25",
  classId: "grade-10",
  sectionId: "section-a",
  curriculumType: "GENERAL"
});

// System will search in order:
// 1. Section-specific: Math + 2024-25 + Grade 10 + Section A
// 2. Class-wide: Math + 2024-25 + Grade 10 + (no section)
// 3. Subject-wide: Math + (no year) + (no class) + (no section)
```

### Example 5: Filter Syllabi

```typescript
// Get all published mathematics syllabi for Grade 10
const result = await getSyllabusByScope(
  {
    subjectId: "math-101",
    classId: "grade-10"
  },
  {
    status: ["PUBLISHED"],
    isActive: true
  }
);
```

### Example 6: Clone Syllabus for New Academic Year

```typescript
// Clone current year's syllabus for next year
const result = await cloneSyllabus(
  "syllabus-123",
  {
    academicYearId: "2025-26"
  },
  currentUserId
);
```

### Example 7: Status Workflow

```typescript
// Draft → Pending Review
await updateSyllabusStatus("syllabus-123", "PENDING_REVIEW", adminUserId);

// Pending Review → Approved
await updateSyllabusStatus("syllabus-123", "APPROVED", adminUserId);

// Approved → Published
await updateSyllabusStatus("syllabus-123", "PUBLISHED", adminUserId);
```

---

## Best Practices

### 1. Scope Selection

- Use **subject-wide** for general curricula applicable to all classes
- Use **class-wide** when curriculum differs by grade level
- Use **section-specific** for specialized sections (advanced, remedial, etc.)

### 2. Curriculum Types

- **GENERAL**: Standard curriculum for most students
- **ADVANCED**: For high-performing students
- **REMEDIAL**: For students needing additional support
- **INTEGRATED**: Cross-subject integrated curriculum
- **VOCATIONAL**: Career-focused curriculum
- **SPECIAL_NEEDS**: Adapted curriculum for special needs students

### 3. Versioning

- Use semantic versioning (1.0, 1.1, 2.0)
- Link new versions to parent using parentSyllabusId
- Mark old versions as DEPRECATED when publishing new version

### 4. Status Management

- Keep syllabi in DRAFT while editing
- Use PENDING_REVIEW for approval workflows
- Only PUBLISHED syllabi are visible to students/teachers
- Use ARCHIVED for historical reference

### 5. Effective Dates

- Set effectiveFrom for scheduled activation
- Set effectiveTo for automatic expiration
- Leave both null for permanent syllabi

---

## Migration Notes

For existing syllabi:
- Null scope fields are treated as subject-wide
- Default status is PUBLISHED (for backward compatibility)
- Default curriculumType is GENERAL
- All existing relationships are preserved

---

## Related Documentation

- [User Guide](./ENHANCED_SYLLABUS_USER_GUIDE.md)
- [Migration Guide](./ENHANCED_SYLLABUS_MIGRATION_GUIDE.md)
- [Best Practices](./ENHANCED_SYLLABUS_BEST_PRACTICES.md)
