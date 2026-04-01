# GitHub Actions Workflows

This directory contains GitHub Actions workflows for database migrations.

## Workflows

### `drizzle-migrate.yml`
Runs Drizzle migrations when migration files or schema changes are pushed to main/master.

**Triggers:**
- Push to main/master with changes to:
  - `frontend/drizzle/**`
  - `frontend/db/schema.ts`
  - `frontend/drizzle.config.ts`
- Manual trigger via GitHub Actions UI

**Required Secrets:**
- `DATABASE_URL` - PostgreSQL connection string

## Setup Instructions

### Configure GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add:

- **DATABASE_URL**: Your PostgreSQL connection string
  ```
  postgresql://user:password@host:port/database?sslmode=require
  ```

### Integration with Vercel

Since Vercel is already set up, you can either:

1. **Use this GitHub Action** (recommended): Migrations run automatically when you push changes
2. **Use Vercel's Build Command**: Set in Vercel Dashboard → Project Settings → Build & Development Settings:
   ```bash
   cd frontend && npm run db:migrate && npm run build
   ```
   Ensure `DATABASE_URL` is set in Vercel Environment Variables

## Running Migrations Locally

```bash
cd frontend
npm run db:migrate
```

## Generating New Migrations

After changing the schema:

```bash
cd frontend
npm run db:generate
# Review the generated migration files in frontend/drizzle/
# Commit and push to trigger the migration workflow
```

