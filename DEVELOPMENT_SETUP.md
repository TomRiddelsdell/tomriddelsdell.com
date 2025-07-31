# 🚀 Development Environment Setup

## Overview

This guide provides complete setup instructions for the tomriddelsdell.com development environment, including security configuration, GitHub integration, and MCP servers.

## ✅ Quick Status Check

Your environment is **production-ready** with:
- ✅ **11 GitHub secrets** securely configured
- ✅ **All CLI tools** installed and verified
- ✅ **MCP servers** integrated (AWS, Neptune, GitHub)
- ✅ **Enterprise security** practices implemented
- ✅ **Automated CI/CD** pipeline operational

## 🛠️ Development Environment Components

### **Core CLI Tools**
| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | v22.17.1 | JavaScript runtime |
| **GitHub CLI** | 2.32.1 | Repository management |
| **AWS CLI** | 2.27.63 | AWS service management |
| **TypeScript** | 5.8.3 | TypeScript compiler |
| **jq** | 1.7.1 | JSON processor |

### **MCP Server Architecture**
```
🏗️ Dev Container Services
├── 📱 Main App (port 3000)
├── 🔧 AWS MCP Server (port 8001)
├── 🌊 Neptune MCP Server (port 8002)
└── 🐙 GitHub MCP Server (port 8003)
```

## 🔐 Security Configuration

### **Environment Variables Setup**
All secrets are managed through environment variables loaded from `.env` file:

```bash
# Required environment variables (create .env file)
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
GITHUB_TOKEN=ghp_...
VITE_AWS_COGNITO_CLIENT_ID=...
# ... see .env.template for complete list
```

### **Security Measures Implemented**
- ✅ **No hardcoded secrets** in committed files
- ✅ **Enhanced .gitignore** prevents secret leaks
- ✅ **GitHub CLI authentication** via PAT
- ✅ **OIDC authentication** for AWS (no long-lived credentials)

## 🔗 GitHub Integration

### **Repository Secrets (11 configured)**
| Secret | Purpose |
|--------|---------|
| `AWS_STAGING_ROLE_ARN` | Staging deployment |
| `AWS_PRODUCTION_ROLE_ARN` | Production deployment |
| `STAGING_DOMAIN_NAME` | dev.tomriddelsdell.com |
| `PRODUCTION_DOMAIN_NAME` | tomriddelsdell.com |
| `STAGING_DATABASE_URL` | Staging DB connection |
| `PRODUCTION_DATABASE_URL` | Production DB connection |
| + 5 more for certificates and Cognito |

### **Deployment Environments**
| Environment | Branch | Approval |
|-------------|---------|----------|
| `staging` | `develop` | Automatic |
| `production` | `main` | Manual approval required |

### **Available Workflows**
- 🧪 **Test Workflow** - CI/CD pipeline testing
- 🚀 **Deploy to AWS** - Full deployment pipeline
- 💰 **Cost Monitoring** - AWS cost tracking
- 🔄 **Dependency Updates** - Automated updates

## 🐳 Container Services

### **Start MCP Servers**
```bash
# Start all MCP services
docker-compose -f .devcontainer/docker-compose.yml up -d

# Verify services
./scripts/verify-dev-environment.sh
```

### **Service Health Check**
```bash
# Check GitHub MCP server
curl http://localhost:8003/health

# Check AWS MCP server
curl http://localhost:8001/health

# Check Neptune MCP server
curl http://localhost:8002/health
```

## 📋 Development Workflow

### **Local Development**
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Database operations
npm run db:push
```

### **Deployment Testing**
```bash
# Test staging deployment
git checkout -b develop
git push origin develop

# Test production deployment
git checkout main
git merge develop
git push origin main
```

### **Environment Verification**
```bash
# Complete environment check
./scripts/verify-dev-environment.sh

# Quick authentication check
aws sts get-caller-identity && gh auth status
```

## 🛠️ Essential Scripts

### **Development Scripts**
| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/verify-dev-environment.sh` | Complete environment verification | `./scripts/verify-dev-environment.sh` |
| `scripts/pre-deploy.sh` | Pre-deployment validation | `./scripts/pre-deploy.sh` |
| `scripts/run-tests.sh` | Test execution with options | `./scripts/run-tests.sh [all\|watch\|ui]` |
| `.devcontainer/post-create.sh` | Dev container auto-setup | Runs automatically on container creation |

### **AWS Deployment Scripts**
| Script | Purpose | Usage |
|--------|---------|-------|
| `infrastructure/deployment/aws/scripts/deploy.sh` | AWS deployment orchestration | `./infrastructure/deployment/aws/scripts/deploy.sh --env staging` |
| `infrastructure/deployment/aws/scripts/aws-cost-calculator.sh` | Cost estimation tool | `./infrastructure/deployment/aws/scripts/aws-cost-calculator.sh` |

### **Script Details**

**🔍 verify-dev-environment.sh**
- **Purpose**: Comprehensive development environment validation
- **Features**: CLI tools verification, GitHub/AWS authentication, MCP server status
- **Usage**: Run after container setup or when troubleshooting environment issues
- **Output**: Color-coded status report with actionable recommendations

**⚡ pre-deploy.sh**
- **Purpose**: Pre-deployment validation and testing
- **Features**: Environment checks, test execution, build validation
- **Usage**: Run before any deployment to ensure code quality
- **Integration**: Used by GitHub Actions CI/CD pipeline

**🧪 run-tests.sh**
- **Purpose**: Flexible test execution with multiple modes
- **Options**: 
  - `all` (default): Run complete test suite
  - `watch`: Run tests in watch mode for development
  - `ui`: Run tests with visual UI interface
- **Integration**: Used by pre-deploy validation

**🚀 deploy.sh**
- **Purpose**: Complete AWS deployment orchestration
- **Features**: CloudFormation deployment, environment validation, rollback support
- **Options**: `--env staging|production`, `--dry-run`, `--skip-build`
- **Security**: Uses OIDC authentication, no long-lived credentials

**💰 aws-cost-calculator.sh**
- **Purpose**: Interactive AWS cost estimation
- **Features**: Usage pattern analysis, cost projections, optimization recommendations
- **Usage**: Run when planning deployment or reviewing costs
- **Output**: Detailed cost breakdown with recommendations

**🔧 post-create.sh** (Dev Container)
- **Purpose**: Automated development environment setup
- **Features**: CLI tool installation, environment verification, MCP server preparation
- **Execution**: Automatically runs after dev container creation
- **Integration**: Ensures consistent development environment across rebuilds

## 🔧 Troubleshooting

### **Common Issues**

**MCP Servers Not Running**
```bash
docker-compose -f .devcontainer/docker-compose.yml up -d
```

**Missing Environment Variables**
```bash
# Copy template and fill in values
cp .env.template .env
# Edit .env with your actual secrets
```

**GitHub Authentication Issues**
```bash
# Re-authenticate with GitHub CLI
gh auth login --with-token < ~/.github_token
```

**AWS CLI Issues**
```bash
# Check AWS credentials
aws sts get-caller-identity
# Re-configure if needed
aws configure
```

## 📊 Cost Monitoring

### **Expected Monthly Costs**
- **Staging Environment**: ~$5-9/month
- **Production Environment**: ~$10-25/month
- **Total**: ~$15-34/month (includes AWS free tier)

### **Cost Alerts**
- Daily monitoring with alerts if costs exceed $50/month
- Automatic resource optimization recommendations
- Budget tracking via CloudWatch

## 🎯 Next Steps

### **SSL Certificate Validation** (Required)
1. Go to [AWS Certificate Manager](https://console.aws.amazon.com/acm/home?region=us-east-1)
2. Add DNS records to validate certificates
3. Wait for validation (usually 5-10 minutes)

### **Monitor Your Deployment**
- [GitHub Actions](https://github.com/TomRiddelsdell/tomriddelsdell.com/actions)
- [Repository Environments](https://github.com/TomRiddelsdell/tomriddelsdell.com/settings/environments)
- [Repository Secrets](https://github.com/TomRiddelsdell/tomriddelsdell.com/settings/secrets/actions)

## 🎉 Success Metrics

Your development environment achieves:
- ✅ **Enterprise-grade security** with proper secret management
- ✅ **Automated CI/CD** with approval workflows
- ✅ **Cost control** with monitoring and alerts
- ✅ **Full observability** with health checks and logging
- ✅ **Professional tooling** with all CLI tools configured

**Your development workflow is production-ready!** 🚀
