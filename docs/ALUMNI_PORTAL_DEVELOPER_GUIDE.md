# Alumni Portal - Developer Guide

## Quick Start

### Accessing the Alumni Portal
1. Log in with a student account that has an alumni profile
2. Navigate to `/alumni/dashboard`
3. Use the sidebar to navigate between sections

### Development Setup
```bash
# No additional setup required
# Alumni portal uses existing infrastructure
```

## File Structure

```
src/app/alumni/
├── layout.tsx              # Portal layout with navigation
├── page.tsx                # Root redirect to dashboard
├── dashboard/
│   └── page.tsx           # Main dashboard
├── profile/
│   └── page.tsx           # Profile editor
└── directory/
    └── page.tsx           # Alumni directory

src/components/alumni/
├── alumni-dashboard.tsx        # Dashboard component
├── alumni-profile-editor.tsx   # Profile editor component
├── alumni-directory-view.tsx   # Directory component
├── alumni-news.tsx            # News component
└── index.ts                   # Component exports

src/lib/actions/
└── alumniActions.ts           # Server actions for alumni

docs/
├── ALUMNI_PORTAL_ACCESS.md                    # User guide
├── ALUMNI_PORTAL_DEVELOPER_GUIDE.md          # This file
└── TASK_20_ALUMNI_PORTAL_PAGES_COMPLETION.md # Implementation summary
```

## Key Components

### Layout (`src/app/alumni/layout.tsx`)
- Provides navigation structure
- Handles authentication checks
- Verifies alumni profile existence
- Responsive sidebar/drawer navigation

**Props:** None (uses session data)

**Features:**
- Desktop sidebar navigation
- Mobile drawer navigation
- User profile display
- Sign out functionality

### Dashboard (`src/app/alumni/dashboard/page.tsx`)
- Main landing page for alumni
- Displays stats, news, and events
- Server-side data fetching

**Data Sources:**
- Alumni profile from database
- Statistics (total alumni, classmates)
- Placeholder news and events

**Components Used:**
- `AlumniDashboard` from `@/components/alumni`

### Profile (`src/app/alumni/profile/page.tsx`)
- Self-service profile editor
- Form validation with Zod
- Server actions for updates

**Data Sources:**
- Alumni profile from database
- Student information

**Components Used:**
- `AlumniProfileEditor` from `@/components/alumni`

**Server Actions:**
- `updateAlumniProfile` - Update profile data
- `handlePhotoUpload` - Upload profile photo (placeholder)

### Directory (`src/app/alumni/directory/page.tsx`)
- Browse other alumni
- Search and filter functionality
- Privacy-controlled viewing

**Data Sources:**
- All alumni with `allowCommunication: true`
- Privacy settings

**Components Used:**
- `AlumniDirectoryView` from `@/components/alumni`

## Authentication Flow

```typescript
// 1. Check authentication
const session = await auth();
if (!session?.user) {
  redirect("/login");
}

// 2. Check role
if (session.user.role !== UserRole.STUDENT) {
  redirect("/unauthorized");
}

// 3. Verify alumni profile (in layout)
const student = await db.student.findFirst({
  where: { user: { id: session.user.id } },
  include: { alumni: true },
});

if (!student || !student.alumni) {
  redirect("/student");
}
```

## Data Fetching Patterns

### Server-Side Fetching
```typescript
async function getData(userId: string) {
  const student = await db.student.findFirst({
    where: { user: { id: userId } },
    include: {
      user: true,
      alumni: true,
    },
  });
  
  return student;
}
```

### Using Suspense
```typescript
<Suspense fallback={<LoadingComponent />}>
  <DataComponent />
</Suspense>
```

## Server Actions

### Update Profile
```typescript
import { updateAlumniProfile } from "@/lib/actions/alumniActions";

const result = await updateAlumniProfile({
  alumniId: "...",
  currentOccupation: "Software Engineer",
  currentCity: "Mumbai",
  // ... other fields
});

if (result.success) {
  // Handle success
} else {
  // Handle error
}
```

## Privacy Controls

### Directory Visibility
```typescript
// Only show alumni who allow communication
const alumni = await db.alumni.findMany({
  where: {
    allowCommunication: true,
  },
});
```

### Profile Privacy Settings
```typescript
const profile = {
  // ... other fields
  showEmail: alumnus.allowCommunication,
  showPhone: false, // Default to private
  showAddress: false, // Default to private
  showOccupation: true, // Default to public
};
```

## Adding New Features

### 1. Add Navigation Item
Edit `src/app/alumni/layout.tsx`:
```typescript
const navigationItems = [
  // ... existing items
  {
    title: "New Feature",
    href: "/alumni/new-feature",
    icon: IconComponent,
    disabled: false,
  },
];
```

### 2. Create Page
Create `src/app/alumni/new-feature/page.tsx`:
```typescript
export default async function NewFeaturePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  if (session.user.role !== UserRole.STUDENT) {
    redirect("/unauthorized");
  }
  
  return (
    <div>
      {/* Your content */}
    </div>
  );
}
```

### 3. Create Component (if needed)
Create `src/components/alumni/new-feature.tsx`:
```typescript
"use client";

export function NewFeature() {
  return (
    <div>
      {/* Your component */}
    </div>
  );
}
```

### 4. Export Component
Update `src/components/alumni/index.ts`:
```typescript
export { NewFeature } from "./new-feature";
export type { NewFeatureProps } from "./new-feature";
```

## Common Tasks

### Fetch Alumni Data
```typescript
const alumni = await db.alumni.findMany({
  where: { /* filters */ },
  include: {
    student: {
      include: {
        user: true,
      },
    },
  },
});
```

### Update Alumni Profile
```typescript
await db.alumni.update({
  where: { id: alumniId },
  data: {
    currentOccupation: "...",
    updatedAt: new Date(),
    updatedBy: userId,
  },
});
```

### Get Statistics
```typescript
const totalAlumni = await db.alumni.count();

const classmates = await db.alumni.count({
  where: {
    finalClass: "Grade 12",
    graduationDate: {
      gte: new Date(2023, 0, 1),
      lt: new Date(2024, 0, 1),
    },
  },
});
```

## Styling Guidelines

### Use Tailwind Classes
```typescript
<div className="flex flex-col gap-6">
  <Card>
    <CardHeader>
      <CardTitle>Title</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
</div>
```

### Responsive Design
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Grid items */}
</div>
```

### Icons
```typescript
import { Icon } from "lucide-react";

<Icon className="h-5 w-5" />
```

## Error Handling

### Page Level
```typescript
if (!data) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold">Error Title</h2>
      <p className="text-muted-foreground">Error message</p>
    </div>
  );
}
```

### Component Level
```typescript
const [error, setError] = useState<string | null>(null);

if (error) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
```

## Testing

### Manual Testing Checklist
- [ ] Authentication works correctly
- [ ] Alumni profile verification works
- [ ] Dashboard displays correct data
- [ ] Profile editor saves changes
- [ ] Directory shows filtered results
- [ ] Navigation works on mobile
- [ ] Privacy controls are respected
- [ ] Loading states display properly
- [ ] Error messages are user-friendly

### Test User Setup
```sql
-- Create test alumni user
-- 1. Create user with STUDENT role
-- 2. Create student record
-- 3. Create alumni profile
-- 4. Set allowCommunication to true
```

## Troubleshooting

### Issue: Alumni profile not found
**Solution:** Verify the user has a student record with an associated alumni profile.

### Issue: Redirect loop
**Solution:** Check middleware configuration and ensure `/alumni` is in `studentRoutePatterns`.

### Issue: Profile updates not saving
**Solution:** Check server action permissions and database constraints.

### Issue: Directory shows no results
**Solution:** Verify alumni have `allowCommunication: true` in database.

## Performance Tips

1. **Use Server Components**: Fetch data on the server when possible
2. **Implement Pagination**: For large datasets in directory
3. **Add Caching**: Cache statistics and frequently accessed data
4. **Optimize Images**: Use Next.js Image component
5. **Lazy Load**: Use Suspense for heavy components

## Security Considerations

1. **Always check authentication**: Every page should verify session
2. **Validate input**: Use Zod schemas for all form inputs
3. **Respect privacy**: Check `allowCommunication` before showing data
4. **Use server actions**: Keep sensitive operations server-side
5. **Sanitize output**: React handles this automatically, but be careful with dangerouslySetInnerHTML

## Related Documentation

- [Alumni Portal Access Guide](./ALUMNI_PORTAL_ACCESS.md)
- [Task 20 Completion Summary](./TASK_20_ALUMNI_PORTAL_PAGES_COMPLETION.md)
- [Student Promotion and Alumni Management Design](../.kiro/specs/student-promotion-alumni/design.md)
- [Student Promotion and Alumni Management Requirements](../.kiro/specs/student-promotion-alumni/requirements.md)

## Support

For questions or issues:
1. Check this guide first
2. Review the completion summary
3. Check the design document
4. Ask the development team
