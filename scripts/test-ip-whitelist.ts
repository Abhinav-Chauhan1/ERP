/**
 * Manual test script for IP Whitelisting
 * Run with: npx tsx scripts/test-ip-whitelist.ts
 */

// Test helper function
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// Mock environment and test
async function runTests() {
  console.log('🧪 Testing IP Whitelisting Utility\n');

  // Test 1: No whitelist configured (allow all)
  console.log('Test 1: No whitelist configured');
  delete process.env.ADMIN_IP_WHITELIST;
  delete require.cache[require.resolve('../src/lib/utils/ip-whitelist')];
  let { isIpWhitelisted } = await import('../src/lib/utils/ip-whitelist');
  
  assert(isIpWhitelisted('192.168.1.1'), 'Should allow any IP when whitelist not configured');
  assert(isIpWhitelisted('10.0.0.1'), 'Should allow any IP when whitelist not configured');
  console.log('');

  // Test 2: Single IP whitelisted
  console.log('Test 2: Single IP whitelisted');
  process.env.ADMIN_IP_WHITELIST = '192.168.1.100';
  delete require.cache[require.resolve('../src/lib/utils/ip-whitelist')];
  ({ isIpWhitelisted } = await import('../src/lib/utils/ip-whitelist'));
  
  assert(isIpWhitelisted('192.168.1.100'), 'Should allow whitelisted IP');
  assert(!isIpWhitelisted('192.168.1.101'), 'Should block non-whitelisted IP');
  console.log('');

  // Test 3: Multiple IPs whitelisted
  console.log('Test 3: Multiple IPs whitelisted');
  process.env.ADMIN_IP_WHITELIST = '192.168.1.100,10.0.0.50,172.16.0.1';
  delete require.cache[require.resolve('../src/lib/utils/ip-whitelist')];
  ({ isIpWhitelisted } = await import('../src/lib/utils/ip-whitelist'));
  
  assert(isIpWhitelisted('192.168.1.100'), 'Should allow first whitelisted IP');
  assert(isIpWhitelisted('10.0.0.50'), 'Should allow second whitelisted IP');
  assert(isIpWhitelisted('172.16.0.1'), 'Should allow third whitelisted IP');
  assert(!isIpWhitelisted('192.168.1.101'), 'Should block non-whitelisted IP');
  console.log('');

  // Test 4: CIDR notation
  console.log('Test 4: CIDR notation');
  process.env.ADMIN_IP_WHITELIST = '192.168.1.0/24';
  delete require.cache[require.resolve('../src/lib/utils/ip-whitelist')];
  ({ isIpWhitelisted } = await import('../src/lib/utils/ip-whitelist'));
  
  assert(isIpWhitelisted('192.168.1.1'), 'Should allow IP in CIDR range');
  assert(isIpWhitelisted('192.168.1.100'), 'Should allow IP in CIDR range');
  assert(isIpWhitelisted('192.168.1.255'), 'Should allow IP in CIDR range');
  assert(!isIpWhitelisted('192.168.2.1'), 'Should block IP outside CIDR range');
  console.log('');

  // Test 5: Multiple CIDR ranges
  console.log('Test 5: Multiple CIDR ranges');
  process.env.ADMIN_IP_WHITELIST = '192.168.1.0/24,10.0.0.0/16';
  delete require.cache[require.resolve('../src/lib/utils/ip-whitelist')];
  ({ isIpWhitelisted } = await import('../src/lib/utils/ip-whitelist'));
  
  assert(isIpWhitelisted('192.168.1.50'), 'Should allow IP in first CIDR range');
  assert(isIpWhitelisted('10.0.5.100'), 'Should allow IP in second CIDR range');
  assert(!isIpWhitelisted('172.16.0.1'), 'Should block IP outside all CIDR ranges');
  console.log('');

  // Test 6: Localhost handling
  console.log('Test 6: Localhost handling');
  process.env.ADMIN_IP_WHITELIST = '127.0.0.1,192.168.1.100';
  delete require.cache[require.resolve('../src/lib/utils/ip-whitelist')];
  ({ isIpWhitelisted } = await import('../src/lib/utils/ip-whitelist'));
  
  assert(isIpWhitelisted('127.0.0.1'), 'Should allow localhost when whitelisted');
  assert(isIpWhitelisted('::1'), 'Should allow IPv6 localhost when IPv4 localhost whitelisted');
  assert(isIpWhitelisted('localhost'), 'Should allow localhost string when whitelisted');
  console.log('');

  // Test 7: getClientIp
  console.log('Test 7: getClientIp function');
  const { getClientIp } = await import('../src/lib/utils/ip-whitelist');
  
  const headers1 = new Headers();
  headers1.set('x-forwarded-for', '192.168.1.100, 10.0.0.1');
  assert(getClientIp(headers1) === '192.168.1.100', 'Should extract first IP from x-forwarded-for');
  
  const headers2 = new Headers();
  headers2.set('x-real-ip', '192.168.1.100');
  assert(getClientIp(headers2) === '192.168.1.100', 'Should extract IP from x-real-ip');
  
  const headers3 = new Headers();
  headers3.set('cf-connecting-ip', '192.168.1.100');
  assert(getClientIp(headers3) === '192.168.1.100', 'Should extract IP from cf-connecting-ip');
  
  const headers4 = new Headers();
  assert(getClientIp(headers4) === '127.0.0.1', 'Should return localhost as fallback');
  console.log('');

  // Test 8: createIpBlockedResponse
  console.log('Test 8: createIpBlockedResponse function');
  const { createIpBlockedResponse } = await import('../src/lib/utils/ip-whitelist');
  const response = createIpBlockedResponse();
  
  assert(response.status === 403, 'Should return 403 status');
  assert(response.headers.get('Content-Type') === 'application/json', 'Should have JSON content type');
  
  const body = await response.json();
  assert(body.success === false, 'Response should have success: false');
  assert(body.error.includes('Access denied'), 'Response should contain error message');
  console.log('');

  console.log('🎉 All tests passed!');
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
