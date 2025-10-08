#!/usr/bin/env bash
#
# Performance monitoring script for landing page
# Measures key performance metrics including:
# - Page load times
# - Time to first byte (TTFB)
# - DNS lookup time
# - Connection time
# - SSL handshake time
#
# Usage:
#   ./scripts/performance-check.sh <url>
#   ./scripts/performance-check.sh https://tomriddelsdell.com
#

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${1:-https://tomriddelsdell.com}"
TIMEOUT=30

# Performance thresholds (in seconds)
THRESHOLD_TTFB=1.0
THRESHOLD_TOTAL=3.0
THRESHOLD_DNS=0.5
THRESHOLD_CONNECT=1.0

echo ""
echo "=================================================="
echo "  Performance Monitoring Report"
echo "=================================================="
echo "Target: $BASE_URL"
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "=================================================="
echo ""

# Perform timing measurement
echo -e "${BLUE}Measuring performance metrics...${NC}"
echo ""

timing_output=$(curl -w "\
time_namelookup:  %{time_namelookup}s\n\
time_connect:     %{time_connect}s\n\
time_appconnect:  %{time_appconnect}s\n\
time_pretransfer: %{time_pretransfer}s\n\
time_redirect:    %{time_redirect}s\n\
time_starttransfer: %{time_starttransfer}s\n\
time_total:       %{time_total}s\n\
size_download:    %{size_download} bytes\n\
speed_download:   %{speed_download} bytes/sec\n" \
-o /dev/null -s --max-time "$TIMEOUT" "$BASE_URL" || echo "ERROR")

if [ "$timing_output" = "ERROR" ]; then
    echo -e "${RED}✗ Performance check failed - unable to connect${NC}"
    exit 1
fi

echo "$timing_output"

# Extract key metrics
dns_time=$(echo "$timing_output" | grep "time_namelookup" | awk '{print $2}' | sed 's/s//')
connect_time=$(echo "$timing_output" | grep "time_connect:" | awk '{print $2}' | sed 's/s//')
ssl_time=$(echo "$timing_output" | grep "time_appconnect" | awk '{print $2}' | sed 's/s//')
ttfb=$(echo "$timing_output" | grep "time_starttransfer" | awk '{print $2}' | sed 's/s//')
total_time=$(echo "$timing_output" | grep "time_total" | awk '{print $2}' | sed 's/s//')
size=$(echo "$timing_output" | grep "size_download" | awk '{print $2}')
speed=$(echo "$timing_output" | grep "speed_download" | awk '{print $2}')

echo ""
echo "=================================================="
echo "  Performance Analysis"
echo "=================================================="

# DNS Lookup
if (( $(echo "$dns_time < $THRESHOLD_DNS" | bc -l) )); then
    echo -e "${GREEN}✓ DNS Lookup: ${dns_time}s (excellent)${NC}"
else
    echo -e "${YELLOW}⚠ DNS Lookup: ${dns_time}s (threshold: ${THRESHOLD_DNS}s)${NC}"
fi

# Connection Time
if (( $(echo "$connect_time < $THRESHOLD_CONNECT" | bc -l) )); then
    echo -e "${GREEN}✓ Connection Time: ${connect_time}s (excellent)${NC}"
else
    echo -e "${YELLOW}⚠ Connection Time: ${connect_time}s (threshold: ${THRESHOLD_CONNECT}s)${NC}"
fi

# SSL Handshake
if [ "$ssl_time" != "0.000000" ]; then
    ssl_handshake=$(echo "$ssl_time - $connect_time" | bc)
    echo -e "${BLUE}ℹ SSL Handshake: ${ssl_handshake}s${NC}"
fi

# Time to First Byte
if (( $(echo "$ttfb < $THRESHOLD_TTFB" | bc -l) )); then
    echo -e "${GREEN}✓ Time to First Byte (TTFB): ${ttfb}s (excellent)${NC}"
else
    echo -e "${YELLOW}⚠ Time to First Byte (TTFB): ${ttfb}s (threshold: ${THRESHOLD_TTFB}s)${NC}"
fi

# Total Load Time
if (( $(echo "$total_time < $THRESHOLD_TOTAL" | bc -l) )); then
    echo -e "${GREEN}✓ Total Load Time: ${total_time}s (excellent)${NC}"
else
    echo -e "${YELLOW}⚠ Total Load Time: ${total_time}s (threshold: ${THRESHOLD_TOTAL}s)${NC}"
fi

# Download metrics
size_kb=$(echo "scale=2; $size / 1024" | bc)
speed_kb=$(echo "scale=2; $speed / 1024" | bc)
echo ""
echo -e "${BLUE}ℹ Page Size: ${size_kb} KB${NC}"
echo -e "${BLUE}ℹ Download Speed: ${speed_kb} KB/s${NC}"

echo ""
echo "=================================================="

# Performance grade
if (( $(echo "$ttfb < $THRESHOLD_TTFB && $total_time < $THRESHOLD_TOTAL" | bc -l) )); then
    echo -e "${GREEN}✓ Performance Grade: A (Excellent)${NC}"
    exit 0
elif (( $(echo "$ttfb < 2.0 && $total_time < 5.0" | bc -l) )); then
    echo -e "${YELLOW}⚠ Performance Grade: B (Good, but could be improved)${NC}"
    exit 0
else
    echo -e "${RED}✗ Performance Grade: C (Needs optimization)${NC}"
    exit 1
fi
