# Cloudflare deployment functions
# Include this file: include ../../deploy/cloudflare.mk

# Cloudflare configuration
CLOUDFLARE_ACCOUNT_ID := $(shell doppler secrets get CLOUDFLARE_ACCOUNT_ID --plain --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG) 2>/dev/null || echo "")
WRANGLER_CONFIG := wrangler.toml

# Check Wrangler authentication
define check-wrangler
	@echo "$(YELLOW)☁️  Checking Wrangler authentication...$(NC)"
	@if ! wrangler whoami >/dev/null 2>&1; then \
		echo "$(RED)❌ Wrangler authentication failed$(NC)"; \
		echo "$(YELLOW)💡 Run: wrangler login$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Wrangler authenticated$(NC)"
endef

# Validate Wrangler configuration
define check-wrangler-config
	@echo "$(YELLOW)☁️  Checking Wrangler configuration...$(NC)"
	$(call require-file,$(WRANGLER_CONFIG))
	@echo "$(GREEN)✅ Wrangler configuration found$(NC)"
endef

# Deploy Cloudflare Worker
define deploy-cloudflare-worker
	@echo "$(YELLOW)☁️  Deploying Cloudflare Worker to $(ENV)...$(NC)"
	$(call check-wrangler)
	$(call check-wrangler-config)
	$(call validate-doppler)
	@if [ "$(ENV)" = "production" ]; then \
		$(call doppler-exec,wrangler deploy --env production); \
	else \
		$(call doppler-exec,wrangler deploy --env development); \
	fi
	@echo "$(GREEN)✅ Cloudflare Worker deployed$(NC)"
endef

# Deploy OpenNext Cloudflare (Next.js as Worker)
define deploy-opennext-cloudflare
	@echo "$(YELLOW)☁️  Deploying OpenNext Cloudflare to $(ENV)...$(NC)"
	$(call check-wrangler)
	$(call validate-doppler)
	@echo "$(YELLOW)🔐 Running with Doppler secrets ($(DOPPLER_CONFIG))...$(NC)"; \
	if [ "$(ENV)" = "production" ]; then \
		doppler run --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG) -- pnpm opennextjs-cloudflare deploy --env production; \
	else \
		doppler run --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG) -- pnpm opennextjs-cloudflare deploy --env preview; \
	fi
	@echo "$(GREEN)✅ OpenNext Cloudflare deployed$(NC)"
endef

# Deploy Cloudflare Pages
define deploy-cloudflare-pages
	@echo "$(YELLOW)☁️  Deploying Cloudflare Pages to $(ENV)...$(NC)"
	$(call check-wrangler)
	$(call validate-build)
	$(call validate-doppler)
	@if [ -d ".open-next" ]; then BUILD_OUTPUT_DIR=".open-next"; \
	elif [ -d "out" ]; then BUILD_OUTPUT_DIR="out"; \
	elif [ -d "dist" ]; then BUILD_OUTPUT_DIR="dist"; \
	elif [ -d ".next" ]; then BUILD_OUTPUT_DIR=".next"; \
	else BUILD_OUTPUT_DIR="build"; fi; \
	echo "$(YELLOW)📦 Using build output: $$BUILD_OUTPUT_DIR$(NC)"; \
	echo "$(YELLOW)🧹 Removing cache directory to meet Cloudflare Pages 25 MiB file size limit...$(NC)"; \
	rm -rf .next/cache .open-next/cache; \
	echo "$(YELLOW)🔐 Running with Doppler secrets ($(DOPPLER_CONFIG))...$(NC)"; \
	if [ "$(ENV)" = "production" ]; then \
		doppler run --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG) -- wrangler pages deploy ./$$BUILD_OUTPUT_DIR --project-name=$(shell basename $(CURDIR)) --branch main; \
	elif [ "$(ENV)" = "staging" ]; then \
		doppler run --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG) -- wrangler pages deploy ./$$BUILD_OUTPUT_DIR --project-name=$(shell basename $(CURDIR)) --branch develop; \
	else \
		doppler run --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG) -- wrangler pages deploy ./$$BUILD_OUTPUT_DIR --project-name=$(shell basename $(CURDIR)) --branch develop; \
	fi
	@echo "$(GREEN)✅ Cloudflare Pages deployed$(NC)"
endef

# Test Wrangler deployment (dry-run)
define test-wrangler-deploy
	@echo "$(YELLOW)🧪 Testing Wrangler deployment (dry-run)...$(NC)"
	$(call check-wrangler)
	$(call check-wrangler-config)
	$(call validate-doppler)
	$(call doppler-exec,wrangler deploy --dry-run --env $(ENV))
	@echo "$(GREEN)✅ Wrangler dry-run successful$(NC)"
endef

# Cloudflare Worker health check
define health-check-worker
	@echo "$(YELLOW)🏥 Health checking Cloudflare Worker...$(NC)"
	@WORKER_URL=$$($(call doppler-run,$(DOPPLER_CONFIG)) wrangler deployment list --env $(ENV) --format json 2>/dev/null | jq -r '.[0].url // empty' 2>/dev/null || echo ""); \
	if [ -n "$$WORKER_URL" ]; then \
		$(call health-check-url,$$WORKER_URL/health); \
	else \
		echo "$(YELLOW)⚠️  Could not determine Worker URL$(NC)"; \
	fi
endef

# Cloudflare Pages health check
define health-check-pages
	@echo "$(YELLOW)🏥 Health checking Cloudflare Pages...$(NC)"
	@echo "$(YELLOW)💡 Checking deployment at: https://develop.$(shell basename $(CURDIR))-8t9.pages.dev$(NC)"
	@if curl -f -s "https://develop.$(shell basename $(CURDIR))-8t9.pages.dev" > /dev/null; then \
		echo "$(GREEN)✅ Cloudflare Pages is healthy$(NC)"; \
	else \
		echo "$(RED)❌ Cloudflare Pages is not responding$(NC)"; \
	fi
endef

# Cloudflare KV operations
define kv-create-namespace
	@echo "$(YELLOW)☁️  Creating KV namespace: $(1)$(NC)"
	$(call doppler-exec,wrangler kv namespace create $(1) --env $(ENV))
endef

define kv-put-value
	@echo "$(YELLOW)☁️  Setting KV value: $(1)=$(2)$(NC)"
	$(call doppler-exec,wrangler kv key put --binding=$(1) $(2) $(3) --env $(ENV))
endef

# Wrangler logs
define tail-worker-logs
	@echo "$(YELLOW)📝 Tailing Worker logs...$(NC)"
	$(call doppler-exec,wrangler tail --env $(ENV))
endef

# Development server
define start-wrangler-dev
	@echo "$(YELLOW)🚀 Starting Wrangler development server...$(NC)"
	$(call validate-doppler)
	$(call doppler-exec,wrangler dev --env development --local)
endef

# Cloudflare R2 operations
define r2-create-bucket
	@echo "$(YELLOW)☁️  Creating R2 bucket: $(1)$(NC)"
	$(call doppler-exec,wrangler r2 bucket create $(1))
endef

define r2-upload-file
	@echo "$(YELLOW)☁️  Uploading to R2: $(1) -> $(2)$(NC)"
	$(call doppler-exec,wrangler r2 object put $(1) --file $(2))
endef

# Worker deployment with custom name
define deploy-worker-with-name
	@echo "$(YELLOW)☁️  Deploying Worker '$(1)' to $(ENV)...$(NC)"
	$(call check-wrangler)
	$(call validate-doppler)
	$(call doppler-exec,wrangler deploy --name $(1) --env $(ENV))
	@echo "$(GREEN)✅ Worker '$(1)' deployed$(NC)"
endef

# Get deployment URLs
define get-deployment-urls
	@echo "$(BLUE)🔗 Deployment URLs$(NC)"
	@echo "=================="
	@echo "Worker URL: $$($(call doppler-run,$(DOPPLER_CONFIG)) wrangler deployment list --env $(ENV) --format json 2>/dev/null | jq -r '.[0].url // "Not found"' 2>/dev/null || echo "Not available")"
	@echo "Pages URL: $$($(call doppler-run,$(DOPPLER_CONFIG)) wrangler pages deployment list --project-name=$(shell basename $(CURDIR)) --format json 2>/dev/null | jq -r '.[0].url // "Not found"' 2>/dev/null || echo "Not available")"
endef

# Common Cloudflare targets
.PHONY: cf-status cf-logs cf-dev

cf-status: ## Show Cloudflare deployment status
	@echo "$(BLUE)☁️  Cloudflare Status$(NC)"
	@echo "===================="
	@echo "Account ID: $(CLOUDFLARE_ACCOUNT_ID)"
	@echo "Environment: $(ENV)"
	@$(call get-deployment-urls)

cf-logs: ## Tail Cloudflare Worker logs
	$(call tail-worker-logs)

cf-dev: ## Start Cloudflare development server
	$(call start-wrangler-dev)