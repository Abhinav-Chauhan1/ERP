# Calendar Security Implementation

This document describes the security measures implemented for the Academic Calendar System.

## Overview

The calendar system implements comprehensive security measures to protect against common vulnerabilities and ensure data integrity. All security measures follow industry best practices and comply with OWASP security guidelines.

## Security Measures

### 1. Rate Limiting

Rate limiting prevents abuse and protects against denial-of-service attacks.

#### Implementation

- **Library**: `@upstash/ratelimit` with in-memory fallback
- **Location**: `src/lib/utils/calendar-security.ts`
- **Applied to**: All calendar API endpoints

#### Rate Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Event Creation | 100 requests | 1 hour |
| Event Queries | 1000 requests | 1 hour |
| Import Operations | 10 requests | 1 hour |
| Export Operations | 20 requests | 1 hour |

#### Response Headers

When rate limiting is applied, the following headers are included in responses:

- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining
- `X-RateLimit-Reset`: Timestamp when the rate limit resets
- `Retry-After`: Seconds to wait before retrying (only on 429 responses)

#### Example Response (Rate Limited)

```json
{
  "error": "Too many requests. Please try again later.",
  "rateLimit": {
    "limit": 100,
    "remaining": 0,
    "reset": 1703001600000,
    "retryAfter": 3600
  }
}
```

### 2. Input Sanitization

All user-provided content is sanitized to prevent XSS and injection attacks.

#### Implementation

- **Library**: Custom sanitization utilities
- **Location**: `src/lib/utils/input-sanitization.ts`, `src/lib/utils/calendar-security.ts`

#### Sanitized Fields

**Calendar Events:**
- `title`: Plain text sanitization (removes HTML tags, encodes special characters)
- `description`: HTML sanitization (removes dangerous tags, event handlers, javascript: protocol)
- `location`: Plain text sanitization
- `attachments`: URL sanitization (validates HTTPS, checks allowed domains)

**Event Categories:**
- `name`: Plain text sanitization
- `description`: Plain text sanitization
- `color`: Hex color validation and sanitization
- `icon`: Plain text sanitization

**Event Notes:**
- `content`: HTML sanitization (allows safe formatting, removes dangerous content)

#### Dangerous Content Removed

- `<script>` tags
- `<iframe>`, `<object>`, `<embed>` tags
- Event handlers (`onclick`, `onerror`, etc.)
- `javascript:` protocol
- `data:text/html` protocol
- Potentially dangerous tags (`<link>`, `<style>`, `<meta>`, etc.)

### 3. File Upload Validation

File uploads for calendar attachments are validated to prevent malicious file uploads.

#### Implementation

- **Location**: `src/lib/utils/calendar-security.ts`
- **Function**: `validateCalendarAttachment()`

#### Validation Rules

**File Size:**
- Maximum: 10MB
- Exceeding this limit results in a 400 error

**Allowed File Types:**
- PDF: `application/pdf`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

**Blocked Extensions:**
- Executable files: `.exe`, `.bat`, `.cmd`, `.sh`
- Scripts: `.php`, `.js`, `.html`

**URL Validation:**
- Only HTTPS URLs are allowed
- URLs must be from allowed domains (configurable)
- Default allowed domain: `res.cloudinary.com`

### 4. Audit Logging

All calendar modifications are logged for audit trails and compliance.

#### Implementation

- **Library**: Prisma with AuditLog model
- **Location**: `src/lib/utils/audit-log.ts`, `src/lib/utils/calendar-security.ts`

#### Logged Operations

| Operation | Resource | Data Logged |
|-----------|----------|-------------|
| Event Creation | `calendar_event` | title, categoryId, startDate, endDate, isRecurring |
| Event Update | `calendar_event` | before/after values for title, dates, categoryId |
| Event Deletion | `calendar_event` | title, categoryId, startDate, endDate |
| Category Creation | `calendar_category` | name, color |
| Note Creation | `calendar_event_note` | eventId |
| Import | `calendar_events` | format, recordCount, failed, duplicates |
| Export | `calendar_events` | format, filters applied |

#### Audit Log Fields

Each audit log entry includes:
- `userId`: User who performed the action
- `action`: Type of action (CREATE, UPDATE, DELETE, IMPORT, EXPORT)
- `resource`: Resource type affected
- `resourceId`: ID of the affected resource
- `changes`: JSON object with change details
- `ipAddress`: IP address of the request
- `userAgent`: User agent string
- `timestamp`: When the action occurred

#### Querying Audit Logs

```typescript
import { queryAuditLogs } from '@/lib/utils/audit-log';

const logs = await queryAuditLogs({
  userId: 'user_123',
  resource: 'calendar_event',
  action: 'UPDATE',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  limit: 50,
  offset: 0
});
```

### 5. CSRF Protection

CSRF tokens protect against cross-site request forgery attacks.

#### Implementation

- **Library**: Custom CSRF utilities with HTTP-only cookies
- **Location**: `src/lib/utils/csrf.ts`

#### Usage

**Server-side (generating token):**
```typescript
import { generateCsrfToken } from '@/lib/utils/csrf';

const token = await generateCsrfToken();
// Token is automatically stored in HTTP-only cookie
```

**Client-side (including token):**
```typescript
// Include token in form data or JSON body
const response = await fetch('/api/calendar/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ...eventData,
    csrfToken: token
  })
});
```

**Server-side (verifying token):**
```typescript
import { verifyCsrfToken } from '@/lib/utils/csrf';

const isValid = await verifyCsrfToken(body.csrfToken);
if (!isValid) {
  return NextResponse.json(
    { error: 'Invalid CSRF token' },
    { status: 403 }
  );
}
```

#### Token Properties

- **Storage**: HTTP-only cookie
- **Expiry**: 1 hour
- **SameSite**: Strict
- **Secure**: true (in production)
- **Length**: 32 bytes (64 hex characters)

## API Endpoints with Security

All calendar API endpoints implement the security measures described above:

### Event Endpoints

- `GET /api/calendar/events` - Rate limited (EVENT_QUERY)
- `POST /api/calendar/events` - Rate limited (EVENT_CREATE), input sanitized, audit logged
- `GET /api/calendar/events/:id` - Rate limited (EVENT_QUERY)
- `PUT /api/calendar/events/:id` - Rate limited (EVENT_CREATE), input sanitized, audit logged
- `DELETE /api/calendar/events/:id` - Rate limited (EVENT_CREATE), audit logged

### Category Endpoints

- `GET /api/calendar/categories` - Rate limited (EVENT_QUERY)
- `POST /api/calendar/categories` - Rate limited (EVENT_CREATE), input sanitized, audit logged
- `PUT /api/calendar/categories/:id` - Rate limited (EVENT_CREATE), input sanitized, audit logged
- `DELETE /api/calendar/categories/:id` - Rate limited (EVENT_CREATE), audit logged

### Note Endpoints

- `GET /api/calendar/events/:id/notes` - Rate limited (EVENT_QUERY)
- `POST /api/calendar/events/:id/notes` - Rate limited (EVENT_CREATE), input sanitized, audit logged
- `PUT /api/calendar/events/:id/notes/:noteId` - Rate limited (EVENT_CREATE), input sanitized, audit logged
- `DELETE /api/calendar/events/:id/notes/:noteId` - Rate limited (EVENT_CREATE), audit logged

### Import/Export Endpoints

- `POST /api/calendar/import` - Rate limited (IMPORT), file validated, audit logged
- `GET /api/calendar/export` - Rate limited (EXPORT), audit logged

## Security Best Practices

### For Developers

1. **Always sanitize user input** before storing or displaying
2. **Use rate limiting** for all API endpoints
3. **Log all modifications** for audit trails
4. **Validate file uploads** before processing
5. **Use CSRF tokens** for state-changing operations
6. **Follow principle of least privilege** for authorization

### For Administrators

1. **Monitor audit logs** regularly for suspicious activity
2. **Review rate limit violations** to identify potential attacks
3. **Keep allowed domains list** up to date for file uploads
4. **Rotate CSRF tokens** if compromise is suspected
5. **Implement IP whitelisting** for admin operations (already in place)

## Testing Security Measures

### Rate Limiting Test

```bash
# Test rate limiting by making multiple requests
for i in {1..150}; do
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/calendar/events
done
```

### Input Sanitization Test

```typescript
// Test XSS prevention
const maliciousInput = {
  title: '<script>alert("XSS")</script>',
  description: '<img src=x onerror="alert(1)">',
  location: 'javascript:alert(1)'
};

// Should be sanitized before storage
```

### File Upload Test

```typescript
// Test file size limit
const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf');
// Should be rejected with 400 error

// Test file type validation
const executableFile = new File(['content'], 'malware.exe');
// Should be rejected with 400 error
```

## Compliance

The implemented security measures help comply with:

- **OWASP Top 10**: Protection against injection, XSS, broken authentication
- **GDPR**: Audit logging for data access and modifications
- **SOC 2**: Security controls and audit trails
- **PCI DSS**: Input validation and secure data handling

## Future Enhancements

Potential security improvements for future releases:

1. **Content Security Policy (CSP)** headers for XSS prevention
2. **Rate limiting per user** in addition to per IP
3. **Anomaly detection** for unusual access patterns
4. **Two-factor authentication** for admin operations
5. **Encryption at rest** for sensitive event data
6. **Automated security scanning** in CI/CD pipeline

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
