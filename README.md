# Cloudflare Worker Q&A Service

A serverless Q&A API built with TypeScript, OpenAI, Drizzle ORM, and deployed to Cloudflare Workers using Terraform. It showcases modern DevOps best practices, including full environment separation, robust CI/CD, secret management, observability, and infrastructure as code.

---

## Features

- **Staging vs Production**: Isolated environments for safety, reduced blast radius, and integrity
- **Infrastructure-as-Code**: Full worker and database provisioning via Terraform modules ([terraform-cloudflare-worker](https://github.com/jhossepmartinez/terraform-cloudflare-worker))
- **GitHub OAuth**: Secure user authentication with environment-specific secrets and app credentials (separated apps for staging and production)
- **JWT Auth**: HMAC-signed tokens, never shared between environments
- **OpenAI Integration**: Ask questions, get AI-powered answers
- **Rate Limits**: Configurable, enforced via Cloudflare's built-in mechanisms
- **Database**: Durable storage via Cloudflare D1 + Drizzle ORM migrations
- **Observability**: Analytics logged to Cloudflare Analytics Engine, full logging on failures, rate limits, and questions
- **CI/CD**: Automated builds and promotions driven only by GitHub Actions workflows
- **Secret Management**: Environment variables and secrets are sourced from GitHub environment stores and never hardcoded
- **Tradeoffs Documented**: All design decisions favor security and safety

---

## Required Cloudflare Features

Before deploying, you **must** manually enable the following features in your Cloudflare account (for both staging and production environments):

- **Cloudflare Workers**
- **Cloudflare D1 (Database)**
- **Analytics Engine** _(for analytics/logging bindings)_
- **Rate Limiting** _(for per-user rate limiting)_

These features cannot be provisioned automatically and must be set up in your Cloudflare dashboard before the corresponding Terraform apply and CI/CD workflows will succeed.

---

## Architecture Overview

- TypeScript Cloudflare Worker (`src/`) — entrypoint, routing, handlers
- Secrets and environmental configs passed via Terraform to Cloudflare
- Separate `environments/staging` and `environments/production` for complete isolation
- OAuth credentials, OpenAI keys, JWT secrets **never** leak between environments
- GitHub Actions for CI/CD: artifact build-once, promote-to-prod, automated DB migrations

---

## Deployment Guide

### Prerequisites

- [Node.js 24+](https://nodejs.org/en)
- [npm](https://www.npmjs.com/)
- [Terraform 1.5+](https://www.terraform.io/)
- [Cloudflare Account](https://dash.cloudflare.com/) (with the required features enabled, see above)
- [GitHub OAuth Apps](https://github.com/settings/developers) — _**one per environment**_, with callback URLs set to your staging and production Workers

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/testing-cloudflare-worker.git
cd testing-cloudflare-worker
```

### 2. Setup Environment Variables

Create 2 environments in your GitHub repository: one named `staging` and the other `production`. In each environment, populate the following secrets:

| Variable                        | Description                                                  |
|----------------------------------|--------------------------------------------------------------|
| `CLOUDFLARE_ACCOUNT_ID`          | Your Cloudflare Account ID (can be the same for both envs)   |
| `CLOUDFLARE_API_TOKEN`           | API Token for Cloudflare (can be the same for both envs)     |
| `GH_CLIENT_ID`                   | The GitHub OAuth app client ID                              |
| `GH_CLIENT_SECRET`               | The GitHub OAuth app client secret                          |
| `JWT_SECRET`                     | Secret used for hashing the JWT tokens (must be unique per env) |
| `OPENAI_API_KEY`                 | OpenAI API key (ensure sufficient quota/budget)             |
| `TF_API_TOKEN`                   | Terraform Cloud API user token (can be the same for both envs)   |

---

### 3. Database Migrations (Schema Evolution Only)

If you make changes to the database schema TypeScript files (`drizzle` or `src/db/schema.ts`), generate a migration using:

```bash
npm run db:generate
```

This produces migration SQL scripts in `drizzle/`. These scripts will be automatically applied as part of the CI/CD pipeline after a deployment via GitHub Actions. **Do not apply migrations manually.**

---

### 4. CI/CD-Driven Deployment (No Manual Apply)

All deployments are driven by GitHub Actions workflows and environment secrets—**no manual Terraform applies or direct script runs are necessary or allowed**. CI/CD workflows manage staging and promotion to production in a controlled, reviewable, and auditable way.

#### GitHub Actions Pipeline

- **Create a PR to main** to view the Terraform plan for both `staging` and `production` environments
- **Push to `main`** ⇒
    - Build & bundle worker
    - Deploys to staging, runs DB migration
    - If successful, **promotes _the same build_ to production** (after approval)
- **Per-environment secrets** injected via GitHub Environments (`staging` / `production`)
- **Automated Drizzle DB migrations** after Terraform apply in both environments

#### Directory structure (highlights):

```
.github/workflows/
  ├── deploy-staging.yaml
  ├── deploy-production.yaml
environments/
  ├── staging/
  │   └── main.tf
  └── production/
      └── main.tf
src/
  ├── index.ts           # Router entrypoint
  ├── handlers.ts        # /login, /callback, /ask logic
  ├── factories/
  └── db/
drizzle/
  └── ...                # DB migration history
```

---

## OAuth Setup & Auth Flow

**After your first successful deployment, you must configure each environment’s GitHub OAuth App settings as follows:**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select the OAuth App for `staging` or `production` (create new if not present)
3. **Set the “Authorization callback URL” to your deployed Worker’s URL** followed by `/callback`. For example:
   - For staging: `https://qa-worker-staging.YOUR_SUBDOMAIN.workers.dev/callback`
   - For production: `https://qa-worker-production.YOUR_SUBDOMAIN.workers.dev/callback`
4. Copy the relevant Worker URL from your deployment’s output
5. Save changes in the GitHub OAuth app settings before attempting the login flow for that environment

---

### Auth Flow Summary

1. `GET /login` — redirects user to environment-specific GitHub OAuth App
2. Callback: Environment-specific worker handles `/callback?code=...`, issues a JWT (signed with environment's unique secret)
3. User sends future requests with `Authorization: Bearer <token>`
4. Worker verifies JWT signature and expiration with its own secret (cross-environment tokens **never** validate)

**Critical security principle:** _Tokens, secrets, and OAuth credentials **never cross** between staging and production._ Each environment is isolated by design.

---

## Observability

- **Analytics**: Every `/ask` is logged to Cloudflare Analytics Engine
- **Rate Limiting**: Enforced by binding—5 questions per 60s per user
- **Error Logging**: All exceptions and auth errors printed to logs
- **DB Auditing**: Every question+answer is persisted to durable D1 table

---

## Security & Tradeoffs

- **Zero hardcoded secrets** — Everything is secret_text binding
- **No manual deployments** — All provisioning is CI/CD pipeline enforced
- **Staged deploys** — Prevent surface area increase before validation
- **Manual prod approvals** — Guardrails against accidental push-to-prod
- **Environment separation** — Isolated DB, analytics, limits, tokens
- **All-infra-as-code** — No manual setup, full reproducibility, versioned history

---

## Schema

`qa_history` table:

| Field      | Type    | Notes                              |
|------------|---------|------------------------------------|
| id         | int     | PK, autoincrement                  |
| question   | text    | User's submitted question          |
| answer     | text    | AI-provided answer                 |
| created_at | text    | Timestamp (default: current time)  |
| username   | text    | GitHub username                    |
| sub        | text    | GitHub userId (username can be modified, so we need a unique identifier for rate limiting) |

---

## Lessons & Design Choices

- **CI/CD separation with approvals** ensures buggy code never hits production without human review.
- **Stateful D1 DB** enables durable history and auditability across envs.
- **Analytics logging** gives admin observability and incident response.
- **Modular Terraform** lets you compose, duplicate, and scale infra quickly (even faster using sensible modules).
- **Hard JWT env split** offers zero risk of staging/production confusion or lateral movement in the event of a breach.

---

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 (DB) Docs](https://developers.cloudflare.com/d1/)
- [Terraform Cloudflare Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)

---
