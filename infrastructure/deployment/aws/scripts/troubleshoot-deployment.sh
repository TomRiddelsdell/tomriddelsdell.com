#!/bin/bash

# Deployment Failure Analysis Script
# Analyzes failed GitHub Actions and CloudFormation deployments

set -euo pipefail

red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

PROJECT_NAME="tomriddelsdell-com"
ENVIRONMENT="${1:-staging}"
REGION="eu-west-2"
STACK_NAME="$PROJECT_NAME-$ENVIRONMENT"

echo "$(blue '🔍 Deployment Failure Analysis')"
echo "$(blue '==============================')"
echo "Environment: $ENVIRONMENT"
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo ""

# 1. GitHub Actions Analysis
echo "$(bold '📋 GitHub Actions Analysis')"
echo "$(yellow 'Recent workflow runs:')"
if command -v gh >/dev/null 2>&1; then
    gh run list --limit 5 --json status,conclusion,createdAt,headBranch,displayTitle | \
    jq -r '.[] | "\(.createdAt | split("T")[0]) \(.createdAt | split("T")[1] | split(".")[0]) - \(.displayTitle) [\(.status)/\(.conclusion // "running")]"'
    
    echo ""
    echo "$(yellow 'Latest failed run details:')"
    LATEST_FAILED=$(gh run list --status failure --limit 1 --json databaseId --jq '.[0].databaseId')
    if [ -n "$LATEST_FAILED" ] && [ "$LATEST_FAILED" != "null" ]; then
        echo "$(blue 'Run ID:') $LATEST_FAILED"
        gh run view "$LATEST_FAILED" --json jobs | jq -r '.jobs[] | select(.conclusion == "failure") | "❌ \(.name): \(.conclusion)"'
    else
        echo "$(green 'No recent failed runs found')"
    fi
else
    echo "$(red '❌ GitHub CLI not available - install with: gh auth login')"
fi

echo ""
echo "$(bold '☁️ CloudFormation Analysis')"

# Check current stack status
echo "$(yellow 'Current stack status:')"
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" >/dev/null 2>&1; then
    STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query 'Stacks[0].StackStatus' --output text)
    CREATION_TIME=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query 'Stacks[0].CreationTime' --output text)
    echo "$(blue 'Status:') $STATUS"
    echo "$(blue 'Created:') $CREATION_TIME"
    
    if [[ "$STATUS" == *"FAILED"* || "$STATUS" == *"ROLLBACK"* ]]; then
        echo "$(red '❌ Stack is in failed state')"
    else
        echo "$(green '✅ Stack is in good state')"
    fi
else
    echo "$(yellow '⚠️ Stack does not exist')"
    STATUS="NOT_FOUND"
fi

# Show recent stack events if stack exists or recently existed
echo ""
echo "$(yellow 'Recent stack events:')"
if [ "$STATUS" != "NOT_FOUND" ]; then
    aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'StackEvents[:10].{Time:Timestamp,Resource:LogicalResourceId,Status:ResourceStatus,Reason:ResourceStatusReason}' \
        --output table
else
    # Check for recently deleted stacks
    echo "$(yellow 'Checking recently deleted stacks...')"
    aws cloudformation list-stacks \
        --stack-status-filter DELETE_COMPLETE \
        --query "StackSummaries[?StackName=='$STACK_NAME' && DeletionTime >= '$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)'].{Name:StackName,Status:StackStatus,Deleted:DeletionTime}" \
        --output table
fi

# Show failed events if any
if [ "$STATUS" != "NOT_FOUND" ]; then
    echo ""
    echo "$(yellow 'Failed events (if any):')"
    FAILED_EVENTS=$(aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'StackEvents[?contains(ResourceStatus, `FAILED`)].{Time:Timestamp,Resource:LogicalResourceId,Type:ResourceType,Status:ResourceStatus,Reason:ResourceStatusReason}' \
        --output table 2>/dev/null)
    
    if [ -n "$FAILED_EVENTS" ] && [ "$FAILED_EVENTS" != "" ]; then
        echo "$FAILED_EVENTS"
    else
        echo "$(green '✅ No failed events found')"
    fi
fi

echo ""
echo "$(bold '🔧 Configuration Validation')"

# Load and validate configuration
echo "$(yellow 'Loading configuration...')"
if command -v node >/dev/null 2>&1 && [ -f "infrastructure/deployment/aws/scripts/load-config.cjs" ]; then
    CONFIG_OUTPUT=$(node infrastructure/deployment/aws/scripts/load-config.cjs 2>/dev/null) || {
        echo "$(red '❌ Failed to load centralized configuration')"
        exit 1
    }
    
    DOMAIN_NAME=$(echo "$CONFIG_OUTPUT" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).domainName); } catch(e) { process.exit(1); }" 2>/dev/null)
    CERTIFICATE_ARN=$(echo "$CONFIG_OUTPUT" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).certificateArn); } catch(e) { process.exit(1); }" 2>/dev/null)
    COGNITO_USER_POOL_ID=$(echo "$CONFIG_OUTPUT" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).cognitoUserPoolId); } catch(e) { process.exit(1); }" 2>/dev/null)
    DATABASE_URL=$(echo "$CONFIG_OUTPUT" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).databaseUrl); } catch(e) { process.exit(1); }" 2>/dev/null)
    
    echo "$(green '✅ Configuration loaded successfully')"
    echo "$(blue 'Domain:') $DOMAIN_NAME"
    echo "$(blue 'Certificate:') ${CERTIFICATE_ARN:0:50}..."
    echo "$(blue 'User Pool:') $COGNITO_USER_POOL_ID"
    echo "$(blue 'Database:') ${DATABASE_URL:0:30}..."
else
    echo "$(red '❌ Node.js or config loader not available')"
fi

echo ""
echo "$(bold '🔍 Resource Validation')"

# Validate certificate exists
if [ -n "${CERTIFICATE_ARN:-}" ]; then
    echo "$(yellow 'Validating certificate...')"
    if aws acm describe-certificate --certificate-arn "$CERTIFICATE_ARN" --region us-east-1 >/dev/null 2>&1; then
        echo "$(green '✅ Certificate found in us-east-1')"
    else
        echo "$(red '❌ Certificate not found or not accessible')"
    fi
fi

# Validate Cognito User Pool
if [ -n "${COGNITO_USER_POOL_ID:-}" ]; then
    echo "$(yellow 'Validating Cognito User Pool...')"
    if aws cognito-idp describe-user-pool --user-pool-id "$COGNITO_USER_POOL_ID" --region "$REGION" >/dev/null 2>&1; then
        echo "$(green '✅ Cognito User Pool found')"
    else
        echo "$(red '❌ Cognito User Pool not found or not accessible')"
    fi
fi

# Validate CloudFormation template
echo "$(yellow 'Validating CloudFormation template...')"
TEMPLATE_FILE="infrastructure/deployment/aws/cloudformation/$ENVIRONMENT-stack.yml"
if [ -f "$TEMPLATE_FILE" ]; then
    if aws cloudformation validate-template --template-body file://$TEMPLATE_FILE >/dev/null 2>&1; then
        echo "$(green '✅ CloudFormation template is valid')"
    else
        echo "$(red '❌ CloudFormation template validation failed:')"
        aws cloudformation validate-template --template-body file://$TEMPLATE_FILE 2>&1 || true
    fi
else
    echo "$(red "❌ Template file not found: $TEMPLATE_FILE")"
fi

echo ""
echo "$(bold '📊 Summary')"
echo "$(blue 'AWS Console Links:')"
echo "$(blue "CloudFormation: https://eu-west-2.console.aws.amazon.com/cloudformation/home?region=eu-west-2#/stacks")"
echo "$(blue "GitHub Actions: https://github.com/TomRiddelsdell/tomriddelsdell.com/actions")"

echo ""
echo "$(green '🔍 Analysis complete!')"