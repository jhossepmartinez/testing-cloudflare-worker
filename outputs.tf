output "d1_database_id" {
  description = "The ID of the D1 database (needed for Drizzle migrations)"
  value       = cloudflare_d1_database.this.id
}
