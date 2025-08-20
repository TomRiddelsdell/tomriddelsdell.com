#!/bin/bash

# GitHub OIDC Role Setup Script
# This script creates the necessary AWS IAM role and policies for GitHub Actions deployment

set -euo pipefail

# Configuration
GITHUB_REPO="${1:-}"
ENVIRONMENT="${2:-production}"
ROLE_NAME="GitHubActions-${ENVIRONMENT^}-Role"
POLICY_NAME="GitHubActions-${ENVIRONMENT^}-Policy"

if [ -z "$GITHUB_REPO" ]; then
    echo "Usage: $0 <github-repo> [environment]"
    echo "Example: $0 TomRiddelsdell/tomriddelsdell.com production"
    exit 1
fi

echo "🚀 Setting up GitHub OIDC role for $GITHUB_REPO ($ENVIRONMENT environment)"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

# Create OIDC provider if it doesn't exist
echo "🔐 Setting up GitHub OIDC provider..."
OIDC_PROVIDER_ARN=$(aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[?ends_with(Arn, `token.actions.githubusercontent.com`)].Arn' --output text)

if [ -z "$OIDC_PROVIDER_ARN" ]; then
    echo "Creating GitHub OIDC provider..."
    OIDC_PROVIDER_ARN=$(aws iam create-open-id-connect-provider \
        --url https://token.actions.githubusercontent.com \
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
        --client-id-list sts.amazonaws.com \
        --query 'OpenIDConnectProviderArn' --output text)
    echo "✅ Created OIDC provider: $OIDC_PROVIDER_ARN"
else
    echo "✅ OIDC provider already exists: $OIDC_PROVIDER_ARN"
fi

# Create trust policy
cat > /tmp/trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "$OIDC_PROVIDER_ARN"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
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

# Create or update IAM role
echo "👤 Creating IAM role: $ROLE_NAME"
if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
    echo "Role exists, updating trust policy..."
    aws iam update-assume-role-policy --role-name "$ROLE_NAME" --policy-document file:///tmp/trust-policy.json
else
    aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file:///tmp/trust-policy.json
fi

# Create permissions policy
cat > /tmp/permissions-policy.json << EOF
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
                "lambda:CreateFunction",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "lambda:DeleteFunction",
                "lambda:GetFunction",
                "lambda:GetFunctionConfiguration",
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
                "route53:ListResourceRecordSets",
                "iam:GetRole",
                "iam:PassRole",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:TagRole",
                "iam:UntagRole",
                "iam:ListRoleTags",
                "logs:CreateLogGroup",
                "logs:DeleteLogGroup",
                "logs:PutRetentionPolicy",
                "logs:DescribeLogGroups",
                "logs:TagResource",
                "logs:UntagResource"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# Attach policy to role
echo "📋 Attaching permissions policy..."
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name "$POLICY_NAME" --policy-document file:///tmp/permissions-policy.json

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo ""
echo "✅ Setup complete!"
echo "===================="
echo "Role ARN: $ROLE_ARN"
echo ""
echo "📋 Next steps:"
echo "1. Add this secret to your GitHub repository:"
echo "   AWS_${ENVIRONMENT^^}_ROLE_ARN=$ROLE_ARN"
echo ""
echo "2. Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions"
echo "3. Click 'New repository secret'"
echo "4. Name: AWS_${ENVIRONMENT^^}_ROLE_ARN"
echo "5. Value: $ROLE_ARN"

# Cleanup
rm -f /tmp/trust-policy.json /tmp/permissions-policy.json