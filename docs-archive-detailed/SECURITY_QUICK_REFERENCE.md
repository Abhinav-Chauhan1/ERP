# Security Quick Reference Guide

Quick reference for implementing security measures in the Parent Dashboard.

## CSRF Protection

### In Forms (Client Component)
```tsx
import { CsrfInput } from "@/components/security/csrf-input";

export function MyForm({ csrfToken }: { csrfToken: string }) {
  return (
    <form action={myAction}>
      <CsrfInput token={csrfToken} />
      {/* other fields */}
    </form>
  );
}
```

### In Server Component (Generate Token)
```tsx
import { generateCsrfToken } from "@/lib/utils/csrf";

export default async function Page() {
  const csrfToken = await generateCsrfToken();
  return <MyForm csrfToken={csrfToken} />;
}
```

### In Server Actions (Verify Token)
```tsx
import { verifyCsrfToken } from "@/lib/utils/csrf";

export async function myAction(formData: FormData) {
  const token = formData.get("csrf_token") as string;
  if (!await verifyCsrfToken(token)) {
    return { success: false, message: "Invalid CSRF token" };
  }
  // Process...
}
```

### In API Routes (Verify Token)
```tsx
import { verifyCsrfToken } from "@/lib/utils/csrf";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!await verifyCsrfToken(body.csrf_token)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  // Process...
}
```

---

## Rate Limiting

### In API Routes
```tsx
import { rateLimitMiddleware, RateLimitPresets } from "@/lib/utils/rate-limit";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const limit = rateLimitMiddleware(userId, RateLimitPresets.PAYMENT);
  
  if (limit.exceeded) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: Math.ceil(limit.resetTime / 1000) },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.resetTime / 1000)) }}
    );
  }
  // Process...
}
```

### In Server Actions
```tsx
import { checkRateLimit, RateLimitPresets } from "@/lib/utils/rate-limit";

export async function myAction(input: MyInput) {
  const userId = await getUserId();
  
  if (!checkRateLimit(userId, RateLimitPresets.MESSAGE)) {
    return { success: false, message: "Too many requests" };
  }
  // Process...
}
```

### Available Presets
- `RateLimitPresets.PAYMENT` - 5 req/10s (strict)
- `RateLimitPresets.MESSAGE` - 10 req/min
- `RateLimitPresets.FILE_UPLOAD` - 5 req/min
- `RateLimitPresets.GENERAL` - 30 req/min
- `RateLimitPresets.AUTH` - 3 req/5min (very strict)

---

## Input Sanitization

### Text Input
```tsx
import { sanitizeText } from "@/lib/utils/input-sanitization";

const cleanText = sanitizeText(userInput); // Removes HTML, encodes special chars
```

### HTML Content (Allow Some HTML)
```tsx
import { sanitizeHtml } from "@/lib/utils/input-sanitization";

const cleanHtml = sanitizeHtml(userInput); // Removes dangerous tags/attributes
```

### Email
```tsx
import { sanitizeEmail } from "@/lib/utils/input-sanitization";

const cleanEmail = sanitizeEmail(userInput); // Validates and normalizes
```

### URL
```tsx
import { sanitizeUrl } from "@/lib/utils/input-sanitization";

const cleanUrl = sanitizeUrl(userInput); // Blocks dangerous protocols
```

### Alphanumeric with Special Chars
```tsx
import { sanitizeAlphanumeric } from "@/lib/utils/input-sanitization";

const cleanId = sanitizeAlphanumeric(userInput, "-_"); // Allow dash and underscore
```

### Comprehensive Sanitization
```tsx
import { sanitizeInput } from "@/lib/utils/input-sanitization";

const clean = sanitizeInput(userInput, {
  type: "text",      // or "email", "url", "phone", "alphanumeric", "numeric"
  maxLength: 100,    // optional
  allowHtml: false   // optional
});
```

---

## File Upload Security

### Basic Validation
```tsx
import { validateFileUpload } from "@/lib/utils/file-security";

const file = formData.get("file") as File;
const result = validateFileUpload(file, "avatar"); // or "attachment", "document"

if (!result.valid) {
  return { error: result.error };
}
```

### Secure Validation (with Signature Check)
```tsx
import { validateFileUploadSecure } from "@/lib/utils/file-security";

const file = formData.get("file") as File;
const result = await validateFileUploadSecure(file, "document");

if (!result.valid) {
  return { error: result.error };
}
```

### Sanitize Filename
```tsx
import { sanitizeFileName } from "@/lib/utils/file-security";

const safeName = sanitizeFileName(file.name);
```

### Generate Secure Filename
```tsx
import { generateSecureFileName } from "@/lib/utils/file-security";

const secureName = generateSecureFileName(file.name); // timestamp_random.ext
```

---

## Common Patterns

### Secure Form Submission
```tsx
// Server Component
import { generateCsrfToken } from "@/lib/utils/csrf";

export default async function Page() {
  const csrfToken = await generateCsrfToken();
  return <MyForm csrfToken={csrfToken} />;
}

// Client Component
import { CsrfInput } from "@/components/security/csrf-input";

export function MyForm({ csrfToken }: { csrfToken: string }) {
  return (
    <form action={submitForm}>
      <CsrfInput token={csrfToken} />
      <input name="message" />
      <button type="submit">Send</button>
    </form>
  );
}

// Server Action
import { verifyCsrfToken } from "@/lib/utils/csrf";
import { checkRateLimit, RateLimitPresets } from "@/lib/utils/rate-limit";
import { sanitizeText } from "@/lib/utils/input-sanitization";

export async function submitForm(formData: FormData) {
  // 1. Verify CSRF
  if (!await verifyCsrfToken(formData.get("csrf_token") as string)) {
    return { success: false, message: "Invalid CSRF token" };
  }
  
  // 2. Check rate limit
  const userId = await getUserId();
  if (!checkRateLimit(userId, RateLimitPresets.MESSAGE)) {
    return { success: false, message: "Too many requests" };
  }
  
  // 3. Sanitize input
  const message = sanitizeText(formData.get("message") as string);
  
  // 4. Process...
  await db.message.create({ data: { message } });
  
  return { success: true };
}
```

### Secure File Upload
```tsx
// API Route
import { verifyCsrfToken } from "@/lib/utils/csrf";
import { rateLimitMiddleware, RateLimitPresets } from "@/lib/utils/rate-limit";
import { validateFileUploadSecure, sanitizeFileName } from "@/lib/utils/file-security";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  
  // 1. Rate limit
  const limit = rateLimitMiddleware(userId, RateLimitPresets.FILE_UPLOAD);
  if (limit.exceeded) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }
  
  // 2. Parse form
  const formData = await req.formData();
  
  // 3. Verify CSRF
  if (!await verifyCsrfToken(formData.get("csrf_token") as string)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  
  // 4. Validate file
  const file = formData.get("file") as File;
  const validation = await validateFileUploadSecure(file, "document");
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  // 5. Sanitize filename
  const safeName = sanitizeFileName(file.name);
  
  // 6. Upload to storage...
  
  return NextResponse.json({ success: true, fileName: safeName });
}
```

---

## Security Checklist

Before deploying any new feature:

- [ ] CSRF tokens added to all forms
- [ ] Rate limiting applied to sensitive endpoints
- [ ] All user inputs sanitized
- [ ] File uploads validated and sanitized
- [ ] Authentication verified
- [ ] Authorization checked (parent-child relationship)
- [ ] Error messages don't leak sensitive info
- [ ] Logging added for security events

---

## Need Help?

See full documentation: `docs/SECURITY.md`
