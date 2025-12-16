terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

# Provider configuration is in root module
# This module receives the configured provider from the parent

variable "github_token" {
  type        = string
  description = "GitHub personal access token with repo and admin:org permissions"
  sensitive   = true
}

variable "github_owner" {
  type        = string
  description = "GitHub organization or user name"
  default     = "TomRiddelsdell"
}

variable "github_repository" {
  type        = string
  description = "GitHub repository name"
  default     = "tomriddelsdell.com"
}

variable "doppler_token_ci" {
  type        = string
  description = "Doppler service token for CI environment"
  sensitive   = true
}

variable "doppler_token_stg" {
  type        = string
  description = "Doppler service token for staging environment"
  sensitive   = true
}

variable "doppler_token_prd" {
  type        = string
  description = "Doppler service token for production environment"
  sensitive   = true
}

# GitHub Actions secrets for Doppler tokens
resource "github_actions_secret" "doppler_token_ci" {
  repository      = var.github_repository
  secret_name     = "DOPPLER_TOKEN_CI"
  plaintext_value = var.doppler_token_ci
}

resource "github_actions_secret" "doppler_token_stg" {
  repository      = var.github_repository
  secret_name     = "DOPPLER_TOKEN_STG"
  plaintext_value = var.doppler_token_stg
}

resource "github_actions_secret" "doppler_token_prd" {
  repository      = var.github_repository
  secret_name     = "DOPPLER_TOKEN_PROD"
  plaintext_value = var.doppler_token_prd
}

output "github_secrets_created" {
  description = "List of GitHub secrets created"
  value = [
    github_actions_secret.doppler_token_ci.secret_name,
    github_actions_secret.doppler_token_stg.secret_name,
    github_actions_secret.doppler_token_prd.secret_name,
  ]
}
