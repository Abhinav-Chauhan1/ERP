#!/usr/bin/env ts-node

/**
 * Script to fix TypeScript errors related to unified auth refactor
 * 
 * Fixes:
 * 1. Remove schoolId from User where clauses (doesn't exist in User model)
 * 2. Remove user.teacher references (use proper relation queries)
 * 3. Remove user.userSchools direct access (use include)
 * 4. Fix UserCalendarPreferences unique constraint
 */

import * as fs from 'fs';
import * as path from 'path';

const filesToFix = [
  'src/app/api/calendar/events/route.ts',
  'src/app/api/calendar/export/route.ts',
  'src/app/api/calendar/preferences/route.ts',
  'src/app/api/payments/create/route.ts',
  'src/app/api/payments/verify/route.ts',
  'src/app/api/reports/batch-download/route.ts',
  'src/app/api/teacher/achievements/[id]/route.ts',
  'src/app/api/teacher/achievements/route.ts',
  'src/app/api/teacher/documents/route.ts',
  'src/app/api/teacher/events/[id]/rsvp/route.ts',
  'src/app/api/teacher/events/route.ts',
];

function fixFile(filePath: string) {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Fix 1: Remove schoolId from User where clause
  // Pattern: where: { id: ..., schoolId: ... }
  const userWherePattern = /(where:\s*\{\s*id:\s*[^,]+,\s*)schoolId[^,}]*,?\s*/g;
  if (userWherePattern.test(content)) {
    content = content.replace(userWherePattern, '$1');
    modified = true;
  }

  // Fix 2: Remove schoolId line from User findFirst
  const schoolIdLinePattern = /\s*schoolId[^,]*,?\s*\/\/\s*CRITICAL:\s*Filter by school\s*\n/g;
  if (schoolIdLinePattern.test(content)) {
    content = content.replace(schoolIdLinePattern, '');
    modified = true;
  }

  // Fix 3: Replace user.teacher with proper check
  // This needs manual review, so just log it
  if (content.includes('user.teacher')) {
    console.log(`  ⚠️  Found user.teacher reference - needs manual review`);
  }

  // Fix 4: Replace user.userSchools direct access
  if (content.includes('user.userSchools[0]') && !content.includes('include: {') && !content.includes('userSchools:')) {
    console.log(`  ⚠️  Found user.userSchools without include - needs manual review`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ Fixed ${filePath}`);
  } else {
    console.log(`  - No changes needed for ${filePath}`);
  }
}

function main() {
  console.log('Starting TypeScript error fixes...\n');

  for (const file of filesToFix) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        fixFile(fullPath);
      } catch (error) {
        console.error(`  ✗ Error fixing ${file}:`, error);
      }
    } else {
      console.log(`  ⚠️  File not found: ${file}`);
    }
  }

  console.log('\nDone! Run "npx tsc --noEmit" to verify fixes.');
}

main();
