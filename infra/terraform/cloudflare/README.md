# Cloudflare Infrastructure

This directory contains Terraform configuration for managing Cloudflare infrastructure, specifically DNS records and Pages deployment configuration.

## Overview

The infrastructure manages:

- DNS records for custom domain routing to Cloudflare Pages
- Zone configuration for the primary domain
- Environment-specific subdomain routing (staging/production)
- **Cloudflare Access**: Staging environment protection with GitHub OAuth authentication

## Quick Links

- **[Cloudflare Access Setup Guide](./ACCESS_SETUP.md)** - ⭐ Configure staging environment protection
- **[Secrets Documentation](./SECRETS.md)** - Required Doppler secrets
- **[Deployment Script](./deploy.sh)** - Automated deployment with Doppler

## Current State

### Manual Components (Not in Terraform)

The following components were created manually and are **not** managed by this Terraform configuration:

1. **Cloudflare Pages Project**: `landing-page` project created via `wrangler` CLI
2. **Environment Variables**: Set via Cloudflare API calls
3. **Build Configuration**: Managed through `wrangler.toml` and Pages dashboard

### Terraform-Managed Components

1. **DNS Records**:
   - `www.tomriddelsdell.com` → `landing-page-8t9.pages.dev`
   - `develop.tomriddelsdell.com` → `landing-page-8t9.pages.dev`
   - `tomriddelsdell.com` → `landing-page-8t9.pages.dev`

2. **Cloudflare Access** (Staging Protection):
   - Access Application for `staging.tomriddelsdell.com`
   - GitHub OAuth Identity Provider
   - Access Policies (Organization members, specific users, service tokens)
   - Service Token for CI/CD automation
   - Development Team access group

## Files

| File | Purpose |
|------|---------|
| `main.tf` | Primary Terraform configuration |
| `access.tf` | **NEW** Cloudflare Access configuration for staging protection |
| `access-variables.tf` | **NEW** Variables for GitHub OAuth and access policies |
| `main-simplified.tf` | Simplified version focusing on DNS records only |
| `terraform.tfvars.template` | Template for environment variables |
| `deploy.sh` | Deployment script with Doppler integration |
| `ACCESS_SETUP.md` | **NEW** Step-by-step guide for configuring Cloudflare Access |
| `SECRETS.md` | Documentation for required secrets |
| `README.md` | This file |

## Deployment

### Prerequisites

1. **Doppler CLI** installed and authenticated
2. **Terraform** installed
3. **Required secrets** configured in Doppler (see `SECRETS.md`)

### Quick Deployment

```bash
cd /workspaces/infra/terraform/cloudflare
./deploy.sh
```

### Manual Deployment

```bash
cd /workspaces/infra/terraform/cloudflare

# Initialize Terraform
doppler run --project tomriddelsdell-infra --config prd -- terraform init

# Plan changes
doppler run --project tomriddelsdell-infra --config prd -- terraform plan

# Apply changes
doppler run --project tomriddelsdell-infra --config prd -- terraform apply
```

## Security

- **No credentials** are stored in version control
- All secrets managed through **Doppler**
- Variables marked as `sensitive = true` where appropriate
- Deploy script validates Doppler authentication

## Integration with CI/CD

This Terraform configuration is designed to integrate with:

1. **Cloudflare Pages**: Automatic deployments from Git branches
2. **GitHub Actions**: Future CI/CD pipeline integration
3. **Doppler**: Centralized secrets management
4. **Wrangler CLI**: Local development and deployment

## Current Limitations

1. **Pages Project Management**: The Cloudflare Pages project itself is not managed by Terraform due to provider limitations
2. **Environment Variables**: Set via API calls rather than Terraform
3. **Build Configuration**: Managed through `wrangler.toml`

## Future Improvements

1. **Import Existing Resources**: Import the manually created Pages project into Terraform state
2. **Environment Variables**: Add support for managing Pages environment variables
3. **Build Configuration**: Explore options for managing build settings via Terraform
4. **State Management**: Add remote state backend (S3 + DynamoDB)

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure Doppler is authenticated and secrets are set
2. **Zone Not Found**: Verify the domain is properly configured in Cloudflare
3. **DNS Propagation**: Allow time for DNS changes to propagate globally

### Verification

After deployment, verify DNS records:

```bash
# Check DNS records
dig www.tomriddelsdell.com
dig develop.tomriddelsdell.com
dig tomriddelsdell.com

# Test staging deployment
curl -I https://develop.tomriddelsdell.com

# Test production deployment (when live)
curl -I https://www.tomriddelsdell.com
```
