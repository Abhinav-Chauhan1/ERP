#!/usr/bin/env tsx

/**
 * Simple migration approach - just add the new tables first
 */

import { execSync } from 'child_process';
import fs from 'fs';

async function runSimpleMigration() {
  console.log('🔄 Running simple migration approach...\n');

  // Step 1: Create a minimal schema with just the new multi-school tables
  console.log('1️⃣  Creating minimal schema with new tables only...');

  const minimalSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Multi-School Architecture Models
model School {
  id         String       @id @default(cuid())
  name       String
  schoolCode String       @unique // Human-friendly unique identifier
  phone      String?
  email      String?
  address    String?
  domain     String? // Custom domain
  subdomain  String? // Subdomain for multi-tenant hosting

  plan       String       @default("STARTER")
  status     String       @default("ACTIVE")

  // Setup Wizard & Onboarding
  isOnboarded        Boolean   @default(false)
  onboardingStep     Int       @default(0)
  onboardingCompletedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships (will be added after migration)
  @@map("schools")
}

model Subscription {
  id            String   @id @default(cuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  billingCycle  String   @default("MONTHLY")
  startDate     DateTime @default(now())
  endDate       DateTime
  isActive      Boolean  @default(true)
  paymentStatus String   @default("PAID")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@map("subscriptions")
}

model UsageCounter {
  id          String   @id @default(cuid())
  schoolId    String
  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  month       String // YYYY-MM format
  whatsappUsed Int     @default(0)
  smsUsed      Int     @default(0)
  whatsappLimit Int    @default(1000) // Monthly limit
  smsLimit      Int    @default(1000) // Monthly limit
  storageUsedMB Float  @default(0)
  storageLimitMB Int   @default(1024) // 1GB default

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([schoolId, month])
  @@index([schoolId])
  @@map("usage_counters")
}

model UserSchool {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  schoolId String
  school   School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  role     String   @default("STUDENT")
  isActive Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, schoolId])
  @@index([userId])
  @@index([schoolId])
  @@map("user_schools")
}

// Existing models with minimal changes
model User {
  id    String @id @default(cuid())
  email String @unique

  // NextAuth v5 fields
  emailVerified DateTime? // Email verification timestamp
  password      String? // Hashed password (nullable for OAuth users)
  name          String? // Full name for NextAuth compatibility
  image         String? // Profile image for OAuth

  firstName String
  lastName  String
  phone     String?
  avatar    String?
  role      String @default("STUDENT")
  active    Boolean  @default(true)

  // Two-Factor Authentication fields
  twoFactorEnabled     Boolean @default(false)
  twoFactorSecret      String? // Encrypted TOTP secret
  twoFactorBackupCodes String? // Encrypted backup codes (JSON array)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // NextAuth v5 relationships
  accounts Account[]
  sessions Session[]

  // Role-based relationships
  teacher       Teacher?
  student       Student?
  parent        Parent?
  administrator Administrator?

  // Multi-school relationship
  userSchools   UserSchool[]

  // Common relationships
  sentMessages     Message[]        @relation("SentMessages")
  receivedMessages Message[]        @relation("ReceivedMessages")
  notifications    Notification[]
  documents        Document[]
  auditLogs        AuditLog[]
  messageHistory   MessageHistory[] @relation("MessageHistorySentBy")
  userPermissions  UserPermission[]
  eventRSVPs       EventRSVP[]
  savedReports     SavedReportConfig[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}`;

  fs.writeFileSync('./prisma/schema.prisma', minimalSchema);
  console.log('✅ Created minimal schema');

  // Step 2: Push the minimal schema
  console.log('\n2️⃣  Applying minimal schema...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Minimal schema applied');
  } catch (error) {
    console.error('❌ Schema push failed:', error);
    return;
  }

  // Step 3: Create initial school and relationships
  console.log('\n3️⃣  Creating initial school and relationships...');
  try {
    execSync('npx tsx scripts/setup-multi-school-migration.ts', { stdio: 'inherit' });
    console.log('✅ Initial data created');
  } catch (error) {
    console.error('❌ Initial data creation failed:', error);
    return;
  }

  // Step 4: Restore full schema
  console.log('\n4️⃣  Restoring full schema...');
  execSync('git checkout HEAD -- prisma/schema.prisma', { stdio: 'inherit' });
  console.log('✅ Full schema restored');

  // Step 5: Apply full schema
  console.log('\n5️⃣  Applying full schema...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Full schema applied');
  } catch (error) {
    console.error('❌ Full schema push failed:', error);
    return;
  }

  console.log('\n🎉 Migration completed successfully!');
  console.log('Run: npx tsx scripts/final-security-verification.ts');
}

runSimpleMigration().catch(console.error);