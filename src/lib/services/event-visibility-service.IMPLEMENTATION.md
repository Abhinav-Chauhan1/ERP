# Event Visibility Service - Implementation Summary

## Task Completion

✅ **Task 3: Implement event visibility and filtering service**

All subtasks have been completed:
- ✅ Create EventVisibilityService for role-based filtering
- ✅ Implement class/section-based filtering logic
- ✅ Implement parent-child relationship filtering
- ✅ Create helper functions for visibility rule evaluation

## Requirements Coverage

### Requirement 1.2: Event Visibility Assignment
✅ **Implemented**: `isEventVisibleToUser()` function restricts event access to specified user roles
- Checks if user's role is in the event's `visibleToRoles` array
- Admin users can see all events
- Other roles must have their role included in the event's visibility settings

### Requirement 2.1: Teacher Event Display
✅ **Implemented**: `isEventVisibleToTeacher()` function displays all events visible to teachers
- Shows all school-wide events (no class/section restrictions)
- Shows events marked visible to teachers
- Applies class-based filtering for teachers

### Requirement 2.2: Teacher Exam Highlighting
✅ **Implemented**: Exam filtering in `isEventVisibleToTeacher()`
- Checks if teacher teaches the subject for exam events
- Uses `getTeacherSubjectIds()` to get teacher's subjects
- Compares with exam's subject ID

### Requirement 2.3: Teacher Assignment Display
✅ **Implemented**: Assignment filtering in `isEventVisibleToTeacher()`
- Checks if teacher created the assignment
- Compares assignment's `creatorId` with teacher's ID

### Requirement 3.1: Student Class/Section Events
✅ **Implemented**: `isEventVisibleToStudent()` function with class/section filtering
- Checks if student's class is in event's `visibleToClasses`
- Checks if student's section is in event's `visibleToSections`
- Uses `getStudentClassIds()` and `getStudentSectionIds()`

### Requirement 3.2: Student Exam Display
✅ **Implemented**: Exam filtering in `isEventVisibleToStudent()`
- Checks if student is enrolled in the exam's subject
- Uses `getStudentSubjectIds()` to get enrolled subjects
- Compares with exam's subject ID

### Requirement 3.3: Student Assignment Display
✅ **Implemented**: Assignment filtering in `isEventVisibleToStudent()`
- Checks if assignment is assigned to student's class
- Uses `getStudentClassIds()` to get student's classes
- Compares with assignment's assigned classes

### Requirement 4.1: Parent Children Events
✅ **Implemented**: `isEventVisibleToParent()` function displays events for all children
- Gets all children IDs using `getParentChildrenIds()`
- Checks visibility for each child
- Returns true if visible to any child

### Requirement 4.2: Parent Child Filter
✅ **Implemented**: `getEventsForParentChild()` function
- Allows filtering events for a specific child
- Verifies parent-child relationship
- Returns events visible to the specified child

### Requirement 4.3: Parent Meeting Highlighting
✅ **Implemented**: Meeting filtering in `isEventVisibleToParent()`
- Checks if parent is a participant in the meeting
- Compares meeting's `parentId` with parent's ID

### Requirement 4.4: Parent Children Exam Display
✅ **Implemented**: Exam filtering through child visibility
- Checks exam visibility for each child
- Uses student's subject enrollment
- Returns true if any child can see the exam

## Key Functions Implemented

### Core Functions

1. **`getEventsForUser(userId, options)`**
   - Main function for retrieving events with visibility filtering
   - Applies role-based and relationship-based filtering
   - Supports date range, category, and search filtering

2. **`isEventVisibleToUser(event, userContext)`**
   - Determines if a single event is visible to a user
   - Applies all visibility rules based on role
   - Handles source-based events (exams, assignments, meetings)

3. **`filterEventsByVisibility(events, userContext)`**
   - Filters an array of events based on visibility
   - Efficient batch processing of multiple events

4. **`getEventsForParentChild(parentId, studentId, options)`**
   - Gets events for a specific child of a parent
   - Verifies parent-child relationship
   - Implements Requirement 4.2

### Helper Functions

5. **`getUserContext(userId)`**
   - Gets user context including role-specific IDs
   - Returns UserContext with userId, role, teacherId, studentId, parentId

6. **`getStudentClassIds(studentId)`**
   - Gets class IDs for a student
   - Used for class-based filtering

7. **`getStudentSectionIds(studentId)`**
   - Gets section IDs for a student
   - Used for section-based filtering

8. **`getStudentSubjectIds(studentId)`**
   - Gets subject IDs a student is enrolled in
   - Used for exam filtering

9. **`getTeacherSubjectIds(teacherId)`**
   - Gets subject IDs a teacher teaches
   - Used for exam filtering

10. **`getTeacherClassIds(teacherId)`**
    - Gets class IDs a teacher teaches
    - Used for class-based filtering

11. **`getParentChildrenIds(parentId)`**
    - Gets student IDs for a parent's children
    - Used for parent visibility filtering

### Role-Specific Functions

12. **`isEventVisibleToTeacher(event, userContext)`**
    - Implements teacher-specific visibility rules
    - Checks class restrictions, exam subjects, assignment ownership, meeting participation

13. **`isEventVisibleToStudent(event, userContext)`**
    - Implements student-specific visibility rules
    - Checks class/section restrictions, exam subjects, assignment classes

14. **`isEventVisibleToParent(event, userContext)`**
    - Implements parent-specific visibility rules
    - Checks visibility through children, meeting participation

### Source-Based Functions

15. **`isSourceEventVisibleToUser(event, userContext)`**
    - Routes to appropriate source-specific function
    - Handles EXAM, ASSIGNMENT, MEETING source types

16. **`isExamEventVisible(examId, userContext)`**
    - Checks exam visibility based on subject enrollment/teaching

17. **`isAssignmentEventVisible(assignmentId, userContext)`**
    - Checks assignment visibility based on class assignment/creation

18. **`isMeetingEventVisible(meetingId, userContext)`**
    - Checks meeting visibility based on participation

### Debugging Function

19. **`evaluateVisibilityRules(eventId, userId)`**
    - Explains why an event is or isn't visible
    - Returns visibility status, reason, and applied rules
    - Useful for testing and debugging

## Data Structures

### UserContext
```typescript
interface UserContext {
  userId: string;
  role: UserRole;
  teacherId?: string;
  studentId?: string;
  parentId?: string;
}
```

### EventFilterOptions
```typescript
interface EventFilterOptions {
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  searchTerm?: string;
}
```

## Visibility Logic Flow

### Admin Users
```
Admin → Can see ALL events (no filtering)
```

### Teacher Users
```
Teacher → Check role visibility
        → Check class restrictions (if any)
        → Check source type:
          - EXAM: Check if teaches subject
          - ASSIGNMENT: Check if created assignment
          - MEETING: Check if participant
        → Return visibility result
```

### Student Users
```
Student → Check role visibility
        → Check class restrictions (if any)
        → Check section restrictions (if any)
        → Check source type:
          - EXAM: Check if enrolled in subject
          - ASSIGNMENT: Check if class is assigned
        → Return visibility result
```

### Parent Users
```
Parent → Check role visibility
       → Get all children
       → For each child:
         - Check if event visible to child
         - If yes, return true
       → Check source type:
         - MEETING: Check if participant
       → Return visibility result
```

## Testing

### Test Coverage
- ✅ 29 unit tests passing
- ✅ Role-based visibility (3 tests)
- ✅ Class and section filtering (3 tests)
- ✅ Source-based event filtering (3 tests)
- ✅ Teacher visibility rules (4 tests)
- ✅ Student visibility rules (4 tests)
- ✅ Parent visibility rules (4 tests)
- ✅ UserContext structure (4 tests)
- ✅ Event filter options (4 tests)

### Test File
`src/lib/services/__tests__/event-visibility-service.test.ts`

## Documentation

### README File
`src/lib/services/event-visibility-service.README.md`
- Comprehensive usage guide
- API documentation
- Examples for all use cases
- Performance considerations
- Error handling guidelines

## Integration Points

### With Calendar Service
The Event Visibility Service works alongside the Calendar Service:
- Calendar Service handles CRUD operations
- Visibility Service handles filtering and access control
- Both services use the same Prisma models

### With API Endpoints
The service will be used in API endpoints to:
- Filter events before returning to clients
- Verify access when viewing event details
- Apply role-based filtering in queries

### With UI Components
The service will be used in UI components to:
- Display only visible events in calendars
- Show/hide event details based on access
- Filter events by user role and relationships

## Performance Considerations

### Database Queries
- Multiple queries for relationship checks
- Consider caching user context and relationships
- Use database indexes for optimal performance

### Recommended Indexes
```sql
CREATE INDEX idx_class_enrollment_student ON ClassEnrollment(studentId, status);
CREATE INDEX idx_subject_teacher_teacher ON SubjectTeacher(teacherId);
CREATE INDEX idx_class_teacher_teacher ON ClassTeacher(teacherId);
CREATE INDEX idx_student_parent_parent ON StudentParent(parentId);
CREATE INDEX idx_assignment_class_assignment ON AssignmentClass(assignmentId);
```

### Optimization Opportunities
1. Cache user context for frequently accessed users
2. Batch visibility checks for multiple events
3. Use database views for complex relationship queries
4. Implement Redis caching for relationship data

## Security Considerations

### Access Control
- All visibility checks are server-side
- No client-side filtering (prevents data leaks)
- Role verification at every access point

### Data Privacy
- Event notes are private to creators
- Parent-child relationships are verified
- Meeting participants are validated

### Error Handling
- User not found errors
- Relationship verification failures
- Invalid event access attempts

## Future Enhancements

1. **Caching Layer**: Add Redis for user context and relationships
2. **Batch Operations**: Optimize for checking many events at once
3. **Custom Rules**: Allow schools to define custom visibility rules
4. **Analytics**: Track which events are viewed by which roles
5. **Permission Overrides**: Allow admins to grant special access

## Files Created

1. `src/lib/services/event-visibility-service.ts` (main service)
2. `src/lib/services/event-visibility-service.README.md` (documentation)
3. `src/lib/services/__tests__/event-visibility-service.test.ts` (tests)
4. `src/lib/services/event-visibility-service.IMPLEMENTATION.md` (this file)

## Conclusion

The Event Visibility Service has been successfully implemented with comprehensive coverage of all requirements. The service provides:

- ✅ Role-based filtering for all user types
- ✅ Class and section-based filtering
- ✅ Parent-child relationship filtering
- ✅ Source-based event filtering (exams, assignments, meetings)
- ✅ Helper functions for visibility evaluation
- ✅ Comprehensive test coverage
- ✅ Detailed documentation

The implementation is ready for integration with API endpoints and UI components.
