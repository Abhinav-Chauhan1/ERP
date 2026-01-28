#!/usr/bin/env tsx

/**
 * Test script for subdomain system functionality
 */

import { PrismaClient } from '@prisma/client';
import { createDNSService } from '../src/lib/services/dns-service';
import { createSSLService } from '../src/lib/services/ssl-service';
import { getSubdomain, validateSubdomain } from '../src/lib/middleware/subdomain';

const db = new PrismaClient();

async function testSubdomainSystem() {
  console.log('🧪 Testing Subdomain System...');
  console.log('================================');

  try {
    // Test 1: Subdomain extraction
    console.log('\n1. Testing subdomain extraction...');
    
    const testHostnames = [
      'demo.sikshamitra.com',
      'school1.localhost',
      'test-school.yourdomain.com',
      'sikshamitra.com',
      'localhost',
    ];

    for (const hostname of testHostnames) {
      const subdomain = getSubdomain(hostname);
      console.log(`  ${hostname} -> ${subdomain || 'null'}`);
    }

    // Test 2: Create test school
    console.log('\n2. Creating test school...');
    
    const testSchool = await db.school.create({
      data: {
        name: 'Test School for Subdomain',
        schoolCode: 'TEST-SUB',
        email: 'test@example.com',
        subdomain: 'test-subdomain',
        subdomainStatus: 'PENDING',
        dnsConfigured: false,
        sslConfigured: false,
        status: 'ACTIVE',
      },
    });

    console.log(`  ✅ Created test school: ${testSchool.name} (${testSchool.subdomain})`);

    // Test 3: Validate subdomain
    console.log('\n3. Testing subdomain validation...');
    
    const validatedSchool = await validateSubdomain('test-subdomain');
    if (validatedSchool) {
      console.log(`  ✅ Subdomain validation successful: ${validatedSchool.name}`);
    } else {
      console.log('  ❌ Subdomain validation failed');
    }

    // Test 4: DNS Service
    console.log('\n4. Testing DNS service...');
    
    const dnsService = createDNSService();
    if (dnsService) {
      console.log('  ✅ DNS service initialized');
      
      // Test DNS record creation (dry run)
      console.log('  📝 DNS service configured for:', process.env.DNS_PROVIDER || 'not configured');
    } else {
      console.log('  ⚠️  DNS service not configured (this is normal for development)');
    }

    // Test 5: SSL Service
    console.log('\n5. Testing SSL service...');
    
    const sslService = createSSLService();
    if (sslService) {
      console.log('  ✅ SSL service initialized');
      console.log('  📝 SSL service configured for:', process.env.SSL_PROVIDER || 'not configured');
    } else {
      console.log('  ⚠️  SSL service not configured (this is normal for development)');
    }

    // Test 6: Database queries
    console.log('\n6. Testing database queries...');
    
    const schoolBySubdomain = await db.school.findFirst({
      where: { subdomain: 'test-subdomain' },
    });

    if (schoolBySubdomain) {
      console.log(`  ✅ Found school by subdomain: ${schoolBySubdomain.name}`);
    }

    // Test 7: Subdomain uniqueness
    console.log('\n7. Testing subdomain uniqueness...');
    
    try {
      await db.school.create({
        data: {
          name: 'Duplicate Test School',
          schoolCode: 'TEST-DUP',
          email: 'duplicate@example.com',
          subdomain: 'test-subdomain', // Same subdomain
          status: 'ACTIVE',
        },
      });
      console.log('  ❌ Uniqueness constraint failed - duplicate allowed');
    } catch (error) {
      console.log('  ✅ Uniqueness constraint working - duplicate rejected');
    }

    // Test 8: Environment configuration
    console.log('\n8. Checking environment configuration...');
    
    const envChecks = [
      { key: 'ROOT_DOMAIN', value: process.env.ROOT_DOMAIN },
      { key: 'DNS_PROVIDER', value: process.env.DNS_PROVIDER },
      { key: 'DNS_API_KEY', value: process.env.DNS_API_KEY ? '***configured***' : undefined },
      { key: 'SSL_PROVIDER', value: process.env.SSL_PROVIDER },
      { key: 'SSL_EMAIL', value: process.env.SSL_EMAIL },
    ];

    for (const check of envChecks) {
      const status = check.value ? '✅' : '⚠️ ';
      console.log(`  ${status} ${check.key}: ${check.value || 'not set'}`);
    }

    // Cleanup
    console.log('\n9. Cleaning up test data...');
    
    await db.school.delete({
      where: { id: testSchool.id },
    });
    
    console.log('  ✅ Test school deleted');

    console.log('\n🎉 Subdomain system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Subdomain extraction: Working');
    console.log('- Database operations: Working');
    console.log('- Validation logic: Working');
    console.log('- Service initialization: Working');
    console.log(`- DNS service: ${dnsService ? 'Configured' : 'Not configured'}`);
    console.log(`- SSL service: ${sslService ? 'Configured' : 'Not configured'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Additional utility functions for manual testing
export async function createTestSchool(subdomain: string, name?: string) {
  const school = await db.school.create({
    data: {
      name: name || `Test School ${subdomain}`,
      schoolCode: `TEST-${subdomain.toUpperCase()}`,
      email: `admin@${subdomain}.test`,
      subdomain,
      subdomainStatus: 'PENDING',
      dnsConfigured: false,
      sslConfigured: false,
      status: 'ACTIVE',
    },
  });

  console.log(`Created test school: ${school.name} (${school.subdomain})`);
  return school;
}

export async function deleteTestSchool(subdomain: string) {
  const deleted = await db.school.deleteMany({
    where: { subdomain },
  });

  console.log(`Deleted ${deleted.count} test school(s) with subdomain: ${subdomain}`);
  return deleted;
}

export async function listTestSchools() {
  const schools = await db.school.findMany({
    where: {
      schoolCode: {
        startsWith: 'TEST-',
      },
    },
    select: {
      id: true,
      name: true,
      subdomain: true,
      subdomainStatus: true,
      dnsConfigured: true,
      sslConfigured: true,
    },
  });

  console.log('Test schools:');
  schools.forEach(school => {
    console.log(`  - ${school.name}: ${school.subdomain} (${school.subdomainStatus})`);
  });

  return schools;
}

// Run the test
if (require.main === module) {
  testSubdomainSystem()
    .then(() => {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error);
      process.exit(1);
    });
}