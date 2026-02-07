-- Fix super-admin password field
-- Move password hash from 'password' to 'passwordHash'

UPDATE "User"
SET 
  "passwordHash" = '$2b$12$DhyqmECCuxlRZKO0Wb4nBeHpK.NelPfaVrUpN093n402i.Uf6eY9a',
  "password" = NULL,
  "emailVerified" = NOW()
WHERE 
  role = 'SUPER_ADMIN'
  AND "password" = '$2b$12$DhyqmECCuxlRZKO0Wb4nBeHpK.NelPfaVrUpN093n402i.Uf6eY9a';
