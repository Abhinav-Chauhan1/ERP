const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'prisma', 'seed.ts');
let startSeed = fs.readFileSync(seedPath, 'utf8');

// List of models that should NOT have schoolId injected (global/system models)
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

let seed = startSeed;

// 1. Inject default school creation at the top of main()
if (!seed.includes('const school = await prisma.school.create')) {
    const schoolSetup = `
  // 0. Create Default School
  console.log('🏫 Creating default school...');
  const school = await prisma.school.create({
    data: {
      name: 'Springfield High School',
      schoolCode: 'SPRINGFIELD',
      plan: 'STARTER',
      status: 'ACTIVE',
      isOnboarded: true,
    }
  });
  const defaultSchool = school; // Alias for convenience
  console.log(\`   Created school: \${school.name} (\${school.id})\`);
`;

    seed = seed.replace('console.log(\'🌱 Starting database seeding...\');', 'console.log(\'🌱 Starting database seeding...\');' + schoolSetup);
}

// 2. Inject schoolId into all create calls for non-global models
// Regex to find prisma.modelName.create({ data: {
const createRegex = /prisma\.(\w+)\.create\(\s*\{\s*data:\s*\{/g;

seed = seed.replace(createRegex, (match, modelName) => {
    // Check if model starts with lowercase (prisma client property)
    // Convert to PascalCase to check against globalModels
    const modelPascal = modelName.charAt(0).toUpperCase() + modelName.slice(1);

    if (globalModels.includes(modelPascal)) {
        return match; // Don't modify global models
    }

    // Inject schoolId
    return `${match}\n        schoolId: school.id,`;
});

// 3. Fix specific issues (e.g., UserSchool creation needs manual handling if automated logic misses it)
// But UserSchool is global, so it's skipped by regex.
// However, UserSchool creation in existing seed might need schoolId.
// Existing seed doesn't create UserSchool because it didn't exist.
// We need to add UserSchool creation for users.

// Add UserSchool creation logic at the end
const userSchoolLogic = `
  // Create UserSchool relationships for all users
  console.log('🔗 Creating UserSchool relationships...');
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    await prisma.userSchool.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        role: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'STUDENT', // Default to STUDENT, adjust if needed
        isActive: true,
      }
    });
  }
`;

if (!seed.includes('Creating UserSchool relationships')) {
    seed = seed.replace('// 1. Create System Settings', userSchoolLogic + '\n  // 1. Create System Settings');
    // Wait, placing it at the beginning? No, users must exist first.
    // Ideally place it at the end of the script before finishing.
    // Existing seed ends with 'console.log ...'.
    // Let's append it before the end of main function.
    // Assuming main() ends with last closing brace.
}

console.log('Writing updated seed.ts...');
fs.writeFileSync(seedPath, seed);
console.log('Done!');
