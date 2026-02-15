#!/usr/bin/env tsx

/**
 * Batch update script to replace all old settings model references with new SchoolSettings model
 * This script performs safe, targeted replacements across the codebase
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Replacement {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const replacements: Replacement[] = [
  // 1. Database model references
  {
    pattern: /db\.systemSettings/g,
    replacement: 'db.schoolSettings',
    description: 'db.systemSettings -> db.schoolSettings',
  },
  {
    pattern: /prisma\.systemSettings/g,
    replacement: 'prisma.schoolSettings',
    description: 'prisma.systemSettings -> prisma.schoolSettings',
  },
  {
    pattern: /db\.schoolSecuritySettings/g,
    replacement: 'db.schoolSettings',
    description: 'db.schoolSecuritySettings -> db.schoolSettings',
  },
  {
    pattern: /db\.schoolDataManagementSettings/g,
    replacement: 'db.schoolSettings',
    description: 'db.schoolDataManagementSettings -> db.schoolSettings',
  },
  {
    pattern: /db\.schoolNotificationSettings/g,
    replacement: 'db.schoolSettings',
    description: 'db.schoolNotificationSettings -> db.schoolSettings',
  },

  // 2. Type imports - SystemSettings
  {
    pattern: /import\s*{\s*SystemSettings\s*}\s*from\s*["']@prisma\/client["']/g,
    replacement: 'import { SchoolSettings } from "@prisma/client"',
    description: 'Import SystemSettings -> SchoolSettings',
  },
  {
    pattern: /import\s*{\s*SchoolSecuritySettings\s*}\s*from\s*["']@prisma\/client["']/g,
    replacement: 'import { SchoolSettings } from "@prisma/client"',
    description: 'Import SchoolSecuritySettings -> SchoolSettings',
  },
  {
    pattern: /import\s*{\s*SchoolDataManagementSettings\s*}\s*from\s*["']@prisma\/client["']/g,
    replacement: 'import { SchoolSettings } from "@prisma/client"',
    description: 'Import SchoolDataManagementSettings -> SchoolSettings',
  },
  {
    pattern: /import\s*{\s*SchoolNotificationSettings\s*}\s*from\s*["']@prisma\/client["']/g,
    replacement: 'import { SchoolSettings } from "@prisma/client"',
    description: 'Import SchoolNotificationSettings -> SchoolSettings',
  },

  // 3. Type annotations
  {
    pattern: /:\s*SystemSettings(\s|;|,|\)|\||&)/g,
    replacement: ': SchoolSettings$1',
    description: 'Type annotation SystemSettings -> SchoolSettings',
  },
  {
    pattern: /:\s*SchoolSecuritySettings(\s|;|,|\)|\||&)/g,
    replacement: ': SchoolSettings$1',
    description: 'Type annotation SchoolSecuritySettings -> SchoolSettings',
  },
  {
    pattern: /:\s*SchoolDataManagementSettings(\s|;|,|\)|\||&)/g,
    replacement: ': SchoolSettings$1',
    description: 'Type annotation SchoolDataManagementSettings -> SchoolSettings',
  },
  {
    pattern: /:\s*SchoolNotificationSettings(\s|;|,|\)|\||&)/g,
    replacement: ': SchoolSettings$1',
    description: 'Type annotation SchoolNotificationSettings -> SchoolSettings',
  },

  // 4. Generic types
  {
    pattern: /<SystemSettings>/g,
    replacement: '<SchoolSettings>',
    description: 'Generic type <SystemSettings> -> <SchoolSettings>',
  },
  {
    pattern: /<SchoolSecuritySettings>/g,
    replacement: '<SchoolSettings>',
    description: 'Generic type <SchoolSecuritySettings> -> <SchoolSettings>',
  },

  // 5. Relation names in includes/selects
  {
    pattern: /systemSettings:\s*true/g,
    replacement: 'settings: true',
    description: 'Include systemSettings -> settings',
  },
  {
    pattern: /systemSettings:\s*{/g,
    replacement: 'settings: {',
    description: 'Include systemSettings object -> settings',
  },
  {
    pattern: /securitySettings:\s*true/g,
    replacement: 'settings: true',
    description: 'Include securitySettings -> settings',
  },
  {
    pattern: /securitySettings:\s*{/g,
    replacement: 'settings: {',
    description: 'Include securitySettings object -> settings',
  },
  {
    pattern: /dataManagementSettings:\s*true/g,
    replacement: 'settings: true',
    description: 'Include dataManagementSettings -> settings',
  },
  {
    pattern: /dataManagementSettings:\s*{/g,
    replacement: 'settings: {',
    description: 'Include dataManagementSettings object -> settings',
  },
  {
    pattern: /notificationSettings:\s*true/g,
    replacement: 'settings: true',
    description: 'Include notificationSettings -> settings',
  },
  {
    pattern: /notificationSettings:\s*{/g,
    replacement: 'settings: {',
    description: 'Include notificationSettings object -> settings',
  },

  // 6. Property access (be careful with these)
  {
    pattern: /\.systemSettings\??\./g,
    replacement: '.settings?.',
    description: 'Property access .systemSettings. -> .settings.',
  },
  {
    pattern: /\.securitySettings\??\./g,
    replacement: '.settings?.',
    description: 'Property access .securitySettings. -> .settings.',
  },
  {
    pattern: /\.dataManagementSettings\??\./g,
    replacement: '.settings?.',
    description: 'Property access .dataManagementSettings. -> .settings.',
  },
  {
    pattern: /\.notificationSettings\??\./g,
    replacement: '.settings?.',
    description: 'Property access .notificationSettings. -> .settings.',
  },
];

async function updateFile(filePath: string): Promise<{ updated: boolean; changes: number }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  let updatedContent = content;
  let changes = 0;

  for (const { pattern, replacement } of replacements) {
    const matches = updatedContent.match(pattern);
    if (matches) {
      changes += matches.length;
      updatedContent = updatedContent.replace(pattern, replacement);
    }
  }

  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    return { updated: true, changes };
  }

  return { updated: false, changes: 0 };
}

async function main() {
  console.log('🔄 Starting batch update of settings model references...\n');

  // Find all TypeScript files in src directory using find command
  const findCommand = 'find src -type f \\( -name "*.ts" -o -name "*.tsx" \\) ! -path "*/node_modules/*" ! -path "*/.next/*"';
  const filesOutput = execSync(findCommand, { encoding: 'utf-8' });
  const files = filesOutput.trim().split('\n').filter(f => f.length > 0);

  console.log(`📁 Found ${files.length} TypeScript files to process\n`);

  let totalUpdated = 0;
  let totalChanges = 0;
  const updatedFiles: string[] = [];

  for (const file of files) {
    const { updated, changes } = await updateFile(file);
    if (updated) {
      totalUpdated++;
      totalChanges += changes;
      updatedFiles.push(file);
      console.log(`✓ ${file} (${changes} changes)`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`Files processed:  ${files.length}`);
  console.log(`Files updated:    ${totalUpdated}`);
  console.log(`Total changes:    ${totalChanges}`);
  console.log('='.repeat(70));

  if (updatedFiles.length > 0) {
    console.log('\n📝 Updated files:');
    updatedFiles.forEach(file => console.log(`  - ${file}`));
  }

  console.log('\n✅ Batch update complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Review changes: git diff');
  console.log('  2. Run TypeScript check: npx tsc --noEmit');
  console.log('  3. Run tests: npm test');
  console.log('  4. Fix any remaining issues manually');
  console.log('');
}

main().catch(console.error);
