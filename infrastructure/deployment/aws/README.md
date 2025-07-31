# AWS Deployment Infrastructure

This directory contains all AWS-specific deployment configurations and scripts for migrating tomriddelsdell.com from Replit to AWS serverless infrastructure.

## 🎯 Quick Start

1. **Cost Estimation**: Get cost estimates before deploying
   ```bash
   ./scripts/aws-cost-calculator.sh
   ```

2. **Environment Setup**: Configure your AWS environment
   ```bash
   cp .env.aws.template .env.aws
   # Edit .env.aws with your actual values
   source .env.aws
   ```

3. **Deploy to AWS**: Full deployment
   ```bash
   npm run aws:deploy:prod
   # or directly: ./scripts/aws-deploy.sh production
   ```

## 📁 Directory Structure

```
aws/
├── cloudformation/
│   └── aws-serverless-infrastructure.json    # Complete serverless infrastructure
├── scripts/
│   ├── aws-deploy.sh                         # Main deployment automation
│   └── aws-cost-calculator.sh                # Cost estimation tool
├── .env.aws.template                         # Environment configuration template
└── README.md                                 # This file
```

## 💰 Cost Comparison

| Deployment Option | Monthly Cost | Benefits |
|-------------------|--------------|----------|
| **Replit (Current)** | $20/month | Simple, collaborative |
| **AWS Serverless** | $8-30/month | Scalable, enterprise-grade |
| **AWS + RDS** | $25-55/month | Full AWS ecosystem |

## 🚀 Deployment Options

### Development Environment
```bash
npm run aws:deploy:dev
```

### Staging Environment
```bash
npm run aws:deploy:staging
```

### Production Environment
```bash
npm run aws:deploy:prod
```

### Advanced Options
```bash
# Dry run (show what would be deployed)
./scripts/aws-deploy.sh production --dry-run

# Skip frontend deployment (API only)
./scripts/aws-deploy.sh production --skip-frontend

# Force rebuild Lambda function
./scripts/aws-deploy.sh production --force-rebuild
```

## 🏗️ Infrastructure Components

### Frontend (Static)
- **S3 Bucket**: Static website hosting
- **CloudFront**: Global CDN with SSL
- **Route 53**: DNS management

### Backend (Serverless)
- **Lambda**: Express.js API adapter
- **API Gateway**: REST API endpoint
- **IAM Roles**: Least-privilege security

### Database Options
- **Neon PostgreSQL**: Keep existing (recommended for cost)
- **RDS Serverless**: Native AWS PostgreSQL

## 🔧 Prerequisites

1. **AWS Account**: Set up with billing alerts
2. **AWS CLI**: Installed and configured
3. **SSL Certificate**: Requested in us-east-1 region
4. **Domain**: DNS access for Route 53 setup

## 📊 Monitoring

### Health Checks
- `https://your-domain.com/health` - Basic API health
- `https://your-domain.com/api/monitoring/health` - Detailed health

### AWS Monitoring
- **CloudWatch**: Lambda metrics and logs
- **Cost Explorer**: Monthly cost analysis
- **Billing Alerts**: Budget notifications

## 🔒 Security

### IAM Permissions
- Lambda: Minimal execution permissions
- S3: Read-only public access for frontend
- API Gateway: Integration with Lambda only

### Network Security
- CloudFront: HTTPS-only with modern TLS
- WAF: Optional web application firewall
- CORS: Properly configured for your domain

## 🐛 Troubleshooting

### Common Issues
1. **Certificate not found**: Ensure certificate is in us-east-1
2. **Lambda cold starts**: Consider provisioned concurrency
3. **CORS errors**: Check CloudFront cache headers
4. **502 errors**: Review Lambda function logs

### Debug Commands
```bash
# View Lambda logs
aws logs tail /aws/lambda/tomriddelsdell-com-api-production --follow

# Test Lambda locally
sam local start-api

# Validate CloudFormation
aws cloudformation validate-template --template-body file://cloudformation/aws-serverless-infrastructure.json
```

## 📚 Documentation

- **[AWS_DEPLOYMENT_GUIDE.md](../../docs/AWS_DEPLOYMENT_GUIDE.md)**: Complete migration guide
- **[NEPTUNE_COST_ANALYSIS.md](../../docs/NEPTUNE_COST_ANALYSIS.md)**: Cost analysis for graph features
- **[Architecture Overview](../../docs/ARCHITECTURE.md)**: DDD structure documentation

## 🎉 Benefits of AWS Migration

- ✅ **60-75% cost reduction** vs Replit
- ✅ **Unlimited scalability** with serverless
- ✅ **Global performance** via CloudFront
- ✅ **Enterprise security** with AWS services
- ✅ **Professional image** with custom infrastructure
- ✅ **Learning opportunity** for AWS skills

---

**Ready to migrate?** Start with the cost calculator, then follow the deployment guide!
