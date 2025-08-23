#!/bin/bash

# GitHub Actions vs Local Deployment Investigation
# Identifies differences that cause deployment failures in CI/CD

set -euo pipefail

echo "🔍 Investigating GitHub Actions vs Local Deployment Differences"
echo "=============================================================="

# 1. Compare IAM Permissions
echo "📋 1. IAM PERMISSIONS COMPARISON"
echo "--------------------------------"

echo "🔍 Checking local AWS credentials..."
LOCAL_IDENTITY=$(aws sts get-caller-identity 2>/dev/null || echo "❌ Local AWS credentials not configured")
echo "Local Identity: $LOCAL_IDENTITY"

echo "🔍 Checking GitHub Actions role permissions..."
GITHUB_ROLE_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/GitHubActionsRole"
echo "GitHub Role ARN: $GITHUB_ROLE_ARN"

# Get attached policies for GitHub Actions role
echo "📜 GitHub Actions Role Policies:"
aws iam list-attached-role-policies --role-name GitHubActionsRole --query 'AttachedPolicies[].PolicyArn' --output table 2>/dev/null || echo "❌ Cannot access GitHub Actions role"

# 2. Check CloudFormation Template Differences
echo ""
echo "📋 2. CLOUDFORMATION TEMPLATE ANALYSIS"
echo "-------------------------------------"

STAGING_TEMPLATE="infrastructure/deployment/aws/cloudformation/staging-stack.yml"
STAGING_BACKUP="infrastructure/deployment/aws/cloudformation/staging-stack-backup.yml"
STAGING_SIMPLIFIED="infrastructure/deployment/aws/cloudformation/staging-stack-simplified.yml"

echo "📊 Template file sizes:"
ls -lh "$STAGING_TEMPLATE" "$STAGING_BACKUP" "$STAGING_SIMPLIFIED" 2>/dev/null || echo "❌ Some template files missing"

echo "🔍 Key differences between templates:"
echo "- Original template: Complex CloudFront + S3 + OAI setup"
echo "- Simplified template: Basic CloudFront without S3 integration"

# 3. Check GitHub Actions Environment
echo ""
echo "📋 3. GITHUB ACTIONS ENVIRONMENT ANALYSIS"
echo "----------------------------------------"

echo "🔍 Checking recent GitHub Actions runs..."
gh run list --limit 5 --json status,conclusion,createdAt,workflowName 2>/dev/null || echo "❌ GitHub CLI not configured or no access"

# 4. Resource Limits and Quotas
echo ""
echo "📋 4. AWS RESOURCE LIMITS CHECK"
echo "------------------------------"

echo "🔍 CloudFormation stack limits:"
STACK_COUNT=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'length(StackSummaries)' --output text)
echo "Current stacks: $STACK_COUNT/200 (AWS limit)"

echo "🔍 Lambda function limits:"
LAMBDA_COUNT=$(aws lambda list-functions --query 'length(Functions)' --output text)
echo "Current Lambda functions: $LAMBDA_COUNT/1000 (AWS limit)"

# 5. Timing Analysis
echo ""
echo "📋 5. DEPLOYMENT TIMING ANALYSIS"
echo "-------------------------------"

echo "🔍 Analyzing CloudFormation events for timing patterns..."
STACK_NAME="tomriddelsdell-staging"
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" >/dev/null 2>&1; then
    echo "📊 Recent stack events (last 10):"
    aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --max-items 10 --query 'StackEvents[].{Time:Timestamp,Status:ResourceStatus,Type:ResourceType,Reason:ResourceStatusReason}' --output table
else
    echo "❌ Staging stack not found"
fi

# 6. Specific GitHub Actions Issues
echo ""
echo "📋 6. GITHUB ACTIONS SPECIFIC ISSUES"
echo "-----------------------------------"

echo "🔍 Common GitHub Actions deployment issues:"
echo "1. IAM permission differences (AssumeRole vs direct credentials)"
echo "2. Network connectivity (GitHub runners vs local network)"
echo "3. Timeout limits (GitHub Actions: 6 hours, local: unlimited)"
echo "4. Resource creation order (parallel vs sequential)"
echo "5. CloudFormation service limits in shared AWS accounts"

# 7. Recommended Investigation Steps
echo ""
echo "📋 7. RECOMMENDED INVESTIGATION STEPS"
echo "------------------------------------"

cat << 'EOF'
🔧 IMMEDIATE ACTIONS:
1. Compare IAM policies: Local user vs GitHub Actions role
2. Test simplified template in GitHub Actions (already done - works)
3. Identify specific resource causing original template failure
4. Check CloudFormation service quotas and limits

🔍 DETAILED ANALYSIS:
1. Enable CloudFormation stack notifications
2. Add more detailed logging to deployment script
3. Test individual resources in isolation
4. Compare AWS API call patterns (local vs GitHub Actions)

💡 LIKELY ROOT CAUSES:
1. CloudFront distribution creation timeout in GitHub Actions
2. S3 bucket policy circular dependency with OAI
3. IAM permission for specific CloudFormation operations
4. GitHub Actions runner network/DNS resolution issues
EOF

echo ""
echo "✅ Investigation complete. Check output above for specific issues."