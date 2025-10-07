#!/bin/bash
# GitHub Actions Setup Helper Script
# This script helps configure GitHub repository for CI/CD deployment

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║          GitHub Actions CI/CD Setup Helper                          ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo "${BLUE}📋 Checking prerequisites...${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "${YELLOW}⚠️  GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "For now, you'll need to configure manually via GitHub web interface"
    MANUAL_SETUP=true
else
    echo "${GREEN}✅ GitHub CLI is installed${NC}"
    MANUAL_SETUP=false
fi

# Check if logged in to gh
if [ "$MANUAL_SETUP" = false ]; then
    if ! gh auth status &> /dev/null; then
        echo "${YELLOW}⚠️  Not logged in to GitHub CLI${NC}"
        echo "Run: gh auth login"
        MANUAL_SETUP=true
    else
        echo "${GREEN}✅ Authenticated with GitHub CLI${NC}"
    fi
fi

# Check if Doppler is installed and authenticated
if ! command -v doppler &> /dev/null; then
    echo "${YELLOW}⚠️  Doppler CLI is not installed${NC}"
    echo "Install it from: https://docs.doppler.com/docs/install-cli"
    DOPPLER_AVAILABLE=false
else
    echo "${GREEN}✅ Doppler CLI is installed${NC}"
    DOPPLER_AVAILABLE=true
fi

if [ "$DOPPLER_AVAILABLE" = true ]; then
    if ! doppler whoami &> /dev/null; then
        echo "${YELLOW}⚠️  Not logged in to Doppler${NC}"
        echo "Run: doppler login"
        DOPPLER_AVAILABLE=false
    else
        echo "${GREEN}✅ Authenticated with Doppler${NC}"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get repository info
REPO_OWNER="TomRiddelsdell"
REPO_NAME="tomriddelsdell.com"

if [ "$MANUAL_SETUP" = false ]; then
    echo "${BLUE}🔍 Detecting repository...${NC}"
    CURRENT_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
    if [ -n "$CURRENT_REPO" ]; then
        echo "${GREEN}✅ Repository: $CURRENT_REPO${NC}"
    else
        echo "${YELLOW}⚠️  Could not detect repository${NC}"
        MANUAL_SETUP=true
    fi
    echo ""
fi

# Step 1: Create Doppler Service Tokens
echo "${BLUE}📦 Step 1: Create Doppler Service Tokens${NC}"
echo "──────────────────────────────────────────"
echo ""

if [ "$DOPPLER_AVAILABLE" = true ]; then
    echo "Creating service tokens for GitHub Actions..."
    echo ""
    
    # Create staging service token
    echo "${YELLOW}Creating staging service token...${NC}"
    STG_TOKEN=$(doppler configs tokens create github-actions-staging \
        --project tomriddelsdell-infra \
        --config stg \
        --plain 2>/dev/null || echo "")
    
    if [ -n "$STG_TOKEN" ]; then
        echo "${GREEN}✅ Staging service token created${NC}"
    else
        echo "${YELLOW}⚠️  Could not create staging token (may already exist)${NC}"
        echo "   Get it from: https://dashboard.doppler.com/workplace/tomriddelsdell-infra/stg/service-tokens"
    fi
    
    echo ""
    
    # Create production service token
    echo "${YELLOW}Creating production service token...${NC}"
    PRD_TOKEN=$(doppler configs tokens create github-actions-production \
        --project tomriddelsdell-infra \
        --config prd \
        --plain 2>/dev/null || echo "")
    
    if [ -n "$PRD_TOKEN" ]; then
        echo "${GREEN}✅ Production service token created${NC}"
    else
        echo "${YELLOW}⚠️  Could not create production token (may already exist)${NC}"
        echo "   Get it from: https://dashboard.doppler.com/workplace/tomriddelsdell-infra/prd/service-tokens"
    fi
else
    echo "${YELLOW}⚠️  Doppler CLI not available${NC}"
    echo ""
    echo "Create service tokens manually:"
    echo "1. Go to: https://dashboard.doppler.com"
    echo "2. Navigate to: tomriddelsdell-infra → stg → Service Tokens"
    echo "3. Click 'Generate' and name it 'github-actions-staging'"
    echo "4. Copy the token"
    echo "5. Repeat for 'prd' config with name 'github-actions-production'"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 2: Configure GitHub Secrets
echo "${BLUE}🔐 Step 2: Configure GitHub Secrets${NC}"
echo "──────────────────────────────────────"
echo ""

if [ "$MANUAL_SETUP" = false ] && [ "$DOPPLER_AVAILABLE" = true ]; then
    echo "Adding secrets to GitHub repository..."
    echo ""
    
    # Add staging token
    if [ -n "$STG_TOKEN" ]; then
        echo "$STG_TOKEN" | gh secret set DOPPLER_TOKEN_STG
        echo "${GREEN}✅ DOPPLER_TOKEN_STG configured${NC}"
    fi
    
    # Add production token
    if [ -n "$PRD_TOKEN" ]; then
        echo "$PRD_TOKEN" | gh secret set DOPPLER_TOKEN_PRD
        echo "${GREEN}✅ DOPPLER_TOKEN_PRD configured${NC}"
    fi
    
    echo ""
    echo "${YELLOW}ℹ️  Note: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID should already be configured${NC}"
else
    echo "${YELLOW}⚠️  Manual configuration required${NC}"
    echo ""
    echo "Add these secrets to GitHub repository:"
    echo "1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
    echo "2. Click 'New repository secret'"
    echo "3. Add the following secrets:"
    echo "   - Name: DOPPLER_TOKEN_STG"
    echo "     Value: <staging token from Doppler>"
    echo "   - Name: DOPPLER_TOKEN_PRD"
    echo "     Value: <production token from Doppler>"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 3: Create GitHub Environments
echo "${BLUE}🌍 Step 3: Create GitHub Environments${NC}"
echo "────────────────────────────────────"
echo ""

if [ "$MANUAL_SETUP" = false ]; then
    echo "Creating GitHub environments..."
    echo ""
    
    # Create staging environment
    echo "${YELLOW}Creating staging environment...${NC}"
    gh api \
        --method PUT \
        "/repos/$REPO_OWNER/$REPO_NAME/environments/staging" \
        --field wait_timer=0 \
        --field prevent_self_review=false 2>/dev/null && \
        echo "${GREEN}✅ Staging environment created${NC}" || \
        echo "${YELLOW}⚠️  Could not create staging environment (may already exist)${NC}"
    
    echo ""
    
    # Create production environment
    echo "${YELLOW}Creating production environment...${NC}"
    gh api \
        --method PUT \
        "/repos/$REPO_OWNER/$REPO_NAME/environments/production" \
        --field wait_timer=0 \
        --field prevent_self_review=true 2>/dev/null && \
        echo "${GREEN}✅ Production environment created${NC}" || \
        echo "${YELLOW}⚠️  Could not create production environment (may already exist)${NC}"
else
    echo "${YELLOW}⚠️  Manual configuration required${NC}"
    echo ""
    echo "Create GitHub environments:"
    echo "1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/environments"
    echo "2. Click 'New environment'"
    echo ""
    echo "Staging Environment:"
    echo "  - Name: staging"
    echo "  - Deployment URL: https://staging.tomriddelsdell.com"
    echo "  - Deployment branches: develop"
    echo "  - Required reviewers: None"
    echo ""
    echo "Production Environment:"
    echo "  - Name: production"
    echo "  - Deployment URL: https://tomriddelsdell.com"
    echo "  - Deployment branches: main"
    echo "  - Required reviewers: Add yourself"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 4: Verify Setup
echo "${BLUE}✅ Step 4: Verify Setup${NC}"
echo "──────────────────────────"
echo ""

if [ "$MANUAL_SETUP" = false ]; then
    echo "Checking GitHub Actions secrets..."
    SECRETS=$(gh secret list --json name -q '.[].name')
    
    if echo "$SECRETS" | grep -q "DOPPLER_TOKEN_STG"; then
        echo "${GREEN}✅ DOPPLER_TOKEN_STG is configured${NC}"
    else
        echo "${RED}❌ DOPPLER_TOKEN_STG is missing${NC}"
    fi
    
    if echo "$SECRETS" | grep -q "DOPPLER_TOKEN_PRD"; then
        echo "${GREEN}✅ DOPPLER_TOKEN_PRD is configured${NC}"
    else
        echo "${RED}❌ DOPPLER_TOKEN_PRD is missing${NC}"
    fi
    
    if echo "$SECRETS" | grep -q "CLOUDFLARE_API_TOKEN"; then
        echo "${GREEN}✅ CLOUDFLARE_API_TOKEN is configured${NC}"
    else
        echo "${YELLOW}⚠️  CLOUDFLARE_API_TOKEN is missing (should already be configured)${NC}"
    fi
    
    if echo "$SECRETS" | grep -q "CLOUDFLARE_ACCOUNT_ID"; then
        echo "${GREEN}✅ CLOUDFLARE_ACCOUNT_ID is configured${NC}"
    else
        echo "${YELLOW}⚠️  CLOUDFLARE_ACCOUNT_ID is missing (should already be configured)${NC}"
    fi
else
    echo "${YELLOW}Verify manually:${NC}"
    echo "1. Check secrets: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
    echo "2. Check environments: https://github.com/$REPO_OWNER/$REPO_NAME/settings/environments"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║                    Setup Complete!                                   ║${NC}"
echo "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1. ${YELLOW}Review configuration:${NC}"
echo "   - Secrets: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
echo "   - Environments: https://github.com/$REPO_OWNER/$REPO_NAME/settings/environments"
echo ""
echo "2. ${YELLOW}Test staging deployment:${NC}"
echo "   cd apps/landing-page"
echo "   # Make a minor change"
echo "   git add . && git commit -m \"test: verify CI/CD pipeline\""
echo "   git push origin develop"
echo ""
echo "3. ${YELLOW}Monitor deployment:${NC}"
echo "   https://github.com/$REPO_OWNER/$REPO_NAME/actions"
echo ""
echo "4. ${YELLOW}Verify staging site:${NC}"
echo "   https://staging.tomriddelsdell.com"
echo ""
echo "5. ${YELLOW}Test production deployment:${NC}"
echo "   git checkout main && git merge develop && git push origin main"
echo ""
echo "${GREEN}✅ CI/CD pipeline is ready to use!${NC}"
echo ""
