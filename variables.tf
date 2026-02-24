variable "cloudflare_api_token" {
  type = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare account id"
  type        = string
}

variable "workers" {
  type = map(object({
    name = string
  }))
  default = {
    "woker-1" = {
      name = "worker-1"
    },
  }
}

variable "google_api_key" {
  type = string
}

variable "cloudflare_d1_database_id" {
  description = "Cloudflare D1 database ID (needed for Drizzle migrations)"
  type        = string
  default     = ""
}

variable "terraform_api_token" {
  type = string
}
