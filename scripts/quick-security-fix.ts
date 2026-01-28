#!/usr/bin/env tsx

/**
 * Quick security fix for critical server actions
 * This script adds basic school validation to the most critical functions
 */

import fs from 'fs';
import path from 'path';

// Critical files to secure immediately
const criticalFiles = [
  {
    path: 'src/lib/actions/classesActions.ts',
    functions: ['getClasses', 'createClass', 'updateClass'],
  },
  {
    path: 'src/lib/actions/student-actions.ts',
    functions: ['getStudents', 'createStudent', 'updateStudent'],
  },
  {
    path: 'src/lib/actions/teacherActions.ts',
    functions: ['getTeachers', 'createTeacher', 'updateTeacher'],
  },
  {
    path: 'src/lib/actions/attendanceActions.ts',
    functions: ['getAttendance', 'markAttendance'],
  },
];

function addSecurityImport(content: string): string {
  const importStatement = 'import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";\n';

  if (content.includes('withSchoolAuthAction')) {
    return content; // Already imported
  }

  return content.replace(
    /"use server";\n\n/,
    '"use server";\n\n' + importStatement
  );
}

function secureFunction(content: string, functionName: string): string {
  // Skip if already secured
  if (content.includes(`withSchoolAuthAction(${functionName})`)) {
    return content;
  }

  // Find the function definition
  const functionRegex = new RegExp(`export async function ${functionName}\\s*\\(([^)]*)\\)\\s*\\{`, 's');
  const match = content.match(functionRegex);

  if (!match) {
    console.log(`   ⚠️  Function ${functionName} not found`);
    return content;
  }

  const params = match[1];
  const oldFunction = `export async function ${functionName}(${params}) {`;
  const newFunction = `export const ${functionName} = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, ${params}) => {`;

  let updatedContent = content.replace(oldFunction, newFunction);

  // Add schoolId filter to database queries (basic approach)
  // This is a simple heuristic - will need manual review
  updatedContent = updatedContent.replace(
    /where:\s*\{([^}]*)\}/g,
    (match, whereContent) => {
      // Skip if already has schoolId
      if (whereContent.includes('schoolId')) {
        return match;
      }
      return `where: {\n        schoolId,\n        ${whereContent}\n      }`;
    }
  );

  return updatedContent;
}

async function applyQuickSecurityFixes() {
  console.log('🔒 Applying quick security fixes to critical server actions...\n');

  for (const file of criticalFiles) {
    const filePath = file.path;

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }

    console.log(`🔧 Securing: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Add security import
    content = addSecurityImport(content);

    // Secure critical functions
    for (const functionName of file.functions) {
      content = secureFunction(content, functionName);
      console.log(`   ✅ Secured: ${functionName}`);
    }

    // Write back
    fs.writeFileSync(filePath, content);
    console.log(`   💾 Updated: ${filePath}\n`);
  }

  console.log('🎉 Quick security fixes applied!');
  console.log('\n⚠️  IMPORTANT: These are automated fixes. Please review and test each function manually.');
  console.log('   The fixes add basic school validation but may need parameter adjustments.');
}

// Generate manual fix instructions
function generateManualFixInstructions() {
  console.log('📋 MANUAL SECURITY FIX INSTRUCTIONS');
  console.log('=====================================\n');

  console.log('🔴 CRITICAL: Fix these API routes immediately:\n');

  const criticalAPIs = [
    'src/app/api/teachers/route.ts',
    'src/app/api/parents/route.ts',
    'src/app/api/users/route.ts',
    'src/app/api/calendar/events/route.ts',
    'src/app/api/reports/route.ts',
    'src/app/api/search/route.ts',
  ];

  criticalAPIs.forEach(api => {
    console.log(`# ${api}`);
    console.log('```typescript');
    console.log('import { withSchoolAuth } from "@/lib/auth/security-wrapper";');
    console.log('');
    console.log('export const GET = withSchoolAuth(async (request, context) => {');
    console.log('  const data = await db.model.findMany({');
    console.log('    where: { schoolId: context.schoolId }');
    console.log('  });');
    console.log('  return NextResponse.json(data);');
    console.log('});');
    console.log('```\n');
  });

  console.log('🔴 CRITICAL: Fix these server actions immediately:\n');

  const criticalActions = [
    { file: 'src/lib/actions/attendanceActions.ts', functions: ['getAttendance', 'markAttendance'] },
    { file: 'src/lib/actions/examsActions.ts', functions: ['getExams', 'createExam'] },
    { file: 'src/lib/actions/feeStructureActions.ts', functions: ['getFeeStructures', 'createFeeStructure'] },
    { file: 'src/lib/actions/announcementActions.ts', functions: ['getAnnouncements', 'createAnnouncement'] },
  ];

  criticalActions.forEach(({ file, functions }) => {
    console.log(`# ${file}`);
    functions.forEach(func => {
      console.log(`- Add \`withSchoolAuthAction\` wrapper to \`${func}\``);
    });
    console.log('');
  });
}

// Run the fixes
if (process.argv[2] === '--instructions') {
  generateManualFixInstructions();
} else {
  applyQuickSecurityFixes();
}