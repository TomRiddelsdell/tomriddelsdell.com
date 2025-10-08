#!/bin/bash
set -e

# Script to deploy Cloudflare infrastructure using Doppler secrets
# This script ensures all credentials are sourced from Doppler

echo "🔐 Deploying Cloudflare Infrastructure with Doppler Secrets..."

# Check if Doppler CLI is available
if ! command -v doppler &> /dev/null; then
    echo "❌ Doppler CLI not found. Please install it first."
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "main.tf" ]; then
    echo "❌ main.tf not found. Please run this script from the terraform/cloudflare directory."
    exit 1
fi

# Verify Doppler authentication
echo "🔍 Checking Doppler authentication..."
if ! doppler auth status &> /dev/null; then
    echo "❌ Not authenticated with Doppler. Please run 'doppler login' first."
    exit 1
fi

# Set the Doppler project and config
DOPPLER_PROJECT="${DOPPLER_PROJECT:-tomriddelsdell-infra}"
DOPPLER_CONFIG="${DOPPLER_CONFIG:-prd}"

echo "📦 Using Doppler project: $DOPPLER_PROJECT"
echo "⚙️  Using Doppler config: $DOPPLER_CONFIG"

# Initialize Terraform with Doppler secrets
echo "🏗️  Initializing Terraform..."
doppler run --project "$DOPPLER_PROJECT" --config "$DOPPLER_CONFIG" -- terraform init

# Plan the deployment
echo "📋 Planning Terraform deployment..."
doppler run --project "$DOPPLER_PROJECT" --config "$DOPPLER_CONFIG" -- terraform plan \
    -var="cloudflare_api_token=$CLOUDFLARE_API_TOKEN" \
    -var="cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID" \
    -var="domain_name=$DOMAIN_NAME" \
    -var="github_owner=$GITHUB_OWNER" \
    -var="github_repo_name=$GITHUB_REPO_NAME" \
    -var="git_repository_url=$GIT_REPOSITORY_URL"

# Ask for confirmation
read -p "🚀 Do you want to apply these changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Applying Terraform configuration..."
    doppler run --project "$DOPPLER_PROJECT" --config "$DOPPLER_CONFIG" -- terraform apply \
        -var="cloudflare_api_token=$CLOUDFLARE_API_TOKEN" \
        -var="cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID" \
        -var="domain_name=$DOMAIN_NAME" \
        -var="github_owner=$GITHUB_OWNER" \
        -var="github_repo_name=$GITHUB_REPO_NAME" \
        -var="git_repository_url=$GIT_REPOSITORY_URL" \
        -auto-approve
    echo "🎉 Cloudflare infrastructure deployed successfully!"
else
    echo "❌ Deployment cancelled."
    exit 1
fi