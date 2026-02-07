# Subdomain Middleware Fix

## Problem
Prisma Client cannot run in Edge Runtime (Next.js middleware), which caused errors when trying to validate subdomains in middleware.

## Solution
We've implemented a two-layer approach:

### 1. Middleware Layer (Edge Runtime Compatible)
- **Location**: `src/lib/middleware/subdomain.ts`
- **Purpose**: Extract subdomain from hostname and pass it to the application via headers
- **What it does**:
  - Extracts subdomain from the request hostname
  - Adds `x-subdomain` and `x-hostname` headers to the request
  - Does NOT validate the subdomain against the database
  - Allows the request to continue to the application layer

### 2. Application Layer (Node.js Runtime)
- **Location**: `src/lib/utils/subdomain-helper.ts`
- **Purpose**: Validate subdomain and get school context using Prisma
- **What it does**:
  - Reads the `x-subdomain` header set by middleware
  - Queries the database to validate the subdomain
  - Returns school information or throws an error
  - Can be used in server components, layouts, and API routes

## Usage

### In Server Components/Layouts
```typescript
import { getSchoolFromSubdomain } from '@/lib/utils/subdomain-helper';

export default async function SubdomainLayout() {
  const school = await getSchoolFromSubdomain();
  
  if (!school) {
    return <div>School not found</div>;
  }

  return (
    <div>
      <h1>{school.name}</h1>
      {/* Your content */}
    </div>
  );
}
```

### In API Routes
```typescript
import { getSchoolFromSubdomain } from '@/lib/utils/subdomain-helper';

export async function GET(request: Request) {
  try {
    const school = await getSchoolFromSubdomain();
    
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Your API logic
    return NextResponse.json({ school });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid subdomain' },
      { status: 400 }
    );
  }
}
```

### Check if Request is on Subdomain
```typescript
import { isSubdomainRequest } from '@/lib/utils/subdomain-helper';

export default async function Page() {
  const isSubdomain = isSubdomainRequest();
  
  if (isSubdomain) {
    // Show subdomain-specific content
  } else {
    // Show main domain content
  }
}
```

## Benefits
1. ✅ **Edge Runtime Compatible**: Middleware doesn't use Prisma
2. ✅ **No Circular Dependencies**: No need to call API routes from middleware
3. ✅ **Better Performance**: Subdomain extraction is fast, validation happens only when needed
4. ✅ **Flexible**: Application layer can handle errors gracefully
5. ✅ **Type Safe**: Full TypeScript support with Prisma types

## Migration Notes
- Old approach: Middleware validated subdomain using Prisma (caused Edge Runtime error)
- New approach: Middleware extracts subdomain, application validates it
- No changes needed to existing subdomain logic, just use the helper functions

## Files Modified
- `src/lib/middleware/subdomain.ts` - Simplified to only extract subdomain
- `middleware.ts` - Updated to use simplified subdomain handling
- `src/lib/utils/subdomain-helper.ts` - New helper for application-layer validation
- `src/app/api/subdomain/validate/route.ts` - API route (can be used if needed)

## Testing
Test subdomain functionality by:
1. Starting the dev server: `npm run dev`
2. Accessing a subdomain URL (e.g., `school1.localhost:3000`)
3. Verifying that the school context is properly loaded
4. Checking that invalid subdomains show appropriate errors
