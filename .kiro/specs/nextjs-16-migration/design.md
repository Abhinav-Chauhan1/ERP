# Design Document: Next.js 16 Migration

## Overview

This document outlines the technical design for migrating the SikshaMitra ERP application from Next.js 15.1.11 to Next.js 16.1.1, including the React 19 upgrade. The migration addresses multiple breaking changes while ensuring all existing functionality remains intact. The design follows a phased approach to minimize risk and enable incremental validation.

## Architecture

### Migration Phases

The migration is structured into five sequential phases:

1. **Preparation Phase**: Backup, branch creation, and dependency analysis
2. **Dependency Update Phase**: Package upgrades and compatibility verification
3. **Code Migration Phase**: Automated and manual code transformations
4. **Testing Phase**: Comprehensive testing of all functionality
5. **Deployment Phase**: Staged rollout with monitoring

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Server     │  │   Client     │  │     API      │      │
│  │  Components  │  │  Components  │  │    Routes    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Framework Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │   React 19   │  │   Turbopack  │      │
│  │    16.1.1    │  │     19.2+    │  │   (Bundler)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Proxy     │  │  Auth (v5)   │  │   Database   │      │
│  │  (Middleware)│  │  next-auth   │  │   Prisma     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Dependency Management Component

**Responsibility**: Manage package versions and compatibility

**Interface**:
```typescript
interface DependencyManager {
  updatePackageJson(): Promise<void>;
  verifyPeerDependencies(): Promise<ValidationResult>;
  installDependencies(): Promise<InstallResult>;
}

interface ValidationResult {
  success: boolean;
  conflicts: PeerDependencyConflict[];
}

interface InstallResult {
  success: boolean;
  exitCode: number;
  errors: string[];
}
```

**Key Operations**:
- Update package.json with new versions
- Verify no peer dependency conflicts
- Execute npm install
- Validate installation success

### 2. Async API Migration Component

**Responsibility**: Transform synchronous Dynamic API usage to async patterns

**Interface**:
```typescript
interface AsyncAPIMigrator {
  migrateServerComponents(): Promise<MigrationResult>;
  migrateClientComponents(): Promise<MigrationResult>;
  migrateCookiesUsage(): Promise<MigrationResult>;
  migrateHeadersUsage(): Promise<MigrationResult>;
}

interface MigrationResult {
  filesModified: string[];
  success: boolean;
  errors: MigrationError[];
}

interface MigrationError {
  file: string;
  line: number;
  message: string;
}
```

**Transformation Patterns**:

**Server Components**:
```typescript
// Before
export default function Page({ params, searchParams }) {
  const id = params.id;
}

// After
export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
}
```

**Client Components**:
```typescript
// Before
"use client";
export default function Page({ params }) {
  const id = params.id;
}

// After
"use client";
import { use } from "react";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
}
```

**Dynamic APIs**:
```typescript
// Before
import { cookies } from "next/headers";
const cookieStore = cookies();

// After
import { cookies } from "next/headers";
const cookieStore = await cookies();
```

### 3. Middleware Migration Component

**Responsibility**: Rename and adapt middleware to proxy convention

**Interface**:
```typescript
interface MiddlewareMigrator {
  renameFile(): Promise<void>;
  updateExports(): Promise<void>;
  validateProxyFunction(): Promise<ValidationResult>;
}
```

**Transformation**:
```typescript
// Before (src/middleware.ts)
export default auth(async (req) => {
  // middleware logic
}) as any;

export const config = { matcher: [...] };

// After (src/proxy.ts)
export function proxy(req) {
  return auth(async (req) => {
    // middleware logic
  })(req);
}

export const config = { matcher: [...] };
```

### 4. Configuration Migration Component

**Responsibility**: Update Next.js and ESLint configurations

**Interface**:
```typescript
interface ConfigMigrator {
  migrateNextConfig(): Promise<void>;
  migrateImageConfig(): Promise<void>;
  migrateESLintConfig(): Promise<void>;
}
```

**Next.js Config Transformation**:
```javascript
// Before
module.exports = {
  images: {
    domains: ["res.cloudinary.com", "img.clerk.com"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

// After
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
    minimumCacheTTL: 14400,
  },
  serverActions: {
    bodySizeLimit: '2mb',
  },
}
```

**ESLint Config Transformation**:
```javascript
// Before (.eslintrc.json)
{
  "extends": "next/core-web-vitals"
}

// After (eslint.config.js)
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
```

### 5. Type Generation Component

**Responsibility**: Generate type-safe helpers for async APIs

**Interface**:
```typescript
interface TypeGenerator {
  generateRouteTypes(): Promise<void>;
  validateGeneratedTypes(): Promise<ValidationResult>;
}
```

**Generated Types Example**:
```typescript
// .next/types/app/admin/users/students/[id]/page.ts
export type PageParams = Promise<{ id: string }>;
export type PageSearchParams = Promise<{ tab?: string }>;
```

### 6. Testing Component

**Responsibility**: Validate migration success through automated tests

**Interface**:
```typescript
interface MigrationTester {
  testBuildProcess(): Promise<TestResult>;
  testRuntimeBehavior(): Promise<TestResult>;
  testPerformance(): Promise<PerformanceResult>;
}

interface TestResult {
  passed: boolean;
  failures: TestFailure[];
}

interface PerformanceResult {
  buildTime: number;
  startupTime: number;
  pageLoadTime: number;
  meetsThresholds: boolean;
}
```

## Data Models

### Migration State

```typescript
interface MigrationState {
  phase: MigrationPhase;
  startTime: Date;
  completedSteps: MigrationStep[];
  currentStep: MigrationStep | null;
  errors: MigrationError[];
  rollbackAvailable: boolean;
}

enum MigrationPhase {
  PREPARATION = 'preparation',
  DEPENDENCY_UPDATE = 'dependency_update',
  CODE_MIGRATION = 'code_migration',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

interface MigrationStep {
  id: string;
  name: string;
  status: StepStatus;
  startTime: Date;
  endTime?: Date;
  result?: StepResult;
}

enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}
```

### File Modification Tracking

```typescript
interface FileModification {
  path: string;
  modificationType: ModificationType;
  originalContent?: string;
  newContent: string;
  automated: boolean;
  verified: boolean;
}

enum ModificationType {
  CREATED = 'created',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  RENAMED = 'renamed',
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dependency Version Consistency

*For any* package.json file after migration, React version SHALL be >= 19.2, React DOM version SHALL be >= 19.2, and Next.js version SHALL be 16.1.1

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Server Component Async Params

*For any* server component file that receives params, the params parameter SHALL be typed as Promise and SHALL be awaited before property access

**Validates: Requirements 2.1, 2.7**

### Property 3: Server Component Async SearchParams

*For any* server component file that receives searchParams, the searchParams parameter SHALL be typed as Promise and SHALL be awaited before property access

**Validates: Requirements 2.2, 2.8**

### Property 4: Client Component Params Unwrapping

*For any* client component file that receives params, the params parameter SHALL be unwrapped using React.use() before property access

**Validates: Requirements 2.3**

### Property 5: Client Component SearchParams Unwrapping

*For any* client component file that receives searchParams, the searchParams parameter SHALL be unwrapped using React.use() before property access

**Validates: Requirements 2.4**

### Property 6: Cookies API Async Usage

*For any* file that imports cookies from next/headers, all calls to cookies() SHALL be awaited before accessing cookie methods

**Validates: Requirements 2.5**

### Property 7: Headers API Async Usage

*For any* file that imports headers from next/headers, all calls to headers() SHALL be awaited before accessing header methods

**Validates: Requirements 2.6**

### Property 8: TypeScript Compilation Success

*For any* TypeScript file in the project, the TypeScript compiler SHALL compile without type errors related to async params or searchParams

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 9: Performance Threshold Compliance

*For any* build or runtime measurement, the performance metrics SHALL be within acceptable thresholds: build time within 120% of baseline, dev startup within 120% of baseline, page load within 110% of baseline

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**

## Error Handling

### Error Categories

1. **Dependency Errors**
   - Peer dependency conflicts
   - Installation failures
   - Version incompatibilities

2. **Migration Errors**
   - Syntax errors from transformations
   - Type errors from async API changes
   - Runtime errors from breaking changes

3. **Build Errors**
   - Compilation failures
   - Bundling errors
   - Configuration errors

4. **Runtime Errors**
   - Authentication failures
   - Form submission errors
   - Component rendering errors

### Error Handling Strategy

```typescript
interface ErrorHandler {
  handleDependencyError(error: DependencyError): RecoveryAction;
  handleMigrationError(error: MigrationError): RecoveryAction;
  handleBuildError(error: BuildError): RecoveryAction;
  handleRuntimeError(error: RuntimeError): RecoveryAction;
}

enum RecoveryAction {
  RETRY = 'retry',
  SKIP = 'skip',
  ROLLBACK = 'rollback',
  MANUAL_INTERVENTION = 'manual_intervention',
  ABORT = 'abort',
}
```

### Rollback Mechanism

```typescript
interface RollbackManager {
  createCheckpoint(phase: MigrationPhase): Promise<Checkpoint>;
  rollbackToCheckpoint(checkpoint: Checkpoint): Promise<void>;
  listCheckpoints(): Checkpoint[];
}

interface Checkpoint {
  id: string;
  phase: MigrationPhase;
  timestamp: Date;
  gitCommit: string;
  packageLockSnapshot: string;
}
```

## Testing Strategy

### Dual Testing Approach

The migration will be validated using both unit tests and property-based tests:

- **Unit tests**: Verify specific migration steps, configuration changes, and integration points
- **Property tests**: Verify universal properties across all migrated code

### Unit Testing

**Test Categories**:

1. **Configuration Tests**
   - Verify package.json versions
   - Verify next.config.js structure
   - Verify eslint.config.js structure
   - Verify proxy.ts exports

2. **Migration Tests**
   - Verify file renames
   - Verify export changes
   - Verify import updates

3. **Integration Tests**
   - Verify authentication flows
   - Verify form submissions
   - Verify API routes
   - Verify image optimization
   - Verify middleware/proxy functionality

4. **Build Tests**
   - Verify dev server starts
   - Verify production build completes
   - Verify no compilation errors

### Property-Based Testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: **Feature: nextjs-16-migration, Property {number}: {property_text}**

**Property Test Examples**:

```typescript
// Property 2: Server Component Async Params
describe('Feature: nextjs-16-migration, Property 2: Server Component Async Params', () => {
  it('should await params in all server components', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string()), // Generate array of server component file paths
        async (filePaths) => {
          for (const filePath of filePaths) {
            const content = await readFile(filePath);
            if (isServerComponent(content) && hasParamsParam(content)) {
              expect(content).toMatch(/await params/);
              expect(content).toMatch(/params:\s*Promise</);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 9: Performance Threshold Compliance
describe('Feature: nextjs-16-migration, Property 9: Performance Threshold Compliance', () => {
  it('should meet performance thresholds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          buildTime: fc.nat(10000),
          startupTime: fc.nat(5000),
          pageLoadTime: fc.nat(3000),
        }),
        async (baseline) => {
          const actual = await measurePerformance();
          expect(actual.buildTime).toBeLessThanOrEqual(baseline.buildTime * 1.2);
          expect(actual.startupTime).toBeLessThanOrEqual(baseline.startupTime * 1.2);
          expect(actual.pageLoadTime).toBeLessThanOrEqual(baseline.pageLoadTime * 1.1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Testing Tools

- **Unit Testing**: Vitest
- **Property-Based Testing**: fast-check (already installed)
- **Integration Testing**: Vitest + Testing Library
- **Performance Testing**: Custom scripts using web-vitals

### Test Execution Strategy

1. **Pre-Migration Tests**: Establish baseline metrics
2. **During Migration Tests**: Validate each phase
3. **Post-Migration Tests**: Comprehensive validation
4. **Regression Tests**: Ensure no functionality lost

## Implementation Approach

### Phase 1: Preparation (2-3 hours)

1. Create git branch: `feature/nextjs-16-migration`
2. Create backup checkpoint
3. Document baseline metrics:
   - Build time
   - Dev server startup time
   - Page load times
   - Bundle sizes
4. Review all breaking changes
5. Identify affected files (already done in analysis)

### Phase 2: Dependency Updates (1-2 hours)

1. Update package.json:
   ```json
   {
     "dependencies": {
       "next": "16.1.1",
       "react": "^19.2.0",
       "react-dom": "^19.2.0",
       "@radix-ui/*": "latest",
       // ... other updates
     },
     "devDependencies": {
       "@types/react": "^18.3.1",
       "@types/react-dom": "^18.3.1",
       "eslint-config-next": "16.1.1"
     }
   }
   ```

2. Run `npm install`
3. Verify no peer dependency conflicts
4. Test that dev server starts (may have errors, that's expected)

### Phase 3: Code Migration (4-6 hours)

**Step 1: Run Automated Codemod**
```bash
npx @next/codemod@canary upgrade latest
```

**Step 2: Middleware Migration**
1. Rename `src/middleware.ts` to `src/proxy.ts`
2. Update export:
   ```typescript
   export function proxy(req: NextRequest) {
     return auth(async (req) => {
       // existing logic
     })(req);
   }
   ```

**Step 3: Configuration Updates**
1. Update `next.config.js`:
   - Migrate image config
   - Move experimental flags
2. Create `eslint.config.js`
3. Update `.gitignore` for `.next/dev`

**Step 4: Manual Async API Migration**
1. Update server components with params/searchParams
2. Update client components with params/searchParams
3. Update cookies() usage
4. Update headers() usage

**Step 5: Type Generation**
```bash
npx next typegen
```

### Phase 4: Testing (3-5 hours)

1. **Build Tests**:
   ```bash
   npm run build
   npm run start
   ```

2. **Development Tests**:
   ```bash
   npm run dev
   ```

3. **Unit Tests**:
   ```bash
   npm run test
   ```

4. **Manual Testing**:
   - Test authentication flows
   - Test all forms
   - Test dynamic routes
   - Test API routes
   - Test image optimization
   - Test middleware functionality

5. **Performance Tests**:
   - Measure build time
   - Measure dev startup time
   - Measure page load times
   - Compare against baseline

### Phase 5: Deployment (1-2 hours)

1. Deploy to staging environment
2. Run smoke tests
3. Monitor for errors
4. If successful, deploy to production
5. Monitor production metrics
6. Keep rollback plan ready

## Risk Mitigation

### High-Risk Areas

1. **next-auth Beta**: May have compatibility issues
   - Mitigation: Extensive authentication testing
   - Fallback: Consider alternative auth solutions

2. **react-hook-form**: Known re-render issues
   - Mitigation: Test all forms thoroughly
   - Fallback: Consider React 19 native form APIs

3. **50+ Files with Async APIs**: Large surface area for errors
   - Mitigation: Automated codemod + manual review
   - Fallback: Incremental migration with feature flags

### Rollback Strategy

1. **Git Rollback**: Revert to pre-migration commit
2. **Package Rollback**: Restore package-lock.json
3. **Configuration Rollback**: Restore old configs
4. **Database Rollback**: No database changes expected

### Monitoring

Post-deployment monitoring:
- Error rates
- Performance metrics
- User reports
- Authentication success rates
- Form submission rates

## Success Criteria

The migration is considered successful when:

1. ✅ All dependencies updated to target versions
2. ✅ All async API migrations complete
3. ✅ Middleware renamed and functional
4. ✅ All configurations updated
5. ✅ Production build completes without errors
6. ✅ All unit tests pass
7. ✅ All property tests pass
8. ✅ All integration tests pass
9. ✅ Performance within acceptable thresholds
10. ✅ No console errors or warnings (except documented)
11. ✅ Authentication flows working
12. ✅ All forms working
13. ✅ All dynamic routes working
14. ✅ Image optimization working
15. ✅ Production deployment successful

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Preparation | 2-3 hours | None |
| Dependency Updates | 1-2 hours | Preparation complete |
| Code Migration | 4-6 hours | Dependencies updated |
| Testing | 3-5 hours | Code migration complete |
| Deployment | 1-2 hours | Testing complete |
| **Total** | **11-18 hours** | Sequential execution |

## Conclusion

This design provides a comprehensive, systematic approach to migrating from Next.js 15 to Next.js 16. The phased approach with checkpoints, automated tooling, and extensive testing minimizes risk while ensuring all functionality is preserved. The correctness properties provide formal verification that the migration meets all requirements.
