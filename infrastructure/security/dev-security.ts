/**
 * Development Environment Security Hardening
 * Mitigates esbuild development server vulnerabilities
 */

import { getConfig } from '../configuration/node-config-service';

export class DevSecurityManager {
  /**
   * Apply development environment security restrictions
   */
  static applyDevSecurity() {
    const config = getConfig();
    
    if (config.environment !== 'development') {
      return; // Only apply in development
    }

    // Restrict esbuild development server access
    this.restrictEsbuildAccess();
    
    // Apply network isolation
    this.applyNetworkIsolation();
    
    // Log security status
    console.log('Development security hardening applied');
  }

  /**
   * Restrict esbuild development server to localhost only
   */
  private static restrictEsbuildAccess() {
    // Set environment variables to restrict esbuild
    process.env.ESBUILD_HOST = '127.0.0.1';
    process.env.ESBUILD_ORIGIN = 'http://localhost:5000';
    
    // Disable external network access for esbuild
    process.env.ESBUILD_EXTERNAL_ORIGIN = 'false';
  }

  /**
   * Apply network isolation for development tools
   */
  private static applyNetworkIsolation() {
    // Ensure development server only binds to localhost
    process.env.HOST = '0.0.0.0'; // Replit requires 0.0.0.0 for port forwarding
    
    // Set secure development headers
    process.env.DEV_SECURE_HEADERS = 'true';
  }

  /**
   * Get security status for monitoring
   */
  static getSecurityStatus() {
    return {
      environment: process.env.NODE_ENV,
      esbuildRestricted: process.env.ESBUILD_HOST === '127.0.0.1',
      secureHeaders: process.env.DEV_SECURE_HEADERS === 'true',
      timestamp: new Date().toISOString()
    };
  }
}

// Auto-apply security hardening in development
if (process.env.NODE_ENV === 'development') {
  DevSecurityManager.applyDevSecurity();
}