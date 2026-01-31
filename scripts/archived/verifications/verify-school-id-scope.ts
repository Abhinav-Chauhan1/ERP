#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

/**
 * Script to verify that Prisma queries are scoped by schoolId.
 * usage: npx tsx scripts/verify-school-id-scope.ts
 */

const EXCLUDED_DIRS = ['node_modules', '.next', '.git', 'prisma', 'scripts'];
const EXCLUDED_FILES = ['middleware.ts', 'auth.ts', 'verify-school-id-scope.ts'];

const GLOBAL_MODELS = [
    'User',
    'Account',
    'Session',
    'VerificationToken',
    'School',
    'Subscription',
    'UsageCounter',
    'UserSchool',
    'UserPermission',
    'RolePermission',
    'Permission',
    'SystemSettings',
    'AuditLog'
];

const SCHOOL_SCOPED_MODELS = [
    'Student',
    'Teacher',
    'Parent',
    'Class',
    'Section',
    'Subject',
    'Attendance',
    'Fee',
    'Exam',
    'Result',
    'Announcement',
    'Message',
    'Event',
    'Timetable',
    'Homework',
    'Grade',
    'Department',
    'Designation'
];

function getAllFiles(dirPath, arrayOfFiles) {
    if (!arrayOfFiles) arrayOfFiles = [];

    try {
        const files = fs.readdirSync(dirPath);

        files.forEach(function (file) {
            if (EXCLUDED_DIRS.includes(file)) return;
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                getAllFiles(fullPath, arrayOfFiles);
            } else {
                if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                    arrayOfFiles.push(fullPath);
                }
            }
        });
    } catch (e) {
        console.log("Error reading dir " + dirPath);
    }

    return arrayOfFiles;
}

async function main() {
    console.log('🔍 Starting codebase audit for missing schoolId scopes...');

    const files = getAllFiles(path.join(process.cwd(), 'src'));
    let violations = 0;

    for (const file of files) {
        if (EXCLUDED_FILES.some(ex => file.endsWith(ex))) continue;

        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            const match = trimmed.match(/prisma\.(\w+)\.(findMany|findFirst|count|aggregate|delete|update|upsert|groupBy)/);

            if (match) {
                const [, model, method] = match;
                const modelName = model.charAt(0).toUpperCase() + model.slice(1);

                if (!GLOBAL_MODELS.includes(modelName)) {
                    const windowSize = 25;
                    // Get context window (some lines before and mostly after)
                    const startLine = Math.max(0, i);
                    const endLine = Math.min(lines.length, i + windowSize);
                    const window = lines.slice(startLine, endLine).join('\n');

                    const hasSchoolId = /schoolId\s*:|schoolId\s*,/.test(window);

                    if (!hasSchoolId) {
                        console.log(`\n⚠️  Potential Violation in ${file}:${i + 1}`);
                        console.log(`   Query: ${trimmed}`);
                        console.log(`   Model: ${modelName} (${method})`);
                        console.log(`   Reason: No 'schoolId' found in immediate context.`);
                        violations++;
                    }
                }
            }
        }
    }

    if (violations > 0) {
        console.log(`\n❌ Found ${violations} potential violations.`);
        // Don't exit with error code yet, just report
        // process.exit(1); 
    } else {
        console.log('\n✅ No obvious violations found.');
    }
}

main().catch(console.error);
