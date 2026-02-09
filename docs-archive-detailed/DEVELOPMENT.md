# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git
- Code editor (VS Code recommended)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd sikshamitra-erp

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
sikshamitra-erp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   ├── admin/             # Admin dashboard
│   │   ├── teacher/           # Teacher portal
│   │   ├── student/           # Student portal
│   │   ├── parent/            # Parent portal
│   │   ├── super-admin/       # Super admin panel
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── admin/            # Admin components
│   │   ├── teacher/          # Teacher components
│   │   ├── student/          # Student components
│   │   └── parent/           # Parent components
│   ├── lib/                   # Core libraries
│   │   ├── actions/          # Server actions
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Custom middleware
│   │   ├── utils/            # Utility functions
│   │   └── db.ts             # Database client
│   ├── types/                 # TypeScript types
│   ├── hooks/                 # Custom React hooks
│   ├── context/               # React context
│   └── styles/                # Global styles
├── prisma/                    # Database
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Migration files
│   └── seed.ts               # Seed data
├── public/                    # Static files
├── docs/                      # Documentation
└── scripts/                   # Utility scripts
```

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
Follow the coding standards and patterns established in the project.

### 3. Test Changes
```bash
# Run tests
npm test

# Run specific test
npm test -- path/to/test.ts

# Run with UI
npm run test:ui
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
```

Commit message format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

## Code Patterns

### Server Actions

```typescript
// src/lib/actions/studentActions.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getStudents() {
  try {
    const students = await db.student.findMany({
      include: {
        user: true,
        enrollments: true,
      },
    });
    
    return { success: true, data: students };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { success: false, error: "Failed to fetch students" };
  }
}

export async function createStudent(data: StudentInput) {
  try {
    const student = await db.student.create({
      data: {
        ...data,
        user: {
          create: {
            email: data.email,
            name: data.name,
            role: "STUDENT",
          },
        },
      },
    });
    
    revalidatePath("/admin/students");
    return { success: true, data: student };
  } catch (error) {
    console.error("Error creating student:", error);
    return { success: false, error: "Failed to create student" };
  }
}
```

### API Routes

```typescript
// src/app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const students = await db.student.findMany();
    
    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### React Components

```typescript
// src/components/students/student-list.tsx
"use client";

import { useState, useEffect } from "react";
import { getStudents } from "@/lib/actions/studentActions";
import { toast } from "sonner";

export function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStudents();
  }, []);
  
  async function fetchStudents() {
    setLoading(true);
    try {
      const result = await getStudents();
      if (result.success) {
        setStudents(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {students.map((student) => (
        <div key={student.id}>{student.name}</div>
      ))}
    </div>
  );
}
```

### Form Validation

```typescript
// src/lib/validation/studentSchema.ts
import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone"),
  dateOfBirth: z.date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  admissionNumber: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
```

## Database Operations

### Adding New Model

1. Update `prisma/schema.prisma`:
```prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. Create migration:
```bash
npx prisma migrate dev --name add_new_model
```

3. Generate client:
```bash
npx prisma generate
```

### Querying Data

```typescript
// Simple query
const users = await db.user.findMany();

// With relations
const students = await db.student.findMany({
  include: {
    user: true,
    enrollments: {
      include: {
        class: true,
      },
    },
  },
});

// With filters
const activeStudents = await db.student.findMany({
  where: {
    user: {
      active: true,
    },
  },
});

// With pagination
const students = await db.student.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

## Testing

### Unit Tests

```typescript
// src/lib/utils/__tests__/helpers.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "../helpers";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2026-02-09");
    expect(formatDate(date)).toBe("Feb 9, 2026");
  });
});
```

### Integration Tests

```typescript
// src/lib/actions/__tests__/studentActions.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createStudent, getStudents } from "../studentActions";

describe("Student Actions", () => {
  beforeEach(async () => {
    // Setup test database
  });
  
  it("creates student successfully", async () => {
    const result = await createStudent({
      name: "Test Student",
      email: "test@example.com",
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("id");
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific file
npm test -- studentActions.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run with UI
npm run test:ui
```

## Debugging

### VS Code Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Database Debugging

```bash
# Open Prisma Studio
npx prisma studio

# View database
psql $DATABASE_URL

# Check migrations
npx prisma migrate status
```

### Logging

```typescript
// Use structured logging
console.log("[ACTION]", "Creating student", { data });
console.error("[ERROR]", "Failed to create student", { error });
```

## Performance Optimization

### Database Queries
- Use `select` to fetch only needed fields
- Add indexes for frequently queried fields
- Use `include` instead of multiple queries
- Implement pagination for large datasets

### React Components
- Use `React.memo` for expensive components
- Implement lazy loading with `React.lazy`
- Use `useCallback` and `useMemo` appropriately
- Avoid unnecessary re-renders

### Next.js Optimization
- Use Server Components by default
- Implement proper caching strategies
- Optimize images with `next/image`
- Use dynamic imports for large components

## Common Tasks

### Adding New Page

1. Create page file:
```typescript
// src/app/admin/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

2. Add to navigation:
```typescript
// Update navigation component
const navItems = [
  { href: "/admin/new-page", label: "New Page" },
];
```

### Adding New API Endpoint

1. Create route file:
```typescript
// src/app/api/new-endpoint/route.ts
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello" });
}
```

2. Add authentication if needed:
```typescript
const session = await auth();
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Adding New Component

1. Create component file:
```typescript
// src/components/ui/new-component.tsx
export function NewComponent({ prop }: Props) {
  return <div>{prop}</div>;
}
```

2. Export from index:
```typescript
// src/components/ui/index.ts
export { NewComponent } from "./new-component";
```

## Troubleshooting

### Build Errors
```bash
# Clear cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Database Issues
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Check connection
npx prisma db pull
```

### Type Errors
```bash
# Regenerate Prisma types
npx prisma generate

# Check TypeScript
npx tsc --noEmit
```

## Best Practices

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful variable names
- Add comments for complex logic

### Security
- Validate all inputs
- Sanitize user data
- Use parameterized queries
- Implement rate limiting
- Add CSRF protection

### Performance
- Optimize database queries
- Implement caching
- Use pagination
- Lazy load components
- Optimize images

### Testing
- Write tests for critical paths
- Test edge cases
- Mock external dependencies
- Maintain test coverage
- Run tests before commits

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Documentation](https://react.dev)

---

**Last Updated**: February 2026  
**Version**: 2.0.0
