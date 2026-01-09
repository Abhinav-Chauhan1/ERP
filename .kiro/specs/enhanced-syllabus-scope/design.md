# Design Document

## Overview

The Enhanced Syllabus Scope System transforms the current rigid syllabus management into a flexible, multi-level system that supports creating syllabi at different organizational scopes (subject-wide, class-wide, section-specific), multiple curriculum types and boards, comprehensive lifecycle management, and rich metadata tracking.

### Key Design Goals

1. **Flexibility**: Enable syllabus creation at any organizational level
2. **Backward Compatibility**: Preserve existing syllabi and functionality
3. **Scalability**: Support complex school structures with multiple boards
4. **Usability**: Intuitive UI for scope selection and management
5. **Maintainability**: Clean architecture with clear separation of concerns

### Technology Stack

- **Database**: PostgreSQL with Prisma ORM
- **Backend**: Next.js Server Actions (TypeScript)
- **Frontend**: React with TypeScript
- **Validation**: Zod schemas
- **File Storage**: Cloudinary
- **UI Components**: shadcn/ui

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Syllabus     │  │ Scope        │  │ Syllabus     │      │
│  │ Form         │  │ Selector     │  │ List         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Validation Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Zod Schemas (syllabusSchemaValidations.ts)         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Server Actions (syllabusActions.ts)                │   │
│  │  - createSyllabus()                                  │   │
│  │  - getSyllabusWithFallback()                         │   │
│  │  - updateSyllabusStatus()                            │   │
│  │  - cloneSyllabus()                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Access Layer                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Prisma Client (db.ts)                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                 │   │
│  │  - Syllabus table (enhanced)                         │   │
│  │  - Related tables (Subject, Class, Section, etc.)    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Create Syllabus Flow**:
   - User selects scope type → Form validates → Server action validates uniqueness → Database insert
   
2. **Retrieve Syllabus Flow**:
   - User requests syllabus → Server action applies fallback logic → Database query → Return most specific match

3. **Status Transition Flow**:
   - User changes status → Server action validates transition → Database update → Audit log entry



## Components and Interfaces

### Database Schema

#### Enhanced Syllabus Model

```prisma
model Syllabus {
  id          String   @id @default(cuid())
  title       String
  description String?
  
  // Core relationship
  subject     Subject  @relation(fields: [subjectId], references: [id])
  subjectId   String
  
  // Scope fields (all optional for flexibility)
  academicYear   AcademicYear? @relation(fields: [academicYearId], references: [id])
  academicYearId String?
  
  class          Class?        @relation(fields: [classId], references: [id])
  classId        String?
  
  section        ClassSection? @relation(fields: [sectionId], references: [id])
  sectionId      String?
  
  // Curriculum classification
  curriculumType CurriculumType @default(GENERAL)
  boardType      String?
  
  // Lifecycle management
  status         SyllabusStatus @default(DRAFT)
  isActive       Boolean        @default(true)
  effectiveFrom  DateTime?
  effectiveTo    DateTime?
  
  // Versioning
  version        String         @default("1.0")
  parentSyllabus Syllabus?      @relation("SyllabusVersions", fields: [parentSyllabusId], references: [id])
  parentSyllabusId String?
  childVersions  Syllabus[]     @relation("SyllabusVersions")
  
  // Ownership and audit
  createdBy      String
  updatedBy      String?
  approvedBy     String?
  approvedAt     DateTime?
  
  // Metadata
  tags           String[]
  difficultyLevel DifficultyLevel @default(INTERMEDIATE)
  estimatedHours Int?
  prerequisites  String?
  
  // Existing fields
  document       String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  
  // Existing relationships
  units          SyllabusUnit[]
  modules        Module[]       @relation("SyllabusModules")
  
  // Unique constraint: one syllabus per scope combination
  @@unique([subjectId, academicYearId, classId, sectionId, curriculumType])
  @@index([subjectId, classId])
  @@index([academicYearId, isActive])
  @@index([status, isActive])
  @@index([curriculumType, boardType])
}

enum SyllabusStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  PUBLISHED
  ARCHIVED
  DEPRECATED
}

enum CurriculumType {
  GENERAL
  ADVANCED
  REMEDIAL
  INTEGRATED
  VOCATIONAL
  SPECIAL_NEEDS
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

#### Related Model Updates

```prisma
// Add syllabus relationship to AcademicYear
model AcademicYear {
  // ... existing fields
  syllabi Syllabus[]
}

// Add syllabus relationship to Class
model Class {
  // ... existing fields
  syllabi Syllabus[]
}

// Add syllabus relationship to ClassSection
model ClassSection {
  // ... existing fields
  syllabi Syllabus[]
}
```



### TypeScript Interfaces

#### Form Data Types

```typescript
// Enhanced syllabus form data
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

// Scope filter for queries
interface SyllabusScope {
  subjectId: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  curriculumType?: CurriculumType;
  boardType?: string;
}

// Syllabus with full relations
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



### Server Actions API

#### Core Actions

```typescript
// Create syllabus with enhanced scope support
async function createSyllabus(
  data: SyllabusFormData,
  file?: File | null,
  userId: string
): Promise<ActionResult<Syllabus>>

// Get syllabus with automatic fallback logic
async function getSyllabusWithFallback(
  scope: SyllabusScope
): Promise<ActionResult<SyllabusWithRelations | null>>

// Get syllabi by explicit scope
async function getSyllabusByScope(
  scope: Partial<SyllabusScope>,
  filters?: {
    status?: SyllabusStatus[];
    isActive?: boolean;
    tags?: string[];
  }
): Promise<ActionResult<SyllabusWithRelations[]>>

// Update syllabus
async function updateSyllabus(
  id: string,
  data: Partial<SyllabusFormData>,
  file?: File | null,
  userId: string
): Promise<ActionResult<Syllabus>>

// Update syllabus status
async function updateSyllabusStatus(
  id: string,
  status: SyllabusStatus,
  userId: string
): Promise<ActionResult<Syllabus>>

// Clone syllabus
async function cloneSyllabus(
  sourceId: string,
  newScope: Partial<SyllabusScope>,
  userId: string
): Promise<ActionResult<Syllabus>>

// Get version history
async function getSyllabusVersionHistory(
  syllabusId: string
): Promise<ActionResult<Syllabus[]>>

// Delete syllabus
async function deleteSyllabus(
  id: string
): Promise<ActionResult<void>>

// Get syllabus coverage report
async function getSyllabusCoverageReport(
  academicYearId?: string
): Promise<ActionResult<CoverageReport>>
```

#### Helper Actions

```typescript
// Get dropdown options
async function getAcademicYearsForDropdown(): Promise<ActionResult<AcademicYear[]>>
async function getClassesForDropdown(academicYearId?: string): Promise<ActionResult<Class[]>>
async function getSectionsForDropdown(classId: string): Promise<ActionResult<ClassSection[]>>

// Validation
async function validateSyllabusScope(
  scope: SyllabusScope
): Promise<{ isValid: boolean; error?: string }>
```



## Data Models

### Scope Resolution Logic

The system implements a hierarchical fallback mechanism for syllabus retrieval:

```
Priority Order (Most Specific → Least Specific):
1. Section-Specific: subjectId + academicYearId + classId + sectionId
2. Class-Wide: subjectId + academicYearId + classId + (sectionId = null)
3. Subject-Wide: subjectId + (academicYearId = null) + (classId = null) + (sectionId = null)
```

#### Fallback Algorithm

```typescript
async function getSyllabusWithFallback(scope: SyllabusScope) {
  const { subjectId, academicYearId, classId, sectionId, curriculumType } = scope;
  
  // Build query conditions in priority order
  const conditions = [
    // 1. Most specific: exact match
    {
      subjectId,
      academicYearId,
      classId,
      sectionId,
      curriculumType,
      status: 'PUBLISHED',
      isActive: true
    },
    // 2. Class-wide (all sections)
    {
      subjectId,
      academicYearId,
      classId,
      sectionId: null,
      curriculumType,
      status: 'PUBLISHED',
      isActive: true
    },
    // 3. Subject-wide (all classes and sections)
    {
      subjectId,
      academicYearId: null,
      classId: null,
      sectionId: null,
      curriculumType,
      status: 'PUBLISHED',
      isActive: true
    }
  ];
  
  // Try each condition in order
  for (const condition of conditions) {
    const syllabus = await db.syllabus.findFirst({
      where: condition,
      include: { /* relations */ }
    });
    
    if (syllabus) {
      return { success: true, data: syllabus };
    }
  }
  
  return { success: true, data: null };
}
```

### Unique Constraint Logic

The unique constraint ensures no duplicate syllabi for the same scope:

```
UNIQUE (subjectId, academicYearId, classId, sectionId, curriculumType)
```

**Examples**:
- ✅ Math + 2024-25 + Grade 10 + Section A + General
- ✅ Math + 2024-25 + Grade 10 + Section B + General (different section)
- ✅ Math + 2024-25 + Grade 10 + null + General (class-wide)
- ✅ Math + 2024-25 + Grade 10 + Section A + Advanced (different curriculum type)
- ❌ Math + 2024-25 + Grade 10 + Section A + General (duplicate - rejected)



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Scope Type Determines Field Requirements

*For any* syllabus creation request, the required scope fields SHALL match the selected scope type: subject-wide requires only subjectId, class-wide requires subjectId and classId with null sectionId, and section-specific requires subjectId, classId, and sectionId all non-null.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Null Scope Fields Indicate Wider Applicability

*For any* syllabus with null classId, that syllabus SHALL be applicable to all classes; for any syllabus with null sectionId but non-null classId, that syllabus SHALL be applicable to all sections of that class.

**Validates: Requirements 1.2, 1.5, 3.2**

### Property 3: Scope Filtering Returns Matching Syllabi

*For any* query with scope filters (subject, class, section, academic year), all returned syllabi SHALL match the specified filters, and no matching syllabi SHALL be excluded.

**Validates: Requirements 1.6, 3.3, 4.4, 18.1-18.10**

### Property 4: Multiple Syllabi Per Subject Allowed

*For any* subject, creating syllabi with different scope combinations (different classId, sectionId, academicYearId, or curriculumType) SHALL succeed, allowing multiple syllabi for the same subject.

**Validates: Requirements 2.1, 13.2**

### Property 5: Unique Constraint Prevents Duplicates

*For any* combination of (subjectId, academicYearId, classId, sectionId, curriculumType), attempting to create a second syllabus with the exact same combination SHALL be rejected with a unique constraint error.

**Validates: Requirements 2.2, 2.3, 2.5, 13.3**

### Property 6: Fallback Logic Prioritizes Specificity

*For any* query for a specific section, when syllabi exist at multiple scope levels (section-specific, class-wide, subject-wide), the system SHALL return the most specific match: section-specific first, then class-wide, then subject-wide.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 13.5**

### Property 7: Default Values Applied Correctly

*For any* syllabus created without specifying status, curriculumType, version, or difficultyLevel, the system SHALL apply defaults: status="DRAFT", curriculumType="GENERAL", version="1.0", difficultyLevel="INTERMEDIATE".

**Validates: Requirements 4.5, 5.1, 8.1, 11.3, 11.4**

### Property 8: Status Filtering Excludes Non-Active Syllabi

*For any* query for active syllabi, only syllabi with status="PUBLISHED" and isActive=true SHALL be returned; archived or draft syllabi SHALL be excluded.

**Validates: Requirements 5.4, 5.6**

### Property 9: Effective Date Range Filtering

*For any* query with a reference date, only syllabi where the date falls within [effectiveFrom, effectiveTo] (or where these fields are null) SHALL be returned.

**Validates: Requirements 6.4, 6.5**

### Property 10: Ownership Fields Track User Actions

*For any* syllabus creation, the createdBy field SHALL be set to the creating user's ID; for any update, updatedBy SHALL be set to the updating user's ID; for any approval, approvedBy and approvedAt SHALL be set.

**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

### Property 11: Version Relationships Maintained

*For any* syllabus created as a new version of an existing syllabus, the parentSyllabusId SHALL reference the parent, and the parent's childVersions SHALL include the new syllabus.

**Validates: Requirements 8.2, 8.3, 8.4**

### Property 12: Metadata Fields Stored Correctly

*For any* syllabus created with tags, difficultyLevel, estimatedHours, or prerequisites, these values SHALL be stored exactly as provided and retrievable in subsequent queries.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 13: Tag-Based Filtering Works

*For any* query filtering by tags, all returned syllabi SHALL contain at least one of the specified tags, and no syllabi with matching tags SHALL be excluded.

**Validates: Requirements 9.5**

### Property 14: Backward Compatibility Preserved

*For any* existing syllabus migrated from the old schema, all original data (title, description, subjectId, document, units, modules) SHALL be preserved, and the syllabus SHALL function identically to new syllabi.

**Validates: Requirements 11.1, 11.2, 11.5**

### Property 15: Clone Copies All Data Except Excluded Fields

*For any* syllabus cloning operation, the cloned syllabus SHALL have identical values for all fields except id, createdAt, updatedAt, and any explicitly modified scope fields; all related units, modules, and documents SHALL also be cloned.

**Validates: Requirements 19.1, 19.2, 19.3**

### Property 16: Cloned Syllabus Defaults

*For any* cloned syllabus, the status SHALL be set to "DRAFT" and createdBy SHALL be set to the cloning user's ID, regardless of the source syllabus values.

**Validates: Requirements 19.4, 19.5**

### Property 17: Foreign Key Validation

*For any* syllabus creation with subjectId, classId, sectionId, or academicYearId, the system SHALL verify these IDs reference existing records before allowing creation; invalid IDs SHALL be rejected.

**Validates: Requirements 15.5**

### Property 18: Date Validation

*For any* syllabus with both effectiveFrom and effectiveTo specified, effectiveTo SHALL be after effectiveFrom; violations SHALL be rejected with an appropriate error message.

**Validates: Requirements 15.3**



## Error Handling

### Validation Errors

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

interface SyllabusError {
  code: SyllabusErrorCode;
  message: string;
  field?: string;
  details?: Record<string, any>;
}
```

### Error Scenarios

1. **Duplicate Scope Combination**
   - Error: `DUPLICATE_SCOPE`
   - Message: "A syllabus already exists for this combination of subject, academic year, class, section, and curriculum type"
   - Action: Suggest viewing existing syllabus or modifying scope

2. **Invalid Scope Configuration**
   - Error: `INVALID_SCOPE`
   - Message: "Section-specific syllabus requires both class and section selection"
   - Action: Prompt user to select missing scope fields

3. **Invalid Date Range**
   - Error: `INVALID_DATE_RANGE`
   - Message: "Effective end date must be after start date"
   - Action: Prompt user to correct dates

4. **Invalid Foreign Key Reference**
   - Error: `INVALID_REFERENCE`
   - Message: "The selected {entity} does not exist"
   - Action: Refresh dropdown options and prompt reselection

5. **Missing Required Fields**
   - Error: `MISSING_REQUIRED_FIELD`
   - Message: "{Field name} is required"
   - Action: Highlight missing field in form

### Error Handling Strategy

```typescript
async function createSyllabus(data: SyllabusFormData, userId: string) {
  try {
    // 1. Validate scope configuration
    const scopeValidation = validateScopeConfiguration(data);
    if (!scopeValidation.isValid) {
      return {
        success: false,
        error: {
          code: 'INVALID_SCOPE',
          message: scopeValidation.error,
          field: scopeValidation.field
        }
      };
    }
    
    // 2. Validate date range
    if (data.effectiveFrom && data.effectiveTo) {
      if (data.effectiveTo <= data.effectiveFrom) {
        return {
          success: false,
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'Effective end date must be after start date',
            field: 'effectiveTo'
          }
        };
      }
    }
    
    // 3. Check for duplicate scope
    const existing = await db.syllabus.findFirst({
      where: {
        subjectId: data.subjectId,
        academicYearId: data.academicYearId || null,
        classId: data.classId || null,
        sectionId: data.sectionId || null,
        curriculumType: data.curriculumType
      }
    });
    
    if (existing) {
      return {
        success: false,
        error: {
          code: 'DUPLICATE_SCOPE',
          message: 'A syllabus already exists for this combination',
          details: { existingSyllabusId: existing.id }
        }
      };
    }
    
    // 4. Create syllabus
    const syllabus = await db.syllabus.create({
      data: {
        ...data,
        createdBy: userId,
        status: 'DRAFT',
        isActive: true
      }
    });
    
    return { success: true, data: syllabus };
    
  } catch (error) {
    // Handle database errors
    if (error.code === 'P2003') {
      // Foreign key constraint violation
      return {
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'One or more selected references do not exist'
        }
      };
    }
    
    // Generic error
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: error.message || 'An unexpected error occurred'
      }
    };
  }
}
```



## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs using randomized data generation

Both approaches are complementary and necessary for comprehensive validation.

### Property-Based Testing Configuration

- **Framework**: fast-check (JavaScript/TypeScript property-based testing library)
- **Minimum Iterations**: 100 runs per property test
- **Test Tagging**: Each property test references its design document property
- **Tag Format**: `Feature: enhanced-syllabus-scope, Property {number}: {property_text}`

### Test Categories

#### 1. Scope Configuration Tests

**Unit Tests**:
- Create subject-wide syllabus (null classId, null sectionId)
- Create class-wide syllabus (non-null classId, null sectionId)
- Create section-specific syllabus (non-null classId, non-null sectionId)
- Reject section-specific without class selection
- Reject invalid scope combinations

**Property Tests**:
- Property 1: Scope type determines field requirements
- Property 2: Null scope fields indicate wider applicability

#### 2. Uniqueness and Duplication Tests

**Unit Tests**:
- Create multiple syllabi for same subject with different classes
- Create multiple syllabi for same subject with different sections
- Attempt to create duplicate scope combination (should fail)
- Create syllabi with same subject but different curriculum types

**Property Tests**:
- Property 4: Multiple syllabi per subject allowed
- Property 5: Unique constraint prevents duplicates

#### 3. Fallback Logic Tests

**Unit Tests**:
- Query with section-specific syllabus available
- Query with only class-wide syllabus available
- Query with only subject-wide syllabus available
- Query with all three levels available (should return most specific)

**Property Tests**:
- Property 6: Fallback logic prioritizes specificity

#### 4. Default Values Tests

**Unit Tests**:
- Create syllabus without status (should default to DRAFT)
- Create syllabus without curriculum type (should default to GENERAL)
- Create syllabus without version (should default to "1.0")
- Create syllabus without difficulty level (should default to INTERMEDIATE)

**Property Tests**:
- Property 7: Default values applied correctly

#### 5. Filtering and Query Tests

**Unit Tests**:
- Filter by subject
- Filter by class
- Filter by section
- Filter by academic year
- Filter by curriculum type
- Filter by status
- Filter by tags
- Combine multiple filters

**Property Tests**:
- Property 3: Scope filtering returns matching syllabi
- Property 8: Status filtering excludes non-active syllabi
- Property 9: Effective date range filtering
- Property 13: Tag-based filtering works

#### 6. Ownership and Audit Tests

**Unit Tests**:
- Create syllabus and verify createdBy is set
- Update syllabus and verify updatedBy is set
- Approve syllabus and verify approvedBy and approvedAt are set
- Verify timestamps are automatically maintained

**Property Tests**:
- Property 10: Ownership fields track user actions

#### 7. Versioning Tests

**Unit Tests**:
- Create syllabus with parent reference
- Query version history
- Mark old version as deprecated

**Property Tests**:
- Property 11: Version relationships maintained

#### 8. Metadata Tests

**Unit Tests**:
- Create syllabus with tags
- Create syllabus with difficulty level
- Create syllabus with estimated hours
- Create syllabus with prerequisites

**Property Tests**:
- Property 12: Metadata fields stored correctly

#### 9. Cloning Tests

**Unit Tests**:
- Clone syllabus and verify all fields copied except excluded ones
- Clone syllabus with modified scope
- Clone syllabus and verify status is DRAFT
- Clone syllabus and verify createdBy is set to cloning user
- Clone syllabus and verify related data (units, modules) are copied

**Property Tests**:
- Property 15: Clone copies all data except excluded fields
- Property 16: Cloned syllabus defaults

#### 10. Validation Tests

**Unit Tests**:
- Attempt to create syllabus with invalid subjectId (should fail)
- Attempt to create syllabus with invalid classId (should fail)
- Attempt to create syllabus with effectiveTo before effectiveFrom (should fail)
- Attempt to create syllabus with missing required fields (should fail)

**Property Tests**:
- Property 17: Foreign key validation
- Property 18: Date validation

#### 11. Migration and Backward Compatibility Tests

**Unit Tests**:
- Migrate existing syllabus and verify all data preserved
- Verify migrated syllabus with null scope treated as subject-wide
- Verify migrated syllabus defaults (status, curriculum type)
- Verify existing relationships maintained

**Property Tests**:
- Property 14: Backward compatibility preserved

### Test Data Generators

For property-based testing, we'll create generators for:

```typescript
// Generate random syllabus scope
const scopeGenerator = fc.record({
  subjectId: fc.uuid(),
  academicYearId: fc.option(fc.uuid()),
  classId: fc.option(fc.uuid()),
  sectionId: fc.option(fc.uuid()),
  curriculumType: fc.constantFrom('GENERAL', 'ADVANCED', 'REMEDIAL', 'INTEGRATED', 'VOCATIONAL', 'SPECIAL_NEEDS')
});

// Generate random syllabus data
const syllabusDataGenerator = fc.record({
  title: fc.string({ minLength: 3, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 })),
  subjectId: fc.uuid(),
  academicYearId: fc.option(fc.uuid()),
  classId: fc.option(fc.uuid()),
  sectionId: fc.option(fc.uuid()),
  curriculumType: fc.constantFrom('GENERAL', 'ADVANCED', 'REMEDIAL', 'INTEGRATED', 'VOCATIONAL', 'SPECIAL_NEEDS'),
  boardType: fc.option(fc.constantFrom('CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge')),
  tags: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { maxLength: 10 }),
  difficultyLevel: fc.constantFrom('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'),
  estimatedHours: fc.option(fc.integer({ min: 1, max: 1000 })),
  version: fc.string({ minLength: 1, maxLength: 10 }),
  effectiveFrom: fc.option(fc.date()),
  effectiveTo: fc.option(fc.date())
});

// Generate valid scope configuration
const validScopeGenerator = fc.oneof(
  // Subject-wide
  fc.record({
    scopeType: fc.constant('SUBJECT_WIDE'),
    classId: fc.constant(null),
    sectionId: fc.constant(null)
  }),
  // Class-wide
  fc.record({
    scopeType: fc.constant('CLASS_WIDE'),
    classId: fc.uuid(),
    sectionId: fc.constant(null)
  }),
  // Section-specific
  fc.record({
    scopeType: fc.constant('SECTION_SPECIFIC'),
    classId: fc.uuid(),
    sectionId: fc.uuid()
  })
);
```

### Integration Testing

In addition to unit and property tests, integration tests will verify:

1. **End-to-End Syllabus Creation Flow**
   - User selects scope → Form submission → Database insert → UI update

2. **Fallback Logic Integration**
   - Create syllabi at multiple levels → Query from student/teacher context → Verify correct syllabus returned

3. **Status Workflow Integration**
   - Draft → Pending Review → Approved → Published → Archived

4. **Cloning Workflow Integration**
   - Select syllabus → Clone with new scope → Verify all data copied → Verify new syllabus is independent

### Performance Testing

- **Query Performance**: Verify syllabus queries with complex filters complete within 200ms
- **Fallback Performance**: Verify fallback logic completes within 100ms
- **Bulk Operations**: Verify creating 100 syllabi completes within 5 seconds

### Test Coverage Goals

- **Line Coverage**: Minimum 90%
- **Branch Coverage**: Minimum 85%
- **Property Test Coverage**: All 18 correctness properties must have corresponding property tests
- **Edge Case Coverage**: All identified edge cases must have unit tests
