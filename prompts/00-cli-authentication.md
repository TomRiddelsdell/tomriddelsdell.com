# Phase 0.1: CLI Tool Authentication (30 minutes)

## Context
This prompt establishes authentication for all CLI tools required for the platform deployment. This is a prerequisite for all subsequent infrastructure automation.

## Current State Assessment
- Development container with all CLI tools pre-installed
- Container environment requires token-based authentication instead of browser OAuth
- Need to authenticate with service providers using service tokens/API keys

## Authentication Steps

### 1. Doppler Secrets Management Authentication
Doppler manages all environment variables and secrets across environments.

**Container Environment Note**: `doppler login` uses browser OAuth which doesn't work in containers. We'll use the Doppler dashboard to create a service token instead.

#### Manual Setup Required:
1. **Go to Doppler Dashboard**: Visit https://dashboard.doppler.com/ in your browser
2. **Sign up/Login**: Create account or sign in
3. **Create Project**: Create a new project called `tomriddelsdell-platform`
4. **Create Dev Config**: Within the project, ensure you have a `dev` config
5. **Generate Service Token**: 
   - Go to Project → Config → Access tab
   - Click "Generate Service Token"
   - Name it `container-dev-token`
   - Copy the token (starts with `dp.st.dev.`)

#### Container Authentication:
```bash
# Set up Doppler with service token (replace with your actual token)
# The token will look like: dp.st.dev.xxxxxxxxxxxxxxxxxxxxxxx
export HISTIGNORE='export DOPPLER_TOKEN*'
export DOPPLER_TOKEN='PASTE_YOUR_SERVICE_TOKEN_HERE'

# Test authentication
doppler secrets --config dev --project tomriddelsdell-platform

# If the above works, persist the token for this directory
echo 'PASTE_YOUR_SERVICE_TOKEN_HERE' | doppler configure set token --scope /workspaces

# Verify setup
doppler whoami
```

**Expected Outcome**: Authenticated with Doppler using service token, ready to manage secrets

### 2. GitHub CLI Authentication
For repository management and CI/CD pipeline setup.

```bash
# Check if already authenticated
gh auth status

# If not authenticated, use token-based auth for containers
# Go to GitHub Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
# Create token with repo, workflow, and packages permissions
gh auth login --with-token < your-token-file

# Or use interactive mode (may work in some containers)
gh auth login

# Verify authentication
gh auth status
gh repo list --limit 5
```

**Expected Outcome**: Authenticated with GitHub CLI, can access repositories

### 3. Neon Database CLI Authentication
For PostgreSQL database management with branching.

#### Manual Setup Required:
1. **Go to Neon Console**: Visit https://console.neon.tech/
2. **Sign up/Login**: Create account or sign in with GitHub
3. **Get API Key**: Go to Account Settings → API Keys → Generate new API key
4. **Copy API Key**: Save for container authentication

```bash
# Set up Neon CLI with API key
export NEON_API_KEY='your-api-key-here'

# Verify authentication
neonctl me

# List projects (should be empty initially)
neonctl projects list

# Test database operations
neonctl --help
```

**Expected Outcome**: Authenticated with Neon, ready for database operations

### 4. Cloudflare Wrangler CLI Authentication
For Workers deployment and DNS management.

#### Manual Setup Required:
1. **Go to Cloudflare Dashboard**: Visit https://dash.cloudflare.com/
2. **Sign up/Login**: Create account or sign in
3. **Get API Token**: Go to My Profile → API Tokens → Create Token
4. **Use Custom Token Template**:
   - Zone:Zone:Read, Zone:Zone:Edit (for DNS)
   - Account:Cloudflare Workers:Edit (for Workers)
   - Zone Resources: Include All zones

```bash
# Authenticate with API token (more secure than global API key)
wrangler login

# If browser login doesn't work in container, use environment variable
export CLOUDFLARE_API_TOKEN='your-api-token-here'

# Verify authentication
wrangler whoami

# List zones (domains)
wrangler zone list
```

**Expected Outcome**: Authenticated with Cloudflare, can deploy Workers

### 5. Confluent Kafka CLI Authentication
For event streaming infrastructure management.

#### Manual Setup Required:
1. **Go to Confluent Cloud**: Visit https://confluent.cloud/
2. **Sign up/Login**: Create account (free tier available)
3. **Create API Key**: Go to Accounts & Access → API Keys → Add Key
4. **Select Scope**: Cloud resource management API key

```bash
# Set up Confluent CLI with API key
confluent login --save

# If interactive doesn't work, use environment variables
export CONFLUENT_CLOUD_API_KEY='your-api-key'
export CONFLUENT_CLOUD_API_SECRET='your-api-secret'

# Verify authentication
confluent environment list

# Check available clusters
confluent kafka cluster list
```

**Expected Outcome**: Authenticated with Confluent, ready for Kafka setup

## Verification Steps

### Test All CLI Tools
```bash
# Create verification script
cat > /tmp/verify-cli-auth.sh << 'EOF'
#!/bin/bash

echo "=== CLI Authentication Verification ==="
echo ""

echo "1. Doppler Authentication:"
if doppler whoami > /dev/null 2>&1; then
    echo "   ✅ Doppler: Authenticated"
    doppler whoami
else
    echo "   ❌ Doppler: Not authenticated"
fi
echo ""

echo "2. GitHub Authentication:"
if gh auth status > /dev/null 2>&1; then
    echo "   ✅ GitHub: Authenticated"
    gh api user --jq .login
else
    echo "   ❌ GitHub: Not authenticated"
fi
echo ""

echo "3. Neon Authentication:"
if neonctl me > /dev/null 2>&1; then
    echo "   ✅ Neon: Authenticated"
    neonctl me --output json | jq -r .email
else
    echo "   ❌ Neon: Not authenticated"
fi
echo ""

echo "4. Cloudflare Authentication:"
if wrangler whoami > /dev/null 2>&1; then
    echo "   ✅ Cloudflare: Authenticated"
    wrangler whoami
else
    echo "   ❌ Cloudflare: Not authenticated"
fi
echo ""

echo "5. Confluent Authentication:"
if confluent environment list > /dev/null 2>&1; then
    echo "   ✅ Confluent: Authenticated"
    confluent environment list | head -3
else
    echo "   ❌ Confluent: Not authenticated"
fi
echo ""

echo "=== Summary ==="
PASSED=0
TOTAL=5

doppler whoami > /dev/null 2>&1 && PASSED=$((PASSED+1))
gh auth status > /dev/null 2>&1 && PASSED=$((PASSED+1))
neonctl me > /dev/null 2>&1 && PASSED=$((PASSED+1))
wrangler whoami > /dev/null 2>&1 && PASSED=$((PASSED+1))
confluent environment list > /dev/null 2>&1 && PASSED=$((PASSED+1))

echo "Authentication Status: $PASSED/$TOTAL tools authenticated"

if [ $PASSED -eq $TOTAL ]; then
    echo "🎉 All CLI tools are authenticated! Ready for infrastructure deployment."
    exit 0
else
    echo "⚠️  Some CLI tools need authentication. Please complete setup above."
    exit 1
fi
EOF

chmod +x /tmp/verify-cli-auth.sh
/tmp/verify-cli-auth.sh
```

## Success Criteria
- [ ] Doppler CLI authenticated with service token
- [ ] GitHub CLI authenticated and can list repos
- [ ] Neon CLI authenticated and shows user info
- [ ] Cloudflare Wrangler authenticated and shows account
- [ ] Confluent CLI authenticated and can list environments
- [ ] All tools pass verification script

## Troubleshooting

### Doppler Issues
- **Hanging on login**: Use service token method (documented above)
- **Token not persisting**: Use `doppler configure set token --scope /workspaces`
- **Project not found**: Create project in dashboard first

### GitHub Issues
- **Permission denied**: Check token has correct permissions (repo, workflow, packages)
- **Two-factor required**: Use fine-grained personal access token

### Neon Issues
- **Invalid API key**: Regenerate key in Neon console
- **Connection timeout**: Check network connectivity

### Cloudflare Issues
- **Token insufficient permissions**: Ensure token has Zone:Edit and Workers:Edit
- **Zone not found**: Add domain to Cloudflare first

### Confluent Issues
- **Network timeout**: Check firewall settings
- **Invalid credentials**: Recreate API key/secret pair

## Next Steps
Once all CLI tools are authenticated, proceed to **Phase 0.2: Infrastructure Secrets Setup** where we'll configure environment variables and secrets management.

---
**Estimated Time**: 30 minutes  
**Dependencies**: Internet access, web browser for manual setup  
**Output**: All CLI tools authenticated and verified