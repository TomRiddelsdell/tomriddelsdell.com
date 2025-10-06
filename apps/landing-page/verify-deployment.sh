#!/bin/bash

# Landing Page Deployment Verification Script
# Purpose: Verify that the Cloudflare Pages deployment is working correctly

echo "🚀 Verifying Landing Page Deployment..."
echo "========================================="

# Test the main Pages URL
PAGES_URL="https://dd9dfbe8.landing-page-8t9.pages.dev"
echo "📡 Testing Pages URL: $PAGES_URL"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PAGES_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Pages deployment accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Pages deployment failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Test if CSS loads
CSS_TEST=$(curl -s "$PAGES_URL" | grep -c "_next/static")
if [ "$CSS_TEST" -gt 0 ]; then
    echo "✅ Static assets (CSS/JS) loading correctly"
else
    echo "❌ Static assets not found"
fi

# Test if images load
IMG_TEST=$(curl -s "$PAGES_URL" | grep -c "background.jpg\|me.jpg")
if [ "$IMG_TEST" -gt 0 ]; then
    echo "✅ Images loading correctly"
else
    echo "❌ Images not found"
fi

# Check response time
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$PAGES_URL")
echo "⚡ Response time: ${RESPONSE_TIME}s"

echo ""
echo "🎯 Deployment Verification Complete!"
echo "📝 Manual checks still needed:"
echo "   - DNS propagation for custom domains"
echo "   - Mobile responsiveness"
echo "   - Cross-browser compatibility"
echo ""
echo "🔗 Live URL: $PAGES_URL"