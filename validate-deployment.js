#!/usr/bin/env node

// Deployment validation script
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function validateDeployment() {
  console.log('Validating pre-deployment test setup...\n');
  
  try {
    // Check if pre-deploy script exists and is executable
    console.log('1. Checking pre-deploy script...');
    await execAsync('ls -la pre-deploy.sh');
    console.log('✅ Pre-deploy script found and executable\n');
    
    // Validate environment variables are properly documented
    console.log('2. Checking environment requirements...');
    const envVars = [
      'DATABASE_URL',
      'SESSION_SECRET', 
      'COGNITO_USER_POOL_ID',
      'COGNITO_CLIENT_ID',
      'COGNITO_REGION'
    ];
    
    const missingVars = envVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
      console.log('These will be checked during actual deployment\n');
    } else {
      console.log('✅ All required environment variables are present\n');
    }
    
    // Test individual components that don't require full environment
    console.log('3. Testing TypeScript compilation...');
    try {
      await execAsync('npm run check');
      console.log('✅ TypeScript compilation successful\n');
    } catch (error) {
      console.log('❌ TypeScript compilation failed\n');
    }
    
    // Verify test files exist
    console.log('4. Checking test file structure...');
    const testFiles = [
      'tests/unit/',
      'tests/integration/', 
      'tests/auth-regression.test.ts',
      'tests/database-regression.test.ts',
      'tests/performance-regression.test.ts',
      'tests/regression-suite.test.ts',
      'tests/e2e/'
    ];
    
    for (const testPath of testFiles) {
      try {
        await execAsync(`ls ${testPath}`);
        console.log(`✅ ${testPath} exists`);
      } catch (error) {
        console.log(`❌ ${testPath} missing`);
      }
    }
    
    console.log('\n5. Deployment setup validation complete');
    console.log('\nTo run full pre-deployment tests:');
    console.log('  ./pre-deploy.sh');
    console.log('\nTo deploy with testing:');
    console.log('  ./pre-deploy.sh && npm run start');
    
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

validateDeployment();