terraform {
  required_version = ">= 1.9"

  required_providers {
    doppler = {
      source  = "DopplerHQ/doppler"
      version = "~> 1.20"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  # Backend configuration for state management
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Doppler Module - Manages service tokens for CI/CD
module "doppler" {
  source = "./doppler"

  doppler_token = var.doppler_admin_token
  project_name  = var.doppler_project_name
}

# GitHub Module - Syncs Doppler tokens to GitHub secrets
module "github" {
  source = "./github"

  github_token  = var.github_token
  github_owner  = var.github_owner
  github_repository = var.github_repository

  # Pass Doppler service tokens from doppler module
  # Implicit dependency: Terraform waits for module.doppler outputs
  doppler_token_ci  = module.doppler.doppler_token_ci
  doppler_token_stg = module.doppler.doppler_token_stg
  doppler_token_prd = module.doppler.doppler_token_prd
  
  # depends_on removed - implicit dependency through output references is sufficient
}

# Cloudflare Module - Manages Pages deployments
module "cloudflare" {
  source = "./cloudflare"

  cloudflare_account_id       = var.cloudflare_account_id
  cloudflare_api_token        = var.cloudflare_api_token
  domain_name                 = var.domain_name
  git_repository_url          = var.git_repository_url
  github_owner                = var.github_owner
  github_repo_name            = var.github_repository
  github_oauth_client_id      = var.github_oauth_client_id
  github_oauth_client_secret  = var.github_oauth_client_secret
}

# Outputs
output "infrastructure_summary" {
  description = "Summary of managed infrastructure"
  value = {
    doppler_project      = var.doppler_project_name
    github_repository    = "${var.github_owner}/${var.github_repository}"
    github_secrets       = module.github.github_secrets_created
  }
}
