#!/usr/bin/env tsx

/**
 * 🧪 Security Breach Response Validation
 * 
 * This script validates that all security measures are working correctly
 * after a breach response has been executed.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ValidationResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

/**
 * Comprehensive security validation suite
 */
class SecurityValidator {
  private results: ValidationResult[] = [];
  
  private log(test: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    const result: ValidationResult = { test, status, message, details };
    this.results.push(result);
    
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    const color = status === 'pass' ? '\x1b[32m' : status === 'fail' ? '\x1b[31m' : '\x1b[33m';
    
    console.log(`${color}${icon} ${test}: ${message}\x1b[0m`);
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }
  
  /**
   * Test AWS credential validity and permissions
   */
  async validateAWSCredentials(): Promise<void> {
    try {
      const { stdout } = await execAsync('aws sts get-caller-identity');
      const identity = JSON.parse(stdout);
      
      this.log(
        'AWS Credentials',
        'pass',
        `Valid credentials for account ${identity.Account}`,
        { userId: identity.UserId, arn: identity.Arn }
      );
      
      // Test basic AWS permissions
      try {
        await execAsync('aws iam list-access-keys --max-items 1');
        this.log('AWS IAM Permissions', 'pass', 'IAM access confirmed');
      } catch {
        this.log('AWS IAM Permissions', 'warning', 'Limited IAM permissions detected');
      }
      
      // Test S3 access (if available)
      try {
        await execAsync('aws s3 ls --max-items 1');
        this.log('AWS S3 Access', 'pass', 'S3 access confirmed');
      } catch {
        this.log('AWS S3 Access', 'warning', 'S3 access not available or limited');
      }
      
    } catch (error: any) {
      this.log('AWS Credentials', 'fail', 'Invalid or missing AWS credentials', { error: error.message });
    }
  }
  
  /**
   * Test GitHub authentication and repository access
   */
  async validateGitHubAccess(): Promise<void> {
    try {
      // Test GitHub CLI authentication
      await execAsync('gh auth status');
      this.log('GitHub CLI Auth', 'pass', 'GitHub CLI authenticated');
      
      // Test repository access
      const { stdout } = await execAsync(`gh repo view ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO} --json name,owner,private`);
      const repo = JSON.parse(stdout);
      
      this.log(
        'GitHub Repository Access',
        'pass',
        `Repository access confirmed: ${repo.owner.login}/${repo.name}`,
        { private: repo.private }
      );
      
      // Test secrets access (list without values)
      try {
        await execAsync(`gh secret list --repo ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`);
        this.log('GitHub Secrets Access', 'pass', 'Can access repository secrets');
      } catch {
        this.log('GitHub Secrets Access', 'warning', 'Limited access to repository secrets');
      }
      
    } catch (error: any) {
      this.log('GitHub Access', 'fail', 'GitHub authentication or access failed', { error: error.message });
    }
  }
  
  /**
   * Validate environment variables and configuration
   */
  async validateEnvironmentConfig(): Promise<void> {
    const criticalEnvVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'GITHUB_TOKEN',
      'GITHUB_OWNER',
      'GITHUB_REPO'
    ];
    
    const optionalEnvVars = [
      'SENDGRID_API_KEY',
      'AWS_COGNITO_CLIENT_SECRET',
      'GOOGLE_CLIENT_SECRET',
      'NEPTUNE_ENDPOINT'
    ];
    
    // Check critical variables
    for (const envVar of criticalEnvVars) {
      if (process.env[envVar]) {
        // Check for common insecure patterns
        const value = process.env[envVar];
        if (value.includes('test') || value.includes('example') || value.includes('changeme')) {
          this.log(
            `Environment Variable: ${envVar}`,
            'warning',
            'Contains test/example value - may not be production-ready'
          );
        } else {
          this.log(
            `Environment Variable: ${envVar}`,
            'pass',
            'Set and appears valid'
          );
        }
      } else {
        this.log(
          `Environment Variable: ${envVar}`,
          'fail',
          'Missing required environment variable'
        );
      }
    }
    
    // Check optional variables
    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        this.log(
          `Optional Variable: ${envVar}`,
          'pass',
          'Set (optional service configured)'
        );
      } else {
        this.log(
          `Optional Variable: ${envVar}`,
          'warning',
          'Not set (optional service not configured)'
        );
      }
    }
    
    // Validate SESSION_SECRET strength
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret) {
      if (sessionSecret.length < 32) {
        this.log('Session Secret Strength', 'fail', 'Session secret too short (< 32 characters)');
      } else if (sessionSecret.length < 64) {
        this.log('Session Secret Strength', 'warning', 'Session secret could be longer (< 64 characters)');
      } else {
        this.log('Session Secret Strength', 'pass', `Strong session secret (${sessionSecret.length} characters)`);
      }
    }
  }
  
  /**
   * Test database connectivity
   */
  async validateDatabaseConnection(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      this.log('Database Connection', 'fail', 'DATABASE_URL not set');
      return;
    }
    
    // Parse database URL for validation
    try {
      const url = new URL(databaseUrl);
      
      if (!url.hostname || !url.username) {
        this.log('Database URL Format', 'fail', 'Invalid database URL format');
        return;
      }
      
      this.log(
        'Database URL Format',
        'pass',
        `Valid format: ${url.protocol}//${url.username}@${url.hostname}:${url.port}${url.pathname}`
      );
      
      // Check SSL requirement
      if (url.searchParams.get('sslmode') === 'require') {
        this.log('Database SSL', 'pass', 'SSL mode required (secure)');
      } else {
        this.log('Database SSL', 'warning', 'SSL mode not explicitly required');
      }
      
      // Test actual connection (if pg is available)
      try {
        // This would require pg module, so we'll skip actual connection test
        this.log('Database Connection Test', 'warning', 'Connection test skipped (requires pg module)');
      } catch {
        this.log('Database Connection Test', 'warning', 'Cannot test connection without database client');
      }
      
    } catch (error: any) {
      this.log('Database URL Format', 'fail', 'Invalid database URL', { error: error.message });
    }
  }
  
  /**
   * Test MCP server availability
   */
  async validateMCPServers(): Promise<void> {
    const mcpServers = [
      { name: 'GitHub MCP', port: 8003, path: '/workspaces/infrastructure/mcp/github-mcp-server.ts' },
      { name: 'AWS MCP', port: 8001, path: '/workspaces/infrastructure/mcp/aws-mcp-client.ts' },
      { name: 'Neptune MCP', port: 8002, path: '/workspaces/infrastructure/mcp/neptune-mcp-client.ts' }
    ];
    
    for (const server of mcpServers) {
      try {
        // Check if server file exists
        const fs = require('fs');
        if (fs.existsSync(server.path)) {
          this.log(`${server.name} File`, 'pass', `Server file exists: ${server.path}`);
        } else {
          this.log(`${server.name} File`, 'fail', `Server file missing: ${server.path}`);
          continue;
        }
        
        // Test if port is accessible (basic check)
        try {
          await execAsync(`timeout 5 bash -c "</dev/tcp/localhost/${server.port}" 2>/dev/null`);
          this.log(`${server.name} Port`, 'pass', `Port ${server.port} accessible`);
        } catch {
          this.log(`${server.name} Port`, 'warning', `Port ${server.port} not accessible (server may not be running)`);
        }
        
      } catch (error: any) {
        this.log(`${server.name}`, 'fail', 'MCP server validation failed', { error: error.message });
      }
    }
  }
  
  /**
   * Test application build and basic functionality
   */
  async validateApplicationBuild(): Promise<void> {
    try {
      // Test TypeScript compilation
      const { stdout, stderr } = await execAsync('npm run check');
      if (stderr && stderr.includes('error')) {
        this.log('TypeScript Compilation', 'fail', 'TypeScript errors detected', { errors: stderr });
      } else {
        this.log('TypeScript Compilation', 'pass', 'No TypeScript errors');
      }
      
      // Test build process
      try {
        await execAsync('npm run build');
        this.log('Application Build', 'pass', 'Build completed successfully');
      } catch (buildError: any) {
        this.log('Application Build', 'fail', 'Build failed', { error: buildError.message });
      }
      
    } catch (error: any) {
      this.log('Application Build', 'fail', 'Build validation failed', { error: error.message });
    }
  }
  
  /**
   * Security-specific validations
   */
  async validateSecurityMeasures(): Promise<void> {
    // Check .env file is not committed
    try {
      await execAsync('git ls-files .env');
      this.log('Environment File Security', 'fail', '.env file is tracked by git (security risk)');
    } catch {
      this.log('Environment File Security', 'pass', '.env file not tracked by git');
    }
    
    // Check for any committed secrets patterns
    try {
      const { stdout } = await execAsync('git log --all --full-history --grep="password\\|secret\\|key" --oneline | head -5');
      if (stdout.trim()) {
        this.log('Git History Security', 'warning', 'Potential secret-related commits found in history');
      } else {
        this.log('Git History Security', 'pass', 'No obvious secret-related commits in recent history');
      }
    } catch {
      this.log('Git History Security', 'warning', 'Could not analyze git history');
    }
    
    // Check audit log exists
    const fs = require('fs');
    if (fs.existsSync('/workspaces/security-audit.log')) {
      this.log('Security Audit Log', 'pass', 'Security audit log exists');
    } else {
      this.log('Security Audit Log', 'warning', 'No security audit log found');
    }
  }
  
  /**
   * Run all validation tests
   */
  async runAllValidations(): Promise<ValidationResult[]> {
    console.log('\x1b[1m\x1b[34m🧪 Starting Security Validation Suite\x1b[0m');
    console.log('=====================================\n');
    
    await this.validateEnvironmentConfig();
    console.log('');
    
    await this.validateAWSCredentials();
    console.log('');
    
    await this.validateGitHubAccess();
    console.log('');
    
    await this.validateDatabaseConnection();
    console.log('');
    
    await this.validateMCPServers();
    console.log('');
    
    await this.validateApplicationBuild();
    console.log('');
    
    await this.validateSecurityMeasures();
    console.log('');
    
    // Summary
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    
    console.log('\x1b[1m\x1b[34m📊 Validation Summary\x1b[0m');
    console.log('===================');
    console.log(`\x1b[32m✅ Passed: ${passed}\x1b[0m`);
    console.log(`\x1b[31m❌ Failed: ${failed}\x1b[0m`);
    console.log(`\x1b[33m⚠️  Warnings: ${warnings}\x1b[0m`);
    console.log(`📝 Total Tests: ${this.results.length}\n`);
    
    if (failed > 0) {
      console.log('\x1b[31m🚨 Critical issues found that need immediate attention:\x1b[0m');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`   ❌ ${r.test}: ${r.message}`));
      console.log('');
    }
    
    if (warnings > 0) {
      console.log('\x1b[33m⚠️  Warnings that should be addressed:\x1b[0m');
      this.results
        .filter(r => r.status === 'warning')
        .forEach(r => console.log(`   ⚠️  ${r.test}: ${r.message}`));
      console.log('');
    }
    
    const successRate = ((passed / this.results.length) * 100).toFixed(1);
    if (failed === 0) {
      console.log(`\x1b[32m🎉 Validation completed successfully! (${successRate}% success rate)\x1b[0m`);
    } else {
      console.log(`\x1b[31m🔧 Validation completed with issues. Success rate: ${successRate}%\x1b[0m`);
    }
    
    return this.results;
  }
}

// Main execution
async function main() {
  const validator = new SecurityValidator();
  
  try {
    const results = await validator.runAllValidations();
    
    // Write results to file for later analysis
    const fs = require('fs');
    const reportPath = '/workspaces/security-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        warnings: results.filter(r => r.status === 'warning').length
      }
    }, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with error code if there are failures
    const failed = results.filter(r => r.status === 'fail').length;
    process.exit(failed > 0 ? 1 : 0);
    
  } catch (error: any) {
    console.error(`\x1b[31m❌ Validation suite failed: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

// Export for testing
export { SecurityValidator, ValidationResult };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
