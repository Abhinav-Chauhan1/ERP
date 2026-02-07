import { db } from './src/lib/db';

async function fixPassword() {
    const hash = '$2b$12$DhyqmECCuxlRZKO0Wb4nBeHpK.NelPfaVrUpN093n402i.Uf6eY9a';

    const result = await db.$executeRaw`
    UPDATE "User"
    SET 
      "passwordHash" = ${hash},
      "password" = NULL,
      "emailVerified" = NOW()
    WHERE 
      role = 'SUPER_ADMIN'
      AND "password" = ${hash}
  `;

    console.log('✅ Updated', result, 'user(s)');
    console.log('🔓 Login should work now!');
    process.exit(0);
}

fixPassword().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
