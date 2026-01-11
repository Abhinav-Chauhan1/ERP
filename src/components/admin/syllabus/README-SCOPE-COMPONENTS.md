# Enhanced Syllabus Scope Components

This document describes the new UI components created for the Enhanced Syllabus Scope System.

## Components Overview

### 1. ScopeSelector

**File**: `scope-selector.tsx`

**Purpose**: Allows users to select the scope level for a syllabus (subject-wide, class-wide, or section-specific).

**Props**:
- `scopeType`: Current scope type selection
- `onScopeTypeChange`: Callback when scope type changes
- `classId`: Selected class ID (optional)
- `onClassChange`: Callback when class selection changes
- `sectionId`: Selected section ID (optional)
- `onSectionChange`: Callback when section selection changes
- `classes`: Array of available classes
- `sections`: Array of available sections for the selected class
- `disabled`: Whether the component is disabled

**Features**:
- Radio group for scope type selection
- Conditional class dropdown (shown for class-wide and section-specific)
- Conditional section dropdown (shown for section-specific only)
- Automatic disabling of section dropdown when no class is selected
- Clear labels and descriptions

**Usage Example**:
```tsx
import { ScopeSelector } from "@/components/admin/syllabus";

<ScopeSelector
  scopeType={scopeType}
  onScopeTypeChange={setScopeType}
  classId={classId}
  onClassChange={setClassId}
  sectionId={sectionId}
  onSectionChange={setSectionId}
  classes={classes}
  sections={sections}
/>
```

### 2. CurriculumTypeSelector

**File**: `curriculum-type-selector.tsx`

**Purpose**: Allows users to select the curriculum type and optionally specify a board type.

**Props**:
- `curriculumType`: Current curriculum type selection
- `onCurriculumTypeChange`: Callback when curriculum type changes
- `boardType`: Board type text (optional)
- `onBoardTypeChange`: Callback when board type changes
- `disabled`: Whether the component is disabled

**Features**:
- Dropdown for curriculum type (General, Advanced, Remedial, Integrated, Vocational, Special Needs)
- Text input for board type with suggestions (CBSE, ICSE, State Board, IB, Cambridge)
- Clear labels and descriptions

**Usage Example**:
```tsx
import { CurriculumTypeSelector } from "@/components/admin/syllabus";

<CurriculumTypeSelector
  curriculumType={curriculumType}
  onCurriculumTypeChange={setCurriculumType}
  boardType={boardType}
  onBoardTypeChange={setBoardType}
/>
```

### 3. MetadataInputs

**File**: `metadata-inputs.tsx`

**Purpose**: Allows users to add rich metadata to syllabi including tags, difficulty level, estimated hours, and prerequisites.

**Props**:
- `tags`: Array of current tags
- `onTagsChange`: Callback when tags change
- `difficultyLevel`: Current difficulty level
- `onDifficultyLevelChange`: Callback when difficulty level changes
- `estimatedHours`: Estimated hours (optional)
- `onEstimatedHoursChange`: Callback when estimated hours change
- `prerequisites`: Prerequisites text (optional)
- `onPrerequisitesChange`: Callback when prerequisites change
- `disabled`: Whether the component is disabled

**Features**:
- Tag input with Enter key to add tags
- Visual tag badges with remove buttons
- Difficulty level dropdown (Beginner, Intermediate, Advanced, Expert)
- Number input for estimated hours
- Textarea for prerequisites
- Clear labels and descriptions

**Usage Example**:
```tsx
import { MetadataInputs } from "@/components/admin/syllabus";

<MetadataInputs
  tags={tags}
  onTagsChange={setTags}
  difficultyLevel={difficultyLevel}
  onDifficultyLevelChange={setDifficultyLevel}
  estimatedHours={estimatedHours}
  onEstimatedHoursChange={setEstimatedHours}
  prerequisites={prerequisites}
  onPrerequisitesChange={setPrerequisites}
/>
```

### 4. EffectiveDateRangePicker

**File**: `effective-date-range-picker.tsx`

**Purpose**: Allows users to set effective date ranges for syllabi with validation.

**Props**:
- `effectiveFrom`: Start date (optional)
- `onEffectiveFromChange`: Callback when start date changes
- `effectiveTo`: End date (optional)
- `onEffectiveToChange`: Callback when end date changes
- `disabled`: Whether the component is disabled

**Features**:
- Two separate date pickers for start and end dates
- Automatic validation that end date is after start date
- Visual error indication for invalid date ranges
- Clear buttons for each date
- Summary display when both dates are set
- Disabled dates in end picker that are before start date

**Usage Example**:
```tsx
import { EffectiveDateRangePicker } from "@/components/admin/syllabus";

<EffectiveDateRangePicker
  effectiveFrom={effectiveFrom}
  onEffectiveFromChange={setEffectiveFrom}
  effectiveTo={effectiveTo}
  onEffectiveToChange={setEffectiveTo}
/>
```

## Integration Notes

### Required Server Actions

These components expect the following server actions to be available:
- `getAcademicYearsForDropdown()` - Already implemented in `syllabusActions.ts`
- `getClassesForDropdown(academicYearId?)` - Already implemented in `syllabusActions.ts`
- `getSectionsForDropdown(classId)` - Already implemented in `syllabusActions.ts`

### State Management

When integrating these components into a form, you'll need to manage state for:
- Scope type, class ID, section ID
- Curriculum type, board type
- Tags array, difficulty level, estimated hours, prerequisites
- Effective from and to dates

### Form Validation

The components provide client-side validation:
- ScopeSelector: Ensures class is selected for class-wide/section-specific
- EffectiveDateRangePicker: Ensures end date is after start date

Additional validation should be performed on form submission using Zod schemas.

### Accessibility

All components follow accessibility best practices:
- Proper label associations
- ARIA attributes where needed
- Keyboard navigation support
- Clear error messages
- Disabled state handling

## Next Steps

These components are ready to be integrated into:
1. Syllabus creation form (task 8.1)
2. Syllabus edit form (task 8.2)
3. Syllabus list filtering (task 9.2)

See the tasks.md file for implementation details.
