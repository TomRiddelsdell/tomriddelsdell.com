#!/bin/bash

# Quick troubleshooting deployment script
# Tests CloudFormation deployment with validation

set -euo pipefail

red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }

PROJECT_NAME="tomriddelsdell-com"
ENVIRONMENT="production"
REGION="eu-west-2"
STACK_NAME="$PROJECT_NAME-$ENVIRONMENT"

echo "$(blue '🔍 CloudFormation Troubleshooting')"
echo "=================================="

# Check required environment variables
echo "$(yellow 'Checking environment variables...')"
if [ -z "${PRODUCTION_DOMAIN_NAME:-}" ]; then
    echo "$(red '❌ PRODUCTION_DOMAIN_NAME not set')"
    exit 1
fi
if [ -z "${PRODUCTION_CERTIFICATE_ARN:-}" ]; then
    echo "$(red '❌ PRODUCTION_CERTIFICATE_ARN not set')"
    exit 1
fi
if [ -z "${PRODUCTION_COGNITO_USER_POOL_ID:-}" ]; then
    echo "$(red '❌ PRODUCTION_COGNITO_USER_POOL_ID not set')"
    exit 1
fi
if [ -z "${PRODUCTION_DATABASE_URL:-}" ]; then
    echo "$(red '❌ PRODUCTION_DATABASE_URL not set')"
    exit 1
fi

echo "$(green '✅ All environment variables set')"

# Validate certificate exists
echo "$(yellow 'Validating certificate...')"
if aws acm describe-certificate --certificate-arn "$PRODUCTION_CERTIFICATE_ARN" --region us-east-1 >/dev/null 2>&1; then
    echo "$(green '✅ Certificate found in us-east-1')"
else
    echo "$(red '❌ Certificate not found or not accessible')"
    exit 1
fi

# Validate Cognito User Pool
echo "$(yellow 'Validating Cognito User Pool...')"
if aws cognito-idp describe-user-pool --user-pool-id "$PRODUCTION_COGNITO_USER_POOL_ID" --region "$REGION" >/dev/null 2>&1; then
    echo "$(green '✅ Cognito User Pool found')"
else
    echo "$(red '❌ Cognito User Pool not found or not accessible')"
    exit 1
fi

# Clean up any existing failed stack
echo "$(yellow 'Checking for existing stacks...')"
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" >/dev/null 2>&1; then
    STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query 'Stacks[0].StackStatus' --output text)
    echo "$(yellow "Found existing stack with status: $STATUS")"
    
    if [[ "$STATUS" == "ROLLBACK_COMPLETE" || "$STATUS" == "CREATE_FAILED" ]]; then
        echo "$(yellow 'Deleting failed stack...')"
        aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$REGION"
        aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$REGION"
        echo "$(green '✅ Failed stack deleted')"
    fi
fi

# Attempt deployment with detailed logging
echo "$(yellow 'Attempting CloudFormation deployment...')"
aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body file://infrastructure/deployment/aws/cloudformation/production-stack.yml \
    --parameters \
        "ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME" \
        "ParameterKey=Environment,ParameterValue=$ENVIRONMENT" \
        "ParameterKey=DomainName,ParameterValue=$PRODUCTION_DOMAIN_NAME" \
        "ParameterKey=CertificateArn,ParameterValue=$PRODUCTION_CERTIFICATE_ARN" \
        "ParameterKey=CognitoUserPoolId,ParameterValue=$PRODUCTION_COGNITO_USER_POOL_ID" \
        "ParameterKey=DatabaseUrl,ParameterValue=$PRODUCTION_DATABASE_URL" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=$ENVIRONMENT"

echo "$(yellow 'Monitoring stack creation...')"
echo "$(blue 'You can also monitor in AWS Console:')"
echo "$(blue "https://eu-west-2.console.aws.amazon.com/cloudformation/home?region=eu-west-2#/stacks/stackinfo?stackId=$STACK_NAME")"

# Monitor with real-time event streaming
while true; do
    STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
    
    case "$STATUS" in
        "CREATE_COMPLETE")
            echo "$(green '✅ Stack created successfully!')"
            break
            ;;
        "ROLLBACK_COMPLETE"|"CREATE_FAILED"|"ROLLBACK_FAILED")
            echo "$(red "❌ Stack creation failed with status: $STATUS")"
            echo "$(yellow 'Recent failed events:')"
            aws cloudformation describe-stack-events \
                --stack-name "$STACK_NAME" \
                --region "$REGION" \
                --query 'StackEvents[?contains(ResourceStatus, `FAILED`)].{Time:Timestamp,Resource:ResourceType,Status:ResourceStatus,Reason:ResourceStatusReason}' \
                --output table
            exit 1
            ;;
        "CREATE_IN_PROGRESS")
            # Show latest events
            aws cloudformation describe-stack-events \
                --stack-name "$STACK_NAME" \
                --region "$REGION" \
                --query 'StackEvents[:3].{Time:Timestamp,Resource:LogicalResourceId,Status:ResourceStatus}' \
                --output table
            echo "$(blue "Status: $STATUS - waiting...")"
            sleep 10
            ;;
        *)
            echo "$(yellow "Status: $STATUS")"
            sleep 5
            ;;
    esac
done

echo "$(green '🎉 Deployment completed successfully!')"
