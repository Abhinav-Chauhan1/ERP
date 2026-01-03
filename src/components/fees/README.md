# Multi-Class Selector Component

## Overview

The `MultiClassSelector` component provides a user-friendly interface for selecting multiple classes from a list. It features search functionality, select all/deselect all options, and displays selected classes as removable badges.

## Features

- ✅ **Multi-select dropdown** with searchable interface
- ✅ **Select all / Deselect all** functionality
- ✅ **Badge display** for selected classes with remove buttons
- ✅ **Search/filter** capability to find classes quickly
- ✅ **Validation feedback** display for errors
- ✅ **Keyboard accessible** with proper ARIA labels
- ✅ **Disabled state** support
- ✅ **Responsive design** that works on all screen sizes

## Usage

### Basic Example

```tsx
import { MultiClassSelector } from "@/components/fees";

function MyComponent() {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  
  const classes = [
    { id: "1", name: "Grade 1" },
    { id: "2", name: "Grade 2" },
    { id: "3", name: "Grade 3" },
  ];

  return (
    <MultiClassSelector
      selectedClassIds={selectedClassIds}
      onChange={setSelectedClassIds}
      classes={classes}
    />
  );
}
```

### With Validation

```tsx
import { MultiClassSelector } from "@/components/fees";

function FeeStructureForm() {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const handleSubmit = () => {
    if (selectedClassIds.length === 0) {
      setError("At least one class must be selected");
      return;
    }
    // Process form...
  };

  return (
    <MultiClassSelector
      selectedClassIds={selectedClassIds}
      onChange={(ids) => {
        setSelectedClassIds(ids);
        if (ids.length > 0) setError("");
      }}
      classes={classes}
      error={error}
      placeholder="Select applicable classes..."
    />
  );
}
```

### With Server Data

```tsx
import { MultiClassSelector } from "@/components/fees";
import { getClassesForDropdown } from "@/lib/utils/cached-queries";

async function FeeStructureFormServer() {
  const classes = await getClassesForDropdown();

  return (
    <FeeStructureFormClient classes={classes} />
  );
}

function FeeStructureFormClient({ classes }) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  return (
    <MultiClassSelector
      selectedClassIds={selectedClassIds}
      onChange={setSelectedClassIds}
      classes={classes}
    />
  );
}
```

## Props

### `MultiClassSelectorProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `selectedClassIds` | `string[]` | Yes | - | Array of selected class IDs |
| `onChange` | `(classIds: string[]) => void` | Yes | - | Callback when selection changes |
| `classes` | `ClassOption[]` | Yes | - | Array of available classes |
| `academicYearId` | `string` | No | - | Filter classes by academic year (for future use) |
| `disabled` | `boolean` | No | `false` | Disable the selector |
| `error` | `string` | No | - | Error message to display |
| `placeholder` | `string` | No | `"Select classes..."` | Placeholder text |

### `ClassOption`

```typescript
interface ClassOption {
  id: string;
  name: string;
}
```

## Component Behavior

### Selection

- Click on a class to toggle its selection
- Use "Select All" to select all available classes
- Use "Deselect All" to clear all selections
- Click the X button on a badge to remove that class

### Search

- Type in the search box to filter classes by name
- Search is case-insensitive
- Filtered results update in real-time

### Validation

- Pass an `error` prop to display validation feedback
- Error message appears below the badges in red text
- Error styling is applied to the trigger button border

### Accessibility

- Proper ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Role attributes for semantic HTML

## Styling

The component uses Tailwind CSS and follows the application's design system:

- Uses `shadcn/ui` components (Button, Popover, Command, Badge, Checkbox)
- Supports light and dark themes
- Responsive design with proper spacing
- Consistent with other form components

## Requirements Validation

This component satisfies the following requirements:

- **Requirement 1.1**: Multi-select dropdown of available classes ✅
- **Requirement 1.3**: Display associated classes as badges ✅
- **Requirement 3.1**: Only allow selection of existing classes ✅
- **Requirement 3.2**: Validate at least one class is selected (via error prop) ✅
- **Requirement 3.3**: Display error messages ✅

## Testing

See `multi-class-selector-demo.tsx` for a working demo of the component.

To test the component:

1. Import the demo component
2. Render it in a page
3. Test all features:
   - Select/deselect individual classes
   - Use Select All / Deselect All
   - Search for classes
   - Remove classes via badges
   - Trigger validation

## Future Enhancements

- [ ] Support for grouping classes by academic year
- [ ] Virtualization for large class lists (100+ items)
- [ ] Drag-and-drop reordering of selected classes
- [ ] Bulk actions (e.g., select all from a specific year)
- [ ] Export/import selected classes


---

# Fee Type Class Amount Config Component

## Overview

The `FeeTypeClassAmountConfig` component provides an interface for configuring class-specific amounts for fee types. It allows administrators to set different fee amounts for different classes while maintaining a default amount that applies to classes without specific configurations.

## Features

- ✅ **Default amount display** (read-only reference)
- ✅ **Table view** for class-specific amounts
- ✅ **Add/remove rows** for class amounts
- ✅ **Class selector** dropdown for each row
- ✅ **Amount input** with validation
- ✅ **Automatic fallback** to default amount
- ✅ **Validation feedback** display
- ✅ **Disabled state** support
- ✅ **Helper text** for clarity

## Usage

### Basic Example

```tsx
import { FeeTypeClassAmountConfig } from "@/components/fees";

function FeeTypeForm() {
  const [classAmounts, setClassAmounts] = useState<ClassAmountInput[]>([]);
  const defaultAmount = 12000;
  
  const classes = [
    { id: "1", name: "Grade 1" },
    { id: "2", name: "Grade 2" },
    { id: "3", name: "Grade 3" },
  ];

  return (
    <FeeTypeClassAmountConfig
      defaultAmount={defaultAmount}
      classAmounts={classAmounts}
      onChange={setClassAmounts}
      classes={classes}
    />
  );
}
```

### With Pre-populated Data

```tsx
import { FeeTypeClassAmountConfig } from "@/components/fees";

function EditFeeTypeForm({ feeType }) {
  const [classAmounts, setClassAmounts] = useState<ClassAmountInput[]>(
    feeType.classAmounts || []
  );

  return (
    <FeeTypeClassAmountConfig
      feeTypeId={feeType.id}
      defaultAmount={feeType.amount}
      classAmounts={classAmounts}
      onChange={setClassAmounts}
      classes={classes}
    />
  );
}
```

### With Validation

```tsx
import { FeeTypeClassAmountConfig } from "@/components/fees";

function FeeTypeFormWithValidation() {
  const [classAmounts, setClassAmounts] = useState<ClassAmountInput[]>([]);
  const [error, setError] = useState<string>("");

  const handleChange = (amounts: ClassAmountInput[]) => {
    setClassAmounts(amounts);
    
    // Validate amounts
    const hasInvalidAmount = amounts.some(ca => ca.amount <= 0);
    if (hasInvalidAmount) {
      setError("All amounts must be greater than zero");
    } else {
      setError("");
    }
  };

  return (
    <FeeTypeClassAmountConfig
      defaultAmount={12000}
      classAmounts={classAmounts}
      onChange={handleChange}
      classes={classes}
      error={error}
    />
  );
}
```

## Props

### `FeeTypeClassAmountConfigProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `feeTypeId` | `string` | No | - | ID of the fee type being edited |
| `defaultAmount` | `number` | Yes | - | Default amount used when no class-specific amount is set |
| `classAmounts` | `ClassAmountInput[]` | Yes | - | Array of class-specific amounts |
| `onChange` | `(classAmounts: ClassAmountInput[]) => void` | Yes | - | Callback when class amounts change |
| `classes` | `ClassOption[]` | Yes | - | Array of available classes |
| `disabled` | `boolean` | No | `false` | Disable the component |
| `error` | `string` | No | - | Error message to display |

### `ClassAmountInput`

```typescript
interface ClassAmountInput {
  classId: string;
  amount: number;
}
```

### `ClassOption`

```typescript
interface ClassOption {
  id: string;
  name: string;
}
```

## Component Behavior

### Adding Class Amounts

- Click "Add Class Amount" button to add a new row
- Button is disabled when all classes have been assigned
- New rows default to the first available class and the default amount

### Removing Class Amounts

- Click the trash icon to remove a class amount row
- Removed classes become available again in the dropdown

### Updating Class Selection

- Each row has a dropdown to select the class
- Only unassigned classes appear in the dropdown (except the currently selected one)
- Prevents duplicate class assignments

### Updating Amounts

- Each row has a number input for the amount
- Supports decimal values (e.g., 12000.50)
- Minimum value is 0

### Default Amount Fallback

- The default amount is displayed at the top (read-only)
- Helper text explains that classes without specific amounts use the default
- Clear indication of which classes will use the default

## Styling

The component uses Tailwind CSS and follows the application's design system:

- Uses `shadcn/ui` components (Table, Input, Select, Button, Label)
- Supports light and dark themes
- Responsive table layout
- Consistent with other form components
- Currency formatting with ₹ symbol

## Requirements Validation

This component satisfies the following requirements:

- **Requirement 5.1**: Display section for class-specific amounts ✅
- **Requirement 5.2**: Show class selector and amount input ✅
- **Requirement 5.3**: Display multiple amounts in table format ✅
- **Requirement 5.4**: Support removing class-specific amounts ✅

## Testing

See `fee-type-class-amount-config-demo.tsx` for a working demo of the component.

To test the component:

1. Import the demo component
2. Render it in a page
3. Test all features:
   - Add class amount rows
   - Remove class amount rows
   - Change class selection
   - Update amounts
   - Verify default amount display
   - Test with all classes assigned

## Integration

This component is designed to be integrated into the Fee Type form:

```tsx
import { FeeTypeClassAmountConfig } from "@/components/fees";

function FeeTypeForm() {
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    classAmounts: [],
  });

  return (
    <form>
      <Input
        label="Fee Type Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      <Input
        label="Default Amount"
        type="number"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
      />
      
      <FeeTypeClassAmountConfig
        defaultAmount={formData.amount}
        classAmounts={formData.classAmounts}
        onChange={(classAmounts) => setFormData({ ...formData, classAmounts })}
        classes={classes}
      />
      
      <Button type="submit">Save Fee Type</Button>
    </form>
  );
}
```

## Future Enhancements

- [ ] Bulk import of class amounts from CSV
- [ ] Copy amounts from another fee type
- [ ] Percentage-based amounts (e.g., 10% more than default)
- [ ] Amount history/audit trail
- [ ] Visual comparison with default amount
