terraform {
  required_providers {
    doppler = {
      source  = "DopplerHQ/doppler"
      version = "~> 1.20"
    }
  }
}

provider "doppler" {
  doppler_token = var.doppler_token
}

variable "doppler_token" {
  type        = string
  description = "Doppler API token with admin access"
  sensitive   = true
}

variable "project_name" {
  type        = string
  description = "Doppler project name"
  default     = "tomriddelsdell-infra"
}

# Service tokens for GitHub Actions CI/CD
resource "doppler_service_token" "github_actions_ci" {
  project = var.project_name
  config  = "ci"
  name    = "github-actions-ci"
  access  = "read"
}

resource "doppler_service_token" "github_actions_stg" {
  project = var.project_name
  config  = "stg"
  name    = "github-actions-stg"
  access  = "read"
}

resource "doppler_service_token" "github_actions_prd" {
  project = var.project_name
  config  = "prd"
  name    = "github-actions-prd"
  access  = "read"
}

# Outputs for GitHub Actions secrets
output "doppler_token_ci" {
  description = "Service token for CI environment (add to GitHub secrets as DOPPLER_TOKEN_CI)"
  value       = doppler_service_token.github_actions_ci.key
  sensitive   = true
}

output "doppler_token_stg" {
  description = "Service token for staging environment (add to GitHub secrets as DOPPLER_TOKEN_STG)"
  value       = doppler_service_token.github_actions_stg.key
  sensitive   = true
}

output "doppler_token_prd" {
  description = "Service token for production environment (add to GitHub secrets as DOPPLER_TOKEN_PROD)"
  value       = doppler_service_token.github_actions_prd.key
  sensitive   = true
}
