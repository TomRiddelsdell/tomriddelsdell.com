# ☁️ Deployment Guide

**Simple AWS deployment with automated CI/CD**

## Quick Deploy Options

### Option 1: GitHub Actions (Recommended)
**Setup once, deploy automatically**

1. **Fork the repository** on GitHub
2. **Add secrets** in your repo settings → Secrets and variables → Actions:
   ```
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=your-secret...
   PRODUCTION_DATABASE_URL=postgresql://...
   SESSION_SECRET=your-32-char-secret
   ```
3. **Push to main branch** → Automatic deployment!

### Option 2: Manual Deployment
**Direct AWS deployment**

```bash
# 1. Build the application
npm run build

# 2. Deploy to AWS
./infrastructure/deployment/aws/scripts/deploy-production.sh

# 3. Your site is live!
```

## Prerequisites

### AWS Account Setup
1. **AWS Account**: Free tier is sufficient to start
2. **IAM User**: Create user with programmatic access
3. **Permissions**: Attach these AWS managed policies:
   - `AWSLambdaFullAccess`
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
   - `AWSCloudFormationFullAccess`
   - `AmazonAPIGatewayAdministrator`

### Domain Setup (Optional)
1. **Domain Registration**: Register your domain
2. **SSL Certificate**: Request in AWS Certificate Manager
3. **DNS Configuration**: Point domain to CloudFront distribution

## Infrastructure Overview

### AWS Resources Created
```
Your Domain (HTTPS)
    ↓
CloudFront CDN (Global)
    ↓
API Gateway (Regional)
    ↓
Lambda Function (Your app)
    ↓
PostgreSQL Database
```

### Cost Estimation
- **Development**: $0-5/month (within free tier)
- **Small Production**: $10-25/month
- **High Traffic**: $25-50/month

## Environment Configuration

### Required Environment Variables
```bash
# Core Application
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/database

# Security
SESSION_SECRET=your-cryptographically-secure-32-character-secret

# AWS Infrastructure
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret
AWS_ACCOUNT_ID=123456789012
AWS_DEFAULT_REGION=eu-west-2

# Optional: Custom Domain
PRODUCTION_CERTIFICATE_ARN=arn:aws:acm:...
DOMAIN_NAME=yourdomain.com
```

### Optional Integrations
```bash
# GitHub Integration (for portfolio features)
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=yourusername
GITHUB_REPO=yourrepo

# Email Service (for contact forms)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Authentication (if using AWS Cognito)
COGNITO_USER_POOL_ID=eu-west-2_...
COGNITO_CLIENT_ID=...
```

## Database Setup

### Option 1: Neon (Recommended)
**Free PostgreSQL with modern features**

1. **Create account** at [console.neon.tech](https://console.neon.tech)
2. **Create database** → Copy connection string
3. **Update environment**:
   ```bash
   DATABASE_URL=postgresql://user:pass@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Option 2: AWS RDS
**Managed PostgreSQL on AWS**

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier myapp-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username myuser \
  --master-user-password mypassword \
  --allocated-storage 20
```

### Option 3: Local Development
**For testing only**

```bash
# Install PostgreSQL locally
# Create database
createdb tomriddelsdell_dev

# Update .env
DATABASE_URL=postgresql://user:pass@localhost:5432/tomriddelsdell_dev
```

## Deployment Process

### Automated Deployment (GitHub Actions)
**Triggers on every push to main**

1. **Code Quality**: Linting, type checking, testing
2. **Security Scan**: Dependency vulnerabilities, code analysis
3. **Build**: Optimize for production
4. **Deploy**: Update AWS infrastructure
5. **Verify**: Health checks and monitoring

### Manual Deployment
**For direct control**

```bash
# 1. Prepare environment
cp .env.template .env.production
# Edit .env.production with production values

# 2. Build application
NODE_ENV=production npm run build

# 3. Deploy to AWS
export $(cat .env.production | xargs)
./infrastructure/deployment/aws/scripts/deploy-production.sh

# 4. Verify deployment
curl https://yourdomain.com/api/health
```

## Troubleshooting

### Common Issues

❌ **"CloudFormation stack failed"**
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name tomriddelsdell-com-production

# Clean up failed stack
aws cloudformation delete-stack --stack-name tomriddelsdell-com-production
```

❌ **"Lambda function timeout"**
```bash
# Check function logs
aws logs tail /aws/lambda/tomriddelsdell-com-production --follow

# Increase timeout in CloudFormation template
Timeout: 30  # seconds
```

❌ **"Database connection failed"**
```bash
# Verify database URL
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL" -c "SELECT 1;"
```

❌ **"Certificate validation failed"**
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn $CERTIFICATE_ARN

# Ensure DNS validation records are created
# Check domain registrar DNS settings
```

### Debug Mode
```bash
# Enable detailed logging
export DEBUG=true

# Deploy with verbose output
./infrastructure/deployment/aws/scripts/deploy-production.sh --verbose
```

## Support & Resources

For detailed information, see:
- [SECURITY.md](SECURITY.md) - Security configuration and best practices
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview

### Community
- [GitHub Issues](https://github.com/TomRiddelsdell/tomriddelsdell.com/issues)
- [GitHub Discussions](https://github.com/TomRiddelsdell/tomriddelsdell.com/discussions)
- [AWS Community](https://aws.amazon.com/developer/community/)
