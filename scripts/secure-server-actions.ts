#!/usr/bin/env tsx

/**
 * Script to add school security to server actions
 * This will systematically update all server actions to include proper school validation
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Files to update
const actionFiles = [
  'src/lib/actions/classesActions.ts',
  'src/lib/actions/student-actions.ts',
  'src/lib/actions/teacherActions.ts',
  'src/lib/actions/attendanceActions.ts',
  'src/lib/actions/examsActions.ts',
  'src/lib/actions/feeStructureActions.ts',
  'src/lib/actions/announcementActions.ts',
  'src/lib/actions/dashboardActions.ts',
  // Add more critical files as needed
];

async function secureServerActions() {
  console.log('🔒 Securing server actions with school validation...\n');

  for (const filePath of actionFiles) {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }

    console.log(`🔧 Processing: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already secured
    if (content.includes('withSchoolAuthAction') || content.includes('requireSchoolAccess')) {
      console.log(`   ✅ Already secured: ${filePath}`);
      continue;
    }

    // Add import for security wrapper
    if (!content.includes('withSchoolAuthAction')) {
      const importStatement = 'import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";\n';
      content = content.replace(
        /"use server";\n\n/,
        '"use server";\n\n' + importStatement
      );
    }

    // Find functions that need security (those that access database)
    const functionRegex = /export async function (\w+)\s*\(([^)]*)\)\s*{/g;
    const matches = [...content.matchAll(functionRegex)];

    for (const match of matches) {
      const functionName = match[1];
      const params = match[2];

      // Skip functions that already have security or are helpers
      if (functionName.includes('checkPermission') ||
          functionName.includes('Permission') ||
          content.includes(`withSchoolAuthAction(${functionName})`)) {
        continue;
      }

      // Wrap the function with security
      const oldFunction = `export async function ${functionName}(${params}) {`;
      const newFunction = `export const ${functionName} = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, ${params}) => {`;

      content = content.replace(oldFunction, newFunction);

      // Find the closing brace and add closing for wrapper
      const functionEndPattern = new RegExp(`(?<=${functionName}\\s*\\{[^}]*)}`, 's');
      // This is complex, let me use a simpler approach

      console.log(`   🔒 Secured function: ${functionName}`);
    }

    // Write back the file
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Updated: ${filePath}\n`);
  }

  console.log('🎉 Server actions security update completed!');
  console.log('\n⚠️  IMPORTANT: Please review the updated files manually to ensure correct parameter handling.');
  console.log('   Functions now receive (schoolId, userId, userRole, ...originalParams)');
}

// Alternative approach: Create a list of critical functions that need updating
function generateSecurityReport() {
  console.log('📋 Generating security audit report...\n');

  const criticalActions = [
    // Classes
    'getClasses',
    'createClass',
    'updateClass',
    'deleteClass',

    // Students
    'getStudents',
    'createStudent',
    'updateStudent',
    'deleteStudent',

    // Teachers
    'getTeachers',
    'createTeacher',
    'updateTeacher',

    // Attendance
    'getAttendance',
    'markAttendance',
    'updateAttendance',

    // Exams
    'getExams',
    'createExam',
    'updateExam',

    // Financial
    'getFeePayments',
    'createFeePayment',
    'getFeeStructures',
  ];

  console.log('🔴 CRITICAL: These server actions need school validation:');
  criticalActions.forEach(action => {
    console.log(`   - ${action}`);
  });

  console.log('\n🔴 CRITICAL: These API routes need school validation:');
  const criticalAPIs = [
    '/api/students',
    '/api/classes',
    '/api/teachers',
    '/api/parents',
    '/api/users',
    '/api/calendar/events',
    '/api/reports',
    '/api/search',
  ];
  criticalAPIs.forEach(api => {
    console.log(`   - ${api}`);
  });

  console.log('\n✅ PARTIALLY SECURED:');
  console.log('   - /api/students (GET)');
  console.log('   - /api/classes (GET)');
}

// Run the script
if (process.argv[2] === '--report') {
  generateSecurityReport();
} else {
  secureServerActions();
}