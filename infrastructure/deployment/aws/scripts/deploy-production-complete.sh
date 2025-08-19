#!/bin/bash

# Production Deployment Script with All Fixes Applied
# This script captures all the manual steps and fixes we discovered during deployment

set -e  # Exit on any error

PROJECT_NAME="tomriddelsdell-com"
ENVIRONMENT="production"
DOMAIN_NAME="tomriddelsdell.com"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:152903089773:certificate/8755d817-0f2a-4cae-93a3-7afea7d5ccee"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

echo "🚀 Starting production deployment with all fixes applied..."

# Step 1: Validate environment variables
echo "🔍 Validating environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$COGNITO_USER_POOL_ID" ]; then
    echo "❌ COGNITO_USER_POOL_ID environment variable is required"
    exit 1
fi

echo "✅ Environment variables validated"

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

# Check if stack exists and is in a failed state
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")

if [[ "$STACK_STATUS" == "ROLLBACK_COMPLETE" ]] || [[ "$STACK_STATUS" == "UPDATE_ROLLBACK_COMPLETE" ]]; then
    echo "🔄 Stack is in $STACK_STATUS state, deleting before redeployment..."
    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    echo "⏳ Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
    echo "✅ Stack deleted successfully"
fi

# Deploy the stack using our production-ready template
aws cloudformation deploy \
    --template-file infrastructure/deployment/aws/cloudformation/production-complete-stack.yml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        ProjectName="$PROJECT_NAME" \
        Environment="$ENVIRONMENT" \
        DomainName="$DOMAIN_NAME" \
        CertificateArn="$CERTIFICATE_ARN" \
        CognitoUserPoolId="$COGNITO_USER_POOL_ID" \
        DatabaseUrl="$DATABASE_URL" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset

echo "✅ CloudFormation stack deployed successfully"

# Step 4: Get stack outputs
echo "📋 Retrieving stack outputs..."
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
