#!/bin/bash

# SSL Certificate Setup Script
# Creates and validates SSL certificates for both staging and production environments

set -euo pipefail

# Color output functions
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

# Configuration
STAGING_DOMAIN="dev.tomriddelsdell.com"
PRODUCTION_DOMAIN="tomriddelsdell.com"
AWS_REGION="us-east-1"  # ACM certificates for CloudFront must be in us-east-1
PROJECT_NAME="tomriddelsdell-com"

# Function to check if certificate exists and get its status
check_certificate_status() {
    local domain=$1
    local cert_arn=""
    local status=""
    
    # Find certificate for domain
    cert_arn=$(aws acm list-certificates \
        --region "$AWS_REGION" \
        --query "CertificateSummaryList[?DomainName=='$domain'].CertificateArn" \
        --output text | head -n1)
    
    if [ -n "$cert_arn" ] && [ "$cert_arn" != "None" ] && [ "$cert_arn" != "" ]; then
        status=$(aws acm describe-certificate \
            --certificate-arn "$cert_arn" \
            --region "$AWS_REGION" \
            --query 'Certificate.Status' \
            --output text)
        echo "$cert_arn:$status"
    else
        echo "NONE:NONE"
    fi
}

# Function to request a new certificate
request_certificate() {
    local domain=$1
    local environment=$2
    
    echo "$(blue '📋 Requesting SSL certificate for') $domain"
    
    cert_arn=$(aws acm request-certificate \
        --domain-name "$domain" \
        --validation-method DNS \
        --region "$AWS_REGION" \
        --tags Key=Project,Value="$PROJECT_NAME" Key=Environment,Value="$environment" Key=Domain,Value="$domain" \
        --query 'CertificateArn' \
        --output text)
    
    echo "$(green '✅ Certificate requested:') $cert_arn"
    echo "$cert_arn"
}

# Function to show DNS validation records
show_dns_validation() {
    local cert_arn=$1
    local domain=$2
    
    echo "$(blue '🔐 DNS Validation Required for') $domain"
    echo "$(blue '===========================================')"
    
    # Get validation records
    validation_data=$(aws acm describe-certificate \
        --certificate-arn "$cert_arn" \
        --region "$AWS_REGION" \
        --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
        --output json)
    
    if [ "$validation_data" = "null" ]; then
        echo "$(yellow '⏳ Validation records not yet available. Waiting...')"
        sleep 5
        validation_data=$(aws acm describe-certificate \
            --certificate-arn "$cert_arn" \
            --region "$AWS_REGION" \
            --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
            --output json)
    fi
    
    record_name=$(echo "$validation_data" | jq -r '.Name')
    record_value=$(echo "$validation_data" | jq -r '.Value')
    
    echo "$(bold 'DNS Record to Add:')"
    echo "$(green '  Type:') CNAME"
    echo "$(green '  Name:') $record_name"
    echo "$(green '  Value:') $record_value"
    echo ""
    echo "$(yellow 'Add this CNAME record to your DNS provider and wait for validation.')"
    echo ""
}

# Function to update GitHub secret
update_github_secret() {
    local secret_name=$1
    local cert_arn=$2
    
    echo "$(blue '📝 Updating GitHub secret:') $secret_name"
    
    if command -v gh >/dev/null; then
        gh secret set "$secret_name" --body "$cert_arn"
        echo "$(green '✅ GitHub secret updated successfully')"
    else
        echo "$(yellow '⚠️ GitHub CLI not available. Please manually update the secret:')"
        echo "$(yellow "Secret Name: $secret_name")"
        echo "$(yellow "Secret Value: $cert_arn")"
        echo "$(yellow "URL: https://github.com/TomRiddelsdell/tomriddelsdell.com/settings/secrets/actions")"
    fi
}

# Function to wait for certificate validation
wait_for_validation() {
    local cert_arn=$1
    local domain=$2
    local max_attempts=60  # 30 minutes (30 seconds * 60)
    local attempt=0
    
    echo "$(blue '⏳ Waiting for certificate validation...') (this may take up to 30 minutes)"
    
    while [ $attempt -lt $max_attempts ]; do
        status=$(aws acm describe-certificate \
            --certificate-arn "$cert_arn" \
            --region "$AWS_REGION" \
            --query 'Certificate.Status' \
            --output text)
        
        case "$status" in
            "ISSUED")
                echo "$(green '✅ Certificate validated successfully!')"
                return 0
                ;;
            "FAILED")
                echo "$(red '❌ Certificate validation failed')"
                return 1
                ;;
            "PENDING_VALIDATION")
                echo "$(yellow '⏳ Still pending validation...') (attempt $((attempt + 1))/$max_attempts)"
                ;;
            *)
                echo "$(yellow "Status: $status") (attempt $((attempt + 1))/$max_attempts)"
                ;;
        esac
        
        sleep 30
        attempt=$((attempt + 1))
    done
    
    echo "$(yellow '⚠️ Validation timeout reached. Certificate may still validate later.')"
    return 1
}

# Function to setup certificate for an environment
setup_certificate() {
    local domain=$1
    local environment=$2
    local secret_name=$3
    local auto_validate=${4:-false}
    
    echo ""
    echo "$(bold "🔧 Setting up SSL certificate for $environment environment")"
    echo "$(bold "Domain: $domain")"
    echo "$(bold "Secret: $secret_name")"
    echo ""
    
    # Check existing certificate status
    cert_info=$(check_certificate_status "$domain")
    cert_arn=$(echo "$cert_info" | cut -d':' -f1)
    cert_status=$(echo "$cert_info" | cut -d':' -f2)
    
    if [ "$cert_arn" = "NONE" ]; then
        echo "$(yellow '📋 No existing certificate found. Requesting new certificate...')"
        cert_arn=$(request_certificate "$domain" "$environment")
        cert_status="PENDING_VALIDATION"
    else
        echo "$(blue '📋 Found existing certificate:') $cert_arn"
        echo "$(blue '📋 Status:') $cert_status"
    fi
    
    case "$cert_status" in
        "ISSUED")
            echo "$(green '✅ Certificate is already validated and ready!')"
            update_github_secret "$secret_name" "$cert_arn"
            ;;
        "PENDING_VALIDATION")
            show_dns_validation "$cert_arn" "$domain"
            update_github_secret "$secret_name" "$cert_arn"
            
            if [ "$auto_validate" = "true" ]; then
                wait_for_validation "$cert_arn" "$domain"
            else
                echo "$(yellow 'To wait for automatic validation, run with --wait flag')"
            fi
            ;;
        "FAILED")
            echo "$(red '❌ Certificate validation failed. Requesting new certificate...')"
            cert_arn=$(request_certificate "$domain" "$environment")
            show_dns_validation "$cert_arn" "$domain"
            update_github_secret "$secret_name" "$cert_arn"
            ;;
        *)
            echo "$(yellow "Certificate status: $cert_status")"
            echo "$(yellow 'Please check AWS Console for details')"
            ;;
    esac
    
    echo ""
    echo "$(blue 'AWS Console Link:')"
    echo "$(blue "https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/details?certificateArn=$cert_arn")"
}

# Function to show usage
usage() {
    echo "$(bold 'SSL Certificate Setup Script')"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --staging           Setup staging certificate only"
    echo "  --production        Setup production certificate only"
    echo "  --all               Setup both staging and production certificates (default)"
    echo "  --wait              Wait for certificate validation (up to 30 minutes)"
    echo "  --status            Check status of existing certificates"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                  # Setup both certificates"
    echo "  $0 --staging --wait # Setup staging certificate and wait for validation"
    echo "  $0 --status         # Check status of existing certificates"
    echo ""
}

# Function to show certificate status
show_status() {
    echo "$(bold '🔍 Certificate Status Report')"
    echo "$(bold '============================')"
    echo ""
    
    # Check staging certificate
    echo "$(blue '📋 Staging Environment (dev.tomriddelsdell.com):')"
    staging_info=$(check_certificate_status "$STAGING_DOMAIN")
    staging_arn=$(echo "$staging_info" | cut -d':' -f1)
    staging_status=$(echo "$staging_info" | cut -d':' -f2)
    
    if [ "$staging_arn" = "NONE" ]; then
        echo "$(yellow '  Status: No certificate found')"
    else
        echo "$(yellow '  ARN:') $staging_arn"
        case "$staging_status" in
            "ISSUED") echo "$(green '  Status: ✅ ISSUED')"; ;;
            "PENDING_VALIDATION") echo "$(yellow '  Status: ⏳ PENDING_VALIDATION')"; ;;
            "FAILED") echo "$(red '  Status: ❌ FAILED')"; ;;
            *) echo "$(yellow "  Status: $staging_status")"; ;;
        esac
    fi
    echo ""
    
    # Check production certificate
    echo "$(blue '📋 Production Environment (tomriddelsdell.com):')"
    production_info=$(check_certificate_status "$PRODUCTION_DOMAIN")
    production_arn=$(echo "$production_info" | cut -d':' -f1)
    production_status=$(echo "$production_info" | cut -d':' -f2)
    
    if [ "$production_arn" = "NONE" ]; then
        echo "$(yellow '  Status: No certificate found')"
    else
        echo "$(yellow '  ARN:') $production_arn"
        case "$production_status" in
            "ISSUED") echo "$(green '  Status: ✅ ISSUED')"; ;;
            "PENDING_VALIDATION") echo "$(yellow '  Status: ⏳ PENDING_VALIDATION')"; ;;
            "FAILED") echo "$(red '  Status: ❌ FAILED')"; ;;
            *) echo "$(yellow "  Status: $production_status")"; ;;
        esac
    fi
    echo ""
    
    # Check GitHub secrets
    echo "$(blue '📋 GitHub Secrets:')"
    if command -v gh >/dev/null; then
        gh secret list | grep -E "(STAGING_CERTIFICATE_ARN|PRODUCTION_CERTIFICATE_ARN)" || echo "$(yellow '  No certificate secrets found')"
    else
        echo "$(yellow '  GitHub CLI not available - check secrets manually')"
    fi
}

# Main execution
main() {
    echo "$(bold '🔐 SSL Certificate Setup for tomriddelsdell.com')"
    echo "$(bold '==============================================')"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        echo "$(red '❌ AWS credentials not configured')"
        echo "$(yellow 'Please configure AWS credentials first:')"
        echo "  aws configure"
        exit 1
    fi
    
    local setup_staging=false
    local setup_production=false
    local auto_validate=false
    local show_status_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --staging)
                setup_staging=true
                shift
                ;;
            --production)
                setup_production=true
                shift
                ;;
            --all)
                setup_staging=true
                setup_production=true
                shift
                ;;
            --wait)
                auto_validate=true
                shift
                ;;
            --status)
                show_status_only=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                echo "$(red "Unknown option: $1")"
                usage
                exit 1
                ;;
        esac
    done
    
    # Default to all if no specific environment chosen
    if [ "$setup_staging" = false ] && [ "$setup_production" = false ] && [ "$show_status_only" = false ]; then
        setup_staging=true
        setup_production=true
    fi
    
    # Show status if requested
    if [ "$show_status_only" = true ]; then
        show_status
        exit 0
    fi
    
    # Setup certificates
    if [ "$setup_staging" = true ]; then
        setup_certificate "$STAGING_DOMAIN" "staging" "STAGING_CERTIFICATE_ARN" "$auto_validate"
    fi
    
    if [ "$setup_production" = true ]; then
        setup_certificate "$PRODUCTION_DOMAIN" "production" "PRODUCTION_CERTIFICATE_ARN" "$auto_validate"
    fi
    
    echo ""
    echo "$(green '🎉 Certificate setup complete!')"
    echo ""
    echo "$(blue 'Next steps:')"
    echo "1. $(yellow 'Add the DNS validation records') to your DNS provider"
    echo "2. $(yellow 'Wait for certificate validation') (usually 5-30 minutes)"
    echo "3. $(yellow 'Run deployment scripts') once certificates are validated"
    echo "4. $(yellow 'Check certificate status') with: $0 --status"
    echo ""
    echo "$(blue 'Documentation:')"
    echo "- AWS Certificate Manager: https://docs.aws.amazon.com/acm/"
    echo "- DNS Validation: https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html"
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
