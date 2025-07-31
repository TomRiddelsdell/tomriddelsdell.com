# MCP Server Environment Variables

This document outlines the environment variables required for the GitHub MCP server after fixing hardcoded credentials.

## Required Environment Variables

### GitHub Configuration
- `GITHUB_TOKEN`: GitHub personal access token with appropriate permissions
- `GITHUB_OWNER`: GitHub repository owner/organization name
- `GITHUB_REPO`: GitHub repository name

### Optional Environment Variables
- `GITHUB_REQUIRED_REVIEWER`: GitHub username for required production environment reviews (defaults to GITHUB_OWNER)
- `STAGING_DOMAIN_NAME`: Staging domain name for deployment
- `PRODUCTION_DOMAIN_NAME`: Production domain name for deployment
- `COGNITO_USER_POOL_ID`: AWS Cognito User Pool ID
- `DATABASE_URL`: Database connection URL

## Security Improvements Made

1. **Removed hardcoded GitHub repository owner**: Now requires `GITHUB_OWNER` environment variable
2. **Removed hardcoded GitHub repository name**: Now requires `GITHUB_REPO` environment variable
3. **Removed hardcoded domain names**: Now uses environment variables or function parameters
4. **Removed hardcoded Cognito User Pool ID**: Now uses environment variable or function parameter
5. **Removed hardcoded database URL**: Now uses environment variable or function parameter
6. **Removed hardcoded reviewer username**: Now uses environment variable with fallback to repository owner

## Migration Notes

If you were using this MCP server before these changes, you'll need to set the following environment variables:

```bash
GITHUB_OWNER=TomRiddelsdell
GITHUB_REPO=tomriddelsdell.com
STAGING_DOMAIN_NAME=dev.tomriddelsdell.com
PRODUCTION_DOMAIN_NAME=tomriddelsdell.com
COGNITO_USER_POOL_ID=eu-west-2_g2Bs4XiwN
DATABASE_URL=your_database_url_here
```
