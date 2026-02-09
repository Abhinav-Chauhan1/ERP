# Enhanced Syllabus System Feature Flag

## Overview

The Enhanced Syllabus System introduces a new module-based structure for organizing curriculum content, replacing the legacy Units/Lessons hierarchy. A feature flag controls the gradual rollout of this new system.

## Feature Flag Configuration

### Environment Variable

```env
NEXT_PUBLIC_USE_ENHANCED_SYLLABUS=true
```

- **`true`**: Enables the new module-based syllabus system
- **`false`**: Uses the legacy units/lessons structure

### Default Behavior

- When enabled (`true`), the system uses the new Module → SubModule → Documents structure
- When disabled (`false`), the system falls back to the legacy Syllabus → Units → Lessons structure

## Affected Pages

### Admin Pages

#### 1. Admin Syllabus Management (`/admin/academic/syllabus`)
- **When enabled**: Shows a banner promoting the new module system with a link to `/admin/academic/syllabus/modules`
- **When disabled**: Standard legacy syllabus management interface
- **Behavior**: Both systems remain accessible; the banner simply promotes the new system

#### 2. Admin Module Management (`/admin/academic/syllabus/modules`)
- **Always available**: This page is always accessible regardless of the feature flag
- **Purpose**: Provides the new module-based interface for syllabus management

### Teacher Pages

#### Teacher Syllabus Page (`/teacher/teaching/syllabus`)
- **When enabled**: Displays module-based syllabus with progress tracking
- **When disabled**: Shows a message that the enhanced syllabus is not enabled
- **Behavior**: Teachers can only use the new system when the flag is enabled

### Student Pages

#### 1. Student Subject Detail (`/student/academics/subjects/[id]`)
- **When enabled**: Shows "View Full Syllabus" button if modules exist
- **When disabled**: Shows legacy syllabus structure with units/lessons
- **Behavior**: Automatically adapts based on available data structure

#### 2. Student Syllabus View (`/student/academics/subjects/[id]/syllabus`)
- **When enabled**: Displays full module-based syllabus view
- **When disabled**: Falls back to legacy structure
- **Behavior**: Renders appropriate view based on data availability

## Migration Strategy

### Phase 1: Parallel Systems (Current)
- Both legacy and new systems coexist
- Feature flag set to `true` by default
- Admins can use both interfaces
- Teachers and students see new system when modules exist

### Phase 2: Gradual Rollout
1. Enable feature flag in production
2. Migrate existing syllabus data using migration script
3. Train administrators on new module system
4. Monitor adoption and gather feedback

### Phase 3: Full Migration
1. Ensure all syllabi have been migrated to modules
2. Deprecate legacy unit/lesson interface
3. Remove feature flag and legacy code
4. Update documentation

## Data Structure Comparison

### Legacy Structure
```
Syllabus
  └── Units
        └── Lessons
```

### Enhanced Structure
```
Syllabus
  └── Modules (Chapters)
        ├── SubModules (Topics)
        │     └── Documents (Multiple)
        └── Documents (Multiple)
```

## Key Improvements

1. **Better Organization**: Chapter-based structure with explicit chapter numbers
2. **Multiple Documents**: Attach multiple files at both module and sub-module levels
3. **Rich Metadata**: Documents include titles, descriptions, file types, and sizes
4. **Progress Tracking**: Teachers can mark sub-modules as completed
5. **Drag-and-Drop**: Intuitive reordering of modules and sub-modules
6. **Bulk Operations**: Upload multiple documents at once

## Usage in Code

### Server Components
```typescript
import { useEnhancedSyllabus } from "@/lib/utils/feature-flags";

export default async function MyPage() {
  const enhancedEnabled = useEnhancedSyllabus();
  
  if (enhancedEnabled) {
    // Use new module system
  } else {
    // Use legacy system
  }
}
```

### Client Components
```typescript
"use client";
import { useEnhancedSyllabusClient } from "@/lib/utils/feature-flags";

export function MyComponent() {
  const enhancedEnabled = useEnhancedSyllabusClient();
  
  return enhancedEnabled ? <NewView /> : <LegacyView />;
}
```

## Testing

### Enable Enhanced Syllabus
```bash
# In .env file
NEXT_PUBLIC_USE_ENHANCED_SYLLABUS=true
```

### Disable Enhanced Syllabus
```bash
# In .env file
NEXT_PUBLIC_USE_ENHANCED_SYLLABUS=false
```

### Verify Behavior
1. Restart the development server after changing the flag
2. Check admin syllabus page for banner (when enabled)
3. Verify teacher syllabus page shows appropriate message
4. Test student views with both module and legacy data

## Troubleshooting

### Issue: Changes not reflecting
**Solution**: Restart the Next.js development server after changing environment variables

### Issue: Teacher page shows "not enabled" message
**Solution**: Verify `NEXT_PUBLIC_USE_ENHANCED_SYLLABUS=true` in `.env` file

### Issue: Students see legacy view despite flag being enabled
**Solution**: Ensure syllabus has been migrated to module structure using migration script

## Related Documentation

- [Enhanced Syllabus Schema](./ENHANCED_SYLLABUS_SCHEMA.md)
- [Migration Guide](../scripts/MIGRATION_GUIDE.md)
- [Module Management UI](./TASK_8_MODULE_MANAGEMENT_UI_SUMMARY.md)

## Support

For questions or issues related to the enhanced syllabus system:
1. Check the migration logs in `/logs` directory
2. Review the design document at `.kiro/specs/enhanced-syllabus-system/design.md`
3. Contact the development team
