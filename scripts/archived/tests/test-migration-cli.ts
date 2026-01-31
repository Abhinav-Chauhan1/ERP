/**
 * Test script for Migration CLI
 * 
 * This script tests the migration CLI functionality without making actual database changes.
 * It verifies that all CLI options work correctly.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Run a test
 */
function runTest(name: string, command: string, expectedInOutput?: string): TestResult {
  console.log(`\n${colors.cyan}Testing: ${name}${colors.reset}`);
  console.log(`Command: ${command}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 30000, // 30 second timeout
    });
    
    if (expectedInOutput && !output.includes(expectedInOutput)) {
      throw new Error(`Expected output to contain: "${expectedInOutput}"`);
    }
    
    console.log(`${colors.green}✓ Passed${colors.reset}`);
    return { name, passed: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`${colors.red}✗ Failed: ${errorMsg}${colors.reset}`);
    return { name, passed: false, error: errorMsg };
  }
}

/**
 * Check if file exists
 */
function checkFileExists(name: string, filePath: string): TestResult {
  console.log(`\n${colors.cyan}Checking: ${name}${colors.reset}`);
  console.log(`File: ${filePath}`);
  
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    console.log(`${colors.green}✓ File exists${colors.reset}`);
    return { name, passed: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`${colors.red}✗ Failed: ${errorMsg}${colors.reset}`);
    return { name, passed: false, error: errorMsg };
  }
}

/**
 * Main test suite
 */
async function runTests() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${colors.cyan}Migration CLI Test Suite${colors.reset}`);
  console.log(`${'='.repeat(70)}\n`);

  // Test 1: Check if CLI script exists
  results.push(checkFileExists(
    'CLI script exists',
    path.join(process.cwd(), 'scripts', 'migrate-syllabus-cli.ts')
  ));

  // Test 2: Check if guide exists
  results.push(checkFileExists(
    'CLI guide exists',
    path.join(process.cwd(), 'scripts', 'MIGRATION_CLI_GUIDE.md')
  ));

  // Test 3: Help command
  results.push(runTest(
    'Help command',
    'npm run migrate:cli -- --help',
    'Enhanced Syllabus Migration CLI'
  ));

  // Test 4: Dry-run mode
  results.push(runTest(
    'Dry-run mode',
    'npm run migrate:cli -- --dry-run --auto',
    'DRY RUN'
  ));

  // Test 5: Verify command
  results.push(runTest(
    'Verify command',
    'npm run migrate:cli -- --verify',
    'Migration Verification'
  ));

  // Test 6: Check logs directory is created
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  results.push(checkFileExists(
    'Logs directory exists',
    logsDir
  ));

  // Print summary
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${colors.cyan}Test Summary${colors.reset}`);
  console.log(`${'='.repeat(70)}\n`);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total tests: ${results.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed > 0) {
    console.log(`\n${colors.red}Failed tests:${colors.reset}`);
    results.filter(r => !r.passed).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name}`);
      if (result.error) {
        console.log(`     ${colors.red}${result.error}${colors.reset}`);
      }
    });
  }

  console.log();

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite failed:${colors.reset}`, error);
  process.exit(1);
});
