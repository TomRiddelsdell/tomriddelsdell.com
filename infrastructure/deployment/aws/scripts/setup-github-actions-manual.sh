#!/bin/bash

# GitHub Actions CI/CD Setup Guide (Manual)
# Use this when AWS credentials are not available in the current environment
# 
# This guide provides all the commands and configurations needed to set up
# GitHub Actions CI/CD for tomriddelsdell.com

set -euo pipefail

# Color output functions
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

echo "$(blue '🔧 GitHub Actions CI/CD Setup Guide (Manual)')"
echo "$(blue '=================================================')"
echo ""
echo "$(yellow 'This guide provides step-by-step instructions for setting up')"
echo "$(yellow 'GitHub Actions CI/CD when AWS credentials are not available')"
echo "$(yellow 'in the current environment.')"
echo ""

# Step 1: AWS Account Setup
echo "$(bold '🔐 Step 1: AWS Account Preparation')"
echo ""
echo "Run these commands in an environment with working AWS credentials:"
echo ""

# AWS Account ID placeholder
echo "$(yellow 'First, get your AWS Account ID:')"
echo 'AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)'
echo 'echo "AWS Account ID: $AWS_ACCOUNT_ID"'
echo ""

# OIDC Provider setup
echo "$(yellow 'Create OIDC Identity Provider (if not exists):')"
cat << 'EOF'
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --tags Key=Project,Value=tomriddelsdell-com Key=Purpose,Value=GitHubActions
EOF
echo ""

# Trust Policy
echo "$(yellow 'Create trust policy file (trust-policy.json):')"
cat << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
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
EOF
echo ""

# Deployment Policy
echo "$(yellow 'Create deployment policy file (deployment-policy.json):')"
cat << 'EOF'
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
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF
echo ""

# Monitoring Policy
echo "$(yellow 'Create monitoring policy file (monitoring-policy.json):')"
cat << 'EOF'
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
echo ""

# IAM Roles Creation
echo "$(bold '👤 Step 2: Create IAM Roles')"
echo ""
echo "$(yellow 'Replace YOUR_ACCOUNT_ID with your actual AWS Account ID in trust-policy.json, then run:')"
echo ""

# Create roles
echo "# Create Staging Role"
cat << 'EOF'
aws iam create-role \
  --role-name GitHubActions-Staging-Role \
  --assume-role-policy-document file://trust-policy.json \
  --tags Key=Project,Value=tomriddelsdell-com Key=Environment,Value=staging

aws iam put-role-policy \
  --role-name GitHubActions-Staging-Role \
  --policy-name GitHubActions-Staging-Policy \
  --policy-document file://deployment-policy.json
EOF
echo ""

echo "# Create Production Role"
cat << 'EOF'
aws iam create-role \
  --role-name GitHubActions-Production-Role \
  --assume-role-policy-document file://trust-policy.json \
  --tags Key=Project,Value=tomriddelsdell-com Key=Environment,Value=production

aws iam put-role-policy \
  --role-name GitHubActions-Production-Role \
  --policy-name GitHubActions-Production-Policy \
  --policy-document file://deployment-policy.json
EOF
echo ""

echo "# Create Monitoring Role"
cat << 'EOF'
aws iam create-role \
  --role-name GitHubActions-Monitoring-Role \
  --assume-role-policy-document file://trust-policy.json \
  --tags Key=Project,Value=tomriddelsdell-com Key=Environment,Value=monitoring

aws iam put-role-policy \
  --role-name GitHubActions-Monitoring-Role \
  --policy-name GitHubActions-Monitoring-Policy \
  --policy-document file://monitoring-policy.json
EOF
echo ""

# SSL Certificates
echo "$(bold '🔒 Step 3: Create SSL Certificates')"
echo ""
echo "$(red 'IMPORTANT:') SSL certificates for CloudFront must be created in $(bold 'us-east-1') region!"
echo ""

echo "# Staging Certificate"
cat << 'EOF'
aws acm request-certificate \
  --domain-name dev.tomriddelsdell.com \
  --validation-method DNS \
  --region us-east-1 \
  --tags Key=Project,Value=tomriddelsdell-com Key=Environment,Value=staging
EOF
echo ""

echo "# Production Certificate"
cat << 'EOF'
aws acm request-certificate \
  --domain-name tomriddelsdell.com \
  --subject-alternative-names www.tomriddelsdell.com \
  --validation-method DNS \
  --region us-east-1 \
  --tags Key=Project,Value=tomriddelsdell-com Key=Environment,Value=production
EOF
echo ""

# GitHub Secrets
echo "$(bold '📋 Step 4: GitHub Repository Secrets')"
echo ""
echo "Add these secrets to your GitHub repository:"
echo "$(blue 'GitHub Repository > Settings > Secrets and variables > Actions > New repository secret')"
echo ""

echo "$(yellow 'AWS Role ARNs (replace YOUR_ACCOUNT_ID):')"
echo "AWS_STAGING_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActions-Staging-Role"
echo "AWS_PRODUCTION_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActions-Production-Role"
echo "AWS_MONITORING_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActions-Monitoring-Role"
echo ""

echo "$(yellow 'Staging Environment Secrets:')"
echo "STAGING_DOMAIN_NAME=dev.tomriddelsdell.com"
echo "STAGING_CERTIFICATE_ARN=arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/STAGING_CERT_ID"
echo "STAGING_COGNITO_USER_POOL_ID=eu-west-2_STAGING_POOL_ID"
echo "STAGING_DATABASE_URL=postgresql://user:pass@staging-db:5432/staging_db"
echo ""

echo "$(yellow 'Production Environment Secrets:')"
echo "PRODUCTION_DOMAIN_NAME=tomriddelsdell.com"
echo "PRODUCTION_CERTIFICATE_ARN=arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/PROD_CERT_ID"
echo "PRODUCTION_COGNITO_USER_POOL_ID=eu-west-2_PROD_POOL_ID"
echo "PRODUCTION_DATABASE_URL=postgresql://user:pass@prod-db:5432/prod_db"
echo ""

# GitHub Environments
echo "$(bold '🏠 Step 5: GitHub Environment Protection')"
echo ""
echo "Configure these environments in GitHub:"
echo "$(blue 'GitHub Repository > Settings > Environments > New environment')"
echo ""

echo "$(yellow '1. Create \"staging\" environment:')"
echo "   - Environment name: staging"
echo "   - Deployment branches: develop"
echo "   - Protection rules: None (automatic deployment)"
echo ""

echo "$(yellow '2. Create \"production\" environment:')"
echo "   - Environment name: production"
echo "   - Deployment branches: main"
echo "   - Protection rules: Required reviewers (add yourself)"
echo "   - Wait timer: 0 minutes"
echo ""

# Testing
echo "$(bold '🧪 Step 6: Test the Pipeline')"
echo ""
echo "$(yellow 'After completing the setup:')"
echo ""
echo "1. Push a commit to the 'develop' branch to test staging deployment"
echo "2. Create a pull request to 'main' to see cost estimation"
echo "3. Merge to 'main' to trigger production deployment (requires approval)"
echo ""

# Commands Reference
echo "$(bold '📚 Step 7: Useful Commands')"
echo ""
echo "$(yellow 'Manual deployment commands (after setup):')"
echo "# Deploy to staging"
echo "gh workflow run deploy.yml -f environment=staging"
echo ""
echo "# Deploy to production"
echo "gh workflow run deploy.yml -f environment=production"
echo ""
echo "# Monitor AWS costs"
echo "gh workflow run aws-monitoring.yml"
echo ""
echo "# Check workflow status"
echo "gh run list --workflow=deploy.yml"
echo ""

# Troubleshooting
echo "$(bold '🔧 Step 8: Troubleshooting')"
echo ""
echo "$(yellow 'Common issues and solutions:')"
echo ""
echo "$(bold 'Issue:') AWS authentication fails"
echo "$(green 'Solution:') Check that OIDC provider and IAM roles are created correctly"
echo ""
echo "$(bold 'Issue:') Certificate not found"
echo "$(green 'Solution:') Ensure certificates are created in us-east-1 region"
echo ""
echo "$(bold 'Issue:') Deployment fails"
echo "$(green 'Solution:') Check CloudFormation stack status in AWS Console"
echo ""

# Documentation Links
echo "$(bold '📖 Documentation')"
echo ""
echo "Complete documentation: $(blue 'docs/GITHUB_ACTIONS_CICD.md')"
echo "AWS deployment guide: $(blue 'docs/AWS_DEPLOYMENT_GUIDE.md')"
echo "Cost calculator: $(blue './infrastructure/deployment/aws/scripts/aws-cost-calculator.sh')"
echo ""

# Next Steps
echo "$(green '✅ Next Steps')"
echo ""
echo "1. $(bold 'Complete AWS setup') using the commands above"
echo "2. $(bold 'Add GitHub secrets') with your actual values"
echo "3. $(bold 'Configure environments') with protection rules"
echo "4. $(bold 'Test deployment') by pushing to develop branch"
echo "5. $(bold 'Monitor costs') using the daily monitoring workflow"
echo ""

echo "$(blue 'The GitHub Actions workflows are ready and will activate once secrets are configured!')"
