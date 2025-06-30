#!/usr/bin/env tsx

/**
 * Production Readiness Validation Script
 * Comprehensive checks for production deployment readiness
 */

import { EnvironmentValidator } from './validate-environment';

interface HealthCheckResult {
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'error';
  responseTime?: number;
  error?: string;
}

class ProductionReadinessChecker {
  private validator: EnvironmentValidator;

  constructor() {
    this.validator = new EnvironmentValidator();
  }

  /**
   * Check API health endpoints
   */
  private async checkHealthEndpoints(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    const baseUrl = process.env.REPLIT_DOMAINS ? 
      `https://${process.env.REPLIT_DOMAINS}` : 
      'http://localhost:5000';

    const endpoints = [
      '/api/health',
      '/api/monitoring/status',
      '/api/auth/me'
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const responseTime = Date.now() - startTime;
        
        results.push({
          endpoint,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime,
          error: response.ok ? undefined : `HTTP ${response.status}`
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Validate production-specific environment variables
   */
  private validateProductionEnvironment(): void {
    console.log('🔍 Checking production environment variables...\n');
    
    const criticalVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'VITE_AWS_COGNITO_CLIENT_ID',
      'VITE_AWS_COGNITO_USER_POOL_ID',
      'VITE_AWS_COGNITO_REGION',
      'VITE_AWS_COGNITO_HOSTED_UI_DOMAIN',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ];

    const missing = criticalVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.log('❌ Missing critical environment variables:');
      missing.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      console.log('');
      return false;
    }

    console.log('✅ All critical environment variables present\n');
    return true;
  }

  /**
   * Check security configuration
   */
  private validateSecurityConfiguration(): boolean {
    console.log('🔒 Validating security configuration...\n');
    
    let isSecure = true;

    // Check session secret strength
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 32) {
      console.log('❌ SESSION_SECRET is too weak (must be 32+ characters)');
      isSecure = false;
    } else if (sessionSecret.includes('default') || sessionSecret.includes('change')) {
      console.log('❌ SESSION_SECRET appears to be a default value');
      isSecure = false;
    } else {
      console.log('✅ Session secret is strong');
    }

    // Check CORS configuration for production
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.CORS_ALLOWED_ORIGINS) {
        console.log('⚠️  CORS_ALLOWED_ORIGINS not explicitly set');
      } else {
        console.log('✅ CORS origins explicitly configured');
      }
    }

    // Check if HTTPS is enforced
    if (process.env.NODE_ENV === 'production' && process.env.SESSION_SECURE !== 'true') {
      console.log('⚠️  SESSION_SECURE not set to true for production');
    } else if (process.env.NODE_ENV === 'production') {
      console.log('✅ Session security configured for HTTPS');
    }

    console.log('');
    return isSecure;
  }

  /**
   * Test build process
   */
  private async testBuildProcess(): Promise<boolean> {
    console.log('🔨 Testing build process...\n');
    
    try {
      const { execSync } = await import('child_process');
      
      console.log('Building application...');
      execSync('npm run build', { stdio: 'pipe' });
      
      console.log('✅ Build completed successfully\n');
      return true;
    } catch (error) {
      console.log('❌ Build failed');
      if (error instanceof Error) {
        console.log(`Error: ${error.message}\n`);
      }
      return false;
    }
  }

  /**
   * Run comprehensive production readiness check
   */
  async runFullCheck(): Promise<boolean> {
    console.log('🚀 Production Readiness Check\n');
    console.log('='.repeat(50) + '\n');

    let allChecksPass = true;

    // 1. Environment validation
    await this.validator.validate();
    if (!this.validator.isDeploymentReady()) {
      allChecksPass = false;
    }

    // 2. Production environment variables
    if (!this.validateProductionEnvironment()) {
      allChecksPass = false;
    }

    // 3. Security configuration
    if (!this.validateSecurityConfiguration()) {
      allChecksPass = false;
    }

    // 4. Build process test
    if (!await this.testBuildProcess()) {
      allChecksPass = false;
    }

    // 5. Health endpoint checks (if server is running)
    console.log('🌐 Testing API endpoints...\n');
    try {
      const healthResults = await this.checkHealthEndpoints();
      
      healthResults.forEach(result => {
        const statusIcon = result.status === 'healthy' ? '✅' : 
                          result.status === 'unhealthy' ? '⚠️' : '❌';
        const timing = result.responseTime ? ` (${result.responseTime}ms)` : '';
        const error = result.error ? ` - ${result.error}` : '';
        
        console.log(`   ${statusIcon} ${result.endpoint}${timing}${error}`);
      });
      
      const healthyEndpoints = healthResults.filter(r => r.status === 'healthy').length;
      console.log(`\n   ${healthyEndpoints}/${healthResults.length} endpoints healthy\n`);
      
    } catch (error) {
      console.log('❌ Could not test endpoints (server may not be running)\n');
    }

    // Final summary
    console.log('='.repeat(50));
    if (allChecksPass) {
      console.log('🎉 PRODUCTION READY');
      console.log('✅ All critical checks passed');
      console.log('✅ Application is ready for deployment');
    } else {
      console.log('❌ NOT PRODUCTION READY');
      console.log('🔧 Fix the issues above before deploying');
    }
    console.log('='.repeat(50));

    return allChecksPass;
  }
}

// Run check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new ProductionReadinessChecker();
  
  checker.runFullCheck()
    .then((isReady) => {
      process.exit(isReady ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Production readiness check failed:', error);
      process.exit(1);
    });
}

export { ProductionReadinessChecker };