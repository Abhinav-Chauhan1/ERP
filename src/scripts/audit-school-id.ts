import fs from 'fs';
import path from 'path';

function findFilesWithDbCalls(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findFilesWithDbCalls(filePath, fileList);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.match(/db\.\w+\.(find|create|update|delete|count|aggregate)/)) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

function audit() {
    const actionsDir = path.join(process.cwd(), 'src/lib/actions');
    const apiDir = path.join(process.cwd(), 'src/app/api');

    const allDbFiles = [
        ...findFilesWithDbCalls(actionsDir),
        ...findFilesWithDbCalls(apiDir)
    ];

    let missingSchoolId = 0;
    let totalWithSchoolId = 0;

    for (const file of allDbFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Check if the file imports and uses schoolId
        const hasSchoolIdReference = content.includes('schoolId');
        const hasRequireSchoolAccess = content.includes('requireSchoolAccess()') || content.includes('requireSchoolContext()');
        const isSuperAdminRoute = file.includes('super-admin');

        if (isSuperAdminRoute) {
            continue; // Super admin doesn't need schoolId isolation
        }

        if (!hasSchoolIdReference && !hasRequireSchoolAccess) {
            console.log(`[MISSING] ${file.replace(process.cwd(), '')}`);
            missingSchoolId++;
        } else {
            totalWithSchoolId++;
        }
    }

    console.log(`\nAudit Complete!`);
    console.log(`Files with DB calls properly referencing schoolId: ${totalWithSchoolId}`);
    console.log(`Files with DB calls MISSING schoolId reference: ${missingSchoolId}`);
}

audit();
