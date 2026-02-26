variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "openai_api_key" {
  description = "OPENAI API key"
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

variable "gh_client_secret" {
  description = "Github OAuth application client secret"
  type        = string
}

variable "gh_client_id" {
  description = "Github OAuth application client id"
  type        = string
}

variable "jwt_secret" {
  description = "JWT secret used for signing and verifying the authorization header token"
  type        = string
}

