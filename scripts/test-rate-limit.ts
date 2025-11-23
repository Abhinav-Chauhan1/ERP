/**
 * Rate Limit Testing Script
 * Tests the rate limiting functionality by making multiple requests
 * 
 * Usage: tsx scripts/test-rate-limit.ts
 */

async function testRateLimit() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const endpoint = `${baseUrl}/api/test-rate-limit`;
  
  console.log("🧪 Testing Rate Limiting...");
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`⚙️  Configuration: 100 requests per 10 seconds\n`);

  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;

  // Test 1: Make 105 requests rapidly to trigger rate limit
  console.log("Test 1: Making 105 rapid requests...");
  
  const requests = [];
  for (let i = 0; i < 105; i++) {
    requests.push(
      fetch(endpoint)
        .then(async (response) => {
          const headers = {
            limit: response.headers.get("X-RateLimit-Limit"),
            remaining: response.headers.get("X-RateLimit-Remaining"),
            reset: response.headers.get("X-RateLimit-Reset"),
          };

          if (response.status === 429) {
            rateLimitedCount++;
            const retryAfter = response.headers.get("Retry-After");
            console.log(
              `❌ Request ${i + 1}: Rate limited (429) - Retry after ${retryAfter}s`
            );
            return { status: 429, headers };
          } else if (response.ok) {
            successCount++;
            if (i < 5 || i > 98) {
              // Log first 5 and last few requests
              console.log(
                `✅ Request ${i + 1}: Success (${response.status}) - Remaining: ${headers.remaining}`
              );
            }
            return { status: response.status, headers };
          } else {
            errorCount++;
            console.log(`⚠️  Request ${i + 1}: Error (${response.status})`);
            return { status: response.status, headers };
          }
        })
        .catch((error) => {
          errorCount++;
          console.error(`❌ Request ${i + 1}: Failed -`, error.message);
          return { status: 0, error: error.message };
        })
    );
  }

  await Promise.all(requests);

  console.log("\n📊 Test Results:");
  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`❌ Rate limited requests: ${rateLimitedCount}`);
  console.log(`⚠️  Error requests: ${errorCount}`);

  // Verify results
  if (successCount <= 100 && rateLimitedCount >= 5) {
    console.log("\n✅ Rate limiting is working correctly!");
    console.log(`   - Allowed ~100 requests`);
    console.log(`   - Blocked ${rateLimitedCount} requests with 429 status`);
  } else {
    console.log("\n⚠️  Rate limiting may not be working as expected");
    console.log(`   - Expected: ~100 successful, ~5 rate limited`);
    console.log(`   - Actual: ${successCount} successful, ${rateLimitedCount} rate limited`);
  }

  // Test 2: Wait and verify reset
  console.log("\n\nTest 2: Waiting 11 seconds for rate limit reset...");
  await new Promise((resolve) => setTimeout(resolve, 11000));

  console.log("Making a request after reset...");
  const resetResponse = await fetch(endpoint);
  
  if (resetResponse.ok) {
    const remaining = resetResponse.headers.get("X-RateLimit-Remaining");
    console.log(`✅ Rate limit reset successfully! Remaining: ${remaining}`);
  } else {
    console.log(`❌ Request failed after reset: ${resetResponse.status}`);
  }

  console.log("\n✅ Rate limit testing complete!");
}

// Run the test
testRateLimit().catch(console.error);
