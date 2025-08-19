#!/bin/bash

# SSL Certificate DNS Validation Helper
# Provides instructions for adding DNS validation records

set -euo pipefail

green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

# Load certificate ARN from centralized configuration
echo "$(blue '🔧 Loading configuration...')"
CONFIG_OUTPUT=$(node infrastructure/deployment/aws/scripts/load-config.cjs)
CERT_ARN=$(echo "$CONFIG_OUTPUT" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).certificateArn)")

echo "$(blue '🔐 SSL Certificate DNS Validation')"
echo "$(blue '=================================')"
echo ""

echo "$(bold 'Certificate ARN:')"
echo "$CERT_ARN"
echo ""

echo "$(bold 'DNS Records to Add:')"
echo "$(yellow 'You need to add the following CNAME record to your DNS provider:')"
echo ""

# Get validation records
VALIDATION_DATA=$(aws acm describe-certificate \
  --certificate-arn "$CERT_ARN" \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
  --output json)

RECORD_NAME=$(echo "$VALIDATION_DATA" | jq -r '.Name')
RECORD_VALUE=$(echo "$VALIDATION_DATA" | jq -r '.Value')

echo "$(green 'Record Type:') CNAME"
echo "$(green 'Record Name:') $RECORD_NAME"
echo "$(green 'Record Value:') $RECORD_VALUE"
echo ""

echo "$(blue 'Instructions:')"
echo "1. Log in to your DNS provider (Cloudflare, Route 53, etc.)"
echo "2. Add a new CNAME record with the above details"
echo "3. Wait for DNS propagation (usually 5-10 minutes)"
echo "4. Run this script again to check validation status"
echo ""

echo "$(yellow 'Checking current certificate status...')"
STATUS=$(aws acm describe-certificate \
  --certificate-arn "$CERT_ARN" \
  --region us-east-1 \
  --query 'Certificate.Status' \
  --output text)

echo "$(yellow "Current Status: $STATUS")"

if [ "$STATUS" = "ISSUED" ]; then
    echo "$(green '✅ Certificate is already validated and ready to use!')"
    
    # Update GitHub secret with the new certificate ARN
    echo ""
    echo "$(blue 'Updating GitHub secret...')"
    if command -v gh >/dev/null; then
        gh secret set PRODUCTION_CERTIFICATE_ARN --body "$CERT_ARN"
        echo "$(green '✅ GitHub secret PRODUCTION_CERTIFICATE_ARN updated')"
    else
        echo "$(yellow '⚠️ GitHub CLI not available. Please manually update the secret:')"
        echo "$(yellow "PRODUCTION_CERTIFICATE_ARN = $CERT_ARN")"
    fi
    
    echo ""
    echo "$(green '🚀 Ready to deploy! Run the deployment script now.')"
    
elif [ "$STATUS" = "PENDING_VALIDATION" ]; then
    echo "$(yellow '⏳ Certificate is waiting for DNS validation')"
    echo "$(yellow 'Please add the DNS record above and wait a few minutes')"
    
    # Check if DNS record exists
    echo ""
    echo "$(yellow 'Checking DNS propagation...')"
    if nslookup "$RECORD_NAME" >/dev/null 2>&1; then
        echo "$(green '✅ DNS record is propagating')"
        echo "$(yellow 'Certificate validation should complete soon')"
    else
        echo "$(yellow '⏳ DNS record not yet visible')"
        echo "$(yellow 'This is normal - DNS propagation can take 5-10 minutes')"
    fi
    
else
    echo "$(yellow "Status: $STATUS")"
    echo "$(yellow 'Please check the AWS Console for more details')"
fi

echo ""
echo "$(blue 'AWS Console Link:')"
echo "$(blue 'https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/details')"
echo "$(blue "?certificateArn=$CERT_ARN")"
