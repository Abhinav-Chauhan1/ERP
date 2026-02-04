#!/usr/bin/env tsx

/**
 * Test Setup Wizard API Endpoint
 * This script tests the API endpoint directly
 */

import { NextRequest } from "next/server";

async function testApiEndpoint() {
  console.log("🔍 Testing Setup Wizard API Endpoint...\n");

  try {
    // Get the first school ID from database
    const { db } = await import("../src/lib/db");
    const school = await db.school.findFirst({
      select: { id: true, name: true }
    });

    if (!school) {
      console.log("❌ No schools found");
      return;
    }

    console.log(`📋 Testing with school: ${school.name} (${school.id})`);

    // Test the API route handler directly
    const { POST } = await import("../src/app/api/super-admin/schools/[id]/onboarding/route");
    
    // Create a mock request
    const mockRequest = {
      json: async () => ({ action: "launch" })
    } as NextRequest;

    const mockParams = Promise.resolve({ id: school.id });

    console.log("\n🚀 Calling API endpoint...");
    
    try {
      const response = await POST(mockRequest, { params: mockParams });
      const result = await response.json();
      
      console.log("✅ API Response:", {
        status: response.status,
        result: result
      });
      
    } catch (error) {
      console.log("❌ API call failed:", error.message);
      
      if (error.message.includes("Super admin access required")) {
        console.log("   ℹ️  This is expected - the API requires super admin authentication");
        console.log("   ℹ️  The issue is likely that you're not logged in as a super admin");
      }
    }

    await db.$disconnect();

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testApiEndpoint().catch(console.error);