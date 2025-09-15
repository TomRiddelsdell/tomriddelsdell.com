terraform {
  required_providers {
    neon = {
      source  = "neondatabase/neon"
      version = "~> 0.2"
    }
  }
}

provider "neon" {
  api_key = var.neon_api_key
}

variable "neon_api_key" {
  type      = string
  sensitive = true
}

output "neon_project_id" {
  value = "your-project-id"
}
