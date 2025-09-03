#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the test event
const testEvent = JSON.parse(fs.readFileSync('test-event.json', 'utf8'));

// Mock AWS Lambda context
const mockContext = {
  awsRequestId: 'test-request-id',
  functionName: 'tomriddelsdell-com-staging-api-gateway',
  functionVersion: '$LATEST',
  memoryLimitInMB: 128,
  getRemainingTimeInMillis: () => 25000,
  callbackWaitsForEmptyEventLoop: false
};

// Set environment variables for testing
process.env.NODE_ENV = 'staging';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.COGNITO_USER_POOL_ID = 'eu-west-2_test';
process.env.STATIC_ASSETS_BUCKET = 'test-bucket';
process.env.CORS_ORIGINS = 'https://dev.tomriddelsdell.com';
process.env.SESSION_SECRET = 'test-session-secret-for-local-testing-only';
process.env.FORCE_ENV_CONFIG = 'true';

async function testLambda() {
  try {
    console.log('🚀 Testing Lambda function locally...\n');
    
    // Import the Lambda handler
    const { handler } = require('./dist/lambda/index.js');
    
    console.log('📥 Test Event:');
    console.log(JSON.stringify(testEvent, null, 2));
    console.log('\n🔄 Invoking Lambda handler...\n');
    
    // Invoke the handler
    const result = await handler(testEvent, mockContext);
    
    console.log('✅ Lambda Response:');
    console.log('Status Code:', result.statusCode);
    console.log('Headers:', JSON.stringify(result.headers, null, 2));
    console.log('Body:', result.body);
    
    if (result.statusCode === 200) {
      console.log('\n🎉 SUCCESS: Lambda function is working correctly!');
    } else {
      console.log(`\n❌ ISSUE: Lambda returned status code ${result.statusCode}`);
    }
    
  } catch (error) {
    console.error('❌ LAMBDA ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLambda();
