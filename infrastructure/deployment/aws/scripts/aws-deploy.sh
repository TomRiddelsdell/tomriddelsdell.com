#!/bin/bash

# tomriddelsdell.com AWS Deployment Script
# Deploys the DDD architecture to AWS using serverless infrastructure
# 
# Usage: ./scripts/aws-deploy.sh [environment] [--force-rebuild]
# 
# Environments: development, staging, production
# Options:
#   --force-rebuild  Force rebuild of Lambda function even if no changes detected
#   --dry-run       Show what would be deployed without actually deploying
#   --skip-frontend Skip frontend build and deployment
#   --help          Show this help message

set -euo pipefail

# Configuration
PROJECT_NAME="tomriddelsdell-com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AWS_REGION="${AWS_DEFAULT_REGION:-eu-west-2}"

# Default values
ENVIRONMENT="${1:-production}"
FORCE_REBUILD=false
DRY_RUN=false
SKIP_FRONTEND=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --force-rebuild)
      FORCE_REBUILD=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-frontend)
      SKIP_FRONTEND=true
      shift
      ;;
    --help)
      echo "Usage: $0 [environment] [options]"
      echo ""
      echo "Environments: development, staging, production"
      echo ""
      echo "Options:"
      echo "  --force-rebuild  Force rebuild of Lambda function"
      echo "  --dry-run       Show what would be deployed"
      echo "  --skip-frontend Skip frontend deployment"
      echo "  --help          Show this help"
      exit 0
      ;;
    development|staging|production)
      ENVIRONMENT="$1"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
  echo "❌ Invalid environment: $ENVIRONMENT"
  echo "Valid environments: development, staging, production"
  exit 1
fi

# Color output functions
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }

# Logging functions
log() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $*"; }
error() { red "❌ ERROR: $*" >&2; }
warn() { yellow "⚠️  WARNING: $*"; }
info() { blue "ℹ️  INFO: $*"; }
success() { green "✅ SUCCESS: $*"; }

# Validation functions
check_prerequisites() {
  log "Checking prerequisites..."
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    error "AWS CLI not installed. Please install it first."
    exit 1
  fi
  
  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
  fi
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    error "Node.js not installed."
    exit 1
  fi
  
  # Check required environment variables
  local required_vars=("DOMAIN_NAME" "CERTIFICATE_ARN" "COGNITO_USER_POOL_ID" "DATABASE_URL")
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      error "Required environment variable $var is not set"
      exit 1
    fi
  done
  
  success "Prerequisites check passed"
}

# Build functions
build_frontend() {
  if [[ "$SKIP_FRONTEND" == "true" ]]; then
    warn "Skipping frontend build"
    return 0
  fi
  
  log "Building frontend..."
  cd "$WORKSPACE_ROOT"
  
  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would build frontend with 'npm run build'"
    return 0
  fi
  
  # Install dependencies if node_modules doesn't exist
  if [[ ! -d "node_modules" ]]; then
    log "Installing dependencies..."
    npm ci --production=false
  fi
  
  # Build frontend
  npm run build
  
  success "Frontend build completed"
}

build_lambda() {
  log "Building Lambda function..."
  cd "$WORKSPACE_ROOT"
  
  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would build Lambda function"
    return 0
  fi
  
  # Create Lambda deployment package
  local lambda_dir="dist/lambda"
  rm -rf "$lambda_dir"
  mkdir -p "$lambda_dir"
  
  # Install production dependencies
  log "Installing production dependencies..."
  npm ci --production --prefix "$lambda_dir"
  
  # Build the Lambda function
  log "Compiling Lambda function..."
  npx esbuild interfaces/api-gateway/src/aws-lambda-adapter.ts \
    --platform=node \
    --target=node18 \
    --bundle \
    --format=esm \
    --external:aws-sdk \
    --external:@aws-sdk/* \
    --outfile="$lambda_dir/index.mjs" \
    --sourcemap
  
  # Copy necessary files
  cp -r domains "$lambda_dir/"
  cp -r infrastructure/configuration "$lambda_dir/infrastructure/"
  cp -r infrastructure/database/schemas "$lambda_dir/infrastructure/database/"
  
  # Create deployment package
  cd "$lambda_dir"
  zip -r "../lambda-deployment.zip" . -q
  cd "$WORKSPACE_ROOT"
  
  success "Lambda function build completed"
}

# Deployment functions
deploy_infrastructure() {
  log "Deploying AWS infrastructure..."
  
  local stack_name="${PROJECT_NAME}-${ENVIRONMENT}"
  local template_file="infrastructure/deployment/aws/cloudformation/aws-serverless-infrastructure.json"
  
  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would deploy CloudFormation stack $stack_name"
    return 0
  fi
  
  # Check if stack exists
  if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$AWS_REGION" &> /dev/null; then
    log "Updating existing stack..."
    aws cloudformation update-stack \
      --stack-name "$stack_name" \
      --template-body "file://$template_file" \
      --parameters \
        ParameterKey=ProjectName,ParameterValue="$PROJECT_NAME" \
        ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
        ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
        ParameterKey=CertificateArn,ParameterValue="$CERTIFICATE_ARN" \
        ParameterKey=CognitoUserPoolId,ParameterValue="$COGNITO_USER_POOL_ID" \
        ParameterKey=DatabaseUrl,ParameterValue="$DATABASE_URL" \
      --capabilities CAPABILITY_NAMED_IAM \
      --region "$AWS_REGION"
    
    aws cloudformation wait stack-update-complete \
      --stack-name "$stack_name" \
      --region "$AWS_REGION"
  else
    log "Creating new stack..."
    aws cloudformation create-stack \
      --stack-name "$stack_name" \
      --template-body "file://$template_file" \
      --parameters \
        ParameterKey=ProjectName,ParameterValue="$PROJECT_NAME" \
        ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
        ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
        ParameterKey=CertificateArn,ParameterValue="$CERTIFICATE_ARN" \
        ParameterKey=CognitoUserPoolId,ParameterValue="$COGNITO_USER_POOL_ID" \
        ParameterKey=DatabaseUrl,ParameterValue="$DATABASE_URL" \
      --capabilities CAPABILITY_NAMED_IAM \
      --region "$AWS_REGION"
    
    aws cloudformation wait stack-create-complete \
      --stack-name "$stack_name" \
      --region "$AWS_REGION"
  fi
  
  success "Infrastructure deployment completed"
}

deploy_lambda() {
  log "Deploying Lambda function..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would deploy Lambda function"
    return 0
  fi
  
  local function_name="${PROJECT_NAME}-api-${ENVIRONMENT}"
  
  # Update Lambda function code
  aws lambda update-function-code \
    --function-name "$function_name" \
    --zip-file "fileb://dist/lambda-deployment.zip" \
    --region "$AWS_REGION"
  
  # Wait for update to complete
  aws lambda wait function-updated \
    --function-name "$function_name" \
    --region "$AWS_REGION"
  
  success "Lambda function deployment completed"
}

deploy_frontend() {
  if [[ "$SKIP_FRONTEND" == "true" ]]; then
    warn "Skipping frontend deployment"
    return 0
  fi
  
  log "Deploying frontend to S3..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would deploy frontend to S3"
    return 0
  fi
  
  local bucket_name="${PROJECT_NAME}-frontend-${ENVIRONMENT}"
  
  # Sync frontend files to S3
  aws s3 sync dist/ "s3://$bucket_name" \
    --delete \
    --region "$AWS_REGION" \
    --exclude "lambda/*" \
    --exclude "*.zip"
  
  # Invalidate CloudFront distribution
  local distribution_id=$(aws cloudformation describe-stacks \
    --stack-name "${PROJECT_NAME}-${ENVIRONMENT}" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)
  
  if [[ -n "$distribution_id" && "$distribution_id" != "None" ]]; then
    log "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
      --distribution-id "$distribution_id" \
      --paths "/*" \
      --region "$AWS_REGION"
  fi
  
  success "Frontend deployment completed"
}

# Verification functions
verify_deployment() {
  log "Verifying deployment..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would verify deployment"
    return 0
  fi
  
  # Get API Gateway URL
  local api_url=$(aws cloudformation describe-stacks \
    --stack-name "${PROJECT_NAME}-${ENVIRONMENT}" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)
  
  if [[ -n "$api_url" && "$api_url" != "None" ]]; then
    log "Testing API health endpoint..."
    if curl -s -f "$api_url/health" > /dev/null; then
      success "API health check passed"
    else
      warn "API health check failed"
    fi
  fi
  
  # Test frontend
  local domain_url="https://$DOMAIN_NAME"
  log "Testing frontend..."
  if curl -s -f "$domain_url" > /dev/null; then
    success "Frontend health check passed"
  else
    warn "Frontend health check failed"
  fi
  
  success "Deployment verification completed"
}

# Main deployment flow
main() {
  log "Starting AWS deployment for environment: $ENVIRONMENT"
  
  # Pre-deployment checks
  check_prerequisites
  
  # Build phase
  log "=== BUILD PHASE ==="
  build_frontend
  build_lambda
  
  # Deploy phase
  log "=== DEPLOY PHASE ==="
  deploy_infrastructure
  deploy_lambda
  deploy_frontend
  
  # Verify phase
  log "=== VERIFY PHASE ==="
  verify_deployment
  
  # Deployment summary
  log "=== DEPLOYMENT SUMMARY ==="
  success "🚀 Deployment completed successfully!"
  info "Environment: $ENVIRONMENT"
  info "Region: $AWS_REGION"
  info "Domain: https://$DOMAIN_NAME"
  
  if [[ "$DRY_RUN" == "true" ]]; then
    info "This was a dry run - no actual changes were made"
  fi
}

# Trap errors and cleanup
cleanup() {
  if [[ $? -ne 0 ]]; then
    error "Deployment failed!"
    log "Check the logs above for details"
  fi
}
trap cleanup EXIT

# Run main deployment
main "$@"
