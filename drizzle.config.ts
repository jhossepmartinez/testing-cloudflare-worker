import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.TF_VAR_cloudflare_account_id!,
    databaseId: process.env.TF_VAR_cloudflare_d1_database_id!,
    token: process.env.TF_VAR_cloudflare_api_token!,
  },
});
