# Doppler secret management integration
# Include this file: include ../../deploy/doppler.mk

# Doppler configuration
DOPPLER_PROJECT := tomriddelsdell-infra
DOPPLER_CONFIG_DEV := dev
DOPPLER_CONFIG_PROD := prd

# Environment-specific Doppler configs
ifeq ($(ENV),development)
	DOPPLER_CONFIG := $(DOPPLER_CONFIG_DEV)
else ifeq ($(ENV),production)
	DOPPLER_CONFIG := $(DOPPLER_CONFIG_PROD)
else
	DOPPLER_CONFIG := $(DOPPLER_CONFIG_DEV)
endif

# Doppler command wrapper
define doppler-run
	doppler run --project $(DOPPLER_PROJECT) --config $(1) --
endef

# Check Doppler authentication
define check-doppler
	@echo "$(YELLOW)🔐 Checking Doppler authentication...$(NC)"
	@if ! doppler me >/dev/null 2>&1; then \
		echo "$(RED)❌ Doppler authentication failed$(NC)"; \
		echo "$(YELLOW)💡 Run: doppler login$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Doppler authenticated$(NC)"
endef

# Validate Doppler project access
define check-doppler-project
	@echo "$(YELLOW)🔐 Checking Doppler project access...$(NC)"
	@if ! doppler projects get $(DOPPLER_PROJECT) >/dev/null 2>&1; then \
		echo "$(RED)❌ Cannot access Doppler project: $(DOPPLER_PROJECT)$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Doppler project access confirmed$(NC)"
endef

# Validate Doppler config access
define check-doppler-config
	@echo "$(YELLOW)🔐 Checking Doppler config: $(DOPPLER_CONFIG)$(NC)"
	@if ! doppler configs get $(DOPPLER_CONFIG) --project $(DOPPLER_PROJECT) >/dev/null 2>&1; then \
		echo "$(RED)❌ Cannot access Doppler config: $(DOPPLER_CONFIG)$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Doppler config access confirmed$(NC)"
endef

# Full Doppler validation
define validate-doppler
	$(call check-doppler)
	$(call check-doppler-project)
	$(call check-doppler-config)
endef

# Run command with Doppler secrets
define doppler-exec
	@echo "$(YELLOW)🔐 Running with Doppler secrets ($(DOPPLER_CONFIG))...$(NC)"
	$(call doppler-run,$(DOPPLER_CONFIG)) $(1)
endef

# Development environment setup
define doppler-dev-setup
	@echo "$(YELLOW)🔐 Setting up development environment with Doppler...$(NC)"
	@if [ ! -f ".env" ]; then \
		echo "$(YELLOW)📝 Creating .env from Doppler...$(NC)"; \
		$(call doppler-run,$(DOPPLER_CONFIG_DEV)) env > .env.local; \
		echo "$(GREEN)✅ .env.local created$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  .env already exists, skipping$(NC)"; \
	fi
endef

# Service token validation for CI/CD
define check-service-token
	@if [ -n "$(DOPPLER_TOKEN)" ]; then \
		echo "$(GREEN)✅ Doppler service token detected$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  No service token found, using CLI authentication$(NC)"; \
	fi
endef

# Common deployment with secrets
define deploy-with-secrets
	$(call validate-doppler)
	@echo "$(YELLOW)🚀 Deploying with Doppler secrets...$(NC)"
	$(call doppler-exec,$(1))
endef

# Helper targets that can be used in individual Makefiles
.PHONY: doppler-check doppler-dev-env

doppler-check: ## Validate Doppler authentication and access
	$(call validate-doppler)

doppler-dev-env: ## Set up development environment with Doppler
	$(call doppler-dev-setup)

# Makefile integration helpers
doppler-vars: ## Show available Doppler variables for current environment
	@echo "$(BLUE)🔐 Doppler Variables for $(ENV) ($(DOPPLER_CONFIG))$(NC)"
	@echo "=================================================="
	$(call doppler-run,$(DOPPLER_CONFIG)) env | grep -E "^[A-Z_]+" | sort

doppler-status: ## Show Doppler authentication status
	@echo "$(BLUE)🔐 Doppler Status$(NC)"
	@echo "=================="
	@echo "Project: $(DOPPLER_PROJECT)"
	@echo "Config: $(DOPPLER_CONFIG)"
	@echo "Environment: $(ENV)"
	@echo ""
	@doppler me 2>/dev/null || echo "$(RED)❌ Not authenticated$(NC)"