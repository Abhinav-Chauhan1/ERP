# Module Management UI

## Overview

The Module Management UI provides a comprehensive interface for administrators to manage syllabus modules (chapters) with drag-and-drop reordering, inline editing, and bulk operations.

## Features

### 1. Module List with Accordion Layout
- Displays modules in an expandable accordion format
- Shows chapter number, title, description, and counts for sub-modules and documents
- Expandable sections reveal sub-modules and documents within each module

### 2. Drag-and-Drop Reordering
- Drag modules using the grip handle to reorder them
- Visual feedback during drag operations (opacity change, border highlight)
- "Save Order" button appears when order changes
- Automatically updates chapter numbers and order values

### 3. Inline Editing
- Quick edit module title and description without opening a dialog
- Click the edit icon to enable inline editing mode
- Save or cancel changes with dedicated buttons
- Drag-and-drop is disabled during inline editing

### 4. Module Form Dialog
- Full-featured dialog for creating and editing modules
- Fields:
  - Title (required)
  - Description (optional)
  - Chapter Number (required, must be unique)
  - Display Order (required)
- Validation with Zod schema
- Suggests next available chapter number for new modules

### 5. Bulk Actions
- Delete multiple modules at once
- Confirmation dialog before bulk deletion
- Shows count of selected modules

### 6. Chapter Number Validation
- Ensures chapter numbers are unique within a syllabus
- Server-side validation prevents duplicates
- Clear error messages for validation failures

## Components

### ModuleList
**Location:** `src/components/academic/module-list.tsx`

Main component that renders the list of modules with drag-and-drop functionality.

**Props:**
- `modules`: Array of module objects
- `syllabusId`: ID of the syllabus
- `onRefresh`: Callback to refresh data after changes

**Features:**
- DnD Provider wrapper for drag-and-drop
- State management for editing, deleting, and reordering
- Bulk delete functionality
- Empty state when no modules exist

### ModuleFormDialog
**Location:** `src/components/academic/module-form-dialog.tsx`

Dialog component for creating and editing modules.

**Props:**
- `open`: Boolean to control dialog visibility
- `onClose`: Callback when dialog closes
- `onSuccess`: Callback when form submission succeeds
- `syllabusId`: ID of the syllabus
- `module`: Module object for editing (null for creating)
- `existingChapterNumbers`: Array of existing chapter numbers for validation

**Features:**
- Form validation with react-hook-form and Zod
- Auto-suggests next chapter number
- Error handling and display
- Loading states during submission

### DraggableModule
**Location:** `src/components/academic/module-list.tsx` (internal component)

Individual module item with drag-and-drop and inline editing capabilities.

**Features:**
- Drag handle with visual feedback
- Inline editing mode with input fields
- Accordion trigger for expanding/collapsing
- Edit and delete buttons
- Sub-modules and documents display

## Usage

### Accessing the Module Management UI

Navigate to: `/admin/academic/syllabus/modules`

Or add a link from the syllabus management page:

```tsx
<Link href="/admin/academic/syllabus/modules">
  <Button>Manage Modules</Button>
</Link>
```

### Creating a New Module

1. Click "Add Module" button
2. Fill in the form:
   - Title (e.g., "Introduction to Algebra")
   - Description (optional)
   - Chapter Number (auto-suggested)
   - Display Order (auto-suggested)
3. Click "Create Module"

### Editing a Module

**Option 1: Inline Editing (Quick)**
1. Click the edit icon on a module
2. Edit title and/or description
3. Click "Save" or "Cancel"

**Option 2: Form Dialog (Full)**
1. Click the edit icon on a module
2. Modify any fields in the dialog
3. Click "Update Module"

### Reordering Modules

1. Drag a module by its grip handle
2. Drop it in the desired position
3. Click "Save Order" to persist changes
4. Chapter numbers are automatically updated

### Deleting Modules

**Single Delete:**
1. Click the trash icon on a module
2. Confirm deletion in the dialog

**Bulk Delete:**
1. Select multiple modules (feature to be implemented)
2. Click "Delete Selected"
3. Confirm deletion

## Server Actions

### createModule
Creates a new module with validation.

**Requirements:** 1.1, 1.2

**Validation:**
- Checks for duplicate chapter numbers
- Validates required fields
- Ensures syllabus exists

### updateModule
Updates an existing module while preserving relationships.

**Requirements:** 1.5

**Features:**
- Preserves sub-modules and documents
- Validates chapter number uniqueness
- Updates all fields

### deleteModule
Deletes a module with cascade delete.

**Requirements:** 2.3, 3.5

**Features:**
- Cascade deletes sub-modules
- Cascade deletes documents
- Returns count of deleted items

### reorderModules
Updates order and chapter numbers for multiple modules.

**Requirements:** 8.1

**Features:**
- Transaction-based updates
- Validates all modules belong to syllabus
- Checks for duplicate chapter numbers

### getModulesBySyllabus
Fetches all modules for a syllabus ordered by chapter number.

**Requirements:** 1.4, 5.1, 6.1

**Features:**
- Includes sub-modules and documents
- Orders by chapter number
- Includes progress data

## Validation Schema

**Location:** `src/lib/schemaValidation/moduleSchemaValidations.ts`

### moduleSchema
```typescript
{
  title: string (min 3 chars),
  description: string (optional),
  chapterNumber: number (min 1),
  order: number (min 1),
  syllabusId: string (required)
}
```

### moduleUpdateSchema
Extends `moduleSchema` with:
```typescript
{
  id: string (required)
}
```

### reorderModulesSchema
```typescript
{
  syllabusId: string (required),
  moduleOrders: array of {
    id: string,
    order: number,
    chapterNumber: number
  }
}
```

## Error Handling

### Validation Errors
- **Duplicate Chapter Number:** "Chapter number {N} already exists in this syllabus"
- **Missing Required Fields:** Field-specific error messages
- **Invalid Parent Reference:** "Syllabus not found"

### Database Errors
- **Constraint Violation:** "Operation violates database constraints"
- **Record Not Found:** "Module with ID {id} not found"
- **Cascade Delete Failure:** "Failed to delete module and associated records"

## Styling

The UI uses Tailwind CSS with shadcn/ui components:
- Accordion for expandable sections
- Badges for counts
- Buttons with variants (primary, outline, ghost, destructive)
- Cards for empty states
- Input and Textarea for forms
- Dialog for modals

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management in dialogs
- Screen reader friendly
- Color contrast compliance

## Performance Considerations

- Optimistic UI updates for better UX
- Debounced drag operations
- Lazy loading of sub-modules and documents
- Transaction-based bulk operations
- Client-side caching with React Query (future enhancement)

## Future Enhancements

1. **Checkbox Selection:** Add checkboxes for bulk selection
2. **Keyboard Shortcuts:** Add shortcuts for common actions
3. **Undo/Redo:** Add undo functionality for reordering
4. **Search/Filter:** Add search and filter capabilities
5. **Export/Import:** Export modules to JSON/CSV
6. **Templates:** Pre-built module templates
7. **Duplicate Module:** Clone existing modules
8. **Module Preview:** Preview module content before saving

## Testing

Unit tests are located at: `src/components/academic/__tests__/module-list.test.tsx`

Run tests:
```bash
npm run test:run -- src/components/academic/__tests__/module-list.test.tsx
```

## Dependencies

- `react-dnd`: Drag-and-drop functionality
- `react-dnd-html5-backend`: HTML5 backend for react-dnd
- `react-hook-form`: Form state management
- `@hookform/resolvers`: Zod resolver for react-hook-form
- `zod`: Schema validation
- `lucide-react`: Icons
- `shadcn/ui`: UI components

## Related Documentation

- [Enhanced Syllabus System Design](../.kiro/specs/enhanced-syllabus-system/design.md)
- [Enhanced Syllabus System Requirements](../.kiro/specs/enhanced-syllabus-system/requirements.md)
- [Module Actions](../src/lib/actions/moduleActions.ts)
- [Module Schema Validations](../src/lib/schemaValidation/moduleSchemaValidations.ts)
