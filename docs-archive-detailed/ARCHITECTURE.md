# System Architecture

## Overview

SikshaMitra ERP is built on a modern, scalable architecture using Next.js 15 with the App Router, providing server-side rendering, API routes, and server actions for optimal performance.

## Architecture Layers

### 1. Presentation Layer (Frontend)
- **Framework**: Next.js 15 with React 18
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and server state
- **Forms**: React Hook Form with Zod validation
- **Data Visualization**: Recharts for analytics

### 2. Application Layer (Backend)
- **API Routes**: RESTful endpoints in `/app/api`
- **Server Actions**: Type-safe server functions
- **Middleware**: Authentication, rate limiting, tenant resolution
- **Services**: Business logic layer
- **Actions**: Data access layer

### 3. Data Layer
- **Database**: PostgreSQL 14+
- **ORM**: Prisma for type-safe database access
- **Caching**: Redis for rate limiting and sessions
- **File Storage**: Cloudinary or R2 for media files

### 4. Integration Layer
- **Authentication**: NextAuth v5
- **Email**: Resend API
- **SMS**: MSG91 API
- **WhatsApp**: WhatsApp Business API
- **Payment**: Razorpay Gateway
- **Webhooks**: Svix for webhook management

## Multi-Tenant Architecture

### Tenant Identification
```
Request → Middleware → Extract Subdomain/Domain → Resolve Tenant → Set Context
```

### Database Strategy
**Database Per Tenant** (Recommended):
- Complete data isolation
- Independent backups and scaling
- Better security and compliance
- Separate connection pools

```typescript
// Dynamic Prisma client per tenant
const prisma = getPrismaClient(tenantId);
```

### Storage Strategy
**Separate Storage Per Tenant**:
- Isolated file storage (Cloudinary folders or separate accounts)
- Tenant-specific upload limits
- Independent CDN configuration

## Request Flow

### 1. User Request
```
User → Browser → Next.js Server
```

### 2. Middleware Processing
```
Request → Subdomain Detection → Tenant Resolution → Auth Check → Route Handler
```

### 3. Server Action Flow
```
Client Component → Server Action → Service Layer → Database → Response
```

### 4. API Route Flow
```
HTTP Request → Middleware → Auth → Rate Limit → Handler → Database → JSON Response
```

## Security Architecture

### Authentication Flow
```
Login → Credentials → NextAuth → Session Creation → JWT Token → Cookie
```

### Authorization Layers
1. **Route Protection**: Middleware checks authentication
2. **Role-Based Access**: User role verification
3. **Permission-Based**: Granular permission checks
4. **Resource-Level**: Owner/tenant verification

### Security Measures
- CSRF tokens on all mutations
- Rate limiting per endpoint and tenant
- Input sanitization and validation
- File upload security with signature verification
- SQL injection prevention via Prisma
- XSS prevention via React and sanitization
- Audit logging for all sensitive operations

## Data Flow Patterns

### Server-Side Rendering (SSR)
```typescript
// Page component fetches data server-side
export default async function Page() {
  const data = await getData();
  return <Component data={data} />;
}
```

### Server Actions
```typescript
// Type-safe server mutations
'use server';
export async function createStudent(data: StudentInput) {
  const prisma = await getTenantPrisma();
  return await prisma.student.create({ data });
}
```

### API Routes
```typescript
// RESTful endpoints
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Process and return response
}
```

## Database Architecture

### Schema Organization
- **Core Models**: User, School, AcademicYear
- **Academic**: Class, Subject, Syllabus, Lesson
- **Assessment**: Exam, Assignment, Result
- **Finance**: FeeStructure, Payment, Scholarship
- **Communication**: Message, Announcement, Notification
- **Auxiliary**: Library, Transport, Hostel

### Relationships
- One-to-Many: School → Users, Class → Students
- Many-to-Many: Student ↔ Subject, Teacher ↔ Class
- Self-Referential: User → Parent/Child relationships

### Indexing Strategy
- Primary keys on all tables
- Foreign key indexes
- Composite indexes for common queries
- Unique constraints on business keys

## Caching Strategy

### Application-Level Caching
- Next.js automatic caching for static pages
- React Server Components caching
- Revalidation strategies per route

### Database-Level Caching
- Prisma query result caching
- Connection pooling
- Prepared statement caching

### External Caching
- Redis for rate limiting
- CDN for static assets
- Browser caching headers

## Scalability Considerations

### Horizontal Scaling
- Stateless application servers
- Load balancer distribution
- Session storage in database/Redis

### Database Scaling
- Read replicas for reporting
- Connection pooling
- Query optimization
- Partitioning by tenant

### File Storage Scaling
- CDN for global distribution
- Lazy loading and optimization
- Separate storage per tenant

## Monitoring & Observability

### Application Monitoring
- Error tracking and logging
- Performance metrics
- User activity tracking
- API response times

### Database Monitoring
- Query performance
- Connection pool status
- Slow query logs
- Database size and growth

### Infrastructure Monitoring
- Server resource usage
- Network latency
- Storage capacity
- Backup status

## Deployment Architecture

### Production Setup
```
Users → CDN → Load Balancer → App Servers → Database
                                         → Redis
                                         → Storage
```

### Environment Separation
- **Development**: Local with test data
- **Staging**: Production-like for testing
- **Production**: Live system with real data

### CI/CD Pipeline
```
Code Push → Tests → Build → Deploy to Staging → Manual Approval → Deploy to Production
```

## Technology Decisions

### Why Next.js 15?
- Server-side rendering for SEO
- API routes for backend logic
- Server actions for type-safe mutations
- Automatic code splitting
- Built-in optimization

### Why PostgreSQL?
- ACID compliance
- Complex queries and joins
- JSON support for flexible data
- Mature ecosystem
- Excellent performance

### Why Prisma?
- Type-safe database access
- Automatic migrations
- Intuitive query API
- Great developer experience
- Multi-database support

### Why NextAuth v5?
- Built for Next.js
- Multiple auth providers
- Session management
- Type-safe
- Active development

## Performance Optimization

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization with Next.js Image
- Font optimization
- Minimal JavaScript bundles
- Progressive enhancement

### Backend Optimization
- Database query optimization
- N+1 query prevention
- Efficient data fetching
- Caching strategies
- Connection pooling

### Network Optimization
- CDN for static assets
- Compression (gzip/brotli)
- HTTP/2 support
- Efficient API design
- Pagination for large datasets

## Best Practices

### Code Organization
- Feature-based folder structure
- Separation of concerns
- Reusable components
- Type safety throughout
- Consistent naming conventions

### Database Access
- Use Prisma for all queries
- Implement proper error handling
- Use transactions for related operations
- Optimize queries with includes
- Add appropriate indexes

### Security
- Validate all inputs
- Sanitize user data
- Use parameterized queries
- Implement rate limiting
- Log security events

### Testing
- Unit tests for utilities
- Integration tests for APIs
- E2E tests for critical flows
- Property-based testing
- Regular security audits

---

**Last Updated**: February 2026  
**Version**: 2.0.0
