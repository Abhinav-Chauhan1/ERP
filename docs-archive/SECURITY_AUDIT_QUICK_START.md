# Security Audit Quick Start Guide

## Overview

This guide provides quick instructions for running security audits on the codebase.

---

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Bash shell (Linux/macOS) or Git Bash (Windows)
- Git

### Optional Tools (Recommended)
- `ripgrep` (rg) - Faster than grep
  ```bash
  # macOS
  brew install ripgrep
  
  # Ubuntu/Debian
  apt-get install ripgrep
  
  # Windows
  choco install ripgrep
  ```

- `jq` - JSON processor for parsing audit results
  ```bash
  # macOS
  brew install jq
  
  # Ubuntu/Debian
  apt-get install jq
  
  # Windows
  choco install jq
  ```

---

## Quick Start

### Run All Audits (Recommended)

```bash
# Make script executable
chmod +x scripts/security-audit/run-all-audits.sh

# Run all audits
bash scripts/security-audit/run-all-audits.sh
```

This will:
1. Scan for school isolation issues
2. Scan for security anti-patterns
3. Audit npm dependencies
4. Check TypeScript compilation
5. Run ESLint analysis
6. Generate a master report

**Results:** Check `security-audit-results/` directory

---

## Individual Audits

### 1. School Isolation Audit

Scans for database queries missing school isolation.

```bash
chmod +x scripts/security-audit/scan-school-isolation.sh
bash scripts/security-audit/scan-school-isolation.sh
```

**What it checks:**
- `findMany` queries without schoolId
- `findFirst` queries without schoolId
- `update/delete` operations
- `count` and `aggregate` operations
- API routes and server actions

**Report:** `security-audit-results/school-isolation-report-*.md`

---

### 2. Security Pattern Audit

Scans for common security vulnerabilities.

```bash
chmod +x scripts/security-audit/scan-security-patterns.sh
bash scripts/security-audit/scan-security-patterns.sh
```

**What it checks:**
- Console.log statements (info leakage)
- dangerouslySetInnerHTML (XSS risk)
- eval() usage (code injection)
- Raw SQL queries
- Hardcoded secrets
- innerHTML assignment
- Unvalidated redirects
- Missing error handling
- Weak password validation
- Missing CSRF protection
- Unescaped user input
- Missing authentication checks
- Insecure random numbers
- Missing input validation

**Report:** `security-audit-results/security-patterns-report-*.md`

---

### 3. Dependency Audit

Scans npm dependencies for vulnerabilities.

```bash
chmod +x scripts/security-audit/audit-dependencies.sh
bash scripts/security-audit/audit-dependencies.sh
```

**What it checks:**
- Known vulnerabilities (npm audit)
- Outdated packages
- License compliance
- Dependency tree depth
- Known vulnerable packages

**Report:** `security-audit-results/dependency-audit-report-*.md`

---

## Manual Checks

### TypeScript Compilation

```bash
npx tsc --noEmit
```

### ESLint Analysis

```bash
npx eslint . --ext .ts,.tsx --max-warnings 0
```

### Find Unused Exports

```bash
npx ts-prune
```

### Find Circular Dependencies

```bash
npx madge --circular --extensions ts,tsx src/
```

### Check for N+1 Queries

```bash
# Look for loops with database queries
rg "for.*await.*db\.|map.*await.*db\." src/
```

---

## Understanding Results

### Severity Levels

- **CRITICAL** - Fix immediately (security breach risk)
- **HIGH** - Fix within 1 week (significant security risk)
- **MEDIUM** - Fix within 2 weeks (moderate security risk)
- **LOW** - Fix within 1 month (minor security risk)
- **INFO** - Review and document (informational)

### Priority Order

1. **CRITICAL vulnerabilities** - Drop everything and fix
2. **HIGH vulnerabilities** - Fix in current sprint
3. **MEDIUM vulnerabilities** - Schedule for next sprint
4. **LOW vulnerabilities** - Add to backlog

---

## Common Issues & Fixes

### Issue: Missing School Isolation

**Problem:**
```typescript
const students = await db.student.findMany({
  include: { user: true }
});
```

**Fix:**
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();

const students = await db.student.findMany({
  where: { schoolId }, // Add school filter
  include: { user: true }
});
```

---

### Issue: Console.log in Production

**Problem:**
```typescript
console.log('User data:', user);
```

**Fix:**
```typescript
// Remove or use proper logging
import { logger } from '@/lib/utils/logger';
logger.debug('User data', { userId: user.id }); // Don't log sensitive data
```

---

### Issue: Missing Input Validation

**Problem:**
```typescript
const body = await request.json();
const result = await db.user.create({ data: body });
```

**Fix:**
```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  // ... other fields
});

const body = await request.json();
const validated = schema.parse(body); // Throws if invalid
const result = await db.user.create({ data: validated });
```

---

### Issue: Missing Authentication

**Problem:**
```typescript
export async function GET(request: NextRequest) {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}
```

**Fix:**
```typescript
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const users = await db.user.findMany({
    where: { schoolId: session.user.schoolId }
  });
  return NextResponse.json(users);
}
```

---

### Issue: Hardcoded Secrets

**Problem:**
```typescript
const API_KEY = 'sk_live_abc123xyz';
```

**Fix:**
```typescript
// In .env file
API_KEY=sk_live_abc123xyz

// In code
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY is required');
}
```

---

## Automated Fixes

### Fix npm Vulnerabilities

```bash
# Automatic fix (safe)
npm audit fix

# Fix including breaking changes (review carefully)
npm audit fix --force

# Update all packages
npm update
```

### Fix ESLint Issues

```bash
# Auto-fix what's possible
npx eslint . --ext .ts,.tsx --fix
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday

jobs:
  security-audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run security audits
        run: bash scripts/security-audit/run-all-audits.sh
        
      - name: Upload audit results
        uses: actions/upload-artifact@v3
        with:
          name: security-audit-results
          path: security-audit-results/
          
      - name: Check for critical issues
        run: |
          if grep -q "CRITICAL" security-audit-results/*.md; then
            echo "Critical security issues found!"
            exit 1
          fi
```

---

## Continuous Monitoring

### Setup Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### Setup Snyk

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor
```

---

## Best Practices

### Before Committing

```bash
# Run quick checks
npm run lint
npm run type-check
npm test

# Run security scan
bash scripts/security-audit/run-all-audits.sh
```

### Weekly Tasks

- [ ] Run full security audit
- [ ] Review and fix HIGH/CRITICAL issues
- [ ] Update dependencies
- [ ] Review audit logs

### Monthly Tasks

- [ ] Comprehensive security review
- [ ] Update security documentation
- [ ] Review and update security policies
- [ ] Penetration testing (if applicable)

---

## Getting Help

### Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Prisma Security](https://www.prisma.io/docs/guides/security)

### Support

- Review `COMPREHENSIVE_SECURITY_AUDIT_PLAN.md` for detailed guidance
- Check existing security documentation in `docs/`
- Consult with security team for critical issues

---

## Troubleshooting

### Scripts Won't Run

```bash
# Make scripts executable
chmod +x scripts/security-audit/*.sh

# Check bash is available
which bash

# Try running with bash explicitly
bash scripts/security-audit/run-all-audits.sh
```

### No Results Generated

- Check you're in the project root directory
- Ensure `src/` directory exists
- Check file permissions
- Review script output for errors

### Too Many False Positives

- Review patterns in scripts
- Adjust regex patterns for your codebase
- Add exceptions for known safe patterns
- Document exceptions in code comments

---

## Next Steps

1. ✅ Run initial audit: `bash scripts/security-audit/run-all-audits.sh`
2. ✅ Review all reports in `security-audit-results/`
3. ✅ Fix CRITICAL and HIGH severity issues
4. ✅ Set up CI/CD integration
5. ✅ Schedule regular audits
6. ✅ Document security policies
7. ✅ Train team on security best practices

---

**Remember:** Security is an ongoing process, not a one-time task. Regular audits and continuous monitoring are essential for maintaining a secure application.
