# Landing Page App Makefile
# Node.js application deployed to Cloudflare Pages

# App configuration
APP_NAME := landing-page
APP_TYPE := nextjs
DEPLOYMENT_TARGET := cloudflare-pages

# Include shared deployment functions
include ../../deploy/shared.mk
include ../../deploy/doppler.mk
include ../../deploy/cloudflare.mk

# App-specific configuration
NODE_VERSION := 18
PYTHON_VERSION := 3.11
BUILD_DIR := out
SOURCE_DIR := src

# Environment-specific overrides
ifeq ($(ENV),local)
DOPPLER_CONFIG := dev_personal
endif
ifeq ($(ENV),staging)
DOPPLER_CONFIG := stg
endif
ifeq ($(ENV),production)
DOPPLER_CONFIG := prd
endif

# Default target
.DEFAULT_GOAL := help

# Build targets
.PHONY: build clean test lint format install dev

install: ## Install dependencies
	@echo "$(YELLOW)📦 Installing dependencies for $(APP_NAME)...$(NC)"
ifeq ($(APP_TYPE),nodejs)
	@if [ -f "package.json" ]; then \
		pnpm install --frozen-lockfile; \
	else \
		echo "$(RED)❌ package.json not found$(NC)"; \
		exit 1; \
	fi
else ifeq ($(APP_TYPE),python)
	@if [ -f "requirements.txt" ]; then \
		pip install -r requirements.txt; \
	elif [ -f "pyproject.toml" ]; then \
		pip install -e .; \
	else \
		echo "$(RED)❌ requirements.txt or pyproject.toml not found$(NC)"; \
		exit 1; \
	fi
else ifeq ($(APP_TYPE),docker)
	@echo "$(GREEN)✅ Docker apps don't require separate dependency installation$(NC)"
endif

build: install ## Build the application
	@echo "$(YELLOW)🔨 Building $(APP_NAME)...$(NC)"
ifeq ($(APP_TYPE),nodejs)
	@if [ -f "package.json" ] && [ -n "$$(jq -r '.scripts.build // empty' package.json)" ]; then \
		pnpm run build; \
	else \
		echo "$(YELLOW)⚠️  No build script found, skipping build$(NC)"; \
	fi
else ifeq ($(APP_TYPE),python)
	@if [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then \
		python -m build; \
	else \
		echo "$(YELLOW)⚠️  No build configuration found, skipping build$(NC)"; \
	fi
else ifeq ($(APP_TYPE),docker)
	@echo "$(YELLOW)🐳 Docker build will happen during deployment$(NC)"
else ifeq ($(APP_TYPE),static)
	@if [ -d "$(SOURCE_DIR)" ]; then \
		cp -r $(SOURCE_DIR)/* $(BUILD_DIR)/; \
	else \
		echo "$(YELLOW)⚠️  No source directory found, skipping build$(NC)"; \
	fi
endif
	@echo "$(GREEN)✅ Build completed$(NC)"

clean: ## Clean build artifacts
	@echo "$(YELLOW)🧹 Cleaning build artifacts...$(NC)"
	@rm -rf $(BUILD_DIR) node_modules .next .nuxt build dist __pycache__ .pytest_cache
	@echo "$(GREEN)✅ Clean completed$(NC)"

test: ## Run tests
	@echo "$(YELLOW)🧪 Running tests for $(APP_NAME)...$(NC)"
ifeq ($(APP_TYPE),nextjs)
	@if [ -f "package.json" ] && [ -n "$$(jq -r '.scripts.test // empty' package.json)" ]; then \
		pnpm test; \
	else \
		echo "$(YELLOW)⚠️  No test script found$(NC)"; \
	fi
else ifeq ($(APP_TYPE),nodejs)
	@if [ -f "package.json" ] && [ -n "$$(jq -r '.scripts.test // empty' package.json)" ]; then \
		npm test; \
	else \
		echo "$(YELLOW)⚠️  No test script found$(NC)"; \
	fi
else ifeq ($(APP_TYPE),python)
	@if [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then \
		pytest; \
	else \
		python -m unittest discover; \
	fi
else
	@echo "$(YELLOW)⚠️  No test configuration found$(NC)"
endif

lint: ## Run linting
	@echo "$(YELLOW)🔍 Running linting for $(APP_NAME)...$(NC)"
ifeq ($(APP_TYPE),nodejs)
	@if [ -f "package.json" ] && [ -n "$$(jq -r '.scripts.lint // empty' package.json)" ]; then \
		pnpm run lint; \
	else \
		echo "$(YELLOW)⚠️  No lint script found$(NC)"; \
	fi
else ifeq ($(APP_TYPE),python)
	@if command -v flake8 >/dev/null 2>&1; then \
		flake8 .; \
	elif command -v pylint >/dev/null 2>&1; then \
		pylint .; \
	else \
		echo "$(YELLOW)⚠️  No linting tools found$(NC)"; \
	fi
endif

format: ## Format code
	@echo "$(YELLOW)✨ Formatting code for $(APP_NAME)...$(NC)"
ifeq ($(APP_TYPE),nodejs)
	@if [ -f "package.json" ] && [ -n "$$(jq -r '.scripts.format // empty' package.json)" ]; then \
		pnpm run format; \
	elif command -v prettier >/dev/null 2>&1; then \
		prettier --write .; \
	else \
		echo "$(YELLOW)⚠️  No formatting tools found$(NC)"; \
	fi
else ifeq ($(APP_TYPE),python)
	@if command -v black >/dev/null 2>&1; then \
		black .; \
	else \
		echo "$(YELLOW)⚠️  Black formatter not found$(NC)"; \
	fi
endif

dev: ## Start development server
	@echo "$(YELLOW)🚀 Starting development server for $(APP_NAME)...$(NC)"
ifeq ($(APP_TYPE),nodejs)
	@if [ -f "package.json" ] && [ -n "$$(jq -r '.scripts.dev // empty' package.json)" ]; then \
		$(call doppler-exec,pnpm run dev); \
	else \
		echo "$(RED)❌ No dev script found in package.json$(NC)"; \
		exit 1; \
	fi
else ifeq ($(APP_TYPE),python)
	@if [ -f "app.py" ]; then \
		$(call doppler-exec,python app.py); \
	elif [ -f "main.py" ]; then \
		$(call doppler-exec,python main.py); \
	else \
		echo "$(RED)❌ No main application file found$(NC)"; \
		exit 1; \
	fi
else
	@echo "$(RED)❌ Development server not supported for $(APP_TYPE)$(NC)"
endif

# Deployment targets
.PHONY: deploy health-check

deploy: build ## Deploy the application
	@echo "$(YELLOW)🚀 Deploying $(APP_NAME) to $(DEPLOYMENT_TARGET)...$(NC)"
	$(call pre-deploy-checks)
ifeq ($(DEPLOYMENT_TARGET),cloudflare-worker)
	$(call deploy-cloudflare-worker)
else ifeq ($(DEPLOYMENT_TARGET),cloudflare-pages)
	$(call deploy-cloudflare-pages)
else ifeq ($(DEPLOYMENT_TARGET),aws-lambda)
	$(call deploy-to-lambda,$(APP_NAME))
else ifeq ($(DEPLOYMENT_TARGET),aws-ecs)
	$(call deploy-container-to-aws,$(APP_NAME),$(AWS_ECS_CLUSTER))
else ifeq ($(DEPLOYMENT_TARGET),aws-s3)
	$(call deploy-to-s3,$(AWS_S3_BUCKET))
else
	@echo "$(RED)❌ Unknown deployment target: $(DEPLOYMENT_TARGET)$(NC)"
	@exit 1
endif
	$(call post-deploy-actions)
	@echo "$(GREEN)✅ Deployment completed$(NC)"

health-check: ## Check application health
	@echo "$(YELLOW)🏥 Health checking $(APP_NAME)...$(NC)"
	@if [ -f "scripts/health-check.sh" ]; then \
		./scripts/health-check.sh $(HEALTH_CHECK_URL); \
	else \
		echo "$(RED)❌ Health check script not found$(NC)"; \
		exit 1; \
	fi

health-check-staging: ## Check staging deployment health
	@echo "$(YELLOW)🏥 Health checking staging deployment...$(NC)"
	@HEALTH_CHECK_URL=https://staging.tomriddelsdell.com $(MAKE) health-check

health-check-production: ## Check production deployment health
	@echo "$(YELLOW)🏥 Health checking production deployment...$(NC)"
	@HEALTH_CHECK_URL=https://tomriddelsdell.com $(MAKE) health-check

performance-check: ## Run performance monitoring
	@echo "$(YELLOW)⚡ Running performance check...$(NC)"
	@if [ -f "scripts/performance-check.sh" ]; then \
		./scripts/performance-check.sh $(HEALTH_CHECK_URL); \
	else \
		echo "$(RED)❌ Performance check script not found$(NC)"; \
		exit 1; \
	fi

performance-check-production: ## Run performance check on production
	@HEALTH_CHECK_URL=https://tomriddelsdell.com $(MAKE) performance-check

performance-check-staging: ## Run performance check on staging
	@HEALTH_CHECK_URL=https://staging.tomriddelsdell.com $(MAKE) performance-check

uptime-monitor: ## Start uptime monitoring (runs continuously)
	@echo "$(YELLOW)📊 Starting uptime monitor...$(NC)"
	@if [ -f "scripts/uptime-monitor.sh" ]; then \
		./scripts/uptime-monitor.sh $(HEALTH_CHECK_URL) 300; \
	else \
		echo "$(RED)❌ Uptime monitor script not found$(NC)"; \
		exit 1; \
	fi

verify-deployment: ## Verify deployment succeeded
	@echo "$(YELLOW)✓ Verifying deployment...$(NC)"
	@echo "Running comprehensive deployment verification..."
	@sleep 5  # Wait for DNS propagation
	@$(MAKE) health-check
	@$(MAKE) performance-check
	@echo "$(GREEN)✅ Deployment verification complete$(NC)"

verify-deployment-staging: ## Verify staging deployment
	@HEALTH_CHECK_URL=https://staging.tomriddelsdell.com $(MAKE) verify-deployment

verify-deployment-production: ## Verify production deployment
	@HEALTH_CHECK_URL=https://tomriddelsdell.com $(MAKE) verify-deployment

# Development helpers
.PHONY: logs status config

logs: ## Show application logs
	@echo "$(YELLOW)📝 Showing logs for $(APP_NAME)...$(NC)"
ifeq ($(DEPLOYMENT_TARGET),cloudflare-worker)
	wrangler tail $(APP_NAME)
else ifeq ($(DEPLOYMENT_TARGET),aws-lambda)
	aws logs tail /aws/lambda/$(APP_NAME) --follow --region $(AWS_REGION)
else
	@echo "$(YELLOW)⚠️  Logs not implemented for $(DEPLOYMENT_TARGET)$(NC)"
endif

status: ## Show deployment status
	@echo "$(BLUE)📊 Status for $(APP_NAME)$(NC)"
	@echo "========================"
	@echo "App Name: $(APP_NAME)"
	@echo "App Type: $(APP_TYPE)"
	@echo "Environment: $(ENV)"
	@echo "Deployment Target: $(DEPLOYMENT_TARGET)"
	@echo "Doppler Project: $(DOPPLER_PROJECT)"
	@echo "Doppler Config: $(DOPPLER_CONFIG)"
	@echo ""

config: ## Show current configuration
	@echo "$(BLUE)⚙️  Configuration$(NC)"
	@echo "=================="
	$(call doppler-status)

# Include help from shared.mk
include ../../deploy/shared.mk

# Custom help for this app
help: shared-help ## Show this help message
	@echo ""
	@echo "$(BLUE)App-specific targets:$(NC)"
	@echo "  install     Install dependencies"
	@echo "  build       Build the application"
	@echo "  test        Run tests"
	@echo "  lint        Run linting"
	@echo "  format      Format code"
	@echo "  dev         Start development server"
	@echo "  deploy      Deploy to $(DEPLOYMENT_TARGET)"
	@echo "  logs        Show application logs"
	@echo "  status      Show deployment status"
	@echo "  config      Show current configuration"