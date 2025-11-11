# 🚀 Database Migration Instructions

## ⚠️ IMPORTANT: You must run this migration before using the Settings page

The Student Settings feature requires a database migration to add the new `StudentSettings` table.

## Steps to Run Migration

### 1. Stop Your Development Server
Press `Ctrl+C` in your terminal to stop the Next.js dev server.

### 2. Run the Migration Command

```bash
npx prisma migrate dev --name add_student_settings
```

This command will:
- Create the `StudentSettings` table
- Add `phone` and `emergencyPhone` fields to the `Student` table
- Create new enums: `ProfileVisibility`, `Theme`, `TimeFormat`
- Generate the updated Prisma Client

### 3. Verify Migration Success

You should see output like:
```
✔ Generated Prisma Client
✔ The migration has been applied successfully
```

### 4. Restart Your Development Server

```bash
npm run dev
```

### 5. Test the Settings Page

Navigate to: `http://localhost:3000/student/settings`

## Alternative: If Migration Fails

If you encounter issues with the migration, you can:

### Option A: Reset Database (Development Only)
```bash
npx prisma migrate reset
npx prisma migrate dev
```
⚠️ **Warning:** This will delete all data in your database!

### Option B: Push Schema (Quick Test)
```bash
npx prisma db push
```
This pushes the schema without creating a migration file.

### Option C: Manual Migration
1. Check your database connection in `.env`
2. Ensure PostgreSQL is running
3. Try generating the client first:
   ```bash
   npx prisma generate
   ```
4. Then run the migration again

## Troubleshooting

### Error: "EPERM: operation not permitted"
- **Cause:** Development server is still running
- **Solution:** Stop the dev server completely and try again

### Error: "Database connection failed"
- **Cause:** PostgreSQL is not running or connection string is wrong
- **Solution:** 
  1. Check if PostgreSQL is running
  2. Verify `DATABASE_URL` in `.env` file
  3. Test connection: `npx prisma db pull`

### Error: "Migration already exists"
- **Cause:** Migration was partially applied
- **Solution:** 
  ```bash
  npx prisma migrate resolve --applied add_student_settings
  ```

### Error: "Table already exists"
- **Cause:** Schema was pushed but migration wasn't recorded
- **Solution:**
  ```bash
  npx prisma migrate resolve --applied add_student_settings
  ```

## What Gets Created

### New Table: StudentSettings
```sql
CREATE TABLE "StudentSettings" (
  "id" TEXT PRIMARY KEY,
  "studentId" TEXT UNIQUE NOT NULL,
  "emailNotifications" BOOLEAN DEFAULT true,
  "assignmentReminders" BOOLEAN DEFAULT true,
  "examReminders" BOOLEAN DEFAULT true,
  "attendanceAlerts" BOOLEAN DEFAULT true,
  "feeReminders" BOOLEAN DEFAULT true,
  "eventNotifications" BOOLEAN DEFAULT true,
  "announcementNotifications" BOOLEAN DEFAULT true,
  "profileVisibility" "ProfileVisibility" DEFAULT 'PRIVATE',
  "showEmail" BOOLEAN DEFAULT false,
  "showPhone" BOOLEAN DEFAULT false,
  "theme" "Theme" DEFAULT 'LIGHT',
  "language" TEXT DEFAULT 'en',
  "dateFormat" TEXT DEFAULT 'MM/DD/YYYY',
  "timeFormat" "TimeFormat" DEFAULT 'TWELVE_HOUR',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP,
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
);
```

### New Enums
```sql
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'CLASSMATES_ONLY');
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');
CREATE TYPE "TimeFormat" AS ENUM ('TWELVE_HOUR', 'TWENTY_FOUR_HOUR');
```

### Updated Student Table
```sql
ALTER TABLE "Student" 
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "emergencyPhone" TEXT;
```

## After Migration

Once the migration is complete:

1. ✅ The Settings page will work properly
2. ✅ Default settings will be created automatically for each student
3. ✅ All settings changes will be persisted to the database
4. ✅ No more "Cannot read properties of undefined" errors

## Need Help?

If you continue to have issues:
1. Check the error message carefully
2. Ensure your database is accessible
3. Verify your `.env` file has correct `DATABASE_URL`
4. Try running `npx prisma studio` to verify database connection
5. Check Prisma logs for detailed error information

---

**Remember:** Always backup your database before running migrations in production!
