# IAM Roles Required for Deployment

This document describes all IAM roles required for the tomriddelsdell.com deployment pipeline.

## 🏗️ GitHub Actions Deployment Roles

### 1. GitHubActions-Production-Role
**Purpose**: Deploys infrastructure and applications to the production environment  
**ARN**: `arn:aws:iam::ACCOUNT_ID:role/GitHubActions-Production-Role`  
**Used by**: Production deployment workflow in `.github/workflows/deploy.yml`

#### Trust Policy
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

#### Required Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources",
        "cloudformation:ValidateTemplate",
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutBucketPolicy",
        "s3:PutBucketWebsite",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutBucketVersioning",
        "s3:PutBucketLifecycleConfiguration",
        "s3:PutBucketTagging",
        "s3:PutBucketNotification",
        "s3:PutBucketLogging",
        "s3:PutBucketCORS",
        "s3:PutBucketAcl",
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:TagResource",
        "lambda:UntagResource",
        "apigateway:*",
        "cloudfront:CreateDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:CreateOriginAccessIdentity",
        "cloudfront:GetOriginAccessIdentity",
        "cloudfront:DeleteOriginAccessIdentity",
        "cloudfront:TagResource",
        "cloudfront:UntagResource",
        "route53:CreateHostedZone",
        "route53:DeleteHostedZone",
        "route53:ListHostedZones",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange",
        "iam:GetRole",
        "iam:PassRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:PutRetentionPolicy",
        "logs:DescribeLogGroups",
        "logs:TagResource",
        "logs:UntagResource",
        "logs:CreateLogDelivery",
        "logs:PutDeliveryDestination",
        "logs:DeleteDeliveryDestination",
        "logs:GetLogDelivery",
        "logs:DeleteLogDelivery",
        "logs:DescribeDeliveries",
        "logs:DescribeDeliveryDestinations",
        "logs:DescribeDeliverySources",
        "sqs:CreateQueue",
        "sqs:DeleteQueue",
        "sqs:GetQueueAttributes",
        "sqs:SetQueueAttributes",
        "sqs:TagQueue",
        "sqs:UntagQueue",
        "wafv2:CreateWebACL",
        "wafv2:DeleteWebACL",
        "wafv2:GetWebACL",
        "wafv2:UpdateWebACL",
        "wafv2:TagResource",
        "wafv2:UntagResource",
        "wafv2:ListWebACLs"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. GitHubActions-Staging-Role
**Purpose**: Deploys infrastructure and applications to the staging environment  
**ARN**: `arn:aws:iam::ACCOUNT_ID:role/GitHubActions-Staging-Role`  
**Used by**: Staging deployment workflow in `.github/workflows/deploy.yml`

**Permissions**: Similar to production role but scoped for staging resources.

### 3. GitHubActions-Monitoring-Role
**Purpose**: Performs monitoring, cost analysis, and security operations  
**ARN**: `arn:aws:iam::ACCOUNT_ID:role/GitHubActions-Monitoring-Role`  
**Used by**: Monitoring workflow in `.github/workflows/aws-monitoring.yml`

#### Key Permissions
```json
{
  "Effect": "Allow",
  "Action": [
    "ce:GetCostAndUsage",
    "ce:GetCostForecast",
    "cloudwatch:GetMetricStatistics",
    "cloudwatch:ListMetrics",
    "logs:DescribeLogGroups",
    "logs:GetLogEvents",
    "cloudformation:DescribeStacks",
    "cloudformation:ListStacks"
  ],
  "Resource": "*"
}
```

## 🚀 Lambda Execution Roles

### 1. tomriddelsdell-com-production-lambda-execution-role
**Purpose**: Runtime execution role for production Lambda functions  
**Created by**: CloudFormation template `production-stack.yml`  
**Used by**: API Gateway Lambda function in production

#### Managed Policies
- `arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`
- `arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess`

#### Custom Policies
- **S3Access**: Read/write access to static assets bucket
- **CloudWatchLogs**: Create and write to log groups/streams
- **CloudWatchMetrics**: Publish custom metrics

### 2. tomriddelsdell-com-staging-lambda-execution-role
**Purpose**: Runtime execution role for staging Lambda functions  
**Created by**: CloudFormation template `staging-stack.yml`  
**Used by**: API Gateway Lambda function in staging

## 🔐 Security Best Practices

### OIDC Provider Configuration
GitHub Actions uses OpenID Connect (OIDC) for secure, temporary credential access:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Role Session Names
Each workflow run uses unique session names for audit trails:
- Production: `GitHubActions-Production-{run_number}`
- Staging: `GitHubActions-Staging-{run_number}`
- Monitoring: `GitHubActions-Monitoring-{run_number}`

### Least Privilege Access
- Each role has only the minimum permissions required for its specific function
- Repository-scoped trust policies prevent unauthorized access
- Temporary credentials expire automatically

## 🔧 Setup Commands

### Create OIDC Provider
```bash
./scripts/setup-github-cicd.ts
```

### Verify Role Configuration
```bash
aws iam get-role --role-name GitHubActions-Production-Role
aws iam list-attached-role-policies --role-name GitHubActions-Production-Role
aws iam list-role-policies --role-name GitHubActions-Production-Role
```

### Emergency Role Management
```bash
# Disable role (emergency)
./scripts/security-breach-response.ts

# Re-enable role
./scripts/secure-github-setup.js
```

## 📋 Recent Updates

### August 18, 2025 - Logging Permissions Fix
**Issue**: CloudFormation deployment failed with insufficient logging permissions  
**Solution**: Added comprehensive logs delivery permissions to GitHubActions-Production-Role:
- `logs:CreateLogDelivery`
- `logs:PutDeliveryDestination`
- `logs:DeleteDeliveryDestination`
- `logs:GetLogDelivery`
- `logs:DeleteLogDelivery`
- `logs:DescribeDeliveries`
- `logs:DescribeDeliveryDestinations`
- `logs:DescribeDeliverySources`

**Root Cause**: API Gateway V2 Stage with AccessLogSettings requires CloudWatch Logs delivery permissions for cross-service log streaming.

## 🆘 Troubleshooting

### Common Permission Issues
1. **logs:CreateLogDelivery**: Required for API Gateway access logging
2. **s3:PutBucketTagging**: Required for S3 bucket lifecycle management
3. **iam:PassRole**: Required to assign roles to AWS services
4. **cloudformation:DescribeStackEvents**: Required for deployment debugging

### Verification Commands
```bash
# Test role assumption
aws sts assume-role --role-arn arn:aws:iam::ACCOUNT_ID:role/GitHubActions-Production-Role --role-session-name test

# Check policy attachments
aws iam get-role-policy --role-name GitHubActions-Production-Role --policy-name GitHubActions-Production-Policy
```
