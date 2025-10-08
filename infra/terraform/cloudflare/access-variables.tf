# Cloudflare Access Variables
# Variables for staging environment protection with GitHub OAuth

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the domain (can be retrieved from data source)"
  type        = string
  default     = ""  # Will be populated from data source if not provided
}

variable "github_oauth_client_id" {
  description = "GitHub OAuth App Client ID for Cloudflare Access"
  type        = string
  sensitive   = true
}

variable "github_oauth_client_secret" {
  description = "GitHub OAuth App Client Secret for Cloudflare Access"
  type        = string
  sensitive   = true
}

variable "github_organization_name" {
  description = "GitHub organization name for team access (e.g., 'TomRiddelsdell')"
  type        = string
  default     = "TomRiddelsdell"
}

variable "staging_allowed_github_users" {
  description = "List of specific GitHub usernames allowed to access staging (in addition to org members)"
  type        = list(string)
  default     = []
}

variable "allowed_email_domains" {
  description = "List of email domains allowed to access staging (optional additional restriction)"
  type        = list(string)
  default     = []
}
