# DNSSEC Configuration for tomriddelsdell.com

**Date**: October 6, 2025  
**Status**: ⚠️ Pending Configuration at Registrar  
**Current Registrar**: GoDaddy

---

## Current Situation

✅ **Cloudflare DNSSEC**: Enabled and working  
❌ **Registrar DS Record**: Not configured  
🌐 **Nameservers**: Cloudflare (ben.ns.cloudflare.com, teagan.ns.cloudflare.com)

## Required DS Record

Add this DS record at your domain registrar (GoDaddy):

```
Domain:        tomriddelsdell.com
Key Tag:       2371
Algorithm:     13 (ECDSAP256SHA256)
Digest Type:   2 (SHA-256)
Digest:        3308019B1C93BA3BBF7E8CE9E8F4D55376EE69497FCD4EDDC1F480A83B99A5DB
```

---

## Option 1: Configure at GoDaddy (Immediate)

### Step 1: Access GoDaddy Domain Settings

**Primary Method:**
1. Go to https://dcc.godaddy.com/manage/
2. Sign in with your GoDaddy credentials
3. Find "tomriddelsdell.com" in your domain list
4. Click on the domain name
5. Scroll to "Additional Settings" section
6. Click "Manage" next to "DNSSEC"

**Alternative Methods:**
- Direct link: https://dcc.godaddy.com/control/portfolio/dnssec
- Or: "My Products" → "Domains" → Click domain → "DNS" tab → "DNSSEC" section

### Step 2: Add DS Record

Click "Add DS Record" or "Setup" and enter:

| Field | Value |
|-------|-------|
| **Key Tag** | `2371` |
| **Algorithm** | `13` (or select "ECDSAP256SHA256") |
| **Digest Type** | `2` (or select "SHA-256") |
| **Digest** | `3308019B1C93BA3BBF7E8CE9E8F4D55376EE69497FCD4EDDC1F480A83B99A5DB` |

**Important Notes:**
- Enter digest **without spaces**
- Case doesn't matter (hexadecimal)
- Some interfaces may show algorithm names instead of numbers

### Step 3: Save and Verify

1. Click "Save" or "Add"
2. Wait 24-48 hours for DNS propagation
3. Run verification script: `/workspaces/scripts/verify-dnssec.sh`

### Troubleshooting GoDaddy

**If you can't find your domain:**
- Check if you're logged into the correct GoDaddy account
- Verify domain ownership at https://account.godaddy.com/products
- Check if domain is in a reseller account
- Contact GoDaddy support to locate domain

**If DNSSEC settings are not available:**
- Some GoDaddy accounts may need to enable advanced DNS features
- Contact GoDaddy support and provide them with the DS record values
- They can add it for you directly

**GoDaddy Support:**
- Chat: https://www.godaddy.com/help
- Phone: Check support page for your region
- Have domain name and DS record values ready

---

## Option 2: Transfer to Route53 Domains (Recommended)

### Benefits

✅ **Unified Management**: Domain + DNS in one AWS account  
✅ **CLI Automation**: Manage everything via AWS CLI/Terraform  
✅ **Better Integration**: Works seamlessly with your infrastructure  
✅ **Cost-Effective**: ~$12-13/year for .com domains  
✅ **Auto-Renewal**: Never worry about domain expiration

### Prerequisites at GoDaddy

Before initiating transfer, complete these steps at GoDaddy:

#### 1. Unlock Domain
- Go to domain settings in GoDaddy
- Find "Domain Lock" or "Transfer Lock"
- Set to **OFF** or **Unlocked**

#### 2. Get Authorization Code (EPP Code)
- In domain settings, request "Authorization Code"
- Also called "EPP Code" or "Transfer Code"
- GoDaddy will email this to your registered email address
- Save this code securely - you'll need it for the transfer

#### 3. Verify Contact Email
- Ensure your domain contact email is accessible
- You'll receive transfer approval emails
- Check spam folder if you don't see emails

### Transfer via AWS CLI

#### Step 1: Create Contact Information File

```bash
cat > /tmp/domain-contact.json << 'EOF'
{
  "FirstName": "Tom",
  "LastName": "Riddelsdell",
  "ContactType": "PERSON",
  "AddressLine1": "Your Street Address",
  "City": "Your City",
  "State": "Your State/Province",
  "CountryCode": "GB",
  "ZipCode": "Your Postcode",
  "PhoneNumber": "+44.XXXXXXXXXX",
  "Email": "your-email@example.com"
}
EOF
```

**Notes:**
- Replace with your actual contact information
- `CountryCode`: Use ISO 3166-1 alpha-2 code (GB for UK, US for United States, etc.)
- `PhoneNumber`: Format as `+CountryCode.Number` (e.g., `+44.2071234567`)
- All three contacts (admin, registrant, tech) can be the same

#### Step 2: Initiate Domain Transfer

```bash
# Initiate transfer to Route53
aws route53domains transfer-domain \
  --region us-east-1 \
  --domain-name tomriddelsdell.com \
  --duration-in-years 1 \
  --auth-code "YOUR-EPP-CODE-FROM-GODADDY" \
  --admin-contact file:///tmp/domain-contact.json \
  --registrant-contact file:///tmp/domain-contact.json \
  --tech-contact file:///tmp/domain-contact.json \
  --privacy-protect-admin-contact \
  --privacy-protect-registrant-contact \
  --privacy-protect-tech-contact

# Save the operation ID from output
```

**Cost:**
- Transfer includes 1 year renewal: ~$12-13
- Charged to your AWS account
- Annual renewal at same price

#### Step 3: Monitor Transfer Progress

```bash
# Check specific transfer status
aws route53domains get-operation-detail \
  --region us-east-1 \
  --operation-id <operation-id-from-transfer>

# List all recent domain operations
aws route53domains list-operations \
  --region us-east-1 \
  --submitted-since 2025-10-01

# Check current domain status
aws route53domains get-domain-detail \
  --region us-east-1 \
  --domain-name tomriddelsdell.com
```

#### Step 4: Approve Transfer

1. **Check Email**: You'll receive emails from:
   - GoDaddy (transfer authorization request)
   - AWS (transfer confirmation)

2. **Approve at GoDaddy**: 
   - Click link in GoDaddy email
   - Or manually approve in GoDaddy domain settings
   - Without approval, transfer takes 5-7 days (auto-approve)

3. **Approve at AWS**:
   - Check email for AWS approval link
   - Or approve via CLI if needed

### Transfer Timeline

| Day | Activity |
|-----|----------|
| Day 0 | Initiate transfer via CLI |
| Day 0-1 | Receive authorization emails |
| Day 1-2 | Approve transfer (optional - speeds up process) |
| Day 5-7 | Transfer completes automatically if not approved |
| Day 7+ | Domain fully transferred to Route53 |

**Important:**
- Your website continues working during transfer
- DNS settings remain unchanged
- Cloudflare nameservers stay the same
- No downtime expected

### After Transfer: Configure DNSSEC

Once the domain is in Route53 Domains:

```bash
# Method 1: Auto-configure with Route53 DNSSEC (easier)
# Enable DNSSEC signing in Route53
aws route53 enable-hosted-zone-dnssec \
  --hosted-zone-id Z044746442ICO4N4YLJK \
  --region us-east-1

# Get DS records created by Route53
aws route53 get-dnssec \
  --hosted-zone-id Z044746442ICO4N4YLJK \
  --region us-east-1

# Route53 will automatically add DS records to the domain registration
```

**Or keep Cloudflare DNSSEC:**

```bash
# Add Cloudflare DS record to Route53 domain registration
aws route53domains associate-delegation-signer-to-domain \
  --region us-east-1 \
  --domain-name tomriddelsdell.com \
  --signing-attributes KeyTag=2371,Algorithm=13,DigestType=2,Digest=3308019B1C93BA3BBF7E8CE9E8F4D55376EE69497FCD4EDDC1F480A83B99A5DB
```

---

## Verification

### Using the Verification Script

```bash
# Run the verification script
/workspaces/scripts/verify-dnssec.sh
```

The script checks:
- ✅ Nameserver configuration
- ✅ DS record presence
- ✅ DNSKEY records
- ✅ DNSSEC validation status

### Manual Verification Commands

```bash
# Check DS record at parent zone
dig DS tomriddelsdell.com +short

# Check DNSKEY records (from Cloudflare)
dig DNSKEY tomriddelsdell.com +short

# Full DNSSEC validation check
dig tomriddelsdell.com +dnssec +multi

# Check for authenticated data (AD) flag
dig tomriddelsdell.com +dnssec | grep "flags:"
# Should show: flags: qr rd ra ad;
```

### Online DNSSEC Validators

- **DNSViz**: https://dnsviz.net/d/tomriddelsdell.com/dnssec/
- **Verisign Debugger**: https://dnssec-debugger.verisignlabs.com/
- **ICANN Analyzer**: https://dnssec-analyzer.verisignlabs.com/tomriddelsdell.com

### Expected Results

**Before DS Record Added:**
```
🌐 Nameservers: ✓ (Cloudflare)
🔐 DS Record: ❌ (Not found)
🔑 DNSKEY: ✓ (Present)
Status: Partially configured
```

**After DS Record Added (24-48h later):**
```
🌐 Nameservers: ✓ (Cloudflare)
🔐 DS Record: ✓ (Found)
🔑 DNSKEY: ✓ (Present)
🔍 Validation: ✓ (AD flag set)
Status: Fully configured
```

---

## Recommendation

**For your use case (personal portfolio + AWS infrastructure):**

### Recommended: Transfer to Route53 Domains

**Reasons:**
1. Already using Route53 for DNS hosting
2. Already using AWS infrastructure (Lambda, ECS, etc.)
3. Want CLI automation for everything
4. Better integration with Doppler + GitHub Actions
5. Eliminates need to manage separate registrar

**Timeline:**
- Transfer setup: 30 minutes
- Transfer completion: 5-7 days
- DNSSEC configuration: 5 minutes after transfer

### Alternative: Stay with GoDaddy

**Choose this if:**
- You want immediate DNSSEC (configure today)
- You're comfortable with GoDaddy interface
- You prefer keeping domain separate from infrastructure
- You don't need CLI automation for domains

**Timeline:**
- DNSSEC setup: 10 minutes
- Propagation: 24-48 hours

---

## Next Steps

### If Choosing GoDaddy:
1. ✅ Follow "Option 1: Configure at GoDaddy" above
2. ✅ Add DS record with provided values
3. ✅ Wait 24-48 hours for propagation
4. ✅ Run verification script

### If Choosing Route53 Transfer:
1. ✅ Unlock domain at GoDaddy
2. ✅ Get EPP/Authorization code from GoDaddy
3. ✅ Create contact JSON file
4. ✅ Run transfer command
5. ✅ Approve transfer emails
6. ✅ Configure DNSSEC after transfer completes

---

## Related Documentation

- **[Environment Management](../decisions/adr-017-environment-management.md)** - Doppler secrets integration
- **[Infrastructure and Deployment](../decisions/adr-014-infrastructure-and-deployment.md)** - AWS infrastructure setup
- **[Cloudflare Deployment](../infra/terraform/cloudflare/)** - Cloudflare configuration

---

**Last Updated**: October 6, 2025  
**Status**: Awaiting registrar configuration
