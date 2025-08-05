/**
 * Production Environment Configuration
 * 
 * Production-optimized settings with security hardening.
 */

module.exports = {
  // Environment setting
  environment: 'production',

  // Production security hardening
  security: {
    session: {
      secure: true, // HTTPS only in production
      sameSite: 'strict' // Stricter CSRF protection
    },
    rateLimit: {
      windowMs: 900000, // 15 minutes
      maxRequests: 100 // Stricter rate limiting
    }
  },

  // Production database settings
  database: {
    pool: {
      min: 2, // Higher minimum for production
      max: 10, // Larger pool for production load
      idleTimeoutMillis: 30000
    },
    ssl: {
      enabled: true, // SSL required in production
      rejectUnauthorized: true
    }
  },

  // Production feature flags
  features: {
    debugMode: false, // No debug mode in production
    emailEnabled: true, // Enable emails in production
    analyticsEnabled: true
  },

  // Production logging
  logging: {
    level: 'info', // Less verbose logging
    enableConsole: true,
    enableFile: true, // Enable file logging
    enableDatabase: true, // Enable database logging
    format: 'json', // Structured logging for analysis
    maxFileSize: '50mb', // Larger files in production
    maxFiles: 10
  }
};
