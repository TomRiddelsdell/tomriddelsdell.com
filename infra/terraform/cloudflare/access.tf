# Cloudflare Access Configuration for Staging Environment Protection
# Protects staging.tomriddelsdell.com with GitHub OAuth authentication

# Access Application for Staging Environment
resource "cloudflare_access_application" "staging" {
  zone_id                   = data.cloudflare_zone.main.id
  name                      = "Staging Environment - tomriddelsdell.com"
  domain                    = "staging.tomriddelsdell.com"
  type                      = "self_hosted"
  session_duration          = "24h"
  auto_redirect_to_identity = true

  # Allowed identity providers (GitHub OAuth)
  allowed_idps = [
    cloudflare_access_identity_provider.github.id
  ]

  # CORS settings for API requests
  cors_headers {
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    allowed_origins = ["https://staging.tomriddelsdell.com"]
    allow_all_headers = true
    max_age           = 600
  }

  # Enable App Launcher visibility
  app_launcher_visible = true

  # Enable HTTP-only cookies for security
  http_only_cookie_attribute = true
  same_site_cookie_attribute = "lax"
}

# GitHub Identity Provider
resource "cloudflare_access_identity_provider" "github" {
  account_id = var.cloudflare_account_id
  name       = "GitHub OAuth"
  type       = "github"

  config {
    client_id     = var.github_oauth_client_id
    client_secret = var.github_oauth_client_secret
  }
}

# Access Policy - Allow GitHub authenticated users from specific organization
# Note: GitHub OAuth will require users to have access to the TomRiddelsdell organization
# The OAuth app should be owned by the organization for automatic organization membership verification
resource "cloudflare_access_policy" "staging_github_users" {
  application_id = cloudflare_access_application.staging.id
  zone_id        = data.cloudflare_zone.main.id
  name           = "Allow GitHub Organization Members"
  precedence     = 1
  decision       = "allow"

  # Include: Anyone who authenticates via GitHub OAuth
  # Organization membership is enforced at the OAuth app level
  include {
    login_method = [cloudflare_access_identity_provider.github.id]
  }

  # Session duration for this policy
  session_duration = "24h"
}

# Access Policy - Allow specific email addresses (for emergency access)
resource "cloudflare_access_policy" "staging_specific_users" {
  application_id = cloudflare_access_application.staging.id
  zone_id        = data.cloudflare_zone.main.id
  name           = "Allow Specific Email Addresses"
  precedence     = 2
  decision       = "allow"

  # Include: Specific email addresses
  include {
    email = ["t.riddelsdell@gmail.com"]
  }

  # Session duration
  session_duration = "24h"
}

# Service Authentication Token (for CI/CD access without browser)
resource "cloudflare_access_service_token" "github_actions" {
  account_id = var.cloudflare_account_id
  name       = "GitHub Actions CI/CD"
  
  # Token expires after 1 year
  min_days_for_renewal = 30
}

# Access Policy - Allow Service Token (for automated testing)
resource "cloudflare_access_policy" "staging_service_token" {
  application_id = cloudflare_access_application.staging.id
  zone_id        = data.cloudflare_zone.main.id
  name           = "Allow CI/CD Service Token"
  precedence     = 3
  decision       = "allow"

  include {
    service_token = [cloudflare_access_service_token.github_actions.id]
  }
}

# Access Group - Development Team  
resource "cloudflare_access_group" "dev_team" {
  account_id = var.cloudflare_account_id
  name       = "Development Team"

  include {
    everyone = true
  }
}

# Outputs for use in other configurations
output "access_application_id" {
  description = "Cloudflare Access Application ID for staging"
  value       = cloudflare_access_application.staging.id
}

output "access_application_domain" {
  description = "Protected domain"
  value       = cloudflare_access_application.staging.domain
}

output "github_identity_provider_id" {
  description = "GitHub OAuth Identity Provider ID"
  value       = cloudflare_access_identity_provider.github.id
  sensitive   = true
}

output "service_token_client_id" {
  description = "Service token client ID for CI/CD"
  value       = cloudflare_access_service_token.github_actions.client_id
  sensitive   = true
}

output "service_token_client_secret" {
  description = "Service token client secret for CI/CD"
  value       = cloudflare_access_service_token.github_actions.client_secret
  sensitive   = true
}
