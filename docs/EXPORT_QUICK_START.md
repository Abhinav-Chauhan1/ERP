# Data Export - Quick Start Guide

## 5-Minute Integration Guide

### Step 1: Import the Component

```tsx
import { SmartExportButton } from "@/components/shared/smart-export-button";
import { ExportField } from "@/components/shared/data-export-button";
```

### Step 2: Prepare Your Data

```tsx
// Flatten nested objects into a simple structure
const exportData = yourData.map(item => ({
  id: item.id,
  name: item.name,
  email: item.email,
  status: item.active ? "Active" : "Inactive",
}));
```

### Step 3: Define Fields (Optional)

```tsx
const exportFields: ExportField[] = [
  { key: "id", label: "ID", selected: true },
  { key: "name", label: "Name", selected: true },
  { key: "email", label: "Email", selected: true },
  { key: "status", label: "Status", selected: false },
];
```

### Step 4: Add the Button

```tsx
<SmartExportButton
  data={exportData}
  filename="my_data"
  title="My Data Export"
  fields={exportFields}
/>
```

## That's It! 🎉

Your list view now has:
- ✅ CSV, Excel, and PDF export
- ✅ Field selection dialog
- ✅ Automatic background processing for large datasets
- ✅ Progress tracking
- ✅ Descriptive filenames with timestamps

## Common Use Cases

### Students List
```tsx
<SmartExportButton
  data={students.map(s => ({
    admissionId: s.admissionId,
    name: `${s.user.firstName} ${s.user.lastName}`,
    class: s.enrollments[0]?.class.name || "N/A",
  }))}
  filename="students"
  title="Students List"
/>
```

### Attendance Report
```tsx
<SmartExportButton
  data={attendance.map(a => ({
    date: formatDate(a.date),
    student: a.student.user.firstName,
    status: a.status,
  }))}
  filename="attendance"
  title="Attendance Report"
/>
```

### Fee Payments
```tsx
<SmartExportButton
  data={payments.map(p => ({
    receipt: p.receiptNumber,
    student: p.student.user.firstName,
    amount: p.amount,
    date: formatDate(p.paymentDate),
  }))}
  filename="payments"
  title="Fee Payments"
/>
```

## Tips

1. **Always flatten nested objects** - Export works best with simple key-value pairs
2. **Use meaningful field labels** - They appear in the field selector
3. **Format dates and numbers** - Make data readable before exporting
4. **Handle null values** - Use `|| "N/A"` for missing data
5. **Keep field keys simple** - Use camelCase or snake_case

## Need More Control?

Use `DataExportButton` for custom export logic:

```tsx
<DataExportButton
  data={data}
  filename="custom"
  onExport={(format, fields) => {
    // Your custom export logic here
    console.log(`Exporting as ${format} with fields:`, fields);
  }}
/>
```

## Full Documentation

See `src/lib/utils/DATA_EXPORT_GUIDE.md` for complete documentation.
