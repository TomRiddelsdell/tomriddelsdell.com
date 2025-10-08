# Doppler Infrastructure Setup

## Environment Configuration Status

### Project: `tomriddelsdell-infra`

**All environments configured with complete secret sets:** ✅

| Environment | Status                       | Secrets Count | Notes                          |
| ----------- | ---------------------------- | ------------- | ------------------------------ |
| `dev`       | ✅ Ready                     | 13 secrets    | Active development credentials |
| `stg`       | ⚠️ Requires Real Credentials | 13 secrets    | Placeholder values configured  |
| `prd`       | ⚠️ Requires Real Credentials | 13 secrets    | Placeholder values configured  |

## Required Secrets by Environment

### Development (`dev`)

- **Status**: ✅ Complete with real credentials
- **Usage**: Local development and testing
- **Credentials**: Shared development credentials (non-production)

### Staging (`stg`)

- **Status**: ⚠️ Configured with placeholders
- **Usage**: Pre-production testing and validation
- **Required Actions**:

  ```bash
  # Replace these placeholder values with staging-specific credentials:
  doppler secrets set --project tomriddelsdell-infra --config stg \
    AWS_ACCESS_KEY_ID="<staging-aws-access-key>" \
    AWS_SECRET_ACCESS_KEY="<staging-aws-secret-key>" \
    GITHUB_TOKEN="<staging-github-token>" \
    NEON_API_KEY="<staging-neon-api-key>" \
    CLOUDFLARE_API_TOKEN="<staging-cloudflare-token>" \
    CLOUDFLARE_API_KEY="<staging-cloudflare-api-key>" \
    CONFLUENT_CLOUD_API_KEY="<staging-confluent-api-key>" \
    CONFLUENT_CLOUD_API_SECRET="<staging-confluent-secret>"
  ```

### Production (`prd`)

- **Status**: ⚠️ Configured with placeholders
- **Usage**: Production deployments
- **Required Actions**:

  ```bash
  # Replace these placeholder values with production-specific credentials:
  doppler secrets set --project tomriddelsdell-infra --config prd \
    AWS_ACCESS_KEY_ID="<production-aws-access-key>" \
    AWS_SECRET_ACCESS_KEY="<production-aws-secret-key>" \
    GITHUB_TOKEN="<production-github-token>" \
    NEON_API_KEY="<production-neon-api-key>" \
    CLOUDFLARE_API_TOKEN="<production-cloudflare-token>" \
    CLOUDFLARE_API_KEY="<production-cloudflare-api-key>" \
    CONFLUENT_CLOUD_API_KEY="<production-confluent-api-key>" \
    CONFLUENT_CLOUD_API_SECRET="<production-confluent-secret>"
  ```

## Environment-Specific Configuration Guidelines

### AWS Credentials

- **Dev**: Shared development AWS account with limited permissions
- **Staging**: Dedicated staging AWS account/IAM user
- **Production**: Dedicated production AWS account/IAM user with minimal required permissions

### Database Configuration (Neon)

- **Dev**: Development database branch
- **Staging**: Staging database branch with production-like data structure
- **Production**: Production database with backups and monitoring

### Cloudflare Configuration

- **Dev**: Development zone/workers with `.dev` domain
- **Staging**: Staging zone/workers with `.staging` domain
- **Production**: Production zone/workers with primary domain

### GitHub Integration

- **Dev**: Personal or bot token with repo access
- **Staging**: Bot token with staging deployment permissions
- **Production**: Bot token with production deployment permissions

## Terraform Variable Requirements

### Environment-Specific Variables

Each terraform module should use these variable mappings:

```hcl
# Doppler Module
variable "doppler_token" {
  type      = string
  sensitive = true
  # Injected via: doppler run --config {env} -- terraform plan
}

# Neon Module
variable "neon_api_key" {
  type      = string
  sensitive = true
  # Injected as: NEON_API_KEY
}

# Cloudflare Module
variable "cloudflare_api_token" {
  type      = string
  sensitive = true
  # Injected as: CLOUDFLARE_API_TOKEN
}
```

### Deployment Commands by Environment

```bash
# Development deployment
doppler run --project tomriddelsdell-infra --config dev -- terraform apply

# Staging deployment
doppler run --project tomriddelsdell-infra --config stg -- terraform apply

# Production deployment
doppler run --project tomriddelsdell-infra --config prd -- terraform apply
```

## Security Validation

- ✅ Security scan passes for all environments
- ✅ No credential leaks detected in repository
- ✅ Proper environment separation configured
- ✅ Placeholder values prevent accidental production credential exposure

## Quick Verification Commands

```bash
# Verify environment completeness
doppler secrets --project tomriddelsdell-infra --config dev --only-names | wc -l    # Should show 13
doppler secrets --project tomriddelsdell-infra --config stg --only-names | wc -l    # Should show 13
doppler secrets --project tomriddelsdell-infra --config prd --only-names | wc -l    # Should show 13

# Test secret injection
doppler run --project tomriddelsdell-infra --config dev -- env | grep -E "(AWS|NEON|GITHUB)" | wc -l
doppler run --project tomriddelsdell-infra --config stg -- env | grep -E "(AWS|NEON|GITHUB)" | wc -l
doppler run --project tomriddelsdell-infra --config prd -- env | grep -E "(AWS|NEON|GITHUB)" | wc -l

# Security validation
/workspaces/.devcontainer/validate-security.sh
```

## Next Steps for Production Readiness

1. **Replace Placeholder Values**: Update staging/production with real credentials
2. **Test Terraform Plans**: Validate terraform modules work with each environment
3. **Infrastructure Deployment**: Deploy using Phase 0.3 terraform deployment process
4. **Monitoring Setup**: Configure alerting for credential rotation and access

**Status**: Infrastructure secrets framework complete. Ready for credential population and terraform deployment.
