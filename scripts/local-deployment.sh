#!/bin/bash

# Local Deployment Script - Uses GitHub secrets for local testing
# Usage: ./scripts/local-deployment.sh staging|production [--dry-run]

set -euo pipefail

ENVIRONMENT="${1:-staging}"
EXTRA_ARGS="${@:2}"

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Environment must be 'staging' or 'production'"
    exit 1
fi

echo "🔧 Using centralized configuration system..."
echo "✅ Configuration will be loaded by deploy script"

# Execute the deployment script
echo "🚀 Running deployment script..."
exec ./infrastructure/deployment/aws/scripts/deploy.sh -e "$ENVIRONMENT" $EXTRA_ARGS