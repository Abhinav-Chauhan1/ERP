const { execSync } = require('child_process');

console.log('🌱 Seeding subscription plans...');

try {
  execSync('npx tsx prisma/seed-subscription-plans.ts', { stdio: 'inherit' });
  console.log('✅ Subscription plans seeded successfully!');
} catch (error) {
  console.error('❌ Failed to seed subscription plans:', error.message);
  process.exit(1);
}