# Cloudflare Infrastructure Secrets

This document outlines the required secrets for Cloudflare infrastructure deployment.

## Required Doppler Secrets

All secrets must be stored in Doppler under the `tomriddelsdell-infra` project.

### Cloudflare Configuration

| Secret Name | Description | Example Value | Environment |
|-------------|-------------|---------------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Zone:Edit, Page:Edit permissions | `abcd1234...` | prd/stg/dev |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | `acec5ac15...` | prd/stg/dev |

### Domain Configuration

| Secret Name | Description | Example Value | Environment |
|-------------|-------------|---------------|-------------|
| `DOMAIN_NAME` | Primary domain name | `tomriddelsdell.com` | prd/stg/dev |

### GitHub Configuration

| Secret Name | Description | Example Value | Environment |
|-------------|-------------|---------------|-------------|
| `GITHUB_OWNER` | GitHub repository owner | `TomRiddelsdell` | prd/stg/dev |
| `GITHUB_REPO_NAME` | GitHub repository name | `tomriddelsdell.com` | prd/stg/dev |
| `GIT_REPOSITORY_URL` | Full repository URL | `https://github.com/TomRiddelsdell/tomriddelsdell.com` | prd/stg/dev |

### Cloudflare Access (Staging Protection) 🔒

**Required for staging environment protection with GitHub OAuth**

| Secret Name | Description | Example Value | Environment |
|-------------|-------------|---------------|-------------|
| `GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth App Client ID | `Ov23liAbC123...` | stg |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth App Client Secret | `ghp_abc123...` | stg |
| `GITHUB_ORGANIZATION_NAME` | GitHub organization name for team access | `TomRiddelsdell` | stg |

**How to obtain**: Follow the [Cloudflare Access Setup Guide](./ACCESS_SETUP.md) to create a GitHub OAuth application.

## Setting Up Secrets

### 1. Install Doppler CLI

```bash
curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh
```

### 2. Login to Doppler

```bash
doppler login
```

### 3. Set Secrets

```bash
# Set Cloudflare secrets
doppler secrets set CLOUDFLARE_API_TOKEN="your_api_token_here" --project tomriddelsdell-infra --config prd
doppler secrets set CLOUDFLARE_ACCOUNT_ID="your_account_id_here" --project tomriddelsdell-infra --config prd

# Set domain configuration
doppler secrets set DOMAIN_NAME="tomriddelsdell.com" --project tomriddelsdell-infra --config prd

# Set GitHub configuration
doppler secrets set GITHUB_OWNER="TomRiddelsdell" --project tomriddelsdell-infra --config prd
doppler secrets set GITHUB_REPO_NAME="tomriddelsdell.com" --project tomriddelsdell-infra --config prd
doppler secrets set GIT_REPOSITORY_URL="https://github.com/TomRiddelsdell/tomriddelsdell.com" --project tomriddelsdell-infra --config prd

# Set Cloudflare Access secrets (staging only)
doppler secrets set GITHUB_OAUTH_CLIENT_ID="your_oauth_client_id" --project tomriddelsdell-infra --config stg
doppler secrets set GITHUB_OAUTH_CLIENT_SECRET="your_oauth_client_secret" --project tomriddelsdell-infra --config stg
doppler secrets set GITHUB_ORGANIZATION_NAME="TomRiddelsdell" --project tomriddelsdell-infra --config stg
```

## Deployment Usage

### Using the Deploy Script

```bash
cd /workspaces/infra/terraform/cloudflare
./deploy.sh
```

### Manual Deployment

```bash
cd /workspaces/infra/terraform/cloudflare

# Initialize Terraform
doppler run --project tomriddelsdell-infra --config prd -- terraform init

# Plan deployment
doppler run --project tomriddelsdell-infra --config prd -- terraform plan

# Apply deployment
doppler run --project tomriddelsdell-infra --config prd -- terraform apply
```

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use Doppler for all environment variables**
3. **Rotate API tokens regularly**
4. **Use environment-specific configs (dev/stg/prd)**
5. **Audit secret access regularly**

## Cloudflare API Token Permissions

The Cloudflare API token requires the following permissions:

- **Zone:Zone:Read** - Read zone information
- **Zone:Zone Settings:Edit** - Modify zone settings
- **Zone:DNS:Edit** - Manage DNS records
- **Account:Cloudflare Pages:Edit** - Manage Pages projects
- **Account:Access: Applications and Policies:Edit** - Manage Cloudflare Access (for staging protection)

## Environment Separation

| Environment | Doppler Config | Purpose |
|-------------|----------------|---------|
| `dev` | `dev` | Development environment for local testing |
| `stg` | `stg` | Staging environment for pre-production testing |
| `prd` | `prd` | Production environment for live deployment |
