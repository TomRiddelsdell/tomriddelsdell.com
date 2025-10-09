#!/usr/bin/env bash
#
# Comprehensive health check script for landing page
# Tests all aspects of the deployed application
#
# Usage:
#   ./scripts/health-check.sh <url>
#   ./scripts/health-check.sh https://tomriddelsdell.com
#   ./scripts/health-check.sh https://staging.tomriddelsdell.com
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-https://tomriddelsdell.com}"
TIMEOUT=10
MAX_RESPONSE_TIME=3000  # milliseconds
FAILED_CHECKS=0

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_CHECKS++))
}

check_http_status() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    
    log_info "Checking $description..."
    
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" || echo "000")
    
    # Accept both 200 (OK) and 302 (Cloudflare Access redirect)
    if [ "$http_code" = "$expected_status" ] || [ "$http_code" = "302" ]; then
        log_success "$description - HTTP $http_code"
        return 0
    else
        log_error "$description - Expected HTTP $expected_status (or 302 for Cloudflare Access), got HTTP $http_code"
        return 1
    fi
}

check_response_time() {
    local url="$1"
    local description="$2"
    
    log_info "Checking response time for $description..."
    
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" "$url" || echo "0")
    # Convert to milliseconds using awk instead of bc
    local response_time_ms=$(awk "BEGIN {printf \"%.0f\", $response_time * 1000}")
    
    if [ "$response_time_ms" -lt "$MAX_RESPONSE_TIME" ]; then
        log_success "$description - Response time: ${response_time_ms}ms"
        return 0
    else
        log_warning "$description - Slow response: ${response_time_ms}ms (threshold: ${MAX_RESPONSE_TIME}ms)"
        return 0  # Warning, not failure
    fi
}

check_content() {
    local url="$1"
    local search_string="$2"
    local description="$3"
    
    log_info "Checking content for $description..."
    
    local content=$(curl -s --max-time "$TIMEOUT" "$url" || echo "")
    
    if echo "$content" | grep -q "$search_string"; then
        log_success "$description - Content found"
        return 0
    else
        log_error "$description - Expected content not found: '$search_string'"
        return 1
    fi
}

check_ssl() {
    local url="$1"
    
    log_info "Checking SSL certificate..."
    
    if curl -s --max-time "$TIMEOUT" "$url" > /dev/null 2>&1; then
        log_success "SSL certificate valid"
        return 0
    else
        log_error "SSL certificate check failed"
        return 1
    fi
}

check_headers() {
    local url="$1"
    
    log_info "Checking security headers..."
    
    local headers=$(curl -s -I --max-time "$TIMEOUT" "$url")
    
    # Check for important security headers
    if echo "$headers" | grep -qi "x-frame-options\|x-content-type-options"; then
        log_success "Security headers present"
        return 0
    else
        log_warning "Some security headers may be missing"
        return 0  # Warning, not failure
    fi
}

check_health_endpoint() {
    local url="$BASE_URL/api/health"
    
    log_info "Checking health endpoint..."
    
    local response=$(curl -s --max-time "$TIMEOUT" "$url" || echo "{}")
    
    if echo "$response" | grep -q '"status".*:.*"healthy"'; then
        log_success "Health endpoint responding correctly"
        return 0
    else
        log_warning "Health endpoint not available (may not be deployed yet)"
        return 0  # Warning instead of error for new endpoint
    fi
}

# Main health check sequence
echo ""
echo "=================================================="
echo "  Landing Page Health Check"
echo "=================================================="
echo "Target: $BASE_URL"
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "=================================================="
echo ""

# 1. Check homepage accessibility
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$BASE_URL" || echo "000")
check_http_status "$BASE_URL" "200" "Homepage accessibility"
check_response_time "$BASE_URL" "Homepage"

# 2. Check SSL certificate (only for HTTPS)
if [[ "$BASE_URL" == https://* ]]; then
    check_ssl "$BASE_URL"
fi

# 3. Check health endpoint
check_health_endpoint

# 4. Check critical page sections (only if not behind auth - 200 response)
if [ "$HTTP_STATUS" = "200" ]; then
    check_content "$BASE_URL" "Tom Riddelsdell" "Hero section (name)"
    check_content "$BASE_URL" "Strategist.*Software Engineer\|Software Engineer" "Hero section (title)"
    check_content "$BASE_URL" "Interests\|Contact" "Navigation sections"
else
    log_info "Skipping content checks (site behind authentication: HTTP $HTTP_STATUS)"
fi

# 5. Check security headers
check_headers "$BASE_URL"

# 6. Check responsive design viewport meta tag (only if not behind auth)
if [ "$HTTP_STATUS" = "200" ]; then
    check_content "$BASE_URL" "viewport" "Responsive design configuration"
fi

# Summary
echo ""
echo "=================================================="
if [ "$FAILED_CHECKS" -eq 0 ]; then
    echo -e "${GREEN}✓ All health checks passed!${NC}"
    echo "=================================================="
    exit 0
else
    echo -e "${RED}✗ $FAILED_CHECKS health check(s) failed${NC}"
    echo "=================================================="
    exit 1
fi
