variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "google_api_key" {
  description = "Google Gemini API key"
  type        = string
  sensitive   = true
}

variable "project" {
  description = "Project name used as a base for resource naming"
  type        = string
  default     = "qa-worker"
}

variable "main_module_path" {
  description = "Absolute path to the built worker JS bundle on the machine running Terraform"
  type        = string
}
