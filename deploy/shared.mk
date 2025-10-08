# Shared deployment functions for all applications and services
# Include this file in individual Makefiles: include ../../deploy/shared.mk

# Common variables
TIMESTAMP := $(shell date +%Y%m%d-%H%M%S)
GIT_COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Environment validation
define check-environment
	@if [ -z "$(ENV)" ]; then \
		echo "$(RED)❌ ENV is required. Use ENV=development or ENV=production$(NC)"; \
		exit 1; \
	fi
	@if [ "$(ENV)" != "development" ] && [ "$(ENV)" != "production" ]; then \
		echo "$(RED)❌ Invalid ENV: $(ENV). Use development or production$(NC)"; \
		exit 1; \
	fi
endef

# Common deployment patterns
define deploy-info
	@echo "$(BLUE)📋 Deployment Information$(NC)"
	@echo "=========================="
	@echo "Application: $(shell basename $(CURDIR))"
	@echo "Environment: $(ENV)"
	@echo "Timestamp: $(TIMESTAMP)"
	@echo "Git Commit: $(GIT_COMMIT)"
	@echo "Git Branch: $(GIT_BRANCH)"
	@echo ""
endef

# Build validation
define validate-build
	@echo "$(YELLOW)🔍 Validating build...$(NC)"
	@if [ ! -d "dist" ] && [ ! -d "build" ] && [ ! -d ".next" ] && [ ! -d "out" ] && [ ! -f "index.js" ]; then \
		echo "$(RED)❌ No build output found. Run 'make build' first.$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Build validation passed$(NC)"
endef

# Health check helpers
define health-check-url
	@echo "$(YELLOW)🏥 Health checking: $(1)$(NC)"
	@if curl -f -s $(1) > /dev/null; then \
		echo "$(GREEN)✅ $(1) is healthy$(NC)"; \
	else \
		echo "$(RED)❌ $(1) is not responding$(NC)"; \
		exit 1; \
	fi
endef

# Deployment retry logic
define retry-command
	@for i in 1 2 3; do \
		if $(1); then \
			echo "$(GREEN)✅ Command succeeded on attempt $$i$(NC)"; \
			break; \
		else \
			if [ $$i -eq 3 ]; then \
				echo "$(RED)❌ Command failed after 3 attempts$(NC)"; \
				exit 1; \
			else \
				echo "$(YELLOW)⚠️  Command failed, retrying ($$i/3)...$(NC)"; \
				sleep 5; \
			fi; \
		fi; \
	done
endef

# File existence checks
define require-file
	@if [ ! -f "$(1)" ]; then \
		echo "$(RED)❌ Required file not found: $(1)$(NC)"; \
		exit 1; \
	fi
endef

# Directory creation
define ensure-dir
	@mkdir -p $(1)
endef

# Cleanup helpers
define clean-common
	@echo "$(YELLOW)🧹 Cleaning common build artifacts...$(NC)"
	@rm -rf node_modules/.cache
	@rm -rf dist build .next out
	@rm -rf *.log
	@rm -rf .env.local
	@echo "$(GREEN)✅ Common artifacts cleaned$(NC)"
endef

# Git helpers
define check-git-clean
	@if [ -n "$$(git status --porcelain 2>/dev/null)" ]; then \
		echo "$(YELLOW)⚠️  Git working directory is not clean$(NC)"; \
		echo "$(YELLOW)⚠️  Consider committing changes before deployment$(NC)"; \
	fi
endef

# Version tagging
define tag-deployment
	@echo "$(BLUE)🏷️  Tagging deployment...$(NC)"
	@git tag -f "deploy-$(shell basename $(CURDIR))-$(ENV)-$(TIMESTAMP)" 2>/dev/null || true
	@echo "$(GREEN)✅ Tagged as: deploy-$(shell basename $(CURDIR))-$(ENV)-$(TIMESTAMP)$(NC)"
endef

# Common test patterns
define run-tests-if-exists
	@if [ -f "package.json" ] && grep -q '"test"' package.json; then \
		echo "$(YELLOW)🧪 Running npm tests...$(NC)"; \
		npm test; \
	elif [ -f "requirements.txt" ] && [ -f "test_*.py" ]; then \
		echo "$(YELLOW)🧪 Running Python tests...$(NC)"; \
		python -m pytest; \
	elif [ -f "Makefile" ] && grep -q "test:" Makefile; then \
		echo "$(YELLOW)🧪 Running Makefile tests...$(NC)"; \
		$(MAKE) test; \
	else \
		echo "$(YELLOW)⚠️  No tests found, skipping$(NC)"; \
	fi
endef

# Build patterns
define build-if-needed
	@if [ -f "package.json" ] && grep -q '"build"' package.json; then \
		echo "$(YELLOW)📦 Running npm build...$(NC)"; \
		npm run build; \
	elif [ -f "requirements.txt" ]; then \
		echo "$(YELLOW)📦 Installing Python dependencies...$(NC)"; \
		pip install -r requirements.txt; \
	elif [ -f "Dockerfile" ]; then \
		echo "$(YELLOW)📦 Building Docker image...$(NC)"; \
		docker build -t $(shell basename $(CURDIR)):$(ENV) .; \
	else \
		echo "$(YELLOW)⚠️  No build configuration found$(NC)"; \
	fi
endef

# Deployment status tracking
define update-deployment-status
	@echo "$(TIMESTAMP): Deployed $(shell basename $(CURDIR)) to $(ENV) ($(GIT_COMMIT))" >> .deployment-history
endef

# Common pre-deployment checks
define pre-deploy-checks
	$(call check-environment)
	$(call deploy-info)
	$(call check-git-clean)
endef

# Common post-deployment actions
define post-deploy-actions
	$(call update-deployment-status)
	$(call tag-deployment)
	@echo "$(GREEN)🎉 Deployment completed successfully!$(NC)"
endef

# Help template for individual apps
define app-help-template
	@echo "📱 $(shell basename $(CURDIR)) - Available Commands"
	@echo "=================================================="
	@echo ""
	@echo "$(GREEN)Deployment:$(NC)"
	@echo "  make deploy ENV=<env>   Deploy to environment"
	@echo "  make deploy-dev         Deploy to development"
	@echo "  make deploy-prod        Deploy to production"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev               Start development server"
	@echo "  make build             Build for production"
	@echo "  make test              Run tests"
	@echo "  make lint              Run linting"
	@echo ""
	@echo "$(GREEN)Maintenance:$(NC)"
	@echo "  make clean             Clean build artifacts"
	@echo "  make health-check      Check deployment health"
	@echo "  make status            Show deployment status"
	@echo ""
endef

# Shared help target for apps
shared-help:
	$(call app-help-template)