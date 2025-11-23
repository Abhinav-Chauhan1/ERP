# Keyboard Shortcuts Implementation

## Overview

This document describes the keyboard shortcuts system implemented for the ERP system, fulfilling Requirement 28.

## Requirements Fulfilled

- **28.1**: Forward slash (/) to focus global search
- **28.2**: Ctrl+K to open command palette with quick actions
- **28.3**: Arrow key navigation for lists
- **28.4**: Tab navigation for forms (native browser behavior)
- **28.5**: Question mark (?) to display keyboard shortcuts help modal

## Components

### 1. KeyboardShortcutsProvider

**Location**: `src/components/shared/keyboard-shortcuts-provider.tsx`

The main provider component that manages global keyboard shortcuts. It's integrated into the root layout and provides:
- Command palette (Ctrl+K)
- Keyboard shortcuts help modal (?)
- Global keyboard event handling

**Usage**: Already integrated in `src/app/layout.tsx`

### 2. CommandPalette

**Location**: `src/components/shared/command-palette.tsx`

A command palette that provides quick access to common actions and navigation:
- Navigate to different sections (Dashboard, Students, Teachers, etc.)
- Quick actions (Add Student, Mark Attendance, Generate Report, etc.)
- Searchable with keyboard navigation

**Keyboard Shortcut**: Ctrl+K (or Cmd+K on Mac)

### 3. KeyboardShortcutsHelp

**Location**: `src/components/shared/keyboard-shortcuts-help.tsx`

A help modal that displays all available keyboard shortcuts organized by category:
- Global shortcuts
- Navigation shortcuts
- Form shortcuts

**Keyboard Shortcut**: ? (question mark)

### 4. GlobalSearch

**Location**: `src/components/shared/global-search.tsx`

Already implemented component that provides global search functionality.

**Keyboard Shortcut**: / (forward slash)

### 5. useListNavigation Hook

**Location**: `src/components/shared/keyboard-shortcuts-provider.tsx`

A React hook that provides arrow key navigation for list components.

**Usage Example**:
```tsx
import { useListNavigation } from "@/components/shared/keyboard-shortcuts-provider";

function MyList() {
  const items = [...]; // Your list items
  
  const { selectedIndex, containerRef } = useListNavigation({
    itemCount: items.length,
    onSelect: (index) => {
      // Handle selection
      console.log("Selected item:", items[index]);
    },
  });

  return (
    <div ref={containerRef} tabIndex={0}>
      {items.map((item, index) => (
        <div
          key={index}
          className={selectedIndex === index ? 'bg-accent' : ''}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### 6. NavigableList Component

**Location**: `src/components/shared/navigable-list.tsx`

A pre-built component that wraps the useListNavigation hook for easy use.

**Usage Example**:
```tsx
import { NavigableList } from "@/components/shared/navigable-list";

function StudentsList() {
  const students = [...]; // Your students data
  
  return (
    <NavigableList
      items={students}
      renderItem={(student, index, isSelected) => (
        <div className={isSelected ? 'bg-accent' : ''}>
          {student.name}
        </div>
      )}
      onSelect={(student) => {
        router.push(`/students/${student.id}`);
      }}
    />
  );
}
```

## Available Keyboard Shortcuts

### Global Shortcuts
- **/** - Focus global search input
- **Ctrl+K** (Cmd+K on Mac) - Open command palette
- **?** - Show keyboard shortcuts help
- **Esc** - Close dialogs and modals

### Navigation
- **↑/↓** - Navigate through list items
- **Enter** - Select highlighted item
- **Tab** - Move to next form field
- **Shift+Tab** - Move to previous form field

### Forms
- **Ctrl+Enter** - Submit form (when implemented in specific forms)
- **Ctrl+S** - Save changes (when implemented in specific forms)

## Implementation Details

### How It Works

1. **Global Event Listener**: The `KeyboardShortcutsProvider` sets up a global keydown event listener that intercepts keyboard events.

2. **Input Field Detection**: The system intelligently detects when the user is typing in an input field and prevents shortcuts from triggering (except for specific cases like the search shortcut).

3. **Command Palette**: Uses the Radix UI Command component (cmdk) for a fast, accessible command palette experience.

4. **List Navigation**: The `useListNavigation` hook manages focus and selection state for list components, providing a smooth keyboard navigation experience.

5. **Accessibility**: All keyboard shortcuts are designed with accessibility in mind:
   - Proper ARIA labels
   - Focus management
   - Screen reader support
   - Visible focus indicators

### Browser Compatibility

The keyboard shortcuts system works across all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera

### Mobile Considerations

While keyboard shortcuts are primarily for desktop users, the system gracefully handles mobile devices:
- Touch events work normally
- No keyboard shortcuts interfere with mobile interactions
- Command palette can still be accessed via UI buttons if needed

## Extending the System

### Adding New Commands to the Command Palette

Edit `src/components/shared/command-palette.tsx` and add new commands to the `commands` array:

```tsx
{
  id: "action-my-action",
  label: "My Custom Action",
  icon: <MyIcon className="h-4 w-4" />,
  action: () => {
    // Your action logic
    router.push("/my-route");
    onOpenChange(false);
  },
  category: "Quick Actions",
  keywords: ["custom", "action", "my"],
}
```

### Adding New Global Shortcuts

Edit `src/components/shared/keyboard-shortcuts-provider.tsx` and add new keyboard event handlers:

```tsx
// In the handleKeyDown function
if (event.key === "n" && (event.ctrlKey || event.metaKey)) {
  event.preventDefault();
  // Your custom action
}
```

### Adding Shortcuts to the Help Modal

Edit `src/components/shared/keyboard-shortcuts-help.tsx` and add new shortcuts to the `shortcuts` array:

```tsx
{
  keys: ["Ctrl", "N"],
  description: "Create new item",
  category: "Quick Actions",
}
```

## Testing

To test the keyboard shortcuts:

1. **Global Search (/)**: 
   - Press `/` anywhere on the page
   - The search input should receive focus
   - Type to search across the system

2. **Command Palette (Ctrl+K)**:
   - Press `Ctrl+K` (or `Cmd+K` on Mac)
   - The command palette should open
   - Type to filter commands
   - Use arrow keys to navigate
   - Press Enter to execute a command

3. **Keyboard Shortcuts Help (?)**:
   - Press `?` anywhere on the page
   - The help modal should open showing all shortcuts
   - Press Esc to close

4. **List Navigation**:
   - Focus any list component that uses `useListNavigation`
   - Use arrow keys to navigate
   - Press Enter to select

5. **Form Navigation (Tab)**:
   - Focus any form
   - Press Tab to move to the next field
   - Press Shift+Tab to move to the previous field

## Performance Considerations

- Event listeners are properly cleaned up when components unmount
- Debouncing is used where appropriate (e.g., in search)
- The system has minimal performance impact on the application

## Accessibility

The keyboard shortcuts system is fully accessible:
- All shortcuts work with screen readers
- Focus is properly managed
- ARIA labels are provided
- Keyboard-only navigation is fully supported
- Visible focus indicators are present

## Future Enhancements

Potential improvements for the future:
1. User-customizable keyboard shortcuts
2. Keyboard shortcut cheat sheet overlay
3. Context-specific shortcuts (e.g., different shortcuts in different sections)
4. Keyboard shortcut recording/macro system
5. Integration with browser extensions

## Troubleshooting

### Shortcuts Not Working

1. Check if you're in an input field (most shortcuts are disabled in inputs)
2. Check browser console for JavaScript errors
3. Verify the KeyboardShortcutsProvider is properly mounted in the layout
4. Check if another extension or script is intercepting keyboard events

### Command Palette Not Opening

1. Verify the CommandDialog component is rendering
2. Check if there are any z-index conflicts
3. Ensure the Dialog component from Radix UI is properly installed

### List Navigation Not Working

1. Ensure the list container has `tabIndex={0}` to make it focusable
2. Verify the `useListNavigation` hook is properly configured
3. Check that the containerRef is attached to the correct element

## Related Files

- `src/app/layout.tsx` - Root layout with KeyboardShortcutsProvider
- `src/components/shared/global-search.tsx` - Global search component
- `src/hooks/use-keyboard-shortcuts.ts` - Keyboard shortcuts hook
- `src/components/ui/command.tsx` - Command UI component
- `src/components/ui/dialog.tsx` - Dialog UI component

## Requirements Validation

✅ **28.1**: Forward slash (/) focuses global search - Implemented in GlobalSearch component
✅ **28.2**: Ctrl+K opens command palette - Implemented in KeyboardShortcutsProvider
✅ **28.3**: Arrow keys navigate lists - Implemented via useListNavigation hook
✅ **28.4**: Tab navigates forms - Native browser behavior, not blocked
✅ **28.5**: Question mark (?) shows help modal - Implemented in KeyboardShortcutsProvider
