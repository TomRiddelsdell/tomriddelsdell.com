# SSL Certificate Setup and Management

## Overview

This document explains how to set up and manage SSL certificates for the tomriddelsdell.com project's staging and production environments.

## Quick Start

### 1. Run the SSL Certificate Setup Script

```bash
# Setup certificates for both environments
./infrastructure/deployment/aws/scripts/setup-ssl-certificates.sh

# Or setup specific environments
./infrastructure/deployment/aws/scripts/setup-ssl-certificates.sh --staging
./infrastructure/deployment/aws/scripts/setup-ssl-certificates.sh --production

# Check current status
./infrastructure/deployment/aws/scripts/setup-ssl-certificates.sh --status
```

### 2. Add DNS Validation Records

After running the setup script, you'll see DNS validation records that need to be added to your DNS provider:

```
Type: CNAME
Name: _validation_hash.domain.com.
Value: _validation_value.acm-validations.aws.
```

### 3. Wait for Validation

Certificate validation typically takes 5-30 minutes after DNS records are added.

## Domain Configuration

- **Staging**: `dev.tomriddelsdell.com`
- **Production**: `tomriddelsdell.com`
- **AWS Region**: `us-east-1` (required for CloudFront)

## Certificate Status Tracking

| Environment | Domain | Certificate ARN | Status |
|-------------|--------|-----------------|--------|
| Staging | dev.tomriddelsdell.com | `arn:aws:acm:us-east-1:152903089773:certificate/acbb2325-2003-40e3-9f4a-9a747473b648` | PENDING_VALIDATION |
| Production | tomriddelsdell.com | TBD | TBD |

## DNS Validation Records

### Staging Certificate (dev.tomriddelsdell.com)

```
Type: CNAME
Name: _7f69721cd95b2e4a2f119db12fc8cdbc.dev.tomriddelsdell.com.
Value: _efc4bdab08215dbe66b3f78a8e624bfe.xlfgrmvvlj.acm-validations.aws.
```

**Action Required**: Add this CNAME record to your DNS provider for dev.tomriddelsdell.com

## GitHub Secrets

The following GitHub secrets are automatically updated by the setup script:

- `STAGING_CERTIFICATE_ARN` - ARN of the staging SSL certificate
- `PRODUCTION_CERTIFICATE_ARN` - ARN of the production SSL certificate

## Troubleshooting

### Certificate Status: FAILED

If a certificate shows status `FAILED`, run the setup script to request a new certificate:

```bash
./infrastructure/deployment/aws/scripts/setup-ssl-certificates.sh --staging
```

### Certificate Status: PENDING_VALIDATION

1. Verify DNS records are correctly added to your DNS provider
2. Wait up to 30 minutes for DNS propagation
3. Check status with: `./infrastructure/deployment/aws/scripts/setup-ssl-certificates.sh --status`

### Deployment Failures

If CloudFormation deployment fails due to certificate issues:

1. Check certificate status in AWS Console
2. Ensure certificate is in `us-east-1` region
3. Verify GitHub secrets are updated with correct ARNs
4. Re-run deployment after certificate validation

## Manual Certificate Management

### Request New Certificate

```bash
aws acm request-certificate \
  --domain-name "dev.tomriddelsdell.com" \
  --validation-method DNS \
  --region us-east-1 \
  --tags Key=Project,Value=tomriddelsdell-com Key=Environment,Value=staging
```

### Check Certificate Status

```bash
aws acm describe-certificate \
  --certificate-arn "arn:aws:acm:us-east-1:152903089773:certificate/CERT_ID" \
  --region us-east-1 \
  --query 'Certificate.Status' \
  --output text
```

### Update GitHub Secret

```bash
gh secret set STAGING_CERTIFICATE_ARN --body "arn:aws:acm:us-east-1:152903089773:certificate/CERT_ID"
```

## Integration with Setup Scripts

The SSL certificate setup is integrated into the main project setup scripts:

- `scripts/secure-github-setup.js` - References SSL setup in next steps
- `scripts/setup-github-cicd.ts` - Includes SSL setup in deployment preparation

## AWS Console Links

- [Certificate Manager (us-east-1)](https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1)
- [CloudFormation Stacks](https://eu-west-2.console.aws.amazon.com/cloudformation/home?region=eu-west-2)

## Related Documentation

- [AWS Certificate Manager Documentation](https://docs.aws.amazon.com/acm/)
- [DNS Validation for SSL Certificates](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)
- [CloudFront SSL Certificate Requirements](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)

## Notes

- Certificates for CloudFront must be created in `us-east-1` region
- DNS validation is preferred over email validation for automation
- Failed certificates should be replaced rather than retried
- Certificate validation can take up to 30 minutes but usually completes in 5-10 minutes
