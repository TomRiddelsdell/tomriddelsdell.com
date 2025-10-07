#!/bin/bash
# Deploy Cloudflare Access configuration using Doppler for secrets

set -e

ACTION="${1:-plan}"

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║          Deploying Cloudflare Access Configuration                  ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Change to terraform directory
cd "$(dirname "$0")"

# Verify Doppler is authenticated
if ! doppler whoami &>/dev/null; then
    echo "❌ Doppler not authenticated. Please run: doppler login"
    exit 1
fi

echo "✅ Doppler authenticated"
echo ""

# Get all required variables from Doppler
echo "📦 Loading secrets from Doppler (tomriddelsdell-infra / stg)..."
echo ""

if [ "$ACTION" = "apply" ]; then
    echo "🚀 Applying Terraform configuration..."
    echo ""
    
    doppler run --project tomriddelsdell-infra --config stg -- bash -c '
        export TF_VAR_cloudflare_api_token="${CLOUDFLARE_API_TOKEN}"
        export TF_VAR_cloudflare_account_id="${CLOUDFLARE_ACCOUNT_ID}"
        export TF_VAR_domain_name="${DOMAIN_NAME:-tomriddelsdell.com}"
        export TF_VAR_github_owner="${GITHUB_OWNER:-TomRiddelsdell}"
        export TF_VAR_github_repo_name="${GITHUB_REPO_NAME:-tomriddelsdell.com}"
        export TF_VAR_git_repository_url="${GIT_REPOSITORY_URL:-https://github.com/TomRiddelsdell/tomriddelsdell.com}"
        export TF_VAR_github_oauth_client_id="${GITHUB_OAUTH_CLIENT_ID}"
        export TF_VAR_github_oauth_client_secret="${GITHUB_OAUTH_CLIENT_SECRET}"
        export TF_VAR_github_organization_name="${GITHUB_ORGANIZATION_NAME:-TomRiddelsdell}"
        
        terraform apply tfplan
    '
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Cloudflare Access deployed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify GitHub OAuth callback URL is correct"
    echo "2. Test authentication: https://staging.tomriddelsdell.com"
    echo "3. Save service token for GitHub Actions (shown in outputs)"
    echo ""
    
else
    # Run terraform plan with all variables from Doppler
    echo "📋 Planning Terraform deployment..."
    echo ""
    
    doppler run --project tomriddelsdell-infra --config stg -- bash -c '
        export TF_VAR_cloudflare_api_token="${CLOUDFLARE_API_TOKEN}"
        export TF_VAR_cloudflare_account_id="${CLOUDFLARE_ACCOUNT_ID}"
        export TF_VAR_domain_name="${DOMAIN_NAME:-tomriddelsdell.com}"
        export TF_VAR_github_owner="${GITHUB_OWNER:-TomRiddelsdell}"
        export TF_VAR_github_repo_name="${GITHUB_REPO_NAME:-tomriddelsdell.com}"
        export TF_VAR_git_repository_url="${GIT_REPOSITORY_URL:-https://github.com/TomRiddelsdell/tomriddelsdell.com}"
        export TF_VAR_github_oauth_client_id="${GITHUB_OAUTH_CLIENT_ID}"
        export TF_VAR_github_oauth_client_secret="${GITHUB_OAUTH_CLIENT_SECRET}"
        export TF_VAR_github_organization_name="${GITHUB_ORGANIZATION_NAME:-TomRiddelsdell}"
        
        terraform plan -out=tfplan
    '
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Plan created successfully! Review the changes above."
    echo ""
    echo "To apply these changes, run:"
    echo "  ./deploy-access.sh apply"
    echo ""
fi
