# Alumni Directory Page

This directory contains the Alumni Directory page implementation for the Student Promotion and Alumni Management system.

## Files

### page.tsx
Main page component that handles:
- Authentication checks (requires logged-in user)
- Authorization checks (ADMIN and TEACHER roles only)
- Server-side rendering with Suspense
- Loading states

**Requirements:** 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 14.2

### alumni-directory-content.tsx
Client component that handles:
- Initial data fetching (alumni list and statistics)
- Search and filter integration with server actions
- Export functionality (CSV download)
- State management for directory interactions

**Features:**
- Fetches initial alumni data on mount
- Integrates with `searchAlumni` server action for filtering
- Integrates with `getAlumniStatistics` server action for statistics
- Exports alumni directory to CSV format
- Extracts unique values for filter dropdowns

### loading.tsx
Loading skeleton component displayed while the page is loading.

**Features:**
- Skeleton for header
- Skeleton for search card
- Skeleton for results grid (8 cards)
- Skeleton for pagination

## Usage

Navigate to `/admin/alumni` to access the alumni directory.

### Permissions

- **ADMIN**: Full access to view, search, filter, and export alumni
- **TEACHER**: Read-only access to view and search alumni
- **STUDENT/PARENT**: No access (redirected)

### Features

1. **Search**: Search alumni by name, admission ID, or other criteria
2. **Filters**: Filter by graduation year, class, city, occupation, college
3. **View Modes**: Toggle between card and table views
4. **Statistics**: View alumni statistics dashboard
5. **Export**: Export alumni directory to CSV
6. **Pagination**: Navigate through large alumni lists
7. **Profile Navigation**: Click on alumni to view detailed profile

## Data Flow

```
Page Load
  ↓
Authentication Check (auth())
  ↓
Authorization Check (ADMIN/TEACHER)
  ↓
Render AlumniDirectoryContent (Client Component)
  ↓
Fetch Initial Data
  ├─ searchAlumni() - Get alumni list
  └─ getAlumniStatistics() - Get statistics
  ↓
Render AlumniDirectory Component
  ↓
User Interactions
  ├─ Search → searchAlumni()
  ├─ Filter → searchAlumni()
  ├─ Paginate → searchAlumni()
  ├─ Export → Generate CSV
  └─ Click Alumni → Navigate to /admin/alumni/[id]
```

## Server Actions Used

- `searchAlumni()` - Search and filter alumni with pagination
- `getAlumniStatistics()` - Get alumni statistics for dashboard

## Components Used

- `AlumniDirectory` - Main directory component
- `AlumniSearchBar` - Search input
- `AlumniFilters` - Filter panel
- `AlumniCard` - Card view for alumni
- `AlumniTable` - Table view for alumni
- `AlumniStats` - Statistics dashboard

## Error Handling

- Authentication errors → Redirect to login
- Authorization errors → Redirect to unauthorized page
- Data fetch errors → Toast notification
- Export errors → Toast notification

## Performance Considerations

- Server-side rendering for initial load
- Client-side data fetching for interactions
- Pagination to limit data transfer
- Debounced search (handled in AlumniSearchBar)
- Suspense boundaries for loading states

## Future Enhancements

- Advanced search with multiple criteria
- Saved filter presets
- Bulk operations on alumni
- Alumni engagement tracking
- Integration with communication system
- Alumni event management
