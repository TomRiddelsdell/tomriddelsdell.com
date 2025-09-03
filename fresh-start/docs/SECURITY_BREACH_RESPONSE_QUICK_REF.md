# 🚨 Security Breach Response - Quick Reference

## Emergency Launch Commands

### Interactive Mode (Recommended)
```bash
./scripts/launch-security-breach-response.sh
```
**Use when:** You want to review each action before execution.

### Automated Mode (Emergency)
```bash
./scripts/launch-security-breach-response.sh --auto
```
**Use when:** Immediate automated response is needed without user prompts.

### Prerequisites Check
```bash
./scripts/launch-security-breach-response.sh --check
```
**Use when:** Verifying system readiness before an incident.

## What the Script Does

### 🔐 Credential Rotation
- **AWS Access Keys**: Creates new keys and deactivates old ones
- **Session Secrets**: Generates cryptographically secure session secrets
- **GitHub Secrets**: Updates all repository secrets with new values

### 🛡️ Security Cleanup
- **Environment Files**: Backs up and updates .env files
- **Local Cache**: Clears potentially compromised cached credentials
- **Audit Logging**: Creates detailed logs of all actions taken

### ✅ Verification
- **Service Health**: Checks all services are operational with new credentials
- **Connection Tests**: Verifies AWS, GitHub, and database connections
- **Rollback Capability**: Provides rollback instructions if issues occur

## Prerequisites

| Requirement | Check Command | Install/Fix |
|-------------|---------------|-------------|
| **tsx** | `tsx --version` | `npm install -g tsx` |
| **AWS CLI** | `aws --version` | [Install AWS CLI](https://aws.amazon.com/cli/) |
| **GitHub CLI** | `gh --version` | [Install GitHub CLI](https://cli.github.com/) |
| **AWS Credentials** | `aws sts get-caller-identity` | `aws configure` |
| **GitHub Token** | `gh auth status` | Set `GITHUB_TOKEN` env var |

## Emergency Contacts & Procedures

### If Script Fails Mid-Execution
1. **DO NOT PANIC** - The script creates backups
2. Check the audit logs in `/workspaces/logs/`
3. Use the rollback instructions provided in the logs
4. Contact the security team if manual intervention is needed

### Post-Incident Steps
1. **Review Audit Logs**: Check `/workspaces/logs/security-breach-response-*.log`
2. **Verify Services**: Run `npm test` to ensure all systems operational
3. **Update Local Environment**: Restart development environment
4. **Security Review**: Conduct post-incident analysis

## File Locations

| File | Purpose |
|------|---------|
| `./scripts/launch-security-breach-response.sh` | Main launcher script |
| `./scripts/security-breach-response.ts` | Core security response logic |
| `/workspaces/logs/` | Audit logs and backups |
| `/workspaces/.env.backup.*` | Environment file backups |

## Security Considerations

⚠️ **WARNING**: This script performs irreversible security operations:
- Rotates production AWS credentials
- Updates live GitHub repository secrets
- Modifies active environment configurations

✅ **SAFE PRACTICES**:
- Always run `--check` first to verify prerequisites
- Use interactive mode unless in emergency
- Keep backups of critical configuration files
- Test in development environment when possible

## Integration with MCP Servers

The security breach response integrates with MCP servers for enhanced capabilities:
- **AWS MCP** (port 8001): For AWS credential rotation
- **GitHub MCP** (port 8004): For repository secret updates
- **Neon MCP** (port 8003): For database security verification

---

**📞 Emergency Hotline**: For critical security incidents requiring immediate human intervention
**📋 SOP Reference**: [Security Breach Response Procedures](../docs/SECURITY_BREACH_RESPONSE.md)
