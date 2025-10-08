# AWS deployment functions
# Include this file: include ../../deploy/aws.mk

# AWS configuration
AWS_REGION := $(shell doppler secrets get AWS_REGION --plain --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG) 2>/dev/null || echo "us-east-1")
AWS_ACCOUNT_ID := $(shell doppler secrets get AWS_ACCOUNT_ID --plain --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG) 2>/dev/null || echo "")
ECR_REGISTRY := $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com

# Check AWS CLI authentication
define check-aws
	@echo "$(YELLOW)☁️  Checking AWS authentication...$(NC)"
	@if ! aws sts get-caller-identity >/dev/null 2>&1; then \
		echo "$(RED)❌ AWS authentication failed$(NC)"; \
		echo "$(YELLOW)💡 Check AWS credentials and run: aws configure$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ AWS authenticated$(NC)"
	@echo "Account: $$(aws sts get-caller-identity --query Account --output text)"
	@echo "Region: $(AWS_REGION)"
endef

# Docker operations
define docker-build
	@echo "$(YELLOW)🐳 Building Docker image...$(NC)"
	$(call require-file,Dockerfile)
	@docker build -t $(1):$(ENV) .
	@docker tag $(1):$(ENV) $(1):latest
	@echo "$(GREEN)✅ Docker image built: $(1):$(ENV)$(NC)"
endef

define docker-tag-for-ecr
	@echo "$(YELLOW)🐳 Tagging image for ECR...$(NC)"
	@docker tag $(1):$(ENV) $(ECR_REGISTRY)/$(1):$(ENV)
	@docker tag $(1):$(ENV) $(ECR_REGISTRY)/$(1):latest
	@echo "$(GREEN)✅ Docker image tagged for ECR$(NC)"
endef

define docker-push-to-ecr
	@echo "$(YELLOW)🐳 Pushing to ECR...$(NC)"
	$(call check-aws)
	@aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REGISTRY)
	@aws ecr describe-repositories --repository-names $(1) --region $(AWS_REGION) >/dev/null 2>&1 || \
		aws ecr create-repository --repository-name $(1) --region $(AWS_REGION)
	@docker push $(ECR_REGISTRY)/$(1):$(ENV)
	@docker push $(ECR_REGISTRY)/$(1):latest
	@echo "$(GREEN)✅ Docker image pushed to ECR$(NC)"
endef

# ECS operations
define deploy-to-ecs
	@echo "$(YELLOW)☁️  Deploying to ECS...$(NC)"
	$(call check-aws)
	@if [ -f "deploy/ecs-task-definition.json" ]; then \
		echo "$(YELLOW)📋 Updating ECS task definition...$(NC)"; \
		aws ecs register-task-definition \
			--cli-input-json file://deploy/ecs-task-definition.json \
			--region $(AWS_REGION); \
		echo "$(YELLOW)🔄 Updating ECS service...$(NC)"; \
		aws ecs update-service \
			--cluster $(1) \
			--service $(2) \
			--task-definition $(2):LATEST \
			--force-new-deployment \
			--region $(AWS_REGION); \
	else \
		echo "$(RED)❌ ECS task definition not found: deploy/ecs-task-definition.json$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ ECS deployment initiated$(NC)"
endef

# Lambda operations
define deploy-to-lambda
	@echo "$(YELLOW)☁️  Deploying to Lambda...$(NC)"
	$(call check-aws)
	@if [ -f "function.zip" ]; then \
		aws lambda update-function-code \
			--function-name $(1) \
			--zip-file fileb://function.zip \
			--region $(AWS_REGION); \
	elif [ -f "Dockerfile" ]; then \
		echo "$(YELLOW)🐳 Building Lambda container...$(NC)"; \
		$(call docker-build,$(1)); \
		$(call docker-tag-for-ecr,$(1)); \
		$(call docker-push-to-ecr,$(1)); \
		aws lambda update-function-code \
			--function-name $(1) \
			--image-uri $(ECR_REGISTRY)/$(1):$(ENV) \
			--region $(AWS_REGION); \
	else \
		echo "$(RED)❌ No deployment package found (function.zip or Dockerfile)$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Lambda function updated$(NC)"
endef

# S3 operations
define deploy-to-s3
	@echo "$(YELLOW)☁️  Deploying to S3...$(NC)"
	$(call check-aws)
	$(call validate-build)
	@if [ -d "dist" ]; then \
		aws s3 sync dist/ s3://$(1) --delete --region $(AWS_REGION); \
	elif [ -d "build" ]; then \
		aws s3 sync build/ s3://$(1) --delete --region $(AWS_REGION); \
	else \
		echo "$(RED)❌ No build directory found (dist or build)$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ S3 deployment completed$(NC)"
endef

# CloudFront invalidation
define invalidate-cloudfront
	@echo "$(YELLOW)☁️  Invalidating CloudFront cache...$(NC)"
	$(call check-aws)
	@aws cloudfront create-invalidation \
		--distribution-id $(1) \
		--paths "/*" \
		--region $(AWS_REGION)
	@echo "$(GREEN)✅ CloudFront cache invalidated$(NC)"
endef

# Terraform operations
define terraform-init
	@echo "$(YELLOW)🏗️  Initializing Terraform...$(NC)"
	$(call check-aws)
	@if [ -d "deploy/terraform" ]; then \
		cd deploy/terraform && \
		$(call doppler-exec,terraform init); \
	else \
		echo "$(RED)❌ Terraform directory not found: deploy/terraform$(NC)"; \
		exit 1; \
	fi
endef

define terraform-plan
	@echo "$(YELLOW)🏗️  Planning Terraform changes...$(NC)"
	$(call terraform-init)
	@cd deploy/terraform && \
	$(call doppler-exec,terraform plan -var="environment=$(ENV)")
endef

define terraform-apply
	@echo "$(YELLOW)🏗️  Applying Terraform changes...$(NC)"
	$(call terraform-init)
	@cd deploy/terraform && \
	$(call doppler-exec,terraform apply -auto-approve -var="environment=$(ENV)")
	@echo "$(GREEN)✅ Terraform applied$(NC)"
endef

# RDS operations
define check-rds-health
	@echo "$(YELLOW)🏥 Checking RDS health...$(NC)"
	$(call check-aws)
	@aws rds describe-db-instances \
		--db-instance-identifier $(1) \
		--query 'DBInstances[0].DBInstanceStatus' \
		--output text \
		--region $(AWS_REGION)
endef

# Health checks for AWS services
define health-check-ecs-service
	@echo "$(YELLOW)🏥 Health checking ECS service...$(NC)"
	$(call check-aws)
	@SERVICE_STATUS=$$(aws ecs describe-services \
		--cluster $(1) \
		--services $(2) \
		--query 'services[0].status' \
		--output text \
		--region $(AWS_REGION) 2>/dev/null || echo "NOT_FOUND"); \
	if [ "$$SERVICE_STATUS" = "ACTIVE" ]; then \
		echo "$(GREEN)✅ ECS service $(2) is healthy$(NC)"; \
	else \
		echo "$(RED)❌ ECS service $(2) status: $$SERVICE_STATUS$(NC)"; \
		exit 1; \
	fi
endef

define health-check-lambda
	@echo "$(YELLOW)🏥 Health checking Lambda function...$(NC)"
	$(call check-aws)
	@FUNCTION_STATE=$$(aws lambda get-function \
		--function-name $(1) \
		--query 'Configuration.State' \
		--output text \
		--region $(AWS_REGION) 2>/dev/null || echo "NOT_FOUND"); \
	if [ "$$FUNCTION_STATE" = "Active" ]; then \
		echo "$(GREEN)✅ Lambda function $(1) is healthy$(NC)"; \
	else \
		echo "$(RED)❌ Lambda function $(1) state: $$FUNCTION_STATE$(NC)"; \
		exit 1; \
	fi
endef

# Complete deployment workflow for containerized apps
define deploy-container-to-aws
	@echo "$(YELLOW)🚀 Deploying containerized app to AWS...$(NC)"
	$(call docker-build,$(1))
	$(call docker-tag-for-ecr,$(1))
	$(call docker-push-to-ecr,$(1))
	$(call deploy-to-ecs,$(2),$(1))
	@echo "$(GREEN)✅ Container deployment completed$(NC)"
endef

# AWS deployment with Terraform
define deploy-with-terraform
	@echo "$(YELLOW)🚀 Deploying with Terraform...$(NC)"
	$(call terraform-apply)
	@echo "$(GREEN)✅ Terraform deployment completed$(NC)"
endef

# Common AWS targets
.PHONY: aws-status aws-logs aws-deploy-infra

aws-status: ## Show AWS deployment status
	@echo "$(BLUE)☁️  AWS Status$(NC)"
	@echo "==============="
	@echo "Account ID: $(AWS_ACCOUNT_ID)"
	@echo "Region: $(AWS_REGION)"
	@echo "ECR Registry: $(ECR_REGISTRY)"
	$(call check-aws)

aws-logs: ## Get AWS CloudWatch logs
	@echo "$(YELLOW)📝 AWS CloudWatch logs not implemented yet$(NC)"
	@echo "$(YELLOW)💡 Use: aws logs tail /aws/lambda/function-name --follow$(NC)"

aws-deploy-infra: ## Deploy AWS infrastructure with Terraform
	$(call deploy-with-terraform)