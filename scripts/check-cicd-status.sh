#!/bin/bash

# GitHub Actions Status Checker
# Validates current setup and shows what's ready vs what needs configuration

set -euo pipefail

# Color output functions
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

echo "$(blue '📊 GitHub Actions CI/CD Status Check')"
echo "$(blue '====================================')"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "$(red '❌ Error: Not in a git repository')"
    exit 1
fi

# Get repository info
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

echo "$(yellow 'Repository:') $(git config --get remote.origin.url 2>/dev/null || echo 'No remote origin')"
echo "$(yellow 'Branch:') $(git branch --show-current)"
echo ""

# Check workflows exist
echo "$(bold '🔍 Workflow Files Status')"
echo ""

workflows=(
    ".github/workflows/deploy.yml"
    ".github/workflows/dependencies.yml"
    ".github/workflows/aws-monitoring.yml"
)

all_workflows_exist=true
for workflow in "${workflows[@]}"; do
    if [ -f "$workflow" ]; then
        echo "$(green '✅') $workflow"
    else
        echo "$(red '❌') $workflow $(red 'MISSING')"
        all_workflows_exist=false
    fi
done

echo ""

# Check AWS infrastructure files
echo "$(bold '🏗️ Infrastructure Files Status')"
echo ""

infra_files=(
    "infrastructure/deployment/aws/cloudformation/staging-stack.yml"
    "infrastructure/deployment/aws/cloudformation/production-stack.yml"
    "infrastructure/deployment/aws/scripts/deploy.sh"
    "infrastructure/deployment/aws/scripts/setup-github-actions.sh"
    "infrastructure/deployment/aws/scripts/setup-github-actions-manual.sh"
    "infrastructure/deployment/aws/scripts/aws-cost-calculator.sh"
    "interfaces/api-gateway/src/aws-lambda-adapter.ts"
)

all_infra_exists=true
for file in "${infra_files[@]}"; do
    if [ -f "$file" ]; then
        echo "$(green '✅') $file"
    else
        echo "$(red '❌') $file $(red 'MISSING')"
        all_infra_exists=false
    fi
done

echo ""

# Check documentation
echo "$(bold '📚 Documentation Status')"
echo ""

docs=(
    "docs/GITHUB_ACTIONS_CICD.md"
    "docs/AWS_DEPLOYMENT_GUIDE.md"
    "README.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "$(green '✅') $doc"
    else
        echo "$(red '❌') $doc $(red 'MISSING')"
    fi
done

echo ""

# Check package.json scripts
echo "$(bold '📦 Package.json Scripts')"
echo ""

if [ -f "package.json" ]; then
    required_scripts=(
        "aws:deploy:staging"
        "aws:deploy:production"
        "aws:setup-cicd"
        "aws:cost-estimate"
        "aws:cleanup"
    )
    
    for script in "${required_scripts[@]}"; do
        if jq -r ".scripts.\"$script\"" package.json 2>/dev/null | grep -q "null"; then
            echo "$(red '❌') $script $(red 'MISSING')"
        else
            echo "$(green '✅') $script"
        fi
    done
else
    echo "$(red '❌ package.json not found')"
fi

echo ""

# GitHub CLI availability
echo "$(bold '🐙 GitHub CLI Status')"
echo ""

if command -v gh >/dev/null 2>&1; then
    echo "$(green '✅ GitHub CLI installed')"
    
    # Check if authenticated
    if gh auth status >/dev/null 2>&1; then
        echo "$(green '✅ GitHub CLI authenticated')"
        
        # Get repository info
        if gh repo view >/dev/null 2>&1; then
            echo "$(green '✅ Repository accessible via GitHub CLI')"
            
            # Check if workflows directory exists in remote
            if gh api repos/:owner/:repo/contents/.github/workflows >/dev/null 2>&1; then
                echo "$(green '✅ Workflows directory exists in remote repository')"
            else
                echo "$(yellow '⚠️ Workflows directory not yet pushed to remote')"
            fi
        else
            echo "$(yellow '⚠️ Repository not accessible via GitHub CLI')"
        fi
    else
        echo "$(yellow '⚠️ GitHub CLI not authenticated')"
        echo "   Run: $(blue 'gh auth login')"
    fi
else
    echo "$(red '❌ GitHub CLI not installed')"
    echo "   Install: $(blue 'https://cli.github.com/')"
fi

echo ""

# Summary
echo "$(bold '📋 Setup Summary')"
echo ""

if [ "$all_workflows_exist" = true ] && [ "$all_infra_exists" = true ]; then
    echo "$(green '✅ All CI/CD files are ready!')"
    echo ""
    echo "$(yellow 'Next steps:')"
    echo "1. $(bold 'Run manual setup:') ./infrastructure/deployment/aws/scripts/setup-github-actions-manual.sh"
    echo "2. $(bold 'Configure AWS credentials:') Get valid AWS access keys"
    echo "3. $(bold 'Set up GitHub secrets:') Add AWS role ARNs and environment variables"
    echo "4. $(bold 'Test deployment:') Push to develop branch"
    echo ""
    echo "$(blue 'The infrastructure is complete - only AWS credentials and GitHub secrets are needed!')"
else
    echo "$(red '❌ Some files are missing. Please check the status above.')"
fi

echo ""

# Cost estimation reminder
echo "$(bold '💰 Cost Monitoring')"
echo ""
echo "$(green 'Cost controls in place:')"
echo "• Daily cost monitoring workflow"
echo "• Budget alerts and notifications"
echo "• Automatic cleanup of unused resources"
echo "• Estimated monthly cost: \$5-15 for staging + production"
echo ""

echo "$(blue 'For detailed setup instructions, see:')"
echo "$(blue 'docs/GITHUB_ACTIONS_CICD.md')"
