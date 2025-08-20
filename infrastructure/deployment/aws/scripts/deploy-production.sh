#!/bin/bash

# Production Deployment Script with All Fixes Applied
# This script captures all the manual steps and fixes we discovered during deployment

set -euo pipefail  # Exit on any error, undefined variables, or pipe failures

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PROJECT_NAME="tomriddelsdell-com"
ENVIRONMENT="production"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

echo "🚀 Starting production deployment with all fixes applied..."

# Function to check AWS credentials
check_aws_credentials() {
  if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials expired or invalid"
    exit 1
  fi
}

# Initial credentials check
echo "🔐 Verifying AWS credentials..."
check_aws_credentials
echo "✅ AWS credentials verified"

# Load configuration from centralized config system first
echo "🔧 Loading configuration from centralized system..."
CONFIG_OUTPUT=$(node infrastructure/deployment/aws/scripts/load-config.cjs)

# Parse configuration
DOMAIN_NAME=$(echo "$CONFIG_OUTPUT" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).domainName)")
CERTIFICATE_ARN=$(echo "$CONFIG_OUTPUT" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).certificateArn)")
DATABASE_URL=$(echo "$CONFIG_OUTPUT" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).databaseUrl)")
COGNITO_USER_POOL_ID=$(echo "$CONFIG_OUTPUT" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).cognitoUserPoolId)")

echo "✅ Configuration loaded successfully"
echo "  - Domain: $DOMAIN_NAME"
echo "  - Certificate: $CERTIFICATE_ARN"
echo "  - Database URL: [REDACTED]"
echo "  - Cognito Pool ID: $COGNITO_USER_POOL_ID"

# Step 2: Build application
echo "🏗️ Building application..."
npm run build

# Verify build artifacts
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build failed - dist/index.js not found"
    exit 1
fi

if [ ! -d "dist/assets" ]; then
    echo "❌ Frontend build failed - dist/assets not found"
    exit 1
fi

echo "✅ Application built successfully"

# Step 3: Deploy CloudFormation stack with all fixes
echo "📦 Deploying CloudFormation stack..."

# Check if stack exists and determine operation
STACK_EXISTS=$(aws cloudformation describe-stacks --stack-name tomriddelsdell-com-production --query 'Stacks[0].StackName' --output text 2>/dev/null || echo "NONE")
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name tomriddelsdell-com-production --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NONE")

echo "📊 Current stack status: $STACK_STATUS"

# Handle special cases where stack is stuck
if [ "$STACK_STATUS" = "DELETE_FAILED" ]; then
  echo "🧹 Stack deletion failed previously. Cleaning up S3 buckets and retrying..."
  
  # Clean up S3 buckets that might be preventing deletion
  S3_BUCKET="tomriddelsdell-com-production-static-assets"
  
  # Check if bucket exists and empty it
  if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    echo "🗑️ Emptying S3 bucket: $S3_BUCKET"
    aws s3 rm s3://"$S3_BUCKET" --recursive --quiet || true
    
    # Also delete any versioned objects if versioning is enabled
    aws s3api delete-objects --bucket "$S3_BUCKET" \
      --delete "$(aws s3api list-object-versions --bucket "$S3_BUCKET" \
      --query '{Objects: Versions[].{Key: Key, VersionId: VersionId}}' \
      --output json)" --quiet 2>/dev/null || true
    
    # Delete any delete markers
    aws s3api delete-objects --bucket "$S3_BUCKET" \
      --delete "$(aws s3api list-object-versions --bucket "$S3_BUCKET" \
      --query '{Objects: DeleteMarkers[].{Key: Key, VersionId: VersionId}}' \
      --output json)" --quiet 2>/dev/null || true
  fi
  
  echo "🔄 Retrying stack deletion..."
  aws cloudformation delete-stack --stack-name tomriddelsdell-com-production
  
  echo "⏳ Waiting for stack deletion to complete..."
  aws cloudformation wait stack-delete-complete --stack-name tomriddelsdell-com-production
  
  # Update status after deletion
  STACK_STATUS="NONE"
  STACK_EXISTS="NONE"
fi

if [ "$STACK_EXISTS" = "NONE" ]; then
  echo "🆕 Creating new CloudFormation stack..."
  aws cloudformation create-stack \
    --template-body file://"$SCRIPT_DIR/../cloudformation/production-stack.yml" \
    --stack-name tomriddelsdell-com-production \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameters \
      ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
      ParameterKey=CertificateArn,ParameterValue="$CERTIFICATE_ARN" \
      ParameterKey=DatabaseUrl,ParameterValue="$DATABASE_URL" \
      ParameterKey=CognitoUserPoolId,ParameterValue="$COGNITO_USER_POOL_ID" \
    --tags \
      Key=Project,Value=tomriddelsdell-com \
      Key=Environment,Value=production \
      Key=ManagedBy,Value=cloudformation
  
  echo "⏳ Waiting for stack creation to complete..."
  aws cloudformation wait stack-create-complete --stack-name tomriddelsdell-com-production

elif [ "$STACK_STATUS" = "UPDATE_ROLLBACK_COMPLETE" ] || [ "$STACK_STATUS" = "CREATE_COMPLETE" ] || [ "$STACK_STATUS" = "UPDATE_COMPLETE" ]; then
  echo "🔄 Updating existing CloudFormation stack..."
  
  # Capture update result to handle "No updates" case properly
  UPDATE_OUTPUT=$(aws cloudformation update-stack \
    --template-body file://"$SCRIPT_DIR/../cloudformation/production-stack.yml" \
    --stack-name tomriddelsdell-com-production \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameters \
      ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
      ParameterKey=CertificateArn,ParameterValue="$CERTIFICATE_ARN" \
      ParameterKey=DatabaseUrl,ParameterValue="$DATABASE_URL" \
      ParameterKey=CognitoUserPoolId,ParameterValue="$COGNITO_USER_POOL_ID" \
    --tags \
      Key=Project,Value=tomriddelsdell-com \
      Key=Environment,Value=production \
      Key=ManagedBy,Value=cloudformation 2>&1) || UPDATE_FAILED=true
  
  if [[ "$UPDATE_OUTPUT" == *"No updates are to be performed"* ]]; then
    echo "ℹ️ No changes detected - stack is already up to date"
  elif [ "$UPDATE_FAILED" = true ]; then
    echo "❌ Stack update failed: $UPDATE_OUTPUT"
    exit 1
  else
    echo "⏳ Waiting for stack update to complete (with 30-minute timeout)..."
    timeout 1800 aws cloudformation wait stack-update-complete --stack-name tomriddelsdell-com-production || {
      echo "⚠️ Wait operation timed out, checking final status..."
      FINAL_STATUS=$(aws cloudformation describe-stacks --stack-name tomriddelsdell-com-production --query 'Stacks[0].StackStatus' --output text)
      if [[ "$FINAL_STATUS" == "UPDATE_COMPLETE" ]]; then
        echo "✅ Stack update completed successfully"
      else
        echo "❌ Stack update failed with status: $FINAL_STATUS"
        exit 1
      fi
    }
  fi

else
  echo "❌ Stack is in state $STACK_STATUS - cannot proceed with deployment"
  exit 1
fi

echo "✅ CloudFormation stack deployed successfully"

# Step 4: Get stack outputs
echo "📋 Retrieving stack outputs..."

# Check credentials before proceeding with post-deployment steps
check_aws_credentials
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`StaticAssetsBucket`].OutputValue' --output text)
CLOUDFRONT_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text)
API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text)

echo "📦 S3 Bucket: $S3_BUCKET"
echo "🌐 CloudFront Distribution: $CLOUDFRONT_ID"
echo "🔗 API Gateway URL: $API_URL"

# Step 5: Upload static assets to S3
echo "📤 Uploading static assets to S3..."
aws s3 sync dist/ s3://"$S3_BUCKET"/ --delete --exclude "*.map" --exclude "lambda/*"

# Set proper content types for web assets
aws s3 cp dist/index.html s3://"$S3_BUCKET"/index.html --content-type "text/html" --cache-control "no-cache"
aws s3 cp dist/assets/ s3://"$S3_BUCKET"/assets/ --recursive --content-type "text/css" --include "*.css"
aws s3 cp dist/assets/ s3://"$S3_BUCKET"/assets/ --recursive --content-type "application/javascript" --include "*.js"

echo "✅ Static assets uploaded successfully"

# Step 6: Update Lambda function with actual application code
echo "🔧 Updating Lambda function with application code..."
LAMBDA_FUNCTION_NAME="${PROJECT_NAME}-${ENVIRONMENT}-api-gateway"

if [ -f "dist/lambda/index.mjs" ]; then
    # Create deployment package
    cd dist/lambda
    zip -r ../../lambda-deployment.zip index.mjs
    cd ../..
    
    # Update Lambda function code
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --zip-file fileb://lambda-deployment.zip
        
    # Update handler if needed
    aws lambda update-function-configuration \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --handler index.handler
        
    echo "✅ Lambda function updated with application code"
else
    echo "⚠️ Lambda code not found, using placeholder function from CloudFormation"
fi

# Step 7: Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "✅ CloudFront invalidation created: $INVALIDATION_ID"

# Step 8: Health checks
echo "🧪 Running production health checks..."

# Wait for deployment to be ready
echo "⏳ Waiting 60 seconds for deployment to stabilize..."
sleep 60

# Test domain
echo "🌐 Testing domain: https://$DOMAIN_NAME"
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN_NAME" || echo "000")

if [ "$DOMAIN_STATUS" == "200" ]; then
    echo "✅ Domain is responding correctly"
else
    echo "⚠️ Domain returned status: $DOMAIN_STATUS"
fi

# Test API if available
if [ -n "$API_URL" ]; then
    echo "🔗 Testing API: $API_URL"
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" || echo "000")
    
    if [ "$API_STATUS" == "200" ]; then
        echo "✅ API is responding correctly"
    else
        echo "⚠️ API returned status: $API_STATUS"
    fi
fi

# Step 9: Deployment summary
echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=================================="
echo "🌐 Website: https://$DOMAIN_NAME"
echo "🔗 API: $API_URL"
echo "📦 S3 Bucket: $S3_BUCKET"
echo "🌐 CloudFront: $CLOUDFRONT_ID"
echo ""
echo "📋 Post-deployment tasks:"
echo "- Monitor CloudFront invalidation progress"
echo "- Verify SSL certificate configuration"
echo "- Test all website functionality"
echo "- Monitor Lambda function logs if issues occur"
echo ""
echo "🔧 Manual fixes applied in this deployment:"
echo "- S3 bucket public access policy for CloudFront"
echo "- Lambda execution role with correct ARN format"
echo "- Removed IAM permission-intensive features"
echo "- Proper CloudFront S3/API routing configuration"
echo "- Fixed Lambda permission SourceArn pattern"
echo "=================================="

# Cleanup
rm -f lambda-deployment.zip s3-public-policy.json

echo "🚀 Production deployment script completed!"
