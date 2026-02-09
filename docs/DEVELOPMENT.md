# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Setup

```bash
# Clone and install
git clone <repository-url>
cd sikshamitra-erp
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Database setup
npx prisma generate
npx prisma migrate dev
npm run db:seed

# Start development
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── admin/       # Admin dashboard
│   ├── teacher/     # Teacher portal
│   ├── student/     # Student portal
│   ├── parent/      # Parent portal
│   └── api/         # API routes
├── components/       # React components
├── lib/             # Core libraries
│   ├── actions/     # Server actions
│   ├── services/    # Business logic
│   ├── middleware/  # Custom middleware
│   └── utils/       # Utilities
├── types/           # TypeScript types
└── styles/          # Global styles
```

## Code Patterns

### Server Actions

```typescript
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getStudents() {
  try {
    const students = await db.student.findMany({
      include: { user: true }
    });
    return { success: true, data: students };
  } catch (error) {
    return { success: false, error: "Failed to fetch students" };
  }
}
```

### API Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Your logic here
  return NextResponse.json({ success: true, data: [] });
}
```

### React Components

```typescript
"use client";

import { useState, useEffect } from "react";
import { getStudents } from "@/lib/actions/studentActions";

export function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStudents();
  }, []);
  
  async function fetchStudents() {
    const result = await getStudents();
    if (result.success) setStudents(result.data);
    setLoading(false);
  }
  
  if (loading) return <div>Loading...</div>;
  return <div>{/* Render students */}</div>;
}
```

## Database Operations

### Querying

```typescript
// Simple query
const users = await db.user.findMany();

// With relations
const students = await db.student.findMany({
  include: {
    user: true,
    enrollments: { include: { class: true } }
  }
});

// With filters
const activeStudents = await db.student.findMany({
  where: { user: { active: true } }
});

// With pagination
const students = await db.student.findMany({
  skip: (page - 1) * limit,
  take: limit
});
```

### Migrations

```bash
# Create migration
npx prisma migrate dev --name add_new_field

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

## Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- path/to/test.ts

# Run with UI
npm run test:ui

# Run with coverage
npm test -- --coverage
```

## Debugging

### VS Code Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### Database Debugging

```bash
# Open Prisma Studio
npx prisma studio

# Check migrations
npx prisma migrate status
```

## Best Practices

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful variable names
- Add comments for complex logic

### Security
- Validate all inputs
- Sanitize user data
- Use parameterized queries
- Implement rate limiting

### Performance
- Optimize database queries
- Implement caching
- Use pagination
- Lazy load components

---

**Last Updated**: February 2026  
**Version**: 2.0.0
