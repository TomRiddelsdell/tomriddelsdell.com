# Cloudflare Access Setup Guide for Staging Environment

This guide walks you through setting up Cloudflare Access to protect `staging.tomriddelsdell.com` with GitHub OAuth authentication.

## Overview

**What this achieves**:
- ✅ Staging environment protected with GitHub OAuth
- ✅ Only authorized team members can access staging
- ✅ Professional authentication flow (login via GitHub)
- ✅ Service token for CI/CD automated testing
- ✅ Audit logs of who accessed staging and when
- ✅ Session management (24-hour sessions)

**Cost**: Cloudflare Zero Trust has a free tier (up to 50 users). Check current pricing at: https://www.cloudflare.com/plans/zero-trust-services/

---

## Prerequisites

- Cloudflare account with Zero Trust access
- GitHub organization or personal account
- Doppler for secret management
- Terraform for infrastructure deployment

---

## Step 1: Create GitHub OAuth Application

### 🔒 Security Best Practice: Organization-Owned OAuth App

**IMPORTANT**: To enforce organization membership, the OAuth app MUST be created under your GitHub organization, not your personal account.

**To create an organization-owned OAuth app**:
1. Go to: `https://github.com/organizations/TomRiddelsdell/settings/applications` 
2. Click **"OAuth Apps"** in the left sidebar
3. Click **"New OAuth App"**

### 1.1 Navigate to GitHub OAuth Apps

**For Organization (Recommended)**:
- Go to: https://github.com/organizations/TomRiddelsdell/settings/applications
- Click "OAuth Apps" → "New OAuth App"

**For Personal Account (Less Secure)**:
- Go to: https://github.com/settings/developers
- Click "OAuth Apps" → "New OAuth App"
- Note: This will NOT enforce organization membership!

### 1.2 Create New OAuth App

Click **"New OAuth App"** and fill in:

```
Application name: Cloudflare Access - Staging Environment
Homepage URL: https://staging.tomriddelsdell.com
Authorization callback URL: https://tomriddelsdell.cloudflareaccess.com/cdn-cgi/access/callback
```

**Security Configuration**:
- ✅ **Enable "Request user authorization (OAuth) during installation"**
- ✅ Set authorization callback URL correctly
- ✅ If organization-owned, only organization members will be able to authenticate

### 1.3 Save Credentials

After creating the app, you'll see:
- **Client ID**: `Ov23liAbC123...`
- **Client Secret**: Click "Generate a new client secret"

**Important**: Copy these immediately - you'll need them for Doppler!

---

## Step 2: Store Credentials in Doppler

### 2.1 Add GitHub OAuth Credentials to Staging Config

```bash
# Set GitHub OAuth Client ID
doppler secrets set GITHUB_OAUTH_CLIENT_ID \
  --project tomriddelsdell-infra \
  --config stg

# Set GitHub OAuth Client Secret
doppler secrets set GITHUB_OAUTH_CLIENT_SECRET \
  --project tomriddelsdell-infra \
  --config stg

# Set your GitHub organization name
doppler secrets set GITHUB_ORGANIZATION_NAME \
  --project tomriddelsdell-infra \
  --config stg \
  --value "TomRiddelsdell"
```

### 2.2 Verify Secrets

```bash
doppler secrets get \
  --project tomriddelsdell-infra \
  --config stg \
  | grep GITHUB_OAUTH
```

---

## Step 3: Update Terraform Configuration

### 3.1 Update variables.tf (if needed)

The variables are already defined in `access-variables.tf`. Verify they exist:

```bash
cat infra/terraform/cloudflare/access-variables.tf
```

### 3.2 Update terraform.tfvars (Optional)

If you want to allow specific GitHub users beyond org members:

```hcl
# infra/terraform/cloudflare/terraform.tfvars
staging_allowed_github_users = [
  "TomRiddelsdell",
  "colleague-username"
]

# Optional: Restrict by email domain
allowed_email_domains = [
  "tomriddelsdell.com"
]
```

---

## Step 4: Deploy Cloudflare Access

### 4.1 Initialize Terraform (if not already done)

```bash
cd infra/terraform/cloudflare
terraform init
```

### 4.2 Plan the Changes

```bash
# Use Doppler to inject secrets
doppler run --project tomriddelsdell-infra --config stg -- \
  terraform plan \
  -var="github_oauth_client_id=$GITHUB_OAUTH_CLIENT_ID" \
  -var="github_oauth_client_secret=$GITHUB_OAUTH_CLIENT_SECRET" \
  -var="github_organization_name=$GITHUB_ORGANIZATION_NAME"
```

**Review the plan**:
- Should create `cloudflare_access_application.staging`
- Should create `cloudflare_access_identity_provider.github`
- Should create 3 `cloudflare_access_policy` resources
- Should create `cloudflare_access_service_token.github_actions`

### 4.3 Apply the Configuration

```bash
doppler run --project tomriddelsdell-infra --config stg -- \
  terraform apply \
  -var="github_oauth_client_id=$GITHUB_OAUTH_CLIENT_ID" \
  -var="github_oauth_client_secret=$GITHUB_OAUTH_CLIENT_SECRET" \
  -var="github_organization_name=$GITHUB_ORGANIZATION_NAME"
```

Type `yes` when prompted.

### 4.4 Save Service Token for CI/CD

After successful apply, Terraform will output the service token:

```bash
# Extract service token credentials
terraform output -json | jq '.service_token_client_id.value'
terraform output -json | jq '.service_token_client_secret.value'

# Store in Doppler for GitHub Actions
doppler secrets set CF_ACCESS_CLIENT_ID \
  --project tomriddelsdell-infra \
  --config stg \
  --value "<service_token_client_id>"

doppler secrets set CF_ACCESS_CLIENT_SECRET \
  --project tomriddelsdell-infra \
  --config stg \
  --value "<service_token_client_secret>"
```

---

## Step 5: Test Authentication

### 5.1 Test in Browser

1. Open incognito window
2. Navigate to: https://staging.tomriddelsdell.com
3. You should be redirected to Cloudflare Access login page
4. Click "GitHub" to authenticate
5. Authorize the OAuth app
6. You should be redirected back to staging site

### 5.2 Test Service Token (for CI/CD)

```bash
# Test service token authentication
curl -H "CF-Access-Client-Id: <client_id>" \
     -H "CF-Access-Client-Secret: <client_secret>" \
     https://staging.tomriddelsdell.com

# Should return 200 OK with page content
```

### 5.3 Test Unauthorized Access

1. Open browser without GitHub session
2. Navigate to: https://staging.tomriddelsdell.com
3. Should be blocked with authentication required message

---

## Step 6: Update GitHub Actions for Service Token

Update `.github/workflows/deploy.yml` to use service token for automated deployments:

```yaml
- name: Health Check Staging
  env:
    CF_ACCESS_CLIENT_ID: ${{ secrets.CF_ACCESS_CLIENT_ID }}
    CF_ACCESS_CLIENT_SECRET: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}
  run: |
    # Health check with service token authentication
    curl -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
         -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
         --fail \
         https://staging.tomriddelsdell.com/api/health
```

Add secrets to GitHub repository:
1. Go to GitHub repository settings
2. Navigate to Secrets and variables > Actions
3. Add `CF_ACCESS_CLIENT_ID` (from Doppler)
4. Add `CF_ACCESS_CLIENT_SECRET` (from Doppler)

---

## Step 7: Configure Team Access

### 7.1 Cloudflare Zero Trust Dashboard

1. Log in to: https://one.dash.cloudflare.com
2. Navigate to: Access > Applications
3. Find "Staging Environment - tomriddelsdell.com"
4. Review policies and adjust as needed

### 7.2 Add/Remove Users

**Via Terraform** (Recommended):

```hcl
# infra/terraform/cloudflare/terraform.tfvars
staging_allowed_github_users = [
  "TomRiddelsdell",
  "new-developer",
  "contractor-username"
]
```

Then reapply:

```bash
doppler run --config stg -- terraform apply
```

**Via Dashboard** (Quick changes):
1. Go to Access > Applications > Staging Environment
2. Click on a policy
3. Add/remove GitHub usernames
4. Save changes

---

## Troubleshooting

### Issue: "Access Denied" for authorized user

**Cause**: User not in GitHub organization or allowed users list

**Solution**:
1. Verify user is member of GitHub organization
2. Or add user to `staging_allowed_github_users` in Terraform
3. Check Cloudflare logs: Access > Logs > Access requests

### Issue: Redirect loop during authentication

**Cause**: OAuth callback URL mismatch

**Solution**:
1. Check GitHub OAuth app callback URL matches: `https://<YOUR_TEAM>.cloudflareaccess.com/cdn-cgi/access/callback`
2. Verify team name in Cloudflare Zero Trust settings
3. Update OAuth app if needed

### Issue: CI/CD health checks failing with 403

**Cause**: Service token not configured correctly

**Solution**:
1. Verify service token stored in GitHub Secrets
2. Check headers are sent correctly in curl command
3. Verify service token policy is active in Cloudflare
4. Check token hasn't expired (1 year default)

### Issue: Session expires too quickly

**Cause**: Session duration set to 24 hours by default

**Solution**:
```hcl
# infra/terraform/cloudflare/access.tf
resource "cloudflare_access_application" "staging" {
  session_duration = "168h"  # Change to 7 days
  # ...
}
```

Reapply Terraform configuration.

---

## Verification Checklist

- [ ] GitHub OAuth app created with correct callback URL
- [ ] Credentials stored in Doppler (stg config)
- [ ] Terraform applied successfully
- [ ] Can access staging with GitHub login in browser
- [ ] Service token works for automated requests
- [ ] GitHub Actions can deploy and health check staging
- [ ] Unauthorized users are blocked
- [ ] Team members can access without issues
- [ ] Audit logs visible in Cloudflare dashboard

---

## Maintenance

### Rotating Service Token

Service tokens expire after 1 year. To rotate:

```bash
# In Terraform directory
doppler run --config stg -- terraform taint cloudflare_access_service_token.github_actions
doppler run --config stg -- terraform apply

# Update GitHub Secrets with new values
```

### Updating OAuth Credentials

If GitHub OAuth credentials change:

```bash
# Update in Doppler
doppler secrets set GITHUB_OAUTH_CLIENT_SECRET \
  --project tomriddelsdell-infra \
  --config stg

# Reapply Terraform
cd infra/terraform/cloudflare
doppler run --config stg -- terraform apply
```

### Monitoring Access

View access logs:
1. Cloudflare dashboard: https://one.dash.cloudflare.com
2. Navigate to: Logs > Access
3. Filter by application: "Staging Environment"
4. Review authentication attempts and access patterns

---

## Security Best Practices

1. **Enable MFA**: Require GitHub MFA for all team members
2. **Regular Reviews**: Audit access logs monthly
3. **Principle of Least Privilege**: Only grant access to users who need it
4. **Token Rotation**: Rotate service tokens before expiration
5. **Monitor Logs**: Set up alerts for suspicious access patterns
6. **Session Duration**: Use shortest practical session duration
7. **Revoke Access**: Remove users immediately when they leave team

---

## Related Documentation

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/applications/)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Environment Strategy](./environment-strategy.md)
- [ADR-017: Environment Management](../decisions/adr-017-environment-management.md)

---

## Support

If you encounter issues:

1. Check Cloudflare Access logs
2. Verify GitHub OAuth app configuration
3. Review Terraform state for misconfigurations
4. Check Doppler secrets are correctly set
5. Consult Cloudflare Zero Trust documentation

**Emergency Access**: If locked out, you can temporarily disable Access via Cloudflare dashboard or update policies to allow all users while troubleshooting.

---

**Last Updated**: October 6, 2025  
**Status**: Production-ready configuration
