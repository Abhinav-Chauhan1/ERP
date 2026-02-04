#!/usr/bin/env tsx

/**
 * Test Database Connection
 * This script tests the database connection and provides solutions
 */

import { PrismaClient } from '@prisma/client';

async function testDatabaseConnection() {
  console.log("🔍 Testing Database Connection...\n");

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log("1. Testing basic connection...");
    
    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connection established");

    // Test a simple query
    console.log("\n2. Testing simple query...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Simple query successful:", result);

    // Test user table access
    console.log("\n3. Testinwait prisma.school.count();
    console.log(`✅ School table accessible - found ${schoolCount} schools`);

    console.log("\n🎉 Database connection is working perfectly!");
    conscess...");
    const schoolCount = aole.log(`✅ User table accessible - found ${userCount} users`);

    // Test school table access
    console.log("\n4. Testing school table acg user table access...");
    const userCount = await prisma.user.count();
    cons