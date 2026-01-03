# Loading States and Optimistic Updates Implementation

## Overview

This document describes the implementation of loading states and optimistic updates for the Enhanced Syllabus System (Task 16). These features improve user experience by providing immediate visual feedback and reducing perceived latency.

## Components Implemented

### 1. Skeleton Loaders

Skeleton loaders provide visual placeholders while content is being fetched from the server.

#### Module List Skeleton
- **Location**: `src/components/academic/module-list-skeleton.tsx`
- **Purpose**: Shows placeholder for module list during initial load
- **Features**:
  - Configurable count of skeleton items
  - Matches the visual structure of actual modules
  - Includes placeholders for drag handles, chapter numbers, titles, descriptions, and badges

**Usage**:
```tsx
import { ModuleListSkeleton } from "@/components/academic/loading-states";

{isLoading ? (
  <ModuleListSkeleton count={3} />
) : (
  <ModuleList modules={modules} />
)}
```

#### Sub-Module List Skeleton
- **Location**: `src/components/academic/sub-module-list-skeleton.tsx`
- **Purpose**: Shows placeholder for sub-module list
- **Features**:
  - Compact design matching sub-module items
  - Includes placeholders for numbering and content

**Usage**:
```tsx
import { SubModuleListSkeleton } from "@/components/academic/loading-states";

{isLoading ? (
  <SubModuleListSkeleton count={2} />
) : (
  <SubModuleList subModules={subModules} />
)}
```

#### Document List Skeleton
- **Location**: `src/components/academic/document-list-skeleton.tsx`
- **Purpose**: Shows placeholder for document list
- **Features**:
  - File icon placeholders
  - Title and metadata placeholders

**Usage**:
```tsx
import { DocumentListSkeleton } from "@/components/academic/loading-states";

{isLoading ? (
  <DocumentListSkeleton count={2} />
) : (
  <DocumentList documents={documents} />
)}
```

### 2. File Upload Progress Indicators

Comprehensive progress tracking for file uploads with visual feedback.

#### File Upload Progress Component
- **Location**: `src/components/academic/file-upload-progress.tsx`
- **Purpose**: Shows progress for multiple file uploads
- **Features**:
  - Overall progress bar for bulk uploads
  - Individual file status (pending, uploading, success, error)
  - Progress bars for each file
  - Color-coded status indicators
  - Error messages for failed uploads

**Usage**:
```tsx
import { FileUploadProgress } from "@/components/academic/loading-states";

const files: FileUploadStatus[] = [
  {
    filename: "document.pdf",
    fileSize: 2048000,
    status: "uploading",
    progress: 65,
  },
  // ... more files
];

<FileUploadProgress files={files} />
```

#### Single File Upload Progress
- **Purpose**: Shows progress for a single file upload
- **Features**:
  - Animated upload icon
  - Progress bar
  - Status text (uploading, processing, complete)

**Usage**:
```tsx
import { SingleFileUploadProgress } from "@/components/academic/loading-states";

<SingleFileUploadProgress
  filename="document.pdf"
  progress={75}
  status="uploading"
/>
```

#### Bulk Upload Summary
- **Purpose**: Shows summary statistics for bulk uploads
- **Features**:
  - Total files count
  - Successful uploads (green)
  - Failed uploads (red)
  - In-progress uploads (blue)
  - Grid layout with color-coded cards

**Usage**:
```tsx
import { BulkUploadSummary } from "@/components/academic/loading-states";

<BulkUploadSummary
  total={10}
  successful={7}
  failed={2}
  inProgress={1}
/>
```

### 3. Optimistic Updates

Optimistic updates provide immediate UI feedback before server confirmation, with automatic rollback on errors.

#### Optimistic Reorder Hook
- **Location**: `src/hooks/use-optimistic-reorder.ts`
- **Purpose**: Manages optimistic reordering with rollback capability
- **Features**:
  - Immediate UI updates on drag-and-drop
  - Automatic rollback on server error
  - Change detection
  - Loading state management
  - Success/error callbacks

**Usage**:
```tsx
import { useOptimisticReorder } from "@/hooks/use-optimistic-reorder";

const {
  items,           // Current items (optimistically updated)
  moveItem,        // Function to move items
  saveOrder,       // Function to save to server
  cancelChanges,   // Function to revert changes
  isReordering,    // Loading state
  hasChanges,      // Whether there are unsaved changes
} = useOptimisticReorder({
  items: initialModules,
  onReorder: async (reorderedItems) => {
    const result = await reorderModules(reorderedItems);
    if (result.success) {
      await onRefresh();
    }
    return result;
  },
  onSuccess: () => {
    toast.success("Order saved successfully");
  },
  onError: (error) => {
    toast.error(error);
  },
});
```

#### Optimistic Update Hook
- **Purpose**: Generic hook for any optimistic update operation
- **Features**:
  - Optimistic data updates
  - Automatic rollback on error
  - Loading state management
  - Server response integration

**Usage**:
```tsx
import { useOptimisticUpdate } from "@/hooks/use-optimistic-reorder";

const { data, updateData, rollback, isUpdating } = useOptimisticUpdate({
  initialData: module,
  onUpdate: async (newData) => {
    return await updateModule(newData);
  },
  onSuccess: (data) => {
    toast.success("Updated successfully");
  },
  onError: (error) => {
    toast.error(error);
  },
});
```

## Integration Examples

### Module List with Loading States

The `ModuleList` component has been updated to include:

1. **Skeleton loader** during initial load
2. **Loading spinner** next to title during operations
3. **Optimistic reordering** with drag-and-drop
4. **Save Order button** that appears when changes are detected
5. **Loading state** on the Save Order button

```tsx
// In module-list.tsx
const {
  items: modules,
  moveItem: moveModule,
  saveOrder: handleSaveOrder,
  isReordering: isSaving,
  hasChanges: hasOrderChanged,
} = useOptimisticReorder({
  items: initialModules,
  onReorder: async (reorderedModules) => {
    // ... reorder logic
  },
  onSuccess: () => toast.success("Module order saved successfully"),
  onError: (error) => toast.error(error),
});

return (
  <div>
    {isLoading && modules.length === 0 ? (
      <ModuleListSkeleton count={3} />
    ) : (
      // ... render modules
    )}
  </div>
);
```

### Sub-Module List with Loading States

Similar integration in `SubModuleList`:

1. **Skeleton loader** for empty states
2. **Loading spinner** during operations
3. **Optimistic reordering** within modules
4. **Cross-module drag support** with visual feedback

### Bulk Document Upload with Progress

The `BulkDocumentUpload` component includes:

1. **File upload progress** for each file
2. **Bulk upload summary** showing statistics
3. **Progress bars** for overall and individual files
4. **Color-coded status** indicators
5. **Error handling** with specific error messages

## Visual Feedback Patterns

### Loading States
- **Skeleton loaders**: Pulsing gray placeholders matching content structure
- **Spinners**: Animated circular loaders for active operations
- **Progress bars**: Linear progress indicators for uploads

### Status Colors
- **Blue**: In progress / uploading
- **Green**: Success / completed
- **Red**: Error / failed
- **Gray**: Pending / waiting

### Transitions
- All loading states use smooth transitions
- Fade-in/fade-out effects for state changes
- Pulse animations for skeleton loaders
- Spin animations for loading spinners

## Performance Considerations

### Skeleton Loaders
- Lightweight components with minimal DOM elements
- CSS-only animations (no JavaScript)
- Configurable count to match expected content

### Optimistic Updates
- Immediate UI updates (no network delay)
- Efficient state management with React hooks
- Automatic cleanup on unmount
- Rollback mechanism prevents inconsistent state

### File Upload Progress
- Efficient progress tracking with minimal re-renders
- Batched status updates for bulk operations
- Cleanup of completed uploads

## Testing

### Manual Testing Checklist

#### Skeleton Loaders
- [ ] Module list skeleton appears during initial load
- [ ] Sub-module list skeleton appears when expanding modules
- [ ] Document list skeleton appears when loading documents
- [ ] Skeleton count matches expected content
- [ ] Smooth transition from skeleton to actual content

#### File Upload Progress
- [ ] Single file upload shows progress bar
- [ ] Multiple files show individual progress
- [ ] Bulk upload summary shows correct counts
- [ ] Success state shows green indicator
- [ ] Error state shows red indicator with message
- [ ] Progress updates smoothly

#### Optimistic Updates
- [ ] Drag-and-drop updates UI immediately
- [ ] "Save Order" button appears when changes detected
- [ ] Loading spinner shows during save
- [ ] Success toast appears on successful save
- [ ] UI reverts on save error
- [ ] Error toast appears on failure

### Demo Component

A comprehensive demo component is available at:
- **Location**: `src/components/academic/loading-states-demo.tsx`
- **Purpose**: Demonstrates all loading states and optimistic updates
- **Features**:
  - Interactive examples of all components
  - Code snippets for implementation
  - Visual comparison of different states

## Requirements Validation

This implementation satisfies Task 16 requirements:

✅ **Create skeleton loaders for module lists**
- Module list skeleton component
- Sub-module list skeleton component
- Document list skeleton component

✅ **Add loading spinners for file uploads**
- File upload progress component
- Single file upload progress
- Bulk upload summary with progress

✅ **Implement optimistic UI updates for reordering**
- Optimistic reorder hook
- Immediate drag-and-drop feedback
- Automatic rollback on error
- Change detection and save button

✅ **Add progress indicators for bulk operations**
- Bulk upload summary component
- Overall progress tracking
- Individual file progress
- Status indicators and error messages

## Future Enhancements

1. **Streaming Progress**: Real-time progress updates via WebSocket
2. **Retry Mechanism**: Automatic retry for failed uploads
3. **Pause/Resume**: Ability to pause and resume large uploads
4. **Offline Support**: Queue uploads when offline
5. **Compression**: Client-side file compression before upload
6. **Thumbnails**: Preview thumbnails for uploaded files
7. **Undo/Redo**: Stack-based undo/redo for reordering

## Related Documentation

- [Enhanced Syllabus System Design](../.kiro/specs/enhanced-syllabus-system/design.md)
- [Enhanced Syllabus System Requirements](../.kiro/specs/enhanced-syllabus-system/requirements.md)
- [Task List](../.kiro/specs/enhanced-syllabus-system/tasks.md)
