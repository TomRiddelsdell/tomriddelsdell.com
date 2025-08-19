# 🔐 Security Breach Response System

Complete enterprise-grade security breach response automation for tomriddelsdell.com infrastructure.

## 📋 Overview

This system provides comprehensive automation for responding to security breaches, including:

- **Automated credential rotation** across AWS, GitHub, and third-party services
- **Session invalidation** and new secret generation
- **Database credential updates** with zero-downtime rotation
- **Security incident logging** and audit trail creation
- **MCP server integration** for enhanced automation capabilities
- **Verification and hardening** procedures

## 🔄 System Evolution

**July 31, 2025**: Major cleanup and consolidation completed
- ✅ Archived 3 outdated scripts (`mcp-credential-rotation.ts`, `rotate-credentials.sh`, `security-audit.ts`)
- ✅ Consolidated into 4 comprehensive scripts (1,800+ lines total)
- ✅ Enhanced from mock implementations to production-ready automation
- ✅ Expanded coverage from 5 to 26+ credential types
- ✅ Added enterprise-grade audit logging and validation

**Previous Limitations** (now resolved):
- ❌ Mock MCP calls → ✅ Real automation with retry logic
- ❌ Manual processes → ✅ Full automation with interactive/automated modes
- ❌ Basic console output → ✅ Comprehensive audit trails
- ❌ Limited credential coverage → ✅ 26+ credential types across all services
- ❌ No validation framework → ✅ Complete testing and validation suite

## 🏗️ System Architecture

```
Security Breach Response System
├── security-breach-response.ts     # Main breach response orchestrator (847 lines)
├── security-mcp-operations.ts      # Enhanced MCP client for automation (381 lines)
├── security-validation.ts          # Comprehensive security validation (400+ lines)
├── test-security-breach-response.ts # Safe testing without destructive operations (300+ lines)
└── archive/                         # Archived outdated scripts
    ├── mcp-credential-rotation.ts   # Superseded by security-breach-response.ts
    ├── rotate-credentials.sh        # Superseded by comprehensive TypeScript solution
    └── security-audit.ts            # Superseded by security-validation.ts
```

## 🚀 Quick Start

### 1. Test the System (Safe)

Before running any actual breach response, validate everything works:

```bash
# Run comprehensive security tests
npx tsx scripts/test-security-breach-response.ts

# Run security validation only
npx tsx scripts/security-validation.ts
```

### 2. Execute Breach Response (Production)

**⚠️ WARNING: This will rotate ALL credentials and may cause temporary service disruption**

```bash
# Interactive mode (recommended)
npx tsx scripts/security-breach-response.ts

# Automated mode (use only if fully configured)
npx tsx scripts/security-breach-response.ts --automated
```

## 📁 Script Details

### 🎯 security-breach-response.ts

**Primary breach response orchestrator with 7-phase workflow:**

#### Phase 1: Assessment & Preparation
- Environment validation
- Backup current credentials
- Initialize audit logging
- Generate new secrets with cryptographic entropy

#### Phase 2: AWS Credential Rotation
- Rotate IAM access keys
- Update application configurations
- Verify AWS service connectivity

#### Phase 3: Session & Application Secrets
- Generate new SESSION_SECRET
- Update JWT signing keys
- Invalidate active sessions

#### Phase 4: GitHub Repository Secrets
- Rotate GitHub Personal Access Tokens
- Update repository secrets
- Verify GitHub Actions functionality

#### Phase 5: Database Credentials
- Coordinate with database providers (Neon)
- Update connection strings
- Test database connectivity

#### Phase 6: Third-Party Services
- Rotate SendGrid API keys
- Update OAuth client secrets (Google, etc.)
- Update external service configurations

#### Phase 7: Verification & Hardening
- Verify all rotated credentials
- Update security policies
- Complete audit documentation

### 🤖 security-mcp-operations.ts

**Enhanced MCP client for sophisticated automation:**

- **Batch Operations**: Update multiple secrets simultaneously
- **Retry Logic**: Robust error handling with exponential backoff
- **Multi-Server Support**: GitHub (remote), AWS, Neptune MCP integration
- **Security Analytics**: Neptune graph database for incident tracking
- **Audit Logging**: Comprehensive operation tracking

### 🛡️ security-validation.ts

**Comprehensive security posture validation:**

- **AWS Credentials**: Validate access and permissions
- **GitHub Access**: Verify repository and secrets access
- **Environment Config**: Check all required variables
- **Database Connection**: Test connectivity and SSL
- **MCP Servers**: Validate server availability
- **Application Build**: Ensure system functionality
- **Security Measures**: Git history, audit logs, file permissions

### 🧪 test-security-breach-response.ts

**Safe testing framework without destructive operations:**

- **Environment Preparation**: Tool availability checks
- **Script Existence**: Validate all files present
- **Syntax Validation**: TypeScript compilation tests
- **Security Validation**: Run security checks
- **Dry Run**: Component existence validation

## 🔧 Configuration Requirements

### Centralized Configuration System

The security system now uses the enterprise-grade centralized configuration system instead of direct environment variable access. This provides:

- ✅ **Validation**: All configuration values are validated at startup
- ✅ **Type Safety**: TypeScript interfaces ensure correct usage
- ✅ **Error Handling**: Clear error messages for missing or invalid configuration
- ✅ **Environment-Specific**: Different settings for development/staging/production
- ✅ **Security**: Prevents hardcoded secrets and validates token formats

### Configuration Sources

#### Primary Configuration
Configuration is loaded from:
1. **Environment Variables** (`.env` file and system environment)
2. **Environment Defaults** (development/staging/production specific)
3. **Schema Validation** (Zod validation with clear error messages)

#### Critical Configuration Values
```typescript
// Accessed via centralized config system
config.integration.github.token     // GitHub Personal Access Token
config.integration.github.owner     // GitHub repository owner
config.integration.github.repo      // GitHub repository name
config.database.url                 // Database connection string
config.security.session.secret      // Session encryption secret
config.integration.mcp.awsEndpoint  // AWS MCP server endpoint
config.integration.mcp.neptuneEndpoint // Neptune MCP server endpoint
```

#### Environment Variables (Infrastructure Level)
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Session Security  
SESSION_SECRET="generated-64-character-random-string"

# AWS Credentials (infrastructure level)
AWS_ACCESS_KEY_ID="AKIAEXAMPLE"
AWS_SECRET_ACCESS_KEY="secret-key"
AWS_REGION="us-east-1"

# GitHub Integration
GITHUB_TOKEN="ghp_token"
GITHUB_OWNER="username"
GITHUB_REPO="repository"

# MCP Server Endpoints (optional - defaults provided)
AWS_MCP_ENDPOINT="http://aws-mcp:8001"
NEPTUNE_MCP_ENDPOINT="http://neptune-mcp:8002"
```

#### Configuration Validation
The system validates configuration at startup and provides clear error messages:

```bash
# Example validation output
✅ Configuration loaded successfully
✅ GitHub Owner: Set to: TomRiddelsdell  
✅ GitHub Repository: Set to: tomriddelsdell.com
⚠️ GitHub Token: Contains test/example value - may not be production-ready
✅ AWS MCP Endpoint: Configured: http://aws-mcp:8001
✅ Neptune MCP Endpoint: Configured: http://neptune-mcp:8002
```

### Tool Requirements

#### CLI Tools
- **AWS CLI**: `aws configure` must be properly set up
- **GitHub CLI**: `gh auth login` must be authenticated
- **Node.js**: Version 18+ with TypeScript support
- **Git**: For repository operations

#### MCP Servers
- **AWS MCP**: Port 8001 (containerized)
- **Neptune MCP**: Port 8002 (containerized)
- **GitHub MCP**: Official remote server (`https://api.githubcopilot.com/mcp/`)

## 📊 Usage Examples

### Scenario 1: Routine Security Validation

```bash
# Weekly security check
npx tsx scripts/security-validation.ts

# Save report for compliance
cat security-validation-report.json | jq '.summary'
```

### Scenario 2: Suspected Credential Compromise

```bash
# 1. Immediate validation
npx tsx scripts/security-validation.ts

# 2. Test breach response (safe)
npx tsx scripts/test-security-breach-response.ts

# 3. Execute breach response (if validated)
npx tsx scripts/security-breach-response.ts
```

### Scenario 3: Planned Credential Rotation

```bash
# 1. Pre-rotation validation
npx tsx scripts/security-validation.ts

# 2. Notify team of maintenance window
echo "Starting planned credential rotation at $(date)"

# 3. Execute rotation
npx tsx scripts/security-breach-response.ts --automated

# 4. Post-rotation validation
npx tsx scripts/security-validation.ts
```

## 🎛️ Command Line Options

### security-breach-response.ts
```bash
# Interactive mode (default)
npx tsx scripts/security-breach-response.ts

# Automated mode (no prompts)
npx tsx scripts/security-breach-response.ts --automated

# Specific phase only
npx tsx scripts/security-breach-response.ts --phase=aws

# Dry run mode
npx tsx scripts/security-breach-response.ts --dry-run
```

### security-validation.ts
```bash
# Full validation
npx tsx scripts/security-validation.ts

# Save JSON report
npx tsx scripts/security-validation.ts > validation-$(date +%Y%m%d).json
```

## 📈 Monitoring & Reporting

### Audit Logs
All operations are logged to:
- `/workspaces/security-audit.log` - Detailed operation log
- `/workspaces/security-validation-report.json` - Validation results
- `/workspaces/security-test-report.json` - Test results

### Report Structure
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "results": [...],
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 0,
    "warnings": 2
  }
}
```

## 🚨 Emergency Procedures

### Immediate Response (< 5 minutes)
1. **Isolate**: Revoke GitHub tokens immediately
2. **Assess**: Run security validation
3. **Rotate**: Execute automated breach response

### Critical Path Recovery
```bash
# Emergency AWS credential rotation
aws iam create-access-key --user-name production-user
aws iam delete-access-key --access-key-id OLD_KEY --user-name production-user

# Emergency GitHub token rotation
gh auth refresh -s admin:repo,read:org

# Emergency session invalidation
export SESSION_SECRET=$(openssl rand -hex 32)
```

## 🔍 Troubleshooting

### Common Issues

#### "AWS credentials not configured"
```bash
aws configure
# or
export AWS_ACCESS_KEY_ID="key"
export AWS_SECRET_ACCESS_KEY="secret"
```

#### "GitHub authentication failed"
```bash
gh auth login
# or
gh auth refresh
```

#### "Database connection failed"
```bash
# Test database URL format
echo $DATABASE_URL | grep -E "^postgres(ql)?://"

# Test SSL connection
psql "$DATABASE_URL" -c "SELECT version();"
```

#### "MCP servers not responding"
```bash
# Check container status
docker ps | grep mcp

# Restart MCP containers
docker-compose -f .devcontainer/docker-compose.yml restart
```

### Debugging Commands

```bash
# Test centralized configuration loading
npx tsx -e "
import { getConfig } from './infrastructure/configuration/node-config-service.js';
const config = getConfig();
console.log('GitHub Config:', {
  owner: config.integration.github.owner,
  repo: config.integration.github.repo,
  tokenLength: config.integration.github.token.length
});
"

# Verbose logging
DEBUG=true npx tsx scripts/security-breach-response.ts

# Test individual components
npx tsx -e "import { generateSecureSecret } from './scripts/security-breach-response'; console.log(generateSecureSecret(64))"

# Validate TypeScript compilation
npx tsc --noEmit scripts/*.ts

# Test configuration validation specifically
npx tsx scripts/security-validation.ts
```

## 🎯 Best Practices

### Pre-Breach Preparation
1. **Regular Testing**: Run test suite weekly
2. **Credential Inventory**: Maintain up-to-date credential list
3. **Team Training**: Ensure team knows emergency procedures
4. **Backup Plans**: Have manual procedures documented

### During Breach Response
1. **Document Everything**: All actions should be logged
2. **Communicate**: Keep stakeholders informed
3. **Verify Changes**: Test each phase before proceeding
4. **Time-box**: Set maximum response windows

### Post-Breach Analysis
1. **Review Logs**: Analyze all audit logs
2. **Update Procedures**: Improve based on lessons learned
3. **Security Assessment**: Comprehensive review of security posture
4. **Team Debrief**: Discuss what worked and what didn't

## 📚 Additional Resources

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [NIST Incident Response Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf)
- [OWASP Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

## 🗂️ Migration from Legacy Scripts

If you previously used archived scripts, here's the migration path:

### Legacy → Modern Equivalents

| Legacy Script | Modern Replacement | Benefits |
|---------------|-------------------|----------|
| `mcp-credential-rotation.ts` | `security-breach-response.ts` | Real automation, 26+ credentials, audit logging |
| `rotate-credentials.sh` | `security-breach-response.ts` | TypeScript-based, error handling, verification |
| `security-audit.ts` | `security-validation.ts` | Comprehensive checks, detailed reporting |

### Quick Migration Commands

```bash
# Instead of old credential rotation:
# ./scripts/rotate-credentials.sh  # OLD
npx tsx scripts/security-breach-response.ts  # NEW

# Instead of old MCP rotation:
# npx tsx scripts/mcp-credential-rotation.ts  # OLD
npx tsx scripts/security-breach-response.ts  # NEW

# Instead of basic audit:
# npx tsx scripts/security-audit.ts  # OLD
npx tsx scripts/security-validation.ts  # NEW
```

### Archived Scripts Location

Legacy scripts are preserved in `/workspaces/scripts/archive/` with detailed migration documentation.

## 📞 Support

For technical issues or questions:
1. Check the troubleshooting section above
2. Review audit logs for error details
3. Validate environment configuration
4. Test with dry-run mode first

Remember: **Security is a process, not a product.** Regular testing and validation of these procedures is essential for maintaining security posture.
