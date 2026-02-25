terraform {
  cloud {
    organization = "answer-me"

    workspaces {
      name = "cli-answer-me"
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

resource "random_pet" "this" {}

resource "cloudflare_d1_database" "this" {
  account_id = var.cloudflare_account_id
  name       = random_pet.this.id
  read_replication = {
    mode = "disabled"
  }
}

module "worker" {
  count              = 2
  source             = "github.com/jhossepmartinez/terraform-cloudflare-worker?ref=v0.2.0"
  account_id         = var.cloudflare_account_id
  compatibility_date = "2026-02-21"
  main_module        = "index.js"
  main_module_path   = "dist/index.js"
  name               = "${random_pet.this.id}-${count.index}"
  tags               = ["temp", "hihi"]

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

