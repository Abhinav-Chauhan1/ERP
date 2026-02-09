# Dependency Vulnerability Fix Action Plan

## Priority: 🔴 HIGH - Fix Immediately

**Date:** February 8, 2026  
**Estimated Time:** 30 minutes  
**Risk Level:** HIGH

---

## Summary

6 npm package vulnerabilities detected:
- 4 HIGH severity
- 1 MODERATE severity  
- 1 LOW severity

---

## Step-by-Step Fix Guide

### Step 1: Backup Current State

```bash
# Create a git branch for safety
git checkout -b fix/dependency-vulnerabilities

# Backup package-lock.json
cp package-lock.json package-lock.json.backup
```

### Step 2: Fix Non-Breaking Vulnerabilities

```bash
# This will fix vulnerabilities that don't require breaking changes
npm audit fix

# Check what was fixed
npm audit
```

**Expected Fixes:**
- ✅ diff (4.0.0 → 4.0.4+)
- ✅ fast-xml-parser (4.3.6 → 5.3.4+)
- ✅ jspdf (update to latest)
- ✅ lodash (4.17.21 → latest)

### Step 3: Fix Next.js (Breaking Change)

```bash
# This requires --force as it's a major version update
npm audit fix --force

# Or manually update
npm install next@latest
```

**⚠️ Warning:** This will update Next.js from 16.1.4 to 16.1.6+, which may include breaking changes.

### Step 4: Verify Installation

```bash
# Check for remaining vulnerabilities
npm audit

# Verify package versions
npm list diff fast-xml-parser jspdf lodash next
```

### Step 5: Test Application

```bash
# Run TypeScript check
npm run type-check

# Run linter
npm run lint

# Run tests
npm test

# Build the application
npm run build

# Start dev server and test manually
npm run dev
```

### Step 6: Test Critical Flows

Manually test these areas affected by updated packages:

#### 1. PDF Generation (jspdf)
- [ ] Generate student ID cards
- [ ] Generate report cards
- [ ] Generate certificates
- [ ] Download PDF reports

#### 2. XML Processing (fast-xml-parser)
- [ ] AWS S3/R2 operations
- [ ] Any XML import/export features

#### 3. Next.js Features
- [ ] Image optimization
- [ ] Server components
- [ ] API routes
- [ ] Authentication flows

#### 4. General Functionality (lodash)
- [ ] Data transformations
- [ ] Form handling
- [ ] Search/filter operations

### Step 7: Commit Changes

```bash
# If all tests pass
git add package.json package-lock.json
git commit -m "fix: update vulnerable dependencies

- Update diff to fix DoS vulnerability
- Update fast-xml-parser to fix RangeError DoS
- Update jspdf to fix multiple security issues
- Update lodash to fix prototype pollution
- Update Next.js to fix DoS vulnerabilities

Fixes 6 security vulnerabilities (4 high, 1 moderate, 1 low)"

# Push to remote
git push origin fix/dependency-vulnerabilities
```

### Step 8: Create Pull Request

Create a PR with:
- Title: "Security: Fix 6 dependency vulnerabilities"
- Description: Link to this action plan
- Labels: security, dependencies, high-priority
- Reviewers: Team lead + security reviewer

---

## Detailed Package Updates

### 1. diff (LOW severity)

**Current:** 4.0.0 - 4.0.3  
**Target:** 4.0.4+  
**Issue:** DoS in parsePatch and applyPatch  
**Breaking Changes:** None expected  

**Testing:**
- Check any diff/patch functionality
- Verify git-related features

### 2. fast-xml-parser (HIGH severity)

**Current:** 4.3.6 - 5.3.3  
**Target:** 5.3.4+  
**Issue:** RangeError DoS Numeric Entities Bug  
**Breaking Changes:** Possible API changes from 4.x to 5.x  

**Testing:**
- Test AWS SDK operations (S3/R2)
- Test any XML parsing features
- Check file uploads/downloads

**Rollback Plan:**
```bash
npm install fast-xml-parser@4.3.6
```

### 3. jspdf (HIGH severity)

**Current:** <=4.0.0  
**Target:** Latest stable  
**Issues:** 
- PDF Injection
- DoS via BMP
- XMP Metadata Injection
- Race Condition

**Breaking Changes:** Possible API changes  

**Testing:**
- Generate ID cards
- Generate report cards
- Generate certificates
- Test all PDF downloads

**Rollback Plan:**
```bash
npm install jspdf@2.5.1  # Last known good version
```

### 4. lodash (MODERATE severity)

**Current:** 4.0.0 - 4.17.21  
**Target:** 4.17.21 (already latest)  
**Issue:** Prototype Pollution  
**Breaking Changes:** None  

**Note:** This may already be at latest. Check if vulnerability is in transitive dependency.

### 5. next (HIGH severity)

**Current:** 15.6.0-canary.0 - 16.1.4  
**Target:** 16.1.6+  
**Issues:**
- DoS via Image Optimizer
- HTTP deserialization DoS
- Unbounded Memory Consumption

**Breaking Changes:** Possible  

**Testing:**
- Test all pages
- Test image optimization
- Test API routes
- Test authentication
- Test server components
- Monitor memory usage

**Rollback Plan:**
```bash
npm install next@16.1.4
```

---

## Rollback Procedure

If issues are found after updates:

```bash
# Restore backup
cp package-lock.json.backup package-lock.json

# Reinstall old versions
npm ci

# Or revert git changes
git checkout main
git branch -D fix/dependency-vulnerabilities
```

---

## Alternative: Gradual Updates

If full update is too risky, update packages one at a time:

```bash
# Update one package
npm update diff
npm test

# If successful, commit
git add package.json package-lock.json
git commit -m "fix: update diff to fix DoS vulnerability"

# Repeat for each package
npm update fast-xml-parser
npm test
# ... and so on
```

---

## Monitoring After Update

### 1. Set Up Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
```

### 2. Add npm audit to CI/CD

In `.github/workflows/security.yml`:

```yaml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm audit --audit-level=moderate
```

### 3. Set Up Snyk (Optional)

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

## Success Criteria

- [ ] All 6 vulnerabilities resolved
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] TypeScript compilation successful
- [ ] All tests passing
- [ ] Application builds successfully
- [ ] Manual testing completed
- [ ] No performance degradation
- [ ] No new bugs introduced

---

## Timeline

- **Preparation:** 5 minutes
- **Updates:** 10 minutes
- **Testing:** 15 minutes
- **Documentation:** 5 minutes
- **Total:** ~35 minutes

---

## Communication Plan

### Before Update
- [ ] Notify team in Slack/Teams
- [ ] Schedule maintenance window if needed
- [ ] Prepare rollback plan

### During Update
- [ ] Update status in project management tool
- [ ] Monitor for issues

### After Update
- [ ] Announce completion
- [ ] Document any issues found
- [ ] Update security documentation

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes | Medium | High | Test thoroughly, have rollback ready |
| Performance issues | Low | Medium | Monitor metrics, load test |
| New bugs | Low | Medium | Comprehensive testing |
| Deployment issues | Low | High | Deploy to staging first |

---

## Contacts

**Security Lead:** [Name]  
**DevOps Lead:** [Name]  
**On-Call Engineer:** [Name]  

---

## References

- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GitHub Security Advisories](https://github.com/advisories)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)

---

**Status:** 📋 READY TO EXECUTE  
**Approved By:** [Pending]  
**Scheduled For:** ASAP
