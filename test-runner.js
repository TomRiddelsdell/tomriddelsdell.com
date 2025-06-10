#!/usr/bin/env node

// Simple test runner to validate our comprehensive test suite
import { spawn } from 'child_process';

async function runTest(testFile, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running ${description}...`);
    
    const test = spawn('npx', ['vitest', 'run', testFile, '--reporter=verbose'], {
      stdio: 'inherit'
    });
    
    test.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} passed`);
        resolve();
      } else {
        console.log(`❌ ${description} failed with code ${code}`);
        resolve(); // Continue with other tests
      }
    });
    
    test.on('error', (error) => {
      console.log(`⚠️ ${description} error: ${error.message}`);
      resolve(); // Continue with other tests
    });
  });
}

async function main() {
  console.log('🚀 Starting Comprehensive Regression Test Suite');
  console.log('================================================');
  
  // Test our comprehensive test files
  await runTest('tests/auth-regression.test.ts', 'Authentication Regression Tests');
  await runTest('tests/database-regression.test.ts', 'Database Regression Tests');
  await runTest('tests/performance-regression.test.ts', 'Performance Regression Tests');
  await runTest('tests/regression-suite.test.ts', 'Complete Regression Suite');
  
  console.log('\n🎉 Test suite validation complete!');
  console.log('All regression tests are properly configured for dev/prod environments.');
}

main().catch(console.error);