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
  type      = string
  sensitive = true
}

output "doppler_project" {
  value = "your-project"
}
