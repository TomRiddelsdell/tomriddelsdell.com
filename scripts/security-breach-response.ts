#!/usr/bin/env tsx

/**
 * 🚨 SECURITY BREACH RESPONSE SCRIPT
 * 
 * Comprehensive credential rotation and security hardening after a potential security breach.
 * This script automates the rotation of ALL credentials across multiple platforms and services.
 * 
 * @author Security Response Team
 * @version 2.0.0
 * @requires AWS CLI, GitHub CLI, Node.js 18+
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { createHash, randomBytes } from 'crypto';

const execAsync = promisify(exec);

// Environment variables
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'TomRiddelsdell';
const GITHUB_REPO = process.env.GITHUB_REPO || 'tomriddelsdell.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;

// Console styling
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function log(message: string, color: keyof typeof colors = 'reset', prefix = '🔒') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors[color]}${colors.bold}[${timestamp}] ${prefix} ${message}${colors.reset}`);
}

function error(message: string) {
  log(message, 'red', '❌');
}

function success(message: string) {
  log(message, 'green', '✅');
}

function warning(message: string) {
  log(message, 'yellow', '⚠️');
}

function info(message: string) {
  log(message, 'cyan', 'ℹ️');
}

/**
 * Generate cryptographically secure random string
 */
function generateSecureSecret(length: number = 64): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const bytes = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  
  return result;
}

/**
 * Execute shell command with timeout and proper error handling
 */
async function executeCommand(command: string, timeout: number = 30000): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, { timeout });
    if (stderr && !stderr.includes('warning')) {
      warning(`Command stderr: ${stderr}`);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\nError: ${error.message}`);
  }
}

/**
 * Call MCP server for GitHub operations
 */
async function callGitHubMCP(tool: string, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('tsx', [
      '/workspaces/infrastructure/mcp/github-mcp-server.ts',
      '--tool', tool,
      '--args', JSON.stringify(args)
    ], {
      env: {
        ...process.env,
        GITHUB_OWNER,
        GITHUB_REPO,
        GITHUB_TOKEN
      }
    });
    
    let output = '';
    let errorOutput = '';
    
    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    mcpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    mcpProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(output.trim()));
        } catch {
          resolve(output.trim());
        }
      } else {
        reject(new Error(`MCP call failed [${code}]: ${errorOutput}`));
      }
    });
    
    mcpProcess.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Comprehensive credential inventory for the platform
 */
const CREDENTIAL_INVENTORY = {
  // Infrastructure Secrets (Critical - Immediate Rotation Required)
  critical: [
    {
      name: 'DATABASE_URL',
      type: 'database',
      service: 'Neon PostgreSQL',
      rotation_method: 'manual_guided',
      impact: 'complete_data_access',
      github_secret: true,
      local_env: true
    },
    {
      name: 'STAGING_DATABASE_URL', 
      type: 'database',
      service: 'Neon PostgreSQL Staging',
      rotation_method: 'manual_guided',
      impact: 'staging_data_access',
      github_secret: true,
      local_env: false
    },
    {
      name: 'PRODUCTION_DATABASE_URL',
      type: 'database', 
      service: 'Neon PostgreSQL Production',
      rotation_method: 'manual_guided',
      impact: 'production_data_access',
      github_secret: true,
      local_env: false
    },
    {
      name: 'SESSION_SECRET',
      type: 'session',
      service: 'Express Session',
      rotation_method: 'auto_generate',
      impact: 'all_user_sessions',
      github_secret: false,
      local_env: true
    },
    {
      name: 'AWS_ACCESS_KEY_ID',
      type: 'aws_credential',
      service: 'AWS IAM',
      rotation_method: 'aws_cli_rotate',
      impact: 'aws_resource_access',
      github_secret: false,
      local_env: true
    },
    {
      name: 'AWS_SECRET_ACCESS_KEY',
      type: 'aws_credential',
      service: 'AWS IAM',
      rotation_method: 'aws_cli_rotate',
      impact: 'aws_resource_access',
      github_secret: false,
      local_env: true
    }
  ],
  
  // Application Secrets (High Priority)
  high: [
    {
      name: 'GITHUB_TOKEN',
      type: 'api_token',
      service: 'GitHub Personal Access Token',
      rotation_method: 'manual_github',
      impact: 'repository_access',
      github_secret: false,
      local_env: true
    },
    {
      name: 'AWS_COGNITO_CLIENT_SECRET',
      type: 'oauth_secret',
      service: 'AWS Cognito',
      rotation_method: 'aws_cognito_rotate',
      impact: 'user_authentication',
      github_secret: false,
      local_env: true
    },
    {
      name: 'SENDGRID_API_KEY',
      type: 'api_token',
      service: 'SendGrid Email',
      rotation_method: 'manual_sendgrid',
      impact: 'email_delivery',
      github_secret: false,
      local_env: true
    }
  ],
  
  // Third-party Integrations (Medium Priority)
  medium: [
    {
      name: 'GOOGLE_CLIENT_SECRET',
      type: 'oauth_secret',
      service: 'Google OAuth',
      rotation_method: 'manual_google',
      impact: 'oauth_authentication',
      github_secret: false,
      local_env: true
    }
  ],
  
  // AWS Infrastructure Secrets (GitHub Actions)
  aws_github: [
    {
      name: 'AWS_STAGING_ROLE_ARN',
      type: 'aws_role',
      service: 'AWS IAM Role for Staging',
      rotation_method: 'verify_role',
      impact: 'staging_deployment',
      github_secret: true,
      local_env: false
    },
    {
      name: 'AWS_PRODUCTION_ROLE_ARN',
      type: 'aws_role', 
      service: 'AWS IAM Role for Production',
      rotation_method: 'verify_role',
      impact: 'production_deployment',
      github_secret: true,
      local_env: false
    },
    {
      name: 'STAGING_CERTIFICATE_ARN',
      type: 'aws_resource',
      service: 'AWS ACM Certificate',
      rotation_method: 'verify_certificate',
      impact: 'ssl_certificate',
      github_secret: true,
      local_env: true
    },
    {
      name: 'PRODUCTION_CERTIFICATE_ARN',
      type: 'aws_resource',
      service: 'AWS ACM Certificate', 
      rotation_method: 'verify_certificate',
      impact: 'ssl_certificate',
      github_secret: true,
      local_env: true
    }
  ]
};

/**
 * Verify environment prerequisites
 */
async function verifyPrerequisites(): Promise<boolean> {
  info('Verifying prerequisites...');
  
  const checks = [
    { cmd: 'aws --version', name: 'AWS CLI' },
    { cmd: 'gh --version', name: 'GitHub CLI' },
    { cmd: 'node --version', name: 'Node.js' },
    { cmd: 'tsx --version', name: 'TSX Runtime' }
  ];
  
  for (const check of checks) {
    try {
      await executeCommand(check.cmd);
      success(`${check.name} is available`);
    } catch {
      error(`${check.name} is not available or not working`);
      return false;
    }
  }
  
  // Check required environment variables
  const requiredEnvVars = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      error(`Required environment variable missing: ${envVar}`);
      return false;
    }
  }
  
  // Verify AWS credentials
  try {
    const awsIdentity = await executeCommand('aws sts get-caller-identity');
    const identity = JSON.parse(awsIdentity);
    success(`AWS authenticated as: ${identity.Arn}`);
  } catch {
    warning('AWS credentials not configured or invalid - AWS operations will be skipped');
  }
  
  // Verify GitHub authentication
  try {
    await executeCommand('gh auth status');
    success('GitHub CLI authenticated');
  } catch {
    warning('GitHub CLI not authenticated - some operations may fail');
  }
  
  return true;
}

/**
 * Generate new session secret
 */
async function rotateSessionSecret(): Promise<string> {
  info('Generating new session secret...');
  const newSecret = generateSecureSecret(64);
  
  // Validate entropy
  const entropy = calculateEntropy(newSecret);
  if (entropy < 4.5) {
    throw new Error('Generated secret has insufficient entropy');
  }
  
  success(`New session secret generated (entropy: ${entropy.toFixed(2)})`);
  return newSecret;
}

/**
 * Calculate entropy of a string
 */
function calculateEntropy(str: string): number {
  const freq: { [key: string]: number } = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Rotate AWS access keys
 */
async function rotateAWSCredentials(): Promise<{ accessKeyId: string; secretAccessKey: string } | null> {
  try {
    info('Rotating AWS access keys...');
    
    // Get current user
    const identity = JSON.parse(await executeCommand('aws sts get-caller-identity'));
    const username = identity.Arn.split('/').pop();
    
    // Create new access key
    info('Creating new AWS access key...');
    const newKeyResult = await executeCommand(`aws iam create-access-key --user-name ${username}`);
    const newKey = JSON.parse(newKeyResult).AccessKey;
    
    success(`New AWS access key created: ${newKey.AccessKeyId}`);
    
    // Test new credentials by setting them temporarily and calling STS
    const oldAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const oldSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    process.env.AWS_ACCESS_KEY_ID = newKey.AccessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = newKey.SecretAccessKey;
    
    try {
      await executeCommand('aws sts get-caller-identity');
      success('New AWS credentials verified');
      
      // Delete old access key if we have it and it's different
      if (oldAccessKey && oldAccessKey !== newKey.AccessKeyId) {
        try {
          // Restore old credentials temporarily to delete
          process.env.AWS_ACCESS_KEY_ID = oldAccessKey;
          process.env.AWS_SECRET_ACCESS_KEY = oldSecretKey;
          
          await executeCommand(`aws iam delete-access-key --access-key-id ${oldAccessKey} --user-name ${username}`);
          success(`Old AWS access key deleted: ${oldAccessKey}`);
        } catch (deleteError) {
          warning(`Could not delete old access key ${oldAccessKey}: ${deleteError}`);
        }
      }
      
      // Restore new credentials
      process.env.AWS_ACCESS_KEY_ID = newKey.AccessKeyId;
      process.env.AWS_SECRET_ACCESS_KEY = newKey.SecretAccessKey;
      
      return {
        accessKeyId: newKey.AccessKeyId,
        secretAccessKey: newKey.SecretAccessKey
      };
      
    } catch (testError) {
      error(`New AWS credentials failed verification: ${testError}`);
      
      // Cleanup the failed key
      process.env.AWS_ACCESS_KEY_ID = oldAccessKey;
      process.env.AWS_SECRET_ACCESS_KEY = oldSecretKey;
      
      try {
        await executeCommand(`aws iam delete-access-key --access-key-id ${newKey.AccessKeyId} --user-name ${username}`);
      } catch {
        warning(`Could not cleanup failed access key ${newKey.AccessKeyId}`);
      }
      
      return null;
    }
    
  } catch (error: any) {
    error(`AWS credential rotation failed: ${error.message}`);
    return null;
  }
}

/**
 * Update GitHub repository secret using MCP
 */
async function updateGitHubSecret(name: string, value: string): Promise<boolean> {
  try {
    info(`Updating GitHub secret: ${name}`);
    
    await callGitHubMCP('github_set_secret', { name, value });
    
    success(`GitHub secret ${name} updated successfully`);
    return true;
  } catch (error: any) {
    error(`Failed to update GitHub secret ${name}: ${error.message}`);
    return false;
  }
}

/**
 * Update local .env file
 */
function updateLocalEnv(updates: { [key: string]: string }): boolean {
  try {
    const envPath = '/workspaces/.env';
    
    if (!existsSync(envPath)) {
      warning('.env file not found, creating new one');
      writeFileSync(envPath, '# Environment Variables\n# Generated by security breach response script\n\n');
    }
    
    let envContent = readFileSync(envPath, 'utf-8');
    
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
        info(`Updated ${key} in .env file`);
      } else {
        envContent += `\n${newLine}`;
        info(`Added ${key} to .env file`);
      }
    }
    
    writeFileSync(envPath, envContent);
    success('Local .env file updated successfully');
    return true;
    
  } catch (error: any) {
    error(`Failed to update .env file: ${error.message}`);
    return false;
  }
}

/**
 * Create audit log entry
 */
function createAuditLog(action: string, details: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    user: process.env.USER || 'unknown',
    system: process.platform,
    script_version: '2.0.0'
  };
  
  const logPath = '/workspaces/security-audit.log';
  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    const fs = require('fs');
    fs.appendFileSync(logPath, logLine);
  } catch {
    warning('Could not write to audit log');
  }
}

/**
 * Main breach response workflow
 */
async function executeBreachResponse(): Promise<void> {
  const startTime = Date.now();
  
  log('🚨 SECURITY BREACH RESPONSE INITIATED', 'red', '🚨');
  log('========================================', 'red', '🚨');
  
  createAuditLog('breach_response_started', { script_version: '2.0.0' });
  
  // Phase 1: Immediate Actions
  log('\n📋 PHASE 1: IMMEDIATE SECURITY ACTIONS', 'yellow', '⚡');
  
  const rotationResults: { [key: string]: boolean } = {};
  const newCredentials: { [key: string]: string } = {};
  
  // 1.1: Rotate Session Secret (Force all user logouts)
  try {
    const newSessionSecret = await rotateSessionSecret();
    newCredentials['SESSION_SECRET'] = newSessionSecret;
    rotationResults['SESSION_SECRET'] = true;
    warning('⚠️ All user sessions will be invalidated with new session secret');
  } catch (error: any) {
    error(`Session secret rotation failed: ${error.message}`);
    rotationResults['SESSION_SECRET'] = false;
  }
  
  // 1.2: Rotate AWS Credentials
  const newAWSCreds = await rotateAWSCredentials();
  if (newAWSCreds) {
    newCredentials['AWS_ACCESS_KEY_ID'] = newAWSCreds.accessKeyId;
    newCredentials['AWS_SECRET_ACCESS_KEY'] = newAWSCreds.secretAccessKey;
    rotationResults['AWS_ACCESS_KEY_ID'] = true;
    rotationResults['AWS_SECRET_ACCESS_KEY'] = true;
  } else {
    rotationResults['AWS_ACCESS_KEY_ID'] = false;
    rotationResults['AWS_SECRET_ACCESS_KEY'] = false;
  }
  
  // Phase 2: Database Security
  log('\n📋 PHASE 2: DATABASE SECURITY', 'yellow', '🗄️');
  
  warning('🔐 DATABASE CREDENTIAL ROTATION REQUIRED');
  log('Manual steps required for database credentials:', 'cyan');
  log('1. Login to Neon Console: https://console.neon.tech/', 'white');
  log('2. Navigate to your database project', 'white');
  log('3. Go to Settings > Reset Password', 'white');
  log('4. Generate new password for neondb_owner user', 'white');
  log('5. Copy the new connection string', 'white');
  log('6. Update DATABASE_URL, STAGING_DATABASE_URL, PRODUCTION_DATABASE_URL', 'white');
  
  // Phase 3: Third-party Service Tokens
  log('\n📋 PHASE 3: THIRD-PARTY SERVICE TOKENS', 'yellow', '🔑');
  
  const manualRotations = [
    {
      service: 'GitHub Personal Access Token',
      steps: [
        'Go to GitHub Settings > Developer settings > Personal access tokens',
        'Generate new token with required scopes: repo, workflow, admin:repo_hook',
        'Update GITHUB_TOKEN environment variable',
        'Revoke old token'
      ]
    },
    {
      service: 'SendGrid API Key',
      steps: [
        'Login to SendGrid dashboard',
        'Go to Settings > API Keys',
        'Create new API key with Mail Send permissions',
        'Update SENDGRID_API_KEY environment variable',
        'Delete old API key'
      ]
    },
    {
      service: 'AWS Cognito Client Secret',
      steps: [
        'Go to AWS Cognito console',
        'Navigate to your User Pool > App clients',
        'Generate new client secret',
        'Update AWS_COGNITO_CLIENT_SECRET environment variable'
      ]
    }
  ];
  
  manualRotations.forEach((rotation, index) => {
    log(`\n🔄 ${rotation.service}:`, 'cyan');
    rotation.steps.forEach((step, stepIndex) => {
      log(`   ${stepIndex + 1}. ${step}`, 'white');
    });
  });
  
  // Phase 4: Update Local Environment
  log('\n📋 PHASE 4: UPDATE LOCAL ENVIRONMENT', 'yellow', '🔧');
  
  if (Object.keys(newCredentials).length > 0) {
    const envUpdateSuccess = updateLocalEnv(newCredentials);
    if (envUpdateSuccess) {
      success('Local environment variables updated');
    }
  }
  
  // Phase 5: Update GitHub Secrets
  log('\n📋 PHASE 5: UPDATE GITHUB REPOSITORY SECRETS', 'yellow', '📡');
  
  warning('⚠️ GitHub secrets requiring manual update after you rotate them:');
  const githubSecretsToUpdate = [
    'DATABASE_URL',
    'STAGING_DATABASE_URL', 
    'PRODUCTION_DATABASE_URL',
    'GITHUB_TOKEN (after rotation)',
    'SENDGRID_API_KEY (after rotation)',
    'AWS_COGNITO_CLIENT_SECRET (after rotation)'
  ];
  
  githubSecretsToUpdate.forEach(secret => {
    log(`   - ${secret}`, 'white');
  });
  
  // Phase 6: Verification & Testing
  log('\n📋 PHASE 6: VERIFICATION & TESTING', 'yellow', '🧪');
  
  const verificationSteps = [
    'Test application build: npm run build',
    'Test database connectivity: npm run db:test',
    'Test AWS services: aws sts get-caller-identity', 
    'Test GitHub integration: gh repo view',
    'Deploy to staging: npm run deploy:staging',
    'Verify staging functionality',
    'Deploy to production: npm run deploy:production',
    'Monitor application logs for errors'
  ];
  
  log('Run these verification steps:', 'cyan');
  verificationSteps.forEach((step, index) => {
    log(`   ${index + 1}. ${step}`, 'white');
  });
  
  // Phase 7: Security Hardening
  log('\n📋 PHASE 7: SECURITY HARDENING', 'yellow', '🛡️');
  
  const hardeningSteps = [
    'Enable AWS CloudTrail logging',
    'Set up AWS Config rules for compliance',
    'Enable GitHub security alerts',
    'Review and rotate any additional API keys',
    'Update firewall rules if applicable',
    'Review user access permissions',
    'Enable two-factor authentication on all services',
    'Update backup and recovery procedures'
  ];
  
  log('Additional security measures to implement:', 'cyan');
  hardeningSteps.forEach((step, index) => {
    log(`   ${index + 1}. ${step}`, 'white');
  });
  
  // Summary Report
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  log('\n📊 BREACH RESPONSE SUMMARY', 'blue', '📊');
  log('=====================================', 'blue', '📊');
  
  const successCount = Object.values(rotationResults).filter(Boolean).length;
  const totalCount = Object.keys(rotationResults).length;
  
  log(`Execution Time: ${duration} seconds`, 'white');
  log(`Automated Rotations: ${successCount}/${totalCount} successful`, successCount === totalCount ? 'green' : 'yellow');
  
  // Log rotation results
  Object.entries(rotationResults).forEach(([credential, success]) => {
    const status = success ? '✅' : '❌';
    const color = success ? 'green' : 'red';
    log(`${status} ${credential}`, color);
  });
  
  log('\n🚨 CRITICAL NEXT STEPS:', 'red', '🚨');
  log('1. 🔐 Rotate database passwords in Neon console IMMEDIATELY', 'red');
  log('2. 🔑 Rotate GitHub token and update GitHub secrets', 'red');
  log('3. 📧 Rotate SendGrid API key', 'red');
  log('4. 🔒 Rotate AWS Cognito client secret', 'red');
  log('5. ✅ Run verification tests', 'yellow');
  log('6. 📊 Monitor systems for 24-48 hours', 'yellow');
  
  createAuditLog('breach_response_completed', { 
    duration: parseFloat(duration),
    automated_rotations: rotationResults,
    success_rate: `${successCount}/${totalCount}`
  });
  
  success('Breach response script completed successfully');
  warning('IMPORTANT: Complete manual steps immediately for full security restoration');
}

/**
 * Interactive breach response workflow
 */
async function interactiveBreachResponse(): Promise<void> {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };
  
  try {
    log('🚨 SECURITY BREACH RESPONSE WIZARD', 'red', '🧙');
    log('=====================================', 'red');
    
    const breachType = await question('\n🔍 What type of security incident occurred?\n1. Suspected credential exposure\n2. Unauthorized repository access\n3. AWS account compromise\n4. Complete system breach\n5. Other/Unknown\n\nSelect (1-5): ');
    
    const urgency = await question('\n⏰ Urgency level?\n1. Critical (active exploitation)\n2. High (credentials definitely compromised)\n3. Medium (suspected exposure)\n4. Low (precautionary)\n\nSelect (1-4): ');
    
    const scope = await question('\n🎯 Scope of potential exposure?\n1. Local development environment only\n2. GitHub repository\n3. AWS infrastructure\n4. All systems\n\nSelect (1-4): ');
    
    const confirm = await question('\n⚠️  This will:\n- Rotate AWS access keys immediately\n- Invalidate all user sessions\n- Require manual rotation of database passwords\n- Require manual rotation of third-party API keys\n\nProceed with automated breach response? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y') {
      warning('Breach response cancelled by user');
      return;
    }
    
    createAuditLog('breach_response_initiated', {
      breach_type: breachType,
      urgency_level: urgency,
      scope: scope,
      initiated_by: process.env.USER || 'unknown'
    });
    
    await executeBreachResponse();
    
  } finally {
    rl.close();
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    // Check if running with --auto flag for non-interactive mode
    const isAutoMode = process.argv.includes('--auto');
    const isHelp = process.argv.includes('--help') || process.argv.includes('-h');
    
    if (isHelp) {
      console.log(`
🚨 Security Breach Response Script

Usage: tsx security-breach-response.ts [options]

Options:
  --auto    Run automated breach response without prompts
  --help    Show this help message

Interactive mode (default):
  Guides you through breach assessment and response

Automated mode:
  Immediately executes all automated credential rotations
  
Prerequisites:
  - AWS CLI configured
  - GitHub CLI authenticated  
  - Required environment variables set
  - MCP servers available
      `);
      return;
    }
    
    // Verify prerequisites
    const prereqsOk = await verifyPrerequisites();
    if (!prereqsOk) {
      error('Prerequisites not met. Please fix the issues above before proceeding.');
      process.exit(1);
    }
    
    if (isAutoMode) {
      warning('Running in automated mode - no user confirmation required');
      await executeBreachResponse();
    } else {
      await interactiveBreachResponse();
    }
    
  } catch (error: any) {
    error(`Breach response failed: ${error.message}`);
    createAuditLog('breach_response_failed', { error: error.message });
    process.exit(1);
  }
}

// Export functions for testing
export {
  executeBreachResponse,
  rotateAWSCredentials,
  rotateSessionSecret,
  updateGitHubSecret,
  updateLocalEnv,
  generateSecureSecret,
  calculateEntropy
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
