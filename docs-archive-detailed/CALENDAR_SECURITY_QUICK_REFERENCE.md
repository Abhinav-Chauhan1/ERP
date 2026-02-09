# Calendar Security - Quick Reference

Quick reference guide for implementing security measures in calendar API endpoints.

## Import Security Utilities

```typescript
import {
  checkCalendarRateLimit,
  sanitizeEventData,
  sanitizeCategoryData,
  sanitizeNoteData,
  logEventCreation,
  logEventUpdate,
  logEventDeletion,
  logCalendarImport,
  logCalendarExport,
  validateCalendarAttachment,
  validateAttachmentUrl,
  createRateLimitError,
} from '@/lib/utils/calendar-security';
```

## Rate Limiting Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkCalendarRateLimit(request, 'EVENT_CREATE');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult.limit, rateLimitResult.reset),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // ... rest of endpoint logic

    // Include rate limit headers in successful response
    return NextResponse.json(
      { data },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    // ... error handling
  }
}
```

## Input Sanitization Pattern

```typescript
// Parse request body
const body = await request.json();

// Sanitize input data
const sanitizedData = sanitizeEventData(body);

// Use sanitized data
const eventData = {
  ...sanitizedData,
  startDate: new Date(body.startDate),
  endDate: new Date(body.endDate),
  createdBy: user.id
};
```

## Audit Logging Pattern

```typescript
// After creating a resource
await logEventCreation(user.id, event.id, eventData);

// After updating a resource
const existingEvent = await db.calendarEvent.findUnique({
  where: { id: params.id }
});
// ... perform update
await logEventUpdate(user.id, params.id, existingEvent, updatedEvent);

// After deleting a resource
const existingEvent = await db.calendarEvent.findUnique({
  where: { id: params.id }
});
// ... perform deletion
await logEventDeletion(user.id, params.id, existingEvent);
```

## File Upload Validation Pattern

```typescript
// Validate file
const file = formData.get('file') as File;

const validation = validateCalendarAttachment(file);
if (!validation.valid) {
  return NextResponse.json(
    { error: validation.error },
    { status: 400 }
  );
}

// Validate file size
const MAX_FILE_SIZE = 10 * 1024 * 1024;
if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
    { status: 400 }
  );
}
```

## CSRF Protection Pattern

```typescript
import { verifyCsrfToken } from '@/lib/utils/csrf';

// In API endpoint
const body = await request.json();

// Verify CSRF token (optional but recommended)
if (body.csrfToken) {
  const isValid = await verifyCsrfToken(body.csrfToken);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
}
```

## Rate Limit Types

| Type | Use Case | Limit |
|------|----------|-------|
| `EVENT_CREATE` | Creating/updating events, categories, notes | 100/hour |
| `EVENT_QUERY` | Fetching events, categories | 1000/hour |
| `IMPORT` | Importing calendar data | 10/hour |
| `EXPORT` | Exporting calendar data | 20/hour |

## Sanitization Functions

| Function | Use Case | What It Does |
|----------|----------|--------------|
| `sanitizeEventData()` | Calendar events | Sanitizes title, description, location, attachments |
| `sanitizeCategoryData()` | Event categories | Sanitizes name, description, color |
| `sanitizeNoteData()` | Event notes | Sanitizes note content |

## Audit Logging Functions

| Function | Use Case | Data Logged |
|----------|----------|-------------|
| `logEventCreation()` | Event created | title, categoryId, dates, isRecurring |
| `logEventUpdate()` | Event updated | before/after values |
| `logEventDeletion()` | Event deleted | title, categoryId, dates |
| `logCalendarImport()` | Data imported | format, recordCount, summary |
| `logCalendarExport()` | Data exported | format, filters |

## Complete Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import {
  checkCalendarRateLimit,
  sanitizeEventData,
  logEventCreation,
  createRateLimitError,
} from '@/lib/utils/calendar-security';

export async function POST(request: NextRequest) {
  try {
    // 1. Apply rate limiting
    const rateLimitResult = await checkCalendarRateLimit(request, 'EVENT_CREATE');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult.limit, rateLimitResult.reset),
        { status: 429 }
      );
    }

    // 2. Authenticate user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Parse and sanitize input
    const body = await request.json();
    const sanitizedData = sanitizeEventData(body);

    // 5. Process data
    const eventData = {
      ...sanitizedData,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      createdBy: user.id
    };

    // 6. Create resource
    const event = await createCalendarEvent(eventData);

    // 7. Log for audit trail
    await logEventCreation(user.id, event.id, eventData);

    // 8. Return response with rate limit headers
    return NextResponse.json(
      { event },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Security

### Test Rate Limiting

```bash
# Make multiple requests to trigger rate limit
for i in {1..150}; do
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/calendar/events
done
```

### Test Input Sanitization

```typescript
const maliciousInput = {
  title: '<script>alert("XSS")</script>',
  description: '<img src=x onerror="alert(1)">',
};

// Should be sanitized automatically
```

### Test File Upload Validation

```typescript
// Test file size
const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf');
// Should return 400 error

// Test file type
const execFile = new File(['content'], 'malware.exe');
// Should return 400 error
```

## Common Pitfalls

1. **Forgetting rate limit headers** - Always include rate limit headers in responses
2. **Not sanitizing nested objects** - Sanitize all user input, including nested fields
3. **Skipping audit logging** - Log all state-changing operations
4. **Not validating file uploads** - Always validate file size and type
5. **Missing error handling** - Handle all security-related errors gracefully

## Security Checklist

- [ ] Rate limiting applied
- [ ] Input sanitization implemented
- [ ] Audit logging added
- [ ] File uploads validated (if applicable)
- [ ] CSRF protection considered (for forms)
- [ ] Authorization checks in place
- [ ] Error messages don't leak sensitive info
- [ ] Rate limit headers included in responses
