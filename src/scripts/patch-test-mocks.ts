import fs from 'fs';
import path from 'path';

function findTestFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findTestFiles(filePath, fileList);
        } else if (filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function processFiles() {
    const dirs = [
        path.join(process.cwd(), 'src/test'),
        path.join(process.cwd(), 'src/lib/actions/__tests__'),
        path.join(process.cwd(), 'src/app/api')
    ];

    let allTestFiles: string[] = [];
    for (const dir of dirs) {
        allTestFiles = [...allTestFiles, ...findTestFiles(dir)];
    }

    let patchedCount = 0;

    for (const file of allTestFiles) {
        let content = fs.readFileSync(file, 'utf8');

        // Check if it has a db mock
        if (content.includes(`vi.mock('@/lib/db'`) || content.includes(`vi.mock("@/lib/db"`)) {

            // If it already mocks userSchool, skip it
            if (content.includes('userSchool:')) continue;

            // Find the db: { block and inject userSchool
            // This is a simple regex that looks for `db: {` and injects right after it
            const newContent = content.replace(
                /db\s*:\s*\{/,
                "db: {\n    userSchool: { findFirst: vi.fn().mockResolvedValue({ schoolId: 'test-school' }) },"
            );

            if (newContent !== content) {
                fs.writeFileSync(file, newContent, 'utf8');
                console.log(`[PATCHED] ${file.replace(process.cwd(), '')}`);
                patchedCount++;
            }
        }
    }

    console.log(`\nDone! Patched ${patchedCount} test files.`);
}

processFiles();
