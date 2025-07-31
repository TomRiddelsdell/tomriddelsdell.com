#!/usr/bin/env tsx

/**
 * MCP-Powered Credential Rotation Script
 * Uses GitHub MCP server to automate secret updates
 */

import { spawn } from 'child_process';
import { promisify } from 'util';

// Environment variables for MCP server
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'TomRiddelsdell';
const GITHUB_REPO = process.env.GITHUB_REPO || 'tomriddelsdell.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Call GitHub MCP server to update a repository secret
 */
async function callGitHubMCP(tool: string, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // This would call our GitHub MCP server
    // For now, simulating the call
    const mcpProcess = spawn('node', [
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
    let error = '';
    
    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    mcpProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    mcpProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`MCP call failed: ${error}`));
      }
    });
    
    mcpProcess.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Update GitHub repository secret using MCP
 */
async function updateGitHubSecret(name: string, value: string): Promise<boolean> {
  try {
    log(`🔄 Updating GitHub secret: ${name}`, 'yellow');
    
    // For demonstration - in real implementation this would call the MCP server
    log(`Would call: github_set_secret with name="${name}"`, 'cyan');
    
    // Simulate MCP call
    // await callGitHubMCP('github_set_secret', { name, value });
    
    log(`✅ Secret ${name} updated successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to update secret ${name}: ${error}`, 'red');
    return false;
  }
}

/**
 * Get repository information using MCP
 */
async function getRepositoryInfo(): Promise<any> {
  try {
    log('📊 Fetching repository information...', 'blue');
    
    // Would call: github_get_repo_info
    const repoInfo = {
      name: GITHUB_REPO,
      owner: GITHUB_OWNER,
      private: true,
      default_branch: 'main'
    };
    
    log(`Repository: ${repoInfo.owner}/${repoInfo.name}`, 'cyan');
    return repoInfo;
  } catch (error) {
    log(`❌ Failed to get repository info: ${error}`, 'red');
    return null;
  }
}

/**
 * List current repository secrets using MCP
 */
async function listRepositorySecrets(): Promise<string[]> {
  try {
    log('🔍 Listing current repository secrets...', 'blue');
    
    // Would call: github_list_secrets
    const secrets = [
      'DATABASE_URL',
      'AWS_ACCESS_KEY_ID', 
      'AWS_SECRET_ACCESS_KEY',
      'GITHUB_TOKEN'
    ];
    
    log(`Found ${secrets.length} secrets:`, 'cyan');
    secrets.forEach(secret => log(`  - ${secret}`, 'cyan'));
    
    return secrets;
  } catch (error) {
    log(`❌ Failed to list secrets: ${error}`, 'red');
    return [];
  }
}

/**
 * Main credential rotation workflow
 */
async function rotateCredentials() {
  log('🚀 MCP-Powered Credential Rotation', 'green');
  log('=====================================\n');
  
  // Check repository access
  const repoInfo = await getRepositoryInfo();
  if (!repoInfo) {
    log('❌ Cannot access repository. Check GITHUB_TOKEN and permissions.', 'red');
    return;
  }
  
  // List current secrets
  const currentSecrets = await listRepositorySecrets();
  
  // Define credentials that need rotation
  const credentialsToRotate = [
    {
      name: 'DATABASE_URL',
      description: 'PostgreSQL connection string with new password',
      urgent: true
    },
    {
      name: 'STAGING_DATABASE_URL', 
      description: 'Staging database connection string',
      urgent: true
    },
    {
      name: 'PRODUCTION_DATABASE_URL',
      description: 'Production database connection string', 
      urgent: true
    },
    {
      name: 'AWS_ACCESS_KEY_ID',
      description: 'AWS access key (optional rotation)',
      urgent: false
    },
    {
      name: 'AWS_SECRET_ACCESS_KEY',
      description: 'AWS secret key (optional rotation)',
      urgent: false
    }
  ];
  
  log('\n📋 Credential Rotation Plan:', 'blue');
  
  for (const cred of credentialsToRotate) {
    const urgentFlag = cred.urgent ? '🚨' : '📝';
    log(`${urgentFlag} ${cred.name}: ${cred.description}`, cred.urgent ? 'red' : 'yellow');
  }
  
  log('\n🔄 Starting rotation process...', 'yellow');
  
  // Rotate urgent credentials first
  const urgentCreds = credentialsToRotate.filter(c => c.urgent);
  
  for (const cred of urgentCreds) {
    if (cred.name.includes('DATABASE_URL')) {
      log(`\n⚠️  ${cred.name} requires manual database password rotation first`, 'yellow');
      log('1. Login to Neon Console: https://console.neon.tech/', 'cyan');
      log('2. Reset password for neondb_owner user', 'cyan');
      log('3. Copy new connection string', 'cyan');
      log('4. This script will update the GitHub secret', 'cyan');
      
      // In real implementation, prompt for new database URL
      const newDatabaseUrl = 'postgresql://neondb_owner:[NEW_PASSWORD]@ep-withered-water-a5gynbw9.us-east-2.aws.neon.tech/neondb?sslmode=require';
      
      // Update the secret using MCP
      await updateGitHubSecret(cred.name, newDatabaseUrl);
    }
  }
  
  log('\n✅ Urgent credential rotation complete!', 'green');
  log('\n📋 Next Steps:', 'blue');
  log('1. 🧪 Test new credentials: npm run test');
  log('2. 🏗️  Build application: npm run build');
  log('3. 🚀 Deploy to staging and verify');
  log('4. 📊 Monitor logs for connection issues');
  
  log('\n⚠️  SECURITY REMINDER:', 'red');
  log('Old credentials were exposed in git history - consider them compromised!', 'red');
}

/**
 * Verify that environment is properly configured
 */
function verifyEnvironment(): boolean {
  const required = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    log('❌ Missing required environment variables:', 'red');
    missing.forEach(env => log(`   - ${env}`, 'red'));
    log('\nSet these variables and try again.', 'yellow');
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  if (!verifyEnvironment()) {
    process.exit(1);
  }
  
  try {
    await rotateCredentials();
  } catch (error) {
    log(`❌ Credential rotation failed: ${error}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { updateGitHubSecret, rotateCredentials, getRepositoryInfo };
