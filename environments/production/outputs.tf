output "d1_database_id" {
  description = "Production D1 database ID (used for Drizzle migrations)"
  value       = cloudflare_d1_database.this.id
}

output "worker_subdomain" {
  description = "Production worker subdomain"
  value       = module.worker.subdomain
  sensitive   = true
}
