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
	@echo "Dependencies installed successfully"

build:
	npm run build
	@echo "All services built successfully"

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