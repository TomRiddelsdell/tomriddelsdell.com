#!/usr/bin/env bash
#
# Continuous uptime monitoring script
# Monitors site availability and logs results
#
# Usage:
#   ./scripts/uptime-monitor.sh <url> [interval_seconds]
#   ./scripts/uptime-monitor.sh https://tomriddelsdell.com 300
#
# Features:
# - Continuous monitoring with configurable interval
# - Logs all checks with timestamps
# - Tracks uptime percentage
# - Sends notifications on status changes (optional)
#

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_URL="${1:-https://tomriddelsdell.com}"
INTERVAL="${2:-300}"  # Default: 5 minutes
LOG_DIR="/tmp/landing-page-uptime"
LOG_FILE="$LOG_DIR/uptime-$(date +%Y-%m-%d).log"
STATUS_FILE="$LOG_DIR/status.json"

# Create log directory
mkdir -p "$LOG_DIR"

# Initialize status tracking
if [ ! -f "$STATUS_FILE" ]; then
    echo '{"total_checks": 0, "successful_checks": 0, "failed_checks": 0, "last_status": "unknown", "last_check": ""}' > "$STATUS_FILE"
fi

log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

update_status() {
    local status="$1"
    local current_time=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    # Read current stats
    local total=$(jq -r '.total_checks' "$STATUS_FILE")
    local successful=$(jq -r '.successful_checks' "$STATUS_FILE")
    local failed=$(jq -r '.failed_checks' "$STATUS_FILE")
    local last_status=$(jq -r '.last_status' "$STATUS_FILE")
    
    # Update counts
    total=$((total + 1))
    if [ "$status" = "up" ]; then
        successful=$((successful + 1))
    else
        failed=$((failed + 1))
    fi
    
    # Calculate uptime percentage
    local uptime_pct=$(echo "scale=2; ($successful / $total) * 100" | bc)
    
    # Update status file
    jq -n \
        --arg total "$total" \
        --arg successful "$successful" \
        --arg failed "$failed" \
        --arg status "$status" \
        --arg last_check "$current_time" \
        --arg uptime "$uptime_pct" \
        '{
            total_checks: ($total | tonumber),
            successful_checks: ($successful | tonumber),
            failed_checks: ($failed | tonumber),
            last_status: $status,
            last_check: $last_check,
            uptime_percentage: ($uptime | tonumber)
        }' > "$STATUS_FILE"
    
    # Notify on status change
    if [ "$status" != "$last_status" ] && [ "$last_status" != "unknown" ]; then
        if [ "$status" = "up" ]; then
            log_message "INFO" "🟢 Site recovered! $BASE_URL is now UP"
        else
            log_message "ERROR" "🔴 Site DOWN! $BASE_URL is not accessible"
        fi
    fi
    
    # Display current stats
    echo -e "${GREEN}Uptime: ${uptime_pct}%${NC} (${successful}/${total} checks successful)"
}

check_site() {
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL" || echo "000")
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "302" ]; then
        log_message "INFO" "✓ Site UP - HTTP $http_code"
        update_status "up"
        return 0
    else
        log_message "ERROR" "✗ Site DOWN - HTTP $http_code"
        update_status "down"
        return 1
    fi
}

# Signal handlers
cleanup() {
    echo ""
    log_message "INFO" "Monitoring stopped"
    
    # Display final statistics
    if [ -f "$STATUS_FILE" ]; then
        echo ""
        echo "=================================================="
        echo "  Final Statistics"
        echo "=================================================="
        jq -r '"Total Checks: \(.total_checks)\nSuccessful: \(.successful_checks)\nFailed: \(.failed_checks)\nUptime: \(.uptime_percentage)%"' "$STATUS_FILE"
        echo "=================================================="
    fi
    
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main monitoring loop
echo "=================================================="
echo "  Uptime Monitoring Started"
echo "=================================================="
echo "Target: $BASE_URL"
echo "Check Interval: ${INTERVAL}s"
echo "Log File: $LOG_FILE"
echo "Status File: $STATUS_FILE"
echo "=================================================="
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
    check_site
    sleep "$INTERVAL"
done
