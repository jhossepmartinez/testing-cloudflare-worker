terraform {
  required_version = ">= 1.5"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 5.17, < 6.0"
    }

    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "supabase" {
  access_token = var.supabase_access_token
}

resource "supabase_project" "this" {
  organization_id   = var.supabase_organization_slug
  name              = "db"
  database_password = "db-password"
  region            = "us-east-1"
}

module "worker" {
  for_each = { for worker in var.workers : worker.name => worker }

  source             = "github.com/jhossepmartinez/terraform-cloudflare-worker?ref=v0.2.0"
  account_id         = var.cloudflare_account_id
  compatibility_date = "2026-02-21"
  main_module        = "index.js"
  main_module_path   = "dist/index.js"
  name               = each.value.name
  tags               = ["temp", "hihi"]

  bindings = [
    {
      name = "GOOGLE_API_KEY"
      type = "secret_text"
      text = var.google_api_key
    }
  ]
}

