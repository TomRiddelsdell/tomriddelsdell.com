#!/bin/bash

# AWS Deployment Script for tomriddelsdell.com
# Deploys staging or production environments using CloudFormation

set -euo pipefail

# Color output functions
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

# Configuration
PROJECT_NAME="tomriddelsdell-com"
REGION="${AWS_REGION:-eu-west-2}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../../../" && pwd)"

# Default values
ENVIRONMENT=""
DOMAIN_NAME=""
CERTIFICATE_ARN=""
COGNITO_USER_POOL_ID=""
DATABASE_URL=""
DRY_RUN=false
SKIP_BUILD=false
AUTO_APPROVE=false

# Usage function
usage() {
    echo "$(blue 'AWS Deployment Script for tomriddelsdell.com')"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV       Environment to deploy (staging|production)"
    echo "  -d, --domain DOMAIN         Domain name for the environment"
    echo "  -c, --certificate ARN       SSL certificate ARN (must be in us-east-1)"
    echo "  -u, --user-pool-id ID       Cognito User Pool ID"
    echo "  -b, --database-url URL      Database connection URL"
    echo "  --dry-run                   Show what would be deployed without executing"
    echo "  --skip-build                Skip building the application"
    echo "  --yes                       Skip confirmation prompt (for CI/CD)"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e staging -d dev.tomriddelsdell.com"
    echo "  $0 -e production -d tomriddelsdell.com --dry-run"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_REGION                  AWS region (default: eu-west-2)"
    echo "  STAGING_DOMAIN_NAME         Default staging domain"
    echo "  STAGING_CERTIFICATE_ARN     Default staging certificate"
    echo "  PRODUCTION_DOMAIN_NAME      Default production domain"
    echo "  PRODUCTION_CERTIFICATE_ARN  Default production certificate"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        -c|--certificate)
            CERTIFICATE_ARN="$2"
            shift 2
            ;;
        -u|--user-pool-id)
            COGNITO_USER_POOL_ID="$2"
            shift 2
            ;;
        -b|--database-url)
            DATABASE_URL="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --yes)
            AUTO_APPROVE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "$(red 'Error: Unknown option:') $1"
            usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$ENVIRONMENT" ]; then
    echo "$(red 'Error: Environment is required (-e|--environment)')"
    usage
    exit 1
fi

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "$(red 'Error: Environment must be staging or production')"
    exit 1
fi

# Set defaults based on environment
if [ -z "$DOMAIN_NAME" ]; then
    if [ "$ENVIRONMENT" = "staging" ]; then
        DOMAIN_NAME="${STAGING_DOMAIN_NAME:-dev.tomriddelsdell.com}"
    else
        DOMAIN_NAME="${PRODUCTION_DOMAIN_NAME:-tomriddelsdell.com}"
    fi
fi

if [ -z "$CERTIFICATE_ARN" ]; then
    if [ "$ENVIRONMENT" = "staging" ]; then
        CERTIFICATE_ARN="${STAGING_CERTIFICATE_ARN:-}"
    else
        CERTIFICATE_ARN="${PRODUCTION_CERTIFICATE_ARN:-}"
    fi
fi

if [ -z "$COGNITO_USER_POOL_ID" ]; then
    if [ "$ENVIRONMENT" = "staging" ]; then
        COGNITO_USER_POOL_ID="${STAGING_COGNITO_USER_POOL_ID:-}"
    else
        COGNITO_USER_POOL_ID="${PRODUCTION_COGNITO_USER_POOL_ID:-}"
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    if [ "$ENVIRONMENT" = "staging" ]; then
        DATABASE_URL="${STAGING_DATABASE_URL:-}"
    else
        DATABASE_URL="${PRODUCTION_DATABASE_URL:-}"
    fi
fi

# Validate required parameters
missing_params=()
if [ -z "$CERTIFICATE_ARN" ]; then
    missing_params+=("Certificate ARN")
fi
if [ -z "$COGNITO_USER_POOL_ID" ]; then
    missing_params+=("Cognito User Pool ID")
fi
if [ -z "$DATABASE_URL" ]; then
    missing_params+=("Database URL")
fi

if [ ${#missing_params[@]} -gt 0 ]; then
    echo "$(red 'Error: Missing required parameters:')"
    for param in "${missing_params[@]}"; do
        echo "  - $param"
    done
    echo ""
    echo "$(yellow 'Set these via command line options or environment variables.')"
    echo "$(yellow 'See --help for details.')"
    exit 1
fi

# Display deployment summary
echo "$(blue '🚀 AWS Deployment Summary')"
echo "$(blue '=========================')"
echo ""
echo "$(yellow 'Project:')        $PROJECT_NAME"
echo "$(yellow 'Environment:')    $ENVIRONMENT"
echo "$(yellow 'Region:')         $REGION"
echo "$(yellow 'Domain:')         $DOMAIN_NAME"
echo "$(yellow 'Certificate:')    ${CERTIFICATE_ARN:0:50}..."
echo "$(yellow 'User Pool:')      $COGNITO_USER_POOL_ID"
echo "$(yellow 'Database:')       ${DATABASE_URL:0:30}..."
echo "$(yellow 'Dry Run:')        $DRY_RUN"
echo "$(yellow 'Skip Build:')     $SKIP_BUILD"
echo ""

# Confirm deployment
if [ "$DRY_RUN" = false ] && [ "$AUTO_APPROVE" = false ]; then
    read -p "$(yellow 'Proceed with deployment? (y/N): ')" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "$(yellow 'Deployment cancelled')"
        exit 0
    fi
fi

# Check AWS credentials
echo "$(blue '🔐 Checking AWS credentials...')"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "$(red '❌ AWS credentials not configured or invalid')"
    echo "$(yellow 'Please configure AWS credentials first:')"
    echo "  aws configure"
    echo "  # or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "$(green '✅ AWS credentials valid for account:') $AWS_ACCOUNT_ID"

# Build application
if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "$(blue '🔨 Building application...')"
    cd "$ROOT_DIR"
    
    if [ "$DRY_RUN" = false ]; then
        echo "$(yellow 'Installing dependencies...')"
        npm ci
        
        echo "$(yellow 'Running tests...')"
        npm run test
        
        echo "$(yellow 'Building for production...')"
        npm run build
        
        echo "$(green '✅ Build completed successfully')"
    else
        echo "$(yellow '📋 Would run: npm ci && npm run test && npm run build')"
    fi
fi

# Prepare deployment artifacts
echo ""
echo "$(blue '📦 Preparing deployment artifacts...')"

STACK_NAME="$PROJECT_NAME-$ENVIRONMENT"
TEMPLATE_FILE="$SCRIPT_DIR/../cloudformation/$ENVIRONMENT-stack.yml"
DEPLOYMENT_BUCKET="$PROJECT_NAME-$ENVIRONMENT-deployment"

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "$(red '❌ CloudFormation template not found:') $TEMPLATE_FILE"
    exit 1
fi

# Check if deployment bucket exists, create if needed
echo "$(yellow 'Checking deployment bucket...')"
if [ "$DRY_RUN" = false ]; then
    if ! aws s3 ls "s3://$DEPLOYMENT_BUCKET" >/dev/null 2>&1; then
        echo "$(yellow 'Creating deployment bucket...')"
        aws s3 mb "s3://$DEPLOYMENT_BUCKET" --region "$REGION"
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$DEPLOYMENT_BUCKET" \
            --versioning-configuration Status=Enabled
    fi
    echo "$(green '✅ Deployment bucket ready:') $DEPLOYMENT_BUCKET"
else
    echo "$(yellow '📋 Would check/create deployment bucket:') $DEPLOYMENT_BUCKET"
fi

# Package Lambda function
echo "$(yellow 'Packaging Lambda function...')"
LAMBDA_PACKAGE="$ROOT_DIR/dist/lambda-package.zip"

if [ "$DRY_RUN" = false ]; then
    # Create temporary directory for Lambda package
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT
    
    # Copy built application
    cp -r "$ROOT_DIR/dist/"* "$TEMP_DIR/"
    
    # Copy Lambda adapter
    cp "$ROOT_DIR/interfaces/api-gateway/src/aws-lambda-adapter.ts" "$TEMP_DIR/"
    
    # Install production dependencies in temp directory
    cd "$TEMP_DIR"
    npm init -y >/dev/null
    npm install express aws-lambda-express-adapter >/dev/null
    
    # Create Lambda package
    zip -r "$LAMBDA_PACKAGE" . >/dev/null
    
    echo "$(green '✅ Lambda package created:') $LAMBDA_PACKAGE"
else
    echo "$(yellow '📋 Would create Lambda package at:') $LAMBDA_PACKAGE"
fi

# Upload Lambda package to S3
if [ "$DRY_RUN" = false ]; then
    LAMBDA_S3_KEY="lambda-packages/$(date +%Y%m%d-%H%M%S)-lambda.zip"
    echo "$(yellow 'Uploading Lambda package to S3...')"
    aws s3 cp "$LAMBDA_PACKAGE" "s3://$DEPLOYMENT_BUCKET/$LAMBDA_S3_KEY"
    echo "$(green '✅ Lambda package uploaded:') s3://$DEPLOYMENT_BUCKET/$LAMBDA_S3_KEY"
else
    LAMBDA_S3_KEY="lambda-packages/TIMESTAMP-lambda.zip"
    echo "$(yellow '📋 Would upload Lambda package to:') s3://$DEPLOYMENT_BUCKET/$LAMBDA_S3_KEY"
fi

# Deploy CloudFormation stack
echo ""
echo "$(blue '☁️ Deploying CloudFormation stack...')"

# Prepare stack parameters
PARAMETERS=(
    "ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME"
    "ParameterKey=Environment,ParameterValue=$ENVIRONMENT"
    "ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME"
    "ParameterKey=CertificateArn,ParameterValue=$CERTIFICATE_ARN"
    "ParameterKey=CognitoUserPoolId,ParameterValue=$COGNITO_USER_POOL_ID"
    "ParameterKey=DatabaseUrl,ParameterValue=$DATABASE_URL"
)

# Prepare stack tags
TAGS=(
    "Key=Project,Value=$PROJECT_NAME"
    "Key=Environment,Value=$ENVIRONMENT"
    "Key=DeployedBy,Value=$(whoami)"
    "Key=DeployedAt,Value=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
)

if [ "$DRY_RUN" = false ]; then
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" >/dev/null 2>&1; then
        echo "$(yellow 'Updating existing stack...')"
        aws cloudformation update-stack \
            --stack-name "$STACK_NAME" \
            --template-body "file://$TEMPLATE_FILE" \
            --parameters "${PARAMETERS[@]}" \
            --tags "${TAGS[@]}" \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
        
        echo "$(yellow 'Waiting for stack update to complete...')"
        aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME"
    else
        echo "$(yellow 'Creating new stack...')"
        aws cloudformation create-stack \
            --stack-name "$STACK_NAME" \
            --template-body "file://$TEMPLATE_FILE" \
            --parameters "${PARAMETERS[@]}" \
            --tags "${TAGS[@]}" \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
        
        echo "$(yellow 'Waiting for stack creation to complete...')"
        aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
    fi
    
    echo "$(green '✅ CloudFormation stack deployed successfully')"
else
    echo "$(yellow '📋 Would deploy CloudFormation stack:') $STACK_NAME"
    echo "$(yellow '📋 Template:') $TEMPLATE_FILE"
    echo "$(yellow '📋 Parameters:')"
    for param in "${PARAMETERS[@]}"; do
        echo "  - $param"
    done
fi

# Update Lambda function code
if [ "$DRY_RUN" = false ]; then
    echo ""
    echo "$(blue '🔄 Updating Lambda function code...')"
    
    LAMBDA_FUNCTION_NAME="$PROJECT_NAME-$ENVIRONMENT-api-gateway"
    
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --s3-bucket "$DEPLOYMENT_BUCKET" \
        --s3-key "$LAMBDA_S3_KEY" >/dev/null
    
    echo "$(green '✅ Lambda function code updated')"
else
    echo "$(yellow '📋 Would update Lambda function code from S3 package')"
fi

# Get stack outputs
echo ""
echo "$(blue '📋 Deployment Results')"
echo "$(blue '====================')"

if [ "$DRY_RUN" = false ]; then
    # Get CloudFormation outputs
    OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs' \
        --output table)
    
    echo "$OUTPUTS"
    
    # Get specific URLs
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text)
    
    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
        --output text)
    
    CUSTOM_DOMAIN_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`CustomDomainUrl`].OutputValue' \
        --output text)
    
    echo ""
    echo "$(green '🌐 Application URLs:')"
    echo "$(yellow 'API Gateway:')    $API_URL"
    echo "$(yellow 'CloudFront:')     $CLOUDFRONT_URL"
    echo "$(yellow 'Custom Domain:')  $CUSTOM_DOMAIN_URL"
    
    # Test the deployment
    echo ""
    echo "$(blue '🧪 Testing deployment...')"
    
    if curl -s --fail "$API_URL" >/dev/null; then
        echo "$(green '✅ API Gateway is responding')"
    else
        echo "$(red '❌ API Gateway is not responding')"
    fi
    
    if curl -s --fail "$CLOUDFRONT_URL" >/dev/null; then
        echo "$(green '✅ CloudFront is responding')"
    else
        echo "$(yellow '⚠️ CloudFront may still be deploying (this can take 10-15 minutes)')"
    fi
else
    echo "$(yellow '📋 Dry run complete - no actual deployment performed')"
fi

# Cost estimation
echo ""
echo "$(blue '💰 Estimated Monthly Costs')"
echo "$(blue '==========================')"

if [ "$ENVIRONMENT" = "staging" ]; then
    echo "$(yellow 'Lambda:')         ~\$1-3/month (assuming low usage)"
    echo "$(yellow 'API Gateway:')    ~\$1-2/month"
    echo "$(yellow 'CloudFront:')     ~\$1-2/month"
    echo "$(yellow 'S3:')             ~\$1/month"
    echo "$(yellow 'CloudWatch:')     ~\$1/month"
    echo "$(bold 'Total Estimated:') ~\$5-9/month"
else
    echo "$(yellow 'Lambda:')         ~\$3-8/month"
    echo "$(yellow 'API Gateway:')    ~\$2-5/month"
    echo "$(yellow 'CloudFront:')     ~\$2-5/month"
    echo "$(yellow 'S3:')             ~\$1-2/month"
    echo "$(yellow 'CloudWatch:')     ~\$1-2/month"
    echo "$(yellow 'WAF:')            ~\$1-3/month"
    echo "$(bold 'Total Estimated:') ~\$10-25/month"
fi

echo ""
echo "$(green '✅ Deployment completed successfully!')"

if [ "$DRY_RUN" = false ]; then
    echo ""
    echo "$(blue 'Next steps:')"
    echo "1. $(yellow 'Update DNS records') to point $DOMAIN_NAME to CloudFront"
    echo "2. $(yellow 'Monitor costs') using the AWS console or cost alerts"
    echo "3. $(yellow 'Check application logs') in CloudWatch"
    echo "4. $(yellow 'Set up monitoring') alerts for your production environment"
fi
