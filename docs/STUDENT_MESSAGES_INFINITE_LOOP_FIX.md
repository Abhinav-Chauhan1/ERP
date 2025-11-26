# Student Messages Infinite Loop Fix

## Issue
The student messages page was causing infinite database queries, repeatedly fetching messages every few seconds. The logs showed continuous POST requests to `/student/communication/messages` with the same Prisma queries executing in rapid succession.

## Root Cause
The infinite loop was caused by a React dependency issue in the message filtering logic:

1. **Parent Component (`page.tsx`)**: The `handleFilterChange` function was not memoized, so it was recreated on every render
2. **Child Component (`message-list.tsx`)**: The `useEffect` hook had `onFilterChange` in its dependency array
3. **The Loop**:
   - User interaction or filter change triggers `onFilterChange`
   - This calls `fetchMessages` which updates state
   - State update causes parent re-render
   - Re-render creates new `handleFilterChange` function reference
   - New reference triggers `useEffect` in child component
   - Loop repeats infinitely

## Solution

### 1. Memoized fetchMessages Function
**File**: `src/app/student/communication/messages/page.tsx`

The core issue was that `fetchMessages` was being recreated on every render, causing all callbacks that depend on it to also get new references:

```typescript
// Before
const fetchMessages = async (page: number = 1, newFilters: any = {}) => {
  // ... implementation
};

// After
const fetchMessages = React.useCallback(async (page: number = 1, newFilters: any = {}) => {
  // ... implementation
}, [activeTab]);
```

### 2. Memoized Callbacks with Proper Dependencies
**File**: `src/app/student/communication/messages/page.tsx`

All callbacks now properly include `fetchMessages` in their dependencies:

```typescript
// Before
const handleFilterChange = (newFilters: any) => {
  setFilters(newFilters);
  fetchMessages(1, newFilters);
};

// After
const handleFilterChange = React.useCallback((newFilters: any) => {
  setFilters(newFilters);
  fetchMessages(1, newFilters);
}, [fetchMessages]);
```

Also memoized:
- `handlePageChange` - with `fetchMessages` and `filters` dependencies
- `handleComposeSuccess` - with `fetchMessages`, `pagination.page` and `filters` dependencies

### 3. Fixed Dependency Array in Child Component
**File**: `src/components/student/communication/message-list.tsx`

Removed `onFilterChange` from the dependency array and added an eslint-disable comment:

```typescript
// Before
useEffect(() => {
  if (onFilterChange) {
    onFilterChange({
      search: debouncedSearchQuery,
      isRead: readFilter === "all" ? undefined : readFilter === "read",
    });
  }
}, [debouncedSearchQuery, readFilter, onFilterChange]);

// After
useEffect(() => {
  if (onFilterChange) {
    onFilterChange({
      search: debouncedSearchQuery,
      isRead: readFilter === "all" ? undefined : readFilter === "read",
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [debouncedSearchQuery, readFilter]);
```

## Why This Works

1. **Stable fetchMessages Reference**: By memoizing `fetchMessages` with `useCallback` and only `activeTab` as a dependency, the function maintains the same reference across renders unless the tab changes
2. **Stable Callback References**: All handler callbacks (`handleFilterChange`, `handlePageChange`, `handleComposeSuccess`) now properly depend on the memoized `fetchMessages`, so they also maintain stable references
3. **Controlled Dependencies**: The `useEffect` in the child component now only triggers when the actual filter values change (`debouncedSearchQuery`, `readFilter`), not when the callback function reference changes
4. **Debouncing Still Works**: The `useDebounce` hook continues to prevent excessive API calls from rapid user input
5. **Proper Dependency Chain**: The entire callback chain is now properly memoized, preventing the cascade of re-renders that caused the infinite loop

## Testing
After applying this fix:
- Navigate to `/student/communication/messages`
- Observe that queries only execute when:
  - Page first loads
  - User changes tabs (inbox/sent)
  - User types in search (debounced)
  - User changes read filter
  - User navigates pages
- No continuous/repeated queries should occur

## Related Files
- `src/app/student/communication/messages/page.tsx` - Main messages page
- `src/components/student/communication/message-list.tsx` - Message list component
- `src/lib/actions/student-communication-actions.ts` - Server actions
- `src/hooks/use-debounce.ts` - Debounce hook

## Prevention
To prevent similar issues in the future:

1. **Always memoize callbacks** passed as props to child components using `useCallback`
2. **Be cautious with function dependencies** in `useEffect` - they often cause infinite loops
3. **Use debouncing** for user input that triggers API calls
4. **Monitor network tab** during development to catch excessive requests early
5. **Consider using React Query** or SWR for data fetching to handle caching and deduplication automatically
