# Infrastructure as Code (Terraform)

This directory contains Terraform configurations for managing the entire infrastructure stack, including:

- **Doppler**: Service token management for CI/CD pipelines
- **GitHub**: Automated GitHub Actions secrets management
- **Cloudflare**: Pages deployments and Access policies
- **Neon**: PostgreSQL database provisioning
- **Kafka**: Event streaming infrastructure

## 🏗️ Architecture

```
infra/terraform/
├── main.tf              # Root module orchestrating all infrastructure
├── variables.tf         # Input variables
├── terraform.tfvars     # Variable values (gitignored, use .example)
├── doppler/            # Doppler service token management
├── github/             # GitHub secrets automation
├── cloudflare/         # Cloudflare Pages and Access
├── neon/               # PostgreSQL database
└── kafka/              # Event streaming
```

## 🚀 Quick Start

### Prerequisites

1. **Install Terraform** (v1.9+)
   ```bash
   brew install terraform  # macOS
   # or
   sudo apt install terraform  # Linux
   ```

2. **Install Doppler CLI**
   ```bash
   curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh
   doppler login
   ```

3. **Create Required Tokens**

   **Doppler Admin Token:**
   ```bash
   doppler configs tokens create terraform-admin \
     --project tomriddelsdell-infra \
     --config dev \
     --max-age 0
   ```

   **GitHub Personal Access Token:**
   - Go to https://github.com/settings/tokens/new
   - Select scopes: `repo`, `admin:org`, `write:packages`
   - Copy the token

### Setup

1. **Create terraform.tfvars**
   ```bash
   cd infra/terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit terraform.tfvars with your actual values**
   ```bash
   # Use your favorite editor
   code terraform.tfvars
   ```

3. **Initialize Terraform**
   ```bash
   terraform init
   ```

4. **Plan the infrastructure changes**
   ```bash
   terraform plan
   ```

5. **Apply the infrastructure**
   ```bash
   terraform apply
   ```

## 📦 Modules

### Doppler Module (`./doppler`)

Manages Doppler service tokens for GitHub Actions:
- `DOPPLER_TOKEN_CI` - CI environment (quality gates, tests)
- `DOPPLER_TOKEN_STG` - Staging environment (develop branch)
- `DOPPLER_TOKEN_PROD` - Production environment (main branch)

**Key Resources:**
- `doppler_service_token.github_actions_ci`
- `doppler_service_token.github_actions_stg`
- `doppler_service_token.github_actions_prd`

### GitHub Module (`./github`)

Automatically syncs Doppler service tokens to GitHub Actions secrets:
- Creates/updates GitHub Actions secrets
- Maintains consistency between Doppler and GitHub
- Enables fully automated CI/CD token rotation

**Key Resources:**
- `github_actions_secret.doppler_token_ci`
- `github_actions_secret.doppler_token_stg`
- `github_actions_secret.doppler_token_prd`

### Cloudflare Module (`./cloudflare`)

Manages Cloudflare Pages and Access policies:
- Pages projects for static site hosting
- DNS records for custom domains
- Access policies for authentication

### Neon Module (`./neon`)

Provisions PostgreSQL databases for event sourcing:
- Database branches (dev, staging, production)
- Connection pooling configuration
- Backup and recovery settings

### Kafka Module (`./kafka`)

Configures Confluent Kafka for event streaming:
- Topics for domain events
- Consumer groups
- Schema registry integration

## 🔐 Security Best Practices

1. **Never commit `terraform.tfvars`** - It's in `.gitignore`
2. **Use Doppler for secrets** - Store all sensitive values in Doppler
3. **Rotate tokens regularly** - Service tokens should be rotated periodically
4. **Principle of least privilege** - Grant minimal required permissions

## 🔄 Workflow

### Initial Setup (One-time)
```bash
# Create Doppler admin token
doppler configs tokens create terraform-admin \
  --project tomriddelsdell-infra \
  --config dev

# Apply Terraform
terraform init
terraform apply
```

### Regular Updates
```bash
# Check for infrastructure drift
terraform plan

# Apply any changes
terraform apply
```

### Token Rotation
```bash
# Terraform will automatically rotate tokens
terraform taint module.doppler.doppler_service_token.github_actions_stg
terraform apply
```

### Cleanup
```bash
# Destroy all infrastructure (DANGER!)
terraform destroy
```

## 📊 State Management

Currently using **local state** for simplicity. For team collaboration, consider:

1. **Remote state backend** (recommended)
   ```hcl
   backend "s3" {
     bucket = "terraform-state-tomriddelsdell"
     key    = "infra/terraform.tfstate"
     region = "us-east-1"
   }
   ```

2. **State locking** with DynamoDB
3. **State encryption** at rest

## 🐛 Troubleshooting

### Issue: "Error creating service token"
**Solution:** Check Doppler token has admin permissions
```bash
doppler configs tokens --project tomriddelsdell-infra
```

### Issue: "GitHub API rate limit exceeded"
**Solution:** Use a GitHub token with higher rate limits or wait for reset

### Issue: "Cloudflare API error"
**Solution:** Verify API token has required permissions (Pages, DNS, Access)

## 📚 Additional Resources

- [Terraform Doppler Provider](https://registry.terraform.io/providers/DopplerHQ/doppler/latest/docs)
- [Terraform GitHub Provider](https://registry.terraform.io/providers/integrations/github/latest/docs)
- [Terraform Cloudflare Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [Infrastructure ADRs](/docs/decisions/adr-014-infrastructure-and-deployment.md)

## 🎯 Benefits of IaC Approach

✅ **Version Control** - All infrastructure changes tracked in Git  
✅ **Reproducibility** - Spin up identical environments instantly  
✅ **Automation** - No manual token creation or secret management  
✅ **Auditability** - Clear history of who changed what and when  
✅ **Consistency** - Same configuration across all environments  
✅ **Documentation** - Code serves as living documentation

