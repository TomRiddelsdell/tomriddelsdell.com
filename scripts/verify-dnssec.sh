#!/bin/bash
# DNSSEC Verification Script for tomriddelsdell.com

set -e

DOMAIN="tomriddelsdell.com"
EXPECTED_KEY_TAG="2371"
EXPECTED_DIGEST="3308019B1C93BA3BBF7E8CE9E8F4D55376EE69497FCD4EDDC1F480A83B99A5DB"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     DNSSEC Verification for tomriddelsdell.com              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if dig is available
if ! command -v dig &> /dev/null; then
    echo "❌ 'dig' command not found. Installing dnsutils..."
    sudo apt-get update -qq && sudo apt-get install -y dnsutils
fi

echo "📋 Current DNS Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check nameservers
echo "🌐 Nameservers:"
dig +short NS "$DOMAIN" | while read -r ns; do
    echo "   ✓ $ns"
done
echo ""

# Check for DS record
echo "🔐 DS Record Status:"
DS_RECORD=$(dig +short DS "$DOMAIN" 2>/dev/null)
if [ -z "$DS_RECORD" ]; then
    echo "   ❌ No DS record found"
    echo "   ℹ️  DNSSEC is NOT configured at registrar"
    echo ""
    echo "   Expected DS Record:"
    echo "   Key Tag: $EXPECTED_KEY_TAG"
    echo "   Algorithm: 13 (ECDSAP256SHA256)"
    echo "   Digest Type: 2 (SHA-256)"
    echo "   Digest: $EXPECTED_DIGEST"
else
    echo "   ✓ DS record found:"
    echo "$DS_RECORD" | while read -r record; do
        echo "     $record"
    done
    
    # Verify key tag
    if echo "$DS_RECORD" | grep -q "$EXPECTED_KEY_TAG"; then
        echo "   ✓ Key Tag matches: $EXPECTED_KEY_TAG"
    else
        echo "   ⚠️  Key Tag mismatch!"
    fi
fi
echo ""

# Check DNSSEC validation
echo "🔍 DNSSEC Validation:"
if dig +dnssec "$DOMAIN" | grep -q "ad;"; then
    echo "   ✓ DNSSEC validation successful (AD flag set)"
else
    echo "   ⚠️  DNSSEC not validated yet"
    echo "   ℹ️  This is expected if DS record was just added (wait 24-48h)"
fi
echo ""

# Check DNSKEY records
echo "🔑 DNSKEY Records (from Cloudflare):"
DNSKEY_COUNT=$(dig +short DNSKEY "$DOMAIN" | wc -l)
if [ "$DNSKEY_COUNT" -eq 0 ]; then
    echo "   ❌ No DNSKEY records found"
    echo "   ℹ️  Verify DNSSEC is enabled in Cloudflare"
else
    echo "   ✓ Found $DNSKEY_COUNT DNSKEY record(s)"
    dig +short DNSKEY "$DOMAIN" | head -3 | while read -r key; do
        echo "     ${key:0:60}..."
    done
fi
echo ""

# Overall status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Overall Status:"
echo ""
if [ -n "$DS_RECORD" ] && [ "$DNSKEY_COUNT" -gt 0 ]; then
    echo "   ✅ DNSSEC appears to be configured correctly!"
    echo "   ℹ️  Full validation may take 24-48 hours to propagate"
elif [ "$DNSKEY_COUNT" -gt 0 ]; then
    echo "   ⚠️  DNSSEC partially configured:"
    echo "      - DNSKEY records present in DNS (Cloudflare)"
    echo "      - DS record missing at registrar (GoDaddy)"
    echo ""
    echo "   👉 Action Required: Add DS record at GoDaddy"
    echo "      See: /tmp/godaddy-dnssec-guide.md"
else
    echo "   ❌ DNSSEC not configured"
    echo "      - No DNSKEY records in DNS"
    echo "      - No DS record at registrar"
    echo ""
    echo "   👉 Ensure DNSSEC is enabled in Cloudflare first"
fi
echo ""

# Additional tools
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Additional Verification Tools:"
echo ""
echo "   • DNSViz: https://dnsviz.net/d/$DOMAIN/dnssec/"
echo "   • Verisign DNSSEC Debugger: https://dnssec-debugger.verisignlabs.com/"
echo "   • ICANN DNSSEC Check: https://dnssec-analyzer.verisignlabs.com/$DOMAIN"
echo ""

exit 0
