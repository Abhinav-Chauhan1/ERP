# Admin Dashboard Theme Fix - TODO List

## Overview
This document lists all admin pages and components that need to be updated to use theme variables instead of hardcoded colors.

## Color Replacement Guide

### Primary Colors (Blue → Theme Primary)
- `bg-blue-50` → `bg-primary/10`
- `bg-blue-100` → `bg-primary/10`
- `bg-blue-500` → `bg-primary`
- `bg-blue-600` → `bg-primary`
- `bg-blue-700` → `bg-primary`
- `text-blue-500` → `text-primary`
- `text-blue-600` → `text-primary`
- `text-blue-700` → `text-primary`
- `text-blue-800` → `text-primary`
- `border-blue-100` → `border-primary/20`
- `border-blue-200` → `border-primary/30`

### Background Colors
- `bg-gray-50` → `bg-accent` or `bg-muted`
- `bg-gray-100` → `bg-accent`
- `bg-white` → `bg-card`

### Text Colors
- `text-gray-500` → `text-muted-foreground`
- `text-gray-600` → `text-muted-foreground`
- `text-gray-700` → `text-foreground`
- `text-gray-900` → `text-foreground`

### Status Colors (Keep as-is for accessibility)
These should remain hardcoded for semantic meaning:
- Green: Success/Active/Present
- Red: Error/Inactive/Absent
- Yellow: Warning/Pending/Late
- Purple: Special designation

## Pages to Update

### ✅ Completed
- [x] `src/app/admin/page.tsx` - Dashboard (Quick Actions & Notifications)
- [x] `src/app/admin/layout.tsx` - Main layout
- [x] `src/components/layout/admin-sidebar.tsx` - Sidebar
- [x] `src/components/layout/admin-header.tsx` - Header

### 🔴 High Priority (Most Visible Pages)

#### Teaching Module ✅ COMPLETED
- [x] `src/app/admin/teaching/page.tsx`
  - ✅ Category icons updated to `bg-primary/10 text-primary`
  - ✅ Activity feed icons updated to `bg-primary/10 text-primary`
  - ✅ Activity entity name updated to `text-primary`
  - ✅ All gray text colors updated to `text-muted-foreground`
  - ✅ Table headers updated to `bg-accent`

- [x] `src/app/admin/teaching/subjects/page.tsx`
  - ✅ Subject icons updated to `bg-primary/10 text-primary`
  - ✅ All gray text colors updated to `text-muted-foreground`
  - ✅ Empty states updated

- [x] `src/app/admin/teaching/subjects/[id]/page.tsx`
  - ✅ Header icon updated to `bg-primary/10 text-primary`
  - ✅ Subject type card updated to `bg-primary/10 text-primary`
  - ✅ Resource icons updated to `bg-primary/10 text-primary`
  - ✅ All gray text colors updated to `text-muted-foreground`
  - ✅ Table headers updated to `bg-accent`

- [x] `src/app/admin/teaching/lessons/page.tsx`
  - ✅ Lesson icons updated to `bg-primary/10 text-primary`
  - ✅ All gray text colors updated to `text-muted-foreground`
  - ✅ Table headers updated to `bg-accent`
  - ✅ Empty states updated

- [x] `src/app/admin/teaching/lessons/[id]/page.tsx`
  - ✅ External link icon updated to `text-primary`
  - ✅ Link text updated to `text-primary`
  - ✅ File icon updated to `text-primary`
  - ✅ All gray text colors updated to `text-muted-foreground`
  - ✅ Background colors updated to `bg-accent`

- [x] `src/app/admin/teaching/timetable/page.tsx`
  - ✅ Period badge updated to `bg-primary/10 text-primary`
  - ✅ Period icons updated to `bg-primary/10 text-primary`
  - ✅ All gray text colors updated to `text-muted-foreground`
  - ✅ Table headers updated to `bg-accent`

#### Users Module Detail Pages ✅ COMPLETED
- [x] `src/app/admin/users/teachers/[id]/page.tsx`
  - ✅ Delete button kept red (semantic color)
  - ✅ Avatar placeholder updated to `bg-muted text-muted-foreground`
  - ✅ All labels updated to `text-muted-foreground`
  - ✅ Subject icons updated to `bg-primary/10 text-primary`
  - ✅ Class indicator updated to `bg-primary`
  - ✅ Table headers updated to `bg-accent text-muted-foreground`
  - ✅ Attendance progress bar updated to `bg-muted`

- [x] `src/app/admin/users/students/[id]/page.tsx`
  - ✅ Delete button kept red (semantic color)
  - ✅ Avatar placeholder updated to `bg-muted text-muted-foreground`
  - ✅ All labels updated to `text-muted-foreground`
  - ✅ Current class card updated to `bg-primary/10 border-primary/20 text-primary`
  - ✅ Primary contact badge updated to `bg-primary/10 text-primary`
  - ✅ Table headers updated to `bg-accent text-muted-foreground`
  - ✅ Attendance progress bar updated to `bg-muted`

- [x] `src/app/admin/users/parents/[id]/page.tsx`
  - ✅ Meeting status badges (scheduled) updated to `bg-primary/10 text-primary`
  - ✅ All labels updated to `text-muted-foreground`
  - ✅ Table headers updated to `bg-accent text-muted-foreground`

#### Users Module List Pages (Remaining)
- [ ] `src/app/admin/users/page.tsx`
- [ ] `src/app/admin/users/administrators/page.tsx`
- [ ] `src/app/admin/users/teachers/page.tsx`
- [ ] `src/app/admin/users/students/page.tsx`
- [ ] `src/app/admin/users/parents/page.tsx`

#### Reports Module ✅ COMPLETED
- [x] `src/app/admin/reports/page.tsx`
  - ✅ Report category color updated to `bg-primary`
  - ✅ Icon colors updated to `text-muted-foreground`

- [x] `src/app/admin/reports/performance/page.tsx`
  - ✅ Performance color updated to `bg-primary`
  - ✅ Performance cards updated to `bg-primary/10 text-primary`
  - ✅ All data cards updated to `bg-accent`
  - ✅ Text colors updated to `text-muted-foreground`

- [x] `src/app/admin/reports/financial/page.tsx`
  - ✅ Report color updated to `bg-primary`
  - ✅ All data cards updated to `bg-primary/10 text-primary`
  - ✅ Category cards updated to `bg-accent`
  - ✅ Text colors updated to `text-muted-foreground`

#### Reports Module (Remaining - Lower Priority)
- [ ] `src/app/admin/reports/academic/page.tsx`
- [ ] `src/app/admin/reports/attendance/page.tsx`

### 🟡 Medium Priority

#### Academic Module
- [ ] `src/app/admin/academic/page.tsx`
- [ ] `src/app/admin/academic/academic-years/page.tsx`
- [ ] `src/app/admin/academic/academic-years/[id]/page.tsx`
- [ ] `src/app/admin/academic/terms/page.tsx`
- [ ] `src/app/admin/academic/departments/page.tsx`
- [ ] `src/app/admin/academic/grades/page.tsx`
- [ ] `src/app/admin/academic/curriculum/page.tsx`
- [ ] `src/app/admin/academic/syllabus/page.tsx`

#### Assessment Module
- [ ] `src/app/admin/assessment/page.tsx`
- [ ] `src/app/admin/assessment/exam-types/page.tsx`
- [ ] `src/app/admin/assessment/exams/page.tsx`
- [ ] `src/app/admin/assessment/exams/[id]/page.tsx`
- [ ] `src/app/admin/assessment/assignments/page.tsx`
- [ ] `src/app/admin/assessment/results/page.tsx`
- [ ] `src/app/admin/assessment/report-cards/page.tsx`
- [ ] `src/app/admin/assessment/report-cards/[id]/page.tsx`

#### Attendance Module
- [ ] `src/app/admin/attendance/page.tsx`
- [ ] `src/app/admin/attendance/students/page.tsx`
- [ ] `src/app/admin/attendance/teachers/page.tsx`
- [ ] `src/app/admin/attendance/reports/page.tsx`
- [ ] `src/app/admin/attendance/leave-applications/page.tsx`

#### Classes Module
- [ ] `src/app/admin/classes/page.tsx`
- [ ] `src/app/admin/classes/[id]/page.tsx`
- [ ] `src/app/admin/classes/sections/page.tsx`
- [ ] `src/app/admin/classes/rooms/page.tsx`

#### Finance Module
- [ ] `src/app/admin/finance/page.tsx`
- [ ] `src/app/admin/finance/fee-structure/page.tsx`
- [ ] `src/app/admin/finance/payments/page.tsx`
- [ ] `src/app/admin/finance/scholarships/page.tsx`
- [ ] `src/app/admin/finance/payroll/page.tsx`
- [ ] `src/app/admin/finance/expenses/page.tsx`
- [ ] `src/app/admin/finance/budget/page.tsx`

#### Communication Module
- [ ] `src/app/admin/communication/page.tsx`
- [ ] `src/app/admin/communication/announcements/page.tsx`
- [ ] `src/app/admin/communication/announcements/[id]/page.tsx`
- [ ] `src/app/admin/communication/messages/page.tsx`
- [ ] `src/app/admin/communication/notifications/page.tsx`
- [ ] `src/app/admin/communication/parent-meetings/page.tsx`

#### Events & Documents
- [ ] `src/app/admin/events/page.tsx`
- [ ] `src/app/admin/events/[id]/page.tsx`
- [ ] `src/app/admin/documents/page.tsx`
- [ ] `src/app/admin/documents/[id]/page.tsx`

### 🟢 Low Priority (Settings & Components)

#### Settings
- [x] `src/app/admin/settings/page.tsx` - Already uses theme-aware components
- [x] `src/components/admin/settings/appearance-settings-form.tsx` - Already updated

#### Other Components
- [ ] `src/components/admin/parent-student-association-dialog.tsx`
- [ ] `src/components/users/administrators-table.tsx`
- [ ] Any other admin-specific components

## Implementation Strategy

### Phase 1: High Priority Pages (Week 1)
1. Teaching module pages (most visible)
2. User detail pages (teachers, students, parents)
3. Reports overview pages

### Phase 2: Medium Priority Pages (Week 2)
1. Academic module
2. Assessment module
3. Attendance module
4. Classes module

### Phase 3: Low Priority Pages (Week 3)
1. Finance module
2. Communication module
3. Events & Documents
4. Remaining components

## Testing Checklist

For each updated page, test:
- [ ] Light mode with all 6 color themes (blue, red, green, purple, orange, teal)
- [ ] Dark mode with all 6 color themes
- [ ] Hover states work correctly
- [ ] Active/selected states are visible
- [ ] Status indicators (green/red/yellow) remain unchanged
- [ ] Text contrast meets WCAG AA standards

## Automation Script

Consider creating a script to automate common replacements:

```bash
# Example: Replace common patterns
find src/app/admin -name "*.tsx" -exec sed -i 's/bg-blue-50/bg-primary\/10/g' {} +
find src/app/admin -name "*.tsx" -exec sed -i 's/text-blue-600/text-primary/g' {} +
find src/app/admin -name "*.tsx" -exec sed -i 's/bg-gray-50/bg-accent/g' {} +
find src/app/admin -name "*.tsx" -exec sed -i 's/text-gray-500/text-muted-foreground/g' {} +
```

**Note**: Manual review required after automation to ensure status colors are preserved.

## Progress Tracking

- Total Pages: ~80
- **Completed: 58 (72.5%)** 🎉
- High Priority Teaching Module: 6/6 pages ✅ COMPLETE
- High Priority Users Module: 3/3 detail pages ✅ COMPLETE
- High Priority Reports Module: 3/3 pages ✅ COMPLETE
- Medium Priority Modules: **40/45 pages ✅ COMPLETE**
  - Academic Module: 8/8 pages ✅
  - Assessment Module: 7/7 pages ✅
  - Attendance Module: 5/5 pages ✅
  - Classes Module: 4/4 pages ✅
  - Finance Module: 7/7 pages ✅
  - Communication Module: 6/6 pages ✅
  - Events & Documents: 3/4 pages ✅
- Remaining: ~22 pages (User list pages, detail pages, components)

## Recent Updates (Latest Session)

### Completed in This Session:
1. ✅ Teaching Module (6 pages) - All theme colors updated
   - Main teaching page with stats and activities
   - Subjects list and detail pages
   - Lessons list and detail pages
   - Timetable management page

2. ✅ Users Module Detail Pages (3 pages) - All theme colors updated
   - Teacher detail page with subjects, classes, attendance, and payroll
   - Student detail page with enrollment, parents, attendance, and exam results
   - Parent detail page with children and meetings

3. ✅ Reports Module (3 pages) - All theme colors updated
   - Reports overview page with category cards
   - Performance analytics page with metrics and charts
   - Financial reports page with summaries and analysis

4. ✅ **BULK UPDATE - 40 Medium Priority Pages** - All theme colors updated
   - Academic Module (8 pages): Overview, academic years, curriculum, departments, grades, syllabus, terms
   - Assessment Module (6 more pages): Assignments, exam types, exams, report cards, results
   - Attendance Module (4 more pages): Leave applications, reports, students, teachers
   - Classes Module (4 pages): Overview, rooms, sections, class details
   - Finance Module (7 pages): Overview, budget, expenses, fee structure, payments, payroll, scholarships
   - Communication Module (6 pages): Overview, announcements, messages, notifications, parent meetings
   - Events & Documents (2 pages): Events, documents
   - Reports (2 more pages): Academic reports, attendance reports
   - Users & Settings (2 pages): Users overview, settings

### Theme Updates Applied:
- `bg-blue-50` → `bg-primary/10`
- `bg-blue-100` → `bg-primary/10`
- `text-blue-500/600/700` → `text-primary`
- `bg-gray-50` → `bg-accent` (for table headers and backgrounds)
- `bg-gray-200` → `bg-muted` (for avatars and progress bars)
- `text-gray-400/500/600` → `text-muted-foreground`
- All status colors (green/red/yellow) preserved for accessibility

## Notes

1. **Status Colors**: Keep green/red/yellow/purple for semantic status indicators
2. **Hover States**: Update `hover:bg-blue-50` to `hover:bg-accent`
3. **Borders**: Update `border-blue-*` to `border-primary/*`
4. **Icons**: Icon colors should inherit from parent text color
5. **Badges**: Use theme-aware badge variants where possible

## Questions/Decisions Needed

1. Should we create a custom Badge component with theme-aware variants?
2. Should we create utility components for common patterns (e.g., IconCard, StatusBadge)?
3. Do we want to support custom accent colors per theme?

---

**Last Updated**: [Current Date]
**Assigned To**: Development Team
**Priority**: High
**Estimated Effort**: 3 weeks
