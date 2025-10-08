# Landing Page Deployment Runbook

**Last Updated:** October 8, 2025  
**Maintainers:** DevOps Team  
**On-Call:** [Contact Information]

## Quick Reference

### Production URLs

- **Production:** https://tomriddelsdell.com
- **Staging:** https://staging.tomriddelsdell.com
- **Dev:** https://dev.tomriddelsdell.com
- **Health Endpoint:** https://tomriddelsdell.com/api/health

### Key Resources

- **GitHub Repository:** https://github.com/TomRiddelsdell/tomriddelsdell.com
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **GitHub Actions:** https://github.com/TomRiddelsdell/tomriddelsdell.com/actions
- **Doppler Secrets:** https://dashboard.doppler.com

---

## Deployment Process

### Automatic Deployments

Deployments are triggered automatically via GitHub Actions:

- **Staging:** Triggered on push to `develop` branch
- **Production:** Triggered on push to `main` branch

### Manual Deployment

```bash
# Deploy to staging
cd apps/landing-page
make deploy ENV=staging

# Deploy to production
make deploy ENV=production

# Deploy with full verification
make deploy ENV=production && make verify-deployment-production
```

---

## Health Checks and Monitoring

### Quick Health Check

```bash
# Check production
curl https://tomriddelsdell.com/api/health

# Check staging
curl https://staging.tomriddelsdell.com/api/health

# Using Make targets
cd apps/landing-page
make health-check-production
make health-check-staging
```

### Comprehensive Health Check

```bash
cd apps/landing-page

# Run full health check suite
./scripts/health-check.sh https://tomriddelsdell.com

# Check all endpoints
make verify-deployment-production
```

### Performance Monitoring

```bash
cd apps/landing-page

# Measure performance metrics
./scripts/performance-check.sh https://tomriddelsdell.com

# Using Make
make performance-check-production
```

### Continuous Uptime Monitoring

```bash
cd apps/landing-page

# Start monitoring (checks every 5 minutes)
./scripts/uptime-monitor.sh https://tomriddelsdell.com 300

# View monitoring logs
tail -f /tmp/landing-page-uptime/uptime-$(date +%Y-%m-%d).log
```

---

## Common Issues and Solutions

### Issue 1: Deployment Failed

**Symptoms:**
- GitHub Actions workflow shows red X
- Build or deployment step failed

**Diagnosis:**
```bash
# Check latest workflow run
gh run list --workflow=deploy-landing-page.yml --limit 1

# View failed logs
gh run view <run-id> --log-failed
```

**Solutions:**

1. **Build Failure:**
   ```bash
   # Test build locally
   cd apps/landing-page
   pnpm install
   pnpm run build
   
   # Check for TypeScript errors
   pnpm run type-check
   
   # Check for linting issues
   pnpm run lint
   ```

2. **Deployment Failure:**
   ```bash
   # Verify Wrangler authentication
   wrangler whoami
   
   # Check Doppler secrets
   doppler secrets --project tomriddelsdell-infra --config prd
   
   # Verify Cloudflare project exists
   wrangler pages project list
   ```

3. **Permission Issues:**
   - Verify GitHub secrets are properly configured
   - Check Doppler service tokens haven't expired
   - Ensure Cloudflare API token has correct permissions

### Issue 2: Health Check Failed

**Symptoms:**
- Deployment succeeded but health check fails
- Site returns 4xx or 5xx errors

**Diagnosis:**
```bash
# Test health endpoint
curl -I https://tomriddelsdell.com/api/health

# Run comprehensive health check
cd apps/landing-page
./scripts/health-check.sh https://tomriddelsdell.com
```

**Solutions:**

1. **502/503 Errors (Site Down):**
   ```bash
   # Check Cloudflare status
   # Visit https://www.cloudflarestatus.com
   
   # Verify DNS resolution
   nslookup tomriddelsdell.com
   dig tomriddelsdell.com
   
   # Check if Cloudflare Pages is up
   curl -I https://landing-page-8t9.pages.dev
   ```

2. **404 Errors (Routes Not Found):**
   ```bash
   # Verify deployment completed
   wrangler pages deployment list --project-name=landing-page
   
   # Check if files were uploaded
   # Look for "✨ Success! Uploaded X files" in deployment logs
   ```

3. **Slow Response Times:**
   ```bash
   # Run performance check
   cd apps/landing-page
   ./scripts/performance-check.sh https://tomriddelsdell.com
   
   # Check Cloudflare Analytics for bottlenecks
   ```

### Issue 3: Cloudflare Access Redirect (302)

**Symptoms:**
- Health check receives HTTP 302 instead of 200
- Redirects to Cloudflare Access login

**This is Expected Behavior:**
- Staging environment has Cloudflare Access authentication enabled
- Health checks are configured to accept 302 as valid status
- Production should return 200 (publicly accessible)

**Verification:**
```bash
# Check staging (should return 302)
curl -s -o /dev/null -w "%{http_code}" https://staging.tomriddelsdell.com
# Expected: 302

# Check production (should return 200)
curl -s -o /dev/null -w "%{http_code}" https://tomriddelsdell.com
# Expected: 200
```

### Issue 4: Performance Degradation

**Symptoms:**
- Slow page load times
- High Time to First Byte (TTFB)
- Poor performance scores

**Diagnosis:**
```bash
# Run performance check
cd apps/landing-page
./scripts/performance-check.sh https://tomriddelsdell.com

# Check specific metrics
curl -w "@curl-format.txt" -o /dev/null -s https://tomriddelsdell.com
```

**Solutions:**

1. **Optimize Images:**
   ```bash
   # Use Next.js Image optimization
   # Ensure images are properly sized
   # Consider WebP format
   ```

2. **Enable Caching:**
   - Verify Cloudflare cache is enabled
   - Check cache headers in next.config.js
   - Review Cloudflare Page Rules

3. **Reduce Bundle Size:**
   ```bash
   # Analyze bundle size
   cd apps/landing-page
   pnpm run build
   # Check output for bundle sizes
   ```

### Issue 5: Contact Form Not Working

**Symptoms:**
- Contact form submissions fail
- No validation errors shown

**Note:** Contact form currently does not send emails (display only).

**Future Implementation:**
- Backend API endpoint needed
- Email service integration required (SendGrid, AWS SES, etc.)
- Form validation already in place

---

## Rollback Procedures

### Emergency Rollback (GitHub)

```bash
# 1. Identify last working commit
git log --oneline main -10

# 2. Revert to previous commit
git revert <commit-hash>
git push origin main

# 3. Monitor deployment
gh run watch --repo TomRiddelsdell/tomriddelsdell.com
```

### Quick Rollback (Cloudflare)

```bash
# 1. List recent deployments
wrangler pages deployment list --project-name=landing-page

# 2. Promote a previous deployment (via Cloudflare Dashboard)
# Go to: Workers & Pages > landing-page > Deployments
# Click "..." on a previous deployment > "Rollback to this deployment"
```

### Rollback Verification

```bash
# After rollback, verify health
cd apps/landing-page
make verify-deployment-production

# Check specific functionality
./scripts/health-check.sh https://tomriddelsdell.com
```

---

## Monitoring and Alerting

### GitHub Actions Notifications

Deployment status is automatically reported in:
- GitHub Actions workflow summary
- Commit status checks
- Pull request checks (if applicable)

### Manual Monitoring Commands

```bash
# Watch deployment in real-time
gh run watch

# Check deployment status
gh run list --workflow=deploy-landing-page.yml --limit 5

# View recent logs
gh run view --log
```

### Setting Up External Monitoring

**Recommended Tools:**
- **Uptime Robot:** https://uptimerobot.com
- **Pingdom:** https://www.pingdom.com
- **Better Uptime:** https://betteruptime.com
- **Cloudflare Analytics:** Built-in

**Monitoring Endpoints:**
```
Primary: https://tomriddelsdell.com/api/health
Backup: https://tomriddelsdell.com
```

**Recommended Check Interval:** 5 minutes

---

## Maintenance Windows

### Scheduled Maintenance

1. **Announce** maintenance window in advance
2. **Create** maintenance branch if needed
3. **Deploy** to staging first
4. **Verify** all functionality
5. **Deploy** to production during window
6. **Monitor** closely for 30 minutes post-deployment

### Zero-Downtime Deployments

Cloudflare Pages provides zero-downtime deployments automatically:
- New deployment builds in parallel
- Traffic switches atomically when ready
- Previous deployment remains accessible if rollback needed

---

## Escalation Procedures

### Level 1: Self-Service

- Check this runbook
- Review GitHub Actions logs
- Run health checks
- Check Cloudflare status page

### Level 2: Team Escalation

- Post in team Slack channel
- Tag @devops-team
- Include: error message, deployment URL, what you've tried

### Level 3: Emergency Contact

- **Critical Production Issue:** Page on-call engineer
- **Security Issue:** Contact security team immediately
- **Complete Outage:** Escalate to infrastructure team

---

## Post-Incident Checklist

After resolving any deployment issue:

- [ ] Document what happened
- [ ] Update this runbook if needed
- [ ] Create GitHub issue for prevention
- [ ] Update monitoring if gaps identified
- [ ] Share learnings with team
- [ ] Update on-call documentation

---

## Useful Commands Reference

### Deployment

```bash
make deploy ENV=production              # Deploy to production
make deploy ENV=staging                 # Deploy to staging
make verify-deployment-production       # Verify production deployment
```

### Health Checks

```bash
make health-check-production           # Check production health
make health-check-staging              # Check staging health
make performance-check-production      # Check production performance
```

### Monitoring

```bash
make uptime-monitor                    # Start continuous monitoring
gh run watch                           # Watch GitHub Actions
wrangler pages deployment list         # List Cloudflare deployments
```

### Debugging

```bash
make status                           # Show current configuration
doppler secrets                       # Show environment secrets
wrangler pages project list           # List Cloudflare projects
gh run view --log-failed             # View failed workflow logs
```

---

## Additional Resources

- **Architecture Docs:** `/docs/architecture.md`
- **ADR-015:** Deployment Strategy
- **ADR-017:** Environment Management
- **ADR-021:** Testing Strategy
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler

---

**Document Version:** 1.0  
**Last Reviewed:** October 8, 2025  
**Next Review:** December 8, 2025
