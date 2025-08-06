# DevContainer Security Guidelines

## 🔒 Security-First DevContainer Configuration

This document outlines the security practices implemented in our DevContainer setup to prevent credential exposure while maintaining functionality.

## ✅ What's Safe to Commit

### DevContainer Files (Included in Git)
- `devcontainer.json` - Uses `${localEnv:}` pattern for all secrets
- `docker-compose.yml` - Uses environment variable references
- `Dockerfile*` - Container build configurations
- `post-create.sh` - Setup scripts
- `mcp-config/` - MCP server configurations (non-sensitive)

### Security Features
1. **Environment Variable Pattern**: All sensitive data uses `${localEnv:VARIABLE}` pattern
2. **No Hardcoded Secrets**: Zero hardcoded credentials in any configuration file
3. **Template Files**: `.template` files provided for easy setup
4. **Validation Script**: Automated security checking before commits

## ❌ What's Excluded from Git

### Sensitive Files (Excluded via .gitignore)
```bash
# DevContainer sensitive files
.devcontainer/**/*.secure
.devcontainer/**/*credentials*
.devcontainer/**/*secret*
.devcontainer/**/*private*
.devcontainer/**/*.log
.devcontainer/**/runtime-*
.devcontainer/**/session-*
.devcontainer/**/.env*

# MCP Server security exclusions
.devcontainer/mcp-config/**/*key*
.devcontainer/mcp-config/**/*token*
.devcontainer/mcp-config/**/*endpoint*
.devcontainer/mcp-config/**/*.pem
.devcontainer/mcp-config/**/*.p12
.devcontainer/mcp-config/**/runtime-config.json
.devcontainer/mcp-config/**/active-sessions.json
```

## 🛡️ Security Validation

### Automated Checks
Run before every commit:
```bash
.devcontainer/validate-security.sh
```

### Manual Security Review Checklist
- [ ] No hardcoded passwords, tokens, or keys
- [ ] All credentials use `${localEnv:}` pattern
- [ ] No `.env` files in repository
- [ ] No AWS credentials files
- [ ] No private keys or certificates
- [ ] MCP configurations contain no sensitive endpoints

## 🚀 Setup for New Developers

### 1. Environment Variables Required
Create a `.env` file in the project root (not committed) with:
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=eu-west-2

# Database
DATABASE_URL=your_database_url
PGDATABASE=your_db_name
PGHOST=your_db_host
PGUSER=your_db_user
PGPASSWORD=your_db_password

# AWS Cognito
VITE_AWS_COGNITO_CLIENT_ID=your_client_id
VITE_AWS_COGNITO_REGION=eu-west-2
VITE_AWS_COGNITO_USER_POOL_ID=your_pool_id
AWS_COGNITO_HOSTED_UI_DOMAIN=your_domain
VITE_AWS_COGNITO_HOSTED_UI_DOMAIN=your_domain
AWS_COGNITO_CLIENT_SECRET=your_client_secret

# External Services
SENDGRID_API_KEY=your_sendgrid_key
SESSION_SECRET=your_session_secret
GITHUB_TOKEN=your_github_token
NEON_API_KEY=your_neon_key

# Google OAuth (if needed)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. DevContainer Startup
1. Clone repository
2. Create `.env` file with your credentials
3. Open in VS Code with Dev Containers extension
4. Container will automatically configure with your environment

## 🔧 Maintenance

### Regular Security Updates
1. Run security validation script weekly
2. Review `.gitignore` patterns monthly
3. Audit environment variables quarterly
4. Update MCP server configurations as needed

### Emergency Response
If credentials are accidentally committed:
1. Immediately rotate all affected credentials
2. Force push history rewrite to remove credentials
3. Notify team of credential rotation
4. Review and update security practices

## 📝 Best Practices

### Development
- Always test with `validate-security.sh` before commits
- Use meaningful environment variable names
- Document required environment variables
- Keep sensitive configurations in separate files

### Production
- Use different credentials for dev/staging/production
- Implement least-privilege IAM policies
- Monitor credential usage and rotation
- Regular security audits of DevContainer configurations

---

**Remember**: Security is everyone's responsibility. When in doubt, exclude it from Git.
