output "d1_database_id" {
  description = "Staging D1 database ID (used for Drizzle migrations)"
  value       = cloudflare_d1_database.this.id
}

output "worker_subdomain" {
  description = "Staging worker subdomain"
  value       = module.worker.subdomain
  sensitive   = true
}
