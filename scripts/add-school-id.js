#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of models that should NOT have schoolId (global/system models)
const globalModels = [
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

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Get all model names
const modelRegex = /^model (\w+) \{/gm;
const models = [];
let match;
while ((match = modelRegex.exec(schema)) !== null) {
  models.push(match[1]);
}

console.log('Found models:', models.length);
console.log('Models to update (excluding global models):');

const modelsToUpdate = models.filter(model => !globalModels.includes(model));
console.log(modelsToUpdate.join(', '));

// For each model that needs schoolId, add it after the id field
modelsToUpdate.forEach(model => {
  // Check if schoolId already exists in this model
  const modelContentRegex = new RegExp(`model ${model} \\{([^}]*)\\}`, 's');
  const match = schema.match(modelContentRegex);

  if (match && match[1].includes('schoolId')) {
    console.log(`Skipping ${model} - already has schoolId`);
    return;
  }

  const modelRegex = new RegExp(`(model ${model} \\{[^}]*id\\s+String\\s+@id[^}]*)(?=\\n)`, 's');
  const replacement = `$1\n  schoolId String\n  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)`;

  if (schema.match(modelRegex)) {
    schema = schema.replace(modelRegex, replacement);
    console.log(`Updated ${model}`);
  } else {
    console.log(`Could not find pattern for ${model}`);
  }
});

// Add index at the end of each model
// Add index at the end of each model
modelsToUpdate.forEach(model => {
  // Check if index already exists
  const modelContentRegex = new RegExp(`model ${model} \\{([^}]*)\\}`, 's');
  const match = schema.match(modelContentRegex);

  if (match && match[1].includes('@@index([schoolId])')) {
    return;
  }

  const modelRegex = new RegExp(`(model ${model} \\{[^}]*)(?=\\n\\}\n\n|$)`, 's');
  const replacement = `$1\n\n  @@index([schoolId])\n`;

  if (schema.match(modelRegex)) {
    schema = schema.replace(modelRegex, replacement);
  }
});

console.log('Writing updated schema...');
fs.writeFileSync(schemaPath, schema);
console.log('Done!');