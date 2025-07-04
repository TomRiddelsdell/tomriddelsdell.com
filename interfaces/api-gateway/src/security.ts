import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getConfig } from '../../../infrastructure/configuration/config-loader';

/**
 * Secure rate limiting using centralized configuration
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create secure rate limiter using centralized configuration
let generalRateLimitInstance: any = null;

export function getGeneralRateLimit() {
  if (!generalRateLimitInstance) {
    const config = getConfig();
    const rateLimitConfig = config.security.rateLimit;
    
    generalRateLimitInstance = rateLimit({
      windowMs: rateLimitConfig.windowMs,
      max: rateLimitConfig.maxRequests,
      message: {
        error: 'Too many requests. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: rateLimitConfig.skipSuccessfulRequests,
      skipFailedRequests: rateLimitConfig.skipFailedRequests,
      skip: (req) => {
        // Skip rate limiting for development on localhost
        return process.env.NODE_ENV === 'development' && 
               (req.hostname === 'localhost' || req.hostname === '127.0.0.1');
      }
    });
  }
  
  return generalRateLimitInstance;
}

export const generalRateLimit = getGeneralRateLimit();

/**
 * Security headers middleware using centralized configuration
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  const config = getConfig();
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy from configuration
  const cspDirectives = config.security.csp.directives;
  const cspString = Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
  
  res.setHeader('Content-Security-Policy', cspString);
  
  next();
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Remove potential XSS characters from strings
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}