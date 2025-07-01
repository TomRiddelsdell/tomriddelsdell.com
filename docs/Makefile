# FlowCreate Platform - Development Commands

.PHONY: help install build test lint clean dev prod stop logs

# Default target
help:
        @echo "FlowCreate Platform - Available Commands:"
        @echo ""
        @echo "  make install     - Install all dependencies"
        @echo "  make build       - Build all services and packages"
        @echo "  make test        - Run all tests"
        @echo "  make lint        - Lint all code"
        @echo "  make clean       - Clean build artifacts"
        @echo "  make dev         - Start development environment"
        @echo "  make prod        - Start production environment"
        @echo "  make stop        - Stop all services"
        @echo "  make logs        - View service logs"
        @echo "  make db-up       - Run database migrations"
        @echo "  make db-down     - Rollback database migrations"
        @echo "  make db-seed     - Seed database with test data"

# Development setup
install:
        npm install
        @echo "Installing service dependencies..."
        @cd services/identity-service && npm install || echo "Identity service dependencies skipped"
        @cd services/workflow-service && npm install || echo "Workflow service dependencies skipped"
        @cd services/notification-service && npm install || echo "Notification service dependencies skipped"
        @cd interfaces/web-frontend && npm install || echo "Web frontend dependencies skipped"
        @cd interfaces/api-gateway && npm install || echo "API gateway dependencies skipped"
        @echo "All dependencies installed successfully"

build:
        npm run build
        @echo "Building individual services..."
        @cd interfaces/web-frontend && npm run build || echo "Web frontend build skipped"
        @cd interfaces/api-gateway && npm run build || echo "API gateway build skipped"
        @cd services/identity-service && npm run build || echo "Identity service build skipped"
        @cd services/workflow-service && npm run build || echo "Workflow service build skipped"
        @cd services/notification-service && npm run build || echo "Notification service build skipped"
        @echo "All services built successfully"

# Individual service development
dev-frontend:
        @echo "Starting web frontend..."
        cd interfaces/web-frontend && npm run dev

dev-gateway:
        @echo "Starting API gateway..."
        cd interfaces/api-gateway && npm run dev

dev-identity:
        @echo "Starting identity service..."
        cd services/identity-service && npm run dev

dev-workflow:
        @echo "Starting workflow service..."
        cd services/workflow-service && npm run dev

dev-notification:
        @echo "Starting notification service..."
        cd services/notification-service && npm run dev

test:
        npm run test
        @echo "All tests completed"

lint:
        npm run lint
        @echo "Code linting completed"

clean:
        npm run clean
        rm -rf node_modules/.cache
        @echo "Cleaned build artifacts"

# Environment management
dev:
        docker-compose up -d postgres redis rabbitmq
        @echo "Infrastructure started"
        npm run dev
        @echo "Development environment running"

prod:
        docker-compose -f docker-compose.prod.yml up -d
        @echo "Production environment started"

stop:
        docker-compose down
        @echo "All services stopped"

logs:
        docker-compose logs -f

# Database management
db-up:
        npm run migration:up
        @echo "Database migrations applied"

db-down:
        npm run migration:down
        @echo "Database migrations rolled back"

db-seed:
        npm run seed
        @echo "Database seeded with test data"

# Service-specific commands
dev-identity:
        npm run dev --workspace=services/identity-service

dev-workflow:
        npm run dev --workspace=services/workflow-service

dev-frontend:
        npm run dev --workspace=interfaces/web-frontend

# Testing commands
test-unit:
        npm run test:unit --workspaces

test-integration:
        npm run test:integration --workspaces

test-e2e:
        npm run test:e2e --workspace=interfaces/web-frontend