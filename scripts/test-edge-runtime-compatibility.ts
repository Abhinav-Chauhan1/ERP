#!/usr/bin/env tsx

/**
 * Test Edge Runtime Compatibility
 * Verifies that our security implementations work in Edge Runtime
 */

import { generateCSRFToken, validateCSRFToken } from '../src/lib/middleware/csrf-protection';

console.log('🧪 Testing Edge Runtime Compatibility\n');

async function testWebCryptoAPI() {
  console.log('1. Testing Web Crypto API...');
  
  try {
    // Test crypto.getRandomValues (used in CSRF token generation)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    
    if (array.some(byte => byte !== 0)) {
      console.log('   ✅ crypto.getRandomValues working');
    } else {
      console.log('   ❌ crypto.getRandomValues not generating random values');
      return false;
    }

    // Test crypto.subtle.digest (used in CSRF token validation)
    const encoder = new TextEncoder();
    const data = encoder.encode('test-string');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    const hash = Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
    
    if (hash.length === 64) {
      console.log('   ✅ crypto.subtle.digest working');
    } else {
      console.log('   ❌ crypto.subtle.digest not working correctly');
      return false;
    }

    return true;
  } catch (error) {
    console.log('   ❌ Web Crypto API test failed:', error.message);
    return false;
  }
}

async function testCSRFTokenGeneration() {
  console.log('\n2. Testing CSRF Token Generation...');
  
  try {
    const token1 = generateCSRFToken();
    const token2 = generateCSRFToken();
    
    if (!token1 || !token2) {
      console.log('   ❌ Token generation failed');
      return false;
    }
    
    if (token1 === token2) {
      console.log('   ❌ Tokens are not unique');
      return false;
    }
    
    if (token1.length !== 64) {
      console.log('   ❌ Token length incorrect:', token1.length);
      return false;
    }
    
    // Test that tokens are valid hex
    if (!/^[0-9a-f]+$/i.test(token1)) {
      console.log('   ❌ Token is not valid hex');
      return false;
    }
    
    console.log('   ✅ CSRF token generation working');
    return true;
  } catch (error) {
    console.log('   ❌ CSRF token generation failed:', error.message);
    return false;
  }
}

async function testCSRFTokenValidation() {
  console.log('\n3. Testing CSRF Token Validation...');
  
  try {
    const token = generateCSRFToken();
    
    // Mock request with matching tokens
    const validRequest = {
      headers: new Map([['x-csrf-token', token]]),
      cookies: new Map([['csrf-token', { value: token }]]),
    } as any;
    
    const isValid = await validateCSRFToken(validRequest);
    if (!isValid) {
      console.log('   ❌ Valid token validation failed');
      return false;
    }
    
    // Mock request with mismatched tokens
    const invalidRequest = {
      headers: new Map([['x-csrf-token', token]]),
      cookies: new Map([['csrf-token', { value: generateCSRFToken() }]]),
    } as any;
    
    const isInvalid = await validateCSRFToken(invalidRequest);
    if (isInvalid) {
      console.log('   ❌ Invalid token validation passed');
      return false;
    }
    
    console.log('   ✅ CSRF token validation working');
    return true;
  } catch (error) {
    console.log('   ❌ CSRF token validation failed:', error.message);
    return false;
  }
}

async function testPerformance() {
  console.log('\n4. Testing Performance...');
  
  try {
    const iterations = 1000;
    
    // Test token generation performance
    console.log(`   Testing ${iterations} token generations...`);
    const genStart = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      generateCSRFToken();
    }
    
    const genEnd = Date.now();
    const genTime = genEnd - genStart;
    const genAvg = genTime / iterations;
    
    console.log(`   Token generation: ${genTime}ms total, ${genAvg.toFixed(3)}ms avg`);
    
    // Test token validation performance
    console.log(`   Testing ${iterations} token validations...`);
    const token = generateCSRFToken();
    const mockRequest = {
      headers: new Map([['x-csrf-token', token]]),
      cookies: new Map([['csrf-token', { value: token }]]),
    } as any;
    
    const valStart = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await validateCSRFToken(mockRequest);
    }
    
    const valEnd = Date.now();
    const valTime = valEnd - valStart;
    const valAvg = valTime / iterations;
    
    console.log(`   Token validation: ${valTime}ms total, ${valAvg.toFixed(3)}ms avg`);
    
    if (genAvg > 1 || valAvg > 5) {
      console.log('   ⚠️  Performance slower than expected');
    } else {
      console.log('   ✅ Performance acceptable');
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Performance test failed:', error.message);
    return false;
  }
}

async function main() {
  const results = {
    webCrypto: await testWebCryptoAPI(),
    tokenGeneration: await testCSRFTokenGeneration(),
    tokenValidation: await testCSRFTokenValidation(),
    performance: await testPerformance(),
  };

  console.log('\n📊 Test Results:');
  console.log('=================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 Overall Status:');
  if (allPassed) {
    console.log('✅ All Edge Runtime compatibility tests passed!');
    console.log('🚀 CSRF protection is ready for Edge Runtime deployment.');
  } else {
    console.log('❌ Some Edge Runtime compatibility tests failed.');
    console.log('🔧 Please review the failed tests above.');
  }

  console.log('\n📚 Next Steps:');
  console.log('- Test in actual Edge Runtime environment');
  console.log('- Deploy to Vercel Edge Functions for real-world testing');
  console.log('- Monitor performance in production');
  
  process.exit(allPassed ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error during testing:', error);
  process.exit(1);
});

// Run the tests
main().catch((error) => {
  console.error('\n❌ Test script failed:', error);
  process.exit(1);
});