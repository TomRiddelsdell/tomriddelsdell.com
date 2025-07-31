#!/bin/bash

# GitHub Actions CI/CD Setup Script
# Helps configure AWS OIDC and IAM roles for GitHub Actions
# 
# Usage: ./infrastructure/deployment/aws/scripts/setup-github-actions.sh

set -euo pipefail

# Configuration
GITHUB_REPO="TomRiddelsdell/tomriddelsdell.com"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="${AWS_DEFAULT_REGION:-eu-west-2}"

# Color output functions
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

echo "$(blue '🔧 GitHub Actions CI/CD Setup for tomriddelsdell.com')"
echo "$(blue '======================================================')"
echo ""

# Check prerequisites
echo "$(yellow 'Checking prerequisites...')"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "GitHub Repository: $GITHUB_REPO"
echo "AWS Region: $AWS_REGION"
echo ""

# Confirm setup
read -p "Do you want to proceed with the setup? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

# Step 1: Create OIDC Provider
echo "$(yellow '🔐 Step 1: Creating OIDC Identity Provider...')"

if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "arn:aws:iam::$AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" &>/dev/null; then
    echo "$(green '✅ OIDC provider already exists')"
else
    aws iam create-open-id-connect-provider \
        --url https://token.actions.githubusercontent.com \
        --client-id-list sts.amazonaws.com \
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
        --tags Key=Project,Value=tomriddelsdell-com Key=Purpose,Value=GitHubActions
    echo "$(green '✅ OIDC provider created successfully')"
fi
echo ""

# Step 2: Create IAM roles
echo "$(yellow '👤 Step 2: Creating IAM roles...')"

# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::$AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:$GITHUB_REPO:*"
        }
      }
    }
  ]
}
EOF

# Create deployment permissions policy
cat > deployment-policy.json << EOF
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
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:AddPermission",
        "lambda:RemovePermission",
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
        "logs:DescribeLogGroups"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create monitoring permissions policy
cat > monitoring-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:DeleteLogGroup",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "lambda:GetFunction",
        "lambda:ListFunctions",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackResources"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create roles for each environment
for env in staging production monitoring; do
    role_name="GitHubActions-${env^}-Role"
    
    echo "Creating role: $role_name"
    
    if aws iam get-role --role-name "$role_name" &>/dev/null; then
        echo "$(green '✅') Role $role_name already exists"
    else
        aws iam create-role \
            --role-name "$role_name" \
            --assume-role-policy-document file://trust-policy.json \
            --tags Key=Project,Value=tomriddelsdell-com Key=Environment,Value=$env
        echo "$(green '✅') Role $role_name created"
    fi
    
    # Attach appropriate policy
    policy_name="GitHubActions-${env^}-Policy"
    
    if [[ "$env" == "monitoring" ]]; then
        policy_file="monitoring-policy.json"
    else
        policy_file="deployment-policy.json"
    fi
    
    aws iam put-role-policy \
        --role-name "$role_name" \
        --policy-name "$policy_name" \
        --policy-document file://$policy_file
    echo "$(green '✅') Policy attached to $role_name"
done

echo ""

# Step 3: Output role ARNs
echo "$(yellow '📋 Step 3: GitHub Repository Secrets Configuration')"
echo ""
echo "Add these secrets to your GitHub repository:"
echo "$(blue 'Repository Settings > Secrets and variables > Actions > New repository secret')"
echo ""

echo "AWS_STAGING_ROLE_ARN=arn:aws:iam::$AWS_ACCOUNT_ID:role/GitHubActions-Staging-Role"
echo "AWS_PRODUCTION_ROLE_ARN=arn:aws:iam::$AWS_ACCOUNT_ID:role/GitHubActions-Production-Role"
echo "AWS_MONITORING_ROLE_ARN=arn:aws:iam::$AWS_ACCOUNT_ID:role/GitHubActions-Monitoring-Role"
echo ""

# Environment-specific secrets
echo "$(yellow 'Environment-specific secrets (update with your values):')"
echo ""
echo "# Staging Environment"
echo "STAGING_DOMAIN_NAME=dev.tomriddelsdell.com"
echo "STAGING_CERTIFICATE_ARN=arn:aws:acm:us-east-1:$AWS_ACCOUNT_ID:certificate/STAGING_CERT_ID"
echo "STAGING_COGNITO_USER_POOL_ID=eu-west-2_STAGINGPOOL"
echo "STAGING_DATABASE_URL=postgresql://user:pass@staging-db:5432/staging_db"
echo ""
echo "# Production Environment"
echo "PRODUCTION_DOMAIN_NAME=tomriddelsdell.com"
echo "PRODUCTION_CERTIFICATE_ARN=arn:aws:acm:us-east-1:$AWS_ACCOUNT_ID:certificate/PROD_CERT_ID"
echo "PRODUCTION_COGNITO_USER_POOL_ID=eu-west-2_PRODPOOL"
echo "PRODUCTION_DATABASE_URL=postgresql://user:pass@prod-db:5432/prod_db"
echo ""

# Step 4: SSL Certificate setup
echo "$(yellow '🔒 Step 4: SSL Certificate Setup')"
echo ""
echo "$(bold 'Important:') SSL certificates for CloudFront must be created in us-east-1 region!"
echo ""
echo "Run these commands to create SSL certificates:"
echo ""
echo "# Staging certificate"
echo "aws acm request-certificate \\"
echo "  --domain-name dev.tomriddelsdell.com \\"
echo "  --validation-method DNS \\"
echo "  --region us-east-1"
echo ""
echo "# Production certificate"
echo "aws acm request-certificate \\"
echo "  --domain-name tomriddelsdell.com \\"
echo "  --subject-alternative-names www.tomriddelsdell.com \\"
echo "  --validation-method DNS \\"
echo "  --region us-east-1"
echo ""

# Step 5: GitHub Environments
echo "$(yellow '🏠 Step 5: GitHub Environment Protection Rules')"
echo ""
echo "Configure these environments in GitHub:"
echo "$(blue 'Repository Settings > Environments > New environment')"
echo ""
echo "1. $(bold 'staging') environment:"
echo "   - Deployment branches: develop"
echo "   - No protection rules needed"
echo ""
echo "2. $(bold 'production') environment:"
echo "   - Deployment branches: main"
echo "   - Required reviewers: TomRiddelsdell"
echo "   - Wait timer: 0 minutes"
echo ""

# Cleanup temporary files
rm -f trust-policy.json deployment-policy.json monitoring-policy.json

echo "$(green '✅ GitHub Actions CI/CD setup completed successfully!')"
echo ""
echo "$(yellow 'Next steps:')"
echo "1. Add the secrets to your GitHub repository"
echo "2. Create SSL certificates in us-east-1 region"
echo "3. Configure GitHub environment protection rules"
echo "4. Test deployment with a push to develop branch"
echo ""
echo "$(blue 'Documentation:') docs/GITHUB_ACTIONS_CICD.md"
echo "$(blue 'Cost Calculator:') ./infrastructure/deployment/aws/scripts/aws-cost-calculator.sh"
