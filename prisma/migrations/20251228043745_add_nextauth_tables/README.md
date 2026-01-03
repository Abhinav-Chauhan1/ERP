# NextAuth v5 Migration

This migration adds the necessary tables and fields for NextAuth v5 authentication.

## Changes

### User Model Updates
- Added `emailVerified` (DateTime?) - Email verification timestamp
- Added `password` (String?) - Hashed password for credentials auth (nullable for OAuth users)
- Added `name` (String?) - Full name for NextAuth compatibility
- Added `image` (String?) - Profile image URL for OAuth providers
- Modified `clerkId` to be nullable (kept temporarily for migration)

### New Tables

#### Account
Stores OAuth provider account information:
- `id` - Primary key
- `userId` - Foreign key to User
- `type` - Account type (oauth, email, etc.)
- `provider` - OAuth provider name (google, github, etc.)
- `providerAccountId` - Provider's user ID
- OAuth tokens and metadata fields

#### Session
Stores active user sessions:
- `id` - Primary key
- `sessionToken` - Unique session token
- `userId` - Foreign key to User
- `expires` - Session expiration timestamp

#### VerificationToken
Stores email verification and password reset tokens:
- `identifier` - Email or user identifier
- `token` - Unique verification token
- `expires` - Token expiration timestamp

## Indexes

The following indexes are created for performance:
- `Account_userId_idx` - Fast lookup of accounts by user
- `Account_provider_providerAccountId_key` - Unique constraint for provider accounts
- `Session_sessionToken_key` - Fast session lookup by token
- `Session_userId_idx` - Fast lookup of sessions by user
- `VerificationToken_token_key` - Fast token lookup
- `VerificationToken_identifier_token_key` - Unique constraint for tokens

## Applying the Migration

### Development
```bash
npx prisma migrate dev
```

### Staging/Production
```bash
# Review the migration first
npx prisma migrate deploy --preview-feature

# Apply the migration
npx prisma migrate deploy
```

## Rollback

If you need to rollback this migration, use the rollback script:

```bash
# Run the rollback SQL
psql $DATABASE_URL -f prisma/migrations/20251228043745_add_nextauth_tables/rollback.sql
```

## Testing

After applying the migration:

1. Verify tables were created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Account', 'Session', 'VerificationToken');
```

2. Verify User table columns:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('emailVerified', 'password', 'name', 'image', 'clerkId');
```

3. Verify indexes:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('Account', 'Session', 'VerificationToken');
```

## Data Migration

After this schema migration, you'll need to run the user data migration script:

```bash
npx ts-node scripts/migrate-users-to-nextauth.ts
```

This will:
- Set password to null for all existing users
- Set emailVerified based on Clerk verification status
- Send password setup emails to all users
- Log migration results

## Notes

- The `clerkId` field is kept temporarily to facilitate data migration
- It will be removed in a future migration after all users have been migrated
- All existing user data and relationships are preserved
- OAuth users will have null passwords (they authenticate via OAuth)
- Credentials users will need to set up passwords after migration
