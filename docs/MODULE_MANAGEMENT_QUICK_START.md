# Module Management UI - Quick Start Guide

## Accessing the Module Management UI

### Option 1: Direct URL
Navigate to: `http://localhost:3000/admin/academic/syllabus/modules`

### Option 2: From Syllabus Page
1. Go to Admin Dashboard
2. Navigate to Academic → Syllabus
3. Click "Manage Modules" button (to be added)

## Quick Start Tutorial

### Step 1: Select a Subject
1. Open the Module Management page
2. Select a subject from the dropdown
3. The system will load the syllabus and existing modules

### Step 2: Create Your First Module
1. Click the "Add Module" button
2. Fill in the form:
   - **Title**: "Introduction to Algebra" (required)
   - **Description**: "Basic algebraic concepts and operations" (optional)
   - **Chapter Number**: 1 (auto-suggested, must be unique)
   - **Display Order**: 1 (auto-suggested)
3. Click "Create Module"
4. Success! Your first module is created

### Step 3: Add More Modules
Repeat Step 2 to add more modules. The system will automatically suggest the next chapter number and order.

### Step 4: Reorder Modules
1. Hover over a module to see the grip handle (⋮⋮)
2. Click and drag the module to a new position
3. Drop it where you want it
4. Click "Save Order" to persist the changes
5. Chapter numbers are automatically updated!

### Step 5: Quick Edit (Inline Editing)
1. Click the edit icon (✏️) on any module
2. The module expands into edit mode
3. Modify the title and/or description
4. Click "Save" (✓) to save changes
5. Or click "Cancel" (✗) to discard changes

### Step 6: Full Edit (Dialog)
1. Click the edit icon (✏️) on any module
2. The form dialog opens
3. Modify any field including chapter number and order
4. Click "Update Module"

### Step 7: Delete a Module
1. Click the trash icon (🗑️) on any module
2. Confirm the deletion in the dialog
3. The module and all its sub-modules/documents are deleted

## Common Tasks

### Creating Multiple Modules at Once
1. Click "Add Module"
2. Fill in the form and click "Create Module"
3. The dialog closes automatically
4. Click "Add Module" again for the next module
5. Repeat as needed

### Reordering Multiple Modules
1. Drag and drop modules one by one
2. The "Save Order" button appears after the first change
3. Continue reordering as needed
4. Click "Save Order" once when done
5. All changes are saved in a single transaction

### Fixing Chapter Number Conflicts
If you try to create a module with a duplicate chapter number:
1. You'll see an error: "Chapter number X already exists in this syllabus"
2. Change the chapter number to a unique value
3. Try again

### Viewing Module Contents
1. Click anywhere on a module (except buttons) to expand it
2. You'll see:
   - List of sub-modules
   - List of documents
   - Buttons to add more
3. Click again to collapse

## Tips and Tricks

### Keyboard Navigation
- **Tab**: Navigate between buttons and inputs
- **Enter**: Submit forms
- **Escape**: Close dialogs

### Visual Feedback
- **Dragging**: Module becomes semi-transparent
- **Drop Target**: Blue border appears
- **Loading**: Spinner icons appear
- **Success**: Green toast notification
- **Error**: Red toast notification

### Best Practices
1. **Use Sequential Chapter Numbers**: Start with 1, 2, 3, etc.
2. **Descriptive Titles**: Use clear, concise titles
3. **Add Descriptions**: Help students understand the module
4. **Reorder Before Adding Content**: Set up the structure first
5. **Save Order Frequently**: Don't lose your reordering work

## Troubleshooting

### "No Syllabus Found"
**Problem**: The selected subject doesn't have a syllabus yet.
**Solution**: Go to Syllabus Management and create a syllabus first.

### "Chapter number already exists"
**Problem**: You're trying to use a chapter number that's already taken.
**Solution**: Choose a different chapter number or edit the existing module.

### Drag-and-Drop Not Working
**Problem**: Can't drag modules.
**Solution**: 
- Make sure you're clicking the grip handle (⋮⋮)
- Check that you're not in inline editing mode
- Refresh the page if needed

### Changes Not Saving
**Problem**: Reordered modules but changes didn't persist.
**Solution**: Make sure to click "Save Order" after reordering.

### Module Not Expanding
**Problem**: Clicking a module doesn't expand it.
**Solution**: 
- Make sure you're not clicking on buttons
- Click on the title or description area
- Check that you're not in inline editing mode

## Next Steps

After setting up your modules:
1. **Add Sub-modules**: Click "Add Sub-module" within each module
2. **Upload Documents**: Click "Upload Document" to add learning materials
3. **Track Progress**: Teachers can mark modules as completed
4. **Student Access**: Students can view modules and download documents

## Need Help?

- **Documentation**: See `docs/MODULE_MANAGEMENT_UI.md` for detailed information
- **API Reference**: See `src/lib/actions/moduleActions.ts` for server actions
- **Component Code**: See `src/components/academic/module-list.tsx` for implementation

## Screenshots

### Empty State
```
┌─────────────────────────────────────────┐
│  📄 No Modules Yet                      │
│                                         │
│  Start building your syllabus by       │
│  adding modules (chapters)              │
│                                         │
│  [+ Add First Module]                   │
└─────────────────────────────────────────┘
```

### Module List
```
┌─────────────────────────────────────────┐
│  Modules [2]              [Save Order]  │
│                           [+ Add Module]│
├─────────────────────────────────────────┤
│  ⋮⋮ [1] Introduction to Algebra    ✏️ 🗑️│
│      Basic algebraic concepts           │
│      [0 Sub-modules] [0 Documents]      │
│      ▼                                  │
├─────────────────────────────────────────┤
│  ⋮⋮ [2] Linear Equations           ✏️ 🗑️│
│      Solving linear equations           │
│      [3 Sub-modules] [2 Documents]      │
│      ▶                                  │
└─────────────────────────────────────────┘
```

### Inline Editing
```
┌─────────────────────────────────────────┐
│  ⋮⋮ [1] ┌─────────────────────────────┐│
│         │ Introduction to Algebra     ││
│         └─────────────────────────────┘│
│         ┌─────────────────────────────┐│
│         │ Basic algebraic concepts    ││
│         │                             ││
│         └─────────────────────────────┘│
│         [✓ Save] [✗ Cancel]            │
└─────────────────────────────────────────┘
```

## Keyboard Shortcuts (Future Enhancement)

Coming soon:
- `Ctrl+N`: New module
- `Ctrl+S`: Save order
- `Ctrl+E`: Edit selected module
- `Delete`: Delete selected module
- `↑/↓`: Navigate modules
- `Space`: Expand/collapse module

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Author**: ERP Development Team
