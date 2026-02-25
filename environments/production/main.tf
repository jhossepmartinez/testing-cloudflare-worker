terraform {
  cloud {
    organization = "answer-me"

    workspaces {
      name = "answer-me-production"
    }
  }

  required_version = ">= 1.5"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 5.17, < 6.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_d1_database" "this" {
  account_id = var.cloudflare_account_id
  name       = "${var.project}-production"
  read_replication = {
    mode = "disabled"
  }
}

module "worker" {
  source             = "github.com/jhossepmartinez/terraform-cloudflare-worker?ref=v0.2.0"
  account_id         = var.cloudflare_account_id
  compatibility_date = "2026-02-21"
  main_module        = "index.js"
  main_module_path   = var.main_module_path
  name               = "${var.project}-production"
  tags               = ["production"]

  bindings = [
    {
      name = "GOOGLE_API_KEY"
      type = "secret_text"
      text = var.google_api_key
    },
    {
      name = "DB"
      type = "d1"
      id   = cloudflare_d1_database.this.id
    }
  ]
}
