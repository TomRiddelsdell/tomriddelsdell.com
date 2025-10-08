# Staging Environment Protection

## Overview

This document outlines strategies for protecting the staging environment (`staging.tomriddelsdell.com`) from public access while maintaining easy access for authorized developers and stakeholders.

## Protection Strategies Comparison

| Strategy | Security Level | Ease of Use | Cost | Best For |
|----------|----------------|-------------|------|----------|
| **Cloudflare Access** | ⭐⭐⭐⭐⭐ High | ⭐⭐⭐⭐ Good | $$ | Teams with existing Cloudflare Zero Trust |
| **Basic Authentication** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ Excellent | Free | Small teams, simple needs |
| **IP Allowlist** | ⭐⭐⭐⭐ High | ⭐⭐ Poor | Free | Office-based teams with static IPs |
| **Preview URLs Only** | ⭐⭐ Low | ⭐⭐⭐ Good | Free | Minimal protection needed |

## Recommended: Cloudflare Access (OAuth)

### What It Does

Cloudflare Access adds a login screen before your staging site. Users authenticate via:
- GitHub OAuth (recommended for dev teams)
- Google Workspace
- One-time PIN via email
- Other identity providers

### Benefits

- ✅ Enterprise-grade security
- ✅ No changes to application code
- ✅ Supports multiple identity providers
- ✅ Audit logs of who accessed staging
- ✅ Automatic session management
- ✅ Can be configured per-path (e.g., protect `/admin` only)

### Implementation

#### Step 1: Enable Cloudflare Access

Cloudflare Access is part of Cloudflare Zero Trust (formerly Cloudflare for Teams).

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Navigate to **Zero Trust** → **Access** → **Applications**
4. Click **Add an application**

#### Step 2: Configure Access Application

```yaml
Application Configuration:
  Type: Self-hosted
  Application name: Staging Environment
  Session duration: 24 hours
  Application domain: staging.tomriddelsdell.com
  
Authentication:
  Identity provider: GitHub
  Allowed users: Members of GitHub organization "TomRiddelsdell"
```

#### Step 3: Add Terraform Configuration

Update `/workspaces/infra/terraform/cloudflare/main.tf`:

```hcl
# Cloudflare Access Application for Staging
resource "cloudflare_access_application" "staging" {
  zone_id                   = data.cloudflare_zone.main.id
  name                      = "Staging Environment"
  domain                    = "staging.${var.domain_name}"
  type                      = "self_hosted"
  session_duration          = "24h"
  auto_redirect_to_identity = true
  
  tags = ["staging", "protected"]
}

# Access Policy: Allow GitHub Organization Members
resource "cloudflare_access_policy" "staging_github_org" {
  application_id = cloudflare_access_application.staging.id
  zone_id        = data.cloudflare_zone.main.id
  name           = "Allow GitHub Org Members"
  precedence     = 1
  decision       = "allow"

  include {
    github {
      name                 = var.github_owner
      identity_provider_id = var.github_identity_provider_id
    }
  }
}

# Variables for GitHub OAuth
variable "github_identity_provider_id" {
  type        = string
  description = "Cloudflare Access Identity Provider ID for GitHub OAuth"
  sensitive   = true
}
```

#### Step 4: Set Up GitHub as Identity Provider

1. In Cloudflare Zero Trust, go to **Settings** → **Authentication**
2. Click **Add new** → **GitHub**
3. Follow the OAuth setup wizard
4. Copy the Identity Provider ID
5. Add to Doppler: `CLOUDFLARE_GITHUB_IDP_ID`

#### Step 5: Deploy Configuration

```bash
cd infra/terraform/cloudflare
doppler run -- terraform plan
doppler run -- terraform apply
```

### What Users Experience

1. Visit `https://staging.tomriddelsdell.com`
2. Redirected to Cloudflare Access login page
3. Click "Sign in with GitHub"
4. Authorize Cloudflare Access (first time only)
5. Redirected back to staging site
6. Session lasts 24 hours (configurable)

## Alternative: Basic Authentication (Simple Approach)

If you want a simpler solution without Cloudflare Zero Trust costs, use HTTP Basic Authentication via Cloudflare Workers.

### Implementation

#### Step 1: Create Access Control Worker

Create `/workspaces/services/staging-access-control/src/index.ts`:

```typescript
/**
 * Staging Access Control Worker
 * Adds HTTP Basic Authentication to staging environment
 */

interface Env {
  STAGING_USERNAME: string
  STAGING_PASSWORD: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only protect staging subdomain
    const url = new URL(request.url)
    if (!url.hostname.includes('staging.')) {
      return fetch(request)
    }

    // Check Authorization header
    const authorization = request.headers.get('Authorization')
    
    if (!authorization) {
      return new Response('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Staging Environment", charset="UTF-8"',
        },
      })
    }

    // Verify credentials
    const [scheme, encoded] = authorization.split(' ')
    
    if (!encoded || scheme !== 'Basic') {
      return new Response('Invalid authentication', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Staging Environment", charset="UTF-8"',
        },
      })
    }

    const credentials = atob(encoded)
    const [username, password] = credentials.split(':')

    if (
      username === env.STAGING_USERNAME &&
      password === env.STAGING_PASSWORD
    ) {
      // Authentication successful, pass request through
      return fetch(request)
    }

    return new Response('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Staging Environment", charset="UTF-8"',
      },
    })
  },
}
```

#### Step 2: Deploy Worker

```bash
cd services/staging-access-control
wrangler deploy

# Bind to staging subdomain
wrangler publish --routes "staging.tomriddelsdell.com/*"
```

#### Step 3: Add Credentials to Doppler

```bash
# Add to Doppler stg config
doppler secrets set STAGING_USERNAME="your-username" --config stg
doppler secrets set STAGING_PASSWORD="your-secure-password" --config stg
```

### What Users Experience

1. Visit `https://staging.tomriddelsdell.com`
2. Browser shows login prompt
3. Enter username and password
4. Browser remembers credentials (can be saved)

**Credentials can be shared** via password manager or secure channel.

## Alternative: IP Allowlist

Restrict staging access to specific IP addresses (office, VPN, etc.).

### Terraform Configuration

```hcl
# Cloudflare Access Policy: IP Allowlist
resource "cloudflare_access_policy" "staging_ip_allowlist" {
  application_id = cloudflare_access_application.staging.id
  zone_id        = data.cloudflare_zone.main.id
  name           = "Allow Specific IPs"
  precedence     = 1
  decision       = "allow"

  include {
    ip = [
      "203.0.113.0/24",    # Office network
      "198.51.100.50/32",  # VPN gateway
      "192.0.2.10/32",     # Your home IP
    ]
  }
}
```

### When to Use

- Office-based team with static IP
- VPN-only access policy
- Very high security requirements
- No need for external stakeholder access

**Limitations**:
- Doesn't work well for remote teams
- Dynamic IPs (home internet) break access
- Mobile access requires VPN
- Can't easily share with clients/stakeholders

## Cloudflare Pages Preview URLs (Built-in)

Cloudflare Pages automatically generates unique URLs for each deployment:

```
Production (main):      landing-page-8t9.pages.dev
Staging (develop):      abc123def.landing-page-8t9.pages.dev
Feature (PR #42):       xyz789ghi.landing-page-8t9.pages.dev
```

### Security Through Obscurity

- Preview URLs are hard to guess (random strings)
- Not publicly linked or indexed
- Can only be accessed if you know the exact URL

### When to Use

- Early development (pre-launch)
- Low-stakes projects
- Minimal security requirements
- Quick testing without authentication overhead

**Note**: This provides **minimal security**. Anyone with the URL can access it.

## Recommended Setup for Different Team Sizes

### Solo Developer / Small Team (1-3 people)

**Recommendation**: Basic Authentication

```bash
# Simple, free, easy to set up
# Share credentials via password manager
```

### Small-Medium Team (4-10 people)

**Recommendation**: Cloudflare Access with GitHub OAuth

```bash
# Centralized access management
# No credential sharing needed
# Audit logs included
```

### Enterprise Team (10+ people)

**Recommendation**: Cloudflare Access with SSO + IP Allowlist

```bash
# Multiple authentication methods
# Office IP allowlist + VPN
# Full audit trail and compliance
```

## Implementation Checklist

### For Cloudflare Access (Recommended)

- [ ] Enable Cloudflare Zero Trust in dashboard
- [ ] Set up GitHub as identity provider
- [ ] Create Access Application for staging subdomain
- [ ] Add Access Policy (GitHub org members)
- [ ] Update Terraform configuration
- [ ] Deploy Terraform changes
- [ ] Test authentication flow
- [ ] Document credentials/access process for team
- [ ] Add to onboarding documentation

### For Basic Authentication

- [ ] Create staging-access-control Worker
- [ ] Generate strong username/password
- [ ] Add credentials to Doppler (stg config)
- [ ] Deploy Worker to staging route
- [ ] Test authentication
- [ ] Share credentials with team (securely)
- [ ] Document in onboarding guide

## Testing Protection

### Test Cloudflare Access

```bash
# Test without authentication (should redirect to login)
curl -I https://staging.tomriddelsdell.com

# Test with authenticated session
curl -H "Cookie: CF_Authorization=<token>" https://staging.tomriddelsdell.com
```

### Test Basic Authentication

```bash
# Test without auth (should return 401)
curl -I https://staging.tomriddelsdell.com

# Test with correct credentials
curl -u username:password https://staging.tomriddelsdell.com

# Test with wrong credentials (should return 401)
curl -u wrong:password https://staging.tomriddelsdell.com
```

## Troubleshooting

### "Access Denied" on Staging

1. **Check GitHub OAuth**: Ensure you're logged into correct GitHub account
2. **Verify Org Membership**: Confirm you're a member of the GitHub organization
3. **Session Expired**: Try clearing cookies and re-authenticating
4. **Policy Issues**: Check Cloudflare Access policy allows your account

### Basic Auth Not Working

1. **Worker Not Deployed**: Verify worker is bound to staging route
2. **Credentials Wrong**: Check Doppler secrets match what you're entering
3. **Browser Cache**: Clear browser cache and try again
4. **Route Conflict**: Ensure no other Workers are conflicting

### Can't Access from Mobile

1. **VPN Required**: If using IP allowlist, connect to VPN first
2. **Save Credentials**: Use password manager on mobile device
3. **Session Timeout**: Re-authenticate if session expired

## Security Best Practices

1. **Rotate Credentials**: Change basic auth passwords quarterly
2. **Use Strong Passwords**: Generate random passwords (20+ characters)
3. **Monitor Access Logs**: Regularly review who's accessing staging
4. **Limit Session Duration**: Keep sessions short (24 hours max)
5. **Audit Policies**: Quarterly review of Access policies
6. **Remove Old Users**: Remove access when team members leave
7. **Document Everything**: Keep access procedures up to date

## Related Documentation

- [Environment Strategy](./environment-strategy.md)
- [ADR-017: Environment Management](../decisions/adr-017-environment-management.md)
- [Cloudflare Access Setup](./cloudflare-access-setup.md)
- [Deployment Security](./deployment-security.md)

---

**Last Updated**: October 6, 2025  
**Status**: Active - Recommended approach: Cloudflare Access with GitHub OAuth
