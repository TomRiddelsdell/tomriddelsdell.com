# Doppler Infrastructure Setup Documentation

**Date Created**: September 19, 2025  
**Project**: tomriddelsdell.com - Portfolio Platform  
**Infrastructure Project**: `tomriddelsdell-infra`

## 📋 Overview

This document describes the Doppler secret management setup for the portfolio platform's infrastructure and development environment. The `tomriddelsdell-infra` project manages all CLI tools, development tooling, and infrastructure secrets.

## 🏗️ Project Structure

### **Infrastructure Project: `tomriddelsdell-infra`**

**Purpose**: Infrastructure, development tooling, and DevOps secrets

**Environments**:

- `dev` (Development)
- `stg` (Staging)  
- `prd` (Production)

**Location**: `/workspaces/.devcontainer/`

## 🔐 Secret Configuration

### **Development Environment Secrets**

> ⚠️ **SECURITY WARNING**: Never include actual credentials in documentation. All values below are examples.

```bash
# CLI Authentication Secrets  
AWS_ACCESS_KEY_ID=AKIA******************  # Example format only
AWS_SECRET_ACCESS_KEY=************************/******** # Example format only
AWS_DEFAULT_REGION=eu-west-2

CLOUDFLARE_API_TOKEN=********************************  # Example format only
CLOUDFLARE_API_KEY=********************************   # Example format only

NEON_API_KEY=napi_**********************************  # Example format only

GITHUB_TOKEN=ghp_************************************  # Example format only

CONFLUENT_CLOUD_API_KEY=****************  # Example format only
CONFLUENT_CLOUD_API_SECRET=************************************  # Example format only

# Environment Configuration
ENVIRONMENT=development
```

## 🛠️ Dev Container Integration

### **Automatic Secret Injection**

The dev container automatically injects secrets on startup via:

1. **Setup Script**: `/workspaces/.devcontainer/setup.sh`
2. **Injection Script**: `/workspaces/.devcontainer/inject-doppler-env.sh`
3. **Bashrc Integration**: Automatic loading in new shell sessions

### **Secret Injection Pipeline**

```bash
# 1. Container startup triggers setup.sh
# 2. setup.sh configures ~/.bashrc with Doppler injection
# 3. New shells automatically load secrets via:
eval "$(doppler run --project tomriddelsdell-infra --config dev --command env | grep -E '^(CONFLUENT_CLOUD_|CLOUDFLARE_|NEON_|AWS_|GITHUB_TOKEN)' | sed 's/^/export /')"

# 4. Manual injection available via:
source /workspaces/.devcontainer/inject-doppler-env.sh
```

## 📁 Directory Configuration

### **Dev Container Setup**

```bash
cd /workspaces/.devcontainer
doppler setup --project tomriddelsdell-infra --config dev

# Verify setup
doppler secrets
```

### **CLI Tool Authentication Status**

After secret injection, all CLI tools have access to their credentials:

- ✅ **AWS CLI**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`
- ✅ **Cloudflare Wrangler**: `CLOUDFLARE_API_TOKEN`
- ✅ **Neon CLI**: `NEON_API_KEY`
- ✅ **GitHub CLI**: `GITHUB_TOKEN`
- ✅ **Confluent CLI**: `CONFLUENT_CLOUD_API_KEY`, `CONFLUENT_CLOUD_API_SECRET`

## 🔄 Two-Tier Architecture

### **Host-Level Variables** (from `~/.bashrc` or host environment)

```bash
export DEV_EMAIL="tom@tomriddelsdell.com"
export DEV_USER_NAME="TomRiddelsdell"  
export DOPPLER_TOKEN="dp.pt.***"  # Personal token with write access (example format)
```

### **Doppler-Managed Secrets** (from `tomriddelsdell-infra`)

- All CLI tool API keys and tokens
- AWS credentials and configuration
- Third-party service credentials
- Environment-specific configuration

## 🚀 Usage Commands

### **Verify Setup**

```bash
# Check Doppler connection
doppler whoami

# Verify project configuration
doppler configs

# Test secret injection
source /workspaces/.devcontainer/inject-doppler-env.sh

# Count loaded secrets
env | grep -E "(CLOUDFLARE|NEON|AWS|GITHUB_TOKEN|CONFLUENT)" | wc -l
```

### **Manual Secret Management**

```bash
# Add new secret
doppler secrets set NEW_SECRET="value" --project tomriddelsdell-infra --config dev

# Update existing secret
doppler secrets set GITHUB_TOKEN="ghp_****" --project tomriddelsdell-infra --config dev

# View all secrets
doppler secrets --project tomriddelsdell-infra --config dev
```

## 🔧 Troubleshooting

### **Common Issues**

#### 1. No secrets loaded after container rebuild

```bash
# Solution: Verify DOPPLER_TOKEN is set in host environment
echo $DOPPLER_TOKEN

# Rebuild container with correct token
```

**2. CLI tools not authenticated**

```bash
# Solution: Manual secret injection
source /workspaces/.devcontainer/inject-doppler-env.sh

# Verify specific tool
aws sts get-caller-identity
neonctl projects list
gh auth status
```

**3. Permission denied errors**

```bash
# Solution: Ensure using personal token with write access
doppler me
# Should show "personal" token type
```

## 🏛️ Architecture Alignment

### **DDD Bounded Context**: Infrastructure

The `tomriddelsdell-infra` project represents the **Infrastructure bounded context**, containing:

- **Development tooling** secrets and configuration
- **CI/CD pipeline** credentials and settings
- **Cloud provider** API keys and access credentials
- **Third-party service** integrations and tokens

### **Separation of Concerns**

- **Infrastructure Project**: CLI tools, DevOps, and development environment
- **Platform Project** (future): Runtime application secrets and configuration
- **App Projects** (future): Application-specific secrets and settings

## 📊 Current Status

- ✅ **Infrastructure Project Created**: `tomriddelsdell-infra`
- ✅ **All Environments Setup**: `dev`, `stg`, `prd`
- ✅ **Secrets Migrated**: From `tomriddelsdell-dev` to `tomriddelsdell-infra`
- ✅ **Dev Container Configured**: Automatic secret injection working
- ✅ **CLI Tools Ready**: All 5 CLI tools have access to credentials
- ✅ **Two-Tier Architecture**: Host variables + Doppler secrets integrated

## 🎯 Next Steps

1. **Test Infrastructure Deployment**: Verify Terraform can access all required secrets
2. **Create Platform Projects**: Set up additional projects for runtime applications
3. **Environment Parity**: Ensure staging and production environments have proper secrets
4. **Service Token Migration**: Create read-only service tokens for production use

---

*This setup enables secure, scalable secret management for the entire portfolio platform infrastructure while maintaining DDD architectural principles.*
