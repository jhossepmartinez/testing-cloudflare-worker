terraform {
  cloud {
    organization = "answer-me"

    workspaces {
      name = "answer-me-staging"
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
  name       = "${var.project}-staging"
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
  name               = "${var.project}-staging"
  tags               = ["staging"]

  bindings = [
    {
      name = "OPENAI_API_KEY"
      type = "secret_text"
      text = var.openai_api_key
    },
    {
      name = "GH_CLIENT_ID"
      type = "secret_text"
      text = var.gh_client_id
    },
    {
      name = "GH_CLIENT_SECRET"
      type = "secret_text"
      text = var.gh_client_secret
    },
    {
      name = "JWT_SECRET"
      type = "secret_text"
      text = var.jwt_secret
    },
    {
      name         = "RATE_LIMIT"
      namespace_id = "1101"
      type         = "ratelimit"
      simple = {
        limit  = 5
        period = 60
      }
    },
    {
      name = "DB"
      type = "d1"
      id   = cloudflare_d1_database.this.id
    },
    {
      name    = "ANALYTICS"
      type    = "analytics_engine"
      dataset = "engine"
    }
  ]
}
