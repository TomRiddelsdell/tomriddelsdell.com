#!/usr/bin/env bash
#
# Setup script for Infrastructure as Code (Terraform)
# This script helps you initialize Terraform and create required tokens

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check terraform
    if ! command -v terraform &> /dev/null; then
        error "Terraform is not installed"
        echo "Install: brew install terraform (macOS) or sudo apt install terraform (Linux)"
        exit 1
    fi
    success "Terraform $(terraform version -json | jq -r '.terraform_version') found"
    
    # Check doppler
    if ! command -v doppler &> /dev/null; then
        error "Doppler CLI is not installed"
        echo "Install: curl -Ls https://cli.doppler.com/install.sh | sudo sh"
        exit 1
    fi
    success "Doppler CLI found"
    
    # Check gh
    if ! command -v gh &> /dev/null; then
        warning "GitHub CLI is not installed (optional but recommended)"
        echo "Install: brew install gh (macOS) or see https://cli.github.com/"
    else
        success "GitHub CLI found"
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        error "jq is not installed"
        echo "Install: brew install jq (macOS) or sudo apt install jq (Linux)"
        exit 1
    fi
    success "jq found"
    
    echo ""
}

# Login to Doppler
setup_doppler() {
    info "Setting up Doppler..."
    
    if ! doppler me &> /dev/null; then
        warning "Not logged into Doppler"
        echo "Please login to Doppler:"
        doppler login
    else
        success "Already logged into Doppler as $(doppler me --json | jq -r '.user.email')"
    fi
    
    echo ""
}

# Create Doppler admin token
create_doppler_token() {
    info "Creating Doppler admin token for Terraform..."
    
    DOPPLER_PROJECT="tomriddelsdell-infra"
    DOPPLER_CONFIG="dev"
    TOKEN_NAME="terraform-admin"
    
    # Check if token already exists
    EXISTING_TOKEN=$(doppler configs tokens list \
        --project "$DOPPLER_PROJECT" \
        --config "$DOPPLER_CONFIG" \
        --json 2>/dev/null | jq -r ".[] | select(.name == \"$TOKEN_NAME\") | .slug" || echo "")
    
    if [ -n "$EXISTING_TOKEN" ]; then
        warning "Token '$TOKEN_NAME' already exists"
        read -p "Do you want to create a new one? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Cannot proceed without admin token. Please provide it manually."
            exit 1
        fi
        TOKEN_NAME="terraform-admin-$(date +%s)"
    fi
    
    info "Creating service token: $TOKEN_NAME"
    TOKEN_OUTPUT=$(doppler configs tokens create "$TOKEN_NAME" \
        --project "$DOPPLER_PROJECT" \
        --config "$DOPPLER_CONFIG" \
        --max-age 0 \
        --json)
    
    DOPPLER_ADMIN_TOKEN=$(echo "$TOKEN_OUTPUT" | jq -r '.token')
    
    if [ -z "$DOPPLER_ADMIN_TOKEN" ] || [ "$DOPPLER_ADMIN_TOKEN" = "null" ]; then
        error "Failed to create Doppler admin token"
        exit 1
    fi
    
    success "Doppler admin token created"
    echo ""
}

# Create GitHub token instructions
create_github_token() {
    info "GitHub Personal Access Token Required"
    echo ""
    echo "Please create a GitHub Personal Access Token with these scopes:"
    echo "  - repo (Full control of private repositories)"
    echo "  - admin:org (Full control of orgs and teams)"
    echo "  - write:packages (Write packages to GitHub Package Registry)"
    echo ""
    echo "Create token at: https://github.com/settings/tokens/new"
    echo ""
    read -p "Press ENTER when you have your GitHub token ready..."
    echo ""
    read -sp "Paste your GitHub token: " GITHUB_TOKEN
    echo ""
    
    if [ -z "$GITHUB_TOKEN" ]; then
        error "GitHub token is required"
        exit 1
    fi
    
    success "GitHub token captured"
    echo ""
}

# Get Cloudflare credentials
get_cloudflare_credentials() {
    info "Cloudflare Configuration"
    echo ""
    
    # Try to get from Doppler first
    info "Attempting to fetch Cloudflare credentials from Doppler..."
    if doppler run --project tomriddelsdell-infra --config stg -- printenv CLOUDFLARE_ACCOUNT_ID &> /dev/null; then
        CLOUDFLARE_ACCOUNT_ID=$(doppler run --project tomriddelsdell-infra --config stg -- printenv CLOUDFLARE_ACCOUNT_ID)
        CLOUDFLARE_API_TOKEN=$(doppler run --project tomriddelsdell-infra --config stg -- printenv CLOUDFLARE_API_TOKEN)
        success "Cloudflare credentials fetched from Doppler"
    else
        warning "Could not fetch from Doppler, please enter manually"
        read -p "Cloudflare Account ID: " CLOUDFLARE_ACCOUNT_ID
        read -sp "Cloudflare API Token: " CLOUDFLARE_API_TOKEN
        echo ""
    fi
    
    echo ""
}

# Create terraform.tfvars
create_tfvars() {
    info "Creating terraform.tfvars..."
    
    TFVARS_FILE="terraform.tfvars"
    
    if [ -f "$TFVARS_FILE" ]; then
        warning "terraform.tfvars already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Keeping existing terraform.tfvars"
            return
        fi
    fi
    
    cat > "$TFVARS_FILE" <<EOF
# Terraform Variables
# Generated by setup-terraform.sh on $(date)
# DO NOT COMMIT THIS FILE

# Doppler Configuration
doppler_admin_token  = "$DOPPLER_ADMIN_TOKEN"
doppler_project_name = "tomriddelsdell-infra"

# GitHub Configuration
github_token      = "$GITHUB_TOKEN"
github_owner      = "TomRiddelsdell"
github_repository = "tomriddelsdell.com"

# Cloudflare Configuration
cloudflare_account_id = "$CLOUDFLARE_ACCOUNT_ID"
cloudflare_api_token  = "$CLOUDFLARE_API_TOKEN"
domain_name           = "tomriddelsdell.com"

# GitHub OAuth Configuration (for Cloudflare Access)
# TODO: Create OAuth app at https://github.com/settings/applications/new
github_oauth_client_id     = "TODO"
github_oauth_client_secret = "TODO"

# Git Repository
git_repository_url = "https://github.com/TomRiddelsdell/tomriddelsdell.com"
EOF
    
    chmod 600 "$TFVARS_FILE"
    success "terraform.tfvars created and secured (chmod 600)"
    echo ""
}

# Initialize Terraform
init_terraform() {
    info "Initializing Terraform..."
    
    if terraform init; then
        success "Terraform initialized"
    else
        error "Terraform initialization failed"
        exit 1
    fi
    
    echo ""
}

# Run terraform plan
plan_terraform() {
    info "Running Terraform plan..."
    echo ""
    
    if terraform plan -out=tfplan; then
        success "Terraform plan completed"
        echo ""
        info "Review the plan above. To apply:"
        echo "  terraform apply tfplan"
    else
        error "Terraform plan failed"
        exit 1
    fi
    
    echo ""
}

# Main execution
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║       Infrastructure as Code Setup (Terraform)             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Navigate to terraform directory
    cd "$(dirname "$0")"
    
    check_prerequisites
    setup_doppler
    create_doppler_token
    create_github_token
    get_cloudflare_credentials
    create_tfvars
    init_terraform
    plan_terraform
    
    echo ""
    success "Setup completed successfully! 🎉"
    echo ""
    info "Next steps:"
    echo "  1. Review the terraform plan: terraform show tfplan"
    echo "  2. Apply the infrastructure: terraform apply tfplan"
    echo "  3. View outputs: terraform output"
    echo ""
    warning "Remember: Never commit terraform.tfvars to version control!"
    echo ""
}

# Run main function
main
