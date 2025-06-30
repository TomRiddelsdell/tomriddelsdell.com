# Production Security Configuration Guide

## Required Environment Variables for Production

### Critical Security Settings
```bash
# Session Security - Generate 64-character random string
SESSION_SECRET=your_production_session_secret_minimum_64_characters_here
SESSION_SECURE=true
SESSION_MAX_AGE=86400000

# CORS Configuration - Replace with actual production domains
CORS_ALLOWED_ORIGINS=https://your-production-domain.com,https://your-admin-domain.com

# Rate Limiting - Production values
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Database Security
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### AWS Cognito Production Configuration
```bash
# Production Cognito Settings
VITE_AWS_COGNITO_CLIENT_ID=your_production_client_id
VITE_AWS_COGNITO_REGION=your_production_region
VITE_AWS_COGNITO_USER_POOL_ID=your_production_pool_id
VITE_AWS_COGNITO_HOSTED_UI_DOMAIN=https://your-production-domain.auth.region.amazoncognito.com

# Production AWS Credentials
AWS_ACCESS_KEY_ID=your_production_access_key
AWS_SECRET_ACCESS_KEY=your_production_secret_key
```

### Application URLs
```bash
# Production URLs - Update these to match your deployment
BASE_URL=https://your-production-domain.com
CALLBACK_URL=https://your-production-domain.com/auth/callback
LOGOUT_URL=https://your-production-domain.com
PRODUCTION_DOMAIN=https://your-production-domain.com
```

### Feature Flags
```bash
# Production Feature Configuration
FEATURE_EMAIL_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
FEATURE_NEW_USER_REGISTRATION=true
DEBUG_MODE=false
MAINTENANCE_MODE=false
```

### Logging Configuration
```bash
# Production Logging
LOG_LEVEL=warn
LOG_ENABLE_CONSOLE=false
LOG_ENABLE_FILE=true
LOG_ENABLE_DATABASE=true
LOG_FORMAT=json
```

## Security Hardening Checklist

### ✅ Already Implemented
- [x] Centralized configuration system with validation
- [x] Secure CORS configuration with environment-specific origins
- [x] Rate limiting with configurable thresholds
- [x] Input sanitization middleware
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [x] Content Security Policy
- [x] Session security with configurable parameters
- [x] Authentication rate limiting
- [x] Database connection security

### 🔄 Production Deployment Requirements
- [ ] Set SESSION_SECURE=true for HTTPS-only cookies
- [ ] Configure CORS_ALLOWED_ORIGINS with actual production domains
- [ ] Set restrictive rate limits (50 requests per 15 minutes)
- [ ] Enable database SSL with certificate validation
- [ ] Disable debug mode and development features
- [ ] Configure production logging levels
- [ ] Set up AWS Cognito for production domain
- [ ] Implement brute force protection for authentication

### 🚀 Additional Production Hardening
- [ ] Enable HSTS headers for HTTPS enforcement
- [ ] Implement API key rotation schedule
- [ ] Set up automated security scanning
- [ ] Configure backup and disaster recovery
- [ ] Implement monitoring and alerting
- [ ] Set up log aggregation and analysis

## Deployment Security Validation

### Pre-Deployment Checks
1. **Environment Variables**: All required secrets configured
2. **CORS Origins**: Only production domains allowed
3. **Rate Limits**: Appropriate for production traffic
4. **Database**: SSL enabled with proper certificates
5. **Authentication**: AWS Cognito configured for production
6. **Logging**: Production-appropriate levels configured

### Post-Deployment Validation
1. **Security Headers**: Verify all security headers present
2. **HTTPS**: Confirm all traffic uses HTTPS
3. **Rate Limiting**: Test rate limits are enforced
4. **Authentication**: Verify login/logout flows work
5. **Database**: Confirm secure connection established
6. **Monitoring**: Verify security logs are captured

## Security Monitoring

### Key Metrics to Monitor
- Authentication failure rates
- Rate limit violations
- Unusual traffic patterns
- Database connection errors
- Security header compliance
- Session security metrics

### Alert Thresholds
- Authentication failures: >10 per minute
- Rate limit violations: >50 per hour
- Database connection failures: >5 per minute
- Security header violations: Any occurrence
- Session security breaches: Any occurrence

## Emergency Response

### Security Incident Response
1. **Immediate**: Disable compromised accounts
2. **Short-term**: Rotate affected credentials
3. **Long-term**: Implement additional security measures
4. **Recovery**: Validate system integrity

### Contact Information
- Security Team: [security@your-domain.com]
- AWS Support: [aws-support-contact]
- Database Admin: [dba@your-domain.com]