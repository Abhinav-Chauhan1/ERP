const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Helper to update a model's unique constraints
function updateModel(modelName, updates) {
    const regex = new RegExp(`model ${modelName} \\{([^}]*)\\}`, 's');
    const match = schema.match(regex);
    if (!match) {
        console.log(`Model ${modelName} not found`);
        return;
    }

    let content = match[1];

    // Apply updates
    if (updates.removeUnique) {
        updates.removeUnique.forEach(field => {
            const fieldRegex = new RegExp(`(\\s+${field}\\s+\\w+)(\\s+@unique)`, 'g');
            content = content.replace(fieldRegex, '$1');
        });
    }

    if (updates.changeUnique) {
        const uniqueRegex = /@@unique\(\[([^\]]+)\]\)/g;
        content = content.replace(uniqueRegex, (match, fields) => {
            return `@@unique([schoolId, ${fields}])`;
        });
    } else if (updates.addUnique) {
        // Add unique constraint before index or at end
        if (content.includes('@@index')) {
            content = content.replace('@@index', `@@unique([${updates.addUnique.join(', ')}])\n  @@index`);
        } else {
            content = content.trimEnd() + `\n\n  @@unique([${updates.addUnique.join(', ')}])\n`;
        }
    }

    // Clean up extra newlines and spacing
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.trimEnd() + '\n';

    schema = schema.replace(regex, `model ${modelName} {${content}}`);
    console.log(`Updated ${modelName}`);
}

// 1. Subject: remove @unique from code, add @@unique([schoolId, code])
updateModel('Subject', { removeUnique: ['code'], addUnique: ['schoolId', 'code'] });

// 2. GradeScale: change @@unique([boardType, grade]) to @@unique([schoolId, boardType, grade])
updateModel('GradeScale', { changeUnique: true });

// 3. Term: add @@unique([schoolId, name])
updateModel('Term', { addUnique: ['schoolId', 'name'] });

// 4. Department: add @@unique([schoolId, name])
updateModel('Department', { addUnique: ['schoolId', 'name'] });

// 5. Class: add @@unique([schoolId, name, academicYearId])
updateModel('Class', { addUnique: ['schoolId', 'name', 'academicYearId'] });

// 6. ClassSection: add @@unique([schoolId, name, classId])
updateModel('ClassSection', { addUnique: ['schoolId', 'name', 'classId'] });

// 7. ClassRoom: add @@unique([schoolId, name])
updateModel('ClassRoom', { addUnique: ['schoolId', 'name'] });

// 8. MessageTemplate: remove @unique from name, add @@unique([schoolId, name])
updateModel('MessageTemplate', { removeUnique: ['name'], addUnique: ['schoolId', 'name'] });

// 9. CertificateTemplate: remove @unique from name, add @@unique([schoolId, name])
updateModel('CertificateTemplate', { removeUnique: ['name'], addUnique: ['schoolId', 'name'] });

// 10. ReportCardTemplate: remove @unique from name, add @@unique([schoolId, name])
updateModel('ReportCardTemplate', { removeUnique: ['name'], addUnique: ['schoolId', 'name'] });

// 11. Vehicle: remove @unique from registrationNo, add @@unique([schoolId, registrationNo])
updateModel('Vehicle', { removeUnique: ['registrationNo'], addUnique: ['schoolId', 'registrationNo'] });

// 12. Driver: remove @unique from licenseNo, add @@unique([schoolId, licenseNo])
updateModel('Driver', { removeUnique: ['licenseNo'], addUnique: ['schoolId', 'licenseNo'] });

fs.writeFileSync(schemaPath, schema);
console.log('Done!');
