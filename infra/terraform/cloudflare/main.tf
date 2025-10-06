terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Variables
variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token with appropriate permissions"
}

variable "cloudflare_account_id" {
  type        = string
  sensitive   = true
  description = "Cloudflare Account ID"
}

variable "domain_name" {
  type        = string
  description = "Primary domain name"
}

variable "github_owner" {
  type        = string
  description = "GitHub repository owner"
}

variable "github_repo_name" {
  type        = string
  description = "GitHub repository name"
}

variable "git_repository_url" {
  type        = string
  description = "Git repository URL for Pages deployment"
}

# Data sources
data "cloudflare_zone" "main" {
  name = var.domain_name
}

# DNS Records for Pages Project
# Note: Pages project created manually via wrangler CLI
# These records point to the existing Pages deployment
resource "cloudflare_record" "www_cname" {
  zone_id         = data.cloudflare_zone.main.id
  name            = "www"
  content         = "landing-page-8t9.pages.dev"
  type            = "CNAME"
  ttl             = 1
  allow_overwrite = true
  comment         = "Production alias for landing page"
}

resource "cloudflare_record" "develop_cname" {
  zone_id         = data.cloudflare_zone.main.id
  name            = "develop"
  content         = "landing-page-8t9.pages.dev"
  type            = "CNAME"
  ttl             = 1
  allow_overwrite = true
  comment         = "Staging/preview alias for landing page"
}

# Root domain redirect to www
resource "cloudflare_record" "root_cname" {
  zone_id         = data.cloudflare_zone.main.id
  name            = "@"
  content         = "landing-page-8t9.pages.dev"
  type            = "CNAME"
  ttl             = 1
  allow_overwrite = true
  comment         = "Root domain redirect to Pages"
}

# Outputs
output "cloudflare_account_id" {
  value       = var.cloudflare_account_id
  sensitive   = true
  description = "Cloudflare Account ID"
}

output "staging_url" {
  value       = "https://develop.${var.domain_name}"
  description = "Staging deployment URL"
}

output "production_url" {
  value       = "https://www.${var.domain_name}"
  description = "Production deployment URL"
}

output "zone_id" {
  value       = data.cloudflare_zone.main.id
  description = "Cloudflare Zone ID for the domain"
}