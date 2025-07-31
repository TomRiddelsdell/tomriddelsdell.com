#!/bin/bash

# Credential Rotation Script
# This script helps rotate the exposed credentials from the git history

set -e

echo "🔄 Starting Credential Rotation Process..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Credentials that need rotation:${NC}"
echo "1. 🗄️  Database password (Neon PostgreSQL)"
echo "2. 🔐 AWS Cognito User Pool (if needed)"
echo "3. 🔑 GitHub repository secrets"
echo ""

# Function to update GitHub secrets using our MCP server
update_github_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo -e "${YELLOW}Updating GitHub secret: $secret_name${NC}"
    
    # This would use the GitHub MCP server when available
    # For now, providing manual instructions
    echo "Manual step: Update GitHub secret '$secret_name' in repository settings"
    echo "URL: https://github.com/TomRiddelsdell/tomriddelsdell.com/settings/secrets/actions"
}

# Function to generate a new database URL
generate_new_database_url() {
    echo -e "${YELLOW}🗄️  Database Credential Rotation${NC}"
    echo ""
    echo "The exposed database connection string contains sensitive credentials:"
    echo "postgresql://neondb_owner:npg_dQxO8H5RrBny@ep-withered-water-a5gynbw9.us-east-2.aws.neon.tech/neondb?sslmode=require"
    echo ""
    echo "🚨 URGENT: You need to:"
    echo "1. Login to Neon Console: https://console.neon.tech/"
    echo "2. Navigate to your project dashboard"
    echo "3. Go to Settings > Reset password"
    echo "4. Generate a new password for 'neondb_owner' user"
    echo "5. Update the connection string with the new password"
    echo ""
    echo "After rotating the password, the new connection string will be:"
    echo "postgresql://neondb_owner:[NEW_PASSWORD]@ep-withered-water-a5gynbw9.us-east-2.aws.neon.tech/neondb?sslmode=require"
    echo ""
}

# Function to check what GitHub secrets need updating
check_github_secrets() {
    echo -e "${YELLOW}🔑 GitHub Secrets to Update${NC}"
    echo ""
    echo "The following GitHub secrets need to be updated with new values:"
    echo "- DATABASE_URL (with new password)"
    echo "- STAGING_DATABASE_URL (with new password)" 
    echo "- PRODUCTION_DATABASE_URL (with new password)"
    echo ""
    echo "Optional rotations:"
    echo "- AWS_ACCESS_KEY_ID (if you want to rotate AWS credentials)"
    echo "- AWS_SECRET_ACCESS_KEY (if you want to rotate AWS credentials)"
    echo ""
}

# Function to verify rotation
verify_rotation() {
    echo -e "${YELLOW}✅ Verification Steps${NC}"
    echo ""
    echo "After rotating credentials, verify:"
    echo "1. 🧪 Run tests: npm run test"
    echo "2. 🏗️  Build application: npm run build"
    echo "3. 🚀 Deploy to staging and verify functionality"
    echo "4. 📊 Check monitoring/logs for any connection issues"
    echo ""
}

# Main execution
main() {
    echo -e "${GREEN}Starting credential rotation process...${NC}"
    echo ""
    
    generate_new_database_url
    check_github_secrets
    verify_rotation
    
    echo -e "${GREEN}📋 Summary of Actions Needed:${NC}"
    echo "1. 🗄️  Rotate Neon database password"
    echo "2. 🔄 Update DATABASE_URL in GitHub secrets"
    echo "3. 🧪 Test new credentials"
    echo "4. 🚀 Deploy and verify"
    echo ""
    echo -e "${RED}⚠️  Remember: The old credentials were exposed in git history!${NC}"
    echo -e "${RED}   Consider them compromised and rotate immediately.${NC}"
}

# Execute main function
main "$@"
