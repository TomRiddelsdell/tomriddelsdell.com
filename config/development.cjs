/**
 * Development Environment Configuration
 * 
 * Overrides for development environment.
 * These settings optimize for developer experience and debugging.
 */

module.exports = {
  // Environment-specific security settings
  security: {
    session: {
      secure: false // Allow HTTP in development
    },
    cors: {
      // Additional development origins
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        'http://localhost:8080', // Additional dev ports
        'http://localhost:8000'
      ]
    },
    rateLimit: {
      windowMs: 60000, // 1 minute - lenient for development
      maxRequests: 1000 // High limit for development testing
    }
  },

  // Development database settings
  database: {
    pool: {
      min: 1, // Minimal pool for development
      max: 5,
      idleTimeoutMillis: 10000
    },
    ssl: {
      enabled: false, // No SSL for local development
      rejectUnauthorized: false
    }
  },

  // Development feature flags
  features: {
    debugMode: true, // Enable debug mode in development
    emailEnabled: false, // Disable emails in development
    analyticsEnabled: true
  },

  // Development logging
  logging: {
    level: 'debug', // Verbose logging for development
    enableConsole: true,
    enableFile: false, // No file logging in development
    enableDatabase: false, // No DB logging in development
    format: 'simple' // Human-readable format
  }
};
