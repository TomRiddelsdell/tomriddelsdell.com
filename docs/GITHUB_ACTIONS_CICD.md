# GitHub Actions CI/CD Pipeline Documentation

## 🚀 Overview

This document covers the complete CI/CD pipeline setup for tomriddelsdell.com using GitHub Actions with AWS deployment. The pipeline follows Domain-Driven Design principles and includes comprehensive testing, security scanning, cost monitoring, and automated deployments.

## 📁 Pipeline Structure

```
.github/workflows/
├── deploy.yml              # Main deployment pipeline
├── dependencies.yml        # Dependency management & security
└── aws-monitoring.yml      # Cost & infrastructure monitoring
```

## 🔄 Workflow Overview

### 1. **Main Deployment Pipeline** (`deploy.yml`)
- **Trigger**: Push to main/develop, PRs, manual dispatch
- **Environments**: Staging (develop branch), Production (main branch)
- **Features**: Testing, building, deployment, health checks

### 2. **Dependency Management** (`dependencies.yml`)
- **Trigger**: Weekly schedule, dependency file changes
- **Features**: Security audits, automated updates, license compliance

### 3. **AWS Monitoring** (`aws-monitoring.yml`)
- **Trigger**: Daily schedule
- **Features**: Cost monitoring, infrastructure health, cleanup

## 🔧 Required Setup

### 1. **AWS OIDC Configuration**

First, set up OpenID Connect for secure, keyless authentication:

```bash
# Create OIDC Identity Provider in AWS
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 2. **IAM Roles for GitHub Actions**

Create IAM roles for each environment:

#### Staging Role (`GitHubActions-Staging-Role`)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:TomRiddelsdell/tomriddelsdell.com:*"
        }
      }
    }
  ]
}
```

#### Required Permissions Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "lambda:*",
        "apigateway:*",
        "cloudfront:*",
        "route53:*",
        "iam:GetRole",
        "iam:PassRole",
        "logs:*",
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. **GitHub Repository Secrets**

Configure the following secrets in your GitHub repository:

#### AWS Configuration
```
AWS_STAGING_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/GitHubActions-Staging-Role
AWS_PRODUCTION_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/GitHubActions-Production-Role
AWS_MONITORING_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/GitHubActions-Monitoring-Role
```

#### Staging Environment
```
STAGING_DOMAIN_NAME=dev.tomriddelsdell.com
STAGING_CERTIFICATE_ARN=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/STAGING_CERT_ID
STAGING_COGNITO_USER_POOL_ID=eu-west-2_STAGINGPOOL
STAGING_DATABASE_URL=postgresql://user:pass@staging-db:5432/staging_db
```

#### Production Environment
```
PRODUCTION_DOMAIN_NAME=tomriddelsdell.com
PRODUCTION_CERTIFICATE_ARN=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/PROD_CERT_ID
PRODUCTION_COGNITO_USER_POOL_ID=eu-west-2_PRODPOOL
PRODUCTION_DATABASE_URL=postgresql://user:pass@prod-db:5432/prod_db
```

### 4. **GitHub Environments**

Create protected environments in GitHub:

#### Staging Environment
- **Protection Rules**: Require pull request reviews
- **Deployment Branches**: `develop` branch only
- **Environment Variables**: Staging-specific configurations

#### Production Environment
- **Protection Rules**: Require manual approval for production deployments
- **Deployment Branches**: `main` branch only
- **Environment Variables**: Production-specific configurations

## 🔄 Deployment Workflows

### Automatic Deployments

| Branch | Environment | Trigger | Approval Required |
|--------|-------------|---------|-------------------|
| `develop` | Staging | Auto on push | No |
| `main` | Production | Auto on push | Yes |

### Manual Deployments

Use the GitHub Actions interface or CLI:

```bash
# Manual staging deployment
gh workflow run deploy.yml -f environment=staging

# Manual production deployment
gh workflow run deploy.yml -f environment=production
```

## 🧪 Testing Strategy

### Quality Assurance Pipeline
1. **Type Checking** - TypeScript compilation validation
2. **Unit Tests** - Jest/Vitest test suite
3. **Integration Tests** - API and database integration
4. **Security Audit** - npm audit for vulnerabilities
5. **Build Verification** - Ensure all artifacts are created

### Post-Deployment Testing
1. **Health Checks** - Frontend and API endpoint validation
2. **Monitoring** - CloudWatch metrics validation
3. **Performance** - Response time verification

## 💰 Cost Management

### Automated Cost Monitoring
- **Daily Checks** - Monitor AWS spending against thresholds
- **Alerts** - Automatic issue creation when costs exceed limits
- **Forecasting** - Next month cost predictions
- **Breakdown** - Per-service cost analysis

### Cost Optimization Features
- **Resource Cleanup** - Automated cleanup of old logs and artifacts
- **Utilization Monitoring** - Track Lambda invocations and errors
- **Budget Alerts** - Integration with AWS Cost Explorer

### Cost Thresholds
- **Warning**: $25/month
- **Alert**: $50/month
- **Emergency**: $100/month

## 🔒 Security Features

### Dependency Security
- **Vulnerability Scanning** - Daily npm audit checks
- **Automated Updates** - Weekly dependency updates for patches
- **License Compliance** - Ensure only approved licenses are used

### Infrastructure Security
- **OIDC Authentication** - Keyless AWS access using OpenID Connect
- **Least Privilege** - Minimal IAM permissions for each role
- **Secrets Management** - GitHub Secrets for sensitive data

### Security Monitoring
- **Audit Logs** - CloudWatch logging for all actions
- **Health Monitoring** - Regular endpoint health checks
- **Alert Systems** - Automated issue creation for security concerns

## 📊 Monitoring & Alerting

### Infrastructure Health
- **Endpoint Monitoring** - Regular health check of all services
- **Performance Tracking** - Bundle size and performance metrics
- **Availability Monitoring** - Uptime tracking for staging and production

### Automated Alerts
All alerts create GitHub issues with appropriate labels:

| Alert Type | Trigger | Labels | Priority |
|------------|---------|--------|----------|
| Cost Alert | >$50/month | `cost-alert`, `aws`, `urgent` | High |
| Security Alert | High-severity vulnerabilities | `security`, `dependencies`, `high-priority` | High |
| Health Alert | Service unavailable | `infrastructure`, `production`, `urgent` | Critical |
| Performance Alert | Bundle >5MB | `performance`, `optimization` | Medium |
| License Alert | Incompatible license | `legal`, `compliance` | Medium |

## 🚀 Deployment Process

### Staging Deployment (Automatic)
1. **Trigger**: Push to `develop` branch
2. **Quality Gate**: All tests must pass
3. **Deployment**: Automatic deployment to staging
4. **Verification**: Post-deployment health checks
5. **Notification**: Slack/email notification (if configured)

### Production Deployment (Approval Required)
1. **Trigger**: Push to `main` branch or manual dispatch
2. **Quality Gate**: All tests + manual approval
3. **Deployment**: Deploy to production with blue-green strategy
4. **Cache Invalidation**: CloudFront cache invalidation
5. **Health Checks**: Comprehensive production validation
6. **Release**: Automatic GitHub release creation

## 🔧 Troubleshooting

### Common Issues

#### 1. **AWS Authentication Failures**
```bash
# Check OIDC configuration
aws sts get-caller-identity

# Verify role trust policy includes GitHub Actions
aws iam get-role --role-name GitHubActions-Production-Role
```

#### 2. **Deployment Failures**
```bash
# Check CloudFormation stack status
aws cloudformation describe-stack-events --stack-name tomriddelsdell-com-production

# View Lambda logs
aws logs tail /aws/lambda/tomriddelsdell-com-api-production --follow
```

#### 3. **Health Check Failures**
```bash
# Test endpoints manually
curl -v https://tomriddelsdell.com/health
curl -v https://tomriddelsdell.com/api/health

# Check CloudFront distribution
aws cloudfront list-distributions
```

### Debug Commands

#### Workflow Debugging
```bash
# List workflow runs
gh run list --workflow=deploy.yml

# View specific run logs
gh run view [RUN_ID] --log

# Re-run failed jobs
gh run rerun [RUN_ID]
```

#### AWS Resource Debugging
```bash
# Check all resources in stack
aws cloudformation describe-stack-resources --stack-name tomriddelsdell-com-production

# View Lambda function configuration
aws lambda get-function-configuration --function-name tomriddelsdell-com-api-production

# Check S3 bucket contents
aws s3 ls s3://tomriddelsdell-com-frontend-production/
```

## 📈 Performance Optimization

### Build Optimization
- **Code Splitting** - Automatic chunk splitting for optimal loading
- **Tree Shaking** - Remove unused code from bundles
- **Asset Optimization** - Compress images and static assets
- **Bundle Analysis** - Track bundle sizes over time

### Runtime Optimization
- **Lambda Memory** - Right-size memory allocation based on usage
- **CloudFront Caching** - Optimize cache headers and invalidation
- **Database Indexing** - Monitor and optimize database queries

### Monitoring Metrics
- **Bundle Size Tracking** - Alert when bundles exceed thresholds
- **Performance Budgets** - Enforce performance constraints
- **Utilization Tracking** - Monitor resource usage patterns

## 🔄 Maintenance

### Regular Tasks
- **Weekly**: Review dependency updates and security alerts
- **Monthly**: Analyze cost reports and optimize resource usage
- **Quarterly**: Review and update security policies and permissions

### Automated Maintenance
- **Daily**: Cost monitoring and health checks
- **Weekly**: Dependency updates and security scans
- **Monthly**: Resource cleanup and optimization

### Manual Maintenance
- **Performance Reviews**: Analyze bundle sizes and optimization opportunities
- **Security Reviews**: Review IAM policies and access patterns
- **Cost Reviews**: Analyze spending patterns and optimization opportunities

## 📚 Additional Resources

### Documentation Links
- **[AWS Deployment Guide](../docs/AWS_DEPLOYMENT_GUIDE.md)** - Complete migration guide
- **[Neptune Cost Analysis](../docs/NEPTUNE_COST_ANALYSIS.md)** - Graph database cost analysis
- **[Architecture Overview](../docs/ARCHITECTURE.md)** - DDD structure documentation

### Useful Commands
```bash
# Cost estimation
./infrastructure/deployment/aws/scripts/aws-cost-calculator.sh

# Manual deployment
./infrastructure/deployment/aws/scripts/aws-deploy.sh production

# Local development
npm run dev

# Run tests
npm run test
```

### Best Practices
1. **Always test in staging first** before production deployments
2. **Monitor costs regularly** to avoid unexpected charges
3. **Keep dependencies updated** for security and performance
4. **Use feature flags** for safe production rollouts
5. **Maintain good commit hygiene** for clear deployment history

---

**Ready to deploy?** The CI/CD pipeline is production-ready and follows AWS best practices while maintaining your DDD architecture integrity!
