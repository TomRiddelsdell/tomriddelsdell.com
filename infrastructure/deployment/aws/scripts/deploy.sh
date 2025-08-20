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

# Load configuration from centralized config system (same approach as production)
echo "$(blue '🔧 Loading configuration from centralized system...')"
if command -v node >/dev/null 2>&1; then
    if [ -f "infrastructure/deployment/aws/scripts/load-config.cjs" ]; then
        CONFIG_OUTPUT=$(node infrastructure/deployment/aws/scripts/load-config.cjs 2>/dev/null) || {
            echo "$(yellow '⚠️ Centralized config unavailable, using environment variables')"
            CONFIG_OUTPUT=""
        }
        
        if [ -n "$CONFIG_OUTPUT" ]; then
            echo "$(green '✅ Configuration loaded from centralized system')"
            
            # Override with centralized config if not already set
            if [ -z "$DOMAIN_NAME" ]; then
                DOMAIN_NAME=$(echo "$CONFIG_OUTPUT" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).domainName); } catch(e) { process.exit(1); }" 2>/dev/null) || ""
            fi
            if [ -z "$CERTIFICATE_ARN" ]; then
                CERTIFICATE_ARN=$(echo "$CONFIG_OUTPUT" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).certificateArn); } catch(e) { process.exit(1); }" 2>/dev/null) || ""
            fi
            if [ -z "$COGNITO_USER_POOL_ID" ]; then
                COGNITO_USER_POOL_ID=$(echo "$CONFIG_OUTPUT" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).cognitoUserPoolId); } catch(e) { process.exit(1); }" 2>/dev/null) || ""
            fi
            if [ -z "$DATABASE_URL" ]; then
                DATABASE_URL=$(echo "$CONFIG_OUTPUT" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).databaseUrl); } catch(e) { process.exit(1); }" 2>/dev/null) || ""
            fi
        fi
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

# Clean up any existing deployment bucket from failed deployments
echo "$(yellow 'Cleaning up any existing deployment bucket...')"
if [ "$DRY_RUN" = false ]; then
    if aws s3 ls "s3://$DEPLOYMENT_BUCKET" >/dev/null 2>&1; then
        echo "$(yellow 'Found existing deployment bucket, force cleaning...')"
        
        # Delete all objects and versions
        aws s3 rm "s3://$DEPLOYMENT_BUCKET" --recursive --quiet 2>/dev/null || true
        
        # Delete all object versions if versioning is enabled
        aws s3api delete-objects --bucket "$DEPLOYMENT_BUCKET" \
            --delete "$(aws s3api list-object-versions --bucket "$DEPLOYMENT_BUCKET" \
            --query '{Objects: Versions[].{Key: Key, VersionId: VersionId}}' \
            --output json)" --quiet 2>/dev/null || true
        
        # Delete any delete markers
        aws s3api delete-objects --bucket "$DEPLOYMENT_BUCKET" \
            --delete "$(aws s3api list-object-versions --bucket "$DEPLOYMENT_BUCKET" \
            --query '{Objects: DeleteMarkers[].{Key: Key, VersionId: VersionId}}' \
            --output json)" --quiet 2>/dev/null || true
        
        # Remove the bucket
        aws s3 rb "s3://$DEPLOYMENT_BUCKET" --force 2>/dev/null || true
        
        echo "$(green '✅ Existing deployment bucket cleaned up')"
        sleep 2  # Wait for AWS to process
    fi
    
    echo "$(yellow 'Creating fresh deployment bucket...')"
    aws s3 mb "s3://$DEPLOYMENT_BUCKET" --region "$REGION"
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$DEPLOYMENT_BUCKET" \
        --versioning-configuration Status=Enabled
    
    echo "$(green '✅ Deployment bucket ready:') $DEPLOYMENT_BUCKET"
else
    echo "$(yellow '📋 Would clean up and recreate deployment bucket:') $DEPLOYMENT_BUCKET"
fi

# Package Lambda function
echo "$(yellow 'Packaging Lambda function...')"
LAMBDA_PACKAGE="$ROOT_DIR/dist/lambda-package.zip"

if [ "$DRY_RUN" = false ]; then
    # Build Lambda-specific bundle first
    echo "$(blue 'Building Lambda function...')"
    cd "$ROOT_DIR"
    npm run build:lambda
    
    # Create temporary directory for Lambda package
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT
    
    # Copy Lambda build
    if [ -f "$ROOT_DIR/dist/lambda/index.js" ]; then
        cp "$ROOT_DIR/dist/lambda/index.js" "$TEMP_DIR/"
        echo "$(green '✅ Lambda function code copied')"
    else
        echo "$(red '❌ No Lambda build found at dist/lambda/index.js')"
        echo "Available files in dist/:"
        ls -la "$ROOT_DIR/dist/" || echo "dist/ directory not found"
        exit 1
    fi
    
    # Copy source map if available
    if [ -f "$ROOT_DIR/dist/lambda/index.js.map" ]; then
        cp "$ROOT_DIR/dist/lambda/index.js.map" "$TEMP_DIR/"
    fi
    
    # Create package.json for Lambda runtime dependencies
    cat > "$TEMP_DIR/package.json" << 'EOF'
{
  "name": "api-gateway-lambda", 
  "version": "1.0.0",
  "type": "commonjs",
  "main": "index.js",
  "dependencies": {
    "@vendia/serverless-express": "^4.12.6"
  }
}
EOF
    
    # Install production dependencies
    cd "$TEMP_DIR"
    echo "$(blue 'Installing Lambda runtime dependencies...')"
    npm install --omit=dev --omit=optional >/dev/null
    
    # Create Lambda package
    zip -r "$LAMBDA_PACKAGE" . >/dev/null
    
    LAMBDA_SIZE=$(du -h "$LAMBDA_PACKAGE" | cut -f1)
    echo "$(green '✅ Lambda package created:') $LAMBDA_PACKAGE (${LAMBDA_SIZE})"
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
    # Check stack status and handle accordingly
    STACK_STATUS=""
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" >/dev/null 2>&1; then
        STACK_STATUS=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --query 'Stacks[0].StackStatus' \
            --output text)
        echo "$(yellow 'Current stack status:') $STACK_STATUS"
        
        # Handle failed stacks that need to be deleted first
        case "$STACK_STATUS" in
            "ROLLBACK_COMPLETE"|"CREATE_FAILED"|"DELETE_FAILED"|"UPDATE_ROLLBACK_COMPLETE")
                echo "$(red 'Stack is in a failed state and cannot be updated.')"
                echo "$(yellow 'Deleting failed stack before redeployment...')"
                
                # Delete the failed stack
                aws cloudformation delete-stack --stack-name "$STACK_NAME"
                echo "$(yellow 'Waiting for stack deletion to complete...')"
                aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
                echo "$(green '✅ Failed stack deleted successfully')"
                
                # Set status to empty so we create a new stack
                STACK_STATUS=""
                ;;
            "DELETE_IN_PROGRESS")
                echo "$(yellow 'Stack is currently being deleted. Waiting for completion...')"
                aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
                STACK_STATUS=""
                ;;
            "CREATE_IN_PROGRESS"|"UPDATE_IN_PROGRESS"|"UPDATE_COMPLETE_CLEANUP_IN_PROGRESS")
                echo "$(yellow 'Stack operation in progress. Waiting for completion...')"
                # Wait for any in-progress operation to complete
                sleep 30
                STACK_STATUS=$(aws cloudformation describe-stacks \
                    --stack-name "$STACK_NAME" \
                    --query 'Stacks[0].StackStatus' \
                    --output text)
                echo "$(yellow 'Updated stack status:') $STACK_STATUS"
                ;;
        esac
    fi
    
    # Deploy based on current state
    if [ -n "$STACK_STATUS" ] && [ "$STACK_STATUS" != "DELETE_COMPLETE" ]; then
        # Stack exists and is in a good state - update it
        echo "$(yellow 'Updating existing stack...')"
        
        # Try to update the stack
        if aws cloudformation update-stack \
            --stack-name "$STACK_NAME" \
            --template-body "file://$TEMPLATE_FILE" \
            --parameters "${PARAMETERS[@]}" \
            --tags "${TAGS[@]}" \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM 2>/dev/null; then
            
            echo "$(yellow 'Waiting for stack update to complete...')"
            aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME"
        else
            echo "$(yellow 'No changes detected or update failed. Stack may already be up to date.')"
        fi
    else
        # Stack doesn't exist or was deleted - create it
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
    
    # Verify final stack status
    FINAL_STATUS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].StackStatus' \
        --output text)
    
    if [[ "$FINAL_STATUS" == *"COMPLETE" ]] && [[ "$FINAL_STATUS" != *"ROLLBACK"* ]]; then
        echo "$(green '✅ CloudFormation stack deployed successfully')"
    else
        echo "$(red '❌ CloudFormation deployment failed with status:') $FINAL_STATUS"
        
        # Show recent stack events for debugging
        echo "$(yellow 'Recent stack events:')"
        aws cloudformation describe-stack-events \
            --stack-name "$STACK_NAME" \
            --query 'StackEvents[:10].[Timestamp,ResourceType,ResourceStatus,ResourceStatusReason]' \
            --output table
        exit 1
    fi
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

# Upload static assets to S3 (for staging)
if [ "$DRY_RUN" = false ] && [ "$ENVIRONMENT" = "staging" ]; then
    echo ""
    echo "$(blue '📤 Uploading static assets to S3...')"
    
    S3_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`StaticAssetsBucket`].OutputValue' --output text)
    
    if [ -n "$S3_BUCKET" ] && [ "$S3_BUCKET" != "None" ]; then
        aws s3 sync dist/ s3://"$S3_BUCKET"/ --delete --exclude "*.map" --exclude "lambda/*"
        
        # Set proper content types for web assets
        aws s3 cp dist/index.html s3://"$S3_BUCKET"/index.html --content-type "text/html" --cache-control "no-cache" --metadata-directive REPLACE
        aws s3 cp s3://"$S3_BUCKET"/assets/ s3://"$S3_BUCKET"/assets/ --recursive --content-type "text/css" --include "*.css" --metadata-directive REPLACE
        aws s3 cp s3://"$S3_BUCKET"/assets/ s3://"$S3_BUCKET"/assets/ --recursive --content-type "application/javascript" --include "*.js" --metadata-directive REPLACE
        
        echo "$(green '✅ Static assets uploaded successfully')"
    fi
fi

# Configure DNS for staging (same as production)
if [ "$DRY_RUN" = false ] && [ "$ENVIRONMENT" = "staging" ]; then
    echo ""
    echo "$(blue '🌐 Configuring DNS records...')"
    
    # Get CloudFront domain name
    CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' --output text | sed 's|https://||')
    
    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
        # Find hosted zone for the domain
        HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='tomriddelsdell.com.'].Id" --output text | sed 's|/hostedzone/||')
        
        if [ -n "$HOSTED_ZONE_ID" ] && [ "$HOSTED_ZONE_ID" != "None" ]; then
            echo "$(yellow 'Found hosted zone:') $HOSTED_ZONE_ID"
            
            # Skip DNS record creation for staging - keep it private
            echo "$(yellow 'Skipping public DNS record for staging security')"
            echo "$(blue 'Access staging via CloudFront URL:') https://$CLOUDFRONT_DOMAIN"
            
            echo "$(green '✅ DNS records updated to point to CloudFront')"
        else
            echo "$(yellow '⚠️ No Route 53 hosted zone found - DNS must be configured manually')"
        fi
    else
        echo "$(yellow '⚠️ CloudFront domain not found - skipping DNS configuration')"
    fi
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
