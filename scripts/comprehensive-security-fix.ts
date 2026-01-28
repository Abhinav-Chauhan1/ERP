#!/usr/bin/env tsx

/**
 * Comprehensive security fix for all remaining multi-school vulnerabilities
 * This script will systematically secure all API routes and server actions
 */

import fs from 'fs';
import path from 'path';

// Critical API routes that need immediate securing
const criticalAPIRoutes = [
  'src/app/api/teachers/route.ts',
  'src/app/api/parents/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/calendar/events/route.ts',
  'src/app/api/reports/route.ts',
  'src/app/api/search/route.ts',
  'src/app/api/user/profile/route.ts',
  'src/app/api/user/sessions/route.ts',
  'src/app/api/parent/children/route.ts',
  'src/app/api/parent/homework/route.ts',
  'src/app/api/parent/timetable/route.ts',
];

// Critical server actions that need securing
const criticalServerActions = [
  'src/lib/actions/teacherActions.ts',
  'src/lib/actions/parentActions.ts',
  'src/lib/actions/userActions.ts',
  'src/lib/actions/attendanceActions.ts',
  'src/lib/actions/examsActions.ts',
  'src/lib/actions/feeStructureActions.ts',
  'src/lib/actions/announcementActions.ts',
  'src/lib/actions/dashboardActions.ts',
  'src/lib/actions/academicActions.ts',
  'src/lib/actions/admissionActions.ts',
  'src/lib/actions/syllabusActions.ts',
];

function secureAPIRoute(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  API route not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already secured
  if (content.includes('withSchoolAuth')) {
    console.log(`✅ Already secured: ${filePath}`);
    return false;
  }

  // Add import
  const importStatement = 'import { withSchoolAuth } from "@/lib/auth/security-wrapper";\n';
  if (!content.includes('withSchoolAuth')) {
    content = content.replace(
      /import \{[^}]+\} from "next\/server";\n/,
      (match) => match + importStatement
    );
  }

  // Find the main handler function (GET, POST, etc.)
  const handlerRegex = /export async function (GET|POST|PUT|DELETE)/g;
  const matches = [...content.matchAll(handlerRegex)];

  if (matches.length === 0) {
    console.log(`⚠️  No handler functions found in ${filePath}`);
    return false;
  }

  // Secure each handler
  for (const match of matches) {
    const method = match[1];
    const oldHandler = `export async function ${method}`;
    const newHandler = `export const ${method} = withSchoolAuth`;

    // Replace the function declaration
    const functionRegex = new RegExp(`export async function ${method}\\s*\\([^)]*\\)\\s*\\{`, 's');
    const functionMatch = content.match(functionRegex);

    if (functionMatch) {
      const functionDecl = functionMatch[0];
      const newFunctionDecl = `export const ${method} = withSchoolAuth(async (request, context) => {`;
      content = content.replace(functionDecl, newFunctionDecl);

      // Add schoolId filter to database queries
      content = content.replace(
        /where:\s*\{([^}]*)\}/g,
        (match, whereContent) => {
          if (whereContent.includes('schoolId')) {
            return match;
          }
          return `where: {\n        schoolId: context.schoolId,\n        ${whereContent}\n      }`;
        }
      );

      console.log(`🔒 Secured ${method} handler in ${filePath}`);
    }
  }

  fs.writeFileSync(filePath, content);
  return true;
}

function secureServerAction(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Server action not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already secured
  if (content.includes('withSchoolAuthAction')) {
    console.log(`✅ Already secured: ${filePath}`);
    return false;
  }

  // Add import
  const importStatement = 'import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";\n';
  if (!content.includes('withSchoolAuthAction')) {
    content = content.replace(
      /"use server";\n\n/,
      '"use server";\n\n' + importStatement
    );
  }

  // Find exported functions
  const functionRegex = /export async function (\w+)\s*\(([^)]*)\)\s*\{/g;
  const matches = [...content.matchAll(functionRegex)];

  if (matches.length === 0) {
    console.log(`⚠️  No exported functions found in ${filePath}`);
    return false;
  }

  // Secure each function
  for (const match of matches) {
    const functionName = match[1];
    const params = match[2];

    // Skip if already secured
    if (content.includes(`withSchoolAuthAction(${functionName})`)) {
      continue;
    }

    const oldFunction = `export async function ${functionName}(${params}) {`;
    const newFunction = `export const ${functionName} = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, ${params}) => {`;

    content = content.replace(oldFunction, newFunction);

    // Add schoolId filter to database queries
    content = content.replace(
      /where:\s*\{([^}]*)\}/g,
      (match, whereContent) => {
        if (whereContent.includes('schoolId')) {
          return match;
        }
        return `where: {\n        schoolId,\n        ${whereContent}\n      }`;
      }
    );

    console.log(`🔒 Secured function ${functionName} in ${filePath}`);
  }

  fs.writeFileSync(filePath, content);
  return true;
}

async function runComprehensiveSecurityFix() {
  console.log('🔒 Starting comprehensive security fix...\n');

  let securedAPIs = 0;
  let securedActions = 0;

  console.log('🔧 Securing critical API routes...\n');
  for (const apiRoute of criticalAPIRoutes) {
    if (secureAPIRoute(apiRoute)) {
      securedAPIs++;
    }
  }

  console.log('\n🔧 Securing critical server actions...\n');
  for (const serverAction of criticalServerActions) {
    if (secureServerAction(serverAction)) {
      securedActions++;
    }
  }

  console.log('\n🎉 Comprehensive security fix completed!');
  console.log(`📊 Secured ${securedAPIs} API routes`);
  console.log(`📊 Secured ${securedActions} server action files`);
  console.log('\n⚠️  IMPORTANT: These are automated fixes. Please review and test each file manually.');
  console.log('   Some functions may need parameter adjustments or additional logic.');
}

// Generate security audit report
function generateSecurityAuditReport() {
  console.log('📋 COMPREHENSIVE SECURITY AUDIT REPORT');
  console.log('=====================================\n');

  console.log('✅ SECURED COMPONENTS:');
  console.log('======================');
  console.log('✓ Middleware route protection');
  console.log('✓ Security wrapper utilities');
  console.log('✓ Critical API routes (students, classes, teachers)');
  console.log('✓ Critical server actions (classes, students, teachers, attendance)');
  console.log('✓ Usage limit enforcement');
  console.log('✓ Tenant isolation helpers\n');

  console.log('🔴 REMAINING VULNERABILITIES:');
  console.log('=============================');

  const remainingAPIs = [
    'All calendar APIs',
    'All reporting APIs',
    'All user management APIs',
    'All parent APIs',
    'All teacher APIs (some secured)',
    'File upload APIs',
    'Search APIs',
  ];

  console.log('API Routes:');
  remainingAPIs.forEach(api => console.log(`  - ${api}`));

  const remainingActions = [
    'All exam management actions',
    'All financial/payment actions',
    'All reporting generation actions',
    'All announcement actions',
    'All dashboard actions',
    'All academic management actions',
    'All admission actions',
    'All syllabus actions',
    '150+ other server actions',
  ];

  console.log('\nServer Actions:');
  remainingActions.forEach(action => console.log(`  - ${action}`));

  console.log('\n🛠️  IMMEDIATE ACTION REQUIRED:');
  console.log('Run: npm run tsx scripts/comprehensive-security-fix.ts');
}

// Run based on arguments
if (process.argv[2] === '--report') {
  generateSecurityAuditReport();
} else {
  runComprehensiveSecurityFix();
}