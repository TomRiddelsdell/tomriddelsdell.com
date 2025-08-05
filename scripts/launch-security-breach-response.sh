#!/bin/bash

# Security Breach Response Launcher Script
# Provides a convenient wrapper for the security breach response TypeScript script

set -e

# Color functions for better output
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECURITY_SCRIPT="$SCRIPT_DIR/security-breach-response.ts"

# Help function
show_help() {
    echo ""
    echo "$(bold '🚨 Security Breach Response Launcher')"
    echo "======================================"
    echo ""
    echo "$(blue 'DESCRIPTION:')"
    echo "  Launches the security breach response system to handle potential security incidents."
    echo "  This script provides automated credential rotation, environment cleanup, and"
    echo "  comprehensive security audit logging."
    echo ""
    echo "$(blue 'USAGE:')"
    echo "  $0 [OPTIONS]"
    echo ""
    echo "$(blue 'OPTIONS:')"
    echo "  -i, --interactive   Run in interactive mode (default)"
    echo "  -a, --auto          Run in automated mode without prompts"
    echo "  -c, --check         Check prerequisites only"
    echo "  -h, --help          Show this help message"
    echo "  -v, --verbose       Enable verbose output"
    echo ""
    echo "$(blue 'EXAMPLES:')"
    echo "  $0                  # Interactive mode"
    echo "  $0 --auto           # Automated breach response"
    echo "  $0 --check          # Check if system is ready"
    echo ""
    echo "$(blue 'SECURITY FEATURES:')"
    echo "  • AWS credentials rotation"
    echo "  • Session secret regeneration"
    echo "  • GitHub secrets update"
    echo "  • Environment file backup and cleanup"
    echo "  • Comprehensive audit logging"
    echo "  • Prerequisites verification"
    echo ""
    echo "$(yellow 'WARNING:')"
    echo "  This script performs security-critical operations including:"
    echo "  - Rotating AWS access keys"
    echo "  - Updating production secrets"
    echo "  - Modifying environment configurations"
    echo "  Use with caution and ensure you have proper backups!"
    echo ""
}

# Prerequisites check function
check_prerequisites() {
    echo "$(blue '🔍 Checking Prerequisites...')"
    echo ""
    
    local all_good=true
    
    # Check if security-breach-response.ts exists
    if [ ! -f "$SECURITY_SCRIPT" ]; then
        echo "$(red '✗ Security breach response script not found:')"
        echo "  Expected: $SECURITY_SCRIPT"
        all_good=false
    else
        echo "$(green '✓ Security breach response script found')"
    fi
    
    # Check for tsx
    if ! command -v tsx >/dev/null 2>&1; then
        echo "$(red '✗ tsx not found')"
        echo "  Install with: npm install -g tsx"
        all_good=false
    else
        echo "$(green '✓ tsx found')"
    fi
    
    # Check for required CLI tools
    local tools=("aws" "gh" "curl" "jq")
    for tool in "${tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            echo "$(green "✓ $tool found")"
        else
            echo "$(red "✗ $tool not found")"
            all_good=false
        fi
    done
    
    # Check AWS credentials
    if aws sts get-caller-identity >/dev/null 2>&1; then
        echo "$(green '✓ AWS credentials valid')"
    else
        echo "$(yellow '⚠ AWS credentials not configured or invalid')"
        echo "  Configure with: aws configure"
    fi
    
    # Check GitHub CLI authentication
    if gh auth status >/dev/null 2>&1; then
        echo "$(green '✓ GitHub CLI authenticated')"
    else
        echo "$(yellow '⚠ GitHub CLI not authenticated')"
        echo "  Set GITHUB_TOKEN environment variable"
    fi
    
    # Check .env file
    if [ -f "/workspaces/.env" ]; then
        echo "$(green '✓ Environment file found')"
    else
        echo "$(yellow '⚠ Environment file not found')"
        echo "  Expected: /workspaces/.env"
    fi
    
    echo ""
    
    if [ "$all_good" = true ]; then
        echo "$(green '✅ All prerequisites satisfied')"
        return 0
    else
        echo "$(red '❌ Some prerequisites are missing')"
        return 1
    fi
}

# Main execution function
run_security_response() {
    local mode="$1"
    local verbose="$2"
    
    echo ""
    echo "$(bold '🚨 SECURITY BREACH RESPONSE ACTIVATED')"
    echo "======================================="
    echo ""
    
    # Determine execution mode
    case "$mode" in
        "auto")
            echo "$(yellow '⚡ Running in AUTOMATED mode')"
            echo "$(red 'WARNING: This will automatically rotate credentials without prompts!')"
            echo ""
            sleep 3
            tsx "$SECURITY_SCRIPT" --auto
            ;;
        "interactive"|*)
            echo "$(blue '💬 Running in INTERACTIVE mode')"
            echo "You will be prompted for each action."
            echo ""
            tsx "$SECURITY_SCRIPT"
            ;;
    esac
}

# Parse command line arguments
MODE="interactive"
VERBOSE=false
CHECK_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--interactive)
            MODE="interactive"
            shift
            ;;
        -a|--auto)
            MODE="auto"
            shift
            ;;
        -c|--check)
            CHECK_ONLY=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "$(red "Unknown option: $1")"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

# Main execution flow
echo ""
echo "$(bold '🛡️  Security Breach Response System')"
echo "===================================="
echo ""

# Always check prerequisites first
if ! check_prerequisites; then
    echo ""
    echo "$(red '❌ Prerequisites check failed!')"
    echo "Please resolve the issues above before proceeding."
    exit 1
fi

# If check-only mode, exit after prerequisites
if [ "$CHECK_ONLY" = true ]; then
    echo ""
    echo "$(green '✅ Prerequisites check completed successfully')"
    echo "System is ready for security breach response."
    exit 0
fi

# Confirm execution (except in auto mode)
if [ "$MODE" != "auto" ]; then
    echo ""
    echo "$(yellow '⚠️  IMPORTANT SECURITY WARNING ⚠️')"
    echo ""
    echo "This script will perform security-critical operations:"
    echo "• Rotate AWS access keys and update GitHub secrets"
    echo "• Regenerate session secrets"
    echo "• Update local environment files"
    echo "• Create comprehensive audit logs"
    echo ""
    echo -n "$(bold 'Are you sure you want to proceed? (y/N): ')"
    read -r response
    
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo "$(yellow 'Operation cancelled by user.')"
        exit 0
    fi
fi

# Execute the security response
echo ""
echo "$(blue '🚀 Launching security breach response...')"
echo ""

if [ "$VERBOSE" = true ]; then
    set -x
fi

run_security_response "$MODE" "$VERBOSE"

echo ""
echo "$(green '✅ Security breach response completed')"
echo ""
echo "$(blue '📋 Next Steps:')"
echo "• Review the audit logs for detailed information"
echo "• Verify all services are functioning correctly"
echo "• Monitor for any unusual activity"
echo "• Update your local credentials if needed"
echo ""
