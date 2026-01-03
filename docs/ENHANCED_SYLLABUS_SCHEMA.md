# Enhanced Syllabus System - Database Schema Documentation

## Overview

The Enhanced Syllabus System introduces a new three-level hierarchy for organizing curriculum content:

```
Syllabus → Module (Chapter) → SubModule (Topic) → Documents
```

This replaces the simpler two-level structure while maintaining backward compatibility:

```
Syllabus → SyllabusUnit → Lesson (Legacy, maintained for compatibility)
```

## Database Models

### 1. Module

Represents a chapter or major topic area within a syllabus.

**Table Name:** `Module`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Unique identifier |
| `title` | String | Yes | Module/chapter title |
| `description` | String | No | Detailed description |
| `chapterNumber` | Integer | Yes | Chapter number (unique per syllabus) |
| `order` | Integer | Yes | Display order |
| `syllabusId` | String | Yes | Foreign key to Syllabus |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |

**Relationships:**
- Belongs to one `Syllabus` (many-to-one)
- Has many `SubModule` (one-to-many)
- Has many `SyllabusDocument` (one-to-many)

**Constraints:**
- Unique: `(syllabusId, chapterNumber)` - Each chapter number must be unique within a syllabus
- Cascade delete: When a Module is deleted, all SubModules and Documents are also deleted

**Indexes:**
- `(syllabusId, order)` - For efficient ordering queries
- `(syllabusId, chapterNumber)` - For chapter number lookups

**Example:**
```typescript
{
  id: "clx123abc",
  title: "Introduction to Algebra",
  description: "Basic algebraic concepts and operations",
  chapterNumber: 1,
  order: 1,
  syllabusId: "clx456def",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z"
}
```

---

### 2. SubModule

Represents a topic or section within a module.

**Table Name:** `SubModule`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Unique identifier |
| `title` | String | Yes | SubModule/topic title |
| `description` | String | No | Detailed description |
| `order` | Integer | Yes | Display order within module |
| `moduleId` | String | Yes | Foreign key to Module |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |

**Relationships:**
- Belongs to one `Module` (many-to-one)
- Has many `SyllabusDocument` (one-to-many)
- Has many `SubModuleProgress` (one-to-many)

**Constraints:**
- Cascade delete: When a SubModule is deleted, all Documents and Progress records are also deleted

**Indexes:**
- `(moduleId, order)` - For efficient ordering queries
- `moduleId` - For module lookups

**Example:**
```typescript
{
  id: "clx789ghi",
  title: "Linear Equations",
  description: "Solving linear equations with one variable",
  order: 1,
  moduleId: "clx123abc",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

---

### 3. SyllabusDocument

Represents documents (PDFs, videos, images, etc.) attached to modules or sub-modules.

**Table Name:** `SyllabusDocument`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Unique identifier |
| `title` | String | Yes | Document title |
| `description` | String | No | Document description |
| `filename` | String | Yes | Original filename |
| `fileUrl` | String | Yes | URL to stored file (Cloudinary) |
| `fileType` | String | Yes | MIME type (e.g., "application/pdf") |
| `fileSize` | Integer | Yes | File size in bytes |
| `order` | Integer | Yes | Display order |
| `moduleId` | String | No | Foreign key to Module (if attached to module) |
| `subModuleId` | String | No | Foreign key to SubModule (if attached to sub-module) |
| `uploadedBy` | String | Yes | User ID who uploaded the document |
| `createdAt` | DateTime | Yes | Upload timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |

**Relationships:**
- Belongs to one `Module` (optional, many-to-one)
- Belongs to one `SubModule` (optional, many-to-one)
- Note: A document must be attached to either a Module OR a SubModule, not both

**Constraints:**
- Cascade delete: When parent Module or SubModule is deleted, documents are also deleted

**Indexes:**
- `moduleId` - For module document lookups
- `subModuleId` - For sub-module document lookups
- `(moduleId, order)` - For ordered module documents
- `(subModuleId, order)` - For ordered sub-module documents

**Supported File Types:**
- Documents: PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx)
- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, WebM, MOV

**Example:**
```typescript
{
  id: "clx012jkl",
  title: "Linear Equations Worksheet",
  description: "Practice problems for linear equations",
  filename: "linear_equations_worksheet.pdf",
  fileUrl: "https://res.cloudinary.com/...",
  fileType: "application/pdf",
  fileSize: 245760,
  order: 1,
  moduleId: null,
  subModuleId: "clx789ghi",
  uploadedBy: "user_123",
  createdAt: "2024-01-15T11:00:00Z",
  updatedAt: "2024-01-15T11:00:00Z"
}
```

---

### 4. SubModuleProgress

Tracks teacher progress through sub-modules for curriculum coverage.

**Table Name:** `SubModuleProgress`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Unique identifier |
| `subModuleId` | String | Yes | Foreign key to SubModule |
| `teacherId` | String | Yes | Teacher's user ID |
| `completed` | Boolean | Yes | Completion status (default: false) |
| `completedAt` | DateTime | No | Timestamp when marked complete |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |

**Relationships:**
- Belongs to one `SubModule` (many-to-one)

**Constraints:**
- Unique: `(subModuleId, teacherId)` - One progress record per teacher per sub-module
- Cascade delete: When a SubModule is deleted, progress records are also deleted

**Indexes:**
- `teacherId` - For teacher progress lookups
- `(subModuleId, teacherId)` - For specific progress lookups

**Example:**
```typescript
{
  id: "clx345mno",
  subModuleId: "clx789ghi",
  teacherId: "teacher_456",
  completed: true,
  completedAt: "2024-01-20T14:30:00Z",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-20T14:30:00Z"
}
```

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Syllabus                             │
│  - id, title, description, subjectId                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                          Module                              │
│  - id, title, description, chapterNumber, order             │
│  - syllabusId                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        SubModule                             │
│  - id, title, description, order, moduleId                  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │ 1:N                   │ 1:N
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   SyllabusDocument       │  │   SubModuleProgress      │
│  - id, title, filename   │  │  - id, teacherId         │
│  - fileUrl, fileType     │  │  - completed             │
│  - moduleId/subModuleId  │  │  - completedAt           │
└──────────────────────────┘  └──────────────────────────┘
```

---

## Migration Strategy

### Phase 1: Schema Extension ✅ COMPLETED

- Added new tables: `Module`, `SubModule`, `SyllabusDocument`, `SubModuleProgress`
- Added relationship to `Syllabus` model
- Preserved existing `SyllabusUnit` and `Lesson` tables
- Added performance indexes

### Phase 2: Data Migration (Upcoming)

Will convert existing data:
- `SyllabusUnit` → `Module`
- `Lesson` → `SubModule`
- Assign sequential chapter numbers
- Preserve all relationships

### Phase 3: Code Migration (Upcoming)

- Update UI components
- Add feature flag for gradual rollout
- Maintain backward compatibility

### Phase 4: Deprecation (Future)

- Mark old models as deprecated
- Remove after transition period

---

## Usage Examples

### Creating a Module

```typescript
const module = await prisma.module.create({
  data: {
    title: "Introduction to Algebra",
    description: "Basic algebraic concepts",
    chapterNumber: 1,
    order: 1,
    syllabusId: "syllabus_id_here"
  }
});
```

### Creating a SubModule

```typescript
const subModule = await prisma.subModule.create({
  data: {
    title: "Linear Equations",
    description: "Solving linear equations",
    order: 1,
    moduleId: module.id
  }
});
```

### Uploading a Document

```typescript
const document = await prisma.syllabusDocument.create({
  data: {
    title: "Worksheet",
    filename: "worksheet.pdf",
    fileUrl: "https://cloudinary.com/...",
    fileType: "application/pdf",
    fileSize: 245760,
    order: 1,
    subModuleId: subModule.id,
    uploadedBy: "user_id_here"
  }
});
```

### Tracking Progress

```typescript
const progress = await prisma.subModuleProgress.upsert({
  where: {
    subModuleId_teacherId: {
      subModuleId: subModule.id,
      teacherId: "teacher_id_here"
    }
  },
  update: {
    completed: true,
    completedAt: new Date()
  },
  create: {
    subModuleId: subModule.id,
    teacherId: "teacher_id_here",
    completed: true,
    completedAt: new Date()
  }
});
```

### Querying with Relations

```typescript
const syllabusWithModules = await prisma.syllabus.findUnique({
  where: { id: "syllabus_id" },
  include: {
    modules: {
      include: {
        subModules: {
          include: {
            documents: true,
            progress: true
          }
        },
        documents: true
      },
      orderBy: { chapterNumber: 'asc' }
    }
  }
});
```

---

## Performance Considerations

### Indexes

All critical query paths are indexed:

1. **Module queries**: `(syllabusId, order)`, `(syllabusId, chapterNumber)`
2. **SubModule queries**: `(moduleId, order)`
3. **Document queries**: `moduleId`, `subModuleId`, with order
4. **Progress queries**: `teacherId`, `(subModuleId, teacherId)`

### Query Optimization

- Use `include` for eager loading related data
- Use `select` to fetch only needed fields
- Implement pagination for large lists
- Cache frequently accessed syllabus structures

---

## Backward Compatibility

The existing models are preserved:

- ✅ `Syllabus` - Unchanged
- ✅ `SyllabusUnit` - Maintained for legacy support
- ✅ `Lesson` - Maintained for legacy support

Applications can continue using the old structure while transitioning to the new one.

---

## Requirements Validation

This schema implementation validates the following requirements:

- ✅ **Requirement 1.1**: Module creation with all required fields
- ✅ **Requirement 1.2**: Chapter number uniqueness (unique constraint)
- ✅ **Requirement 1.3**: Module ordering (order field + index)
- ✅ **Requirement 1.4**: Display modules by chapter number (index)
- ✅ **Requirement 1.5**: Preserve relationships on update (foreign keys)
- ✅ **Requirement 2.1**: Sub-module creation with required fields
- ✅ **Requirement 2.2**: Sub-module ordering (order field + index)
- ✅ **Requirement 2.3**: Cascade delete sub-modules (ON DELETE CASCADE)
- ✅ **Requirement 2.4**: Update parent-child relationships (foreign keys)
- ✅ **Requirement 3.1, 3.2**: Document storage with metadata
- ✅ **Requirement 3.3**: Multiple documents with ordering
- ✅ **Requirement 3.5**: Cascade delete documents (ON DELETE CASCADE)
- ✅ **Requirement 10.1**: Progress tracking storage

---

## Next Steps

1. ✅ Schema design and migration creation
2. ⏳ Apply migration to database
3. ⏳ Implement server actions for CRUD operations
4. ⏳ Create Zod validation schemas
5. ⏳ Build UI components
6. ⏳ Implement data migration script
7. ⏳ Write property-based tests

---

## Support

For questions or issues related to the schema:

1. Review this documentation
2. Check the migration README at `prisma/migrations/20251224_add_enhanced_syllabus_models/README.md`
3. Run the verification script: `npx tsx scripts/verify-enhanced-syllabus-schema.ts`
4. Consult the design document at `.kiro/specs/enhanced-syllabus-system/design.md`
