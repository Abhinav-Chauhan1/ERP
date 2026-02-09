# Loading States Quick Reference

Quick reference guide for implementing loading states and optimistic updates in the Enhanced Syllabus System.

## Import Statements

```tsx
// Skeleton loaders
import {
  ModuleListSkeleton,
  SubModuleListSkeleton,
  DocumentListSkeleton,
} from "@/components/academic/loading-states";

// File upload progress
import {
  FileUploadProgress,
  SingleFileUploadProgress,
  BulkUploadSummary,
  type FileUploadStatus,
} from "@/components/academic/loading-states";

// Optimistic updates
import {
  useOptimisticReorder,
  useOptimisticUpdate,
} from "@/hooks/use-optimistic-reorder";
```

## Skeleton Loaders

### Module List
```tsx
{isLoading ? (
  <ModuleListSkeleton count={3} />
) : (
  <ModuleList modules={modules} />
)}
```

### Sub-Module List
```tsx
{isLoading ? (
  <SubModuleListSkeleton count={2} />
) : (
  <SubModuleList subModules={subModules} />
)}
```

### Document List
```tsx
{isLoading ? (
  <DocumentListSkeleton count={2} />
) : (
  <DocumentList documents={documents} />
)}
```

## File Upload Progress

### Single File
```tsx
<SingleFileUploadProgress
  filename="document.pdf"
  progress={75}
  status="uploading" // "uploading" | "processing" | "complete"
/>
```

### Multiple Files
```tsx
const files: FileUploadStatus[] = [
  {
    filename: "file1.pdf",
    fileSize: 2048000,
    status: "success",
    progress: 100,
  },
  {
    filename: "file2.docx",
    fileSize: 512000,
    status: "uploading",
    progress: 65,
  },
  {
    filename: "file3.pptx",
    fileSize: 4096000,
    status: "error",
    progress: 30,
    error: "Upload failed",
  },
];

<FileUploadProgress files={files} />
```

### Bulk Upload Summary
```tsx
<BulkUploadSummary
  total={10}
  successful={7}
  failed={2}
  inProgress={1}
/>
```

## Optimistic Reordering

### Basic Setup
```tsx
const {
  items,           // Optimistically updated items
  moveItem,        // (fromIndex, toIndex) => void
  saveOrder,       // () => Promise<void>
  cancelChanges,   // () => void
  isReordering,    // boolean
  hasChanges,      // boolean
} = useOptimisticReorder({
  items: initialItems,
  onReorder: async (reorderedItems) => {
    // Call your API
    const result = await reorderModules(reorderedItems);
    if (result.success) {
      await onRefresh();
    }
    return result; // Must return { success: boolean, error?: string }
  },
  onSuccess: () => {
    toast.success("Order saved");
  },
  onError: (error) => {
    toast.error(error);
  },
});
```

### Usage in Component
```tsx
// Show save button when changes detected
{hasChanges && (
  <Button onClick={saveOrder} disabled={isReordering}>
    {isReordering ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Saving...
      </>
    ) : (
      "Save Order"
    )}
  </Button>
)}

// Use items instead of state
{items.map((item, index) => (
  <DraggableItem
    key={item.id}
    item={item}
    index={index}
    onMove={moveItem}
  />
))}
```

## Optimistic Updates (Generic)

```tsx
const { data, updateData, rollback, isUpdating } = useOptimisticUpdate({
  initialData: module,
  onUpdate: async (newData) => {
    const result = await updateModule(newData);
    return result; // { success: boolean, error?: string, data?: T }
  },
  onSuccess: (data) => {
    toast.success("Updated");
  },
  onError: (error) => {
    toast.error(error);
  },
});

// Update optimistically
await updateData({ ...data, title: "New Title" });
```

## Loading Indicators

### Inline Spinner
```tsx
<div className="flex items-center gap-2">
  <h3>Modules</h3>
  {isLoading && (
    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  )}
</div>
```

### Button Loading State
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    "Submit"
  )}
</Button>
```

## Common Patterns

### Conditional Rendering with Loading
```tsx
{isLoading && items.length === 0 ? (
  <Skeleton />
) : items.length === 0 ? (
  <EmptyState />
) : (
  <ItemList items={items} />
)}
```

### Loading with Existing Content
```tsx
<div className="relative">
  {isLoading && (
    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )}
  <Content />
</div>
```

### Optimistic Delete
```tsx
const handleDelete = async (id: string) => {
  // Optimistically remove from UI
  setItems(items.filter(item => item.id !== id));
  
  try {
    const result = await deleteItem(id);
    if (!result.success) {
      // Rollback on error
      setItems(originalItems);
      toast.error(result.error);
    }
  } catch (error) {
    // Rollback on error
    setItems(originalItems);
    toast.error("Delete failed");
  }
};
```

## Status Colors

```tsx
// Success
className="text-green-600 dark:text-green-400"
className="bg-green-50 dark:bg-green-950/20 border-green-200"

// Error
className="text-destructive"
className="bg-red-50 dark:bg-red-950/20 border-red-200"

// In Progress
className="text-blue-600"
className="bg-blue-50 dark:bg-blue-950/20 border-blue-200"

// Pending
className="text-muted-foreground"
className="bg-accent/50"
```

## Demo Component

View all loading states in action:
```tsx
import { LoadingStatesDemo } from "@/components/academic/loading-states-demo";

<LoadingStatesDemo />
```

## Troubleshooting

### Skeleton doesn't match content
- Ensure skeleton structure mirrors actual component
- Check spacing and sizing classes

### Optimistic update doesn't revert on error
- Verify `onReorder` returns `{ success: false, error: string }`
- Check that error is thrown or result indicates failure

### Progress not updating
- Ensure state updates are batched appropriately
- Check that progress values are between 0-100

### Loading spinner not showing
- Verify loading state is set before async operation
- Check that spinner is not hidden by CSS

## Best Practices

1. **Always show loading state** for operations > 200ms
2. **Use skeleton loaders** for initial page loads
3. **Use spinners** for user-initiated actions
4. **Implement optimistic updates** for drag-and-drop
5. **Show progress** for file uploads
6. **Provide rollback** for failed optimistic updates
7. **Use toast notifications** for success/error feedback
8. **Keep loading states consistent** across the app
9. **Test error scenarios** to ensure rollback works
10. **Avoid blocking UI** during background operations
