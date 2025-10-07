# Doppler Configuration
variable "doppler_admin_token" {
  type        = string
  description = "Doppler API token with admin access to manage service tokens"
  sensitive   = true
}

variable "doppler_project_name" {
  type        = string
  description = "Doppler project name"
  default     = "tomriddelsdell-infra"
}

# GitHub Configuration
variable "github_token" {
  type        = string
  description = "GitHub personal access token with repo and secrets:write permissions"
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

# Cloudflare Configuration
variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
  sensitive   = true
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token with Pages and DNS permissions"
  sensitive   = true
}

variable "domain_name" {
  type        = string
  description = "Primary domain name"
  default     = "tomriddelsdell.com"
}

# GitHub OAuth Configuration (for Cloudflare Access)
variable "github_oauth_client_id" {
  type        = string
  description = "GitHub OAuth application client ID for Cloudflare Access"
  sensitive   = true
}

variable "github_oauth_client_secret" {
  type        = string
  description = "GitHub OAuth application client secret for Cloudflare Access"
  sensitive   = true
}

variable "git_repository_url" {
  type        = string
  description = "Git repository URL for Cloudflare Pages"
  default     = "https://github.com/TomRiddelsdell/tomriddelsdell.com"
}
