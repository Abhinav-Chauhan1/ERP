# Promotion UI Components

This directory contains all UI components for the Student Promotion feature.

## Components

### 1. PromotionWizard
Main wizard component that orchestrates the multi-step promotion process.

**Features:**
- Three-step wizard (Select → Preview → Execute)
- Progress indicator with step navigation
- Data management across steps
- Validation for each step

**Usage:**
```tsx
import { PromotionWizard } from "@/components/academic/promotion";

<PromotionWizard
  onComplete={(data) => console.log("Promotion data:", data)}
  onCancel={() => console.log("Cancelled")}
>
  {({ currentStep, data, updateData, nextStep, prevStep, canGoNext, canGoPrev }) => (
    // Render step content based on currentStep
  )}
</PromotionWizard>
```

### 2. StudentSelectionTable
Table component for selecting students to promote.

**Features:**
- Checkbox selection (individual and select all)
- Search functionality (name, admission ID, roll number)
- Warning indicators for students with issues
- Real-time selection count

**Usage:**
```tsx
import { StudentSelectionTable } from "@/components/academic/promotion";

<StudentSelectionTable
  students={students}
  selectedStudentIds={selectedIds}
  onSelectionChange={setSelectedIds}
  isLoading={false}
/>
```

### 3. PromotionPreview
Preview component showing promotion summary and warnings.

**Features:**
- Visual promotion flow (from → to)
- Statistics cards (total, eligible, warnings)
- Detailed warning list
- Estimated completion time
- Important notes and alerts

**Usage:**
```tsx
import { PromotionPreview } from "@/components/academic/promotion";

<PromotionPreview
  data={{
    sourceClassName: "Grade 10",
    targetClassName: "Grade 11",
    totalStudents: 50,
    eligibleStudents: 48,
    studentsWithWarnings: 2,
    warnings: [...],
    estimatedTimeMinutes: 2,
  }}
/>
```

### 4. PromotionConfirmDialog
Confirmation dialog with final settings before execution.

**Features:**
- Student exclusion management
- Roll number strategy selection (auto/manual/preserve)
- Notification toggle
- Warning review and exclusion reasons
- Summary statistics

**Usage:**
```tsx
import { PromotionConfirmDialog } from "@/components/academic/promotion";

<PromotionConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  data={confirmData}
  onConfirm={(result) => console.log("Confirmed:", result)}
  onCancel={() => setIsOpen(false)}
/>
```

### 5. PromotionProgressDialog
Real-time progress dialog during promotion execution.

**Features:**
- Progress bar with percentage
- Live statistics (total, success, failed)
- Current operation display
- Estimated time remaining
- Error display
- Non-dismissible during processing

**Usage:**
```tsx
import { PromotionProgressDialog } from "@/components/academic/promotion";

<PromotionProgressDialog
  open={isProcessing}
  data={{
    status: "processing",
    totalStudents: 50,
    processedStudents: 25,
    successfulPromotions: 24,
    failedPromotions: 1,
    currentOperation: "Creating enrollments...",
    estimatedTimeRemaining: 30,
  }}
/>
```

### 6. PromotionResultsDialog
Results dialog showing promotion outcome.

**Features:**
- Summary cards with statistics
- Tabbed view (Promoted/Excluded/Failed)
- Detailed student lists
- Export functionality
- Success/failure alerts
- Promotion history ID

**Usage:**
```tsx
import { PromotionResultsDialog } from "@/components/academic/promotion";

<PromotionResultsDialog
  open={showResults}
  onOpenChange={setShowResults}
  result={{
    historyId: "abc123",
    summary: { total: 50, promoted: 48, excluded: 1, failed: 1 },
    promotedStudents: [...],
    failedPromotions: [...],
    excludedStudents: [...],
  }}
  onExport={() => console.log("Export results")}
  onClose={() => setShowResults(false)}
/>
```

## Complete Workflow Example

```tsx
"use client";

import { useState } from "react";
import {
  PromotionWizard,
  StudentSelectionTable,
  PromotionPreview,
  PromotionConfirmDialog,
  PromotionProgressDialog,
  PromotionResultsDialog,
} from "@/components/academic/promotion";

export function PromotionPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showResults, setShowResults] = useState(false);

  return (
    <PromotionWizard
      onComplete={(data) => {
        setShowConfirm(true);
      }}
      onCancel={() => router.back()}
    >
      {({ currentStep, data, updateData, nextStep, prevStep, canGoNext, canGoPrev }) => (
        <>
          {currentStep === 0 && (
            <StudentSelectionTable
              students={students}
              selectedStudentIds={data.selectedStudentIds}
              onSelectionChange={(ids) => updateData({ selectedStudentIds: ids })}
            />
          )}
          
          {currentStep === 1 && (
            <PromotionPreview data={previewData} />
          )}
          
          {currentStep === 2 && (
            <div>Execution step content</div>
          )}
        </>
      )}
    </PromotionWizard>
  );
}
```

## Design Patterns

### State Management
- Components use controlled state pattern
- Parent components manage data flow
- Callbacks for state updates

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management

### Responsive Design
- Mobile-first approach
- Grid layouts adapt to screen size
- Touch-friendly controls

### Error Handling
- Validation at each step
- Clear error messages
- Graceful degradation

## Dependencies

- shadcn/ui components (Dialog, Button, Table, etc.)
- lucide-react icons
- Radix UI primitives
- Tailwind CSS for styling

## Requirements Mapping

- **Requirement 1.1, 1.2, 1.3**: PromotionWizard, StudentSelectionTable
- **Requirement 2.1-2.6**: PromotionPreview
- **Requirement 2.5, 3.3, 9.1, 15.7**: PromotionConfirmDialog
- **Requirement 1.6**: PromotionProgressDialog
- **Requirement 1.6, 1.8, 3.3**: PromotionResultsDialog
