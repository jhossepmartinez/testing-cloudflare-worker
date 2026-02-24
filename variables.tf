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

variable "supabase_access_token" {
  type = string
}

variable "supabase_organization_slug" {
  type = string
}
