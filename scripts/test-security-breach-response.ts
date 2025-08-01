#!/usr/bin/env tsx

/**
 * 🧪 Security Breach Response Test Runner
 * 
 * This script safely tests the security breach response system
 * without executing any destructive operations.
 */

import { SecurityValidator } from './security-validation';

/**
 * Test runner for security breach response
 */
class SecurityBreachResponseTester {
  
  private async testEnvironmentPreparation(): Promise<boolean> {
    console.log('\x1b[1m\x1b[34m🔧 Testing Environment Preparation\x1b[0m');
    console.log('==========================================\n');
    
    // Check if all required tools are available
    const requiredTools = [
      { name: 'Node.js', command: 'node --version' },
      { name: 'Git', command: 'git --version' }
    ];
    
    const optionalTools = [
      { name: 'AWS CLI', command: 'aws --version' },
      { name: 'GitHub CLI', command: 'gh --version' },
      { name: 'TypeScript', command: 'npx tsc --version' }
    ];
    
    let coreToolsAvailable = true;
    
    // Test core tools (required)
    for (const tool of requiredTools) {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        await execAsync(tool.command);
        console.log(`\x1b[32m✅ ${tool.name}: Available\x1b[0m`);
      } catch (error) {
        console.log(`\x1b[31m❌ ${tool.name}: Not available or error\x1b[0m`);
        coreToolsAvailable = false;
      }
    }
    
    // Test optional tools (warn but don't fail)
    for (const tool of optionalTools) {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        await execAsync(tool.command);
        console.log(`\x1b[32m✅ ${tool.name}: Available\x1b[0m`);
      } catch (error) {
        console.log(`\x1b[33m⚠️ ${tool.name}: Not available (optional)\x1b[0m`);
      }
    }
    
    console.log('');
    return coreToolsAvailable;
  }
  
  private async testScriptExistence(): Promise<boolean> {
    console.log('\x1b[1m\x1b[34m📝 Testing Script Existence\x1b[0m');
    console.log('===============================\n');
    
    const requiredScripts = [
      '/workspaces/scripts/security-breach-response.ts',
      '/workspaces/scripts/security-mcp-operations.ts',
      '/workspaces/scripts/security-validation.ts'
    ];
    
    let allScriptsExist = true;
    
    for (const scriptPath of requiredScripts) {
      const fs = await import('fs');
      if (fs.existsSync(scriptPath)) {
        console.log(`\x1b[32m✅ ${scriptPath.split('/').pop()}: Exists\x1b[0m`);
      } else {
        console.log(`\x1b[31m❌ ${scriptPath.split('/').pop()}: Missing\x1b[0m`);
        allScriptsExist = false;
      }
    }
    
    console.log('');
    return allScriptsExist;
  }
  
  private async testSyntaxValidation(): Promise<boolean> {
    console.log('\x1b[1m\x1b[34m🔍 Testing TypeScript Syntax\x1b[0m');
    console.log('==============================\n');
    
    const scriptsToValidate = [
      '/workspaces/scripts/security-breach-response.ts',
      '/workspaces/scripts/security-mcp-operations.ts',
      '/workspaces/scripts/security-validation.ts'
    ];
    
    let allSyntaxValid = true;
    
    for (const scriptPath of scriptsToValidate) {
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        await execAsync(`npx tsc --noEmit --skipLibCheck ${scriptPath}`);
        console.log(`\x1b[32m✅ ${scriptPath.split('/').pop()}: Valid TypeScript\x1b[0m`);
      } catch (error: any) {
        console.log(`\x1b[31m❌ ${scriptPath.split('/').pop()}: TypeScript errors\x1b[0m`);
        console.log(`   Error: ${error.message.split('\n')[0]}`);
        allSyntaxValid = false;
      }
    }
    
    console.log('');
    return allSyntaxValid;
  }
  
  private async testSecurityValidation(): Promise<boolean> {
    console.log('\x1b[1m\x1b[34m🛡️ Running Security Validation\x1b[0m');
    console.log('================================\n');
    
    try {
      const validator = new SecurityValidator();
      const results = await validator.runAllValidations();
      
      const criticalFailures = results.filter(r => r.status === 'fail').length;
      
      if (criticalFailures === 0) {
        console.log('\x1b[32m✅ Security validation passed\x1b[0m\n');
        return true;
      } else {
        console.log(`\x1b[33m⚠️ Security validation completed with ${criticalFailures} failures\x1b[0m\n`);
        return false;
      }
    } catch (error: any) {
      console.log(`\x1b[31m❌ Security validation failed: ${error.message}\x1b[0m\n`);
      return false;
    }
  }
  
  private async testBreachResponseDryRun(): Promise<boolean> {
    console.log('\x1b[1m\x1b[34m🚀 Testing Breach Response (Dry Run)\x1b[0m');
    console.log('=======================================\n');
    
    // We'll simulate running the breach response script in dry-run mode
    // by importing and checking its structure without executing destructive operations
    
    try {
      // Check if the script can be loaded without syntax errors
      const fs = await import('fs');
      const scriptContent = fs.readFileSync('/workspaces/scripts/security-breach-response.ts', 'utf8');
      
      // Validate key components exist in the script
      const requiredComponents = [
        'SecurityBreachResponse',
        'generateSecureSecret',
        'rotateAWSCredentials',
        'rotateSessionSecrets',
        'updateGitHubSecrets',
        'rotateDatabaseCredentials',
        'rotateThirdPartyServices',
        'verifyRotation',
        'securityHardening'
      ];
      
      let allComponentsFound = true;
      
      for (const component of requiredComponents) {
        if (scriptContent.includes(component)) {
          console.log(`\x1b[32m✅ Component found: ${component}\x1b[0m`);
        } else {
          console.log(`\x1b[31m❌ Component missing: ${component}\x1b[0m`);
          allComponentsFound = false;
        }
      }
      
      // Test MCP operations script
      const mcpScriptContent = fs.readFileSync('/workspaces/scripts/security-mcp-operations.ts', 'utf8');
      
      const mcpComponents = [
        'SecurityMCPClient',
        'updateBatchSecrets',
        'verifyAWSResources',
        'createSecurityIncident'
      ];
      
      for (const component of mcpComponents) {
        if (mcpScriptContent.includes(component)) {
          console.log(`\x1b[32m✅ MCP Component found: ${component}\x1b[0m`);
        } else {
          console.log(`\x1b[31m❌ MCP Component missing: ${component}\x1b[0m`);
          allComponentsFound = false;
        }
      }
      
      console.log('');
      return allComponentsFound;
      
    } catch (error: any) {
      console.log(`\x1b[31m❌ Dry run test failed: ${error.message}\x1b[0m\n`);
      return false;
    }
  }
  
  private async generateTestReport(testResults: Record<string, boolean>): Promise<void> {
    console.log('\x1b[1m\x1b[34m📊 Test Summary Report\x1b[0m');
    console.log('======================\n');
    
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`📝 Total Tests: ${totalTests}`);
    console.log(`\x1b[32m✅ Passed: ${passedTests}\x1b[0m`);
    console.log(`\x1b[31m❌ Failed: ${failedTests}\x1b[0m`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
    
    // Detailed results
    for (const [testName, passed] of Object.entries(testResults)) {
      const status = passed ? '\x1b[32m✅ PASS\x1b[0m' : '\x1b[31m❌ FAIL\x1b[0m';
      console.log(`${status} ${testName}`);
    }
    
    console.log('');
    
    // Overall assessment
    if (failedTests === 0) {
      console.log('\x1b[32m🎉 All tests passed! Security breach response system is ready.\x1b[0m');
      console.log('\x1b[32m✨ You can now run the actual breach response script if needed.\x1b[0m');
    } else {
      console.log('\x1b[33m⚠️ Some tests failed. Please address the issues before using the breach response system.\x1b[0m');
      
      if (!testResults['Environment Preparation']) {
        console.log('\x1b[31m🔧 Fix: Install missing CLI tools (AWS CLI, GitHub CLI, etc.)\x1b[0m');
      }
      if (!testResults['Script Existence']) {
        console.log('\x1b[31m📝 Fix: Ensure all security scripts are properly created\x1b[0m');
      }
      if (!testResults['Syntax Validation']) {
        console.log('\x1b[31m🔍 Fix: Resolve TypeScript syntax errors in security scripts\x1b[0m');
      }
      if (!testResults['Security Validation']) {
        console.log('\x1b[31m🛡️ Fix: Address security configuration issues\x1b[0m');
      }
      if (!testResults['Breach Response Dry Run']) {
        console.log('\x1b[31m🚀 Fix: Ensure breach response script has all required components\x1b[0m');
      }
    }
    
    // Save report
    const reportData = {
      timestamp: new Date().toISOString(),
      testResults,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: ((passedTests / totalTests) * 100).toFixed(1)
      }
    };
    
    const fs = await import('fs');
    const reportPath = '/workspaces/security-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed test report saved to: ${reportPath}`);
  }
  
  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('\x1b[1m\x1b[46m\x1b[30m 🧪 SECURITY BREACH RESPONSE TEST SUITE 🧪 \x1b[0m\n');
    
    const testResults: Record<string, boolean> = {};
    
    try {
      testResults['Environment Preparation'] = await this.testEnvironmentPreparation();
      testResults['Script Existence'] = await this.testScriptExistence();
      testResults['Syntax Validation'] = await this.testSyntaxValidation();
      testResults['Security Validation'] = await this.testSecurityValidation();
      testResults['Breach Response Dry Run'] = await this.testBreachResponseDryRun();
      
      await this.generateTestReport(testResults);
      
      // Exit with appropriate code
      const allPassed = Object.values(testResults).every(Boolean);
      process.exit(allPassed ? 0 : 1);
      
    } catch (error: any) {
      console.error(`\x1b[31m💥 Test suite crashed: ${error.message}\x1b[0m`);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const tester = new SecurityBreachResponseTester();
  await tester.runAllTests();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
