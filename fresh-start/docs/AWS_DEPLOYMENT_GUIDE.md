# AWS Deployment Guide for tomriddelsdell.com

## 🚀 Overview

This guide covers migrating your DDD-architected website from Replit to AWS using a cost-optimized serverless infrastructure. The deployment follows Domain-Driven Design principles and maintains your existing project structure.

## 📊 Cost Comparison: Replit vs AWS

### Current Replit Setup
- **Monthly Cost**: $20/month (Hacker Plan)
- **Includes**: Hosting, compute, storage, collaboration features
- **Limitations**: Vendor lock-in, limited scalability

### Recommended AWS Serverless Setup
- **Monthly Cost**: $8-30/month (with existing Neon DB)
- **Monthly Cost**: $25-55/month (with RDS Serverless)
- **Benefits**: Unlimited scalability, enterprise-grade reliability, AWS ecosystem

### AWS Cost Breakdown (EU-West-2)
```
Service                 Development    Production
CloudFront CDN         $1-3/month     $3-8/month
S3 Static Hosting      $1-2/month     $2-5/month
Lambda Functions       $0-5/month     $5-15/month
API Gateway           $0-3/month     $3-10/month
Route 53 DNS          $0.50/month    $0.50/month
Monitoring/Logs       $2-5/month     $5-15/month
--------------------------------
Total (with Neon DB)  $5-19/month    $19-54/month
Total (with RDS)      $20-50/month   $44-99/month
```

### AWS Free Tier Benefits (First 12 months)
- Lambda: 1M requests/month FREE
- S3: 5GB storage + 20K GET requests FREE
- CloudFront: 1TB transfer FREE
- API Gateway: 1M API calls FREE
- **Effective Cost**: $5-15/month for the first year

## 🏗️ Architecture Overview

### Current DDD Structure (Preserved)
```
domains/                 # Domain logic (unchanged)
├── analytics/
├── identity/
├── monitoring/
└── shared-kernel/

infrastructure/          # Infrastructure layer
├── deployment/
│   └── aws/            # NEW: AWS-specific deployment
│       ├── cloudformation/
│       └── scripts/
├── database/           # Database schemas (unchanged)
└── configuration/      # Config management (unchanged)

interfaces/             # Interface layer
├── api-gateway/        # Express.js API (adapted for Lambda)
└── web-frontend/       # React SPA (deployed to S3/CloudFront)
```

### AWS Serverless Infrastructure
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Route 53      │    │   CloudFront     │    │   S3 Bucket     │
│   DNS           │────│   CDN            │────│   Frontend      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                │ /api/*
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   API Gateway    │────│   Lambda        │
                       │   REST API       │    │   Express App   │
                       └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Neon/RDS      │
                                               │   PostgreSQL    │
                                               └─────────────────┘
```

## 🛠️ Prerequisites

### 1. AWS Account Setup
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: eu-west-2
# Default output format: json
```

### 2. SSL Certificate (Required)
```bash
# Request SSL certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name tomriddelsdell.com \
  --subject-alternative-names www.tomriddelsdell.com \
  --validation-method DNS \
  --region us-east-1

# Note the Certificate ARN for deployment
```

### 3. Environment Variables
Create `.env.aws` file:
```bash
# Required for deployment
DOMAIN_NAME=tomriddelsdell.com
CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
COGNITO_USER_POOL_ID=eu-west-2_XXXXXXXXX
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional
AWS_DEFAULT_REGION=eu-west-2
PROJECT_NAME=tomriddelsdell-com
```

## 🚀 Deployment Process

### Phase 1: Infrastructure Setup
```bash
# Load environment variables
source .env.aws

# Deploy AWS infrastructure
./infrastructure/deployment/aws/scripts/aws-deploy.sh production

# This creates:
# - S3 bucket for frontend
# - CloudFront distribution
# - API Gateway
# - Lambda function
# - Route 53 DNS records
```

### Phase 2: Database Migration (if needed)
```bash
# If migrating from Neon to RDS
./scripts/migrate-database.sh

# Or keep existing Neon setup (recommended for cost)
# Just update DATABASE_URL in environment
```

### Phase 3: Domain Configuration
```bash
# Update nameservers in your domain registrar
# Point to Route 53 hosted zone nameservers

# Verify DNS propagation
dig tomriddelsdell.com
nslookup tomriddelsdell.com
```

### Phase 4: Deployment Verification
```bash
# Test API health
curl https://tomriddelsdell.com/api/health

# Test frontend
curl -I https://tomriddelsdell.com

# Check CloudWatch logs
aws logs tail /aws/lambda/tomriddelsdell-com-api-production --follow
```

## 📁 Files Created/Modified

### New AWS Infrastructure Files
```
infrastructure/deployment/aws/
├── cloudformation/
│   └── aws-serverless-infrastructure.json    # Main infrastructure template
└── scripts/
    └── aws-deploy.sh                          # Deployment automation

interfaces/api-gateway/src/
└── aws-lambda-adapter.ts                     # Lambda Express adapter

docs/
└── AWS_DEPLOYMENT_GUIDE.md                   # This guide
```

### Modified Files
```
package.json                   # Added Lambda build scripts
vite.config.ts                # Added AWS build configuration
interfaces/api-gateway/src/    # CORS adapted for CloudFront
```

## 🔧 Development Workflow

### Local Development (Unchanged)
```bash
npm run dev                    # Local development server
npm run test                   # Run tests
```

### AWS Development Environment
```bash
# Deploy to development environment
./infrastructure/deployment/aws/scripts/aws-deploy.sh development

# Test development deployment
curl https://dev.tomriddelsdell.com/api/health
```

### Production Deployment
```bash
# Full production deployment
./infrastructure/deployment/aws/scripts/aws-deploy.sh production

# Quick Lambda-only update
./infrastructure/deployment/aws/scripts/aws-deploy.sh production --skip-frontend

# Dry run (show what would be deployed)
./infrastructure/deployment/aws/scripts/aws-deploy.sh production --dry-run
```

## 🎯 Migration Strategies

### Strategy 1: Gradual Migration (Recommended)
1. **Week 1**: Deploy staging environment to AWS
2. **Week 2**: Test all functionality, performance tuning
3. **Week 3**: Deploy production, DNS cutover
4. **Week 4**: Monitor, optimize, decommission Replit

### Strategy 2: Parallel Operation
1. Keep Replit for development ($20/month)
2. Use AWS for production ($25-55/month)
3. Total cost: $45-75/month for maximum reliability

### Strategy 3: Full Migration
1. Deploy to AWS staging
2. Single cutover weekend
3. Immediate cost savings
4. Risk: Potential downtime if issues occur

## 📊 Performance Optimizations

### Lambda Function Optimization
```typescript
// Configured in aws-lambda-adapter.ts
{
  memorySize: 512,           // Optimal for Express.js apps
  timeout: 30,               // Sufficient for API calls
  runtime: 'nodejs18.x',     // Latest stable runtime
  bundling: 'esbuild'        // Fast, optimized builds
}
```

### CloudFront Caching
```json
{
  "frontend": {
    "cacheBehavior": "cache-optimized",
    "ttl": "1 year"
  },
  "api": {
    "cacheBehavior": "no-cache",
    "ttl": "0 seconds"
  }
}
```

### Database Connection Pooling
```typescript
// Optimized for Lambda cold starts
{
  connectionLimit: 5,        // Lower limit for Lambda
  acquireTimeout: 5000,      // Quick timeout
  createRetryInterval: 200   // Fast retry
}
```

## 🔍 Monitoring & Debugging

### CloudWatch Integration
```bash
# View Lambda logs
aws logs tail /aws/lambda/tomriddelsdell-com-api-production --follow

# View API Gateway logs
aws logs tail API-Gateway-Execution-Logs_${API_ID}/prod --follow

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=tomriddelsdell-com-api-production
```

### Health Check Endpoints
```
https://tomriddelsdell.com/health                    # Basic health
https://tomriddelsdell.com/api/monitoring/health     # Detailed health
https://tomriddelsdell.com/api/monitoring/status     # Full system status
```

### Performance Monitoring
```typescript
// Built into aws-lambda-adapter.ts
{
  requestLogging: true,
  performanceMetrics: true,
  errorTracking: true,
  requestId: 'X-Amzn-RequestId'
}
```

## 💰 Cost Management

### Billing Alerts Setup
```bash
# Create billing alerts
aws budgets create-budget \
  --account-id 123456789012 \
  --budget '{
    "BudgetName": "tomriddelsdell-monthly",
    "BudgetLimit": {
      "Amount": "50",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

### Cost Optimization Tips
1. **Use ARM64 Lambda functions** (20% cost reduction)
2. **Enable S3 Intelligent Tiering** (storage cost optimization)
3. **Set up CloudWatch log retention** (prevent log storage costs)
4. **Use Reserved Capacity** for predictable workloads
5. **Monitor with AWS Cost Explorer** weekly

### Resource Tagging Strategy
```json
{
  "Project": "tomriddelsdell-com",
  "Environment": "production",
  "Component": "frontend|api|database",
  "Owner": "TomRiddelsdell",
  "CostCenter": "personal-projects"
}
```

## 🔒 Security Configuration

### IAM Permissions (Least Privilege)
```json
{
  "lambda": ["logs:*", "cognito-idp:AdminGetUser"],
  "s3": ["s3:GetObject", "s3:PutObject"],
  "apigateway": ["execute-api:Invoke"]
}
```

### CORS Configuration
```typescript
// Configured for CloudFront + API Gateway
{
  allowedOrigins: ["https://tomriddelsdell.com"],
  allowedMethods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  allowCredentials: true
}
```

### WAF Integration (Optional)
```bash
# Enable AWS WAF for additional security
aws wafv2 create-web-acl \
  --name tomriddelsdell-protection \
  --scope CLOUDFRONT \
  --default-action Allow={}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Lambda Cold Starts
```
Symptom: First request takes >3 seconds
Solution: Enable provisioned concurrency or increase memory
```

#### 2. CORS Errors
```
Symptom: Browser blocks API requests
Solution: Check CloudFront cache headers and Lambda CORS config
```

#### 3. 502 Bad Gateway
```
Symptom: API Gateway returns 502
Solution: Check Lambda function logs in CloudWatch
```

#### 4. SSL Certificate Issues
```
Symptom: Certificate not found error
Solution: Ensure certificate is created in us-east-1 region
```

### Debug Commands
```bash
# Test Lambda function locally
sam local start-api

# Validate CloudFormation template
aws cloudformation validate-template \
  --template-body file://infrastructure/deployment/aws/cloudformation/aws-serverless-infrastructure.json

# Check stack events
aws cloudformation describe-stack-events \
  --stack-name tomriddelsdell-com-production
```

## 📝 Next Steps

### Immediate Actions
1. [ ] Set up AWS account and credentials
2. [ ] Request SSL certificate in us-east-1
3. [ ] Configure environment variables
4. [ ] Deploy to staging environment
5. [ ] Test all functionality

### Post-Migration Optimizations
1. [ ] Set up CI/CD pipeline with GitHub Actions
2. [ ] Implement blue-green deployments
3. [ ] Add comprehensive monitoring dashboard
4. [ ] Optimize Lambda performance based on usage patterns
5. [ ] Consider Neptune integration for graph features

### Long-term Considerations
1. **Neptune Integration**: If graph database features needed ($60-150/month)
2. **Multi-region Setup**: For global performance and disaster recovery
3. **Microservices Migration**: Separate domains into individual Lambda functions
4. **Event-driven Architecture**: Use EventBridge for domain events

## 🎉 Benefits of AWS Migration

### Technical Benefits
- ✅ **Unlimited Scalability**: Handle traffic spikes automatically
- ✅ **Global Performance**: CloudFront edge locations worldwide
- ✅ **Enterprise Security**: WAF, Shield, IAM integration
- ✅ **Monitoring**: CloudWatch, X-Ray, detailed metrics
- ✅ **Integration**: 200+ AWS services available

### Business Benefits
- ✅ **Cost Reduction**: 60-75% cost savings vs Replit
- ✅ **Vendor Flexibility**: Not locked into single platform
- ✅ **Professional Image**: Enterprise-grade infrastructure
- ✅ **Learning Opportunity**: AWS skills highly valuable
- ✅ **Future Growth**: Platform can scale to any size

---

**Support**: For questions about this migration, review the troubleshooting section or check CloudWatch logs for specific error details.
