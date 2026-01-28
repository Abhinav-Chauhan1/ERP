#!/usr/bin/env tsx

/**
 * Manual test script for the school validation endpoint
 * This script tests the /api/auth/school-validate endpoint with various scenarios
 */

import { db } from '@/lib/db'
import { SchoolStatus } from '@prisma/client'

async function testSchoolValidateEndpoint() {
  console.log('🧪 Testing School Validation Endpoint\n')

  // Create test schools
  console.log('📝 Creating test schools...')
  
  const activeSchool = await db.school.create({
    data: {
      name: 'Test Active School',
      schoolCode: 'TESTAPI001',
      status: SchoolStatus.ACTIVE,
      isOnboarded: true
    }
  })

  const suspendedSchool = await db.school.create({
    data: {
      name: 'Test Suspended School',
      schoolCode: 'TESTSUSPENDED001',
      status: SchoolStatus.SUSPENDED,
      isOnboarded: false
    }
  })

  console.log(`✅ Created active school: ${activeSchool.schoolCode}`)
  console.log(`✅ Created suspended school: ${suspendedSchool.schoolCode}\n`)

  // Test cases
  const testCases = [
    {
      name: 'Valid active school code',
      schoolCode: 'TESTAPI001',
      expectedStatus: 200
    },
    {
      name: 'Suspended school code',
      schoolCode: 'TESTSUSPENDED001',
      expectedStatus: 403
    },
    {
      name: 'Non-existent school code',
      schoolCode: 'NONEXISTENT999',
      expectedStatus: 404
    },
    {
      name: 'Empty school code',
      schoolCode: '',
      expectedStatus: 400
    },
    {
      name: 'Case insensitive school code',
      schoolCode: 'testapi001',
      expectedStatus: 200
    },
    {
      name: 'School code with whitespace',
      schoolCode: '  TESTAPI001  ',
      expectedStatus: 200
    }
  ]

  console.log('🚀 Running test cases...\n')

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`)
      console.log(`Input: "${testCase.schoolCode}"`)

      const response = await fetch('http://localhost:3000/api/auth/school-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ schoolCode: testCase.schoolCode })
      })

      const data = await response.json()

      console.log(`Status: ${response.status} (expected: ${testCase.expectedStatus})`)
      console.log(`Response:`, JSON.stringify(data, null, 2))

      if (response.status === testCase.expectedStatus) {
        console.log('✅ PASS\n')
      } else {
        console.log('❌ FAIL\n')
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error}\n`)
    }
  }

  // Cleanup
  console.log('🧹 Cleaning up test data...')
  await db.school.deleteMany({
    where: {
      id: {
        in: [activeSchool.id, suspendedSchool.id]
      }
    }
  })
  console.log('✅ Cleanup complete')

  console.log('\n🎉 School validation endpoint testing complete!')
}

// Run the test if this script is executed directly
if (require.main === module) {
  testSchoolValidateEndpoint()
    .then(() => {
      console.log('\n✅ All tests completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error)
      process.exit(1)
    })
}

export { testSchoolValidateEndpoint }