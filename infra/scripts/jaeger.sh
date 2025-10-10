#!/bin/bash
# Jaeger Infrastructure Management Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/infra/docker-compose.jaeger.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Start Jaeger infrastructure
start_jaeger() {
    log_info "Starting Jaeger infrastructure..."
    check_docker
    
    docker-compose -f "${COMPOSE_FILE}" up -d
    
    log_info "Waiting for Jaeger to be healthy..."
    sleep 5
    
    # Check health
    if docker-compose -f "${COMPOSE_FILE}" ps | grep -q "healthy"; then
        log_info "Jaeger is running and healthy!"
        log_info "Jaeger UI: http://localhost:16686"
        log_info "OTLP HTTP Endpoint: http://localhost:4318"
        log_info "Health Check: http://localhost:14269"
    else
        log_warn "Jaeger may not be fully healthy yet. Check with: docker-compose -f ${COMPOSE_FILE} ps"
    fi
}

# Stop Jaeger infrastructure
stop_jaeger() {
    log_info "Stopping Jaeger infrastructure..."
    docker-compose -f "${COMPOSE_FILE}" down
    log_info "Jaeger stopped successfully"
}

# Restart Jaeger infrastructure
restart_jaeger() {
    log_info "Restarting Jaeger infrastructure..."
    stop_jaeger
    start_jaeger
}

# Show Jaeger logs
logs_jaeger() {
    docker-compose -f "${COMPOSE_FILE}" logs -f jaeger
}

# Show Jaeger status
status_jaeger() {
    log_info "Jaeger infrastructure status:"
    docker-compose -f "${COMPOSE_FILE}" ps
    
    echo ""
    log_info "Health check:"
    if curl -s http://localhost:14269/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Jaeger is healthy"
    else
        echo -e "${RED}✗${NC} Jaeger is not responding"
    fi
    
    echo ""
    log_info "Access URLs:"
    echo "  Jaeger UI: http://localhost:16686"
    echo "  OTLP HTTP: http://localhost:4318"
    echo "  Health: http://localhost:14269"
}

# Clean up Jaeger data
clean_jaeger() {
    log_warn "This will remove all Jaeger data (in-memory storage will be cleared on restart)"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        stop_jaeger
        log_info "Jaeger data cleared (will be empty on next start)"
    fi
}

# Main command handler
case "${1:-}" in
    start)
        start_jaeger
        ;;
    stop)
        stop_jaeger
        ;;
    restart)
        restart_jaeger
        ;;
    logs)
        logs_jaeger
        ;;
    status)
        status_jaeger
        ;;
    clean)
        clean_jaeger
        ;;
    *)
        echo "Jaeger Infrastructure Management"
        echo ""
        echo "Usage: $0 {start|stop|restart|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  start    - Start Jaeger infrastructure"
        echo "  stop     - Stop Jaeger infrastructure"
        echo "  restart  - Restart Jaeger infrastructure"
        echo "  logs     - Show Jaeger logs (follow mode)"
        echo "  status   - Show Jaeger status and health"
        echo "  clean    - Clean Jaeger data"
        echo ""
        echo "After starting Jaeger:"
        echo "  UI:     http://localhost:16686"
        echo "  OTLP:   http://localhost:4318"
        echo "  Health: http://localhost:14269"
        exit 1
        ;;
esac
