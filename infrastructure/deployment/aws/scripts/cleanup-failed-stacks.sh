#!/bin/bash

# AWS CloudFormation Failed Stack Cleanup Script
# Identifies and cleans up stacks in failed states

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

# Default values
DRY_RUN=false
AUTO_APPROVE=false
SPECIFIC_STACK=""

# Usage function
usage() {
    echo "$(blue 'AWS CloudFormation Failed Stack Cleanup Script')"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --stack STACK_NAME      Clean up specific stack (optional)"
    echo "  --dry-run                   Show what would be cleaned up without executing"
    echo "  --yes                       Skip confirmation prompt"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Clean up all failed project stacks"
    echo "  $0 -s tomriddelsdell-com-staging --dry-run"
    echo "  $0 --yes                    # Auto-approve cleanup"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--stack)
            SPECIFIC_STACK="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
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

# Check AWS credentials
echo "$(blue '🔐 Checking AWS credentials...')"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "$(red '❌ AWS credentials not configured or invalid')"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "$(green '✅ AWS credentials valid for account:') $AWS_ACCOUNT_ID"

# Function to get stack status
get_stack_status() {
    local stack_name="$1"
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND"
}

# Function to check if stack status indicates failure
is_failed_status() {
    local status="$1"
    case "$status" in
        "ROLLBACK_COMPLETE"|"CREATE_FAILED"|"DELETE_FAILED"|"UPDATE_ROLLBACK_COMPLETE"|"UPDATE_ROLLBACK_FAILED"|"ROLLBACK_FAILED")
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Function to delete a stack
delete_stack() {
    local stack_name="$1"
    local status="$2"
    
    echo "$(yellow "Deleting stack: $stack_name (status: $status)")"
    
    if [ "$DRY_RUN" = false ]; then
        aws cloudformation delete-stack --stack-name "$stack_name" --region "$REGION"
        echo "$(yellow 'Waiting for stack deletion to complete...')"
        
        # Wait for deletion with timeout
        if aws cloudformation wait stack-delete-complete --stack-name "$stack_name" --region "$REGION"; then
            echo "$(green "✅ Successfully deleted stack: $stack_name")"
        else
            echo "$(red "❌ Failed to delete stack: $stack_name")"
            echo "$(yellow 'You may need to manually delete this stack in the AWS console')"
        fi
    else
        echo "$(yellow "📋 Would delete stack: $stack_name")"
    fi
}

# Main cleanup logic
echo ""
echo "$(blue '🧹 CloudFormation Failed Stack Cleanup')"
echo "$(blue '=====================================')"

failed_stacks=()

if [ -n "$SPECIFIC_STACK" ]; then
    # Check specific stack
    echo "$(yellow "Checking specific stack: $SPECIFIC_STACK")"
    status=$(get_stack_status "$SPECIFIC_STACK")
    
    if [ "$status" = "NOT_FOUND" ]; then
        echo "$(yellow "Stack not found: $SPECIFIC_STACK")"
    elif is_failed_status "$status"; then
        failed_stacks+=("$SPECIFIC_STACK:$status")
        echo "$(red "Found failed stack: $SPECIFIC_STACK ($status)")"
    else
        echo "$(green "Stack is in good state: $SPECIFIC_STACK ($status)")"
    fi
else
    # Check all project stacks
    echo "$(yellow 'Scanning for failed stacks...')"
    
    # List all stacks and filter for project stacks
    stack_names=$(aws cloudformation list-stacks \
        --region "$REGION" \
        --query 'StackSummaries[?starts_with(StackName, `tomriddelsdell-com`)].StackName' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$stack_names" ]; then
        echo "$(yellow 'No project stacks found')"
    else
        for stack_name in $stack_names; do
            status=$(get_stack_status "$stack_name")
            echo "$(blue "Checking stack: $stack_name") - $(yellow "$status")"
            
            if is_failed_status "$status"; then
                failed_stacks+=("$stack_name:$status")
                echo "$(red "  ❌ Failed stack detected")"
            else
                echo "$(green "  ✅ Stack is healthy")"
            fi
        done
    fi
fi

# Report findings
echo ""
if [ ${#failed_stacks[@]} -eq 0 ]; then
    echo "$(green '✅ No failed stacks found!')"
    exit 0
fi

echo "$(red "Found ${#failed_stacks[@]} failed stack(s):")"
for stack_info in "${failed_stacks[@]}"; do
    IFS=':' read -r stack_name status <<< "$stack_info"
    echo "  - $(yellow "$stack_name") ($(red "$status"))"
done

# Confirm cleanup
if [ "$DRY_RUN" = false ] && [ "$AUTO_APPROVE" = false ]; then
    echo ""
    read -p "$(yellow 'Proceed with cleanup? (y/N): ')" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "$(yellow 'Cleanup cancelled')"
        exit 0
    fi
fi

# Perform cleanup
echo ""
echo "$(blue '🧹 Starting cleanup process...')"

for stack_info in "${failed_stacks[@]}"; do
    IFS=':' read -r stack_name status <<< "$stack_info"
    delete_stack "$stack_name" "$status"
    echo ""
done

if [ "$DRY_RUN" = false ]; then
    echo "$(green '✅ Cleanup completed!')"
else
    echo "$(yellow '📋 Dry run completed - no actual cleanup performed')"
fi

echo ""
echo "$(blue 'Next steps:')"
echo "1. $(yellow 'Retry your deployment') with the enhanced deploy script"
echo "2. $(yellow 'Monitor the new deployment') for any issues"
echo "3. $(yellow 'Check CloudWatch logs') if deployment fails again"
