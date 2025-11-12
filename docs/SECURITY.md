# Security Implementation Guide

This document outlines the security measures implemented in the Parent Dashboard application.

## Overview

The application implements multiple layers of security to protect user data and prevent common web vulnerabilities:

1. **CSRF Protection** - Prevents Cross-Site Request Forgery attacks
2. **Rate Limiting** - Prevents abuse and DoS attacks
3. **Input Sanitization** - Prevents XSS and injection attacks
4. **File Upload Security** - Validates and sanitizes file uploads
5. **Authentication & Authorization** - Clerk-based authentication with role-based access control

## CSRF Protection

### Implementation

CSRF tokens are generated server-side and validated on sensitive operations.

**Location:** `src/lib/utils/csrf.ts`

### Usage

#### In Server Components

```typescript
import { generateCsrfToken } from "@/lib/utils/csrf";

export default async function MyPage() {
  const csrfToken = await generateCsrfToken();
  
  return <MyForm csrfToken={csrfToken} />;
}
```

#### In Client Components

```typescript
import { CsrfInput } from "@/components/security/csrf-input";

export function MyForm({ csrfToken }: { csrfToken: string }) {
  return (
    <form action={myAction}>
      <CsrfInput token={csrfToken} />
      {/* other form fields */}
    </form>
  );
}
```

#### In Server Actions

```typescript
import { verifyCsrfToken } from "@/lib/utils/csrf";

export async function myAction(formData: FormData) {
  const csrfToken = formData.get("csrf_token") as string;
  const isValid = await verifyCsrfToken(csrfToken);
  
  if (!isValid) {
    return { success: false, message: "Invalid CSRF token" };
  }
  
  // Process action
}
```

#### In API Routes

```typescript
import { verifyCsrfToken } from "@/lib/utils/csrf";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const csrfToken = body.csrf_token || req.headers.get('x-csrf-token');
  
  const isValid = await verifyCsrfToken(csrfToken);
  
  if (!isValid) {
    return NextResponse.json(
      { success: false, message: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  // Process request
}
```

## Rate Limiting

### Implementation

Rate limiting is implemented using an in-memory store with configurable windows and limits.

**Location:** `src/lib/utils/rate-limit.ts`

### Presets

- **PAYMENT**: 5 requests per 10 seconds
- **MESSAGE**: 10 requests per minute
- **FILE_UPLOAD**: 5 requests per minute
- **GENERAL**: 30 requests per minute
- **AUTH**: 3 requests per 5 minutes

### Usage

#### In API Routes

```typescript
import { rateLimitMiddleware, RateLimitPresets } from "@/lib/utils/rate-limit";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  
  const rateLimitResult = rateLimitMiddleware(userId, RateLimitPresets.PAYMENT);
  
  if (rateLimitResult.exceeded) {
    const resetInSeconds = Math.ceil(rateLimitResult.resetTime / 1000);
    return NextResponse.json(
      { 
        success: false, 
        message: `Too many requests. Try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds
      },
      { 
        status: 429,
        headers: {
          'Retry-After': resetInSeconds.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        }
      }
    );
  }
  
  // Process request
}
```

#### In Server Actions

```typescript
import { checkRateLimit, RateLimitPresets } from "@/lib/utils/rate-limit";

export async function myAction(input: MyInput) {
  const userId = await getUserId();
  
  const allowed = checkRateLimit(userId, RateLimitPresets.MESSAGE);
  
  if (!allowed) {
    return { 
      success: false, 
      message: "Too many requests. Please try again later." 
    };
  }
  
  // Process action
}
```

### Production Considerations

For production deployments with multiple servers, replace the in-memory store with Redis:

```typescript
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

## Input Sanitization

### Implementation

Comprehensive input sanitization functions to prevent XSS and injection attacks.

**Location:** `src/lib/utils/input-sanitization.ts`

### Available Functions

- `sanitizeHtml(input)` - Sanitizes HTML content, removes dangerous tags
- `sanitizeText(input)` - Removes all HTML tags and encodes special characters
- `sanitizeEmail(email)` - Validates and normalizes email addresses
- `sanitizeUrl(url)` - Validates URLs and removes dangerous protocols
- `sanitizePhoneNumber(phone)` - Sanitizes phone numbers
- `sanitizeAlphanumeric(input, allowedChars)` - Allows only alphanumeric + specified chars
- `sanitizeNumeric(input, allowDecimal)` - Allows only numbers
- `sanitizeInput(input, options)` - Comprehensive sanitization with options

### Usage Examples

#### Sanitizing User Messages

```typescript
import { sanitizeHtml, sanitizeText } from "@/lib/utils/input-sanitization";

// For message subject (plain text)
const sanitizedSubject = sanitizeText(userInput.subject);

// For message content (allow some HTML)
const sanitizedContent = sanitizeHtml(userInput.content);
```

#### Sanitizing Form Inputs

```typescript
import { sanitizeInput } from "@/lib/utils/input-sanitization";

// Email field
const email = sanitizeInput(userInput.email, { type: "email" });

// Phone field
const phone = sanitizeInput(userInput.phone, { type: "phone" });

// Text field with max length
const name = sanitizeInput(userInput.name, { 
  type: "text", 
  maxLength: 100 
});
```

#### Sanitizing Payment Data

```typescript
import { sanitizeAlphanumeric } from "@/lib/utils/input-sanitization";

// Transaction IDs should only contain alphanumeric, dash, and underscore
const transactionId = sanitizeAlphanumeric(input.transactionId, "-_");
```

## File Upload Security

### Implementation

File upload validation and sanitization to prevent malicious file uploads.

**Location:** `src/lib/utils/file-security.ts`

### Features

- File type validation (MIME type and extension)
- File size limits by category
- Dangerous extension blocking
- Filename sanitization
- File signature verification (magic numbers)

### Usage

#### Basic File Validation

```typescript
import { validateFileUpload } from "@/lib/utils/file-security";

const file = formData.get("file") as File;
const validation = validateFileUpload(file, "avatar");

if (!validation.valid) {
  return { success: false, message: validation.error };
}
```

#### Secure File Validation with Signature Check

```typescript
import { validateFileUploadSecure } from "@/lib/utils/file-security";

const file = formData.get("file") as File;
const validation = await validateFileUploadSecure(file, "document");

if (!validation.valid) {
  return { success: false, message: validation.error };
}
```

#### Sanitizing Filenames

```typescript
import { sanitizeFileName, generateSecureFileName } from "@/lib/utils/file-security";

// Sanitize user-provided filename
const safeFileName = sanitizeFileName(file.name);

// Or generate completely new secure filename
const secureFileName = generateSecureFileName(file.name);
```

### Allowed File Types

**Images:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**Documents:**
- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- PowerPoint (.ppt, .pptx)

**Text:**
- Plain text (.txt)
- CSV (.csv)

**Archives:**
- ZIP (.zip)
- RAR (.rar)

### File Size Limits

- **Avatar**: 5MB
- **Attachment**: 10MB
- **Document**: 20MB
- **General**: 10MB

## Authentication & Authorization

### Implementation

Authentication is handled by Clerk with role-based access control.

**Location:** `src/middleware.ts`

### Role-Based Access

- **ADMIN**: Access to all routes
- **TEACHER**: Access to teacher and shared routes
- **STUDENT**: Access to student and shared routes
- **PARENT**: Access to parent and shared routes

### Parent-Child Relationship Verification

All parent actions verify the parent-child relationship before allowing access:

```typescript
async function verifyParentChildRelationship(
  parentId: string,
  childId: string
): Promise<boolean> {
  const relationship = await db.studentParent.findFirst({
    where: { parentId, studentId: childId }
  });
  return !!relationship;
}
```

## Security Best Practices

### 1. Always Validate Input

- Use Zod schemas for input validation
- Sanitize all user inputs before processing
- Never trust client-side validation alone

### 2. Use CSRF Protection

- Include CSRF tokens in all forms that modify data
- Verify CSRF tokens in server actions and API routes
- Use HTTP-only cookies for token storage

### 3. Implement Rate Limiting

- Apply rate limiting to all sensitive endpoints
- Use stricter limits for authentication and payment operations
- Return appropriate HTTP 429 status codes

### 4. Sanitize File Uploads

- Validate file types and sizes
- Check file signatures (magic numbers)
- Sanitize filenames to prevent directory traversal
- Store files with secure random names

### 5. Prevent XSS Attacks

- Sanitize all user-generated content
- Use React's built-in XSS protection
- Avoid dangerouslySetInnerHTML unless absolutely necessary
- Encode output when displaying user content

### 6. Use HTTPS

- Always use HTTPS in production
- Set secure flag on cookies
- Use HSTS headers

### 7. Keep Dependencies Updated

- Regularly update npm packages
- Monitor security advisories
- Use `npm audit` to check for vulnerabilities

## Security Checklist

- [x] CSRF protection implemented
- [x] Rate limiting on payment endpoints
- [x] Rate limiting on message sending
- [x] Rate limiting on file uploads
- [x] Input sanitization for all user inputs
- [x] File upload validation
- [x] File signature verification
- [x] Filename sanitization
- [x] XSS prevention
- [x] SQL injection prevention (via Prisma)
- [x] Authentication via Clerk
- [x] Role-based access control
- [x] Parent-child relationship verification
- [ ] HTTPS enforcement (production)
- [ ] Security headers (production)
- [ ] Content Security Policy (production)
- [ ] Regular security audits

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com. Do not create public GitHub issues for security vulnerabilities.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Clerk Security Documentation](https://clerk.com/docs/security)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/security)
