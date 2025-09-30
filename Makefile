# Universal Deployment Orchestration Makefile
# Provides consistent interface for all applications and services

.DEFAULT_GOAL := help
.PHONY: help setup-env check-deps status list-apps list-services show-template

# Include shared deployment functions
include deploy/shared.mk
include deploy/doppler.mk

# Configuration
ENV ?= development
DOPPLER_PROJECT ?= copilot-monorepo
APP ?=
SERVICE ?=

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

# Setup and utility targets
setup-env: ## Setup development environment
	@echo "$(YELLOW)🔧 Setting up development environment...$(NC)"
	@echo "$(YELLOW)📋 Checking for required tools...$(NC)"
	$(call check-required-tools)
	@echo "$(YELLOW)🔐 Configuring Doppler...$(NC)"
	$(call setup-doppler)
	@echo "$(GREEN)✅ Development environment setup completed$(NC)"

check-deps: ## Check required dependencies
	@echo "$(YELLOW)🔍 Checking dependencies...$(NC)"
	$(call check-required-tools)
	$(call validate-doppler)
	@echo "$(GREEN)✅ All dependencies satisfied$(NC)"

status: ## Show current configuration status
	@echo "$(BLUE)📊 Configuration Status$(NC)"
	@echo "========================"
	@echo "Environment: $(ENV)"
	@echo "Doppler Project: $(DOPPLER_PROJECT)"
	$(call doppler-status)

list-apps: ## List all available applications
	@echo "$(BLUE)📱 Available Applications$(NC)"
	@echo "=========================="
	@find apps -maxdepth 1 -type d -not -path apps | sed 's|apps/||' | sort

list-services: ## List all available services  
	@echo "$(BLUE)🔧 Available Services$(NC)"
	@echo "====================="
	@find services -maxdepth 1 -type d -not -path services | sed 's|services/||' | sort

show-template: ## Show app Makefile template
	@echo "$(BLUE)📋 App Makefile Template$(NC)"
	@echo "==========================="
	@echo "Location: deploy/app-template.mk"
	@echo ""
	@echo "$(YELLOW)To create a new app Makefile:$(NC)"
	@echo "1. Copy deploy/app-template.mk to your app directory"
	@echo "2. Rename it to Makefile"
	@echo "3. Customize the configuration variables"
	@echo ""
	@echo "$(YELLOW)Example:$(NC)"
	@echo "  cp deploy/app-template.mk apps/my-app/Makefile"

# Testing targets
.PHONY: test-all test-app test-service

test-all: ## Run tests for all applications and services
	@echo "$(BLUE)🧪 Running tests for all applications and services$(NC)"
	@echo "=================================================="
	@for app in $$(find apps -maxdepth 1 -type d -not -path apps | xargs -r basename -a); do \
		if [ -f "apps/$$app/Makefile" ]; then \
			echo "$(YELLOW)🧪 Testing app: $$app$(NC)"; \
			$(MAKE) -C apps/$$app test || exit 1; \
		fi; \
	done
	@for service in $$(find services -maxdepth 1 -type d -not -path services | xargs -r basename -a); do \
		if [ -f "services/$$service/Makefile" ]; then \
			echo "$(YELLOW)🧪 Testing service: $$service$(NC)"; \
			$(MAKE) -C services/$$service test || exit 1; \
		fi; \
	done
	@echo "$(GREEN)✅ All tests completed$(NC)"

test-app: ## Test specific app (usage: make test-app APP=landing-page)
	@if [ -z "$(APP)" ]; then \
		echo "$(RED)❌ APP parameter required. Usage: make test-app APP=landing-page$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "apps/$(APP)/Makefile" ]; then \
		echo "$(RED)❌ Makefile not found: apps/$(APP)/Makefile$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)🧪 Testing app: $(APP)$(NC)"
	$(MAKE) -C apps/$(APP) test

test-service: ## Test specific service (usage: make test-service SERVICE=accounts)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)❌ SERVICE parameter required. Usage: make test-service SERVICE=accounts$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "services/$(SERVICE)/Makefile" ]; then \
		echo "$(RED)❌ Makefile not found: services/$(SERVICE)/Makefile$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)🧪 Testing service: $(SERVICE)$(NC)"
	$(MAKE) -C services/$(SERVICE) test

# Deployment targets
.PHONY: deploy-all deploy-app deploy-service deploy-infra

deploy-all: ## Deploy all applications and services
	@echo "$(BLUE)🚀 Deploying all applications and services$(NC)"
	@echo "=============================================="
	$(call validate-env)
	$(call validate-doppler)
	@for app in $$(find apps -maxdepth 1 -type d -not -path apps | xargs -r basename -a); do \
		if [ -f "apps/$$app/Makefile" ]; then \
			echo "$(YELLOW)🚀 Deploying app: $$app$(NC)"; \
			$(MAKE) -C apps/$$app deploy ENV=$(ENV) || exit 1; \
		else \
			echo "$(YELLOW)⚠️  No Makefile found for app: $$app$(NC)"; \
		fi; \
	done
	@for service in $$(find services -maxdepth 1 -type d -not -path services | xargs -r basename -a); do \
		if [ -f "services/$$service/Makefile" ]; then \
			echo "$(YELLOW)🚀 Deploying service: $$service$(NC)"; \
			$(MAKE) -C services/$$service deploy ENV=$(ENV) || exit 1; \
		else \
			echo "$(YELLOW)⚠️  No Makefile found for service: $$service$(NC)"; \
		fi; \
	done
	@echo "$(GREEN)✅ All deployments completed$(NC)"

deploy-app: ## Deploy specific app (usage: make deploy-app APP=landing-page ENV=development)
	@if [ -z "$(APP)" ]; then \
		echo "$(RED)❌ APP parameter required. Usage: make deploy-app APP=landing-page$(NC)"; \
		exit 1; \
	fi
	@if [ ! -d "apps/$(APP)" ]; then \
		echo "$(RED)❌ App directory not found: apps/$(APP)$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "apps/$(APP)/Makefile" ]; then \
		echo "$(RED)❌ Makefile not found: apps/$(APP)/Makefile$(NC)"; \
		echo "$(YELLOW)💡 Copy deploy/app-template.mk to apps/$(APP)/Makefile and customize$(NC)"; \
		exit 1; \
	fi
	$(call validate-env)
	$(call validate-doppler)
	@echo "$(YELLOW)🚀 Deploying app: $(APP)$(NC)"
	$(MAKE) -C apps/$(APP) deploy ENV=$(ENV)
	@echo "$(GREEN)✅ App $(APP) deployed$(NC)"

deploy-service: ## Deploy specific service (usage: make deploy-service SERVICE=accounts ENV=development)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)❌ SERVICE parameter required. Usage: make deploy-service SERVICE=accounts$(NC)"; \
		exit 1; \
	fi
	@if [ ! -d "services/$(SERVICE)" ]; then \
		echo "$(RED)❌ Service directory not found: services/$(SERVICE)$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "services/$(SERVICE)/Makefile" ]; then \
		echo "$(RED)❌ Makefile not found: services/$(SERVICE)/Makefile$(NC)"; \
		echo "$(YELLOW)💡 Copy deploy/app-template.mk to services/$(SERVICE)/Makefile and customize$(NC)"; \
		exit 1; \
	fi
	$(call validate-env)
	$(call validate-doppler)
	@echo "$(YELLOW)🚀 Deploying service: $(SERVICE)$(NC)"
	$(MAKE) -C services/$(SERVICE) deploy ENV=$(ENV)
	@echo "$(GREEN)✅ Service $(SERVICE) deployed$(NC)"

deploy-infra: ## Deploy infrastructure changes
	@echo "$(YELLOW)🏗️  Deploying infrastructure...$(NC)"
	$(call validate-env)
	$(call validate-doppler)
	@if [ -d "infra/terraform" ]; then \
		cd infra/terraform && \
		$(call doppler-exec,terraform init) && \
		$(call doppler-exec,terraform plan -var="environment=$(ENV)") && \
		$(call doppler-exec,terraform apply -auto-approve -var="environment=$(ENV)"); \
	else \
		echo "$(YELLOW)⚠️  No Terraform infrastructure found$(NC)"; \
	fi
	@echo "$(GREEN)✅ Infrastructure deployed$(NC)"

# Health check targets
.PHONY: health-check-all health-check-app health-check-service

health-check-all: ## Check health of all deployed applications and services
	@echo "$(BLUE)🏥 Health checking all applications and services$(NC)"
	@echo "================================================="
	$(call validate-env)
	@for app in $$(find apps -maxdepth 1 -type d -not -path apps | xargs -r basename -a); do \
		if [ -f "apps/$$app/Makefile" ]; then \
			echo "$(YELLOW)🏥 Health checking app: $$app$(NC)"; \
			$(MAKE) -C apps/$$app health-check ENV=$(ENV) || echo "$(RED)❌ Health check failed for app: $$app$(NC)"; \
		fi; \
	done
	@for service in $$(find services -maxdepth 1 -type d -not -path services | xargs -r basename -a); do \
		if [ -f "services/$$service/Makefile" ]; then \
			echo "$(YELLOW)🏥 Health checking service: $$service$(NC)"; \
			$(MAKE) -C services/$$service health-check ENV=$(ENV) || echo "$(RED)❌ Health check failed for service: $$service$(NC)"; \
		fi; \
	done
	@echo "$(GREEN)✅ All health checks completed$(NC)"

health-check-app: ## Health check specific app (usage: make health-check-app APP=landing-page ENV=development)
	@if [ -z "$(APP)" ]; then \
		echo "$(RED)❌ APP parameter required. Usage: make health-check-app APP=landing-page$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "apps/$(APP)/Makefile" ]; then \
		echo "$(RED)❌ Makefile not found: apps/$(APP)/Makefile$(NC)"; \
		exit 1; \
	fi
	$(call validate-env)
	@echo "$(YELLOW)🏥 Health checking app: $(APP)$(NC)"
	$(MAKE) -C apps/$(APP) health-check ENV=$(ENV)

health-check-service: ## Health check specific service (usage: make health-check-service SERVICE=accounts ENV=development)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)❌ SERVICE parameter required. Usage: make health-check-service SERVICE=accounts$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "services/$(SERVICE)/Makefile" ]; then \
		echo "$(RED)❌ Makefile not found: services/$(SERVICE)/Makefile$(NC)"; \
		exit 1; \
	fi
	$(call validate-env)
	@echo "$(YELLOW)🏥 Health checking service: $(SERVICE)$(NC)"
	$(MAKE) -C services/$(SERVICE) health-check ENV=$(ENV)

# Help target
help: ## Show this help message
	@echo "$(BLUE)🚀 Copilot Monorepo Universal Deployment$(NC)"
	@echo "========================================="
	@echo ""
	@echo "$(YELLOW)Environment: $(ENV)$(NC)"
	@echo "$(YELLOW)Doppler Project: $(DOPPLER_PROJECT)$(NC)"
	@echo ""
	@echo "$(BLUE)🔧 Setup Commands:$(NC)"
	@echo "  setup-env      Setup development environment"
	@echo "  check-deps     Check required dependencies"
	@echo "  status         Show current configuration status"
	@echo ""
	@echo "$(BLUE)🧪 Testing Commands:$(NC)"
	@echo "  test-all       Run tests for all apps and services"
	@echo "  test-app       Test specific app (APP=name)"
	@echo "  test-service   Test specific service (SERVICE=name)"
	@echo ""
	@echo "$(BLUE)🚀 Deployment Commands:$(NC)"
	@echo "  deploy-all     Deploy all applications and services"
	@echo "  deploy-app     Deploy specific app (APP=name ENV=env)"
	@echo "  deploy-service Deploy specific service (SERVICE=name ENV=env)"
	@echo "  deploy-infra   Deploy infrastructure changes"
	@echo ""
	@echo "$(BLUE)🏥 Health Check Commands:$(NC)"
	@echo "  health-check-all     Health check all deployed apps"
	@echo "  health-check-app     Health check specific app (APP=name ENV=env)"
	@echo "  health-check-service Health check specific service (SERVICE=name ENV=env)"
	@echo ""
	@echo "$(BLUE)📖 Documentation:$(NC)"
	@echo "  list-apps      List all available applications"
	@echo "  list-services  List all available services"
	@echo "  show-template  Show app Makefile template"
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make deploy-app APP=landing-page ENV=development"
	@echo "  make deploy-service SERVICE=accounts ENV=production"
	@echo "  make test-app APP=landing-page"
	@echo "  make health-check-all ENV=development"
	@echo ""
	@echo "$(BLUE)Environment Variables:$(NC)"
	@echo "  ENV              Target environment (development|staging|production)"
	@echo "  DOPPLER_PROJECT  Doppler project name (default: copilot-monorepo)"
	@echo "  APP              Application name for app-specific commands"
	@echo "  SERVICE          Service name for service-specific commands"