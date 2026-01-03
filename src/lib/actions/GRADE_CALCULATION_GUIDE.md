# Grade Calculation Service Guide

This guide explains how to use the grade calculation service for the Offline Exam Marks Entry system.

## Overview

The grade calculation service provides functionality to:
1. Calculate percentage from marks
2. Assign grades based on configurable grade scales
3. Fetch applicable grade scales from the database
4. Automatically calculate grades during marks entry
5. Recalculate grades for existing results when grade scales are updated

## Components

### 1. Utility Functions (`src/lib/utils/grade-calculator.ts`)

#### `calculatePercentage(obtainedMarks: number, totalMarks: number): number`
Calculates percentage from marks, rounded to 2 decimal places.

```typescript
import { calculatePercentage } from '@/lib/utils/grade-calculator';

const percentage = calculatePercentage(85, 100); // Returns 85.00
const percentage2 = calculatePercentage(33.333, 100); // Returns 33.33
```

#### `calculateGradeFromScale(percentage: number, gradeScale: GradeScaleEntry[]): string | null`
Determines grade based on percentage using a grade scale from the database.

```typescript
import { calculateGradeFromScale } from '@/lib/utils/grade-calculator';

const gradeScale = [
  { id: '1', grade: 'A+', minMarks: 90, maxMarks: 100, gpa: 4.0 },
  { id: '2', grade: 'A', minMarks: 80, maxMarks: 89.99, gpa: 3.7 },
  // ... more grades
];

const grade = calculateGradeFromScale(85, gradeScale); // Returns 'A'
```

#### `calculateGrade(percentage: number): string`
Fallback function that uses default grading scale when no database scale is configured.

```typescript
import { calculateGrade } from '@/lib/utils/grade-calculator';

const grade = calculateGrade(85); // Returns 'A'
```

### 2. Server Actions (`src/lib/actions/gradeCalculationActions.ts`)

#### `getGradeScale(): Promise<ActionResult>`
Fetches the configured grade scale from the database.

```typescript
import { getGradeScale } from '@/lib/actions/gradeCalculationActions';

const result = await getGradeScale();
if (result.success) {
  const gradeScale = result.data;
  // Use grade scale
} else {
  console.error(result.error);
}
```

#### `calculateGradeForMarks(obtainedMarks: number, totalMarks: number): Promise<ActionResult>`
Calculates both percentage and grade for given marks using the configured grade scale.

```typescript
import { calculateGradeForMarks } from '@/lib/actions/gradeCalculationActions';

const result = await calculateGradeForMarks(85, 100);
if (result.success) {
  console.log(result.data.percentage); // 85.00
  console.log(result.data.grade); // 'A'
}
```

#### `recalculateGradesForTerm(termId: string): Promise<ActionResult>`
Recalculates grades for all exam results in a term. Useful when grade scale is updated.

```typescript
import { recalculateGradesForTerm } from '@/lib/actions/gradeCalculationActions';

const result = await recalculateGradesForTerm('term-id-123');
if (result.success) {
  console.log(`Updated ${result.data.updatedCount} exam results`);
}
```

#### `recalculateGradesForExam(examId: string): Promise<ActionResult>`
Recalculates grades for all results of a specific exam.

```typescript
import { recalculateGradesForExam } from '@/lib/actions/gradeCalculationActions';

const result = await recalculateGradesForExam('exam-id-123');
if (result.success) {
  console.log(`Updated ${result.data.updatedCount} exam results`);
}
```

## Integration with Marks Entry

The grade calculation service is automatically integrated with the marks entry system. When marks are saved using `saveExamMarks()`, grades are automatically calculated:

```typescript
import { saveExamMarks } from '@/lib/actions/marksEntryActions';

const result = await saveExamMarks({
  examId: 'exam-123',
  subjectId: 'subject-456',
  marks: [
    {
      studentId: 'student-1',
      theoryMarks: 40,
      practicalMarks: 35,
      internalMarks: 10,
      isAbsent: false,
    },
    // ... more students
  ],
});

// Grades are automatically calculated and saved
```

## Grade Scale Configuration

Before using the grade calculation service, ensure grade scales are configured in the database:

1. Navigate to Admin > Academic > Grades
2. Create grade scale entries with:
   - Grade label (e.g., "A+", "A", "B+")
   - Minimum marks (percentage)
   - Maximum marks (percentage)
   - GPA (optional)
   - Description (optional)

Example grade scale:
```
A+: 90-100% (GPA: 4.0)
A:  80-89%  (GPA: 3.7)
B+: 70-79%  (GPA: 3.3)
B:  60-69%  (GPA: 3.0)
C:  50-59%  (GPA: 2.0)
D:  40-49%  (GPA: 1.0)
F:  0-39%   (GPA: 0.0)
```

## Automatic Grade Calculation

Grades are automatically calculated in the following scenarios:

1. **During Marks Entry**: When marks are entered or updated through the marks entry interface
2. **During Import**: When marks are imported from Excel/CSV files
3. **Manual Recalculation**: When triggered manually after grade scale updates

## Recalculating Grades

When you update the grade scale configuration, you should recalculate grades for existing results:

### Option 1: Recalculate for Entire Term
```typescript
// In your admin interface
const handleRecalculateGrades = async () => {
  const result = await recalculateGradesForTerm(selectedTermId);
  if (result.success) {
    toast.success(result.data.message);
  } else {
    toast.error(result.error);
  }
};
```

### Option 2: Recalculate for Specific Exam
```typescript
const handleRecalculateExamGrades = async () => {
  const result = await recalculateGradesForExam(selectedExamId);
  if (result.success) {
    toast.success(result.data.message);
  } else {
    toast.error(result.error);
  }
};
```

## Error Handling

The service includes comprehensive error handling:

```typescript
const result = await calculateGradeForMarks(85, 100);

if (!result.success) {
  // Handle error
  console.error(result.error);
  
  // Check for specific error details
  if (result.details) {
    Object.entries(result.details).forEach(([key, errors]) => {
      console.error(`${key}: ${errors.join(', ')}`);
    });
  }
}
```

## Fallback Behavior

If no grade scale is configured in the database, the system automatically falls back to a default grading scale:

- A+: 90-100%
- A:  80-89%
- B+: 70-79%
- B:  60-69%
- C+: 50-59%
- C:  40-49%
- D:  33-39%
- F:  0-32%

## Best Practices

1. **Configure Grade Scales First**: Always configure grade scales before entering marks
2. **Validate Grade Ranges**: Ensure grade ranges don't overlap when creating grade scales
3. **Recalculate After Updates**: Always recalculate grades after updating grade scale configuration
4. **Handle Absent Students**: The system automatically skips grade calculation for absent students
5. **Test Grade Calculations**: Use the utility functions to test grade calculations before deploying

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 1.3**: Automatic grade calculation on marks entry ✓
- **Requirement 8.1**: Configurable grade scales with labels and mark ranges ✓
- **Requirement 8.2**: Automatic grade assignment based on percentage ✓
- **Requirement 8.3**: Support for multiple grade scales ✓
- **Requirement 8.4**: Recalculate grades for existing results ✓

## Testing

Unit tests are available in `src/lib/utils/__tests__/grade-calculator.test.ts`:

```bash
npm test -- src/lib/utils/__tests__/grade-calculator.test.ts --run
```

## API Reference

### ActionResult Interface
```typescript
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}
```

### GradeScaleEntry Interface
```typescript
interface GradeScaleEntry {
  id: string;
  grade: string;
  minMarks: number;
  maxMarks: number;
  gpa?: number | null;
  description?: string | null;
}
```
