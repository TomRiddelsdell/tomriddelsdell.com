# AWS Setup Guide for Developers

This guide helps developers set up AWS infrastructure for deploying the tomriddelsdell.com project.

## 🚀 Quick Setup (Automated)

### 1. Run the Setup Script
```bash
# Run setup (replace with your GitHub username/repo)
./infrastructure/deployment/aws/scripts/setup-github-actions.sh YOUR_USERNAME/tomriddelsdell.com production
```

### 2. Add GitHub Secrets
The script will output a role ARN. Add it to your GitHub repository secrets:

1. Go to `https://github.com/YOUR_USERNAME/tomriddelsdell.com/settings/secrets/actions`
2. Click "New repository secret"
3. Add these secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_PRODUCTION_ROLE_ARN` | Production deployment role | `arn:aws:iam::123456789:role/GitHubActions-Production-Role` |
| `PRODUCTION_DOMAIN_NAME` | Your domain name | `yourdomain.com` |
| `PRODUCTION_CERTIFICATE_ARN` | SSL certificate ARN | `arn:aws:acm:us-east-1:123456789:certificate/abc123` |
| `PRODUCTION_COGNITO_USER_POOL_ID` | Cognito user pool | `us-east-1_ABC123DEF` |
| `PRODUCTION_DATABASE_URL` | Database connection string | `postgresql://user:pass@host:5432/db` |

## 🔧 Manual Setup (If Needed)

### Prerequisites
- AWS CLI configured with admin permissions
- GitHub repository forked/cloned

### 1. Create OIDC Provider
```bash
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
    --client-id-list sts.amazonaws.com
```

### 2. Create IAM Role
```bash
# Create trust policy file
cat > trust-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:YOUR_USERNAME/tomriddelsdell.com:*"
                }
            }
        }
    ]
}
EOF

# Create role
aws iam create-role \
    --role-name GitHubActions-Production-Role \
    --assume-role-policy-document file://trust-policy.json
```

### 3. Attach Permissions
```bash
# Use the permissions policy from the automated script
aws iam put-role-policy \
    --role-name GitHubActions-Production-Role \
    --policy-name GitHubActions-Production-Policy \
    --policy-document file://permissions-policy.json
```

## 🔍 Verification

### Test AWS Setup
```bash
# Verify role exists
aws iam get-role --role-name GitHubActions-Production-Role

# Test GitHub Actions workflow
git push origin main
```

### Common Issues

#### ❌ "User is not authorized to perform: lambda:GetFunctionConfiguration"
**Solution**: The setup script includes this permission. If using manual setup, ensure the permissions policy includes:
```json
"lambda:GetFunctionConfiguration"
```

#### ❌ "No identity-based policy allows the action"
**Solution**: Check that all required permissions are in the role policy. Use the automated script to ensure completeness.

#### ❌ "ExpiredToken: The security token included in the request is expired"
**Solution**: This is fixed by the improved deployment script logic that handles "no changes" scenarios properly.

## 🏗️ Infrastructure Components

The setup creates:
- **OIDC Provider**: Enables GitHub Actions to assume AWS roles
- **IAM Role**: `GitHubActions-Production-Role` with deployment permissions
- **Permissions**: CloudFormation, S3, Lambda, API Gateway, CloudFront access

## 🔒 Security Notes

- Role is restricted to your specific GitHub repository
- Uses OIDC for secure, temporary credentials
- No long-lived AWS access keys required
- Follows AWS security best practices

## 📚 Additional Resources

- [AWS OIDC Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [GitHub Actions AWS Authentication](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [Project Deployment Guide](./DEPLOYMENT.md)