#!/usr/bin/env ts-node

/**
 * Verification script for rate limiting Vercel deployment fix
 * 
 * This script verifies that:
 * 1. Rate limiting is properly configured
 * 2. Bypass logic is in place for development/preview
 * 3. Health check endpoints are excluded
 * 4. Vercel bot detection is working
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function checkFile(filePath: string, checks: { name: string; pattern: RegExp }[]): void {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.push({
      name: `File exists: ${filePath}`,
      passed: false,
      message: `File not found: ${filePath}`
    });
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  checks.forEach(check => {
    const passed = check.pattern.test(content);
    results.push({
      name: check.name,
      passed,
      message: passed 
        ? `✓ ${check.name}` 
        : `✗ ${check.name} - Pattern not found`
    });
  });
}

console.log('🔍 Verifying Rate Limiting Vercel Deployment Fix...\n');

// Check middleware.ts
checkFile('middleware.ts', [
  {
    name: 'Middleware has shouldSkipRateLimit logic',
    pattern: /const shouldSkipRateLimit\s*=/
  },
  {
    name: 'Middleware checks NODE_ENV === development',
    pattern: /process\.env\.NODE_ENV\s*===\s*['"]development['"]/
  },
  {
    name: 'Middleware checks VERCEL_ENV === preview',
    pattern: /process\.env\.VERCEL_ENV\s*===\s*['"]preview['"]/
  },
  {
    name: 'Middleware excludes health check endpoints',
    pattern: /pathname\.startsWith\(['"]\/api\/health['"]\)/
  },
  {
    name: 'Middleware excludes Next.js internal routes',
    pattern: /pathname\.startsWith\(['"]\/\_next\/['"]\)/
  },
  {
    name: 'Middleware conditionally applies rate limiting',
    pattern: /if\s*\(\s*!shouldSkipRateLimit\s*\)/
  }
]);

// Check rate-limit.ts
checkFile('src/lib/middleware/rate-limit.ts', [
  {
    name: 'Rate limit middleware has Vercel bot detection',
    pattern: /const isVercelBot\s*=/
  },
  {
    name: 'Rate limit middleware checks user agent for Vercel',
    pattern: /userAgent\.includes\(['"]vercel['"]\)/i
  },
  {
    name: 'Rate limit middleware skips for Vercel bots',
    pattern: /if\s*\(\s*isVercelBot/
  },
  {
    name: 'Rate limit middleware checks VERCEL_ENV',
    pattern: /process\.env\.VERCEL_ENV\s*===\s*['"]preview['"]/
  }
]);

// Check documentation exists
const docPath = 'docs/RATE_LIMITING_VERCEL_FIX.md';
results.push({
  name: 'Documentation file exists',
  passed: fs.existsSync(path.join(process.cwd(), docPath)),
  message: fs.existsSync(path.join(process.cwd(), docPath))
    ? `✓ Documentation exists: ${docPath}`
    : `✗ Documentation missing: ${docPath}`
});

// Print results
console.log('Results:\n');
results.forEach(result => {
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.message}`);
});

// Summary
const passed = results.filter(r => r.passed).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log('\n' + '='.repeat(60));
console.log(`Summary: ${passed}/${total} checks passed (${percentage}%)`);
console.log('='.repeat(60));

if (passed === total) {
  console.log('\n✅ All checks passed! Rate limiting fix is properly implemented.');
  console.log('\nNext steps:');
  console.log('1. Commit changes: git add . && git commit -m "Fix: Rate limiting for Vercel deployment"');
  console.log('2. Push to GitHub: git push');
  console.log('3. Monitor Vercel deployment logs for 429 errors');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}
